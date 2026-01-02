---
public: true
title: PostgreSQL 쿼리 성능 튜닝 완벽 가이드
date: '2026-01-02'
category: Database
tags: [PostgreSQL, Performance, EXPLAIN, Index, Query Optimization]
excerpt: "EXPLAIN ANALYZE를 활용한 쿼리 분석과 인덱스 전략으로 PostgreSQL 성능을 극대화하는 방법을 알아봅니다."
---
# PostgreSQL 쿼리 성능 튜닝 완벽 가이드

## 개요

PostgreSQL의 쿼리 성능 튜닝은 **EXPLAIN ANALYZE를 통한 문제 진단**과 **적절한 인덱스 설계**가 핵심입니다. 이 가이드에서는 실전에서 바로 적용할 수 있는 튜닝 전략을 다룹니다.

## EXPLAIN ANALYZE 기초

### 기본 사용법

```sql
-- 기본 실행 계획
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- 실제 실행 통계 포함 (권장)
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- 상세 정보 포함
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM users WHERE email = 'test@example.com';
```

### 출력 해석

```
Seq Scan on users  (cost=0.00..1520.00 rows=1 width=256) (actual time=12.345..45.678 rows=1 loops=1)
  Filter: (email = 'test@example.com'::text)
  Rows Removed by Filter: 49999
  Buffers: shared hit=520 read=200
Planning Time: 0.150 ms
Execution Time: 45.720 ms
```

| 항목 | 설명 |
|-----|------|
| `cost` | 예상 비용 (시작..총) |
| `rows` | 예상 반환 행 수 |
| `actual time` | 실제 실행 시간 (ms) |
| `Buffers` | 버퍼 캐시 hit/read 통계 |
| `Rows Removed by Filter` | 필터링으로 제거된 행 수 ⚠️ |

> [!WARNING]
> `Rows Removed by Filter`가 크면 인덱스가 없거나 비효율적인 상태입니다.

### 주요 스캔 타입

| 스캔 타입 | 설명 | 성능 |
|---------|------|-----|
| `Seq Scan` | 전체 테이블 스캔 | 🔴 느림 |
| `Index Scan` | 인덱스 + 테이블 접근 | 🟢 빠름 |
| `Index Only Scan` | 인덱스만으로 해결 | 🟢🟢 가장 빠름 |
| `Bitmap Index Scan` | 여러 조건 병합 | 🟡 조건부 |

## 인덱스 전략

### B-Tree 인덱스 (기본)

```sql
-- 단일 컬럼 인덱스
CREATE INDEX idx_users_email ON users(email);

-- 복합 인덱스 (순서 중요!)
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
```

> [!IMPORTANT]
> 복합 인덱스의 첫 번째 컬럼이 WHERE 조건에 없으면 인덱스를 타지 않습니다.

### 복합 인덱스 설계 원칙

```sql
-- ❌ 잘못된 예: 두 번째 컬럼만 조회
SELECT * FROM orders WHERE created_at > '2025-01-01';  -- idx_orders_user_created 사용 불가

-- ✅ 올바른 예: 첫 번째 컬럼 포함
SELECT * FROM orders WHERE user_id = 123 AND created_at > '2025-01-01';
```

**복합 인덱스 컬럼 순서 가이드라인**:

1. **등호(=) 조건** → 앞쪽
2. **범위(>, <, BETWEEN)** → 뒤쪽
3. **높은 카디널리티** → 앞쪽

### Covering Index (포함 인덱스)

```sql
-- INCLUDE로 추가 컬럼 포함 → Index Only Scan 가능
CREATE INDEX idx_users_email_include ON users(email) INCLUDE (name, created_at);

-- 쿼리
SELECT email, name, created_at FROM users WHERE email = 'test@example.com';
-- → Index Only Scan 발생!
```

### Partial Index (부분 인덱스)

```sql
-- 특정 조건의 행만 인덱싱
CREATE INDEX idx_orders_active ON orders(user_id)
WHERE status = 'PENDING';

-- 활성 주문만 자주 조회할 때 효율적
SELECT * FROM orders WHERE user_id = 123 AND status = 'PENDING';
```

### Expression Index (표현식 인덱스)

```sql
-- 함수 결과에 인덱스 생성
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- 사용
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
```

## 조인 최적화

### 조인 타입 이해

```
EXPLAIN ANALYZE
SELECT u.name, o.total FROM users u
JOIN orders o ON u.id = o.user_id;
```

| 조인 타입 | 설명 | 최적 상황 |
|---------|------|---------|
| `Nested Loop` | 중첩 반복 | 작은 테이블 조인 |
| `Hash Join` | 해시 테이블 생성 | 큰 테이블 등가 조인 |
| `Merge Join` | 정렬 후 병합 | 정렬된 대량 데이터 |

### 조인 순서 힌트

```sql
-- 조인 순서 고정 (드물게 사용)
SET join_collapse_limit = 1;

-- 또는 쿼리에서 순서 지정
SELECT /*+ Leading(users orders) */ ...
```

## 통계 관리

### 통계 업데이트

```sql
-- 테이블 통계 갱신 (필수!)
ANALYZE users;

-- 전체 데이터베이스
ANALYZE;

-- 통계 정보 확인
SELECT 
    tablename,
    n_live_tup,
    n_dead_tup,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables;
```

### 통계 샘플 크기 조정

```sql
-- 특정 컬럼의 통계 정밀도 증가 (기본값: 100)
ALTER TABLE users ALTER COLUMN email SET STATISTICS 1000;
ANALYZE users;
```

## 실전 문제 진단

### 느린 쿼리 찾기

```sql
-- pg_stat_statements 확장 활성화 필요
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time,
    rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 사용되지 않는 인덱스 탐지

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE 'pg_%';
```

### 누락된 인덱스 힌트

```sql
-- 순차 스캔 비율이 높은 테이블
SELECT 
    relname,
    seq_scan,
    idx_scan,
    ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) AS seq_scan_pct
FROM pg_stat_user_tables
WHERE seq_scan + idx_scan > 100
ORDER BY seq_scan_pct DESC;
```

## 성능 설정 튜닝

### 메모리 관련

```sql
-- 정렬/해시 작업에 사용할 메모리 (세션별)
SET work_mem = '256MB';

-- shared_buffers (postgresql.conf, RAM의 25%)
shared_buffers = '4GB'

-- 효과적인 캐시 크기 (쿼리 플래너 힌트)
effective_cache_size = '12GB'
```

### 플래너 관련

```sql
-- 순차 스캔 비용 조정 (SSD는 낮게)
SET random_page_cost = 1.1;  -- 기본값 4.0

-- 병렬 쿼리 활성화
SET max_parallel_workers_per_gather = 4;
```

## 모범 사례 체크리스트

1. ✅ **정기적으로 ANALYZE 실행** - autovacuum 설정 확인
2. ✅ **복합 인덱스 컬럼 순서** - 등호 조건 → 범위 조건
3. ✅ **Covering Index 활용** - Index Only Scan 유도
4. ✅ **Partial Index** - 자주 조회하는 서브셋에 적용
5. ✅ **pg_stat_statements 활용** - 느린 쿼리 모니터링
6. ✅ **사용하지 않는 인덱스 제거** - 쓰기 성능 저하 방지

## 참고 자료

- [PostgreSQL EXPLAIN 공식 문서](https://www.postgresql.org/docs/current/sql-explain.html)
- [Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
