---
public: true
title: "데이터 엔지니어링 시리즈 #10: 데이터 레이크 vs 웨어하우스 - 레이크하우스 아키텍처"
date: '2026-01-02'
category: Data Engineering
series: data-engineering
tags: [Data Architecture, Data Engineering, Delta Lake, Iceberg, Transaction]
excerpt: "데이터 저장소 아키텍처의 종류와 선택 기준을 배웁니다. Delta Lake의 ACID, Time Travel, Schema Evolution을 심층 분석합니다."
---

# 데이터 엔지니어링 시리즈 #10: 데이터 레이크 vs 웨어하우스 - 레이크하우스 아키텍처

> **대상 독자**: 충분한 경험을 가진 백엔드/풀스택 엔지니어로, PostgreSQL ACID에 익숙하지만 데이터 레이크/웨어하우스는 처음인 분

## 이 편에서 다루는 것

"S3에 Parquet 올려두면 되는 거 아닌가요?" 라는 질문에서 시작합니다. **왜 Delta Lake 같은 테이블 포맷이 필요한지**, 그리고 **레이크하우스가 무엇인지** 배웁니다.

---

## 데이터 저장소의 진화

### 세대별 변화

```mermaid
flowchart LR
    subgraph Gen1 ["1세대: 데이터 웨어하우스"]
        DW1["온프레미스<br/>Oracle, Teradata"]
        DW2["구조화된 데이터"]
        DW3["SQL 분석"]
    end
    
    subgraph Gen2 ["2세대: 데이터 레이크"]
        DL1["클라우드 스토리지<br/>S3, GCS"]
        DL2["모든 형태의 데이터"]
        DL3["Spark 처리"]
    end
    
    subgraph Gen3 ["3세대: 레이크하우스"]
        LH1["레이크 위에<br/>웨어하우스 기능"]
        LH2["Delta Lake, Iceberg"]
        LH3["ACID + 유연성"]
    end
    
    Gen1 -->|"확장성 한계"| Gen2 -->|"품질 문제"| Gen3
```

---

## 데이터 웨어하우스 (Data Warehouse)

### 특징

```mermaid
flowchart TB
    subgraph DW ["Data Warehouse"]
        direction TB
        Feature1["✅ 스키마 정의 (Schema-on-Write)"]
        Feature2["✅ ACID 트랜잭션"]
        Feature3["✅ SQL 지원"]
        Feature4["✅ 빠른 쿼리"]
        
        Limit1["❌ 구조화된 데이터만"]
        Limit2["❌ 비용 (저장+컴퓨팅)"]
        Limit3["❌ 벤더 종속"]
    end
    
    Examples["예시:<br/>• Snowflake<br/>• BigQuery<br/>• Redshift"]
```

### PostgreSQL과의 비교

| 특성 | PostgreSQL (OLTP) | BigQuery (DW) |
|------|-------------------|---------------|
| **목적** | 트랜잭션 처리 | 분석 쿼리 |
| **스토리지** | Row-based | Column-based |
| **스케일** | 수직 확장 | 무한 수평 확장 |
| **비용** | 서버 비용 | 쿼리당 비용 |
| **쿼리 속도** | 단건 빠름 | 집계 빠름 |

---

## 데이터 레이크 (Data Lake)

### 특징

```mermaid
flowchart TB
    subgraph DL ["Data Lake"]
        direction TB
        Feature1["✅ 모든 형태의 데이터"]
        Feature2["✅ 저렴한 저장 비용"]
        Feature3["✅ 분리된 저장/컴퓨팅"]
        Feature4["✅ 유연한 처리 (Spark 등)"]
        
        Limit1["❌ ACID 없음"]
        Limit2["❌ 스키마 관리 어려움"]
        Limit3["❌ 데이터 품질 문제"]
    end
    
    Examples["예시:<br/>• S3 + Parquet<br/>• GCS + Avro<br/>• ADLS + JSON"]
```

### 데이터 레이크의 문제점

```mermaid
flowchart TB
    subgraph Problems ["레이크의 고질적 문제"]
        P1["동시 쓰기 충돌"]
        P2["부분 실패 → 깨진 데이터"]
        P3["스키마 변경 → 호환성 문제"]
        P4["삭제/수정 어려움"]
        P5["작은 파일 문제"]
    end
    
    Result["결국... 데이터 늪(Data Swamp)"]
    
    Problems --> Result
```

---

## 레이크하우스 (Lakehouse)

### 두 세계의 통합

```mermaid
flowchart TB
    subgraph Lakehouse ["Lakehouse Architecture"]
        subgraph Top ["웨어하우스 기능"]
            T1["ACID 트랜잭션"]
            T2["스키마 관리"]
            T3["Time Travel"]
            T4["SQL 지원"]
        end
        
        subgraph Middle ["테이블 포맷"]
            M1["Delta Lake"]
            M2["Apache Iceberg"]
            M3["Apache Hudi"]
        end
        
        subgraph Bottom ["오픈 스토리지"]
            B1["S3"]
            B2["GCS"]
            B3["ADLS"]
        end
        
        Top --> Middle --> Bottom
    end
```

### 핵심 가치

| 특성 | 레이크 | 웨어하우스 | 레이크하우스 |
|------|--------|-----------|-------------|
| **저장 비용** | 저렴 ✅ | 비쌈 | 저렴 ✅ |
| **ACID** | ❌ | ✅ | ✅ |
| **오픈 포맷** | ✅ | ❌ (벤더) | ✅ |
| **ML 지원** | ✅ | 제한적 | ✅ |
| **SQL 분석** | 제한적 | ✅ | ✅ |

---

## Delta Lake 심층 분석

### ACID 트랜잭션

```mermaid
flowchart TB
    subgraph WithoutACID ["ACID 없이 (일반 Parquet)"]
        W1["writer 1: 파일 A 쓰기"]
        W2["writer 2: 파일 B 쓰기"]
        W3["동시에 실행"]
        W4["충돌/덮어쓰기 발생 💥"]
        
        W1 --> W3
        W2 --> W3
        W3 --> W4
    end
    
    subgraph WithACID ["Delta Lake (ACID)"]
        D1["writer 1: 트랜잭션 시작"]
        D2["writer 2: 트랜잭션 시작"]
        D3["optimistic concurrency"]
        D4["하나만 커밋 성공<br/>나머지 재시도"]
        
        D1 --> D3
        D2 --> D3
        D3 --> D4
    end
```

**Delta Lake의 방법**: 트랜잭션 로그 (`_delta_log/`)

```
table/
├── _delta_log/
│   ├── 00000000000000000000.json  # 첫 트랜잭션
│   ├── 00000000000000000001.json  # 두 번째
│   └── 00000000000000000002.json  # 세 번째
├── part-00000.parquet
├── part-00001.parquet
└── part-00002.parquet
```

### Time Travel

```mermaid
flowchart LR
    subgraph History ["버전 히스토리"]
        V0["v0: 초기 데이터"]
        V1["v1: 추가"]
        V2["v2: 수정"]
        V3["v3: 삭제 (현재)"]
        
        V0 --> V1 --> V2 --> V3
    end
    
    Query["어떤 버전이든<br/>쿼리 가능!"]
```

```python
# 특정 버전으로 읽기
df = spark.read.format("delta") \
    .option("versionAsOf", 2) \
    .load("/delta/users")

# 특정 시점으로 읽기
df = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-01") \
    .load("/delta/users")

# 히스토리 조회
from delta.tables import DeltaTable

dt = DeltaTable.forPath(spark, "/delta/users")
dt.history().show()
```

### Schema Evolution

```mermaid
flowchart TB
    subgraph Problem ["스키마 변경 문제"]
        P1["기존: id, name, email"]
        P2["새로운: id, name, email, phone"]
        P3["기존 파일은 phone 없음"]
        P4["어떻게 함께 읽지?"]
    end
    
    subgraph Solution ["Delta Lake 해결책"]
        S1["스키마 자동 병합"]
        S2["새 컬럼 NULL 허용"]
        S3["호환성 검사"]
    end
```

```python
# 자동 스키마 병합
df_new.write.format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .save("/delta/users")

# 스키마 덮어쓰기 (주의!)
df_new.write.format("delta") \
    .mode("overwrite") \
    .option("overwriteSchema", "true") \
    .save("/delta/users")
```

### MERGE (Upsert)

```mermaid
flowchart TB
    subgraph Before ["MERGE 전"]
        Source["Source (새 데이터)"]
        Target["Target (기존 테이블)"]
    end
    
    subgraph Logic ["MERGE 로직"]
        Match["ON 조건으로 매칭"]
        WhenMatched["WHEN MATCHED → UPDATE"]
        WhenNotMatched["WHEN NOT MATCHED → INSERT"]
    end
    
    subgraph After ["MERGE 후"]
        Result["통합된 결과"]
    end
    
    Before --> Logic --> After
```

```python
from delta.tables import DeltaTable

# 타겟 테이블
target = DeltaTable.forPath(spark, "/delta/users")

# 소스 데이터 (업데이트할 데이터)
source = spark.read.parquet("/staging/users")

# MERGE 실행
target.alias("t").merge(
    source.alias("s"),
    "t.user_id = s.user_id"
).whenMatchedUpdate(
    set={
        "name": "s.name",
        "email": "s.email",
        "updated_at": "current_timestamp()"
    }
).whenNotMatchedInsert(
    values={
        "user_id": "s.user_id",
        "name": "s.name",
        "email": "s.email",
        "created_at": "current_timestamp()"
    }
).execute()
```

---

## Delta Lake vs Apache Iceberg

### 비교

```mermaid
flowchart TB
    subgraph Delta ["Delta Lake"]
        D1["✅ Databricks 최적화"]
        D2["✅ Spark 통합 우수"]
        D3["✅ 성숙한 생태계"]
        D4["⚠️ Databricks 외 지원 제한적"]
    end
    
    subgraph Iceberg ["Apache Iceberg"]
        I1["✅ 벤더 중립"]
        I2["✅ 다양한 엔진 지원"]
        I3["✅ Hidden Partitioning"]
        I4["⚠️ 상대적으로 신생"]
    end
```

| 특성 | Delta Lake | Apache Iceberg |
|------|-----------|----------------|
| **개발사** | Databricks | Netflix→Apache |
| **Spark 지원** | 최고 | 좋음 |
| **Flink 지원** | 제한적 | 좋음 |
| **Trino 지원** | 좋음 | 좋음 |
| **파티셔닝** | 명시적 | Hidden (투명) |
| **채택율** | 높음 | 증가 중 |

### 선택 가이드

```mermaid
flowchart TB
    Q1{"Databricks<br/>사용?"}
    Q2{"Flink<br/>필요?"}
    Q3{"벤더 중립<br/>중요?"}
    
    Q1 -->|"예"| Delta["Delta Lake"]
    Q1 -->|"아니오"| Q2
    Q2 -->|"예"| Iceberg["Apache Iceberg"]
    Q2 -->|"아니오"| Q3
    Q3 -->|"예"| Iceberg
    Q3 -->|"아니오"| Delta
```

---

## 아키텍처 결정 가이드

### 언제 무엇을 선택하나?

```mermaid
flowchart TB
    subgraph Decision ["결정 트리"]
        D1{"데이터 크기?"}
        D2{"팀 SQL 역량?"}
        D3{"ML 워크로드?"}
        D4{"예산?"}
        
        D1 -->|"< 100GB"| DW["Data Warehouse<br/>(BigQuery, Snowflake)"]
        D1 -->|">= 100GB"| D2
        D2 -->|"SQL 위주"| DW
        D2 -->|"Python/Spark 혼합"| D3
        D3 -->|"ML 중요"| LH["Lakehouse<br/>(Delta Lake)"]
        D3 -->|"분석 위주"| D4
        D4 -->|"비용 민감"| LH
        D4 -->|"관리 편의"| DW
    end
```

---

## 정리

```mermaid
mindmap
  root((데이터<br/>저장소))
    Data Warehouse
      구조화된 데이터
      ACID
      SQL 최적화
      비용 높음
    Data Lake
      모든 데이터
      저렴
      ACID 없음
      품질 문제
    Lakehouse
      레이크 + ACID
      Delta Lake
      Iceberg
      최신 트렌드
    Delta Lake
      트랜잭션 로그
      Time Travel
      Schema Evolution
      MERGE
```

---

## 다음 편 예고

**11편: 데이터 모델링**에서는 분석용 모델링을 다룹니다:

- Star Schema vs Snowflake Schema
- Fact Table vs Dimension Table
- Slowly Changing Dimensions (SCD)

---

## 참고 자료

- [Delta Lake Documentation](https://docs.delta.io/)
- [Apache Iceberg Documentation](https://iceberg.apache.org/docs/latest/)
- Databricks, "The Data Lakehouse" White Paper
- Martin Kleppmann, "Designing Data-Intensive Applications" - Chapter 3
