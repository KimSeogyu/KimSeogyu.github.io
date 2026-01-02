---
public: true
title: CRUSH (Controlled Replication Under Scalable Hashing)
date: '2025-12-27'
category: Distributed Systems
tags: [Distributed Systems]
excerpt: |-
  CRUSH (Controlled Replication Under Scalable Hashing)

   기본 개념
  CRUSH는 Ceph의 핵심 데이터 배치 알고리즘으로, 데이터 객체를 클러스터의 물리적 저장 장치에 분산 배치하는 방법을 결정합니다.

   주요 특...
---

# CRUSH (Controlled Replication Under Scalable Hashing)

## 기본 개념
CRUSH는 Ceph의 핵심 데이터 배치 알고리즘으로, 데이터 객체를 클러스터의 물리적 저장 장치에 분산 배치하는 방법을 결정합니다.

## 주요 특징
1. **결정적 배치**: 동일한 입력에 대해 항상 같은 결과 반환 (중앙 조정 없음)
2. **확장성**: 수천~수만 개의 장치 지원 가능
3. **자가 관리**: 클러스터 변화에 자동 적응
4. **장애 도메인 인식**: 하드웨어 장애 시나리오 고려한 배치

## CRUSH 작동 방식

### 1. 계층 구조(CRUSH 맵)
- **장치(Device)**: 실제 물리적 OSD(Object Storage Daemon)
- **버킷(Bucket)**: 장치나 다른 버킷을 포함하는 논리적 그룹
  - **호스트(Host)**: 한 서버의 OSD 그룹
  - **랙(Rack)**: 여러 호스트 그룹
  - **로우(Row)**: 여러 랙 그룹
  - **룸(Room)**: 여러 로우 그룹
  - **데이터센터(DC)**: 여러 룸 그룹
  - **루트(Root)**: 최상위 버킷

### 2. 배치 규칙(CRUSH Rule)
- **목적**: 어떤 방식으로 데이터를 배치할지 정의
- **구성 요소**:
  - **규칙 세트(Rule Set)**: 규칙 모음
  - **규칙 단계(Rule Step)**: 각 규칙의 작업 단위
  - **실패 도메인(Failure Domain)**: 함께 실패할 수 있는 구성 요소 단위(예: 호스트, 랙)
  - **타입 지정자(Type Specifier)**: 배치 시 사용할 계층 지정

### 3. 알고리즘 프로세스
1. **해싱**: 객체 ID를 해시하여 의사 난수 시드 생성
2. **규칙 적용**: CRUSH 규칙에 따라 배치 위치 결정
3. **계층 탐색**: 지정된 실패 도메인에서 적절한 장치 선택
4. **배치 확정**: 선택된 장치에 데이터 배치

## 이레이저 코딩과 CRUSH 통합

### 1. 청크 배치
- 각 데이터 청크(K)와 코딩 청크(M)는 CRUSH 알고리즘에 의해 서로 다른 장치에 배치
- 실패 도메인을 고려하여 같은 실패 지점에 여러 청크 배치 방지

### 2. 이레이저 코드별 CRUSH 규칙
- `ErasureCode::create_rule()`: 각 이레이저 코드 구현은 자신만의 CRUSH 규칙 생성
- **규칙 매개변수**:
  - `rule_root`: 최상위 버킷 지정 (기본값: "default")
  - `rule_failure_domain`: 실패 도메인 지정 (기본값: "host")
  - `rule_device_class`: 장치 클래스 제한 (예: SSD만 사용)

### 3. 구현 세부사항
```cpp
int ErasureCode::create_rule(const std::string &name,
                            CrushWrapper &crush,
                            std::ostream *ss) const {
  // 최소 필요 장치 수 계산
  int min_rep = get_chunk_count();
  // 지정된 실패 도메인에 해당하는 타입 ID 조회
  int type = crush.get_type_id(rule_failure_domain);
  // 루트 버킷 ID 조회
  int rootid = crush.get_item_id(rule_root);
  // 실제 CRUSH 규칙 생성
  int rno = crush.add_simple_rule(name, rule_root, rule_failure_domain,
                                  "firstn", pg_pool_t::TYPE_ERASURE,
                                  min_rep, ss);
  return rno;
}
```

## 실패 복구 시나리오

### 1. 청크 손실 상황
- 특정 OSD 실패로 일부 청크 손실
- CRUSH 맵 참조하여 손실된 청크의 위치 파악

### 2. 복구 프로세스
- `minimum_to_decode_with_cost()`: 최소 비용으로 복구 가능한 청크 세트 계산
- 남아있는 청크 위치 파악 (CRUSH 맵 이용)
- 해당 청크들로부터 손실된 청크 복구
- 새로운 장치에 복구된 청크 재배치 (CRUSH 알고리즘 사용)

## CRUSH의 장점
1. **확장성**: 중앙 메타데이터 테이블 없이 배치 계산
2. **복원력**: 클러스터 변화에 동적 적응
3. **튜닝 가능성**: 다양한 워크로드에 최적화 가능
4. **하드웨어 인식**: 실제 물리적 토폴로지 반영 가능
