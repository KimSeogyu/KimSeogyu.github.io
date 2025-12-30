---
public: true
title: Buf v2 기반 Proto 관리 및 코드 자동 생성
date: '2025-12-30'
category: Backend
tags: [Go, Protobuf, buf, gRPC, gRPC-Gateway, OpenAPI]
excerpt: "Buf v2를 활용하여 Protobuf 스키마를 체계적으로 관리하고, gRPC 서버/클라이언트, HTTP Gateway, OpenAPI 스펙을 자동 생성하는 방법을 알아봅니다."
---
# Buf v2 기반 Proto 관리 및 코드 자동 생성

## 개요

대규모 gRPC 서비스에서 **Protobuf 스키마**는 서비스 계약의 핵심입니다. **Buf v2**는 Proto 파일의 린트, Breaking Change 감지, 다중 언어 코드 생성을 통합 관리합니다.

## 왜 Buf인가?

### protoc 대비 장점

| 기능 | protoc | buf v2 |
|------|--------|--------|
| 의존성 관리 | 수동 (include 경로) | 자동 (BSR/deps) |
| 린팅 | 별도 도구 필요 | 내장 + 커스텀 규칙 |
| Breaking Change | 없음 | 자동 감지 |
| 플러그인 관리 | 로컬 설치 필수 | Remote Plugins 지원 |
| 설정 | 복잡한 CLI 플래그 | YAML 설정 파일 |

### 단점

| 특성 | 설명 |
|------|------|
| 학습 곡선 | 신규 설정 체계 이해 필요 |
| BSR 의존성 | 일부 기능은 Buf Schema Registry 필요 |
| 네트워크 | Remote Plugins 사용 시 인터넷 연결 필요 |

## 프로젝트 구조

### Proto 전용 레포지토리

```
proto-service/
├── buf.yaml              # 모듈 설정
├── buf.gen.yaml          # 코드 생성 설정
├── buf.lock              # 의존성 락 파일
├── deps/                 # 로컬 의존성 (선택)
│   └── custom/
│       └── options.proto
└── proto/
    └── v1beta/
        └── api.proto     # 서비스 정의
```

## 설정 파일

### buf.yaml (모듈 설정)

```yaml
# buf.yaml
version: v2
modules:
  - path: proto/v1beta
    name: buf.build/myorg/myservice
  - path: deps/custom  # 로컬 의존성 모듈
deps:
  # 외부 의존성 (Google APIs, gRPC-Gateway 등)
  - buf.build/googleapis/googleapis
  - buf.build/grpc-ecosystem/grpc-gateway
  - buf.build/gnostic/gnostic
lint:
  use:
    - STANDARD
  except:
    - FIELD_NOT_REQUIRED
    - PACKAGE_NO_IMPORT_CYCLE
  disallow_comment_ignores: true
breaking:
  use:
    - FILE
  except:
    - EXTENSION_NO_DELETE
    - FIELD_SAME_DEFAULT
```

### buf.gen.yaml (코드 생성 설정)

```yaml
# buf.gen.yaml
version: v2
managed:
  enabled: true
  disable:
    - module: buf.build/googleapis/googleapis
    - module: buf.build/grpc-ecosystem/grpc-gateway
    - module: buf.build/gnostic/gnostic
  override:
    - file_option: go_package_prefix
      value: github.com/myorg/myservice/generated/go/proto/
plugins:
  # Go Protobuf 메시지
  - remote: buf.build/protocolbuffers/go:v1.36.2
    out: generated/go/proto
    opt: paths=source_relative
  
  # gRPC Go 서버/클라이언트
  - remote: buf.build/grpc/go:v1.5.1
    out: generated/go/proto
    opt: paths=source_relative
  
  # gRPC-Gateway (HTTP 핸들러)
  - remote: buf.build/grpc-ecosystem/gateway:v2.25.1
    out: generated/go/proto/gateway
    opt:
      - paths=source_relative
      - standalone=true
  
  # OpenAPI 스펙 자동 생성
  - remote: buf.build/community/google-gnostic-openapi:v0.7.0
    out: generated/docs
    opt: paths=source_relative

inputs:
  - directory: proto/v1beta
  - proto_file: deps/custom/options.proto  # 특정 파일만 포함
```

## Proto 작성 예시

### 서비스 정의

```protobuf
// proto/v1beta/api.proto
syntax = "proto3";

package v1beta;

import "gnostic/openapi/v3/annotations.proto";
import "google/api/annotations.proto";
import "google/protobuf/struct.proto";
import "google/protobuf/timestamp.proto";

// DocumentService는 버전 관리 문서를 관리합니다.
service DocumentService {
  // 새 문서를 생성합니다. 버전 1로 시작됩니다.
  rpc CreateDocument(CreateDocumentRequest) returns (CreateDocumentResponse) {
    option (google.api.http) = {
      post: "/v1beta/collections/{collection}/documents"
      body: "*"
    };
  }
  
  // URI로 문서를 조회합니다. 버전 미지정 시 최신 버전을 반환합니다.
  rpc GetDocument(GetDocumentRequest) returns (GetDocumentResponse) {
    option (google.api.http) = {
      get: "/v1beta/collections/{collection}/documents/{uri}"
    };
  }
  
  // 문서를 업데이트합니다. 새 버전이 생성됩니다.
  rpc UpdateDocument(UpdateDocumentRequest) returns (UpdateDocumentResponse) {
    option (google.api.http) = {
      patch: "/v1beta/collections/{collection}/documents/{uri}"
      body: "*"
    };
  }
  
  // 문서를 삭제합니다. 소프트 삭제로 처리됩니다.
  rpc DeleteDocument(DeleteDocumentRequest) returns (DeleteDocumentResponse) {
    option (google.api.http) = {
      delete: "/v1beta/collections/{collection}/documents/{uri}"
    };
  }
}

// 문서 상태
enum DocumentStatus {
  DOCUMENT_STATUS_UNSPECIFIED = 0;
  DOCUMENT_STATUS_ACTIVE = 1;
  DOCUMENT_STATUS_DELETED = 2;
}

// 문서 모델
message Document {
  // MongoDB ObjectID 문자열
  optional string id = 1 [(gnostic.openapi.v3.property) = {
    description: "문서의 데이터베이스 ID"
    nullable: true
  }];
  
  // 논리적 문서 식별자 (버전 전체에서 공유)
  string uri = 2 [(gnostic.openapi.v3.property) = {
    description: "문서의 고유 식별자"
    nullable: false
  }];
  
  // JSON 스키마를 준수하는 문서 데이터
  google.protobuf.Struct fields = 3 [(gnostic.openapi.v3.property) = {
    description: "문서 필드 데이터"
    nullable: false
  }];
  
  // 버전 번호 (1부터 시작, 업데이트마다 증가)
  int32 version = 4;
  
  // 문서 상태
  DocumentStatus status = 5;
  
  // 생성 시각
  google.protobuf.Timestamp created_at = 6;
  
  // 업데이트 시각
  google.protobuf.Timestamp updated_at = 7;
}

// 요청/응답 메시지들
message CreateDocumentRequest {
  string collection = 1;
  DocumentInput document = 2;
}

message DocumentInput {
  string uri = 1;
  google.protobuf.Struct fields = 2;
}

message CreateDocumentResponse {
  Document document = 1;
}

message GetDocumentRequest {
  string collection = 1;
  string uri = 2;
  optional int32 version = 3;  // 미지정 시 최신 버전
}

message GetDocumentResponse {
  Document document = 1;
}

message UpdateDocumentRequest {
  string collection = 1;
  string uri = 2;
  google.protobuf.Struct fields = 3;
  optional int32 expected_version = 4;  // Optimistic Locking
}

message UpdateDocumentResponse {
  Document document = 1;
}

message DeleteDocumentRequest {
  string collection = 1;
  string uri = 2;
}

message DeleteDocumentResponse {
  bool success = 1;
}
```

## 코드 생성

### 기본 생성

```bash
# 의존성 업데이트
buf mod update

# 코드 생성
buf generate

# 생성 구조
generated/
├── go/
│   └── proto/
│       ├── v1beta/
│       │   ├── api.pb.go         # 메시지 정의
│       │   └── api_grpc.pb.go    # gRPC 서버/클라이언트
│       └── gateway/
│           └── v1beta/
│               └── api.pb.gw.go  # HTTP Gateway
└── docs/
    └── v1beta/
        └── openapi.yaml          # OpenAPI 스펙
```

### 특정 경로만 생성

```bash
buf generate --path proto/v1beta/api.proto
```

## 생성된 코드 활용

### gRPC 서버

```go
package main

import (
    "net"
    
    "google.golang.org/grpc"
    pb "github.com/myorg/myservice/generated/go/proto/v1beta"
)

type documentServer struct {
    pb.UnimplementedDocumentServiceServer
    service DocumentService
}

func (s *documentServer) CreateDocument(ctx context.Context, req *pb.CreateDocumentRequest) (*pb.CreateDocumentResponse, error) {
    doc, err := s.service.Create(ctx, req.Collection, req.Document)
    if err != nil {
        return nil, err
    }
    return &pb.CreateDocumentResponse{Document: doc}, nil
}

func main() {
    lis, _ := net.Listen("tcp", ":9090")
    
    grpcServer := grpc.NewServer()
    pb.RegisterDocumentServiceServer(grpcServer, &documentServer{})
    
    grpcServer.Serve(lis)
}
```

### HTTP Gateway

```go
package main

import (
    "net/http"
    
    "github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
    gw "github.com/myorg/myservice/generated/go/proto/gateway/v1beta"
)

func main() {
    ctx := context.Background()
    mux := runtime.NewServeMux()
    
    // gRPC 서버에 연결하여 HTTP 요청 프록시
    opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
    err := gw.RegisterDocumentServiceHandlerFromEndpoint(ctx, mux, "localhost:9090", opts)
    if err != nil {
        panic(err)
    }
    
    // HTTP 서버 시작
    http.ListenAndServe(":8080", mux)
}
```

### OpenAPI 스펙

생성된 `openapi.yaml`을 Swagger UI와 함께 제공:

```go
func main() {
    // ... Gateway 설정 ...
    
    // OpenAPI 스펙 제공
    http.HandleFunc("/openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
        http.ServeFile(w, r, "generated/docs/v1beta/openapi.yaml")
    })
}
```

## 린팅 및 Breaking Change 감지

### 린트 실행

```bash
buf lint

# 특정 파일만
buf lint --path proto/v1beta/api.proto

# 에러 출력 예시:
# proto/v1beta/api.proto:15:3:Field "id" should be marked as optional.
```

### Breaking Change 감지

```bash
# 현재 브랜치 vs main
buf breaking --against '.git#branch=main'

# 현재 vs 이전 커밋
buf breaking --against '.git#ref=HEAD~1'

# 현재 vs BSR 최신 버전
buf breaking --against 'buf.build/myorg/myservice'
```

## CI/CD 통합

### GitHub Actions

```yaml
# .github/workflows/proto.yml
name: Proto CI

on:
  push:
    paths: ['proto/**', 'buf.*']
  pull_request:
    paths: ['proto/**', 'buf.*']

jobs:
  lint-and-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: bufbuild/buf-setup-action@v1
        with:
          version: latest
      
      - name: Lint
        run: buf lint
      
      - name: Breaking Change Check
        run: buf breaking --against 'https://github.com/${{ github.repository }}.git#branch=main'
  
  generate:
    needs: lint-and-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: bufbuild/buf-setup-action@v1
      
      - name: Generate Code
        run: buf generate
      
      - name: Check for uncommitted changes
        run: |
          if [[ -n $(git status --porcelain generated/) ]]; then
            echo "Generated code is out of sync!"
            git diff generated/
            exit 1
          fi
```

## Makefile 통합

```makefile
.PHONY: proto-deps proto-lint proto-breaking proto-gen proto-clean

# 의존성 업데이트
proto-deps:
 buf mod update

# 린트
proto-lint:
 buf lint

# Breaking Change 검사
proto-breaking:
 buf breaking --against '.git#branch=main'

# 코드 생성
proto-gen:
 buf generate

# 정리
proto-clean:
 rm -rf generated/

# 전체 빌드
proto-all: proto-deps proto-lint proto-gen
```

## 모범 사례

1. **버전 네이밍**: 패키지에 `v1`, `v1beta` 등 버전 포함
2. **Breaking Change CI**: PR마다 자동 검사
3. **생성 코드 커밋**: `.gitignore`에 `generated/` 추가 권장
4. **Proto 주석**: 서비스/메시지 주석은 생성 코드와 OpenAPI에 반영됨
5. **Optional 명시**: Proto3에서 `optional` 키워드로 nullable 명확히 표현

## 참고 자료

- [Buf 공식 문서](https://buf.build/docs/)
- [Buf Schema Registry](https://buf.build/docs/bsr/introduction)
- [gRPC-Gateway](https://grpc-ecosystem.github.io/grpc-gateway/)
- [gnostic OpenAPI](https://github.com/google/gnostic)
