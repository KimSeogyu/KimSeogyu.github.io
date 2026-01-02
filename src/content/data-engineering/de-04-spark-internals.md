---
public: true
title: "데이터 엔지니어링 시리즈 #4: Spark 내부 동작 원리 - Job, Stage, Task"
date: '2026-01-02'
category: Data Engineering
series: data-engineering
tags: [Data Engineering, Partitioning, Performance, Spark]
excerpt: "Spark의 실행 모델을 이해합니다. Job, Stage, Task 계층, Shuffle의 비용, 파티셔닝 전략, 그리고 Spark UI를 읽는 법까지."
---

# 데이터 엔지니어링 시리즈 #4: Spark 내부 동작 원리 - Job, Stage, Task

> **대상 독자**: 충분한 경험을 가진 백엔드/풀스택 엔지니어로, Spark의 기본 개념을 알고 성능 튜닝에 관심 있는 분

## 이 편에서 다루는 것

Spark 코드를 작성할 때 **왜 어떤 코드는 느리고 어떤 코드는 빠른지** 이해하려면, 내부 실행 모델을 알아야 합니다.

---

## 실행 계층 구조: Application → Job → Stage → Task

### 전체 구조

```mermaid
flowchart TB
    subgraph App ["Application (앱 전체)"]
        subgraph Job1 ["Job 1 (Action 1)"]
            subgraph Stage1 ["Stage 1"]
                T1["Task 1"]
                T2["Task 2"]
                T3["Task 3"]
            end
            subgraph Stage2 ["Stage 2"]
                T4["Task 4"]
                T5["Task 5"]
            end
        end
        
        subgraph Job2 ["Job 2 (Action 2)"]
            subgraph Stage3 ["Stage 3"]
                T6["Task 6"]
                T7["Task 7"]
            end
        end
    end
    
    Stage1 -->|"Shuffle"| Stage2
```

### 각 계층의 역할

| 계층 | 무엇 | 언제 생성 | 병렬성 |
|------|------|---------|--------|
| **Application** | 전체 Spark 프로그램 | spark-submit 시 | 1개 |
| **Job** | 하나의 Action 실행 단위 | count(), save() 호출 | 순차 |
| **Stage** | Shuffle 기준 분리 | 자동 분리 | 순차 |
| **Task** | 파티션당 실행 단위 | 파티션 수만큼 | **병렬** |

### 코드 예시와 실행 흐름

```python
# 이 코드가 어떻게 실행될까?
df = spark.read.parquet("data/")  # Transformation
filtered = df.filter(df.age > 20)  # Transformation
grouped = filtered.groupBy("city").count()  # Transformation
grouped.show()  # Action → Job 생성!
```

```mermaid
flowchart LR
    subgraph Job ["Job (show 호출)"]
        subgraph Stage1 ["Stage 1: Wide 전까지"]
            Read["read.parquet"]
            Filter["filter(age > 20)"]
            Read --> Filter
        end
        
        Shuffle["⚡ Shuffle<br/>(city 기준 재배치)"]
        
        subgraph Stage2 ["Stage 2: 집계"]
            GroupBy["groupBy + count"]
            Show["show()"]
            GroupBy --> Show
        end
        
        Stage1 --> Shuffle --> Stage2
    end
```

---

## Narrow vs Wide Transformations

### 이것이 성능의 핵심

```mermaid
flowchart TB
    subgraph Narrow ["Narrow Transformations"]
        direction TB
        N1["map"]
        N2["filter"]
        N3["flatMap"]
        N4["select"]
        
        NP1["Partition 1"] --> NP1R["결과 1"]
        NP2["Partition 2"] --> NP2R["결과 2"]
        NP3["Partition 3"] --> NP3R["결과 3"]
        
        Desc1["✅ 파티션 독립 처리<br/>✅ 네트워크 통신 없음<br/>✅ 매우 빠름"]
    end
    
    subgraph Wide ["Wide Transformations"]
        direction TB
        W1["groupBy"]
        W2["join"]
        W3["orderBy"]
        W4["repartition"]
        
        WP1["Partition 1"] --> WS["Shuffle<br/>🔀"] --> WR1["결과 1"]
        WP2["Partition 2"] --> WS --> WR2["결과 2"]
        WP3["Partition 3"] --> WS --> WR3["결과 3"]
        
        Desc2["⚠️ 데이터 재배치<br/>⚠️ 네트워크 I/O 발생<br/>⚠️ 느림"]
    end
```

### Shuffle이 비싼 이유

```mermaid
flowchart TB
    subgraph Before ["Shuffle 전"]
        P1["Executor 1<br/>키: A, B, C"]
        P2["Executor 2<br/>키: A, D, E"]
        P3["Executor 3<br/>키: B, C, F"]
    end
    
    subgraph Network ["네트워크 전송"]
        direction TB
        N1["A 데이터 → Reducer 1로"]
        N2["B 데이터 → Reducer 2로"]
        N3["C 데이터 → Reducer 3으로"]
        N4["..."]
    end
    
    subgraph After ["Shuffle 후"]
        R1["Reducer 1<br/>키 A만"]
        R2["Reducer 2<br/>키 B만"]
        R3["Reducer 3<br/>키 C만"]
    end
    
    Before --> Network --> After
    
    Cost["💸 비용 발생<br/>• 디스크 쓰기<br/>• 네트워크 전송<br/>• 디스크 읽기<br/>• 정렬"]
```

**Shuffle이 발생하면**:

1. 각 Executor가 결과를 **디스크에 저장**
2. 키 기준으로 **네트워크로 전송**
3. 받는 쪽에서 **디스크에 저장**
4. 키 기준 **정렬**
5. 메모리로 **읽어서 처리**

---

## 파티셔닝 전략

### 파티션이란?

```mermaid
flowchart TB
    subgraph Data ["원본 데이터"]
        BigData["1TB 데이터"]
    end
    
    subgraph Partitions ["파티션 분할"]
        P1["Partition 1<br/>100GB"]
        P2["Partition 2<br/>100GB"]
        P3["Partition 3<br/>100GB"]
        PN["...<br/>100GB"]
    end
    
    subgraph Tasks ["병렬 처리"]
        T1["Task 1<br/>→ Core 1"]
        T2["Task 2<br/>→ Core 2"]
        T3["Task 3<br/>→ Core 3"]
        TN["Task N<br/>→ Core N"]
    end
    
    BigData --> Partitions --> Tasks
```

### 파티션 수와 병렬성

```mermaid
flowchart TB
    subgraph TooFew ["파티션이 너무 적음"]
        F1["4 파티션"]
        F2["100 코어 클러스터"]
        F3["❌ 96 코어 놀고 있음"]
    end
    
    subgraph TooMany ["파티션이 너무 많음"]
        M1["10000 파티션"]
        M2["100 코어 클러스터"]
        M3["❌ 스케줄링 오버헤드"]
    end
    
    subgraph JustRight ["적절한 파티션"]
        R1["200~400 파티션"]
        R2["100 코어 클러스터"]
        R3["✅ 코어당 2~4 Task"]
    end
```

**경험칙**:

- 파티션 수 = 코어 수 × 2~4
- 파티션당 크기 = 100MB ~ 1GB

### 데이터 스큐(Skew) 문제

```mermaid
flowchart TB
    subgraph Skewed ["스큐 발생"]
        S1["Partition 1<br/>10MB"]
        S2["Partition 2<br/>10MB"]
        S3["Partition 3<br/>10GB !!"]
        
        ST1["Task 1<br/>1초"]
        ST2["Task 2<br/>1초"]
        ST3["Task 3<br/>100초 😱"]
        
        S1 --> ST1
        S2 --> ST2
        S3 --> ST3
    end
    
    Result["전체 시간 = 100초<br/>(가장 느린 Task 기준)"]
    
    Skewed --> Result
```

**해결책**:

1. **Salting**: 핫 키에 랜덤 접두사 추가
2. **Broadcast Join**: 작은 테이블은 전체 복사
3. **Adaptive Query Execution (AQE)**: Spark 3.0+ 자동 최적화

---

## 메모리 관리

### Executor 메모리 구조

```mermaid
flowchart TB
    subgraph Executor ["Executor 메모리"]
        subgraph Reserved ["Reserved (300MB)"]
            R["시스템용"]
        end
        
        subgraph Unified ["Unified Memory (60%)"]
            Storage["Storage<br/>(캐시)"]
            Execution["Execution<br/>(Shuffle, 정렬)"]
            Storage <-->|"동적 공유"| Execution
        end
        
        subgraph User ["User Memory (40%)"]
            UDF["UDF 객체"]
            Meta["메타데이터"]
        end
    end
```

### 메모리 부족 시: Spill to Disk

```mermaid
flowchart LR
    subgraph Normal ["정상 상태"]
        Mem1["메모리 사용<br/>3GB"]
        Limit1["할당량<br/>4GB"]
    end
    
    subgraph Spill ["Spill 발생"]
        Mem2["메모리 사용<br/>4GB+"]
        Disk["디스크로<br/>내보내기 💾"]
        Slow["🐢 느려짐"]
        
        Mem2 --> Disk --> Slow
    end
    
    Normal -->|"데이터 증가"| Spill
```

**Spill 감지 방법**: Spark UI에서 "Spill (Memory)" / "Spill (Disk)" 확인

---

## Spark UI 읽는 법

### 핵심 지표들

```mermaid
flowchart TB
    subgraph SparkUI ["Spark UI"]
        subgraph JobsTab ["Jobs 탭"]
            J1["Job 성공/실패"]
            J2["전체 소요 시간"]
        end
        
        subgraph StagesTab ["Stages 탭 ⭐"]
            S1["Stage별 시간"]
            S2["Shuffle Read/Write"]
            S3["Task 분포"]
        end
        
        subgraph SQLTab ["SQL 탭"]
            SQL1["실행 계획"]
            SQL2["물리 계획"]
        end
    end
```

### Stages 탭 해석

```mermaid
flowchart TB
    subgraph StageMetrics ["Stage 지표"]
        subgraph Good ["✅ 정상"]
            G1["Task Duration 균일"]
            G2["Shuffle Write 적음"]
            G3["Spill 없음"]
        end
        
        subgraph Bad ["⚠️ 문제"]
            B1["Task Duration 편차 큼<br/>→ 데이터 스큐"]
            B2["Shuffle 크기 거대<br/>→ 조인/그룹 최적화 필요"]
            B3["Spill 발생<br/>→ 메모리 부족"]
        end
    end
```

### 실전 디버깅 플로우

```mermaid
flowchart TB
    Start["Job이 느림"]
    
    Q1{"Shuffle이<br/>큰가?"}
    Q2{"Task Duration<br/>편차가 큰가?"}
    Q3{"Spill이<br/>발생하는가?"}
    Q4{"GC 시간이<br/>긴가?"}
    
    A1["조인/그룹 최적화<br/>Broadcast Join 고려"]
    A2["데이터 스큐 해결<br/>Salting, AQE"]
    A3["메모리 증가<br/>파티션 수 조정"]
    A4["Executor 메모리 증가<br/>GC 튜닝"]
    
    Start --> Q1
    Q1 -->|"예"| A1
    Q1 -->|"아니오"| Q2
    Q2 -->|"예"| A2
    Q2 -->|"아니오"| Q3
    Q3 -->|"예"| A3
    Q3 -->|"아니오"| Q4
    Q4 -->|"예"| A4
    Q4 -->|"아니오"| Other["다른 원인 조사"]
```

---

## 실전 최적화 체크리스트

### 코드 레벨

| 항목 | 좋은 예 | 나쁜 예 |
|------|--------|--------|
| **조인** | Broadcast Join (작은 테이블) | 양쪽 다 큰 Shuffle Join |
| **필터** | 조인 전에 filter | 조인 후에 filter |
| **컬럼 선택** | 필요한 컬럼만 select | SELECT * |
| **UDF** | Built-in 함수 사용 | Python UDF 남용 |
| **collect** | 집계 후 collect | 큰 데이터 collect |

### 설정 레벨

```python
# 권장 설정
spark.conf.set("spark.sql.adaptive.enabled", "true")  # AQE
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.shuffle.partitions", "200")  # 기본 200
```

---

## 정리

```mermaid
mindmap
  root((Spark<br/>내부 동작))
    계층 구조
      Application
      Job (Action마다)
      Stage (Shuffle마다)
      Task (파티션마다)
    Transformation
      Narrow
        map, filter
        빠름
      Wide
        groupBy, join
        Shuffle 발생
        느림
    Shuffle
      네트워크 전송
      디스크 I/O
      성능 병목
    파티셔닝
      적정 수: 코어 x 2~4
      스큐 주의
      AQE 활용
    메모리
      Storage + Execution
      Spill 발생 시 느려짐
    Spark UI
      Stage 탭 확인
      Shuffle 크기
      Task 분포
```

---

## 다음 편 예고

**5편: PySpark 실전**에서는 실무 패턴을 다룹니다:

- 자주 쓰는 DataFrame 연산
- UDF vs Built-in Functions
- 조인 최적화 기법
- 캐싱과 체크포인팅
- 안티패턴 피하기

---

## 참고 자료

- [Spark Web UI](https://spark.apache.org/docs/latest/web-ui.html)
- [Tuning Spark](https://spark.apache.org/docs/latest/tuning.html)
- [Adaptive Query Execution](https://spark.apache.org/docs/latest/sql-performance-tuning.html#adaptive-query-execution)
- Jacek Laskowski, "The Internals of Apache Spark"
