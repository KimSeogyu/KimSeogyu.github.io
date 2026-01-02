---
public: true
title: Go 에러 핸들링 전략 완벽 가이드
date: '2026-01-02'
category: Backend
tags: [Backend, Error Handling, Go]
excerpt: "errors.Is, errors.As, 커스텀 에러 타입, 스택 트레이스를 활용한 Go의 효과적인 에러 핸들링 전략을 알아봅니다."
---
# Go 에러 핸들링 전략 완벽 가이드

## 개요

Go의 에러 처리는 명시적이고 값 기반입니다. Go 1.13부터 도입된 에러 래핑(wrapping)과 `errors.Is`, `errors.As`를 활용하면 체계적인 에러 핸들링이 가능합니다.

## 에러 래핑 (Error Wrapping)

### fmt.Errorf와 %w

```go
import (
    "errors"
    "fmt"
)

func readConfig(path string) error {
    data, err := os.ReadFile(path)
    if err != nil {
        // %w로 원본 에러 래핑 (체인 유지)
        return fmt.Errorf("config 파일 읽기 실패 [%s]: %w", path, err)
    }
    return nil
}
```

> [!IMPORTANT]
> `%v` 대신 `%w`를 사용해야 원본 에러 체인이 유지됩니다. `%v`는 문자열로만 변환됩니다.

### 에러 체인 언래핑

```go
err := readConfig("config.yaml")
if err != nil {
    // 가장 바깥 에러 메시지
    fmt.Println(err)
    // → config 파일 읽기 실패 [config.yaml]: open config.yaml: no such file or directory
    
    // 원본 에러 추출
    unwrapped := errors.Unwrap(err)
    fmt.Println(unwrapped)
    // → open config.yaml: no such file or directory
}
```

## errors.Is - 에러 동등성 검사

`errors.Is`는 에러 체인 전체를 순회하며 **특정 에러와 동등한지** 검사합니다.

### 센티넬 에러 비교

```go
import (
    "errors"
    "io"
    "os"
)

var ErrNotFound = errors.New("리소스를 찾을 수 없습니다")

func findUser(id string) (*User, error) {
    user, err := db.Find(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrNotFound  // 도메인 에러로 변환
        }
        return nil, fmt.Errorf("DB 조회 실패: %w", err)
    }
    return user, nil
}

// 호출측
user, err := findUser("123")
if errors.Is(err, ErrNotFound) {
    // 404 응답
}
```

### 체인 내 에러 검사

```go
func processFile(path string) error {
    data, err := os.ReadFile(path)
    if err != nil {
        return fmt.Errorf("파일 처리 실패: %w", err)
    }
    // ...
}

err := processFile("data.txt")
if errors.Is(err, os.ErrNotExist) {
    fmt.Println("파일이 존재하지 않습니다")
}
if errors.Is(err, os.ErrPermission) {
    fmt.Println("권한이 없습니다")
}
```

### Is 메서드 커스터마이징

```go
type TemporaryError struct {
    Msg string
}

func (e *TemporaryError) Error() string { return e.Msg }

// Is 메서드 구현으로 커스텀 비교 로직
func (e *TemporaryError) Is(target error) bool {
    _, ok := target.(*TemporaryError)
    return ok
}

// 사용
var errTemp = &TemporaryError{Msg: "일시적 오류"}
err := fmt.Errorf("작업 실패: %w", errTemp)

if errors.Is(err, &TemporaryError{}) {
    // 재시도 로직
}
```

## errors.As - 에러 타입 추출

`errors.As`는 에러 체인에서 **특정 타입의 에러를 추출**합니다.

### 기본 사용법

```go
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("유효성 검사 실패 [%s]: %s", e.Field, e.Message)
}

func validateUser(u User) error {
    if u.Email == "" {
        return &ValidationError{Field: "email", Message: "필수 입력값입니다"}
    }
    return nil
}

// 에러 타입 추출
err := validateUser(User{})
var validErr *ValidationError
if errors.As(err, &validErr) {
    fmt.Printf("필드: %s, 메시지: %s\n", validErr.Field, validErr.Message)
}
```

### 래핑된 에러에서 추출

```go
func createUser(u User) error {
    if err := validateUser(u); err != nil {
        return fmt.Errorf("사용자 생성 실패: %w", err)
    }
    // ...
}

err := createUser(User{})
var validErr *ValidationError
if errors.As(err, &validErr) {
    // 래핑되어 있어도 추출 가능!
    log.Printf("검증 실패 필드: %s", validErr.Field)
}
```

## 커스텀 에러 타입

### 도메인 에러 정의

```go
package domain

type ErrorCode string

const (
    ErrCodeNotFound     ErrorCode = "NOT_FOUND"
    ErrCodeUnauthorized ErrorCode = "UNAUTHORIZED"
    ErrCodeConflict     ErrorCode = "CONFLICT"
)

type DomainError struct {
    Code    ErrorCode
    Message string
    Cause   error  // 원인 에러
}

func (e *DomainError) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
    }
    return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap으로 체인 지원
func (e *DomainError) Unwrap() error {
    return e.Cause
}

// 생성자 함수들
func NewNotFoundError(resource string, cause error) *DomainError {
    return &DomainError{
        Code:    ErrCodeNotFound,
        Message: fmt.Sprintf("%s를 찾을 수 없습니다", resource),
        Cause:   cause,
    }
}

func NewConflictError(msg string) *DomainError {
    return &DomainError{
        Code:    ErrCodeConflict,
        Message: msg,
    }
}
```

### HTTP 상태 코드 매핑

```go
func (e *DomainError) HTTPStatus() int {
    switch e.Code {
    case ErrCodeNotFound:
        return http.StatusNotFound
    case ErrCodeUnauthorized:
        return http.StatusUnauthorized
    case ErrCodeConflict:
        return http.StatusConflict
    default:
        return http.StatusInternalServerError
    }
}

// 핸들러에서 사용
func userHandler(w http.ResponseWriter, r *http.Request) {
    user, err := userService.Find(r.Context(), userID)
    if err != nil {
        var domainErr *DomainError
        if errors.As(err, &domainErr) {
            http.Error(w, domainErr.Message, domainErr.HTTPStatus())
            return
        }
        http.Error(w, "서버 오류", http.StatusInternalServerError)
        return
    }
    // ...
}
```

## 다중 에러 래핑 (Go 1.20+)

### errors.Join

```go
func validateForm(data FormData) error {
    var errs []error
    
    if data.Name == "" {
        errs = append(errs, errors.New("이름은 필수입니다"))
    }
    if data.Email == "" {
        errs = append(errs, errors.New("이메일은 필수입니다"))
    }
    if data.Age < 0 {
        errs = append(errs, errors.New("나이는 0 이상이어야 합니다"))
    }
    
    return errors.Join(errs...)  // nil이면 nil 반환
}

err := validateForm(FormData{})
// 출력: 이름은 필수입니다
//       이메일은 필수입니다
```

### 다중 에러 검사

```go
var (
    ErrNameRequired  = errors.New("이름은 필수입니다")
    ErrEmailRequired = errors.New("이메일은 필수입니다")
)

err := errors.Join(ErrNameRequired, ErrEmailRequired)

// 각각 검사 가능
errors.Is(err, ErrNameRequired)  // true
errors.Is(err, ErrEmailRequired) // true
```

## 스택 트레이스

표준 라이브러리는 스택 트레이스를 제공하지 않습니다. 외부 라이브러리를 활용합니다.

### pkg/errors (레거시)

```go
import "github.com/pkg/errors"

func readFile(path string) error {
    data, err := os.ReadFile(path)
    if err != nil {
        return errors.Wrap(err, "파일 읽기 실패")  // 스택 트레이스 포함
    }
    return nil
}

// 스택 출력
err := readFile("config.yaml")
fmt.Printf("%+v\n", err)  // 스택 트레이스 포함 출력
```

### cockroachdb/errors (권장)

```go
import "github.com/cockroachdb/errors"

func processData() error {
    if err := readConfig(); err != nil {
        return errors.Wrap(err, "데이터 처리 실패")
    }
    return nil
}

// errors.Is, errors.As 호환
// 스택 트레이스 자동 포함
```

### 구조화된 로깅과 함께

```go
import (
    "github.com/cockroachdb/errors"
    "log/slog"
)

func handleRequest() {
    if err := processData(); err != nil {
        slog.Error("요청 처리 실패",
            "error", err,
            "stack", fmt.Sprintf("%+v", err),
        )
    }
}
```

## 에러 핸들링 패턴

### 패턴 1: 계층별 래핑

```go
// Repository 계층
func (r *UserRepo) FindByID(id string) (*User, error) {
    user, err := r.db.Get(id)
    if err != nil {
        return nil, fmt.Errorf("UserRepo.FindByID: %w", err)
    }
    return user, nil
}

// Service 계층
func (s *UserService) GetUser(id string) (*User, error) {
    user, err := s.repo.FindByID(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, domain.NewNotFoundError("user", err)
        }
        return nil, fmt.Errorf("UserService.GetUser: %w", err)
    }
    return user, nil
}

// Handler 계층
func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) {
    user, err := h.service.GetUser(userID)
    if err != nil {
        var domainErr *domain.DomainError
        if errors.As(err, &domainErr) {
            respondError(w, domainErr)
            return
        }
        slog.Error("예상치 못한 에러", "error", err)
        http.Error(w, "Internal Server Error", 500)
        return
    }
    respondJSON(w, user)
}
```

### 패턴 2: 에러 로깅 위치

```go
// ❌ 모든 곳에서 로깅 (중복)
func foo() error {
    err := bar()
    if err != nil {
        log.Error("bar 실패", err)  // 중복!
        return err
    }
}

// ✅ 최상위에서만 로깅
func handler() {
    err := foo()
    if err != nil {
        log.Error("요청 처리 실패", err)  // 한 곳에서만
        // 응답 처리
    }
}
```

### 패턴 3: 재시도 가능 에러

```go
type RetryableError struct {
    Err       error
    RetryAfter time.Duration
}

func (e *RetryableError) Error() string {
    return fmt.Sprintf("재시도 가능: %v (after %v)", e.Err, e.RetryAfter)
}

func (e *RetryableError) Unwrap() error { return e.Err }

// 사용
func callExternalAPI() error {
    resp, err := http.Get(url)
    if err != nil {
        return &RetryableError{Err: err, RetryAfter: 5 * time.Second}
    }
    if resp.StatusCode == 429 {
        return &RetryableError{
            Err:        errors.New("rate limited"),
            RetryAfter: parseRetryAfter(resp.Header),
        }
    }
    return nil
}

// 호출측
for i := 0; i < maxRetries; i++ {
    err := callExternalAPI()
    var retryErr *RetryableError
    if errors.As(err, &retryErr) {
        time.Sleep(retryErr.RetryAfter)
        continue
    }
    if err != nil {
        return err  // 재시도 불가능한 에러
    }
    return nil  // 성공
}
```

## 주의사항

1. ⚠️ **`%w` vs `%v`** - 체인 유지가 필요하면 반드시 `%w`
2. ⚠️ **errors.As는 포인터의 포인터** - `var err *CustomError; errors.As(e, &err)`
3. ⚠️ **센티넬 에러는 패키지 레벨** - 전역 변수로 선언
4. ⚠️ **스택 트레이스는 성능 비용** - 프로덕션에서 신중히 사용

## 참고 자료

- [Go Blog: Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
- [errors 패키지 문서](https://pkg.go.dev/errors)
- [cockroachdb/errors](https://github.com/cockroachdb/errors)
