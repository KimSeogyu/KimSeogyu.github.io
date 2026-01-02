---
public: true
title: Ceph Erasure Coding 메타데이터 관리
date: '2025-12-27'
category: Distributed Systems
tags: [Distributed Systems]
excerpt: |-
  Ceph Erasure Coding 메타데이터 관리

   1. 메타데이터 종류
  1. 코딩 프로파일 정보:
     - K, M 값 (데이터 청크 수, 코딩 청크 수)
     - 사용된 이레이저 코딩 알고리즘 유형
     - 특수 파라미터 (예: jerasure...
---

# Ceph Erasure Coding 메타데이터 관리

## 1. 메타데이터 종류
1. **코딩 프로파일 정보**:
   - K, M 값 (데이터 청크 수, 코딩 청크 수)
   - 사용된 이레이저 코딩 알고리즘 유형
   - 특수 파라미터 (예: jerasure 기법, LRC 로컬 그룹 크기)

2. **청크 매핑 정보**:
   - 각 청크의 논리적 인덱스와 물리적 OSD 매핑
   - `chunk_mapping` 벡터에 저장

3. **객체 레이아웃 정보**:
   - 청크 크기
   - 스트라이프 크기
   - 객체 크기 및 패딩 정보

4. **CRUSH 규칙 메타데이터**:
   - 실패 도메인 설정
   - 규칙 ID 및 이름
   - 디바이스 클래스 제한 정보

## 2. 메타데이터 저장 방식

### 풀(Pool) 수준 메타데이터
1. **풀 속성**:
   - `ceph osd pool set {pool-name} erasure_code_profile {profile-name}`
   - 클러스터 모니터 데이터베이스에 저장
   - CRUSH 규칙과 연결

2. **프로파일 저장**:
   ```cpp
   const ErasureCodeProfile &get_profile() const {
     return _profile;
   }
   ```
   - 클러스터 모니터의 키-값 저장소에 보관
   - 각 풀마다 하나의 프로파일 사용

### 객체 수준 메타데이터
1. **OMAP(Object Map) 활용**:
   - 객체 헤더에 메타데이터 저장
   - xattr(확장 속성)으로 청크 정보 저장

2. **객체 속성**:
   - 객체 크기, 스트라이프 정보
   - 타임스탬프, 사용자 정의 메타데이터

### PG(Placement Group) 수준 메타데이터
1. **PG 로그**:
   - 모든 쓰기 작업 기록
   - 복구에 필요한 작업 순서 보존

2. **OSDMap**:
   - 현재 클러스터 상태 반영
   - 각 PG의 CRUSH 매핑 정보 포함

## 3. 청크 매핑 관리

1. **논리적 매핑**:
   ```cpp
   const std::vector<int> &get_chunk_mapping() const;
   ```
   - 청크 인덱스(0~K+M-1)와 실제 OSD 매핑
   - 인코딩/디코딩 시 참조

2. **매핑 초기화**:
   ```cpp
   int to_mapping(const ErasureCodeProfile &profile, std::ostream *ss);
   ```
   - 프로파일에서 매핑 정보 추출
   - 필요시 기본 순차 매핑 생성

3. **매핑 활용**:
   ```cpp
   int chunk_index(unsigned int i) const;
   ```
   - 청크 ID를 실제 저장 위치로 변환
   - 데이터 조회 시 필요한 위치 계산

## 4. 프로파일 관리

1. **프로파일 구성**:
   ```cpp
   typedef std::map<std::string,std::string> ErasureCodeProfile;
   ```
   - 키-값 쌍 형태로 설정 저장
   - 예: `{"k":"4", "m":"2", "technique":"reed_sol_van"}`

2. **프로파일 파싱**:
   ```cpp
   int parse(const ErasureCodeProfile &profile, std::ostream *ss);
   ```
   - 문자열 형태의 설정을 내부 값으로 변환
   - 타입 변환 헬퍼 메서드 제공:
     ```cpp
     static int to_int(const std::string &name, ErasureCodeProfile &profile, ...);
     static int to_bool(const std::string &name, ErasureCodeProfile &profile, ...);
     ```

3. **프로파일 검증**:
   ```cpp
   int sanity_check_k_m(int k, int m, std::ostream *ss);
   ```
   - K, M 값의 유효성 검사
   - 최소/최대 값 제한 적용

## 5. 메타데이터 복구 전략

1. **클러스터 맵 동기화**:
   - 모니터 노드에서 주기적으로 OSDMap 동기화
   - 변경 사항을 모든 노드에 전파

2. **메타데이터 중복 저장**:
   - 중요 메타데이터는 여러 모니터 노드에 복제
   - Paxos 알고리즘으로 일관성 보장

3. **PG 로그 활용**:
   - 작업 순서대로 기록된 로그로 메타데이터 복구
   - PG 스크러빙으로 메타데이터 무결성 검증

4. **오류 복구 시나리오**:
   - OSD 실패: 다른 OSD에서 메타데이터 복구
   - 모니터 실패: 다른 모니터에서 메타데이터 복제
   - 전체 메타데이터 손실: 백업 또는 CRUSH 재계산

## 6. 성능 최적화

1. **메타데이터 캐싱**:
   - 자주 사용되는 프로파일과 매핑 정보 메모리 캐싱
   - OSD 및 클라이언트 측 캐시 활용

2. **효율적인 조회**:
   - 인덱스 기반 빠른 청크 위치 조회
   - 병렬 메타데이터 조회 지원

3. **압축 저장**:
   - 메타데이터 압축으로 저장 공간 및 네트워크 대역폭 절약
   - 작은 객체 메타데이터 통합 저장

4. **지연 업데이트**:
   - 비중요 메타데이터 변경은 지연 기록으로 성능 향상
   - 일괄 처리(batching)로 디스크 I/O 최소화
