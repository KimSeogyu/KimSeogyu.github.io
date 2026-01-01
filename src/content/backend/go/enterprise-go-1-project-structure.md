---
public: true
title: "Enterprise Go 시리즈 #1: 프로젝트 설계와 구조화"
date: '2026-01-01'
category: Backend
tags: [Go, Monorepo, Project Layout, Cobra, Wire, DI, Enterprise]
excerpt: "golang-standards/project-layout을 기반으로 엔터프라이즈 Go 프로젝트 구조를 설계합니다."
---

# Enterprise Go 시리즈 #1: 프로젝트 설계와 구조화

> **대상 독자**: Java, Node.js 등 다른 생태계에서 충분한 경험을 쌓은 후 Go로 전환하는 시니어 엔지니어

## 시리즈 소개

| # | 주제 | 다른 언어에서의 대응 개념 |
|---|------|------------------------|
| **1** | 프로젝트 설계 | Maven 멀티모듈, Gradle 컨벤션 |
| 2 | HTTP 서버 | Spring MVC, Express |
| 3 | Context | ThreadLocal, AsyncLocalStorage |
| 4 | 동시성 | ExecutorService, Worker Threads |
| 5 | 데이터베이스 | @Transactional, Sequelize |
| 6 | 외부 통신 | Resilience4j, Polly |
| 7 | 테스트 | JUnit, Jest |
| 8 | Observability | Micrometer, Winston |
| 9 | Makefile | npm scripts, Gradle tasks |

---

## Go 표준 프로젝트 레이아웃

[golang-standards/project-layout](https://github.com/golang-standards/project-layout)은 Go 커뮤니티에서 널리 사용되는 디렉토리 구조입니다.

### 핵심 디렉토리

| 디렉토리 | 역할 | Go 강제 |
|----------|------|--------|
| `/cmd` | 바이너리 진입점 | - |
| `/internal` | **외부 import 불가** | ✅ 컴파일러 강제 |
| `/pkg` | 외부 공개 가능 | - |
| `/api` | OpenAPI, Protobuf 정의 | - |

---

## /cmd: 진입점은 얇게

```
cmd/
├── api/
│   └── main.go
└── worker/
    └── main.go
```

**원칙**: main.go는 **조립만**, 비즈니스 로직은 `/internal`에.

---

## /internal: Go가 강제하는 캡슐화

### Java와 비교

| Java | Go |
|------|-----|
| `package-private` (default) | **`/internal` 디렉토리** |
| 같은 패키지만 접근 | 같은 모듈만 import 가능 |
| 컨벤션 | **컴파일러가 강제** |

### 구조

```
internal/
├── user/           # 도메인별 패키지
│   ├── handler.go
│   ├── service.go
│   └── repository.go
├── order/
└── shared/         # 내부 공유 코드
    └── middleware/
```

---

## /pkg: 외부 공개 (신중하게)

다른 프로젝트에서 import할 수 있는 코드. **정말 공개할 게 아니면 `/internal` 사용**.

```
pkg/
├── logger/
└── errors/
```

---

## 전체 구조

```
project/
├── cmd/                    # 바이너리 진입점
│   ├── api/
│   │   └── main.go
│   └── worker/
│       └── main.go
│
├── internal/               # 외부 import 불가
│   ├── user/
│   ├── order/
│   └── shared/
│
├── pkg/                    # 외부 공개 (선택)
│
├── api/                    # OpenAPI, Protobuf
├── scripts/                # 빌드/배포 스크립트
├── go.work                 # 로컬 모듈 개발용
└── Makefile
```

---

## 도메인별 vs 레이어별 패키지

### 레이어별 (비추천)

```
internal/
├── handler/    # 모든 핸들러
├── service/    # 모든 서비스
└── repository/ # 모든 저장소
```

### 도메인별 (추천) ✅

```
internal/
├── user/       # user 관련 전부
├── order/      # order 관련 전부
└── payment/    # payment 관련 전부
```

**장점**: 관련 코드가 한 곳에, 팀별 담당 가능, 마이크로서비스 분리 용이

---

## Wire: 의존성 조립

```go
// cmd/api/wire.go
func InitializeServer() (*http.Server, error) {
    wire.Build(
        config.ProviderSet,
        user.ProviderSet,
        order.ProviderSet,
        NewServer,
    )
    return nil, nil
}
```

---

## go.work: 로컬 모듈 개발

```go
// go.work
go 1.21

use (
    ./cmd/api
    ./internal/user
    ./pkg/logger
)
```

`replace` 없이 로컬 변경 즉시 반영.

---

## 정리

| 디렉토리 | 역할 | 사용 |
|----------|------|------|
| `/cmd` | 바이너리 진입점 | 필수 |
| `/internal` | 캡슐화된 코드 | 필수 |
| `/pkg` | 외부 공개 | 선택 (신중하게) |
| `/api` | API 정의 | gRPC/OpenAPI 시 |

---

## 다음 편 예고

**2편: 견고한 HTTP 서버 구축**에서는 Echo 미들웨어 설계를 다룹니다.

---

## 참고 자료

- [golang-standards/project-layout](https://github.com/golang-standards/project-layout)
- [Google Wire](https://github.com/google/wire)
