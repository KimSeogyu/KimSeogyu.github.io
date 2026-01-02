---
public: true
title: 대량 데이터 처리 시 Upsert 패턴 활용법
date: '2025-12-27'
category: Database
tags: [Database, MySQL, Performance, PostgreSQL]
excerpt: >-
  대량 데이터 인덱싱 작업에서 INSERT와 Upsert 패턴을 비교하고, 효율적인 배치 처리 방법을 알아봅니다.
---
# 대량 데이터 처리 시 Upsert 패턴 활용법

## Upsert란?

Upsert는 "Update + Insert"의 합성어로, 레코드가 존재하면 업데이트하고 없으면 삽입하는 원자적 연산입니다.

### DB별 Upsert 문법

**PostgreSQL**

```sql
INSERT INTO users (id, name, email)
VALUES (1, 'Kim', 'kim@example.com')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;
```

**MySQL**

```sql
INSERT INTO users (id, name, email)
VALUES (1, 'Kim', 'kim@example.com')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email);
```

## 왜 Upsert가 더 효율적인가?

### 기존 방식의 문제점

```sql
-- 비효율적인 방식: SELECT 후 INSERT/UPDATE
SELECT * FROM users WHERE id = 1;
-- 결과에 따라
INSERT INTO users ... -- 또는
UPDATE users SET ... WHERE id = 1;
```

이 방식은:

1. **2번의 쿼리 실행** (SELECT + INSERT/UPDATE)
2. **Race Condition 위험** (SELECT와 INSERT 사이에 다른 트랜잭션이 삽입할 수 있음)
3. **트랜잭션 오버헤드** 증가

### Upsert의 장점

1. **단일 원자적 연산**: DB 엔진이 최적화된 방식으로 처리
2. **Race Condition 방지**: 동시성 문제 해결
3. **네트워크 라운드트립 감소**: 한 번의 쿼리로 처리

## 배치 Upsert 패턴

대량 데이터 처리 시 배치 Upsert가 가장 효율적입니다:

**PostgreSQL 배치 Upsert**

```sql
INSERT INTO transactions (tx_id, amount, status)
VALUES 
  ('tx_001', 100, 'pending'),
  ('tx_002', 200, 'confirmed'),
  ('tx_003', 150, 'pending')
ON CONFLICT (tx_id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  updated_at = NOW();
```

## 주의사항

- **인덱스 필수**: Upsert는 고유 제약 조건(UNIQUE) 또는 PK가 있어야 동작
- **대용량 컬럼**: TEXT/BLOB 등 큰 컬럼이 많으면 UPDATE 비용이 높아질 수 있음
- **트리거 주의**: INSERT/UPDATE 트리거가 모두 실행될 수 있음

## 결론

대량 데이터 인덱싱 작업에서는 **배치 Upsert 패턴**을 사용하면:

- 쿼리 수 감소
- 트랜잭션 오버헤드 감소
- 동시성 문제 해결

로 인해 전체적인 데이터베이스 부하를 크게 줄일 수 있습니다.
