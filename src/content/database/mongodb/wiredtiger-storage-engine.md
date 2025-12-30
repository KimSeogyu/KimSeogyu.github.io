---
public: true
title: MongoDB WiredTiger 스토리지 엔진 이해하기
date: '2025-12-30'
category: Database
tags: [MongoDB, WiredTiger, Database, Storage Engine]
excerpt: "MongoDB의 기본 스토리지 엔진인 WiredTiger의 아키텍처, 캐시, 체크포인트, Lock-Free 알고리즘까지 깊이 있게 알아봅니다."
---
# MongoDB WiredTiger 스토리지 엔진 이해하기

## 개요

**WiredTiger**는 MongoDB 3.2부터 기본 스토리지 엔진으로 채택된 고성능 스토리지 엔진입니다. 문서 수준 동시성 제어와 압축을 지원하며, 대부분의 워크로드에서 뛰어난 성능을 제공합니다.

## 핵심 아키텍처

### 문서 수준 잠금 (Document-Level Locking)

WiredTiger의 가장 큰 장점은 **문서 수준의 동시성 제어**입니다.

| 스토리지 엔진 | 잠금 수준 | 동시성 |
|-------------|---------|-------|
| MMAPv1 (레거시) | 컬렉션 수준 | 낮음 |
| WiredTiger | 문서 수준 | 높음 |

```javascript
// 서로 다른 문서에 대한 동시 쓰기가 병렬로 처리됨
db.users.updateOne({ _id: 1 }, { $set: { name: "Alice" } })
db.users.updateOne({ _id: 2 }, { $set: { name: "Bob" } })  // 블로킹 없음
```

### MVCC (Multi-Version Concurrency Control)

WiredTiger는 **MVCC**를 사용하여 읽기와 쓰기 작업이 서로를 차단하지 않습니다.

- 읽기 작업: 시작 시점의 스냅샷을 참조
- 쓰기 작업: 새 버전 생성
- 충돌 시: 자동 재시도 메커니즘

---

## 데이터 적용 순서

MongoDB에서 데이터가 저장되는 순서를 이해하는 것이 중요합니다:

```
1. WAL (Write-Ahead Log) 기록
2. Data Memory 적용 (공유 캐시)
3. OpLog 기록 (Replica Set용)
4. Disk Flush (체크포인트)
```

이 순서 덕분에 장애 시에도 WAL을 통해 데이터를 복구할 수 있습니다.

---

## 공유 캐시 (Shared Cache)

WiredTiger의 공유 캐시는 MySQL의 Buffer Pool과 유사한 역할을 합니다.

### MySQL Buffer Pool과의 차이

| 특성 | MySQL Buffer Pool | WiredTiger Cache |
|-----|-------------------|------------------|
| 캐싱 방식 | B-Tree 상의 주소 사용 | 메모리 주소로 변환하여 적재 |
| 캐싱 속도 | 빠름 | 상대적으로 느림 (변환 과정) |
| 읽기 성능 | 보통 | 캐싱 후 더 빠름 |

WiredTiger는 데이터를 메모리에 적합한 트리 형태로 **재구성**하여 적재합니다. 이 변환 과정으로 인해 초기 캐싱은 느릴 수 있지만, 일단 캐싱되면 RDB보다 빠른 읽기 성능을 제공합니다.

### 캐시 설정

```yaml
# mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 4  # 권장: (RAM - 1GB) / 2
```

**기본 캐시 크기 계산:**

- (RAM - 1GB) × 50%
- 또는 256MB 중 큰 값

---

## Lock-Free 알고리즘

WiredTiger는 높은 동시성을 위해 **Lock-Free 알고리즘**을 사용합니다.

### Hazard Pointer

- 현재 데이터를 참조하고 있는 메모리 주소를 Hazard Pointer에 등록
- 캐시에서 제거(Eviction) 시 Hazard Pointer에 등록된 데이터는 보호
- Disk Flush 여부도 Hazard Pointer를 통해 결정

### Skip List

- Undo Log를 Skip List로 관리
- 레코드 변경 시 이전 버전을 Skip List에 추가
- MVCC 구현의 핵심 자료구조

---

## Cache Eviction

캐시의 빈 공간을 적절히 유지하여 새 데이터를 적재할 수 있도록 합니다.

### 동작 방식

- **백그라운드 스레드**: 평상시 Eviction 처리
- **포그라운드 스레드**: 백그라운드가 공간 확보 실패 시 직접 수행 (성능 저하 발생)

### 튜닝 파라미터

| 파라미터 | 설명 | 기본값 |
|---------|------|-------|
| `threads_max` | Eviction 스레드 최대 개수 | 4 (1~20) |
| `threads_min` | Eviction 스레드 최소 개수 | 1 (1~20) |
| `eviction_dirty_target` | 더티 페이지 비율 유지 목표 | 5% |
| `eviction_target` | 전체 캐시 사용률 목표 | 80% |

```yaml
# 고급 Eviction 설정
storage:
  wiredTiger:
    engineConfig:
      eviction:
        threads_max: 8
        threads_min: 4
```

> **주의**: Eviction이 포그라운드에서 실행되면 쓰기 성능이 급격히 저하됩니다. `cache eviction` 관련 지표를 모니터링하세요.

---

## 데이터 압축

WiredTiger는 두 수준의 압축을 지원합니다:

### 컬렉션 데이터 압축

```javascript
// 컬렉션 생성 시 압축 알고리즘 지정
db.createCollection("logs", {
  storageEngine: {
    wiredTiger: {
      configString: "block_compressor=zstd"
    }
  }
})
```

| 알고리즘 | 압축률 | 속도 | 용도 |
|---------|-------|-----|------|
| `snappy` (기본) | 보통 | 빠름 | 범용 |
| `zlib` | 높음 | 느림 | 아카이브 |
| `zstd` | 높음 | 빠름 | **권장** (4.2+) |
| `none` | - | - | 실시간 처리 |

> **zstd 권장 이유**: 무손실 압축이면서 압축/해제 속도가 준수함

### 인덱스 프리픽스 압축

인덱스는 기본적으로 **프리픽스 압축**이 적용됩니다:

```javascript
// 인덱스 압축 비활성화 예시
db.collection.createIndex(
  { field: 1 },
  { storageEngine: { wiredTiger: { configString: "prefix_compression=false" } } }
)
```

---

## 체크포인트 (Checkpoint)

체크포인트는 **데이터 파일과 트랜잭션 로그가 동기화되는 시점**입니다. DB 장애 시 복구 시점을 결정하는 기준이 됩니다.

### Sharp Checkpoint

MongoDB는 **Sharp Checkpoint** 방식을 사용합니다:

- 체크포인트 실행 시점에 더티 페이지를 **한 번에 모아서** 디스크에 내려씀
- Fuzzy Checkpoint(점진적 방식)와 대비되는 개념

### 체크포인트 트리거

기본적으로 다음 조건에서 체크포인트가 발생합니다:

- **60초** 경과
- **2GB** 저널 데이터 누적

### 체크포인트 옵션

| 옵션 | 설명 | 기본값 |
|-----|------|-------|
| `log_size` | 이 크기만큼 트랜잭션 로그 쓰면 체크포인트 실행 | 0 (자동) |
| `wait` | 주기적 체크포인트 간격 (초) | 0 (자동) |

```yaml
# mongod.conf
storage:
  wiredTiger:
    engineConfig:
      checkpointSizeMB: 1024
```

---

## 저널링 (Journaling)

Write-Ahead Logging(WAL)으로 데이터 내구성을 보장합니다.

- Journal Log는 데이터 디렉토리 하위 `journal/` 폴더에 저장
- 장애 발생 시 Journal Log를 사용해 데이터 복구

```yaml
storage:
  journal:
    enabled: true
    commitIntervalMs: 100  # 기본값
```

---

## 성능 튜닝

### 프로덕션 권장 설정

```yaml
# mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 8
      journalCompressor: snappy
    collectionConfig:
      blockCompressor: zstd
    indexConfig:
      prefixCompressionEnabled: true
```

### 모니터링 명령어

```javascript
// WiredTiger 전체 통계
db.serverStatus().wiredTiger

// 캐시 상태
db.serverStatus().wiredTiger.cache

// 컬렉션별 통계
db.collection.stats().wiredTiger
```

---

## 주의사항

1. **캐시 크기**: 시스템 RAM의 50% 이하 권장
2. **압축**: CPU 오버헤드와 저장 공간 트레이드오프 고려
3. **저널링**: 비활성화 시 데이터 손실 위험
4. **Eviction 모니터링**: 포그라운드 Eviction 발생 시 성능 저하
5. **체크포인트**: Sharp Checkpoint로 인한 일시적 I/O 스파이크 고려

## 참고 자료

- [MongoDB WiredTiger 공식 문서](https://www.mongodb.com/docs/manual/core/wiredtiger/)
- [WiredTiger GitHub](https://github.com/wiredtiger/wiredtiger)
- [MongoDB 총 정리 (liltdevs)](https://liltdevs.tistory.com/216)
