---
title: "Diesel ORM 실전 활용 - 비동기 DB 처리와 배치 최적화"
date: "2026-01-05"
description: "Rust 인덱서에서 Diesel ORM을 활용한 비동기 DB 처리, 배치 저장, Upsert 패턴을 실제 코드와 함께 설명합니다."
tags: ["blockchain", "indexer", "rust", "diesel", "postgresql", "async"]
series: "blockchain-indexer"
seriesOrder: 5
public: true
---

## 시리즈 목차

1. [블록체인 인덱서란?](/blog/blockchain/indexer/indexer-01-introduction)
2. [인덱서 아키텍처 Deep Dive](/blog/blockchain/indexer/indexer-02-architecture)
3. [이력 테이블 vs 스냅샷 테이블](/blog/blockchain/indexer/indexer-03-database-design)
4. [Rust로 인덱서 SDK 만들기](/blog/blockchain/indexer/indexer-04-rust-sdk)
5. **Diesel ORM 실전 활용** (현재 글)
6. [멱등성 있는 인덱서 핸들러 설계](/blog/blockchain/indexer/indexer-06-idempotency)

---

## 왜 Diesel인가?

Rust 생태계에서 DB 접근 라이브러리를 선택할 때:

| 라이브러리 | 특징 | 인덱서 적합성 |
|-----------|------|--------------|
| **Diesel** | 컴파일 타임 타입 안전, 매크로 기반 | ✅ 대량 처리 최적화 |
| sqlx | 런타임 쿼리 검증, 매크로 옵션 | ⚠️ 복잡한 upsert 어려움 |
| SeaORM | 비동기 우선, ActiveRecord 패턴 | ⚠️ 성능 오버헤드 |

Diesel의 강점:

- **컴파일 타임 검증**: SQL 오류를 런타임이 아닌 빌드 시점에 발견
- **배치 처리 최적화**: `insert_into().values(&vec)` 한 줄로 대량 삽입
- **Upsert 지원**: `ON CONFLICT` 구문을 타입 안전하게 작성

---

## diesel-async 설정

### Cargo.toml

```toml
[dependencies]
diesel = { version = "2.1", features = [
    "postgres",
    "chrono",
    "serde_json",
    "numeric",
] }

diesel-async = { 
    git = "https://github.com/weiznich/diesel_async.git",
    features = [
        "postgres",
        "bb8",
        "async-connection-wrapper",
    ]
}

bb8 = "0.8"
tokio = { version = "1", features = ["full"] }
```

### 커넥션 풀 설정

```rust
use diesel_async::{
    pooled_connection::{bb8::Pool, AsyncDieselConnectionManager},
    AsyncPgConnection,
};

pub async fn create_pool(
    connection_string: &str,
    pool_size: u32,
) -> Result<Pool<AsyncPgConnection>> {
    let config = AsyncDieselConnectionManager::<AsyncPgConnection>::new(
        connection_string
    );
    
    Pool::builder()
        .max_size(pool_size)
        .min_idle(Some(pool_size / 4))
        .build(config)
        .await
        .map_err(|e| anyhow!("Failed to create pool: {}", e))
}
```

---

## PostgreSQL 파라미터 수 제한

### 문제 상황

PostgreSQL wire protocol은 **16비트 정수**로 파라미터 개수를 표현합니다:

```
최대 파라미터 수 = 2^16 - 1 = 65,535
```

10개 컬럼 테이블에 10,000 row를 삽입하면:

```
파라미터 수 = 10 × 10,000 = 100,000 → 제한 초과!
```

### 해결책: 청크 분할

```rust
/// 대량 데이터를 청크로 나누어 병렬 처리
pub async fn execute_in_chunks<T, F, Fut>(
    items: Vec<T>,
    chunk_size: usize,
    executor: F,
) -> Result<()>
where
    T: Send + 'static,
    F: Fn(Vec<T>) -> Fut + Send + Sync + Clone,
    Fut: Future<Output = Result<()>> + Send,
{
    let chunks: Vec<Vec<T>> = items
        .into_iter()
        .collect::<Vec<_>>()
        .chunks(chunk_size)
        .map(|c| c.to_vec())
        .collect();
    
    // 청크별 병렬 실행
    let futures = chunks.into_iter().map(|chunk| {
        let executor = executor.clone();
        async move { executor(chunk).await }
    });
    
    futures::future::try_join_all(futures).await?;
    Ok(())
}
```

### 청크 크기 계산

```rust
/// 안전한 청크 크기 계산
pub fn calculate_chunk_size(column_count: usize) -> usize {
    const MAX_PARAMS: usize = 65_000;  // 여유 마진
    MAX_PARAMS / column_count
}

// 예시: 10개 컬럼 테이블
let chunk_size = calculate_chunk_size(10);  // = 6,500
```

---

## Upsert 패턴 (ON CONFLICT)

### 기본 Upsert

```rust
use diesel::prelude::*;
use diesel::upsert::excluded;

pub async fn upsert_nft_owners(
    conn: &mut AsyncPgConnection,
    items: Vec<NftOwnerRow>,
) -> Result<()> {
    use crate::schema::current_nft_owners::dsl::*;
    
    diesel::insert_into(current_nft_owners)
        .values(&items)
        .on_conflict(nft_id)
        .do_update()
        .set((
            owner_address.eq(excluded(owner_address)),
            last_transaction_version.eq(excluded(last_transaction_version)),
            updated_at.eq(excluded(updated_at)),
        ))
        .execute(conn)
        .await?;
    
    Ok(())
}
```

### 조건부 Upsert (버전 체크)

**더 오래된 버전이 덮어쓰지 않도록** 보호:

```rust
pub async fn upsert_with_version_check(
    conn: &mut AsyncPgConnection,
    items: Vec<NftOwnerRow>,
) -> Result<()> {
    use crate::schema::current_nft_owners::dsl::*;
    
    diesel::insert_into(current_nft_owners)
        .values(&items)
        .on_conflict(nft_id)
        .do_update()
        .set((
            owner_address.eq(excluded(owner_address)),
            last_transaction_version.eq(excluded(last_transaction_version)),
            updated_at.eq(excluded(updated_at)),
        ))
        // 핵심: 새 버전이 더 클 때만 업데이트
        .filter(last_transaction_version.lt(excluded(last_transaction_version)))
        .execute(conn)
        .await?;
    
    Ok(())
}
```

---

## 이력 + 스냅샷 동시 저장

3편에서 설명한 이중 테이블 패턴을 Diesel로 구현:

```rust
pub async fn store_transfers(
    conn: &mut AsyncPgConnection,
    transfers: Vec<TransferEvent>,
) -> Result<()> {
    // 도메인 이벤트 → DB 모델 변환
    let history_rows: Vec<TransferHistoryRow> = transfers
        .iter()
        .map(TransferHistoryRow::from)
        .collect();
    
    let current_rows: Vec<CurrentOwnerRow> = transfers
        .iter()
        .map(CurrentOwnerRow::from)
        .collect();
    
    // 트랜잭션 내에서 두 테이블 동시 갱신
    conn.transaction::<_, diesel::result::Error, _>(|conn| async move {
        // 1. 이력 테이블: INSERT
        diesel::insert_into(transfer_history::table)
            .values(&history_rows)
            .execute(conn)
            .await?;
        
        // 2. 스냅샷 테이블: UPSERT
        diesel::insert_into(current_owners::table)
            .values(&current_rows)
            .on_conflict(current_owners::nft_id)
            .do_update()
            .set((
                current_owners::owner_address
                    .eq(excluded(current_owners::owner_address)),
                current_owners::last_version
                    .eq(excluded(current_owners::last_version)),
            ))
            .filter(current_owners::last_version
                .lt(excluded(current_owners::last_version)))
            .execute(conn)
            .await?;
        
        Ok(())
    }.scope_boxed()).await?;
    
    Ok(())
}
```

---

## 배치 저장 통합 예시

모든 패턴을 통합한 실제 저장 로직:

```rust
impl NftTransferHandler {
    pub async fn store(&self, changes: Vec<TransferEvent>) -> Result<()> {
        if changes.is_empty() {
            return Ok(());
        }
        
        // 청크 크기 계산 (TransferHistoryRow가 8컬럼이라고 가정)
        let chunk_size = calculate_chunk_size(8);
        
        execute_in_chunks(changes, chunk_size, |chunk| {
            let pool = self.db_pool.clone();
            async move {
                let mut conn = pool.get().await?;
                store_transfers(&mut conn, chunk).await
            }
        }).await
    }
}
```

---

## 커넥션 풀 최적화

### 권장 설정

```rust
let pool = Pool::builder()
    // 최대 연결 수: CPU 코어 × 2~4
    .max_size(num_cpus::get() as u32 * 2)
    
    // 최소 유휴 연결: 워밍업 시간 단축
    .min_idle(Some(4))
    
    // 연결 획득 타임아웃
    .connection_timeout(Duration::from_secs(30))
    
    // 유휴 연결 타임아웃
    .idle_timeout(Some(Duration::from_secs(600)))
    
    .build(config)
    .await?;
```

### 연결 풀 사이징 공식

```
최적 풀 크기 ≈ (코어 수 × 2) + 디스크 스핀들 수

예시: 8코어 + NVMe SSD
→ (8 × 2) + 1 = 17 connections
```

---

## 정리

- **diesel-async**: Diesel + Tokio 비동기 조합
- **청크 분할**: 65,535 파라미터 제한 우회
- **조건부 Upsert**: 버전 역전 방지
- **이중 테이블 저장**: 트랜잭션 내 원자적 갱신
- **커넥션 풀**: 적절한 사이징으로 성능 최적화

---

## 다음 편 예고

**[6편: 멱등성 있는 인덱서 핸들러 설계 - 재처리 안전성 확보](/blog/blockchain/indexer/indexer-06-idempotency)**

- 멱등성(Idempotency)이란?
- 왜 인덱서에서 중요한가?
- 멱등 쿼리 작성법
- 복구(Restore) API 설계
