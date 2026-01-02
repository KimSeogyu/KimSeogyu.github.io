---
public: true
title: Docker 멀티스테이지 빌드 최적화 가이드
date: '2026-01-02'
category: Backend
tags: [Backend, DevOps, Docker, Performance]
excerpt: "멀티스테이지 빌드로 Docker 이미지 크기를 줄이고, 빌드 속도와 보안을 개선하는 실전 전략을 알아봅니다."
---
# Docker 멀티스테이지 빌드 최적화 가이드

## 개요

**멀티스테이지 빌드**는 단일 Dockerfile에서 여러 `FROM` 명령어를 사용하여 빌드 환경과 런타임 환경을 분리하는 기법입니다. 이를 통해 **이미지 크기 감소**, **보안 강화**, **빌드 속도 향상**을 동시에 달성할 수 있습니다.

## 기본 구조

### 싱글 스테이지 vs 멀티 스테이지

```dockerfile
# ❌ 싱글 스테이지 - 빌드 도구가 포함됨
FROM golang:1.23
WORKDIR /app
COPY . .
RUN go build -o main .
CMD ["./main"]
# 결과: ~1GB 이미지
```

```dockerfile
# ✅ 멀티 스테이지 - 런타임만 포함
FROM golang:1.23 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o main .

FROM scratch
COPY --from=builder /app/main /main
CMD ["/main"]
# 결과: ~10MB 이미지
```

> [!IMPORTANT]
> `COPY --from=builder`로 빌드 아티팩트만 복사하여 빌드 도구, 소스 코드, 중간 파일을 모두 제외합니다.

## 언어별 최적화 예시

### Go

```dockerfile
# 빌드 스테이지
FROM golang:1.23-alpine AS builder
WORKDIR /app

# 의존성 먼저 (캐시 활용)
COPY go.mod go.sum ./
RUN go mod download

# 소스 복사 및 빌드
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

# 런타임 스테이지
FROM scratch
COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
EXPOSE 8080
ENTRYPOINT ["/server"]
```

### Node.js

```dockerfile
# 의존성 설치 스테이지
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# 빌드 스테이지
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 런타임 스테이지 (프로덕션 의존성만)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Python

```dockerfile
# 빌드 스테이지
FROM python:3.12-slim AS builder
WORKDIR /app

RUN pip install --no-cache-dir poetry
COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt -o requirements.txt --without-hashes

# 런타임 스테이지
FROM python:3.12-slim
WORKDIR /app

COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
USER nobody
CMD ["python", "-m", "app.main"]
```

## 베이스 이미지 선택

| 이미지 | 크기 | 용도 |
|-------|-----|-----|
| `scratch` | 0MB | 정적 바이너리 (Go, Rust) |
| `distroless` | ~2MB | 보안 중시, 셸 없음 |
| `alpine` | ~5MB | 범용 경량 리눅스 |
| `slim` | ~80MB | 호환성 필요 시 |

### Distroless 예시

```dockerfile
FROM golang:1.23 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o /server .

# Google Distroless - 셸 없음, 보안 강화
FROM gcr.io/distroless/static-debian12
COPY --from=builder /server /server
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

## 캐시 최적화

### 레이어 순서 최적화

```dockerfile
# ❌ 나쁜 순서 - 소스 변경 시 의존성 재설치
COPY . .
RUN npm install
RUN npm run build

# ✅ 좋은 순서 - 의존성 캐시 활용
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

### BuildKit 캐시 마운트

```dockerfile
# syntax=docker/dockerfile:1

FROM golang:1.23 AS builder
WORKDIR /app
COPY . .

# 모듈 캐시를 볼륨으로 마운트 (빌드 간 유지)
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -o /server .
```

```dockerfile
# Node.js 예시
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

## 빌드 인자 활용

### 타겟 스테이지 지정

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
CMD ["npm", "run", "dev"]

FROM base AS production
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

```bash
# 개발 이미지 빌드
docker build --target development -t myapp:dev .

# 프로덕션 이미지 빌드
docker build --target production -t myapp:prod .
```

### ARG로 조건부 빌드

```dockerfile
ARG BUILD_ENV=production

FROM node:22-alpine AS builder
WORKDIR /app
COPY . .

RUN if [ "$BUILD_ENV" = "development" ]; then \
      npm install; \
    else \
      npm ci --only=production; \
    fi
```

## BuildKit 고급 기능

### 병렬 빌드

```dockerfile
# syntax=docker/dockerfile:1

FROM alpine AS stage1
RUN sleep 10 && echo "stage1" > /out1

FROM alpine AS stage2
RUN sleep 10 && echo "stage2" > /out2

# BuildKit이 stage1, stage2를 병렬 실행
FROM alpine
COPY --from=stage1 /out1 /
COPY --from=stage2 /out2 /
```

### Secret 마운트 (민감 정보)

```dockerfile
# syntax=docker/dockerfile:1

FROM node:22-alpine
WORKDIR /app

# .npmrc를 이미지에 포함하지 않음
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash
docker build --secret id=npmrc,src=.npmrc -t myapp .
```

## 모범 사례 체크리스트

### 이미지 크기 최적화

- [ ] 런타임에 불필요한 빌드 도구 제외
- [ ] `scratch` 또는 `distroless` 사용 고려
- [ ] `.dockerignore` 설정으로 불필요한 파일 제외
- [ ] `--no-cache-dir` (pip), `--frozen-lockfile` (pnpm) 사용

### 빌드 속도 최적화

- [ ] 변경 빈도 낮은 레이어를 상단에 배치
- [ ] BuildKit 캐시 마운트 활용
- [ ] 의존성 파일 먼저 복사 후 설치

### 보안

- [ ] 베이스 이미지 버전 고정 (`:latest` 금지)
- [ ] `USER` 명령어로 non-root 실행
- [ ] 불필요한 포트 노출 금지
- [ ] Secret 마운트로 민감 정보 관리

## 참고 자료

- [Docker Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker BuildKit](https://docs.docker.com/build/buildkit/)
- [Google Distroless](https://github.com/GoogleContainerTools/distroless)
