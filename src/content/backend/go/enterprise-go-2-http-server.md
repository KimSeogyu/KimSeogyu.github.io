---
public: true
title: "Enterprise Go 시리즈 #2: 견고한 HTTP 서버 구축"
date: '2026-01-01'
category: Backend
tags: [Go, Echo, HTTP, Middleware, Graceful Shutdown, Enterprise]
excerpt: "Echo 프레임워크로 미들웨어 체인, 에러 핸들링, Graceful Shutdown을 갖춘 프로덕션급 HTTP 서버를 설계하는 원칙을 다룹니다."
---

# Enterprise Go 시리즈 #2: 견고한 HTTP 서버 구축

## 개요

[1편](/blog/backend/go/enterprise-go-1-project-structure)에서 설계한 Hexagonal Architecture의 **HTTP Port**를 구현합니다.

### 핵심 질문

- Middleware는 어떤 순서로 쌓아야 하나?
- 에러 응답을 일관되게 만들려면?
- 서버를 안전하게 종료하려면?

---

## 미들웨어 체인 설계

### 실행 순서의 중요성

```mermaid
sequenceDiagram
    participant Client
    participant Recover
    participant RequestID
    participant Logger
    participant Auth
    participant Handler
    
    Client->>Recover: Request
    Recover->>RequestID: 
    RequestID->>Logger: 
    Logger->>Auth: 
    Auth->>Handler: 
    Handler-->>Auth: Response
    Auth-->>Logger: 
    Logger-->>RequestID: 
    RequestID-->>Recover: 
    Recover-->>Client: 
```

### 권장 순서와 이유

| 순서 | 미들웨어 | 역할 | 왜 이 위치? |
|------|---------|------|------------|
| 1 | **Recover** | 패닉 복구 | 모든 패닉을 잡아야 함 |
| 2 | **Request ID** | 추적 ID 생성 | 로깅 전에 ID 필요 |
| 3 | **Logger** | 요청 로깅 | 인증 실패도 로깅 필요 |
| 4 | **CORS** | 교차 출처 허용 | 인증 전에 preflight 처리 |
| 5 | **Auth** | 인증 검증 | 핸들러 보호 |

### 경험담: 순서가 잘못되면?

> Recover를 Auth 뒤에 두었더니, 인증 로직에서 패닉 발생 시 500 응답 대신 연결이 끊겼습니다.

> Logger를 RequestID 앞에 두었더니, 로그에 Request ID가 누락되어 추적이 불가능했습니다.

---

## 에러 핸들링 전략

### 문제: 일관성 없는 에러 응답

```mermaid
graph TD
    A[Handler A] -->|"400 Bad Request"| R1["{ error: 'invalid' }"]
    B[Handler B] -->|"400 Bad Request"| R2["{ message: 'bad input' }"]
    C[Handler C] -->|"400 Bad Request"| R3["{ err: 'wrong format' }"]
```

클라이언트가 에러 처리하기 어려움!

### 해결: 표준 에러 응답 구조

```mermaid
graph TD
    subgraph 표준 에러 응답
        CODE[code: 'VALIDATION_ERROR']
        MSG[message: '이메일 형식이 올바르지 않습니다']
        DETAILS[details: ['email' 필드 오류]]
    end
```

### 도메인 에러 → HTTP 에러 매핑

```mermaid
flowchart LR
    subgraph Domain Errors
        E1[ErrNotFound]
        E2[ErrValidation]
        E3[ErrUnauthorized]
        E4[기타 에러]
    end
    
    subgraph HTTP Status
        S1[404 Not Found]
        S2[400 Bad Request]
        S3[401 Unauthorized]
        S4[500 Internal Server Error]
    end
    
    E1 --> S1
    E2 --> S2
    E3 --> S3
    E4 --> S4
```

### 설계 원칙

1. **도메인 레이어는 HTTP를 모름** - 순수 Go error 반환
2. **Handler가 변환** - 도메인 에러 → HTTP 응답
3. **500 에러만 로깅** - 4xx는 클라이언트 잘못

---

## Graceful Shutdown

### 왜 필요한가?

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB
    
    Client->>Server: POST /order (처리 중)
    Note over Server: SIGTERM 수신
    Server->>Server: 즉시 종료 ❌
    Client->>Server: 연결 끊김
    Note over DB: 트랜잭션 미완료
```

### 올바른 Shutdown 흐름

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant NewClient
    participant DB
    
    Client->>Server: POST /order (처리 중)
    Note over Server: SIGTERM 수신
    Server->>Server: 새 요청 거부
    NewClient-xServer: 503 Service Unavailable
    Server->>DB: 트랜잭션 완료
    Server-->>Client: 200 OK
    Note over Server: 안전하게 종료
```

### 핵심 원칙

| 단계 | 설명 |
|------|------|
| 1. 신호 수신 | SIGTERM, SIGINT 감지 |
| 2. 새 요청 거부 | Health check → unhealthy |
| 3. 진행 중 요청 완료 | 타임아웃 설정 (30초 권장) |
| 4. 리소스 정리 | DB 연결, 파일 핸들 닫기 |
| 5. 종료 | exit 0 |

---

## Handler 설계 패턴

### 역할 분리

```mermaid
graph LR
    subgraph Handler 책임
        A[Request 바인딩]
        B[Validation]
        C[UseCase 호출]
        D[Response 변환]
    end
    
    subgraph Handler가 하면 안 되는 것
        X1[비즈니스 로직]
        X2[DB 직접 접근]
        X3[외부 API 호출]
    end
    
    style X1 fill:#ffcdd2
    style X2 fill:#ffcdd2
    style X3 fill:#ffcdd2
```

### DTO 변환 흐름

```mermaid
flowchart LR
    REQ[HTTP Request] --> DTO_IN[Request DTO]
    DTO_IN --> CMD[Command/Query]
    CMD --> USECASE[UseCase]
    USECASE --> ENTITY[Domain Entity]
    ENTITY --> DTO_OUT[Response DTO]
    DTO_OUT --> RES[HTTP Response]
```

---

## 라우트 그룹 설계

### 인증 레벨별 그룹

```mermaid
graph TB
    ROOT["/api/v1"]
    
    ROOT --> PUBLIC[Public<br/>인증 불필요]
    ROOT --> PROTECTED[Protected<br/>인증 필요]
    ROOT --> ADMIN[Admin<br/>관리자 권한]
    
    PUBLIC --> P1["POST /auth/login"]
    PUBLIC --> P2["POST /auth/register"]
    
    PROTECTED --> PR1["GET /users/me"]
    PROTECTED --> PR2["PUT /users/me"]
    
    ADMIN --> A1["GET /admin/users"]
    ADMIN --> A2["DELETE /admin/users/:id"]
```

### 원칙

- **최소 권한**: 기본은 인증 필요, Public은 명시적으로
- **버전 관리**: `/api/v1`, `/api/v2` 병행 가능
- **일관된 네이밍**: REST 규칙 준수

---

## 정리: 체크리스트

| 항목 | 확인 |
|------|------|
| Recover가 가장 바깥에 있는가? | ☐ |
| Request ID가 로깅 전에 생성되는가? | ☐ |
| 에러 응답 포맷이 통일되어 있는가? | ☐ |
| Graceful Shutdown이 구현되어 있는가? | ☐ |
| Handler에 비즈니스 로직이 없는가? | ☐ |

---

## 다음 편 예고

**3편: Context로 요청 생명주기 관리**에서는:

- Context 전파 패턴
- 타임아웃 설정 전략
- Request ID / Trace ID 관리

를 다룹니다.

---

## 참고 자료

- [Echo 공식 문서](https://echo.labstack.com/)
- [Graceful Shutdown in Go](https://pkg.go.dev/net/http#Server.Shutdown)
