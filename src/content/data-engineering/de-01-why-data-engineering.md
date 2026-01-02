---
public: true
title: "데이터 엔지니어링 시리즈 #1: 백엔드 개발자가 데이터 엔지니어링을 배워야 하는 이유"
date: '2026-01-02'
category: Data Engineering
tags: [Data Engineering, OLTP, OLAP, ETL, Data Pipeline, Backend]
excerpt: "왜 백엔드 개발자가 데이터 엔지니어링을 알아야 할까요? OLTP의 한계에서 시작하는 데이터 파이프라인의 세계로 안내합니다."
---

# 데이터 엔지니어링 시리즈 #1: 백엔드 개발자가 데이터 엔지니어링을 배워야 하는 이유

> **대상 독자**: 6년 이상의 경험을 가진 백엔드/풀스택 엔지니어로, Spark, Airflow 등 데이터 엔지니어링 기술에 처음 접근하는 분

## 시리즈 소개

| # | 주제 | 익숙한 개념과의 연결 |
|---|------|---------------------|
| **1** | 왜 데이터 엔지니어링인가 | 슬로우 쿼리, DB 부하 |
| 2 | 데이터 아키텍처 101 | 마이크로서비스 아키텍처 |
| 3 | Spark 핵심 개념 | Goroutine, ThreadPoolExecutor |
| 4 | Spark 내부 동작 | Task Queue, Worker Pool |
| 5 | PySpark 실전 | ORM, Query Optimization |
| 6 | Airflow 핵심 개념 | CI/CD Pipeline, cron |
| 7 | Airflow 실전 | GitHub Actions, ArgoCD |
| 8 | Kafka 핵심 | Redis Streams |
| 9 | Spark Streaming | Event-Driven Architecture |
| 10 | 레이크하우스 | PostgreSQL ACID |
| 11 | 데이터 모델링 | ERD, 정규화 |
| 12 | 데이터 품질 | 테스트 자동화, 모니터링 |

---

## 새벽 3시의 슬로우 쿼리

어느 날 새벽, 당신에게 알림이 옵니다.

> "프로덕션 DB CPU 100%, 응답 시간 30초 초과"

원인을 찾아보니, 마케팅팀이 요청한 대시보드 쿼리였습니다:

```sql
SELECT 
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS user_count,
    AVG(lifetime_value) AS avg_ltv,
    SUM(purchase_amount) AS total_revenue
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE created_at >= '2024-01-01'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

이 쿼리 하나가 프로덕션 서비스를 마비시켰습니다. **왜일까요?**

---

## OLTP의 한계: 설계 목적이 다르다

우리가 익숙한 PostgreSQL, MySQL 같은 데이터베이스는 **OLTP(Online Transaction Processing)**에 최적화되어 있습니다.

```mermaid
flowchart LR
    subgraph OLTP ["OLTP (트랜잭션 처리)"]
        direction TB
        A1["✅ 빠른 단건 조회<br/>SELECT * FROM users WHERE id = 123"]
        A2["✅ 빠른 삽입/수정<br/>INSERT, UPDATE"]
        A3["✅ ACID 보장"]
    end
    
    subgraph OLAP ["OLAP (분석 처리)"]
        direction TB
        B1["✅ 대량 데이터 집계<br/>GROUP BY, SUM, AVG"]
        B2["✅ 복잡한 조인"]
        B3["✅ 긴 쿼리 허용"]
    end
    
    OLTP -.->|"이걸로 분석하면?"| Problem["❌ 슬로우 쿼리<br/>❌ 락 경쟁<br/>❌ 서비스 장애"]
```

### OLTP vs OLAP: 근본적 차이

| 특성 | OLTP | OLAP |
|------|------|------|
| **목적** | 트랜잭션 처리 | 분석/리포팅 |
| **쿼리 패턴** | 단건 조회/수정 | 대량 집계 |
| **데이터 저장** | Row-based | Column-based |
| **인덱스** | B-Tree (특정 행 찾기) | 컬럼 스캔에 최적화 |
| **동시성** | 높은 동시성, 짧은 트랜잭션 | 낮은 동시성, 긴 쿼리 |
| **예시 DB** | PostgreSQL, MySQL | BigQuery, Snowflake |

### Row-based vs Column-based 저장

```mermaid
flowchart TB
    subgraph RowBased ["Row-Based Storage (PostgreSQL)"]
        direction TB
        R1["Row 1: id=1, name='Kim', age=30, city='Seoul'"]
        R2["Row 2: id=2, name='Lee', age=25, city='Busan'"]
        R3["Row 3: id=3, name='Park', age=35, city='Seoul'"]
    end
    
    subgraph ColBased ["Column-Based Storage (BigQuery)"]
        direction TB
        C1["id: [1, 2, 3]"]
        C2["name: ['Kim', 'Lee', 'Park']"]
        C3["age: [30, 25, 35]"]
        C4["city: ['Seoul', 'Busan', 'Seoul']"]
    end
    
    Query["SELECT AVG(age) FROM users"]
    
    RowBased -->|"전체 행 스캔 필요"| Slow["🐢 느림"]
    ColBased -->|"age 컬럼만 읽음"| Fast["🚀 빠름"]
```

**핵심 인사이트**: OLTP 데이터베이스로 분석 쿼리를 돌리는 것은, 스포츠카로 이사짐을 나르는 것과 같습니다. 가능은 하지만, 적합한 도구가 아닙니다.

---

## 데이터 파이프라인의 등장

그렇다면 어떻게 해야 할까요? **데이터를 분석에 적합한 형태로 복사해 두는 것**입니다.

```mermaid
flowchart LR
    subgraph Source ["운영 시스템"]
        DB1[(PostgreSQL)]
        DB2[(MongoDB)]
        API[REST APIs]
    end
    
    subgraph Pipeline ["데이터 파이프라인"]
        E[Extract<br/>추출]
        T[Transform<br/>변환]
        L[Load<br/>적재]
    end
    
    subgraph Dest ["분석 시스템"]
        DW[(Data Warehouse<br/>BigQuery, Snowflake)]
        BI[대시보드<br/>Metabase, Looker]
    end
    
    DB1 --> E
    DB2 --> E
    API --> E
    E --> T --> L --> DW --> BI
    
    style Pipeline fill:#e1f5fe
```

### 왜 그냥 "복사"가 아닌가?

단순히 `pg_dump`로 복사하면 안 될까요? 실제로는 이런 문제들이 있습니다:

1. **스키마 불일치**: 운영 DB 스키마가 분석에 적합하지 않음
2. **데이터 정제**: NULL 처리, 타입 변환, 중복 제거 필요
3. **증분 처리**: 매번 전체를 복사하면 비효율적
4. **의존성 관리**: 테이블 A → B → C 순서대로 처리해야 함
5. **실패 복구**: 중간에 실패하면 어디서부터 다시?
6. **모니터링**: 파이프라인이 제대로 동작하는지 확인

이 모든 것을 해결하는 것이 바로 **데이터 엔지니어링**입니다.

---

## 백엔드 개발자에게 익숙한 개념과의 연결

데이터 엔지니어링의 개념들은 백엔드 개발에서 이미 접해본 것들의 확장입니다.

### 병렬 처리: Goroutine / ThreadPoolExecutor → Spark

백엔드에서 성능을 위해 병렬 처리를 하는 것처럼, 데이터 처리도 병렬화합니다.

```mermaid
flowchart TB
    subgraph Go ["Go: Goroutine"]
        G1["goroutine 1"]
        G2["goroutine 2"]
        G3["goroutine 3"]
        G4["goroutine N"]
    end
    
    subgraph Python ["Python: ThreadPoolExecutor"]
        P1["Thread 1"]
        P2["Thread 2"]
        P3["Thread 3"]
        P4["Thread N"]
    end
    
    subgraph Spark ["Spark: Distributed Processing"]
        S1["Executor 1<br/>(다른 서버)"]
        S2["Executor 2<br/>(다른 서버)"]
        S3["Executor 3<br/>(다른 서버)"]
        S4["Executor N<br/>(다른 서버)"]
    end
    
    SingleServer["단일 서버 내 병렬화"]
    MultiServer["여러 서버로 분산"]
    
    Go --> SingleServer
    Python --> SingleServer
    SingleServer -.->|"데이터가 너무 크면?"| MultiServer
    MultiServer --> Spark
```

**핵심 차이**:

- Goroutine/ThreadPoolExecutor: **단일 서버** 내에서 CPU 코어를 활용
- Spark: **여러 서버**에 걸쳐 데이터와 연산을 분산

### 스케줄링: cron / GitHub Actions → Airflow

정기적인 작업 실행을 관리하는 것도 비슷합니다.

```mermaid
flowchart TB
    subgraph Cron ["cron / GitHub Actions"]
        C1["Task A (00:00)"]
        C2["Task B (01:00)"]
        C3["Task C (02:00)"]
        C1 -.->|"의존성 관리?"| Problem1["❌ 수동 관리"]
        C2 -.->|"실패 시?"| Problem2["❌ 수동 재실행"]
    end
    
    subgraph Airflow ["Apache Airflow"]
        direction LR
        A1["Task A"] --> A2["Task B"] --> A3["Task C"]
        A1 --> A4["Task D"] --> A3
    end
    
    Airflow -->|"의존성"| Dep["✅ DAG로 자동 관리"]
    Airflow -->|"실패 시"| Retry["✅ 자동 재시도"]
    Airflow -->|"모니터링"| UI["✅ 웹 UI 제공"]
```

### 메시지 스트리밍: Redis Streams → Kafka

Redis Streams를 사용해 봤다면, Kafka의 개념이 익숙할 것입니다.

```mermaid
flowchart LR
    subgraph Redis ["Redis Streams"]
        RS["Stream: orders"]
        RC1["Consumer Group A"]
        RC2["Consumer Group B"]
        RS --> RC1
        RS --> RC2
    end
    
    subgraph Kafka ["Apache Kafka"]
        KT["Topic: orders<br/>(Partitioned)"]
        KC1["Consumer Group A"]
        KC2["Consumer Group B"]
        KT --> KC1
        KT --> KC2
    end
    
    Redis -.->|"데이터 규모가 커지면"| Kafka
```

| 특성 | Redis Streams | Kafka |
|------|---------------|-------|
| **설계 목적** | 캐시 + 가벼운 스트리밍 | 대용량 이벤트 스트리밍 |
| **데이터 보존** | 메모리 기반 (제한적) | 디스크 기반 (무제한) |
| **확장성** | 수직 확장 위주 | 수평 확장 (파티셔닝) |
| **처리량** | 수만 TPS | 수백만 TPS |
| **복제** | Master-Replica | Multi-broker 복제 |

---

## 데이터 엔지니어 vs 백엔드 개발자

```mermaid
flowchart TB
    subgraph Backend ["백엔드 개발자 영역"]
        BE1["API 서버"]
        BE2["비즈니스 로직"]
        BE3["운영 DB"]
        BE4["캐시"]
    end
    
    subgraph DE ["데이터 엔지니어 영역"]
        DE1["데이터 파이프라인"]
        DE2["분석 플랫폼"]
        DE3["ML 인프라"]
        DE4["데이터 품질"]
    end
    
    subgraph Overlap ["겹치는 영역"]
        O1["이벤트 스트리밍"]
        O2["로그 수집"]
        O3["메트릭/모니터링"]
    end
    
    Backend --- Overlap --- DE
    
    style Overlap fill:#fff3e0
```

### 왜 백엔드 개발자도 알아야 하는가?

1. **협업**: 데이터 팀과 효과적으로 소통하려면 그들의 언어를 알아야 합니다
2. **설계**: 데이터 추출이 용이한 API와 이벤트 설계를 할 수 있습니다
3. **문제 해결**: "왜 대시보드 숫자가 다르죠?" 같은 질문에 함께 답할 수 있습니다
4. **커리어**: Full-stack Data Engineer의 가치가 높아지고 있습니다

---

## 이 시리즈에서 배울 것들

```mermaid
flowchart TB
    subgraph Part1 ["Part 1: 개념"]
        P1["#1 왜 데이터 엔지니어링?"]
        P2["#2 데이터 아키텍처 전체 그림"]
    end
    
    subgraph Part2 ["Part 2: Spark"]
        P3["#3 Spark 핵심 개념"]
        P4["#4 내부 동작 원리"]
        P5["#5 PySpark 실전"]
    end
    
    subgraph Part3 ["Part 3: Airflow"]
        P6["#6 Airflow 핵심 개념"]
        P7["#7 프로덕션 파이프라인"]
    end
    
    subgraph Part4 ["Part 4: 스트리밍"]
        P8["#8 Kafka 핵심"]
        P9["#9 Spark Streaming"]
    end
    
    subgraph Part5 ["Part 5: 저장소"]
        P10["#10 레이크하우스"]
        P11["#11 데이터 모델링"]
    end
    
    subgraph Part6 ["Part 6: 운영"]
        P12["#12 데이터 품질"]
    end
    
    Part1 --> Part2 --> Part3 --> Part4 --> Part5 --> Part6
```

각 편에서는:

- **"왜?"**에서 시작합니다 - 기술이 해결하는 문제
- **시각화**로 구조를 보여줍니다 - Mermaid 다이어그램
- **익숙한 개념과 연결**합니다 - Go, Python 경험 활용
- **실전 예제**로 마무리합니다 - 바로 적용 가능한 코드

---

## 정리

| 개념 | 설명 |
|------|------|
| **OLTP** | 트랜잭션 처리에 최적화 (PostgreSQL, MySQL) |
| **OLAP** | 분석 처리에 최적화 (BigQuery, Snowflake) |
| **데이터 파이프라인** | 데이터를 추출 → 변환 → 적재하는 자동화된 흐름 |
| **ETL** | Extract, Transform, Load |
| **Row vs Column Storage** | 행 기반(단건 조회) vs 열 기반(집계 분석) |

---

## 다음 편 예고

**2편: 데이터 아키텍처 101**에서는 데이터 파이프라인의 전체 구조를 다룹니다:

- ETL vs ELT 패러다임
- 배치 vs 스트리밍
- Lambda vs Kappa 아키텍처
- Modern Data Stack 소개

---

## 참고 자료

- Martin Kleppmann, "Designing Data-Intensive Applications" (O'Reilly)
- Maxime Beauchemin, "The Rise of the Data Engineer" (Airbnb Engineering Blog)
- [OLTP vs OLAP: What's the Difference?](https://www.ibm.com/topics/oltp)
