---
public: true
title: Go pprof를 활용한 성능 프로파일링 가이드
date: '2025-12-30'
category: Backend
tags: [Backend, Go, Performance]
excerpt: "Go의 내장 프로파일링 도구 pprof를 활용하여 CPU, 메모리, 고루틴 병목을 분석하는 방법을 알아봅니다."
---
# Go pprof를 활용한 성능 프로파일링 가이드

## 개요

**pprof**는 Go에 내장된 프로파일링 도구로, CPU 사용량, 메모리 할당, 고루틴 상태 등을 분석할 수 있습니다. 프로덕션 환경에서도 안전하게 사용할 수 있어 성능 최적화에 필수적입니다.

## 기본 설정

### HTTP 서버에 pprof 엔드포인트 추가

```go
package main

import (
    "net/http"
    _ "net/http/pprof" // 자동으로 /debug/pprof/* 엔드포인트 등록
)

func main() {
    go func() {
        // 별도 포트에서 pprof 서버 실행 (보안상 권장)
        http.ListenAndServe("localhost:6060", nil)
    }()
    
    // 메인 애플리케이션 로직
    // ...
}
```

### 제공되는 엔드포인트

| 엔드포인트 | 설명 |
|----------|------|
| `/debug/pprof/` | 프로파일 인덱스 페이지 |
| `/debug/pprof/heap` | 메모리 할당 프로파일 |
| `/debug/pprof/goroutine` | 고루틴 스택 트레이스 |
| `/debug/pprof/profile` | CPU 프로파일 (30초) |
| `/debug/pprof/trace` | 실행 트레이스 |

## CPU 프로파일링

### 프로파일 수집

```bash
# 30초간 CPU 프로파일 수집
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 또는 파일로 저장
curl -o cpu.prof http://localhost:6060/debug/pprof/profile?seconds=30
go tool pprof cpu.prof
```

### 주요 명령어

```bash
# pprof 인터랙티브 모드에서
(pprof) top10          # 상위 10개 함수
(pprof) list funcName  # 특정 함수의 라인별 분석
(pprof) web            # 그래프 시각화 (브라우저)
(pprof) pdf            # PDF로 저장
```

### 출력 예시

```
      flat  flat%   sum%        cum   cum%
     2.50s 25.00% 25.00%      4.00s 40.00%  main.processData
     1.50s 15.00% 40.00%      1.50s 15.00%  runtime.mallocgc
     1.00s 10.00% 50.00%      3.00s 30.00%  encoding/json.Marshal
```

| 컬럼 | 설명 |
|-----|------|
| `flat` | 해당 함수 자체 실행 시간 |
| `cum` | 해당 함수 + 호출한 함수 합계 시간 |

## 메모리 프로파일링

### 힙 프로파일 수집

```bash
# 현재 힙 상태
go tool pprof http://localhost:6060/debug/pprof/heap

# 할당된 객체 수 기준
go tool pprof -alloc_objects http://localhost:6060/debug/pprof/heap

# 할당된 메모리 크기 기준
go tool pprof -alloc_space http://localhost:6060/debug/pprof/heap
```

### 메모리 누수 탐지

```go
// runtime.MemStats 활용
import "runtime"

func printMemStats() {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    
    fmt.Printf("Alloc = %v MiB\n", m.Alloc / 1024 / 1024)
    fmt.Printf("TotalAlloc = %v MiB\n", m.TotalAlloc / 1024 / 1024)
    fmt.Printf("Sys = %v MiB\n", m.Sys / 1024 / 1024)
    fmt.Printf("NumGC = %v\n", m.NumGC)
}
```

## 고루틴 프로파일링

```bash
# 현재 고루틴 상태 확인
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 덤프 파일로 저장
curl http://localhost:6060/debug/pprof/goroutine?debug=2 > goroutines.txt
```

고루틴 누수 징후:

- 고루틴 수가 지속적으로 증가
- 특정 함수에서 대기 중인 고루틴이 많음

## 웹 UI로 시각화

**pprof 웹 인터페이스** (Go 1.10+):

```bash
go tool pprof -http=:8080 cpu.prof
```

브라우저에서 `http://localhost:8080`으로 접속하면:

- **Top**: 함수별 CPU/메모리 사용량
- **Graph**: 호출 그래프
- **Flame Graph**: 플레임 차트
- **Source**: 소스 코드 레벨 분석

## 프로덕션 환경 고도화

### 1. 보안 설정

```go
package main

import (
    "net/http"
    "net/http/pprof"
)

func main() {
    // 별도 서버에서 인증 추가
    pprofMux := http.NewServeMux()
    pprofMux.HandleFunc("/debug/pprof/", pprof.Index)
    pprofMux.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
    pprofMux.HandleFunc("/debug/pprof/profile", pprof.Profile)
    pprofMux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
    pprofMux.HandleFunc("/debug/pprof/trace", pprof.Trace)
    
    // 인증 미들웨어 적용
    go http.ListenAndServe("localhost:6060", authMiddleware(pprofMux))
}
```

### 2. 연속 프로파일링 (Continuous Profiling)

```go
import (
    "os"
    "runtime/pprof"
    "time"
)

func startContinuousProfiling() {
    ticker := time.NewTicker(10 * time.Minute)
    for range ticker.C {
        f, _ := os.Create(fmt.Sprintf("heap_%s.prof", time.Now().Format("20060102_150405")))
        pprof.WriteHeapProfile(f)
        f.Close()
    }
}
```

### 3. 외부 서비스 연동

- **Pyroscope**: 오픈소스 연속 프로파일링
- **Datadog Continuous Profiler**: 상용 APM
- **Google Cloud Profiler**: GCP 통합

```go
// Pyroscope 예시
import "github.com/grafana/pyroscope-go"

func main() {
    pyroscope.Start(pyroscope.Config{
        ApplicationName: "my-app",
        ServerAddress:   "http://pyroscope:4040",
    })
}
```

## 벤치마크와 함께 사용

```bash
# 벤치마크 실행 + CPU 프로파일
go test -bench=. -cpuprofile=cpu.prof

# 벤치마크 실행 + 메모리 프로파일
go test -bench=. -memprofile=mem.prof

# 분석
go tool pprof cpu.prof
```

## 주의사항

1. **프로덕션 포트 분리**: pprof 엔드포인트는 별도 포트에서 실행
2. **인증 필수**: 외부 노출 시 반드시 인증 적용
3. **오버헤드**: CPU 프로파일링은 약 5% 오버헤드 발생
4. **샘플링 주기**: `runtime.SetCPUProfileRate()`로 조절 가능

## 참고 자료

- [Go pprof 공식 문서](https://pkg.go.dev/net/http/pprof)
- [Profiling Go Programs](https://go.dev/blog/pprof)
