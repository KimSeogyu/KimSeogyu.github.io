---
public: true
title: Go 인터페이스 설계 원칙 - Accept Interfaces, Return Structs
date: '2026-01-02'
category: Backend
tags: [Go, Interface, Design Patterns, Best Practices]
excerpt: "'Accept interfaces, return structs' 원칙과 포인터 vs 값 수신자 선택 기준을 알아봅니다."
---
# Go 인터페이스 설계 원칙

## 개요

Go의 **"Accept interfaces, return structs"** 원칙은 유연하고 테스트 가능한 코드를 작성하는 핵심 가이드라인입니다. 이 글에서는 이 원칙의 철학과 실전 적용법을 다룹니다.

## Accept Interfaces, Return Structs

### 원칙 설명

```go
// ✅ 좋은 예: 인터페이스를 받고, 구체 타입을 반환
func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}

// ❌ 나쁜 예: 구체 타입을 받음
func NewUserService(repo *PostgresUserRepo) *UserService {
    return &UserService{repo: repo}
}
```

### 왜 이렇게 해야 할까?

| 관점 | 인터페이스 수용 | 구체 타입 반환 |
|-----|---------------|--------------|
| **유연성** | 어떤 구현체든 주입 가능 | 호출자가 구체 메서드 접근 가능 |
| **테스트** | Mock 쉽게 주입 | 타입 단언 없이 사용 |
| **결합도** | 낮음 (구현에 독립적) | API 명확성 |

### 실전 예시

```go
// 인터페이스 정의 (소비자 측에서 정의)
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
    Save(ctx context.Context, user *User) error
}

// 구체 구현
type PostgresUserRepo struct {
    db *sql.DB
}

func NewPostgresUserRepo(db *sql.DB) *PostgresUserRepo {
    return &PostgresUserRepo{db: db}
}

func (r *PostgresUserRepo) FindByID(ctx context.Context, id string) (*User, error) {
    // 구현
}

func (r *PostgresUserRepo) Save(ctx context.Context, user *User) error {
    // 구현
}

// 추가 메서드 (인터페이스에 없음)
func (r *PostgresUserRepo) BulkInsert(ctx context.Context, users []*User) error {
    // PostgreSQL 전용 최적화
}

// 서비스 - 인터페이스를 받음
type UserService struct {
    repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}
```

## 인터페이스 정의 위치

### 소비자 측에서 정의 (권장)

```go
// ❌ 구현자가 인터페이스 정의 (Java 스타일)
// repository/interfaces.go
type UserRepository interface { ... }

// repository/postgres.go
type PostgresUserRepo struct { ... }

// ✅ 소비자가 인터페이스 정의 (Go 스타일)
// service/user.go
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

type UserService struct {
    repo UserRepository
}
```

> [!IMPORTANT]
> Go의 암묵적 인터페이스 구현 덕분에, 소비자가 필요한 메서드만 정의할 수 있습니다.

### 작은 인터페이스 선호

```go
// ❌ 너무 큰 인터페이스
type UserRepository interface {
    FindByID(id string) (*User, error)
    FindByEmail(email string) (*User, error)
    FindAll() ([]*User, error)
    Save(user *User) error
    Delete(id string) error
    UpdateProfile(id string, profile *Profile) error
    // ... 10개 더
}

// ✅ 작은 인터페이스 (인터페이스 분리 원칙)
type UserFinder interface {
    FindByID(id string) (*User, error)
}

type UserSaver interface {
    Save(user *User) error
}

// 필요하면 조합
type UserRepository interface {
    UserFinder
    UserSaver
}
```

## 포인터 vs 값 수신자

### 기본 가이드라인

| 상황 | 선택 | 이유 |
|-----|-----|-----|
| 상태 변경 필요 | `*T` 포인터 | 원본 수정 가능 |
| 큰 구조체 | `*T` 포인터 | 복사 비용 절감 |
| 작은 불변 값 | `T` 값 | 안전하고 간단 |
| 일관성 유지 | 하나로 통일 | 혼란 방지 |

### 예시

```go
// 값 수신자 - 작고 불변
type Point struct {
    X, Y int
}

func (p Point) Distance() float64 {
    return math.Sqrt(float64(p.X*p.X + p.Y*p.Y))
}

// 포인터 수신자 - 상태 변경
type Counter struct {
    value int
}

func (c *Counter) Increment() {
    c.value++
}

func (c *Counter) Value() int {
    return c.value
}
```

### 인터페이스와 포인터/값

```go
type Stringer interface {
    String() string
}

type MyType struct {
    Name string
}

// 값 수신자로 정의
func (m MyType) String() string {
    return m.Name
}

var s Stringer

s = MyType{Name: "hello"}  // ✅ 값 할당 가능
s = &MyType{Name: "world"} // ✅ 포인터도 할당 가능
```

```go
// 포인터 수신자로 정의
func (m *MyType) String() string {
    return m.Name
}

s = MyType{Name: "hello"}  // ❌ 컴파일 에러!
s = &MyType{Name: "world"} // ✅ 포인터만 할당 가능
```

> [!WARNING]
> 포인터 수신자로 인터페이스를 구현하면, 값은 해당 인터페이스를 만족하지 않습니다.

### 일관성 규칙

```go
// ❌ 혼합 사용 - 혼란스러움
func (u User) Name() string { ... }
func (u *User) SetName(name string) { ... }
func (u User) Age() int { ... }
func (u *User) SetAge(age int) { ... }

// ✅ 통일 - 명확함
func (u *User) Name() string { ... }
func (u *User) SetName(name string) { ... }
func (u *User) Age() int { ... }
func (u *User) SetAge(age int) { ... }
```

## 인터페이스 반환이 적합한 경우

일반적으로 구체 타입을 반환하지만, 예외 상황도 있습니다.

### 1. 표준 라이브러리 인터페이스

```go
// io.Reader, io.Writer 등 표준 인터페이스
func NewReader(data []byte) io.Reader {
    return bytes.NewReader(data)
}
```

### 2. 팩토리 패턴

```go
type Database interface {
    Query(query string) ([]Row, error)
    Close() error
}

// 설정에 따라 다른 구현 반환
func NewDatabase(config Config) (Database, error) {
    switch config.Driver {
    case "postgres":
        return newPostgresDB(config)
    case "mysql":
        return newMySQLDB(config)
    default:
        return nil, errors.New("unknown driver")
    }
}
```

### 3. 내부 구현 숨기기

```go
// unexported 구현
type client struct {
    httpClient *http.Client
}

// exported 인터페이스
type Client interface {
    Get(url string) (*Response, error)
}

func NewClient() Client {
    return &client{httpClient: &http.Client{}}
}
```

## 테스트를 위한 인터페이스

### Mock 구현

```go
// 테스트용 Mock
type MockUserRepository struct {
    FindByIDFunc func(ctx context.Context, id string) (*User, error)
    SaveFunc     func(ctx context.Context, user *User) error
}

func (m *MockUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    return m.FindByIDFunc(ctx, id)
}

func (m *MockUserRepository) Save(ctx context.Context, user *User) error {
    return m.SaveFunc(ctx, user)
}

// 테스트
func TestUserService_GetUser(t *testing.T) {
    mockRepo := &MockUserRepository{
        FindByIDFunc: func(ctx context.Context, id string) (*User, error) {
            return &User{ID: id, Name: "Test User"}, nil
        },
    }
    
    service := NewUserService(mockRepo)
    
    user, err := service.GetUser(context.Background(), "123")
    assert.NoError(t, err)
    assert.Equal(t, "Test User", user.Name)
}
```

### testify/mock 사용

```go
import "github.com/stretchr/testify/mock"

type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    args := m.Called(ctx, id)
    return args.Get(0).(*User), args.Error(1)
}

func TestUserService(t *testing.T) {
    mockRepo := new(MockUserRepository)
    mockRepo.On("FindByID", mock.Anything, "123").Return(&User{Name: "Test"}, nil)
    
    service := NewUserService(mockRepo)
    user, _ := service.GetUser(context.Background(), "123")
    
    assert.Equal(t, "Test", user.Name)
    mockRepo.AssertExpectations(t)
}
```

## 체크리스트

### 인터페이스 설계

- [ ] 소비자 측에서 인터페이스 정의
- [ ] 가능한 작은 인터페이스 (1-3 메서드)
- [ ] 함수 파라미터로 인터페이스 수용
- [ ] 구체 타입 반환 (특별한 이유 없으면)

### 수신자 선택

- [ ] 상태 변경 필요하면 포인터 수신자
- [ ] struct 크기 > 64 bytes면 포인터 수신자
- [ ] 동일 타입에서 수신자 통일
- [ ] 인터페이스 구현 시 포인터/값 주의

## 참고 자료

- [Go Wiki: CodeReviewComments](https://go.dev/wiki/CodeReviewComments#interfaces)
- [Effective Go: Interfaces](https://go.dev/doc/effective_go#interfaces)
- [Go Proverbs: The bigger the interface, the weaker the abstraction](https://go-proverbs.github.io/)
