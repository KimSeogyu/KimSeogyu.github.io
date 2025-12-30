---
public: false
title: Go 프로젝트를 위한 Monorepo 전략
date: '2025-12-30'
category: Backend
tags: [Go, Monorepo, Architecture, DevOps]
excerpt: "Go 언어에서 Monorepo를 효과적으로 구성하고 운영하는 전략과 도구를 알아봅니다."
---
# Go 프로젝트를 위한 Monorepo 전략

## 개요

**Monorepo**는 여러 프로젝트나 서비스를 하나의 저장소에서 관리하는 방식입니다. Go는 모듈 시스템(Go Modules)을 통해 Monorepo를 효과적으로 지원합니다.

## Monorepo vs Multirepo

| 항목 | Monorepo | Multirepo |
|-----|----------|-----------|
| 코드 공유 | 용이 | 패키지 배포 필요 |
| 원자적 커밋 | 가능 | 불가능 |
| 의존성 관리 | 중앙 집중 | 분산 |
| CI/CD 복잡도 | 높음 | 낮음 |
| 접근 제어 | 어려움 | 쉬움 |

## 기본 디렉토리 구조

```
myorg/
├── go.work              # Go Workspace 설정
├── go.mod               # 루트 모듈 (선택적)
├── apps/                # 애플리케이션 (실행 가능)
│   ├── api-gateway/
│   │   ├── go.mod
│   │   ├── main.go
│   │   └── internal/
│   ├── user-service/
│   │   ├── go.mod
│   │   ├── main.go
│   │   └── internal/
│   └── order-service/
│       ├── go.mod
│       ├── main.go
│       └── internal/
├── libs/                # 공유 라이브러리
│   ├── common/
│   │   ├── go.mod
│   │   └── logger/
│   ├── database/
│   │   ├── go.mod
│   │   └── postgres/
│   └── proto/
│       ├── go.mod
│       └── gen/
├── tools/               # 개발 도구
│   ├── migrate/
│   └── codegen/
├── scripts/             # 빌드/배포 스크립트
├── Makefile
└── docker-compose.yml
```

## Go Workspace (go.work)

Go 1.18+에서 도입된 **워크스페이스**는 Monorepo에 필수입니다:

```go
// go.work
go 1.22

use (
    ./apps/api-gateway
    ./apps/user-service
    ./apps/order-service
    ./libs/common
    ./libs/database
    ./libs/proto
)
```

### 워크스페이스 명령어

```bash
# 워크스페이스 초기화
go work init

# 모듈 추가
go work use ./apps/api-gateway
go work use ./libs/common

# 전체 모듈 동기화
go work sync
```

## 모듈 의존성 관리

### 내부 모듈 의존성

```go
// apps/user-service/go.mod
module github.com/myorg/monorepo/apps/user-service

go 1.22

require (
    github.com/myorg/monorepo/libs/common v0.0.0
    github.com/myorg/monorepo/libs/database v0.0.0
)

// go.work 환경에서는 replace 불필요
replace (
    github.com/myorg/monorepo/libs/common => ../../libs/common
    github.com/myorg/monorepo/libs/database => ../../libs/database
)
```

> **Note**: `go.work`를 사용하면 `replace` 지시문이 자동 처리됩니다.

### 버전 동기화

```bash
# 모든 모듈의 의존성 업데이트
find . -name 'go.mod' -execdir go get -u ./... \;

# 특정 패키지 업그레이드
find . -name 'go.mod' -execdir go get -u github.com/some/pkg@latest \;
```

## Makefile 구성

```makefile
# Makefile
APPS := $(shell find apps -maxdepth 1 -mindepth 1 -type d)

.PHONY: all build test lint

all: lint test build

# 전체 빌드
build:
 @for app in $(APPS); do \
  echo "Building $$app..."; \
  cd $$app && go build -o ../../bin/$$(basename $$app) ./... && cd ../..; \
 done

# 전체 테스트
test:
 go test ./...

# 특정 앱만 테스트
test-%:
 cd apps/$* && go test ./...

# 린트
lint:
 golangci-lint run ./...

# 의존성 정리
tidy:
 go work sync
 @find . -name 'go.mod' -execdir go mod tidy \;

# 도커 이미지 빌드
docker-%:
 docker build -t myorg/$*:latest -f apps/$*/Dockerfile .
```

## CI/CD 최적화

### 변경된 모듈만 빌드

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      apps: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            api-gateway:
              - 'apps/api-gateway/**'
              - 'libs/**'
            user-service:
              - 'apps/user-service/**'
              - 'libs/**'
            order-service:
              - 'apps/order-service/**'
              - 'libs/**'

  build:
    needs: detect-changes
    if: ${{ needs.detect-changes.outputs.apps != '[]' }}
    strategy:
      matrix:
        app: ${{ fromJson(needs.detect-changes.outputs.apps) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      
      - name: Build ${{ matrix.app }}
        run: |
          cd apps/${{ matrix.app }}
          go build ./...
      
      - name: Test ${{ matrix.app }}
        run: |
          cd apps/${{ matrix.app }}
          go test ./...
```

### 캐싱 전략

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cache/go-build
      ~/go/pkg/mod
    key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
    restore-keys: |
      ${{ runner.os }}-go-
```

## Docker 빌드 전략

### 멀티 스테이지 빌드

```dockerfile
# apps/user-service/Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app

# 전체 모노레포 복사 (의존성 해결)
COPY go.work go.work
COPY apps/user-service/ apps/user-service/
COPY libs/ libs/

WORKDIR /app/apps/user-service
RUN go build -o /bin/user-service .

FROM alpine:3.19
COPY --from=builder /bin/user-service /bin/user-service
ENTRYPOINT ["/bin/user-service"]
```

### 공통 빌드 환경

```dockerfile
# build/Dockerfile.base
FROM golang:1.22-alpine AS base

WORKDIR /app
COPY go.work .
COPY libs/ libs/

# 의존성 사전 다운로드
RUN find . -name 'go.mod' -execdir go mod download \;
```

## 모범 사례

### 1. 명확한 경계 설정

```
libs/common/       # 모든 서비스가 사용
libs/user-core/    # user-* 서비스만 사용
apps/user-api/
apps/user-worker/
```

### 2. 순환 의존성 방지

```bash
# 의존성 그래프 시각화
go mod graph | grep myorg | dot -Tpng -o deps.png
```

### 3. 버전 태깅

```bash
# 개별 라이브러리 버전 태그
git tag libs/common/v1.2.0
git push origin libs/common/v1.2.0
```

### 4. Private 모듈 설정

```bash
# GOPRIVATE 환경변수
export GOPRIVATE=github.com/myorg/*
```

## 도구 체인

| 도구 | 용도 |
|-----|------|
| **golangci-lint** | 통합 린터 |
| **go work** | 워크스페이스 관리 |
| **Task** | Makefile 대안 |
| **goreleaser** | 릴리스 자동화 |

## 참고 자료

- [Go Workspaces](https://go.dev/doc/tutorial/workspaces)
- [Go Modules Reference](https://go.dev/ref/mod)
- [Monorepo 장단점](https://monorepo.tools/)
