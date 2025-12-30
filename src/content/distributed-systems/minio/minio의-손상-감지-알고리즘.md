---
public: true
title: MinIO의 손상 감지 알고리즘
date: '2025-12-27'
category: Distributed Systems
tags: []
excerpt: >-
  MinIO의 손상 감지 알고리즘


  MinIO는 분산 시스템에서 데이터 손상을 감지하기 위해 여러 계층의 검증 메커니즘을 구현하고 있습니다. 이 알고리즘들은 메타데이터부터 실제
  데이터 블록까지 다양한 수준에서 작동합니다.

   1. 메타데이터 검증

   File...
---
# MinIO의 손상 감지 알고리즘

MinIO는 분산 시스템에서 데이터 손상을 감지하기 위해 여러 계층의 검증 메커니즘을 구현하고 있습니다. 이 알고리즘들은 메타데이터부터 실제 데이터 블록까지 다양한 수준에서 작동합니다.

## 1. 메타데이터 검증

### FileInfo 유효성 검증

```go
func (fi FileInfo) IsValid() bool {
    if fi.Erasure.DataBlocks == 0 || fi.Erasure.ParityBlocks == 0 {
        return false
    }
    if len(fi.Erasure.Distribution) != (fi.Erasure.DataBlocks + fi.Erasure.ParityBlocks) {
        return false
    }
    for _, checksum := range fi.Parts {
        if checksum.ETag == "" {
            return false
        }
    }
    return true
}
```

이 함수는 객체의 메타데이터가 유효한지 검사합니다:
- 데이터 블록과 패리티 블록 수가 올바른지
- 분산 패턴이 전체 블록 수와 일치하는지
- 모든 부분(파트)이 체크섬을 가지고 있는지

### 버전 일관성 검사

```go
func findFileInfoInQuorum(ctx context.Context, metaArr []FileInfo, modTime time.Time, etag string, quorum int) (FileInfo, error) {
    // 메타데이터 배열에서 쿼럼을 만족하는 일관된 버전 찾기
    // 시간 기반 그룹화 및 버전 비교
}
```

이 함수는 여러 디스크에서 수집한 메타데이터를 비교하여 쿼럼을 만족하는 정확한 버전을 찾습니다.

## 2. 데이터 블록 검증

### 체크섬 검증

MinIO는 각 데이터 부분에 대해 ETag(MD5 체크섬)를 저장하고 이를 사용하여 데이터 무결성을 검증합니다:

```go
func (e ErasureInfo) GetChecksumInfo(partNumber int) (ckSum ChecksumInfo) {
    // 지정된 파트 번호에 대한 체크섬 정보 검색
}
```

데이터를 읽을 때, 계산된 체크섬과 저장된 체크섬을 비교하여 손상 여부를 감지합니다.

### 비트롯 검증

비트롯(Bitrot)은 시간이 지남에 따라 발생하는 데이터 손상을 의미합니다. MinIO는 이를 감지하기 위해 추가적인 해시(예: SHA-256, HighwayHash)를 사용합니다:

```go
// BitrotVerifier 인터페이스는 비트롯 감지를 위한 검증 메커니즘을 제공
type BitrotVerifier interface {
    // 데이터 검증을 위한 메서드
    Verify(buf []byte) error
}
```

## 3. 객체 부분 검증

실제 데이터 블록의 존재와 무결성을 검증하는 과정:

```go
func checkObjectWithAllParts(ctx context.Context, onlineDisks []StorageAPI, partsMetadata []FileInfo,
    errs []error, latestMeta FileInfo, filterByETag bool, bucket, object string,
    scanMode madmin.HealScanMode) (dataErrsByDisk map[int][]int, dataErrsByPart map[int][]int) {
    
    // 결과 맵 초기화
    dataErrsByDisk = make(map[int][]int)
    dataErrsByPart = make(map[int][]int)
    
    // 각 파트에 대한 상태 확인
    for partIdx, partInfo := range latestMeta.Parts {
        // 각 디스크에서 파트 데이터 확인
        for diskIdx, disk := range onlineDisks {
            if disk == nil {
                // 디스크 오프라인
                continue
            }
            
            // 파트 데이터 상태 확인
            partPath := filepath.Join(bucket, object, partInfo.ETag)
            err := disk.CheckParts(ctx, partPath)
            
            if err != nil {
                // 오류 기록
                dataErrsByDisk[diskIdx] = append(dataErrsByDisk[diskIdx], partIdx)
                dataErrsByPart[partIdx] = append(dataErrsByPart[partIdx], diskIdx)
            }
        }
    }
    
    return dataErrsByDisk, dataErrsByPart
}
```

이 함수는:
1. 각 디스크에서 객체의 모든 부분을 확인
2. 누락되거나 손상된 부분을 식별
3. 디스크별, 부분별로 오류를 맵핑하여 상세한 손상 정보 제공

## 4. 쿼럼 기반 손상 감지

MinIO는 쿼럼 메커니즘을 사용하여 다수결 원칙으로 손상을 감지합니다:

```go
func reduceReadQuorumErrs(ctx context.Context, errs []error, ignoredErrs []error, readQuorum int) (maxErr error) {
    // 오류 유형별 카운팅
    errCount := make(map[error]int)
    for _, err := range errs {
        if err != nil {
            errCount[err]++
        }
    }
    
    // 읽기 쿼럼이 충족되는지 확인
    if len(errs) - len(errCount) >= readQuorum {
        return nil // 쿼럼 충족
    }
    
    // 가장 많이 발생한 오류 반환
    maxCount := 0
    for err, count := range errCount {
        if count > maxCount {
            maxCount = count
            maxErr = err
        }
    }
    
    return maxErr
}
```

이 접근 방식은:
1. 필요한 최소 쿼럼 수의 디스크가 동일한 데이터를 가질 때 해당 데이터가 정확하다고 판단
2. 쿼럼에 미달하는 경우 손상으로 간주하고 복구 시도

## 5. 댕글링 객체 감지

일관성 없는 상태의 객체를 감지하는 알고리즘:

```go
func isObjectDangling(metaArr []FileInfo, errs []error, dataErrsByPart map[int][]int) (validMeta FileInfo, ok bool) {
    // 유효한 메타데이터 찾기
    for _, meta := range metaArr {
        if meta.IsValid() {
            validMeta = meta
            break
        }
    }
    
    if !validMeta.IsValid() {
        return FileInfo{}, false // 유효한 메타데이터 없음
    }
    
    // 데이터 파트의 상태 확인
    for partIdx, errDisks := range dataErrsByPart {
        // 손상된 디스크 수 계산
        notFoundCount, nonActionableCount := danglingPartErrsCount(errDisks)
        
        // 임계값 초과 시 댕글링으로 간주
        if notFoundCount > (len(metaArr) / 2) {
            return validMeta, true
        }
    }
    
    return FileInfo{}, false
}
```

이 함수는:
1. 유효한 메타데이터 존재 여부 확인
2. 실제 데이터 파트의 상태와 메타데이터 일치 여부 확인
3. 대다수의 디스크에서 데이터가 누락된 경우 댕글링 객체로 판단

## 6. 디스크 상태 감지

디스크 자체의 상태를 모니터링하는 알고리즘:

```go
func diskErrToDriveState(err error) (state string) {
    if err == nil {
        return madmin.DriveStateOk
    }
    
    switch {
    case errors.Is(err, errDiskNotFound):
        return madmin.DriveStateOffline
    case errors.Is(err, errCorruptedFormat):
        return madmin.DriveStateCorrupt
    case errors.Is(err, errUnformattedDisk):
        return madmin.DriveStateUnformatted
    case errors.Is(err, errDiskAccessDenied):
        return madmin.DriveStatePermission
    case errors.Is(err, errFaultyDisk):
        return madmin.DriveStateFaulty
    case errors.Is(err, errDiskFull):
        return madmin.DriveStateFull
    }
    
    return madmin.DriveStateUnknown
}
```

이 함수는 디스크 접근 시 발생하는 오류 유형을 분석하여 디스크 상태를 판단합니다.

## 결론

MinIO의 손상 감지 알고리즘은 여러 계층에서 작동합니다:

1. **메타데이터 수준**: 구조 유효성, 버전 일관성 검증
2. **데이터 블록 수준**: 체크섬, 비트롯 검증
3. **객체 부분 수준**: 각 부분의 존재 및 무결성 확인
4. **쿼럼 기반 검증**: 다수결 원칙으로 손상 여부 판단
5. **댕글링 객체 감지**: 메타데이터와 실제 데이터 간 일관성 확인
6. **디스크 상태 모니터링**: 디스크 자체의 건강 상태 평가

이러한 다층적 접근 방식으로 MinIO는 분산 환경에서 발생할 수 있는 다양한 유형의 데이터 손상을 효과적으로 감지하고 복구할 수 있습니다.
