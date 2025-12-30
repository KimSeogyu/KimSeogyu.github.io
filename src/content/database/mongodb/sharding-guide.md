---
public: true
title: MongoDB 샤딩(Sharding) 완벽 가이드
date: '2025-12-30'
category: Database
tags: [MongoDB, Sharding, Distributed Systems, Database]
excerpt: "MongoDB 샤딩의 개념부터 샤드 키 선택, 클러스터 구성까지 실전 가이드를 제공합니다."
---
# MongoDB 샤딩(Sharding) 완벽 가이드

## 샤딩이란?

**샤딩**은 대용량 데이터를 여러 서버에 분산 저장하는 수평 확장(Horizontal Scaling) 방식입니다. MongoDB는 자동 샤딩을 지원하여 데이터가 증가해도 성능을 유지할 수 있습니다.

## 샤딩 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Application                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                       mongos                             │
│                   (Query Router)                         │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Shard 1     │   │   Shard 2     │   │   Shard 3     │
│  (Replica Set)│   │  (Replica Set)│   │  (Replica Set)│
└───────────────┘   └───────────────┘   └───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Config Servers (Replica Set)                │
│                  (메타데이터 저장)                        │
└─────────────────────────────────────────────────────────┘
```

### 구성 요소

| 구성 요소 | 역할 |
|---------|------|
| **mongos** | 클라이언트 요청을 적절한 샤드로 라우팅 |
| **Shard** | 실제 데이터를 저장하는 레플리카 셋 |
| **Config Server** | 클러스터 메타데이터 및 청크 정보 저장 |

## 샤드 키 (Shard Key)

샤드 키는 데이터를 분산하는 기준이 되는 필드입니다. **샤드 키 선택은 성능에 직접적인 영향**을 미칩니다.

### 좋은 샤드 키의 조건

1. **높은 카디널리티**: 다양한 값을 가져야 함
2. **균등한 분포**: 데이터가 골고루 분산되어야 함
3. **쿼리 패턴 부합**: 자주 사용되는 쿼리 조건과 일치

### 샤드 키 예시

```javascript
// 좋은 예: 높은 카디널리티 + 균등 분포
sh.shardCollection("mydb.orders", { orderId: "hashed" })

// 범위 샤딩: 범위 쿼리에 유리
sh.shardCollection("mydb.logs", { timestamp: 1 })

// 복합 샤드 키: 더 세밀한 분산
sh.shardCollection("mydb.users", { country: 1, createdAt: 1 })
```

### 샤드 키 전략

| 전략 | 장점 | 단점 | 적합한 경우 |
|-----|------|------|-----------|
| **Hashed** | 균등 분산 | 범위 쿼리 비효율 | 랜덤 액세스 |
| **Ranged** | 범위 쿼리 효율적 | 핫스팟 위험 | 시계열 데이터 |
| **Compound** | 유연성 | 설계 복잡 | 복잡한 쿼리 |

## 청크 (Chunk)

데이터는 **청크** 단위로 샤드에 분산됩니다.

```javascript
// 청크 크기 확인
use config
db.settings.find({ _id: "chunksize" })

// 청크 크기 변경 (MB 단위, 기본 128MB)
db.settings.updateOne(
  { _id: "chunksize" },
  { $set: { value: 64 } },
  { upsert: true }
)
```

### 청크 밸런싱

MongoDB는 **밸런서**를 통해 청크를 자동으로 균형 분배합니다:

```javascript
// 밸런서 상태 확인
sh.getBalancerState()

// 밸런서 활성화/비활성화
sh.startBalancer()
sh.stopBalancer()

// 특정 시간대에만 밸런싱
db.settings.updateOne(
  { _id: "balancer" },
  { $set: { activeWindow: { start: "02:00", stop: "06:00" } } }
)
```

## 샤딩 클러스터 구성

### 1. Config Server 설정

```yaml
# config-server.conf
sharding:
  clusterRole: configsvr
replication:
  replSetName: configReplSet
net:
  port: 27019
```

### 2. Shard 설정

```yaml
# shard.conf
sharding:
  clusterRole: shardsvr
replication:
  replSetName: shard1ReplSet
net:
  port: 27018
```

### 3. mongos 설정

```yaml
# mongos.conf
sharding:
  configDB: configReplSet/config1:27019,config2:27019,config3:27019
net:
  port: 27017
```

### 4. 샤드 추가

```javascript
// mongos에 접속하여 샤드 추가
sh.addShard("shard1ReplSet/shard1-1:27018,shard1-2:27018")
sh.addShard("shard2ReplSet/shard2-1:27018,shard2-2:27018")

// 샤딩 활성화
sh.enableSharding("mydb")

// 컬렉션 샤딩
sh.shardCollection("mydb.orders", { customerId: "hashed" })
```

## 쿼리 라우팅

### Targeted Query (효율적)

샤드 키를 포함한 쿼리는 특정 샤드로만 전달됩니다:

```javascript
// customerId가 샤드 키일 때 - 특정 샤드만 조회
db.orders.find({ customerId: "user123" })
```

### Scatter-Gather Query (비효율적)

샤드 키가 없으면 모든 샤드에 쿼리 전송:

```javascript
// 모든 샤드에 쿼리 전송 후 결과 병합
db.orders.find({ status: "pending" })
```

## 모니터링

```javascript
// 샤딩 상태 확인
sh.status()

// 각 샤드별 데이터 분포
db.orders.getShardDistribution()

// 청크 정보
use config
db.chunks.find({ ns: "mydb.orders" }).pretty()
```

## 주의사항

1. **샤드 키는 변경 불가**: 설계 단계에서 신중히 선택
2. **샤드 키 값은 불변**: 한번 설정된 문서의 샤드 키 변경 불가
3. **트랜잭션 제한**: 다중 샤드 트랜잭션은 성능 저하 가능
4. **인덱스 필수**: 샤드 키에는 반드시 인덱스 존재해야 함

## 참고 자료

- [MongoDB Sharding 공식 문서](https://www.mongodb.com/docs/manual/sharding/)
- [샤드 키 선택 가이드](https://www.mongodb.com/docs/manual/core/sharding-choose-a-shard-key/)
