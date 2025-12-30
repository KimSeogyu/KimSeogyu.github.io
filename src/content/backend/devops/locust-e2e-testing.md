---
public: true
title: Locust 기반 환경별 E2E 테스트 자동화
date: '2025-12-30'
category: Backend
tags: [Testing, E2E, Locust, Python, Performance, Load Testing, Kubernetes]
excerpt: "Locust를 활용하여 개발부터 프로덕션까지 환경별 E2E 테스트를 자동화하고 Kubernetes에서 실행하는 방법을 알아봅니다."
---
# Locust 기반 환경별 E2E 테스트 자동화

## 개요

**Locust**는 Python 기반의 오픈소스 부하 테스트 도구입니다. 코드로 테스트 시나리오를 작성하고, 다양한 환경(INT/STAGE/PROD)에서 일관된 E2E 테스트를 실행할 수 있습니다.

## 왜 Locust인가?

### 장점

| 특성 | 설명 |
|------|------|
| **코드 기반** | Python으로 복잡한 시나리오 작성 |
| **분산 실행** | 여러 워커로 대규모 부하 생성 |
| **실시간 모니터링** | Web UI로 실시간 메트릭 확인 |
| **유연성** | 다양한 프로토콜 지원 (HTTP, gRPC 등) |
| **Kubernetes 친화** | Job/Pod으로 쉽게 배포 |

### 단점

| 특성 | 설명 |
|------|------|
| **Python 의존** | Python 환경 필요 |
| **초기 설정** | 복잡한 시나리오는 코드 작성 필요 |

## 프로젝트 구조

```
e2e/
├── .python-version          # Python 버전
├── pyproject.toml           # 의존성 정의
├── Makefile                 # 실행 스크립트
├── config/
│   ├── local.yaml           # 로컬 환경 설정
│   ├── int.yaml             # 통합 환경 설정
│   ├── stage.yaml           # 스테이지 설정
│   └── prod.yaml            # 프로덕션 설정
├── suites/
│   ├── smoke.py             # 스모크 테스트
│   ├── functional.py        # 기능 테스트
│   ├── performance.py       # 성능 테스트
│   └── stress.py            # 스트레스 테스트
├── utils/
│   ├── client.py            # API 클라이언트
│   └── data_generator.py    # 테스트 데이터 생성
└── locustfile.py            # 메인 진입점
```

## 설정 파일

### pyproject.toml

```toml
[project]
name = "e2e-tests"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "locust>=2.20.0",
    "pyyaml>=6.0",
    "grpcio>=1.60.0",
    "grpcio-tools>=1.60.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=8.0.0",
]
```

### 환경별 설정

```yaml
# config/int.yaml
environment: int
base_url: https://api-int.example.com
grpc_host: grpc-int.example.com:443

settings:
  default_timeout: 30
  max_retries: 3

test_data:
  collection_prefix: "e2e_test_"
  cleanup_after: true
```

## 테스트 스위트 구현

### 기본 클라이언트

```python
# utils/client.py
from typing import Any
import grpc
from locust import events

class APIClient:
    def __init__(self, base_url: str, timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
    
    def create_document(self, collection: str, uri: str, fields: dict) -> dict:
        """문서를 생성합니다."""
        response = self._post(
            f"/v1beta/collections/{collection}/documents",
            json={
                "document": {
                    "uri": uri,
                    "fields": fields
                }
            }
        )
        return response.json()
    
    def get_document(self, collection: str, uri: str) -> dict:
        """문서를 조회합니다."""
        response = self._get(f"/v1beta/collections/{collection}/documents/{uri}")
        return response.json()
    
    def update_document(self, collection: str, uri: str, fields: dict) -> dict:
        """문서를 업데이트합니다."""
        response = self._patch(
            f"/v1beta/collections/{collection}/documents/{uri}",
            json={"fields": fields}
        )
        return response.json()
    
    def delete_document(self, collection: str, uri: str) -> bool:
        """문서를 삭제합니다."""
        response = self._delete(f"/v1beta/collections/{collection}/documents/{uri}")
        return response.json().get("success", False)
```

### 스모크 테스트

빠른 헬스체크 및 기본 기능 확인:

```python
# suites/smoke.py
from locust import HttpUser, task, between
import uuid

class SmokeTestUser(HttpUser):
    """30초 내 핵심 기능 검증"""
    
    wait_time = between(0.5, 1)
    
    def on_start(self):
        """테스트 시작 전 초기화"""
        self.collection = f"smoke_test_{uuid.uuid4().hex[:8]}"
        self.created_docs = []
    
    @task(3)
    def create_and_get_document(self):
        """문서 생성 및 조회 테스트"""
        doc_uri = f"doc-{uuid.uuid4().hex[:8]}"
        
        # 생성
        with self.client.post(
            f"/v1beta/collections/{self.collection}/documents",
            json={
                "document": {
                    "uri": doc_uri,
                    "fields": {"test": True, "timestamp": str(time.time())}
                }
            },
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self.created_docs.append(doc_uri)
                response.success()
            else:
                response.failure(f"Create failed: {response.text}")
        
        # 조회
        with self.client.get(
            f"/v1beta/collections/{self.collection}/documents/{doc_uri}",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if data.get("document", {}).get("uri") == doc_uri:
                    response.success()
                else:
                    response.failure("URI mismatch")
            else:
                response.failure(f"Get failed: {response.text}")
    
    @task(1)
    def health_check(self):
        """헬스체크"""
        self.client.get("/ready")
    
    def on_stop(self):
        """테스트 종료 후 정리"""
        for uri in self.created_docs:
            self.client.delete(f"/v1beta/collections/{self.collection}/documents/{uri}")
```

### 기능 테스트

CRUD 전체 흐름 및 엣지 케이스:

```python
# suites/functional.py
from locust import HttpUser, task, between, SequentialTaskSet
import uuid

class DocumentCRUDFlow(SequentialTaskSet):
    """순차적 CRUD 플로우 테스트"""
    
    def on_start(self):
        self.doc_uri = f"crud-test-{uuid.uuid4().hex[:8]}"
        self.version = 0
    
    @task
    def step1_create(self):
        """1. 문서 생성"""
        response = self.client.post(
            f"/v1beta/collections/functional_test/documents",
            json={
                "document": {
                    "uri": self.doc_uri,
                    "fields": {"step": 1, "status": "created"}
                }
            }
        )
        if response.status_code == 200:
            self.version = response.json()["document"]["version"]
    
    @task
    def step2_read(self):
        """2. 문서 조회"""
        response = self.client.get(
            f"/v1beta/collections/functional_test/documents/{self.doc_uri}"
        )
        assert response.json()["document"]["version"] == self.version
    
    @task
    def step3_update(self):
        """3. 문서 업데이트"""
        response = self.client.patch(
            f"/v1beta/collections/functional_test/documents/{self.doc_uri}",
            json={
                "fields": {"step": 2, "status": "updated"},
                "expected_version": self.version
            }
        )
        if response.status_code == 200:
            self.version = response.json()["document"]["version"]
    
    @task
    def step4_verify_history(self):
        """4. 히스토리 확인"""
        response = self.client.get(
            f"/v1beta/collections/functional_test/documents/{self.doc_uri}/history"
        )
        history = response.json()["documents"]
        assert len(history) == 2  # 버전 1, 2
    
    @task
    def step5_delete(self):
        """5. 문서 삭제"""
        response = self.client.delete(
            f"/v1beta/collections/functional_test/documents/{self.doc_uri}"
        )
        assert response.json()["success"] == True
        self.interrupt()  # 플로우 종료


class FunctionalTestUser(HttpUser):
    wait_time = between(1, 3)
    tasks = [DocumentCRUDFlow]
```

### 성능/스트레스 테스트

```python
# suites/performance.py
from locust import HttpUser, task, between, LoadTestShape
import uuid

class PerformanceTestUser(HttpUser):
    """고부하 성능 테스트"""
    
    wait_time = between(0.1, 0.5)  # 빠른 요청
    
    @task(5)
    def batch_create(self):
        """배치 생성"""
        docs = [
            {"uri": f"perf-{uuid.uuid4().hex[:8]}", "fields": {"batch": True}}
            for _ in range(10)
        ]
        self.client.post(
            "/v1beta/collections/perf_test/documents:batchCreate",
            json={"documents": docs}
        )
    
    @task(10)
    def query_documents(self):
        """쿼리 테스트"""
        self.client.post(
            "/v1beta/collections/perf_test/documents:query",
            json={
                "query": {"filter": {}},
                "page_size": 100
            }
        )


class StressTestShape(LoadTestShape):
    """점진적 부하 증가 테스트"""
    
    stages = [
        {"duration": 60, "users": 10, "spawn_rate": 2},    # 램프업
        {"duration": 120, "users": 50, "spawn_rate": 5},   # 유지
        {"duration": 60, "users": 100, "spawn_rate": 10},  # 피크
        {"duration": 60, "users": 50, "spawn_rate": 10},   # 다운
    ]
    
    def tick(self):
        run_time = self.get_run_time()
        
        for stage in self.stages:
            if run_time < stage["duration"]:
                return (stage["users"], stage["spawn_rate"])
            run_time -= stage["duration"]
        
        return None  # 테스트 종료
```

### 메인 진입점

```python
# locustfile.py
import os
import yaml
from locust import events

from suites.smoke import SmokeTestUser
from suites.functional import FunctionalTestUser
from suites.performance import PerformanceTestUser

# 환경 설정 로드
def load_config():
    env = os.getenv("TEST_ENV", "local")
    config_path = f"config/{env}.yaml"
    
    with open(config_path) as f:
        return yaml.safe_load(f)

CONFIG = load_config()

@events.init.add_listener
def on_locust_init(environment, **kwargs):
    """테스트 초기화"""
    environment.host = CONFIG["base_url"]
    print(f"Testing against: {CONFIG['environment']}")

# 테스트 모드에 따른 User 클래스 선택
TEST_MODE = os.getenv("TEST_MODE", "smoke")

if TEST_MODE == "smoke":
    class User(SmokeTestUser):
        pass
elif TEST_MODE == "functional":
    class User(FunctionalTestUser):
        pass
elif TEST_MODE == "performance":
    class User(PerformanceTestUser):
        pass
```

## Makefile

```makefile
# e2e/Makefile

.PHONY: install smoke functional performance stress

LOCUST_FLAGS = --headless --only-summary

install:
 uv sync

# 스모크 테스트 (30초, 1 사용자)
smoke:
 TEST_MODE=smoke TEST_ENV=$(ENV) locust \
  $(LOCUST_FLAGS) \
  -u 1 -r 1 -t 30s

# 기능 테스트 (5분, 10 사용자)
functional:
 TEST_MODE=functional TEST_ENV=$(ENV) locust \
  $(LOCUST_FLAGS) \
  -u 10 -r 2 -t 300s

# 성능 테스트 (10분, 50 사용자)
performance:
 TEST_MODE=performance TEST_ENV=$(ENV) locust \
  $(LOCUST_FLAGS) \
  -u 50 -r 5 -t 600s

# 스트레스 테스트 (10분, 100 사용자)
stress:
 TEST_MODE=stress TEST_ENV=$(ENV) locust \
  $(LOCUST_FLAGS) \
  -u 100 -r 10 -t 600s

# 인터랙티브 모드 (Web UI)
interactive:
 TEST_MODE=$(MODE) TEST_ENV=$(ENV) locust

# 환경별 실행
test-local:
 $(MAKE) smoke ENV=local

test-int:
 $(MAKE) functional ENV=int

test-stage:
 $(MAKE) performance ENV=stage
```

## Kubernetes 배포

### ConfigMap

```yaml
# k8s/tests/locust/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: locust-test-config
data:
  test_mode: "smoke"
  test_env: "int"
  users: "10"
  spawn_rate: "2"
  duration: "300s"
```

### Job

```yaml
# k8s/tests/locust/job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: locust-e2e-test
spec:
  ttlSecondsAfterFinished: 86400
  template:
    spec:
      containers:
        - name: locust
          image: myregistry/e2e-tests:latest
          command:
            - locust
            - --headless
            - --only-summary
            - -u
            - $(USERS)
            - -r
            - $(SPAWN_RATE)
            - -t
            - $(DURATION)
          env:
            - name: TEST_MODE
              valueFrom:
                configMapKeyRef:
                  name: locust-test-config
                  key: test_mode
            - name: TEST_ENV
              valueFrom:
                configMapKeyRef:
                  name: locust-test-config
                  key: test_env
            - name: USERS
              valueFrom:
                configMapKeyRef:
                  name: locust-test-config
                  key: users
            - name: SPAWN_RATE
              valueFrom:
                configMapKeyRef:
                  name: locust-test-config
                  key: spawn_rate
            - name: DURATION
              valueFrom:
                configMapKeyRef:
                  name: locust-test-config
                  key: duration
      restartPolicy: Never
  backoffLimit: 0
```

### 환경별 실행

```bash
# INT 환경 스모크 테스트
kubectl -n testing patch configmap locust-test-config \
  --type=merge -p '{"data":{"test_mode":"smoke","test_env":"int","users":"1","duration":"30s"}}'
kubectl -n testing apply -f k8s/tests/locust/job.yaml

# STAGE 환경 성능 테스트
kubectl -n testing patch configmap locust-test-config \
  --type=merge -p '{"data":{"test_mode":"performance","test_env":"stage","users":"50","duration":"600s"}}'
kubectl delete job locust-e2e-test -n testing --ignore-not-found
kubectl -n testing apply -f k8s/tests/locust/job.yaml

# 로그 확인
kubectl -n testing logs -f job/locust-e2e-test
```

## 프로덕션 테스트 안전 장치

```makefile
# 프로덕션 테스트 (극도로 제한된 설정)
test-prod:
 @echo "⚠️  WARNING: Production test!"
 @read -p "Type 'I understand the risks': " confirm && \
  [ "$$confirm" = "I understand the risks" ] || (echo "Cancelled." && exit 1)
 TEST_MODE=smoke TEST_ENV=prod locust \
  $(LOCUST_FLAGS) \
  -u 1 -r 1 -t 60s  # 1명, 1분만
```

## 모범 사례

1. **환경 분리**: 환경별 설정 파일로 엔드포인트/설정 관리
2. **테스트 데이터 정리**: `on_stop`에서 생성한 데이터 삭제
3. **점진적 부하**: `LoadTestShape`로 급격한 부하 방지
4. **프로덕션 보호**: 프로덕션 테스트는 극도로 제한
5. **결과 저장**: `--csv` 옵션으로 결과 기록

## 참고 자료

- [Locust 공식 문서](https://docs.locust.io/)
- [Locust Kubernetes 배포](https://docs.locust.io/en/stable/running-distributed.html)
- [LoadTestShape 가이드](https://docs.locust.io/en/stable/custom-load-shape.html)
