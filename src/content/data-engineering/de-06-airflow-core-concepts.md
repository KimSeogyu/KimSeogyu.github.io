---
public: true
title: "데이터 엔지니어링 시리즈 #6: Airflow 핵심 개념 - DAG, Operator, Task"
date: '2026-01-02'
category: Data Engineering
series: data-engineering
tags: [Airflow, DAG, Workflow, Orchestration, TaskFlow, ETL]
excerpt: "왜 cron으로는 부족할까요? Airflow의 핵심 개념인 DAG, Operator, Task를 이해하고 TaskFlow API로 현대적인 워크플로우를 작성하는 법을 배웁니다."
---

# 데이터 엔지니어링 시리즈 #6: Airflow 핵심 개념 - DAG, Operator, Task

> **대상 독자**: 충분한 가진 백엔드/풀스택 엔지니어로, CI/CD 파이프라인이나 cron job에 익숙하지만 Airflow는 처음인 분

## 이 편에서 다루는 것

GitHub Actions나 cron으로 배치 작업을 돌려본 경험이 있다면, **왜 데이터 팀은 Airflow를 쓰는지** 궁금했을 겁니다. 그 이유와 핵심 개념을 배웁니다.

---

## 왜 cron job으로는 부족한가?

### cron의 한계

```mermaid
flowchart TB
    subgraph Cron ["cron 방식의 문제"]
        C1["0 1 * * * extract.sh"]
        C2["0 2 * * * transform.sh"]
        C3["0 3 * * * load.sh"]
        
        Problem1["❓ extract가 늦어지면?"]
        Problem2["❓ 중간에 실패하면?"]
        Problem3["❓ 어제 데이터를 재처리하려면?"]
        Problem4["❓ 실행 상태를 어떻게 확인?"]
    end
```

| 문제 | cron | Airflow |
|------|------|---------|
| **의존성 관리** | 시간으로만 (불확실) | 명시적 의존성 ✅ |
| **실패 처리** | 수동 확인/재실행 | 자동 재시도 ✅ |
| **백필** | 스크립트 수동 수정 | 날짜 지정 재실행 ✅ |
| **모니터링** | 로그 파일 뒤지기 | 웹 UI ✅ |
| **알림** | 직접 구현 | Slack/Email 연동 ✅ |

### 실제 시나리오

```mermaid
flowchart LR
    subgraph Reality ["현실에서 일어나는 일"]
        A["Extract<br/>(01:00 예정)"]
        B["Transform<br/>(02:00 예정)"]
        C["Load<br/>(03:00 예정)"]
        
        A -->|"01:30에 끝남"| Delay
        Delay["⚠️ Transform이<br/>불완전한 데이터로 시작"]
        Delay --> Bad["❌ 잘못된 결과"]
    end
```

**Airflow의 해결책**: Task 간 **의존성**을 정의하여 이전 Task가 완료되어야 다음이 시작

---

## Airflow 아키텍처

### 구성 요소

```mermaid
flowchart TB
    subgraph Airflow ["Airflow 시스템"]
        Web["Webserver<br/>📊 UI 제공"]
        Sched["Scheduler<br/>⏰ DAG 파싱/스케줄링"]
        Worker["Worker(s)<br/>⚙️ Task 실행"]
        DB[(Metadata DB<br/>📁 상태 저장)]
        
        Web <--> DB
        Sched <--> DB
        Worker <--> DB
        Sched -->|"Task 할당"| Worker
    end
    
    subgraph DAGs ["DAG 파일"]
        D1["dag1.py"]
        D2["dag2.py"]
        D3["dag3.py"]
    end
    
    DAGs -->|"파싱"| Sched
```

### Executor 종류

| Executor | 특징 | 적합한 환경 |
|----------|------|------------|
| **LocalExecutor** | 단일 머신, 멀티 프로세스 | 개발, 소규모 |
| **CeleryExecutor** | 분산 워커 (Redis/RabbitMQ) | 중규모 프로덕션 |
| **KubernetesExecutor** | 각 Task를 Pod로 | 대규모, 클라우드 |

---

## DAG (Directed Acyclic Graph)

### DAG란?

```mermaid
flowchart LR
    subgraph DAG ["DAG: Directed Acyclic Graph"]
        A["Task A"]
        B["Task B"]
        C["Task C"]
        D["Task D"]
        E["Task E"]
        
        A --> B
        A --> C
        B --> D
        C --> D
        D --> E
    end
    
    subgraph Rules ["규칙"]
        R1["✅ Directed: 방향이 있음"]
        R2["✅ Acyclic: 순환 없음"]
        R3["❌ A → B → A (불가)"]
    end
```

**왜 그래프인가?**

- 순차 실행만 있는 게 아님
- 병렬 실행 가능 (B와 C 동시 실행)
- 의존성 명확히 표현

### DAG 정의 예시

```python
from airflow import DAG
from datetime import datetime

# DAG 정의
dag = DAG(
    dag_id="my_etl_pipeline",
    start_date=datetime(2024, 1, 1),
    schedule="@daily",  # 매일 실행
    catchup=False,
    tags=["etl", "production"]
)
```

---

## Operator와 Task

### Operator: 무엇을 할 것인가?

```mermaid
flowchart TB
    subgraph Operators ["주요 Operator 종류"]
        subgraph Basic ["기본"]
            O1["BashOperator<br/>쉘 명령 실행"]
            O2["PythonOperator<br/>Python 함수 실행"]
            O3["EmptyOperator<br/>아무것도 안 함"]
        end
        
        subgraph Transfer ["데이터 전송"]
            O4["S3ToRedshiftOperator"]
            O5["GCSToGCSOperator"]
        end
        
        subgraph External ["외부 시스템"]
            O6["SparkSubmitOperator<br/>Spark 작업 제출"]
            O7["DockerOperator<br/>컨테이너 실행"]
            O8["PostgresOperator<br/>SQL 실행"]
        end
        
        subgraph Sensors ["센서 (대기)"]
            O9["FileSensor<br/>파일 존재 대기"]
            O10["HttpSensor<br/>API 응답 대기"]
        end
    end
```

### Task: Operator의 인스턴스

```mermaid
flowchart LR
    subgraph Definition ["정의"]
        Operator["PythonOperator<br/>(클래스)"]
    end
    
    subgraph Instance ["인스턴스"]
        Task1["extract_task<br/>(Task)"]
        Task2["transform_task<br/>(Task)"]
        Task3["load_task<br/>(Task)"]
    end
    
    Operator --> Task1
    Operator --> Task2
    Operator --> Task3
```

```python
from airflow.operators.python import PythonOperator

def extract_data():
    # 데이터 추출 로직
    return {"records": 1000}

def transform_data(**context):
    # 이전 Task 결과 가져오기
    data = context["ti"].xcom_pull(task_ids="extract")
    # 변환 로직
    return {"processed": data["records"]}

# Task 정의
extract_task = PythonOperator(
    task_id="extract",
    python_callable=extract_data,
    dag=dag
)

transform_task = PythonOperator(
    task_id="transform",
    python_callable=transform_data,
    dag=dag
)

# 의존성 정의
extract_task >> transform_task
```

---

## TaskFlow API (Airflow 2.0+)

### 전통적 방식 vs TaskFlow

```mermaid
flowchart TB
    subgraph Traditional ["전통적 방식"]
        T1["Operator 정의"]
        T2["XCom으로 데이터 전달"]
        T3["의존성 별도 정의"]
        
        T1 --> T2 --> T3
        Note1["장황한 코드 😓"]
    end
    
    subgraph TaskFlow ["TaskFlow API"]
        TF1["@task 데코레이터"]
        TF2["return으로 전달"]
        TF3["함수 호출로 의존성"]
        
        TF1 --> TF2 --> TF3
        Note2["깔끔한 코드 ✨"]
    end
```

### TaskFlow 예시

```python
from airflow.decorators import dag, task
from datetime import datetime

@dag(
    dag_id="taskflow_etl",
    start_date=datetime(2024, 1, 1),
    schedule="@daily",
    catchup=False
)
def my_etl_pipeline():
    """TaskFlow API를 사용한 ETL 파이프라인"""
    
    @task
    def extract():
        """데이터 추출"""
        return {"data": [1, 2, 3, 4, 5]}
    
    @task
    def transform(raw_data: dict):
        """데이터 변환"""
        return {
            "data": [x * 2 for x in raw_data["data"]],
            "count": len(raw_data["data"])
        }
    
    @task
    def load(processed_data: dict):
        """데이터 적재"""
        print(f"Loaded {processed_data['count']} records")
    
    # 의존성이 자연스럽게 정의됨
    raw = extract()
    processed = transform(raw)
    load(processed)

# DAG 인스턴스 생성
my_etl_pipeline()
```

### XCom 자동 처리

```mermaid
flowchart LR
    subgraph Traditional ["전통적 XCom"]
        E1["extract"]
        X1["xcom_push()"]
        X2["xcom_pull()"]
        T1["transform"]
        
        E1 --> X1 --> X2 --> T1
        Note1["명시적 push/pull 필요"]
    end
    
    subgraph TaskFlow ["TaskFlow XCom"]
        E2["@task<br/>return data"]
        T2["@task<br/>def fn(data):"]
        
        E2 -->|"자동!"| T2
        Note2["return/파라미터로 자동 전달"]
    end
```

---

## 스케줄링과 Data Interval

### schedule 표현식

| 표현식 | 의미 | cron 표현 |
|--------|------|----------|
| `@once` | 한 번만 | - |
| `@hourly` | 매시 | `0 * * * *` |
| `@daily` | 매일 | `0 0 * * *` |
| `@weekly` | 매주 | `0 0 * * 0` |
| `@monthly` | 매월 | `0 0 1 * *` |
| `0 6 * * *` | 매일 6시 | - |
| `None` | 수동 트리거만 | - |

### Data Interval 개념 (중요!)

```mermaid
flowchart TB
    subgraph Timeline ["시간선"]
        T1["2024-01-01<br/>00:00"]
        T2["2024-01-02<br/>00:00"]
        T3["2024-01-03<br/>00:00"]
    end
    
    subgraph DAGRun ["DAG 실행"]
        D1["DAG Run 1<br/>data_interval: 01-01 ~ 01-02"]
        D2["DAG Run 2<br/>data_interval: 01-02 ~ 01-03"]
    end
    
    T2 -->|"실행 시점"| D1
    T3 -->|"실행 시점"| D2
    
    Note["⚠️ 1월 2일에 1월 1일 데이터를 처리!"]
```

```python
@task
def process_data(**context):
    # 처리할 데이터의 날짜 범위
    data_interval_start = context["data_interval_start"]
    data_interval_end = context["data_interval_end"]
    
    # 예: 2024-01-01 00:00 ~ 2024-01-02 00:00
    print(f"Processing data from {data_interval_start} to {data_interval_end}")
```

### Catchup과 Backfill

```mermaid
flowchart TB
    subgraph Catchup ["catchup=True"]
        C1["DAG 생성: 2024-01-05"]
        C2["start_date: 2024-01-01"]
        C3["누락된 4일치 자동 실행"]
        
        C1 --> C2 --> C3
    end
    
    subgraph NoCatchup ["catchup=False"]
        N1["DAG 생성: 2024-01-05"]
        N2["start_date: 2024-01-01"]
        N3["오늘(01-05)부터만 실행"]
        
        N1 --> N2 --> N3
    end
```

```bash
# 수동 Backfill
airflow dags backfill \
    --start-date 2024-01-01 \
    --end-date 2024-01-10 \
    my_etl_pipeline
```

---

## Task 의존성 패턴

### 기본 패턴

```mermaid
flowchart LR
    subgraph Sequential ["순차"]
        S1["A"] --> S2["B"] --> S3["C"]
    end
    
    subgraph Parallel ["병렬"]
        P1["A"] --> P2["B"]
        P1 --> P3["C"]
        P2 --> P4["D"]
        P3 --> P4
    end
    
    subgraph FanOut ["Fan-out"]
        F1["A"] --> F2["B1"]
        F1 --> F3["B2"]
        F1 --> F4["B3"]
    end
```

### 코드에서 의존성 정의

```python
# 방법 1: >> 연산자
task_a >> task_b >> task_c

# 방법 2: << 연산자 (역방향)
task_c << task_b << task_a

# 방법 3: 리스트로 병렬
task_a >> [task_b, task_c] >> task_d

# 방법 4: set_downstream/set_upstream
task_a.set_downstream(task_b)
task_b.set_upstream(task_a)
```

### TaskFlow에서는 더 자연스럽게

```python
@dag(...)
def pipeline():
    @task
    def start(): pass
    
    @task
    def process_a(data): pass
    
    @task
    def process_b(data): pass
    
    @task
    def end(a, b): pass
    
    data = start()
    result_a = process_a(data)
    result_b = process_b(data)
    end(result_a, result_b)  # 자동으로 의존성 생성
```

---

## 실전 예제: 데이터 파이프라인

```python
from airflow.decorators import dag, task
from airflow.providers.postgres.operators.postgres import PostgresOperator
from datetime import datetime, timedelta

default_args = {
    "owner": "data-team",
    "retries": 3,
    "retry_delay": timedelta(minutes=5),
}

@dag(
    dag_id="daily_user_analytics",
    start_date=datetime(2024, 1, 1),
    schedule="@daily",
    catchup=False,
    default_args=default_args,
    tags=["analytics", "production"]
)
def daily_user_analytics():
    """일일 사용자 분석 파이프라인"""
    
    @task
    def extract_users(**context):
        """PostgreSQL에서 사용자 데이터 추출"""
        from airflow.providers.postgres.hooks.postgres import PostgresHook
        
        date = context["data_interval_start"].strftime("%Y-%m-%d")
        hook = PostgresHook(postgres_conn_id="production_db")
        
        sql = f"""
            SELECT user_id, event_type, created_at
            FROM user_events
            WHERE DATE(created_at) = '{date}'
        """
        
        df = hook.get_pandas_df(sql)
        return df.to_dict("records")
    
    @task
    def calculate_metrics(events: list):
        """사용자 메트릭 계산"""
        from collections import Counter
        
        user_events = Counter(e["user_id"] for e in events)
        
        return {
            "total_events": len(events),
            "unique_users": len(user_events),
            "events_per_user": len(events) / len(user_events) if user_events else 0
        }
    
    @task
    def save_to_warehouse(metrics: dict, **context):
        """결과를 데이터 웨어하우스에 저장"""
        from airflow.providers.postgres.hooks.postgres import PostgresHook
        
        date = context["data_interval_start"].strftime("%Y-%m-%d")
        hook = PostgresHook(postgres_conn_id="analytics_db")
        
        hook.run(f"""
            INSERT INTO daily_metrics (date, total_events, unique_users, events_per_user)
            VALUES ('{date}', {metrics['total_events']}, {metrics['unique_users']}, {metrics['events_per_user']})
            ON CONFLICT (date) DO UPDATE SET
                total_events = EXCLUDED.total_events,
                unique_users = EXCLUDED.unique_users,
                events_per_user = EXCLUDED.events_per_user
        """)
    
    @task
    def notify_slack(metrics: dict):
        """Slack 알림 전송"""
        from airflow.providers.slack.hooks.slack import SlackHook
        
        hook = SlackHook(slack_conn_id="slack")
        hook.send(
            channel="#data-alerts",
            text=f"📊 Daily Metrics: {metrics['unique_users']} users, {metrics['total_events']} events"
        )
    
    # 의존성 정의
    events = extract_users()
    metrics = calculate_metrics(events)
    save_to_warehouse(metrics)
    notify_slack(metrics)

daily_user_analytics()
```

---

## 정리

```mermaid
mindmap
  root((Airflow<br/>핵심 개념))
    왜 Airflow?
      의존성 관리
      실패 처리
      백필
      모니터링
    아키텍처
      Webserver
      Scheduler
      Worker
      Metadata DB
    DAG
      방향성 그래프
      순환 없음
      Task들의 모음
    Operator/Task
      Operator: 무엇을
      Task: 인스턴스
      의존성 정의
    TaskFlow API
      @task 데코레이터
      자동 XCom
      깔끔한 코드
    스케줄링
      Data Interval
      Catchup
      Backfill
```

---

## 다음 편 예고

**7편: Airflow 실전**에서는 프로덕션 운영을 다룹니다:

- DAG 모듈화 전략
- 동적 Task 생성
- 테스트 방법
- 에러 처리와 알림
- 모니터링

---

## 참고 자료

- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [TaskFlow API Tutorial](https://airflow.apache.org/docs/apache-airflow/stable/tutorial/taskflow.html)
- Astronomer, "Airflow Best Practices"
- "Data Pipelines with Apache Airflow" (Manning)
