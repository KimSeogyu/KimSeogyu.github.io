---
public: true
title: "Enterprise Go 시리즈 #8: Observability와 Debugging"
date: '2026-01-01'
category: Backend
tags: [Go, Logging, Metrics, Tracing, pprof, Observability, Enterprise]
excerpt: "slog를 활용한 구조화된 로깅, Prometheus 메트릭, OpenTelemetry 트레이싱으로 프로덕션 시스템의 관찰가능성을 설계합니다."
---

# Enterprise Go 시리즈 #8: Observability와 Debugging

## 개요

프로덕션 시스템에서 **Observability(관찰가능성)** 의 3대 요소를 설계합니다.

### 핵심 질문

- 장애 발생 시 원인을 어떻게 파악하나?
- 시스템 상태를 어떻게 모니터링하나?
- 요청 흐름을 어떻게 추적하나?

---

## Observability 3요소

```mermaid
graph TB
    subgraph "Observability"
        LOGS[Logs<br/>무슨 일이 일어났나?]
        METRICS[Metrics<br/>얼마나 일어났나?]
        TRACES[Traces<br/>어디서 일어났나?]
    end
    
    style LOGS fill:#e3f2fd
    style METRICS fill:#fff3e0
    style TRACES fill:#f3e5f5
```

| 요소 | 목적 | 도구 |
|------|------|------|
| **Logs** | 이벤트 기록, 디버깅 | slog |
| **Metrics** | 수치 추이, 알림 | Prometheus |
| **Traces** | 분산 시스템 추적 | OpenTelemetry |

---

## Logging (slog)

### 구조화된 로깅 vs 문자열 로깅

```mermaid
graph LR
    subgraph "❌ 문자열"
        T1["User 123 logged in from 192.168.1.1"]
    end
    
    subgraph "✅ 구조화"
        T2["level: INFO<br/>msg: user logged in<br/>userID: 123<br/>ip: 192.168.1.1"]
    end
    
    T2 --> Q[검색/분석 용이]
    
    style T1 fill:#ffcdd2
    style T2 fill:#c8e6c9
```

### 로그 레벨 설계

```mermaid
graph TB
    DEBUG["DEBUG<br/>개발 시 상세 정보"]
    INFO["INFO<br/>정상 동작 기록"]
    WARN["WARN<br/>잠재적 문제"]
    ERROR["ERROR<br/>실패, 알림 필요"]
    
    DEBUG --> INFO
    INFO --> WARN
    WARN --> ERROR
    
    style ERROR fill:#ffcdd2
    style WARN fill:#fff3e0
    style INFO fill:#e8f5e9
    style DEBUG fill:#e3f2fd
```

| 레벨 | 사용 시점 | 프로덕션 기본 |
|------|----------|--------------|
| DEBUG | 개발/디버깅 | OFF |
| INFO | 정상 흐름 | ON |
| WARN | 복구 가능한 문제 | ON |
| ERROR | 실패, 조치 필요 | ON + 알림 |

### Context 연동

```mermaid
graph LR
    REQ[Request] --> MW[Middleware]
    MW -->|"requestID 주입"| CTX[Context]
    CTX --> HANDLER[Handler]
    HANDLER --> USECASE[UseCase]
    USECASE --> LOG["Logger.Info()<br/>requestID 자동 포함"]
```

---

## Metrics (Prometheus)

### 메트릭 유형

```mermaid
graph TB
    subgraph "Counter"
        C1["http_requests_total: 1000"]
        C2["누적 증가만 가능"]
    end
    
    subgraph "Gauge"
        G1["active_connections: 42"]
        G2["증가/감소 가능"]
    end
    
    subgraph "Histogram"
        H1["request_duration_seconds"]
        H2["분포 측정 (p50, p99)"]
    end
    
    style C1 fill:#e3f2fd
    style G1 fill:#fff3e0
    style H1 fill:#f3e5f5
```

### 핵심 메트릭 (RED)

| 메트릭 | 설명 | 타입 |
|--------|------|------|
| **R**ate | 초당 요청 수 | Counter |
| **E**rrors | 에러율 | Counter |
| **D**uration | 응답 시간 | Histogram |

### 라벨 설계 원칙

```mermaid
graph TD
    Q{라벨 카디널리티?}
    Q -->|낮음| OK["method, path, status"]
    Q -->|높음| BAD["userID, requestID"]
    
    OK --> GOOD[사용 가능]
    BAD --> DANGER[메모리 폭발!]
    
    style OK fill:#c8e6c9
    style BAD fill:#ffcdd2
```

**규칙**: 라벨 값의 조합 수가 수백 개를 넘지 않도록

---

## Tracing (OpenTelemetry)

### 왜 필요한가?

```mermaid
sequenceDiagram
    participant Gateway
    participant UserService
    participant OrderService
    participant PaymentService
    participant DB
    
    Gateway->>UserService: 인증
    Gateway->>OrderService: 주문 생성
    OrderService->>PaymentService: 결제
    PaymentService->>DB: 저장
    
    Note over Gateway,DB: 어디서 느려졌나?
```

### Trace 구조

```mermaid
graph LR
    subgraph "Trace (전체 요청)"
        SPAN1[Span: Gateway<br/>20ms]
        SPAN2[Span: UserService<br/>5ms]
        SPAN3[Span: OrderService<br/>100ms]
        SPAN4[Span: PaymentService<br/>80ms]
    end
    
    SPAN1 --> SPAN2
    SPAN1 --> SPAN3
    SPAN3 --> SPAN4
    
    style SPAN3 fill:#ffcdd2
    style SPAN4 fill:#ffcdd2
```

### 전파 방식

```mermaid
sequenceDiagram
    participant A as Service A
    participant B as Service B
    
    A->>A: Span 시작<br/>traceID: abc123
    A->>B: HTTP 요청<br/>Header: traceparent: abc123-span1
    B->>B: Span 시작<br/>parentID: span1
    B-->>A: 응답
    A->>A: Span 종료
```

---

## pprof: 성능 분석

### 언제 사용하나?

```mermaid
graph TD
    P1[CPU 사용률 높음] --> PPROF[pprof]
    P2[메모리 증가] --> PPROF
    P3[Goroutine 누수 의심] --> PPROF
    
    PPROF --> ANALYZE[분석]
    ANALYZE --> FIX[최적화]
```

### 프로파일 종류

| 프로파일 | 분석 대상 |
|----------|----------|
| CPU | 어떤 함수가 CPU 사용 |
| Heap | 메모리 할당 |
| Goroutine | 활성 Goroutine |
| Block | 블로킹 지점 |
| Mutex | Lock 경쟁 |

---

## Health Check

### Liveness vs Readiness

```mermaid
graph TB
    subgraph "Liveness"
        L1[프로세스가 살아있는가?]
        L2[실패 시 → 재시작]
    end
    
    subgraph "Readiness"
        R1[트래픽 받을 준비 됐는가?]
        R2[실패 시 → 라우팅 제외]
    end
    
    style L1 fill:#e3f2fd
    style R1 fill:#fff3e0
```

| 엔드포인트 | 확인 내용 |
|------------|----------|
| `/health/live` | 프로세스 응답 |
| `/health/ready` | DB 연결, 의존성 상태 |

---

## 통합 아키텍처

```mermaid
graph TB
    APP[Application] -->|Logs| LOKI[Loki]
    APP -->|Metrics| PROM[Prometheus]
    APP -->|Traces| TEMPO[Tempo]
    
    LOKI --> GRAFANA[Grafana]
    PROM --> GRAFANA
    TEMPO --> GRAFANA
    
    style GRAFANA fill:#f3e5f5
```

---

## 정리: 체크리스트

| 항목 | 확인 |
|------|------|
| 구조화된 로깅을 사용하는가? | ☐ |
| Request ID가 로그에 포함되는가? | ☐ |
| RED 메트릭이 수집되는가? | ☐ |
| 분산 추적이 설정되어 있는가? | ☐ |
| Health Check 엔드포인트가 있는가? | ☐ |

---

## 시리즈 마무리

**Enterprise Go 시리즈**를 통해 다룬 내용:

```mermaid
graph LR
    P1[1. 프로젝트 설계] --> P2[2. HTTP 서버]
    P2 --> P3[3. Context]
    P3 --> P4[4. 동시성]
    P4 --> P5[5. 데이터베이스]
    P5 --> P6[6. 외부 통신]
    P6 --> P7[7. 테스트]
    P7 --> P8[8. Observability]
```

이 시리즈가 엔터프라이즈 Go 애플리케이션 구축에 도움이 되길 바랍니다! 🚀

---

## 참고 자료

- [log/slog](https://pkg.go.dev/log/slog)
- [Prometheus Go Client](https://github.com/prometheus/client_golang)
- [OpenTelemetry Go](https://opentelemetry.io/docs/instrumentation/go/)
