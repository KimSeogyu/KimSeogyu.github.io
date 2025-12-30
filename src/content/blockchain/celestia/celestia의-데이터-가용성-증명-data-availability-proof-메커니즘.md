---
public: true
title: Celestia의 데이터 가용성 증명(Data Availability Proof) 메커니즘
date: '2025-12-27'
category: Blockchain
tags: []
excerpt: >-
  Celestia의 데이터 가용성 증명(Data Availability Proof) 메커니즘


  Celestia는 블록체인 확장성 문제를 해결하기 위해 데이터 가용성 증명(Data Availability Proof) 메커니즘을 핵심으로
  사용합니다. 이 메커니즘은 모든...
---
# Celestia의 데이터 가용성 증명(Data Availability Proof) 메커니즘

Celestia는 블록체인 확장성 문제를 해결하기 위해 데이터 가용성 증명(Data Availability Proof) 메커니즘을 핵심으로 사용합니다. 이 메커니즘은 모든 노드가 전체 블록체인 데이터를 저장하지 않고도 데이터가 네트워크에 실제로 게시되었는지 확인할 수 있게 합니다.

## 1. 데이터 가용성 문제

기존 블록체인에서는 모든 노드가 모든 트랜잭션을 검증하고 저장해야 하므로 확장성에 한계가 있습니다. Celestia는 "데이터 가용성 샘플링(Data Availability Sampling, DAS)"이라는 기술을 통해 이 문제를 해결합니다.

## 2. 핵심 기술 구성요소

### 2.1 Extended Data Square (EDS)

블록 데이터는 다음과 같은 과정으로 처리됩니다:

1. **데이터 정렬**: 트랜잭션 데이터를 정사각형 형태(Original Data Square, ODS)로 배열합니다.
2. **2D Reed-Solomon 인코딩**: ODS에 Reed-Solomon 오류 정정 코드를 적용하여 확장된 데이터 사각형(EDS)을 생성합니다.
3. **사분면 구조**: EDS는 4개의 사분면으로 구성됩니다:
   - Q1(좌상단): 원본 데이터(ODS)
   - Q2(우상단): 행 패리티 데이터
   - Q3(좌하단): 열 패리티 데이터
   - Q4(우하단): 행+열 패리티 데이터

```go
// core/eds.go에서
func extendBlock(data *types.Data, appVersion uint64, options ...nmt.Option) (*rsmt2d.ExtendedDataSquare, error) {
    // 블록 데이터를 EDS로 확장하는 과정
}
```

### 2.2 데이터 가용성 샘플링(DAS)

경량 노드는 전체 블록을 다운로드하지 않고 EDS의 임의의 위치에서 소수의 샘플만 요청합니다:

1. **무작위 샘플링**: 노드는 EDS의 무작위 위치에서 여러 개의 샘플(share)을 요청합니다.
2. **통계적 검증**: 충분한 수의 샘플이 성공적으로 검색되면, 높은 확률로 전체 데이터가 가용하다고 결론지을 수 있습니다.
3. **이론적 기반**: 데이터의 일부가 누락된 경우, 무작위 샘플링을 통해 높은 확률로 누락된 부분을 감지할 수 있습니다.

### 2.3 Namespaced Merkle Tree (NMT)

Celestia는 데이터를 네임스페이스(namespace)로 구분하여 구조화합니다:

1. **데이터 분류**: 트랜잭션 데이터를 네임스페이스별로 분류합니다.
2. **효율적인 검증**: 노드는 특정 네임스페이스의 데이터만 선택적으로 검증할 수 있습니다.
3. **증명 최적화**: NMT는 특정 네임스페이스 데이터에 대한 증명 크기를 최적화합니다.

## 3. 데이터 가용성 증명 프로세스

### 3.1 블록 생성 및 제안

1. 블록 제안자는 트랜잭션을 수집하여 블록을 구성합니다.
2. 트랜잭션 데이터를 ODS 형태로 정렬합니다.
3. 2D Reed-Solomon 인코딩을 적용하여 EDS를 생성합니다.
4. 블록 헤더에 데이터 해시(Merkle root)를 포함시켜 네트워크에 제안합니다.

### 3.2 경량 노드의 검증 과정

1. 경량 노드는 블록 헤더를 받습니다.
2. EDS의 무작위 위치에서 다수의 샘플을 요청합니다.
3. 샘플이 Merkle root와 일치하는지 검증합니다.
4. 충분한 샘플(일반적으로 수백 개)이 성공적으로 검증되면, 전체 데이터가 가용하다고 판단합니다.

```go
// 경량 노드의 샘플링 요청 처리 과정 (개념적 코드)
func (odsq4 *ODSQ4) Sample(ctx context.Context, coords shwap.SampleCoords) (shwap.Sample, error) {
    // 요청된 좌표에서 샘플 데이터 검색
}
```

### 3.3 데이터 복구 능력

EDS의 Reed-Solomon 속성 덕분에:

1. 전체 EDS의 약 25%만 있으면 전체 데이터를 복구할 수 있습니다.
2. 충분한 수의 노드가 샘플링을 수행하면, 네트워크 전체적으로 데이터 복구가 가능한 수준의 샘플이 존재합니다.

```go
// store/file/square.go에서
func (s square) computeAxisHalf(axisType rsmt2d.Axis, axisIdx int) (eds.AxisHalf, error) {
    // Reed-Solomon 인코딩을 사용하여 누락된 데이터 복구
}
```

## 4. 저장 최적화

Celestia는 모든 노드가 모든 데이터를 저장할 필요가 없도록 설계되었습니다:

1. **선택적 저장**: 풀 노드는 블록 데이터의 ODS 부분만 저장합니다.
2. **시간 기반 전략**: 가용성 윈도우 내의 최근 블록은 ODSQ4 형태(ODS+Q4)로 저장하고, 오래된 블록은 ODS 형태로만 저장합니다.

```go
// core/eds.go에서
func storeEDS(ctx context.Context, eh *header.ExtendedHeader, eds *rsmt2d.ExtendedDataSquare, store *store.Store, window time.Duration, archival bool) error {
    if availability.IsWithinWindow(eh.Time(), window) {
        // 가용성 윈도우 내의 블록은 ODS와 Q4 모두 저장
        err = store.PutODSQ4(ctx, eh.DAH, eh.Height(), eds)
    } else {
        // 오래된 블록은 ODS만 저장
        err = store.PutODS(ctx, eh.DAH, eh.Height(), eds)
    }
}
```

## 5. 장점 및 의의

1. **확장성 향상**: 경량 노드는 전체 블록을 다운로드하지 않고도 데이터 가용성을 검증할 수 있습니다.
2. **보안 유지**: 충분한 샘플링을 통해 높은 확률로 데이터 가용성을 보장합니다.
3. **모듈식 설계**: 데이터 가용성 레이어를 실행 레이어(execution layer)와 분리하여 모듈식 블록체인 설계를 가능하게 합니다.
4. **롤업 확장**: Celestia의 데이터 가용성 레이어는 다양한 롤업(rollup)의 기반 레이어로 활용될 수 있습니다.

Celestia의 데이터 가용성 증명 메커니즘은 블록체인의 "데이터 가용성 문제"를 효율적으로 해결하여, 확장성을 크게 향상시키면서도 보안을 유지하는 혁신적인 접근 방식입니다.
