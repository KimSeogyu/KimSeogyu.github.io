---
public: true
title: Celestia가 트랜잭션 배열을 ODS로 변환하는 방법
date: '2025-12-27'
category: Blockchain
tags: []
excerpt: |-
  1. 핵심 개념

   Share (공간단위)
  - Celestia의 기본 데이터 단위(512바이트)
  - 네임스페이스 ID를 포함한 원시 데이터 저장
  - 각 Share는 특정 네임스페이스에 속하며, 정보 바이트와 버전을 포함

   Square (사각형)
  - 데...
---
## 1. 핵심 개념

### Share (공간단위)
- Celestia의 기본 데이터 단위(512바이트)
- 네임스페이스 ID를 포함한 원시 데이터 저장
- 각 Share는 특정 네임스페이스에 속하며, 정보 바이트와 버전을 포함

### Square (사각형)
- 데이터의 2D 정사각형 배열로, 항상 변의 길이가 2의 제곱수
- Share들의 집합으로 구성
- 최종적인 데이터 가용성 계층의 구조

### 트랜잭션 유형
- 일반 트랜잭션: 기본 트랜잭션
- PFB(Pay-for-Blob) 트랜잭션: 블롭 데이터를 포함하거나 참조하는 특수 트랜잭션

## 2. 변환 프로세스

### 초기화 (Builder 생성)
```go
builder, err := NewBuilder(maxSquareSize, subtreeRootThreshold)
```
- `maxSquareSize`: 최대 사각형 크기(2의 제곱수)
- `subtreeRootThreshold`: 서브트리 루트 임계값 설정

### 트랜잭션 처리 순서
1. **트랜잭션 분류**: 입력된 트랜잭션을 일반 트랜잭션과 blob 트랜잭션으로 분류
2. **트랜잭션 배치**: 일반 트랜잭션을 먼저 배치한 후 PFB 트랜잭션 배치

### Share 분할 프로세스
1. **Compact Share 사용**: 일반 트랜잭션과 PFB 트랜잭션을 Compact Share로 변환
   ```go
   txWriter := share.NewCompactShareSplitter(share.TxNamespace, share.ShareVersionZero)
   pfbWriter := share.NewCompactShareSplitter(share.PayForBlobNamespace, share.ShareVersionZero)
   ```

2. **Sparse Share 사용**: Blob 데이터는 Sparse Share로 변환
   ```go
   blobWriter := share.NewSparseShareSplitter()
   ```

3. **Blob 정렬 및 배치**:
   - 네임스페이스 기준으로 Blob 정렬
   - Share commitment 규칙에 맞게 패딩 추가
   - 첫 Blob의 시작 위치가 nonReservedStart 결정

4. **패딩 추가**:
   - 네임스페이스 패딩: 트랜잭션과 PFB 사이
   - 테일 패딩: 사각형 크기를 맞추기 위해 추가

### 사각형 생성
```go
square, err := WriteSquare(txWriter, pfbWriter, blobWriter, nonReservedStart, squareSize)
```

1. **사각형 크기 결정**:
   - 필요한 최소 크기 계산 (`inclusion.BlobMinSquareSize`)
   - 트랜잭션, PFB, 블롭 데이터를 모두 수용할 수 있는 2의 제곱수로 크기 설정

2. **데이터 배치**:
   - 일반 트랜잭션 → PFB 트랜잭션 → 패딩 → Blob 데이터 → 테일 패딩 순으로 배치
   - 네임스페이스별로 데이터 구분 (TxNamespace, PayForBlobNamespace 등)

## 3. 주요 최적화 및 특징

### 메모리 효율성
- Share Counter를 사용하여 정확한 크기 계산
- 필요한 만큼만 패딩 추가로 공간 최적화

### 네임스페이스 구분
- 각 데이터 유형에 맞는 네임스페이스 할당
- 이를 통해 데이터 유형별 검색 및 접근 용이

### 머클 트리 최적화
- 서브트리 임계값 설정으로 머클 트리 구조 최적화
- 블롭 데이터 위치 조정으로 효율적인 증명 생성

### Share commitment 규칙 
- 각 Blob의 시작 위치는 Share commitment 규칙에 따라 결정
- 이는 데이터 가용성 검증을 위한 효율적인 증명을 가능하게 함

## 세부 스펙에 대한 Note

## 1. maxSquareSize와 원본/패리티 share 관계

- **ODS(Original Data Square)**: 모든 share가 원본 데이터입니다. 여기서는 트랜잭션, PFB, 블롭 데이터, 그리고 필요한 패딩만 포함됩니다. 이 단계에서는 패리티 데이터가 없습니다.

- **EDS(Extended Data Square)**: ODS를 2D 리드-솔로몬 인코딩으로 확장한 것으로, 이 때 패리티 데이터가 추가됩니다. 이는 코드베이스의 다른 부분에서 처리됩니다.

ODS의 크기가 2^n x 2^n인 이유는:
1. 머클 트리 구성의 효율성 
2. 데이터 가용성 샘플링(DAS)의 효율성
3. 2D 리드-솔로몬 인코딩의 요구사항

## 2. share 크기와 square 크기 제한

- **share 크기**: 각 share는 512바이트로 고정되어 있습니다. 이는 코드에서 `ShareSize` 상수로 정의됩니다.

- **square 크기 제한**: 이론적으로는 2의 제곱수로 무한히 커질 수 있지만, 실제로는 제한이 있습니다. 코드를 보면:

  ```go
  // worstCaseShareIndexes 함수에서
  squareSizeUpperBound := 128
  worstCaseShareIndex := squareSizeUpperBound * squareSizeUpperBound
  ```

  이 부분에서 최대 square 크기를 128x128(16,384 shares)로 제한하고 있음을 알 수 있습니다. 이는 Celestia-app v1.x와의 호환성을 위한 것입니다.

  또한 각 노드의 메모리 제한, 네트워크 처리량, 블록 시간 등 실용적인 제약 요소들도 최대 square 크기를 제한합니다. 128x128 square는 약 **8MB**(512바이트 * 16,384)의 데이터를 담을 수 있으며, 이는 현재 구현의 실용적인 상한선입니다.

결론적으로, share 크기는 고정되어 있고 square 크기는 이론적으로는 2의 제곱수로 확장 가능하지만 실제 구현에서는 제한이 있습니다.

Ref: https://github.com/celestiaorg/go-square
