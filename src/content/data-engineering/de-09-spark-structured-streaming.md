---
public: true
title: "데이터 엔지니어링 시리즈 #9: Spark Structured Streaming - 실시간 데이터 처리"
date: '2026-01-02'
category: Data Engineering
tags: [Spark, Streaming, Kafka, Watermark, Window, Real-time]
excerpt: "Spark Structured Streaming으로 실시간 데이터 파이프라인을 구축합니다. Kafka 연동, Watermark, Window 연산, 체크포인팅까지."
---

# 데이터 엔지니어링 시리즈 #9: Spark Structured Streaming - 실시간 데이터 처리

> **대상 독자**: 6년 이상의 경험을 가진 백엔드/풀스택 엔지니어로, Spark과 Kafka 기본 개념을 익히고 실시간 처리를 배우려는 분

## 이 편에서 다루는 것

배치 처리와 스트리밍 처리를 **같은 API로** 다루는 Spark Structured Streaming의 핵심을 배웁니다.

---

## 배치와 스트리밍의 통합

### Structured Streaming의 철학

```mermaid
flowchart TB
    subgraph Traditional ["전통적 접근"]
        Batch["배치 코드<br/>(Spark SQL)"]
        Stream["스트리밍 코드<br/>(DStream)"]
        Two["서로 다른 API 😓"]
    end
    
    subgraph Unified ["Structured Streaming"]
        Single["동일한 DataFrame API"]
        Batch2["배치 처리"]
        Stream2["스트리밍 처리"]
        Single --> Batch2
        Single --> Stream2
    end
```

### 무한 테이블 개념

```mermaid
flowchart LR
    subgraph Input ["입력 스트림"]
        T1["t=1: row 1, 2"]
        T2["t=2: row 3"]
        T3["t=3: row 4, 5, 6"]
        
        T1 --> T2 --> T3
    end
    
    subgraph Table ["무한 테이블"]
        Row1["row 1"]
        Row2["row 2"]
        Row3["row 3"]
        Row4["row 4"]
        Row5["row 5"]
        Row6["row 6"]
        Dots["..."]
        
        Row1 --> Row2 --> Row3 --> Row4 --> Row5 --> Row6 --> Dots
    end
    
    subgraph Output ["결과"]
        Q["동일한 쿼리 적용"]
    end
    
    Input --> Table --> Output
```

**핵심 아이디어**: 스트림을 "계속 추가되는 테이블"로 생각

---

## Source와 Sink

### 지원되는 Source

```mermaid
flowchart TB
    subgraph Sources ["Input Sources"]
        Kafka["Kafka<br/>✅ 프로덕션"]
        File["File Source<br/>(JSON, Parquet, CSV)"]
        Socket["Socket<br/>(테스트용)"]
        Rate["Rate Source<br/>(테스트용)"]
    end
```

### 지원되는 Sink

```mermaid
flowchart TB
    subgraph Sinks ["Output Sinks"]
        Kafka2["Kafka"]
        File2["File<br/>(Parquet, JSON)"]
        Console["Console<br/>(디버깅)"]
        Memory["Memory<br/>(테스트)"]
        ForeachBatch["foreachBatch<br/>(커스텀 로직)"]
    end
```

---

## Kafka → Spark Streaming 연동

### 기본 구조

```mermaid
flowchart LR
    subgraph Kafka ["Kafka"]
        Topic["Topic: events"]
    end
    
    subgraph Spark ["Spark Streaming"]
        Read["readStream"]
        Transform["변환 로직"]
        Write["writeStream"]
    end
    
    subgraph Output ["출력"]
        DeltaLake["Delta Lake"]
    end
    
    Kafka --> Read --> Transform --> Write --> Output
```

### 코드 예시

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType, TimestampType, DoubleType

spark = SparkSession.builder \
    .appName("StreamingApp") \
    .getOrCreate()

# 스키마 정의
event_schema = StructType() \
    .add("user_id", StringType()) \
    .add("event_type", StringType()) \
    .add("timestamp", TimestampType()) \
    .add("amount", DoubleType())

# Kafka에서 읽기
df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "user_events") \
    .option("startingOffsets", "latest") \
    .load()

# value 파싱 (Kafka 메시지는 binary)
parsed = df.select(
    from_json(col("value").cast("string"), event_schema).alias("data")
).select("data.*")

# 변환 로직 (배치와 동일!)
result = parsed.filter(col("amount") > 0)

# 출력
query = result.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/checkpoints/events") \
    .outputMode("append") \
    .start("/delta/events")

query.awaitTermination()
```

---

## Output Modes

### 세 가지 모드

```mermaid
flowchart TB
    subgraph Append ["Append Mode"]
        A1["새로 추가된 행만 출력"]
        A2["집계 없는 쿼리에 적합"]
        A3["예: 필터링, 맵핑"]
    end
    
    subgraph Complete ["Complete Mode"]
        C1["전체 결과 매번 출력"]
        C2["집계 쿼리에 적합"]
        C3["예: groupBy().count()"]
    end
    
    subgraph Update ["Update Mode"]
        U1["변경된 행만 출력"]
        U2["집계 쿼리에 효율적"]
        U3["예: 카운트 업데이트"]
    end
```

### 언제 어떤 모드?

| 쿼리 유형 | Append | Complete | Update |
|----------|--------|----------|--------|
| **SELECT, WHERE** | ✅ | ❌ | ✅ |
| **집계 (groupBy)** | ❌* | ✅ | ✅ |
| **워터마크 + 집계** | ✅ | ✅ | ✅ |

*워터마크 없는 집계는 Append 불가

---

## Event Time vs Processing Time

### 두 시간의 차이

```mermaid
flowchart LR
    subgraph EventTime ["Event Time"]
        ET["이벤트가 실제로 발생한 시간<br/>(데이터에 포함된 timestamp)"]
    end
    
    subgraph ProcessingTime ["Processing Time"]
        PT["Spark이 데이터를 처리하는 시간<br/>(시스템 시계)"]
    end
    
    subgraph Problem ["문제 상황"]
        P1["Event: 10:00:00"]
        P2["네트워크 지연"]
        P3["Processing: 10:05:00"]
        P1 --> P2 --> P3
        
        Q["어떤 시간 기준으로 윈도우?"]
    end
```

### Event Time 처리

```python
# timestamp 컬럼을 Event Time으로 사용
parsed = df.select(
    from_json(col("value").cast("string"), event_schema).alias("data")
).select("data.*")

# Event Time 기준 윈도우 집계
result = parsed \
    .groupBy(
        window(col("timestamp"), "5 minutes"),
        col("event_type")
    ) \
    .count()
```

---

## Watermark와 Late Data

### 왜 Watermark가 필요한가?

```mermaid
flowchart TB
    subgraph Problem ["문제: 지연 데이터"]
        W1["10:00 윈도우 처리 중"]
        W2["10:05에 도착한 데이터"]
        W3["근데 event_time은 09:55!"]
        W4["어떻게 처리?"]
        
        W1 --> W2 --> W3 --> W4
    end
    
    subgraph Solution ["해결: Watermark"]
        S1["허용 지연 시간 설정<br/>(예: 10분)"]
        S2["Watermark = max(event_time) - 10분"]
        S3["Watermark 이전 윈도우는 닫힘"]
        
        S1 --> S2 --> S3
    end
```

### Watermark 동작 방식

```mermaid
flowchart LR
    subgraph Timeline ["시간 흐름"]
        T1["Event: 10:05"]
        T2["Event: 10:10"]
        T3["Event: 10:08"]
        T4["Event: 10:15"]
        T5["Late: 09:55"]
    end
    
    subgraph Watermark ["Watermark (지연 10분)"]
        W1["max=10:05<br/>WM=09:55"]
        W2["max=10:10<br/>WM=10:00"]
        W3["max=10:10<br/>WM=10:00"]
        W4["max=10:15<br/>WM=10:05"]
        W5["❌ 09:55 < 10:05<br/>→ 버려짐"]
    end
    
    T1 --> W1
    T2 --> W2
    T3 --> W3
    T4 --> W4
    T5 --> W5
```

### 코드 예시

```python
from pyspark.sql.functions import window, col

# Watermark 설정: 10분 지연 허용
result = parsed \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(
        window(col("timestamp"), "5 minutes"),
        col("page")
    ) \
    .agg(count("*").alias("views"))

# Watermark 덕분에 Append 모드 가능
query = result.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/checkpoints/views") \
    .start("/delta/page_views")
```

---

## Window 연산

### Window 종류

```mermaid
flowchart TB
    subgraph Tumbling ["Tumbling Window"]
        T1["0-5분"]
        T2["5-10분"]
        T3["10-15분"]
        T1 --> T2 --> T3
        TNote["겹치지 않음"]
    end
    
    subgraph Sliding ["Sliding Window"]
        S1["0-5분"]
        S2["2.5-7.5분"]
        S3["5-10분"]
        SNote["겹침 (slide < window)"]
    end
    
    subgraph Session ["Session Window"]
        SE1["활동 기간 A"]
        Gap["비활동 gap"]
        SE2["활동 기간 B"]
        SE1 --> Gap --> SE2
        SENote["gap 기준 분리"]
    end
```

### Window 함수 사용

```python
from pyspark.sql.functions import window, sum, avg

# Tumbling Window: 5분 윈도우
tumbling = parsed \
    .groupBy(window("timestamp", "5 minutes")) \
    .agg(sum("amount").alias("total"))

# Sliding Window: 10분 윈도우, 5분 슬라이드
sliding = parsed \
    .groupBy(window("timestamp", "10 minutes", "5 minutes")) \
    .agg(avg("amount").alias("avg_amount"))

# Session Window (Spark 3.2+)
session = parsed \
    .groupBy(
        session_window("timestamp", "10 minutes"),
        col("user_id")
    ) \
    .agg(count("*").alias("session_events"))
```

---

## 체크포인팅과 장애 복구

### 체크포인트 구조

```mermaid
flowchart TB
    subgraph Checkpoint ["체크포인트 디렉토리"]
        Offsets["offsets/<br/>Kafka offset 정보"]
        Commits["commits/<br/>처리 완료 배치"]
        State["state/<br/>집계 상태"]
        Metadata["metadata/<br/>쿼리 메타데이터"]
    end
    
    subgraph Recovery ["장애 복구"]
        R1["마지막 체크포인트 로드"]
        R2["미처리 offset부터 재시작"]
        R3["상태 복원"]
        R1 --> R2 --> R3
    end
```

### Exactly-Once 보장

```python
# 체크포인트 필수 설정
query = result.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "hdfs://path/checkpoints/my_query") \
    .trigger(processingTime="1 minute") \
    .start("/delta/output")
```

**체크포인트가 보장하는 것**:

- Kafka offset 추적 → 중복 읽기 방지
- 상태 저장 → 집계 결과 유지
- Atomic 커밋 → Exactly-Once

---

## 실전 예제: 실시간 클릭스트림 분석

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    from_json, col, window, count, sum, avg,
    current_timestamp, expr
)
from pyspark.sql.types import StructType, StringType, TimestampType

spark = SparkSession.builder \
    .appName("ClickstreamAnalysis") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# 스키마
click_schema = StructType() \
    .add("user_id", StringType()) \
    .add("page", StringType()) \
    .add("action", StringType()) \
    .add("timestamp", TimestampType())

# Kafka에서 읽기
clicks = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "clickstream") \
    .option("startingOffsets", "latest") \
    .load() \
    .select(
        from_json(col("value").cast("string"), click_schema).alias("click")
    ).select("click.*")

# 5분 윈도우로 페이지별 통계
page_stats = clicks \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(
        window(col("timestamp"), "5 minutes"),
        col("page")
    ) \
    .agg(
        count("*").alias("view_count"),
        count("user_id").alias("unique_users")
    )

# Delta Lake에 저장
query = page_stats.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/checkpoints/clickstream") \
    .trigger(processingTime="1 minute") \
    .start("/delta/page_stats")

# 콘솔에도 출력 (디버깅용)
debug_query = page_stats.writeStream \
    .format("console") \
    .outputMode("update") \
    .trigger(processingTime="30 seconds") \
    .start()

query.awaitTermination()
```

---

## 모니터링

### Streaming Query 상태 확인

```python
# 쿼리 진행 상황
print(query.status)
# {'message': 'Processing new data', 'isActive': True, ...}

# 최근 진행 상황
for progress in query.recentProgress:
    print(f"Batch {progress['batchId']}")
    print(f"  Input rows: {progress['numInputRows']}")
    print(f"  Processing time: {progress['batchDuration']} ms")
```

### Spark UI에서 확인

```mermaid
flowchart TB
    subgraph SparkUI ["Structured Streaming UI"]
        Tab["Streaming 탭"]
        Metrics["• Input Rate<br/>• Processing Rate<br/>• Batch Duration<br/>• State Rows"]
    end
```

---

## 정리

```mermaid
mindmap
  root((Spark<br/>Structured<br/>Streaming))
    핵심 개념
      무한 테이블
      동일한 API
      배치 & 스트리밍 통합
    Source/Sink
      Kafka
      File
      Delta Lake
    Output Mode
      Append
      Complete
      Update
    시간 처리
      Event Time
      Processing Time
      Watermark
    Window
      Tumbling
      Sliding
      Session
    안정성
      Checkpoint
      Exactly-Once
      장애 복구
```

---

## 다음 편 예고

**10편: 레이크하우스 아키텍처**에서는 데이터 저장소를 다룹니다:

- Data Lake vs Data Warehouse
- Delta Lake 심층 분석
- ACID, Time Travel, Schema Evolution
- Apache Iceberg 비교

---

## 참고 자료

- [Structured Streaming Programming Guide](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html)
- [Kafka Integration](https://spark.apache.org/docs/latest/structured-streaming-kafka-integration.html)
- Databricks, "Real-time Streaming with Spark 3.0"
