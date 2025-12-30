---
public: true
title: Celestia의 EDS(Extended Data Square)
date: '2025-12-27'
category: Blockchain
tags: []
excerpt: >-
  EDS(Extended Data Square)란?


  EDS는 Celestia의 데이터 가용성(Data Availability) 보장 메커니즘의 핵심 구조입니다. EDS는 원본 데이터를 2D
  사각형으로 구성한 후, Reed-Solomon 오류 정정 코딩을 적용하여...
---
## EDS(Extended Data Square)란?

EDS는 Celestia의 데이터 가용성(Data Availability) 보장 메커니즘의 핵심 구조입니다. EDS는 원본 데이터를 2D 사각형으로 구성한 후, Reed-Solomon 오류 정정 코딩을 적용하여 확장된 2차원 데이터 구조를 말합니다.

```mermaid
graph LR
    Q1["🟦 Q1: ODS<br/>원본 데이터"] --- Q2["🟩 Q2: Row Parity<br/>행 패리티"] --- Q3["🟨 Q3: Col Parity<br/>열 패리티"] --- Q4["🟪 Q4: Row+Col Parity<br/>행+열 패리티"]
```

> **Extended Data Square (EDS)**: 원본 데이터(Q1)를 Reed-Solomon 인코딩하여 행/열/대각선 패리티(Q2, Q3, Q4)를 생성한 2D 구조

## EDS의 구조와 특징

1. **사분면 구조**:
   - **Q1 (좌상단)**: 원본 데이터 사각형(ODS - Original Data Square)
   - **Q2 (우상단)**: 행 패리티 데이터(Row Parity) - 행 단위 복구 가능
   - **Q3 (좌하단)**: 열 패리티 데이터(Column Parity) - 열 단위 복구 가능
   - **Q4 (우하단)**: 행과 열 패리티 데이터(Row+Column Parity) - 특정 복구 시나리오에서 필요

2. **2D Reed-Solomon 인코딩**:
   - 행과 열 모두에 대해 Reed-Solomon 인코딩 적용
   - 25% 이상의 데이터가 사용 가능하면 전체 데이터 복구 가능

3. **데이터 단위**:
   - **Share**: 기본 데이터 단위. 고정 크기의 바이트 배열
   - **Square**: n×n 크기의 Share 배열

## EDS 관련 주요 기능

첨부된 코드 스니펫에서 볼 수 있는 주요 기능들:

### 1. EDS 생성

```go
func extendBlock(data *types.Data, appVersion uint64, options ...nmt.Option) (*rsmt2d.ExtendedDataSquare, error)
```

- 블록 데이터를 EDS로 확장합니다.
- 트랜잭션 데이터를 2D 사각형으로 구성한 후 Reed-Solomon 인코딩을 적용합니다.

```go
func extendShares(s [][]byte, options ...nmt.Option) (*rsmt2d.ExtendedDataSquare, error)
```

- Share의 배열을 EDS로 확장합니다.

### 2. EDS 저장

```go
func storeEDS(
    ctx context.Context,
    eh *header.ExtendedHeader,
    eds *rsmt2d.ExtendedDataSquare,
    store *store.Store,
    window time.Duration,
    archival bool,
) error
```

- EDS를 저장합니다.
- 가용성 윈도우 내에 있으면 ODS와 Q4 모두 저장(ODSQ4)
- 가용성 윈도우 밖에 있으면 ODS만 저장

## file 패키지와 EDS의 관계

앞서 설명한 file 패키지는 EDS의 저장 및 접근 메커니즘을 제공합니다:

1. **ODS**: EDS의 Q1 사분면(원본 데이터)만 저장하는 방식
2. **ODSQ4**: ODS와 Q4 사분면을 함께 저장하는 방식
   - 일부 쿼리 및 데이터 복구에 더 효율적
   - 저장 공간을 더 필요로 함

## EDS의 Celestia에서의 역할

1. **데이터 가용성 검증**:
   - 노드들은 EDS의 임의 샘플을 요청하여 데이터 가용성 검증
   - 충분한 샘플이 확인되면 전체 블록이 가용하다고 판단

2. **데이터 복구**:
   - 일부 데이터만으로 전체 데이터 복구 가능
   - 네트워크 효율성 향상: 전체 블록이 아닌 일부만 다운로드해도 됨

3. **저장 최적화**:
   - 모든 노드가 전체 EDS를 저장할 필요 없음
   - 일반 노드는 ODS만 저장해도 충분
   - 가용성 보장이 필요한 최근 블록만 ODSQ4 형태로 저장

## 실제 구현에서의 고려사항

1. **가용성 윈도우**:

   ```go
   if availability.IsWithinWindow(eh.Time(), availability.StorageWindow) {
       err = store.PutODSQ4(ctx, eh.DAH, eh.Height(), eds)
   } else {
       err = store.PutODS(ctx, eh.DAH, eh.Height(), eds)
   }
   ```

   - 최근 블록(가용성 윈도우 내)에 대해서만 ODSQ4 방식으로 저장
   - 오래된 블록은 ODS 방식으로만 저장하여 디스크 공간 절약

2. **성능 최적화**:
   - 캐싱 및 버퍼링을 통한 I/O 최적화
   - Q4 지연 로딩(필요할 때만 로드)
   - Reed-Solomon 인코더 캐싱

EDS는 Celestia의 데이터 가용성 레이어의 핵심 구성 요소로, 블록체인의 데이터 확장성과 가용성을 동시에 해결하기 위한 중요한 구조입니다.
