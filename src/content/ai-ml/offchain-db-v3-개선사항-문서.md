---
public: false
title: Offchain DB v3 개선사항 문서
date: '2025-12-27'
category: AI_ML
tags: []
excerpt: >-
  Offchain DB v3 개선사항 문서

   개요
  이 문서는 Offchain DB v3 프로젝트의 코드 분석을 통해 발견된 개선사항을 정리한 것입니다. 각 항목은 문제점, 영향도, 그리고
  구체적인 개선 방안을 포함합니다.

   1. 아키텍처 설계 개선...
---

# Offchain DB v3 개선사항 문서

## 개요

이 문서는 Offchain DB v3 프로젝트의 코드 분석을 통해 발견된 개선사항을 정리한 것입니다. 각 항목은 문제점, 영향도, 그리고 구체적인 개선 방안을 포함합니다.

## 1. 아키텍처 설계 개선

### 1.1 순환 참조 위험 제거

**현재 문제점**

- API 레이어가 AuditProducer를 직접 의존
- 감사 로깅 로직이 API 계층에 강하게 결합
- 테스트 용이성 저하

**개선 방안**

```go
// internal/audit/interfaces.go
package audit

type AuditLogger interface {
    LogCollectionEvent(ctx context.Context, event CollectionEvent) error
    LogDocumentEvent(ctx context.Context, event DocumentEvent) error
}

type CollectionEvent struct {
    OperationType OperationType
    CollectionID  string
    Data         interface{}
    ActorID      string
}

type DocumentEvent struct {
    OperationType OperationType
    CollectionID  string
    DocumentID    string
    Data         interface{}
    ActorID      string
}
```

**작업 항목**

- [ ] AuditLogger 인터페이스 생성
- [ ] AuditProducer를 인터페이스 구현체로 변경
- [ ] API 레이어에서 인터페이스 사용하도록 수정
- [ ] Mock 구현체 작성 및 테스트 개선

### 1.2 이중 감사 로깅 통합

**현재 문제점**

- Document Service: MongoDB에 직접 감사 로그 저장
- API Layer: Redis Streams로 감사 로그 발행
- 데이터 일관성 문제 가능성

**개선 방안**

```go
// internal/audit/service.go
package audit

type UnifiedAuditService struct {
    repository AuditRepository
    publisher  EventPublisher
}

func (s *UnifiedAuditService) LogEvent(ctx context.Context, event AuditEvent) error {
    // 1. 이벤트 영속화
    if err := s.repository.Save(ctx, event); err != nil {
        return err
    }
    
    // 2. 이벤트 발행 (비동기 처리를 위해)
    return s.publisher.Publish(ctx, event)
}
```

**작업 항목**

- [ ] Document Service의 감사 로깅 제거
- [ ] UnifiedAuditService 구현
- [ ] 모든 감사 로깅을 새 서비스로 이관

## 2. 에러 처리 표준화

### 2.1 구조화된 에러 시스템

**현재 문제점**

- 일관성 없는 에러 처리
- 에러 무시 또는 단순 로깅
- 디버깅 어려움

**개선 방안**

```go
// internal/errors/errors.go
package errors

type ErrorCode string

const (
    ErrCodeNotFound      ErrorCode = "NOT_FOUND"
    ErrCodeInvalidInput  ErrorCode = "INVALID_INPUT"
    ErrCodeInternal      ErrorCode = "INTERNAL_ERROR"
    ErrCodeUnauthorized  ErrorCode = "UNAUTHORIZED"
)

type ServiceError struct {
    Code       ErrorCode
    Message    string
    Details    map[string]interface{}
    Cause      error
    StackTrace string
}

func (e ServiceError) Error() string {
    return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Helper functions
func NotFound(message string) ServiceError {
    return ServiceError{
        Code:       ErrCodeNotFound,
        Message:    message,
        StackTrace: debug.Stack(),
    }
}

func WrapInternal(err error, message string) ServiceError {
    return ServiceError{
        Code:       ErrCodeInternal,
        Message:    message,
        Cause:      err,
        StackTrace: debug.Stack(),
    }
}
```

**작업 항목**

- [ ] 에러 패키지 생성 및 에러 타입 정의
- [ ] 모든 서비스에서 새 에러 시스템 사용
- [ ] gRPC 에러 매핑 구현
- [ ] 에러 로깅 및 메트릭 수집 추가

## 3. 코드 품질 향상

### 3.1 상수 정의 및 매직 넘버 제거

**개선 방안**

```go
// internal/constants/constants.go
package constants

import "time"

// Worker 관련 상수
const (
    DefaultShutdownTimeout = 30 * time.Second
    DefaultBatchSize       = 10
    DefaultPollInterval    = time.Second
)

// Pagination 관련 상수
const (
    DefaultPageSize = 50
    MaxPageSize     = 1000
)

// System 관련 상수
const (
    SystemUser        = "system"
    SystemActorPrefix = "system:"
)
```

**작업 항목**

- [ ] constants 패키지 생성
- [ ] 모든 매직 넘버/문자열을 상수로 추출
- [ ] 기존 코드에서 상수 사용하도록 리팩토링

### 3.2 Context 처리 개선

**개선 방안**

```go
// internal/context/context.go
package context

type contextKey string

const (
    userContextKey      contextKey = "user"
    requestIDContextKey contextKey = "request_id"
    traceIDContextKey   contextKey = "trace_id"
)

func WithUser(ctx context.Context, user string) context.Context {
    return context.WithValue(ctx, userContextKey, user)
}

func GetUser(ctx context.Context) (string, bool) {
    user, ok := ctx.Value(userContextKey).(string)
    if !ok || user == "" {
        return constants.SystemUser, false
    }
    return user, true
}

func WithRequestID(ctx context.Context, requestID string) context.Context {
    return context.WithValue(ctx, requestIDContextKey, requestID)
}

func GetRequestID(ctx context.Context) string {
    if id, ok := ctx.Value(requestIDContextKey).(string); ok {
        return id
    }
    return uuid.New().String()
}
```

**작업 항목**

- [ ] Context helper 패키지 구현
- [ ] 인증 미들웨어에서 user context 설정
- [ ] 모든 서비스에서 context helper 사용

## 4. 동시성 및 성능 최적화

### 4.1 트랜잭션 일관성

**개선 방안**

```go
// internal/database/transaction.go
package database

type TransactionManager interface {
    Execute(ctx context.Context, fn TxFunc) error
}

type TxFunc func(ctx context.Context) error

type MongoTransactionManager struct {
    client *mongo.Client
}

func (m *MongoTransactionManager) Execute(ctx context.Context, fn TxFunc) error {
    session, err := m.client.StartSession()
    if err != nil {
        return err
    }
    defer session.EndSession(ctx)
    
    _, err = session.WithTransaction(ctx, func(sessionCtx mongo.SessionContext) (interface{}, error) {
        return nil, fn(sessionCtx)
    })
    
    return err
}
```

**작업 항목**

- [ ] TransactionManager 인터페이스 정의
- [ ] MongoDB 트랜잭션 매니저 구현
- [ ] Document Service에 트랜잭션 적용
- [ ] 트랜잭션 경계 명확화

### 4.2 Batch 작업 최적화

**개선 방안**

```go
// internal/audit/batch.go
package audit

type BatchAuditLogger struct {
    buffer    []AuditEvent
    batchSize int
    flushInterval time.Duration
    logger    AuditLogger
    mu        sync.Mutex
}

func (b *BatchAuditLogger) Log(event AuditEvent) {
    b.mu.Lock()
    b.buffer = append(b.buffer, event)
    
    if len(b.buffer) >= b.batchSize {
        go b.flush()
    }
    b.mu.Unlock()
}

func (b *BatchAuditLogger) flush() {
    b.mu.Lock()
    events := b.buffer
    b.buffer = nil
    b.mu.Unlock()
    
    if len(events) > 0 {
        b.logger.LogBatch(context.Background(), events)
    }
}
```

**작업 항목**

- [ ] Batch 감사 로깅 구현
- [ ] Buffer 및 flush 로직 추가
- [ ] 성능 테스트 및 최적화

## 5. 보안 및 검증 강화

### 5.1 입력 검증 시스템

**개선 방안**

```go
// internal/validation/validator.go
package validation

type Validator interface {
    Validate(collection string, document map[string]interface{}) error
}

type SchemaValidator struct {
    schemas map[string]*Schema
}

type Schema struct {
    Fields     map[string]FieldDefinition
    Required   []string
    Validators []CustomValidator
}

type FieldDefinition struct {
    Type       string
    Required   bool
    Validators []FieldValidator
}

func (v *SchemaValidator) Validate(collection string, document map[string]interface{}) error {
    schema, exists := v.schemas[collection]
    if !exists {
        return nil // 스키마가 없으면 검증 생략
    }
    
    // Required 필드 검증
    for _, field := range schema.Required {
        if _, ok := document[field]; !ok {
            return ValidationError{
                Field:   field,
                Message: "required field missing",
            }
        }
    }
    
    // 각 필드 타입 및 제약사항 검증
    for fieldName, fieldDef := range schema.Fields {
        if err := v.validateField(fieldName, document[fieldName], fieldDef); err != nil {
            return err
        }
    }
    
    return nil
}
```

**작업 항목**

- [ ] Validation 패키지 구현
- [ ] Schema 정의 및 로딩 메커니즘
- [ ] Document Service에 검증 적용
- [ ] 검증 실패 시 명확한 에러 메시지

## 6. 테스트 및 관찰성

### 6.1 테스트 개선

**개선 방안**

```go
// internal/testutils/fixtures.go
package testutils

type TestFixtures struct {
    MongoDB  *MongoDBContainer
    Redis    *RedisContainer
    Services *ServiceContainer
}

func SetupIntegrationTest(t *testing.T) *TestFixtures {
    // Docker containers 시작
    // Services 초기화
    // Test data 설정
}

// Mock 구현체들
type MockAuditLogger struct {
    mock.Mock
}

func (m *MockAuditLogger) LogEvent(ctx context.Context, event AuditEvent) error {
    args := m.Called(ctx, event)
    return args.Error(0)
}
```

**작업 항목**

- [ ] 테스트 fixture 패키지 구현
- [ ] 모든 인터페이스의 Mock 구현
- [ ] Unit test coverage 80% 이상 달성
- [ ] Integration test 시나리오 확대

### 6.2 관찰성(Observability) 구현

**개선 방안**

```go
// internal/observability/metrics.go
package observability

var (
    DocumentOperations = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "document_operations_total",
            Help: "Total number of document operations",
        },
        []string{"operation", "collection", "status"},
    )
    
    OperationDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "operation_duration_seconds",
            Help: "Duration of operations in seconds",
        },
        []string{"operation", "service"},
    )
)

// internal/observability/tracing.go
func StartSpan(ctx context.Context, name string) (context.Context, trace.Span) {
    return otel.Tracer("offchain-db").Start(ctx, name)
}

// Usage example
func (s *DocumentService) Create(ctx context.Context, ...) error {
    ctx, span := observability.StartSpan(ctx, "document.create")
    defer span.End()
    
    start := time.Now()
    defer func() {
        observability.OperationDuration.WithLabelValues("create", "document").
            Observe(time.Since(start).Seconds())
    }()
    
    // ... business logic ...
}
```

**작업 항목**

- [ ] Prometheus 메트릭 설정
- [ ] OpenTelemetry 추적 구현
- [ ] 주요 비즈니스 메트릭 정의
- [ ] 대시보드 구성 (Grafana)

## 7. 설정 관리 개선

### 7.1 Secret Manager 통합

**개선 방안**

```go
// internal/config/secrets.go
package config

type SecretManager interface {
    GetSecret(ctx context.Context, key string) (string, error)
}

type SecretManagerImpl struct {
    provider SecretProvider
}

func (s *SecretManagerImpl) ResolveSecrets(cfg *Config) error {
    // "secret://" prefix로 시작하는 값들을 실제 secret으로 교체
    if strings.HasPrefix(cfg.MongoConnectionString, "secret://") {
        secret, err := s.GetSecret(ctx, strings.TrimPrefix(cfg.MongoConnectionString, "secret://"))
        if err != nil {
            return err
        }
        cfg.MongoConnectionString = secret
    }
    return nil
}
```

**작업 항목**

- [ ] SecretManager 인터페이스 정의
- [ ] AWS/GCP Secret Manager 구현체
- [ ] 설정 로딩 시 secret 자동 해결
- [ ] Local 개발용 파일 기반 secret 지원

## 8. Dead Letter Queue 개선

### 8.1 자동 재처리 메커니즘

**개선 방안**

```go
// internal/worker/deadletter/reprocessor.go
package deadletter

type ReprocessStrategy interface {
    ShouldReprocess(msg *DeadLetterMessage) bool
    GetDelay(attemptCount int) time.Duration
}

type ExponentialBackoffStrategy struct {
    MaxAttempts  int
    InitialDelay time.Duration
    MaxDelay     time.Duration
}

type DeadLetterReprocessor struct {
    repository DeadLetterRepository
    publisher  MessagePublisher
    strategy   ReprocessStrategy
}

func (r *DeadLetterReprocessor) ProcessDeadLetters(ctx context.Context) error {
    messages, err := r.repository.GetReprocessableMessages(ctx)
    if err != nil {
        return err
    }
    
    for _, msg := range messages {
        if r.strategy.ShouldReprocess(msg) {
            delay := r.strategy.GetDelay(msg.AttemptCount)
            
            // Schedule reprocessing
            if err := r.scheduleReprocess(ctx, msg, delay); err != nil {
                log.Error("Failed to schedule reprocess", zap.Error(err))
                continue
            }
            
            msg.AttemptCount++
            msg.LastAttemptAt = time.Now()
            
            if err := r.repository.Update(ctx, msg); err != nil {
                log.Error("Failed to update dead letter", zap.Error(err))
            }
        }
    }
    
    return nil
}
```

**작업 항목**

- [ ] Dead Letter 재처리 전략 인터페이스
- [ ] Exponential Backoff 구현
- [ ] 재처리 스케줄러 구현
- [ ] 모니터링 및 알림 설정

## 10. DDD 기반 구조 개선

### 10.1 Bounded Context 구현

**새로운 디렉토리 구조**

```
internal/
├── contexts/
│   ├── storage/              # Storage Bounded Context
│   │   ├── domain/
│   │   │   ├── collection/
│   │   │   │   ├── aggregate.go
│   │   │   │   ├── repository.go
│   │   │   │   └── events.go
│   │   │   ├── document/
│   │   │   │   ├── entity.go
│   │   │   │   ├── value_objects.go
│   │   │   │   └── specifications.go
│   │   │   └── events/
│   │   │       └── events.go
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   └── services/
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   └── messaging/
│   │   └── interfaces/
│   │       └── grpc/
│   │
│   └── audit/               # Audit Bounded Context
│       ├── domain/
│       │   ├── auditlog/
│       │   └── proof/
│       ├── application/
│       └── infrastructure/
│
├── shared/                  # Shared Kernel
│   ├── domain/
│   │   └── base/
│   └── infrastructure/
│       ├── messaging/
│       └── persistence/
```

### 10.2 Domain Model 구현

**개선 방안**

```go
// internal/contexts/storage/domain/document/entity.go
package document

type Document struct {
    id         DocumentID
    collection CollectionID
    data       map[string]interface{}
    metadata   Metadata
    events     []domain.Event
}

// Factory method
func NewDocument(collectionID CollectionID, data map[string]interface{}) (*Document, error) {
    if err := validateDocumentData(data); err != nil {
        return nil, err
    }
    
    doc := &Document{
        id:         NewDocumentID(),
        collection: collectionID,
        data:       data,
        metadata:   NewMetadata(),
        events:     []domain.Event{},
    }
    
    doc.recordEvent(DocumentCreated{
        DocumentID:   doc.id,
        CollectionID: collectionID,
        Data:        data,
        OccurredAt:  time.Now(),
    })
    
    return doc, nil
}

// Business methods
func (d *Document) Update(updates map[string]interface{}) error {
    // Validation
    if err := d.validateUpdate(updates); err != nil {
        return err
    }
    
    // Track changes
    changes := d.trackChanges(updates)
    
    // Apply updates
    d.applyUpdates(updates)
    d.metadata.IncrementVersion()
    
    // Record event
    d.recordEvent(DocumentUpdated{
        DocumentID: d.id,
        Changes:    changes,
        OccurredAt: time.Now(),
    })
    
    return nil
}

// Domain Events
func (d *Document) Events() []domain.Event {
    return d.events
}

func (d *Document) ClearEvents() {
    d.events = []domain.Event{}
}
```

### 10.3 Application Service 구현

**개선 방안**

```go
// internal/contexts/storage/application/commands/create_document.go
package commands

type CreateDocumentCommand struct {
    CollectionID string
    Data        map[string]interface{}
    ActorID     string
}

type CreateDocumentHandler struct {
    collections collections.Repository
    documents   documents.Repository
    eventBus    messaging.EventBus
    validator   validation.Validator
}

func (h *CreateDocumentHandler) Handle(ctx context.Context, cmd CreateDocumentCommand) (*DocumentDTO, error) {
    // 1. Load aggregate
    collection, err := h.collections.FindByID(ctx, collection.CollectionID(cmd.CollectionID))
    if err != nil {
        return nil, errors.Wrap(err, "collection not found")
    }
    
    // 2. Validate against collection schema
    if err := h.validator.ValidateDocument(collection.Schema(), cmd.Data); err != nil {
        return nil, errors.Wrap(err, "validation failed")
    }
    
    // 3. Create document (domain logic)
    doc, err := document.NewDocument(collection.ID(), cmd.Data)
    if err != nil {
        return nil, errors.Wrap(err, "failed to create document")
    }
    
    // 4. Persist
    if err := h.documents.Save(ctx, doc); err != nil {
        return nil, errors.Wrap(err, "failed to save document")
    }
    
    // 5. Publish domain events
    for _, event := range doc.Events() {
        if err := h.eventBus.Publish(ctx, event); err != nil {
            // Log but don't fail - eventual consistency
            log.Error("Failed to publish event", zap.Error(err))
        }
    }
    
    // 6. Return DTO
    return ToDocumentDTO(doc), nil
}
```

### 10.4 Infrastructure 구현

**개선 방안**

```go
// internal/contexts/storage/infrastructure/persistence/mongo_document_repository.go
package persistence

type MongoDocumentRepository struct {
    db         *mongo.Database
    collection string
}

func (r *MongoDocumentRepository) Save(ctx context.Context, doc *document.Document) error {
    // Domain Model -> MongoDB Document
    mongoDoc := r.toMongoDocument(doc)
    
    opts := options.Replace().SetUpsert(true)
    _, err := r.db.Collection(r.collection).
        ReplaceOne(ctx, bson.M{"_id": doc.ID()}, mongoDoc, opts)
    
    return err
}

func (r *MongoDocumentRepository) FindByID(ctx context.Context, id document.DocumentID) (*document.Document, error) {
    var mongoDoc bson.M
    
    err := r.db.Collection(r.collection).
        FindOne(ctx, bson.M{"_id": id}).
        Decode(&mongoDoc)
    
    if err == mongo.ErrNoDocuments {
        return nil, errors.NotFound("document not found")
    }
    
    if err != nil {
        return nil, errors.Wrap(err, "failed to find document")
    }
    
    // MongoDB Document -> Domain Model
    return r.toDomainDocument(mongoDoc), nil
}

// Anti-corruption layer methods
func (r *MongoDocumentRepository) toMongoDocument(doc *document.Document) bson.M {
    return bson.M{
        "_id":        doc.ID(),
        "collection": doc.CollectionID(),
        "data":       doc.Data(),
        "metadata": bson.M{
            "version":    doc.Version(),
            "created_at": doc.CreatedAt(),
            "updated_at": doc.UpdatedAt(),
        },
    }
}

func (r *MongoDocumentRepository) toDomainDocument(mongoDoc bson.M) *document.Document {
    // Reconstruction logic
    return document.Reconstruct(
        mongoDoc["_id"].(string),
        mongoDoc["collection"].(string),
        mongoDoc["data"].(bson.M),
        // ... metadata
    )
}
```

**작업 항목**

- [ ] Bounded Context 별 디렉토리 구조 생성
- [ ] Domain Model 구현 (Entity, Value Object, Aggregate)
- [ ] Domain Event 정의 및 발행 메커니즘
- [ ] Application Service (Command/Query Handlers) 구현
- [ ] Repository 인터페이스 및 구현체
- [ ] Anti-corruption Layer 구현
- [ ] Domain Service 정의 및 구현
- [ ] Specification Pattern 적용

## 실행 계획

### Phase 1 (1-2주)

- 에러 처리 시스템 구현
- 상수 정의 및 매직 넘버 제거
- Context 처리 개선

### Phase 2 (2-3주)

- DDD 구조로 리팩토링
- Domain Model 구현
- Repository Pattern 적용

### Phase 3 (2-3주)

- 트랜잭션 일관성 구현
- 검증 시스템 구축
- 테스트 커버리지 개선

### Phase 4 (1-2주)

- 관찰성 구현 (메트릭, 추적)
- Dead Letter Queue 개선
- 성능 최적화

이 문서를 기반으로 단계적으로 개선 작업을 진행하시면 됩니다. 각 작업 항목은 독립적으로 수행 가능하도록 구성했습니다.
