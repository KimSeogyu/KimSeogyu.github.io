---
public: true
title: Ginkgo와 Testcontainers를 활용한 통합 테스트 전략
date: '2025-12-30'
category: Backend
tags: [Backend, Docker, Go, MongoDB, Redis, Testing]
excerpt: "Ginkgo BDD 프레임워크와 Testcontainers를 결합하여 실제 데이터베이스를 사용하는 신뢰성 높은 통합 테스트를 구축하는 방법을 알아봅니다."
---
# Ginkgo와 Testcontainers를 활용한 통합 테스트 전략

## 개요

**Ginkgo**는 Go의 BDD 테스트 프레임워크이며, **Testcontainers**는 테스트에서 Docker 컨테이너를 프로그래매틱하게 관리합니다. 이 조합으로 Mock 없이 실제 데이터베이스를 사용하는 통합 테스트를 구축할 수 있습니다.

## 왜 이 조합인가?

### 장점

| 특성 | 설명 |
|------|------|
| **실제 환경** | Mock 대신 실제 DB로 테스트 → 높은 신뢰도 |
| **격리성** | 테스트마다 깨끗한 컨테이너 환경 |
| **BDD 가독성** | Describe/Context/It으로 의도 명확히 표현 |
| **병렬 실행** | 컨테이너 격리로 안전한 병렬 테스트 |

### 단점

| 특성 | 설명 |
|------|------|
| **속도** | 컨테이너 시작 시간으로 유닛 테스트보다 느림 |
| **리소스** | Docker 실행 필요, CI에서 추가 설정 필요 |
| **복잡성** | 컨테이너 라이프사이클 관리 필요 |

## 설치

```bash
# Ginkgo CLI 및 라이브러리
go install github.com/onsi/ginkgo/v2/ginkgo@latest
go get github.com/onsi/gomega/...

# Testcontainers
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/mongodb
go get github.com/testcontainers/testcontainers-go/modules/redis
```

## 테스트 환경 구조

### 테스트 헬퍼

```go
// testutils/mongodb.go
package testutils

import (
    "context"
    "os"
    
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/mongodb"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

// MongoDBFixture는 MongoDB 테스트 환경을 관리합니다.
type MongoDBFixture struct {
    container *mongodb.MongoDBContainer
    client    *mongo.Client
    cleanup   func()
}

func (f *MongoDBFixture) GetConnectionString() (string, error) {
    return f.container.ConnectionString(context.Background())
}

func (f *MongoDBFixture) GetClient() *mongo.Client {
    return f.client
}

func (f *MongoDBFixture) Cleanup() {
    f.cleanup()
}

// GetMongoDBFixture는 MongoDB 테스트 Fixture를 생성합니다.
// packageName을 전달하면 동일 이름의 컨테이너를 재사용하여 테스트 속도를 높입니다.
func GetMongoDBFixture(ctx context.Context, packageName string) (*MongoDBFixture, error) {
    // Ryuk(리소스 정리 컨테이너) 비활성화 - CI 환경에서 권장
    os.Setenv("TESTCONTAINERS_RYUK_DISABLED", "true")
    
    // ReplicaSet 활성화 - 트랜잭션 테스트에 필요
    replicaSetName := "rs0"
    
    mongoContainer, err := mongodb.Run(ctx,
        "public.ecr.aws/docker/library/mongo:8",  // 공식 ECR 이미지
        mongodb.WithReplicaSet(replicaSetName),   // 트랜잭션 지원
        testcontainers.WithReuseByName(packageName), // 컨테이너 재사용으로 속도 향상
    )
    if err != nil {
        return nil, err
    }
    
    // 연결 문자열 가져오기
    connString, err := mongoContainer.ConnectionString(ctx)
    if err != nil {
        return nil, err
    }
    
    // ReplicaSet 사용 시 Direct 연결 필요
    clientOpts := options.Client().ApplyURI(connString)
    clientOpts.SetDirect(true)
    
    mongoClient, err := mongo.Connect(ctx, clientOpts)
    if err != nil {
        return nil, err
    }
    
    // 연결 확인
    if err := mongoClient.Ping(ctx, nil); err != nil {
        return nil, err
    }
    
    // cleanup 클로저 - 컨테이너와 클라이언트 정리
    cleanup := func(client *mongo.Client, container *mongodb.MongoDBContainer) func() {
        return func() {
            client.Disconnect(ctx)
            container.Terminate(ctx)
        }
    }(mongoClient, mongoContainer)
    
    return &MongoDBFixture{
        container: mongoContainer,
        client:    mongoClient,
        cleanup:   cleanup,
    }, nil
}
```

### Redis Fixture

```go
// testutils/redis.go
package testutils

import (
    "context"
    "os"
    
    goredis "github.com/redis/go-redis/v9"
    "github.com/testcontainers/testcontainers-go/modules/redis"
)

type RedisFixture struct {
    container *redis.RedisContainer
    client    *goredis.Client
    cleanup   func()
}

func (f *RedisFixture) GetClient() *goredis.Client {
    return f.client
}

func (f *RedisFixture) Cleanup() {
    f.cleanup()
}

func (f *RedisFixture) GetConnectionString() (string, error) {
    return f.container.Endpoint(context.Background(), "")
}

func GetRedisFixture(ctx context.Context, packageName string) (*RedisFixture, error) {
    os.Setenv("TESTCONTAINERS_RYUK_DISABLED", "true")
    
    redisContainer, err := redis.Run(ctx,
        "public.ecr.aws/docker/library/redis:alpine",
    )
    if err != nil {
        return nil, err
    }
    
    // Endpoint로 host:port 형태의 주소 획득
    redisAddr, err := redisContainer.Endpoint(ctx, "")
    if err != nil {
        return nil, err
    }
    
    // Options에 직접 Addr 설정
    redisClient := goredis.NewClient(&goredis.Options{
        Addr: redisAddr,
    })
    
    if err := redisClient.Ping(ctx).Err(); err != nil {
        return nil, err
    }
    
    cleanup := func(client *goredis.Client, container *redis.RedisContainer) func() {
        return func() {
            client.Close()
            container.Terminate(ctx)
        }
    }(redisClient, redisContainer)
    
    return &RedisFixture{
        container: redisContainer,
        client:    redisClient,
        cleanup:   cleanup,
    }, nil
}
```

### 테스트 스위트 설정

```go
// internal/document/document_suite_test.go
package document_test

import (
    "context"
    "testing"
    
    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
    
    "myapp/testutil"
)

var (
    testEnv *testutil.TestEnvironment
    testCtx context.Context
)

func TestDocument(t *testing.T) {
    RegisterFailHandler(Fail)
    RunSpecs(t, "Document Suite")
}

var _ = BeforeSuite(func() {
    var err error
    testCtx = context.Background()
    
    By("테스트 환경 초기화")
    testEnv, err = testutil.NewTestEnvironment(testCtx)
    Expect(err).NotTo(HaveOccurred())
    
    By("MongoDB 연결 확인")
    // ... 연결 테스트
})

var _ = AfterSuite(func() {
    By("테스트 환경 정리")
    testEnv.Cleanup(testCtx)
})
```

## 테스트 작성

### 문서 서비스 통합 테스트

```go
// internal/document/service_integration_test.go
package document_test

import (
    "context"
    
    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
    
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    
    "myapp/internal/document"
)

var _ = Describe("DocumentService 통합 테스트", Label("integration"), func() {
    var (
        service    document.Service
        collection *mongo.Collection
        ctx        context.Context
    )
    
    BeforeEach(func() {
        ctx = context.Background()
        
        // 테스트용 MongoDB 클라이언트
        client, err := mongo.Connect(ctx, options.Client().ApplyURI(testEnv.MongoURI))
        Expect(err).NotTo(HaveOccurred())
        
        // 테스트마다 새 컬렉션 사용
        dbName := "test_db"
        collName := "test_collection_" + GinkgoParallelProcess()
        collection = client.Database(dbName).Collection(collName)
        
        // 서비스 생성
        service = document.NewService(client, dbName)
    })
    
    AfterEach(func() {
        // 테스트 데이터 정리
        collection.Drop(ctx)
    })
    
    Describe("Create", func() {
        Context("유효한 문서가 주어졌을 때", func() {
            It("버전 1의 새 문서를 생성한다", func() {
                input := document.CreateInput{
                    URI: "doc-001",
                    Fields: map[string]interface{}{
                        "name":  "Test Document",
                        "value": 42,
                    },
                }
                
                doc, err := service.Create(ctx, "test_collection", input)
                
                Expect(err).NotTo(HaveOccurred())
                Expect(doc.URI).To(Equal("doc-001"))
                Expect(doc.Version).To(Equal(int32(1)))
                Expect(doc.Fields["name"]).To(Equal("Test Document"))
            })
        })
        
        Context("중복 URI가 주어졌을 때", func() {
            BeforeEach(func() {
                _, err := service.Create(ctx, "test_collection", document.CreateInput{
                    URI:    "doc-001",
                    Fields: map[string]interface{}{},
                })
                Expect(err).NotTo(HaveOccurred())
            })
            
            It("에러를 반환한다", func() {
                _, err := service.Create(ctx, "test_collection", document.CreateInput{
                    URI:    "doc-001",
                    Fields: map[string]interface{}{},
                })
                
                Expect(err).To(HaveOccurred())
                Expect(err).To(MatchError(ContainSubstring("duplicate")))
            })
        })
    })
    
    Describe("SoftUpdate", func() {
        var existingDoc *document.Document
        
        BeforeEach(func() {
            var err error
            existingDoc, err = service.Create(ctx, "test_collection", document.CreateInput{
                URI:    "doc-update-test",
                Fields: map[string]interface{}{"name": "Original"},
            })
            Expect(err).NotTo(HaveOccurred())
        })
        
        Context("정상적인 업데이트 요청일 때", func() {
            It("새 버전을 생성하고 기존 버전을 보존한다", func() {
                updated, err := service.SoftUpdate(ctx, "test_collection", "doc-update-test", 
                    document.UpdateInput{
                        Fields: map[string]interface{}{"name": "Updated"},
                    },
                )
                
                Expect(err).NotTo(HaveOccurred())
                Expect(updated.Version).To(Equal(int32(2)))
                Expect(updated.Fields["name"]).To(Equal("Updated"))
                
                // 이전 버전이 보존되는지 확인
                history, err := service.GetHistory(ctx, "test_collection", "doc-update-test")
                Expect(err).NotTo(HaveOccurred())
                Expect(history).To(HaveLen(2))
                Expect(history[0].Version).To(Equal(int32(1)))
                Expect(history[1].Version).To(Equal(int32(2)))
            })
        })
    })
    
    Describe("SoftDelete", func() {
        BeforeEach(func() {
            _, err := service.Create(ctx, "test_collection", document.CreateInput{
                URI:    "doc-delete-test",
                Fields: map[string]interface{}{"data": "value"},
            })
            Expect(err).NotTo(HaveOccurred())
        })
        
        It("문서를 DELETED 상태로 마킹한다", func() {
            deleted, err := service.SoftDelete(ctx, "test_collection", "doc-delete-test")
            
            Expect(err).NotTo(HaveOccurred())
            Expect(deleted.Status).To(Equal(document.StatusDeleted))
            
            // 최신 버전 조회 시 찾을 수 없음
            _, err = service.FindLatest(ctx, "test_collection", "doc-delete-test")
            Expect(err).To(MatchError(document.ErrNotFound))
        })
    })
})
```

### Redis 통합 테스트

```go
// internal/worker/worker_integration_test.go
package worker_test

import (
    "context"
    "time"
    
    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
    
    "github.com/redis/go-redis/v9"
    
    "myapp/internal/worker"
)

var _ = Describe("StreamWorker 통합 테스트", Label("integration"), func() {
    var (
        redisClient redis.UniversalClient
        ctx         context.Context
    )
    
    BeforeEach(func() {
        ctx = context.Background()
        
        redisClient = redis.NewClient(&redis.Options{
            Addr: testEnv.RedisAddr,
        })
        
        // 이전 테스트 데이터 정리
        redisClient.FlushAll(ctx)
    })
    
    AfterEach(func() {
        redisClient.Close()
    })
    
    Describe("메시지 처리", func() {
        Context("정상 메시지가 발행되었을 때", func() {
            It("핸들러가 호출되고 ACK 처리된다", func() {
                processed := make(chan string, 1)
                
                handler := &testHandler{
                    onHandle: func(msgs []*worker.Message) []error {
                        for _, m := range msgs {
                            processed <- m.ID
                        }
                        return nil
                    },
                }
                
                w := worker.NewStreamWorker(
                    redisClient,
                    handler,
                    worker.WithStream("test-stream"),
                    worker.WithGroup("test-group"),
                    worker.WithBatchSize(1),
                    worker.WithPollInterval(50*time.Millisecond),
                )
                
                w.Start(ctx)
                defer w.Stop()
                
                // 메시지 발행
                redisClient.XAdd(ctx, &redis.XAddArgs{
                    Stream: "test-stream",
                    Values: map[string]interface{}{"data": "test"},
                })
                
                // 처리 확인
                Eventually(processed).Should(Receive())
                
                // ACK 확인 (Pending 없음)
                pending, _ := redisClient.XPending(ctx, "test-stream", "test-group").Result()
                Expect(pending.Count).To(BeZero())
            })
        })
        
        Context("처리 실패 시", func() {
            It("Dead Letter 스트림으로 이동한다", func() {
                handler := &testHandler{
                    onHandle: func(msgs []*worker.Message) []error {
                        return []error{errors.New("processing failed")}
                    },
                }
                
                w := worker.NewStreamWorker(
                    redisClient,
                    handler,
                    worker.WithStream("test-stream"),
                    worker.WithGroup("test-group"),
                    worker.WithMaxRetries(1),
                    worker.WithDeadLetterStream("dead-letters"),
                )
                
                w.Start(ctx)
                defer w.Stop()
                
                // 메시지 발행
                redisClient.XAdd(ctx, &redis.XAddArgs{
                    Stream: "test-stream",
                    Values: map[string]interface{}{"data": "fail"},
                })
                
                // Dead Letter 확인
                Eventually(func() int64 {
                    len, _ := redisClient.XLen(ctx, "dead-letters").Result()
                    return len
                }).Should(BeNumerically(">", 0))
            })
        })
    })
})

type testHandler struct {
    onHandle func([]*worker.Message) []error
}

func (h *testHandler) Handle(ctx context.Context, msgs []*worker.Message) []error {
    return h.onHandle(msgs)
}
```

## 테이블 드리븐 테스트

Ginkgo의 `DescribeTable`로 다양한 케이스 커버:

```go
var _ = Describe("스키마 검증", func() {
    DescribeTable("유효한 문서",
        func(fields map[string]interface{}, expectValid bool) {
            err := validator.Validate(schema, fields)
            
            if expectValid {
                Expect(err).NotTo(HaveOccurred())
            } else {
                Expect(err).To(HaveOccurred())
            }
        },
        Entry("모든 필수 필드 존재", map[string]interface{}{
            "name": "test", "email": "test@example.com",
        }, true),
        Entry("필수 필드 누락", map[string]interface{}{
            "name": "test",
        }, false),
        Entry("잘못된 타입", map[string]interface{}{
            "name": 123, "email": "test@example.com",
        }, false),
    )
})
```

## 테스트 실행

### 기본 실행

```bash
# 모든 테스트
ginkgo ./...

# 상세 출력
ginkgo -v ./...

# 통합 테스트만
ginkgo --label-filter="integration" ./...

# 유닛 테스트만 (통합 제외)
ginkgo --label-filter="!integration" ./...
```

### 병렬 실행

```bash
# 프로세스 자동 결정
ginkgo -p ./...

# 프로세스 수 지정
ginkgo -procs=4 ./...
```

### 커버리지

```bash
ginkgo -cover -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

## Makefile 통합

```makefile
# 기본 테스트 플래그 + 추가 인자는 TESTFLAGS로 전달
TEST_FLAGS = --skip-package "./deps"
TEST_FLAGS += $(TESTFLAGS)
TEST_TIMEOUT = 30m
COVERAGE_OUT = coverage.out

.PHONY: test test-verbose unit-test integration-test coverage-test cov-html

test:
 ginkgo -r $(TEST_FLAGS) --timeout=$(TEST_TIMEOUT)

test-verbose:
 ginkgo -r $(TEST_FLAGS) --timeout=$(TEST_TIMEOUT) -v

unit-test:
 ginkgo -r $(TEST_FLAGS) --label-filter="!integration" --junit-report=unit-test-report.xml --timeout=$(TEST_TIMEOUT)

integration-test:
 ginkgo -r $(TEST_FLAGS) --label-filter="integration" --junit-report=integration-test-report.xml --timeout=$(TEST_TIMEOUT)

coverage-test:
 ginkgo -r -cover --coverprofile=$(COVERAGE_OUT) --timeout=$(TEST_TIMEOUT)

cov-html: coverage-test
 go tool cover -html=$(COVERAGE_OUT) -o coverage.html
```

### 사용 예시

```bash
# 전체 테스트
make test

# 상세 출력
make test-verbose

# 유닛 테스트만
make unit-test

# 통합 테스트만
make integration-test

# 커버리지 HTML 리포트
make cov-html

# 추가 인자 전달 (특정 패키지, focus 등)
make test TESTFLAGS="./internal/document/..."
make test TESTFLAGS='--focus="CreateDocument"'
make test-verbose TESTFLAGS="-p"
```

## CI 설정

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.24'
      
      - name: Install Ginkgo
        run: go install github.com/onsi/ginkgo/v2/ginkgo@latest
      
      - name: Run Unit Tests
        run: ginkgo -r --label-filter="!integration"
  
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.24'
      
      - name: Install Ginkgo
        run: go install github.com/onsi/ginkgo/v2/ginkgo@latest
      
      - name: Run Integration Tests
        run: ginkgo -r --label-filter="integration" --timeout=30m
```

## 모범 사례

1. **Label 사용**: `integration` 라벨로 유닛/통합 테스트 분리
2. **병렬 안전**: `GinkgoParallelProcess()`로 리소스 이름 분리
3. **정리 철저**: `AfterEach`로 테스트 데이터 반드시 정리
4. **타임아웃 설정**: 통합 테스트는 충분한 타임아웃 설정
5. **실패 격리**: 한 테스트 실패가 다른 테스트에 영향 없도록

## 참고 자료

- [Ginkgo 공식 문서](https://onsi.github.io/ginkgo/)
- [Gomega 공식 문서](https://onsi.github.io/gomega/)
- [Testcontainers Go](https://golang.testcontainers.org/)
