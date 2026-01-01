---
public: true
title: "Enterprise Go 시리즈 #7: 테스트 전략과 실전"
date: '2026-01-01'
category: Backend
tags: [Go, Testing, gomock, Testcontainers, Ginkgo, BDD, Enterprise]
excerpt: "gomock으로 Mock을 생성하고, Testcontainers로 통합 테스트를 구축하며, Ginkgo BDD 스타일로 가독성 높은 테스트를 작성하는 전략을 다룹니다."
---

# Enterprise Go 시리즈 #7: 테스트 전략과 실전

## 개요

엔터프라이즈 애플리케이션의 테스트 전략을 설계합니다.

### 핵심 질문

- 유닛 테스트와 통합 테스트의 경계는?
- Mock을 어디까지 사용할 것인가?
- 테스트 가독성을 어떻게 높일 것인가?

---

## 테스트 피라미드

```mermaid
graph TB
    subgraph "테스트 피라미드"
        E2E[E2E 테스트<br/>적게]
        INT[통합 테스트<br/>적당히]
        UNIT[유닛 테스트<br/>많이]
    end
    
    E2E --> INT
    INT --> UNIT
    
    style UNIT fill:#c8e6c9
    style INT fill:#fff3e0
    style E2E fill:#ffcdd2
```

| 레벨 | 특징 | 도구 |
|------|------|------|
| **Unit** | 빠름, 고립됨, 많이 | gomock |
| **Integration** | 느림, 실제 의존성 | Testcontainers |
| **E2E** | 가장 느림, 전체 시스템 | Ginkgo + HTTP Client |

---

## gomock: 유닛 테스트

### Mock의 역할

```mermaid
graph LR
    subgraph "테스트 대상"
        USECASE[UseCase]
    end
    
    subgraph "Mock"
        MOCK_REPO[MockRepository]
        MOCK_CLIENT[MockExternalClient]
    end
    
    USECASE --> MOCK_REPO
    USECASE --> MOCK_CLIENT
    
    style MOCK_REPO fill:#e3f2fd
    style MOCK_CLIENT fill:#e3f2fd
```

### Mock vs Stub vs Fake

| 종류 | 설명 | 예시 |
|------|------|------|
| **Mock** | 호출 검증, 반환값 설정 | gomock |
| **Stub** | 고정 반환값 | 직접 구현 |
| **Fake** | 간단한 구현체 | In-memory DB |

### 언제 Mock을 쓰나?

```mermaid
graph TD
    Q{외부 의존성?}
    Q -->|DB| OPT1{테스트 속도 중요?}
    Q -->|외부 API| MOCK[Mock 사용]
    Q -->|메시지 큐| MOCK
    
    OPT1 -->|빠르게| MOCK
    OPT1 -->|정확하게| CONTAINER[Testcontainers]
    
    style MOCK fill:#e3f2fd
    style CONTAINER fill:#fff3e0
```

---

## Testcontainers: 통합 테스트

### 왜 필요한가?

```mermaid
graph LR
    subgraph "Mock의 한계"
        M1[SQL 문법 오류 못 잡음]
        M2[트랜잭션 동작 다름]
        M3[인덱스 성능 모름]
    end
    
    style M1 fill:#ffcdd2
    style M2 fill:#ffcdd2
    style M3 fill:#ffcdd2
```

### 동작 원리

```mermaid
sequenceDiagram
    participant Test
    participant Testcontainers
    participant Docker
    participant DB
    
    Test->>Testcontainers: 컨테이너 요청
    Testcontainers->>Docker: 이미지 Pull & Run
    Docker->>DB: PostgreSQL 시작
    DB-->>Testcontainers: Ready
    Testcontainers-->>Test: Connection String
    
    Test->>DB: 테스트 실행
    
    Test->>Testcontainers: 정리
    Testcontainers->>Docker: 컨테이너 삭제
```

### 사용 시점

| 상황 | 추천 |
|------|------|
| Repository 레이어 테스트 | Testcontainers |
| 복잡한 SQL 검증 | Testcontainers |
| UseCase 비즈니스 로직 | Mock |
| 외부 API 호출 로직 | Mock |

---

## Ginkgo: BDD 스타일

### 왜 BDD인가?

```mermaid
graph TD
    subgraph "기존 테스트 이름"
        T1["TestUserService_GetByID_ReturnsUser"]
        T2["TestUserService_GetByID_ReturnsError"]
    end
    
    subgraph "BDD 스타일"
        B1["Describe: UserService"]
        B2["  Context: GetByID 호출 시"]
        B3["    Context: 사용자가 존재하면"]
        B4["      It: 사용자 정보를 반환한다"]
    end
    
    style B1 fill:#e8f5e9
    style B2 fill:#e8f5e9
    style B3 fill:#e8f5e9
    style B4 fill:#e8f5e9
```

### Ginkgo 구조

```mermaid
graph TB
    DESCRIBE["Describe('UserService')"]
    
    DESCRIBE --> BEFORE["BeforeEach<br/>테스트 설정"]
    DESCRIBE --> CONTEXT1["Context('존재하는 사용자')"]
    DESCRIBE --> CONTEXT2["Context('존재하지 않는 사용자')"]
    
    CONTEXT1 --> IT1["It('정보를 반환한다')"]
    CONTEXT2 --> IT2["It('에러를 반환한다')"]
    
    DESCRIBE --> AFTER["AfterEach<br/>정리"]
```

### 장점

| 기존 | Ginkgo |
|------|--------|
| 테스트 이름으로 의도 표현 | 계층 구조로 의도 표현 |
| 중복 setup 코드 | BeforeEach로 공유 |
| 한 파일에 관련 없는 테스트 | Context로 그룹화 |

---

## 테스트 분리 전략

### 라벨 활용

```mermaid
graph TD
    ALL[전체 테스트]
    
    ALL --> UNIT["라벨: !integration<br/>유닛 테스트"]
    ALL --> INT["라벨: integration<br/>통합 테스트"]
    
    UNIT -->|빠름| CI_PR[PR 검증]
    INT -->|느림| CI_MAIN[Main 브랜치]
```

| 명령 | 용도 |
|------|------|
| `ginkgo --label-filter="!integration"` | PR 빌드 (빠르게) |
| `ginkgo --label-filter="integration"` | 통합 테스트만 |
| `ginkgo -r` | 전체 |

---

## 테스트 설계 원칙

### AAA 패턴

```mermaid
graph LR
    A[Arrange<br/>준비] --> A2[Act<br/>실행]
    A2 --> A3[Assert<br/>검증]
```

### 좋은 테스트의 특성

| 특성 | 설명 |
|------|------|
| **Fast** | 빨리 끝나야 자주 실행 |
| **Isolated** | 다른 테스트에 영향 없음 |
| **Repeatable** | 몇 번 실행해도 같은 결과 |
| **Self-validating** | 성공/실패가 명확 |

---

## 정리: 체크리스트

| 항목 | 확인 |
|------|------|
| UseCase는 Mock으로 테스트하는가? | ☐ |
| Repository는 실제 DB로 테스트하는가? | ☐ |
| 테스트가 CI에서 라벨로 분리되는가? | ☐ |
| BDD 스타일로 의도가 명확한가? | ☐ |

---

## 다음 편 예고

**8편: Observability와 Debugging**에서는:

- 구조화된 로깅 (slog)
- Metrics (Prometheus)
- 분산 추적 (OpenTelemetry)

을 다룹니다.

---

## 참고 자료

- [uber/mock](https://github.com/uber-go/mock)
- [Testcontainers Go](https://golang.testcontainers.org/)
- [Ginkgo](https://onsi.github.io/ginkgo/)
