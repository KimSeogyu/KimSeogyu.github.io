---
public: true
title: Redis 기반 분산 락 가이드
date: '2025-12-27'
category: Database
tags: [Concurrency, Database, Distributed Systems, Redis]
excerpt: "분산 시스템에서 Redis를 활용한 분산 락 구현 방법과 Redlock 알고리즘을 알아봅니다."
---
# Redis 기반 분산 락 가이드

## 개요

분산 시스템에서 여러 노드나 프로세스가 공유 자원에 동시에 접근하는 것을 제어하기 위해 **분산 락(Distributed Lock)**이 필요합니다. Redis는 빠르고 간단한 방식으로 분산 락을 구현할 수 있는 인메모리 저장소로 자주 사용됩니다.

## 기본 개념

- **분산 락**은 여러 프로세스 간 자원 접근을 조율하는 도구
- Redis는 단일 키의 원자적 조작이 가능하므로 분산 락에 적합
- 락은 일정 시간 동안만 유효해야 하며, 적절한 TTL 설정이 중요

---

## 기본 구현 방식 (SET NX PX)

### 락 획득

```bash
SET lock_key unique_value NX PX 3000
```

| 옵션 | 설명 |
|-----|------|
| `NX` | 키가 존재하지 않을 때만 설정 |
| `PX 3000` | TTL을 3초(3000ms)로 설정 |
| `unique_value` | 락 주체를 식별하기 위한 UUID |

### 락 해제 (Lua 스크립트)

```lua
-- 자신이 획득한 락만 해제
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
```

> GET과 DEL을 **원자적**으로 처리하여 다른 프로세스의 락을 실수로 해제하는 것을 방지합니다.

### 주의사항

- 반드시 TTL(만료 시간)을 설정할 것
- 락을 획득한 주체만 해제할 것
- Redis 장애 시 락 상태 유실 가능

---

## Redlock 알고리즘 (고가용성)

**Redlock**은 Redis 창시자 Salvatore Sanfilippo가 제안한 고가용성 분산 락 알고리즘입니다.

### 동작 원리

1. 현재 시간을 기록
2. N개의 Redis 인스턴스에 동시에 락 요청 (`SET NX PX`)
3. 과반수(N/2 + 1) 이상 성공 시 락 획득
4. 전체 소요 시간 < TTL일 경우에만 유효
5. 실패 시 모든 인스턴스에 락 해제

### 장단점

| 장점 | 단점 |
|-----|------|
| 단일 노드 장애에 강함 | 구현이 복잡함 |
| 락 일관성 유지 | 네트워크 지연에 민감 |
| | 완전한 안전성 보장 불가 (논쟁 있음) |

---

## 사용 권장/비권장

### ✅ 추천 사용처

- 크론잡 중복 실행 방지
- 공유 리소스 접근 제어
- 분산 환경 사전 동기화

### ❌ 비권장 사용처

- 강력한 트랜잭션이 필요한 금융 거래
- 네트워크/시계 오류에 민감한 시스템

---

## 참고 자료

- [Redis 공식 문서: Distributed Locks](https://redis.io/docs/manual/patterns/distributed-locks/)
- [Redlock Algorithm](https://redis.io/docs/interact/locking/)
- [Martin Kleppmann의 Redlock 비판](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
