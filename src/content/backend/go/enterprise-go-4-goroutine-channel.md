---
public: true
title: "Enterprise Go 시리즈 #4: Goroutine과 Channel 실전 활용"
date: '2026-01-01'
category: Backend
tags: [Go, Goroutine, Channel, Concurrency, errgroup, Enterprise]
excerpt: "Fearless Concurrency 패턴으로 Goroutine과 Channel을 안전하게 사용하고, errgroup으로 동시 작업을 관리하는 설계 원칙을 다룹니다."
---

# Enterprise Go 시리즈 #4: Goroutine과 Channel 실전 활용

## 개요

Go의 동시성 모델은 **CSP(Communicating Sequential Processes)** 에 기반합니다.

> **"메모리를 공유하여 통신하지 말고, 통신하여 메모리를 공유하라."**

### 핵심 질문

- Goroutine을 무한정 생성해도 되나?
- 에러가 발생하면 나머지 작업은 어떻게 되나?
- Goroutine 누수를 어떻게 방지하나?

---

## Goroutine의 실체

```mermaid
graph TB
    subgraph "OS Thread"
        T1[Thread 1]
        T2[Thread 2]
    end
    
    subgraph "Goroutines"
        G1[G1]
        G2[G2]
        G3[G3]
        G4[G4]
        G5[G5]
        G6[G6]
    end
    
    T1 --> G1
    T1 --> G2
    T1 --> G3
    T2 --> G4
    T2 --> G5
    T2 --> G6
    
    style G1 fill:#c8e6c9
    style G2 fill:#c8e6c9
    style G3 fill:#c8e6c9
    style G4 fill:#c8e6c9
    style G5 fill:#c8e6c9
    style G6 fill:#c8e6c9
```

| 특성 | OS Thread | Goroutine |
|------|-----------|-----------|
| 스택 크기 | ~1MB (고정) | ~2KB (가변) |
| 생성 비용 | 높음 | 낮음 |
| 스케줄링 | OS | Go 런타임 |
| 수 | 수십~수백 | 수십만 가능 |

---

## 위험: 무제한 Goroutine

### 문제 상황

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Goroutines
    
    loop 요청마다
        Client->>Server: Request
        Server->>Goroutines: go handle()
    end
    
    Note over Goroutines: 10,000개 누적...
    Note over Server: OOM 발생!
```

### 경험담

> 이미지 처리 서버에서 요청마다 Goroutine을 생성했더니, 트래픽 급증 시 OOM으로 다운

### 해결: Worker Pool

```mermaid
flowchart LR
    JOBS[Job Queue] --> W1[Worker 1]
    JOBS --> W2[Worker 2]
    JOBS --> W3[Worker 3]
    JOBS --> W4[Worker N]
    
    W1 --> RESULTS[Result Queue]
    W2 --> RESULTS
    W3 --> RESULTS
    W4 --> RESULTS
```

**원칙**: Goroutine 수는 **제한**해야 함

---

## Channel 설계

### Buffered vs Unbuffered

```mermaid
graph TB
    subgraph Unbuffered
        A1[Sender] -->|블록| B1[Receiver]
        style A1 fill:#fff3e0
        style B1 fill:#fff3e0
    end
    
    subgraph Buffered
        A2[Sender] -->|버퍼| BUF[Buffer N]
        BUF --> B2[Receiver]
        style A2 fill:#e3f2fd
        style BUF fill:#e3f2fd
        style B2 fill:#e3f2fd
    end
```

| 타입 | 사용 시점 |
|------|----------|
| **Unbuffered** | 동기화가 필요할 때, 핸드쉐이크 |
| **Buffered** | 비동기 처리, 백프레셔 |

### 닫기 원칙

```mermaid
graph LR
    P[Producer] -->|"close(ch)"| CH[Channel]
    CH --> C1[Consumer 1]
    CH --> C2[Consumer 2]
    
    style P fill:#c8e6c9
```

**규칙**: Channel을 닫는 것은 **Producer의 책임**

---

## errgroup: 핵심 도구

### 문제 상황

```mermaid
graph TD
    MAIN[Main] --> G1[Goroutine 1]
    MAIN --> G2[Goroutine 2]
    MAIN --> G3[Goroutine 3]
    
    G2 -->|에러 발생| ERR[Error?]
    
    G1 -->|계속 실행...| W1[낭비]
    G3 -->|계속 실행...| W2[낭비]
    
    style ERR fill:#ffcdd2
    style W1 fill:#ffcdd2
    style W2 fill:#ffcdd2
```

### errgroup 해결

```mermaid
sequenceDiagram
    participant Main
    participant G1 as Goroutine 1
    participant G2 as Goroutine 2
    participant G3 as Goroutine 3
    
    Main->>G1: g.Go(fn1)
    Main->>G2: g.Go(fn2)
    Main->>G3: g.Go(fn3)
    
    G2->>Main: return error
    Note over Main: Context 취소
    
    G1-->>Main: ctx.Done() 감지, 종료
    G3-->>Main: ctx.Done() 감지, 종료
    
    Main->>Main: g.Wait() 리턴
```

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **에러 전파** | 첫 에러 발생 시 Wait()에서 반환 |
| **Context 취소** | 에러 시 모든 Goroutine에 취소 신호 |
| **SetLimit** | 동시 실행 Goroutine 수 제한 |

---

## Fan-out / Fan-in

### 패턴

```mermaid
flowchart LR
    subgraph Fan-out
        IN[Input] --> W1[Worker 1]
        IN --> W2[Worker 2]
        IN --> W3[Worker 3]
    end
    
    subgraph Fan-in
        W1 --> OUT[Output]
        W2 --> OUT
        W3 --> OUT
    end
```

### 사용 시점

| 패턴 | 사용 시점 |
|------|----------|
| **Fan-out** | CPU 집약적 작업 병렬화 |
| **Fan-in** | 여러 소스의 결과 합치기 |
| **Pipeline** | 단계별 처리 (transform → filter → aggregate) |

---

## Mutex vs Channel

### 선택 기준

```mermaid
graph TD
    Q{상태를 보호? vs 통신?}
    Q -->|상태 보호| MUTEX[sync.Mutex]
    Q -->|데이터 전달| CHANNEL[Channel]
    
    MUTEX --> M1[카운터]
    MUTEX --> M2[캐시]
    MUTEX --> M3[설정값]
    
    CHANNEL --> C1[작업 분배]
    CHANNEL --> C2[결과 수집]
    CHANNEL --> C3[이벤트 전파]
```

---

## Goroutine 누수 방지

### 누수 패턴

```mermaid
graph TD
    subgraph "누수 원인"
        A[Channel 수신 대기<br/>but 송신자 없음]
        B[Channel 송신 대기<br/>but 수신자 없음]
        C[무한 루프<br/>종료 조건 없음]
    end
    
    style A fill:#ffcdd2
    style B fill:#ffcdd2
    style C fill:#ffcdd2
```

### 방지 패턴

```mermaid
graph LR
    subgraph "해결책"
        S1[Context 취소 확인]
        S2[Channel 닫기]
        S3[select with default]
    end
    
    style S1 fill:#c8e6c9
    style S2 fill:#c8e6c9
    style S3 fill:#c8e6c9
```

---

## Race Detector

### 사용법

```bash
go test -race ./...
go build -race ./cmd/myapp
```

### 발견되는 문제

```mermaid
graph LR
    G1[Goroutine 1] -->|Write| VAR[공유 변수]
    G2[Goroutine 2] -->|Write| VAR
    
    VAR -->|Race!| ERR[Undefined Behavior]
    
    style ERR fill:#ffcdd2
```

**원칙**: CI에서 `-race` 필수!

---

## 정리: 체크리스트

| 항목 | 확인 |
|------|------|
| Goroutine 수가 제한되어 있는가? | ☐ |
| errgroup으로 에러 전파하는가? | ☐ |
| Context 취소를 확인하는가? | ☐ |
| Channel 닫기 책임이 명확한가? | ☐ |
| Race Detector로 테스트하는가? | ☐ |

---

## 다음 편 예고

**5편: 데이터베이스 연동 패턴**에서는:

- 트랜잭션 관리 전략
- sessionCtx 패턴
- Connection Pool 튜닝

을 다룹니다.

---

## 참고 자료

- [Go Concurrency Patterns](https://talks.golang.org/2012/concurrency.slide)
- [errgroup Package](https://pkg.go.dev/golang.org/x/sync/errgroup)
