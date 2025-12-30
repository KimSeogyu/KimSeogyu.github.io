---
public: true
title: MinIO의 이레이저 코딩 구현
date: '2025-12-27'
category: Distributed Systems
tags: []
excerpt: >-
  MinIO의 이레이저 코딩 구현


  MinIO는 분산 객체 스토리지 시스템으로, 데이터 내구성과 가용성을 위해 이레이저 코딩(Erasure Coding)을 구현했습니다.
  이레이저 코딩은 데이터를 여러 조각으로 나누고 패리티 조각을 추가하여 일부 디스크 손실에도 데이...
---

# MinIO의 이레이저 코딩 구현

MinIO는 분산 객체 스토리지 시스템으로, 데이터 내구성과 가용성을 위해 이레이저 코딩(Erasure Coding)을 구현했습니다. 이레이저 코딩은 데이터를 여러 조각으로 나누고 패리티 조각을 추가하여 일부 디스크 손실에도 데이터를 복구할 수 있게 합니다.

## 핵심 구조

### 1. 구조체 계층

- **Erasure**: 실제 인코딩/디코딩을 수행하는 기본 구조체 (`erasure-coding.go`)
  ```go
  type Erasure struct {
    encoder                  func() reedsolomon.Encoder
    dataBlocks, parityBlocks int
    blockSize                int64
  }
  ```

- **erasureObjects**: 객체 스토리지 작업을 처리하는 구조체 (`erasure.go`)
  ```go
  type erasureObjects struct {
    setDriveCount      int
    defaultParityCount int
    setIndex           int
    poolIndex          int
    getDisks           func() []StorageAPI
    // ...기타 필드
  }
  ```

- **erasureSets**: 여러 erasureObjects 세트를 관리 (`erasure-sets.go`)

- **erasureServerPools**: 여러 erasureSets 풀을 관리하는 최상위 계층 (`erasure-server-pool.go`)

### 2. 코딩 메커니즘

MinIO는 Reed-Solomon 알고리즘을 사용하여 이레이저 코딩을 구현합니다:

```go
func NewErasure(ctx context.Context, dataBlocks, parityBlocks int, blockSize int64) (e Erasure, err error) {
  e = Erasure{
    dataBlocks:   dataBlocks,
    parityBlocks: parityBlocks,
    blockSize:    blockSize,
  }
  e.encoder = func() reedsolomon.Encoder {
    // Reed-Solomon 인코더 초기화
    return encoder
  }
  return e, nil
}
```

## 데이터 흐름

### 1. 데이터 인코딩 (쓰기)

`erasure-encode.go`의 `Encode` 메서드는 데이터를 다음과 같이 처리합니다:

1. 객체 데이터를 청크로 분할
2. 각 청크를 Reed-Solomon 알고리즘으로 인코딩하여 데이터 블록과 패리티 블록 생성
3. 데이터와 패리티 블록을 여러 디스크에 분산 저장

```go
func (e *Erasure) Encode(ctx context.Context, src io.Reader, writers []io.Writer, buf []byte, quorum int) (total int64, err error) {
  // 데이터 읽기 및 인코딩
  blocks, err := e.EncodeData(ctx, buf[:n])
  // 인코딩된 블록을 여러 디스크에 쓰기
  err = writer.Write(ctx, blocks)
}
```

### 2. 데이터 디코딩 (읽기)

`erasure-decode.go`의 `Decode` 메서드는 다음과 같이 데이터를 복원합니다:

1. 여러 디스크에서 데이터와 패리티 블록 읽기
2. 일부 블록이 손상되거나 누락되었을 경우 Reed-Solomon 알고리즘으로 복구
3. 원본 데이터 재구성

```go
func (e Erasure) Decode(ctx context.Context, writer io.Writer, readers []io.ReaderAt, offset, length, totalLength int64, prefer []bool) (written int64, err error) {
  // 병렬 읽기로 데이터 블록 수집
  // 필요시 데이터 복구
  // 원본 데이터 재구성하여 writer에 쓰기
}
```

## 내구성 메커니즘

### 1. 쿼럼 기반 작업

MinIO는 쿼럼 기반 접근 방식을 사용하여 읽기/쓰기 작업의 내구성을 보장합니다:

- **읽기 쿼럼(Read Quorum)**: 데이터 블록 수보다 크거나 같은 디스크에서 읽기 성공 필요
  ```go
  func (er erasureObjects) defaultRQuorum() int {
    return er.setDriveCount - er.defaultParityCount
  }
  ```

- **쓰기 쿼럼(Write Quorum)**: 데이터 블록 + 패리티 블록 수에서 패리티 블록 수를 뺀 것
  ```go
  func (er erasureObjects) defaultWQuorum() int {
    return er.setDriveCount - er.defaultParityCount
  }
  ```

### 2. 힐링(Healing) 메커니즘

MinIO는 자동으로 손상된 데이터를 감지하고 복구하는 힐링 메커니즘을 제공합니다:

```go
func (er *erasureObjects) healObject(ctx context.Context, bucket, object, versionID string, opts madmin.HealOpts) (result madmin.HealResultItem, err error) {
  // 객체 상태 확인
  // 손상된 부분 감지
  // Reed-Solomon 알고리즘 사용하여 복구
  // 복구된 데이터를 다시 분산 저장
}
```

## 고급 기능

### 1. 멀티파트 업로드

대용량 객체를 효율적으로 업로드하기 위한 멀티파트 업로드 지원:

```go
func (er erasureObjects) PutObjectPart(ctx context.Context, bucket, object, uploadID string, partID int, r *PutObjReader, opts ObjectOptions) (pi PartInfo, err error) {
  // 파트 데이터를 이레이저 코딩으로 인코딩
  // 인코딩된 조각을 디스크에 저장
}
```

### 2. 디스크 풀 리밸런싱 및 디커미셔닝

- **리밸런싱**: 디스크 간 데이터 재분배
- **디커미셔닝**: 풀에서 디스크 안전하게 제거

## 성능 최적화

1. **병렬 I/O 작업**: 동시에 여러 디스크에서 읽기/쓰기 수행
2. **버퍼 풀링**: 메모리 사용 최적화
3. **비트맵 기반 디스크 상태 추적**: 빠른 디스크 상태 확인

## 결론

MinIO의 이레이저 코딩 구현은 Reed-Solomon 알고리즘을 기반으로 하며, 계층적 구조(serverPools > sets > objects)를 통해 확장성을 제공합니다. 데이터 블록과 패리티 블록의 분산 저장, 쿼럼 기반 작업, 자동 힐링 기능으로 높은 내구성과 가용성을 보장합니다.
