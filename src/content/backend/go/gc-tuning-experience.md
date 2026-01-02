---
public: true
title: Go 가비지 컬렉터(GC) 이해와 튜닝 경험
date: '2025-12-30'
category: Backend
tags: [Backend, Go, Performance]
excerpt: "Go의 가비지 컬렉터 동작 원리와 프로덕션 환경에서의 GC 튜닝 경험을 공유합니다."
---
# Go 가비지 컬렉터(GC) 이해와 튜닝 경험

## 개요

Go는 **Concurrent Mark-and-Sweep** 방식의 가비지 컬렉터를 사용합니다. Go 1.5 이후 STW(Stop-The-World) 시간을 최소화하는 방향으로 지속적으로 개선되어, 대부분의 경우 1ms 이하의 pause time을 달성합니다.

## GC 동작 원리

### Tricolor Mark-and-Sweep

Go GC는 **삼색 마킹 알고리즘**을 사용합니다:

| 색상 | 의미 |
|-----|------|
| **White** | 아직 스캔되지 않음 (수집 대상 후보) |
| **Gray** | 스캔 중, 참조 객체 확인 필요 |
| **Black** | 스캔 완료, 참조 객체 모두 확인됨 |

### GC 단계

```
1. Mark Setup (STW)     → 0.1ms 미만
2. Concurrent Marking   → 백그라운드에서 실행
3. Mark Termination (STW) → 0.1ms 미만
4. Concurrent Sweeping  → 백그라운드에서 실행
```

> Go 1.8+부터 대부분의 STW 시간이 **sub-millisecond** 수준입니다.

## GC 모니터링

### runtime 패키지 활용

```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func printGCStats() {
    var stats runtime.MemStats
    runtime.ReadMemStats(&stats)
    
    fmt.Printf("Alloc = %v MiB\n", stats.Alloc/1024/1024)
    fmt.Printf("HeapAlloc = %v MiB\n", stats.HeapAlloc/1024/1024)
    fmt.Printf("HeapSys = %v MiB\n", stats.HeapSys/1024/1024)
    fmt.Printf("NumGC = %v\n", stats.NumGC)
    fmt.Printf("PauseTotalNs = %v ms\n", stats.PauseTotalNs/1e6)
    fmt.Printf("LastGC = %v\n", time.Unix(0, int64(stats.LastGC)))
}
```

### GODEBUG 환경변수

```bash
# GC 트레이스 활성화
GODEBUG=gctrace=1 ./myapp

# 출력 예시:
# gc 1 @0.012s 2%: 0.018+1.2+0.014 ms clock, 0.14+0.8/1.0/0+0.11 ms cpu, 4->4->1 MB, 5 MB goal, 8 P
```

| 필드 | 의미 |
|-----|------|
| `gc 1` | GC 번호 |
| `2%` | CPU 사용률 |
| `0.018+1.2+0.014 ms` | STW + concurrent + STW 시간 |
| `4->4->1 MB` | 힙: 시작 → 종료 → 라이브 |
| `5 MB goal` | 다음 GC 목표 힙 크기 |

## GOGC 튜닝

### GOGC 환경변수

**GOGC**는 GC 트리거 임계값을 조절합니다:

```bash
# 기본값: 100 (힙이 2배가 되면 GC)
GOGC=100 ./myapp

# 더 자주 GC (메모리 절약, CPU 증가)
GOGC=50 ./myapp

# 덜 자주 GC (메모리 증가, CPU 절약)
GOGC=200 ./myapp

# GC 비활성화 (극단적 케이스)
GOGC=off ./myapp
```

### 런타임에서 조절

```go
import "runtime/debug"

// GOGC 값 변경
debug.SetGCPercent(50)

// 현재 값 확인 및 변경
old := debug.SetGCPercent(200)
fmt.Printf("Previous GOGC: %d\n", old)
```

## 메모리 제한 (Go 1.19+)

### GOMEMLIMIT

Go 1.19에서 도입된 **소프트 메모리 제한**:

```bash
# 최대 4GB 힙 제한
GOMEMLIMIT=4GiB ./myapp
```

```go
import "runtime/debug"

// 런타임에서 설정
debug.SetMemoryLimit(4 * 1024 * 1024 * 1024) // 4GB
```

### GOGC + GOMEMLIMIT 조합

```bash
# 권장: GOGC=off + GOMEMLIMIT
# 메모리 제한에 도달하면 자동으로 GC
GOGC=off GOMEMLIMIT=2GiB ./myapp
```

## 프로덕션 튜닝 경험

### Case 1: 고빈도 할당 서비스

**문제**: 초당 10만 건 요청 처리, GC pause가 p99 레이턴시에 영향

**해결**:

```go
// sync.Pool로 객체 재사용
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 4096)
    },
}

func handleRequest() {
    buf := bufferPool.Get().([]byte)
    defer bufferPool.Put(buf)
    
    // buf 사용
}
```

**결과**: 할당량 70% 감소, GC 빈도 50% 감소

### Case 2: 대용량 캐시 서비스

**문제**: 32GB 힙, GC marking 시간이 길어짐

**해결**:

```bash
# 메모리 제한 설정으로 예측 가능한 GC
GOMEMLIMIT=30GiB GOGC=100 ./cache-server
```

또한 **외부 캐시**(Redis, Memcached)로 대용량 데이터 오프로드

### Case 3: 배치 처리 워커

**문제**: 배치 처리 중 GC가 처리 시간에 영향

**해결**:

```go
func processBatch(items []Item) {
    // 배치 처리 전 GC 강제 실행
    runtime.GC()
    
    // 처리 중 GC 비활성화
    debug.SetGCPercent(-1)
    defer debug.SetGCPercent(100)
    
    for _, item := range items {
        process(item)
    }
}
```

## 메모리 할당 최적화

### 1. 사전 할당

```go
// Bad
var result []int
for i := 0; i < 1000; i++ {
    result = append(result, i)
}

// Good
result := make([]int, 0, 1000)
for i := 0; i < 1000; i++ {
    result = append(result, i)
}
```

### 2. 포인터 회피

```go
// 힙 할당 유발
type Bad struct {
    data *int
}

// 스택 할당 가능
type Good struct {
    data int
}
```

### 3. Escape Analysis 활용

```bash
# 이스케이프 분석 결과 확인
go build -gcflags="-m" ./...
```

## Ballast 기법 (레거시)

> **Note**: Go 1.19+ GOMEMLIMIT 도입 이후 ballast 기법은 권장되지 않습니다.

```go
// 레거시: 큰 배열로 힙 크기 유지
var ballast = make([]byte, 1<<30) // 1GB

func main() {
    _ = ballast // 변수 유지
    // ...
}
```

## 모니터링 지표

프로덕션에서 추적해야 할 GC 관련 지표:

| 지표 | 설명 | 임계값 |
|-----|------|-------|
| `go_gc_duration_seconds` | GC pause 시간 | p99 < 10ms |
| `go_memstats_heap_alloc_bytes` | 현재 힙 사용량 | GOMEMLIMIT의 80% |
| `go_memstats_gc_cpu_fraction` | GC CPU 사용률 | < 5% |

## 참고 자료

- [Go GC Guide](https://tip.golang.org/doc/gc-guide)
- [Go 1.19 Memory Limit](https://go.dev/blog/go1.19)
- [Getting to Go: The Journey of Go's Garbage Collector](https://go.dev/blog/ismmkeynote)
