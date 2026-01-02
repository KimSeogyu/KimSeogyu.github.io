---
public: true
title: "Enterprise Go 시리즈 #1: 프로젝트 설계와 구조화"
date: '2026-01-01'
category: Backend
series: enterprise-go
tags: [Architecture, Backend, DI, Enterprise, Go, Tooling]
excerpt: "Kubernetes, Docker CLI, Prometheus, Hugo의 소스 코드를 분석하여 도출한 Go 프로젝트 구조 베스트 프랙티스를 소개합니다."
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

## 실제 프로덕션 프로젝트 분석

이론이 아닌 **실제 코드**를 분석했습니다:

| 프로젝트 | 특성 | Main 역할 | 조립 코드 위치 |
|---------|------|----------|--------------|
| Kubernetes | 거대 모놀리스 | 최소화 | `cmd/<bin>/app/` |
| Docker CLI | CLI 도구 | 최소화 | `cli/command/` |
| Prometheus | 데몬/서비스 | 중간 | `main.go` 내부 |
| Hugo | 컴파일러 | 최소화 | `commands/` |

---

## 핵심 인사이트: Hollow Main 패턴

> **프로젝트가 성숙할수록 main 함수는 비어간다.**

### Fat Main의 문제

```go
// ❌ 나쁜 예: Fat Main
func main() {
    cfg := loadConfig()
    db := connectDB(cfg)
    userRepo := NewUserRepo(db)
    userService := NewUserService(userRepo)
    handler := NewHandler(userService)
    http.ListenAndServe(":8080", handler)
}
```

**문제점:**

- `main`은 테스트 불가
- `main` 패키지는 다른 곳에서 import 불가

### Hollow Main (권장)

```go
// ✅ 좋은 예: Hollow Main
package main

import "myproject/internal/app"

func main() {
    if err := app.Run(); err != nil {
        os.Exit(1)
    }
}
```

모든 로직은 `internal/app`으로 이동 → **테스트 가능**.

---

## 권장 디렉토리 구조

```
project/
├── cmd/
│   └── myapp/
│       └── main.go         # 텅 비어있음
│
├── internal/
│   ├── app/                # 조립 코드 (Composition Root)
│   │   ├── app.go          # Run() 함수
│   │   └── config.go       # 설정 로드
│   ├── api/                # HTTP 핸들러, gRPC
│   ├── biz/                # 비즈니스 로직
│   └── data/               # DB, 외부 API
│
├── pkg/                    # 외부 공개 (신중하게)
├── configs/                # 설정 파일
├── api/                    # OpenAPI, Protobuf
└── Makefile
```

---

## internal/app: 조립의 중심

```go
// internal/app/app.go
func Run() error {
    cfg := LoadConfig()
    
    // 의존성 조립 (DI)
    db := data.NewDatabase(cfg.DSN)
    svc := biz.NewService(db)
    server := api.NewServer(svc)
    
    // 서버 시작
    return server.Start()
}
```

**이 위치의 장점:**

- `cmd/`에서 분리 → 테스트 가능
- 설정 로드, DI, 라이프사이클 관리 집중

---

## 프로젝트 진화 단계

### 1단계: 프로토타입

```
project/
├── main.go
└── go.mod
```

500줄 미만의 PoC. 괜찮습니다.

### 2단계: 모듈화

```
project/
├── cmd/myapp/main.go
└── internal/
    ├── app/
    ├── api/
    └── data/
```

1000줄을 넘어가거나, DB 코드와 핸들러가 섞이기 시작하면.

### 3단계: 멀티 바이너리

```
project/
├── cmd/
│   ├── api/
│   ├── worker/
│   └── admin-cli/
└── internal/        # 공유
```

웹 서버 + 워커 + CLI가 같은 로직을 공유할 때.

---

## CLI 도구용 구조

웹 서비스가 아닌 CLI 도구라면:

```
cmd/myapp/
└── main.go

internal/cli/
├── root.go         # 루트 커맨드
├── serve.go        # serve 서브커맨드
└── migrate.go      # migrate 서브커맨드
```

**패턴:** `cmd.Execute()` 한 줄로 위임

---

## internal/ 우선 전략

| 언제 internal/ | 언제 pkg/ |
|---------------|----------|
| 기본값 | 외부에서 import 필요할 때 |
| 리팩토링 자유 | API 안정성 약속 |
| 초기 개발 | 프로젝트 성숙 후 |

> **경험칙:** 처음부터 pkg/를 쓰지 마세요. 나중에 필요하면 옮기세요.

---

## 정리

| 원칙 | 설명 |
|------|------|
| **Hollow Main** | main.go는 텅 비워두세요 |
| **internal/app** | 조립 코드는 여기에 |
| **internal/ 우선** | pkg/는 성숙 후에 |
| **단계별 진화** | 프로토타입 → 모듈화 → 멀티 바이너리 |

---

## 다음 편 예고

**2편: 견고한 HTTP 서버 구축**에서는 Echo 미들웨어 설계와 Graceful Shutdown을 다룹니다.

---

## 참고 자료

- [golang-standards/project-layout](https://github.com/golang-standards/project-layout)
- [Kubernetes cmd 구조](https://github.com/kubernetes/kubernetes/tree/master/cmd)
- [Docker CLI 구조](https://github.com/docker/cli/tree/master/cmd)
- [Google Wire](https://github.com/google/wire)
