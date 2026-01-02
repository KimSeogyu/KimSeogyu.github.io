---
public: true
title: SPV (Simplified Payment Verification)
date: '2025-12-27'
category: Blockchain
tags: [Blockchain]
excerpt: |-
  SPV (Simplified Payment Verification)

   SPV란?

  거래에 대한 모든 블록체인을 저장하지 않고도 트랜잭션을 검증하는 방법입니다. 라이트 웨이트 노드 또는 경량노드라고도 불립니다.

   특징

  -   블록체인의 사본을 보관하지 않...
---
# SPV (Simplified Payment Verification)

## SPV란?

거래에 대한 모든 블록체인을 저장하지 않고도 트랜잭션을 검증하는 방법입니다. 라이트 웨이트 노드 또는 경량노드라고도 불립니다.

## 특징

-   블록체인의 사본을 보관하지 않고 트랜잭션 검증과정에도 참여하지 않으므로 네트워크 보안에 기여하지 않는다
-   그러므로 다른 풀노드 정보에 의존하여 거래를 진행한다
-   블록 헤더 구성
    -   버전: 4바이트
    -   이전 블록해시 : 32바이트
    -   머클루트 해시 : 32바이트
    -   블록 시간 : 4바이트
    -   비츠 : 4바이트
    -   논스값 : 4바이트로 구성되어있으며, 총 80바이트로, 1년 동안 발생하는 52,560개의 블록 헤더 용량이 4MB 정도이니 현재 150GB를 넘긴 풀 노드에 비해 매우 가볍다고 할 수 있다.

## 원리

![merkle-root](https://miro.medium.com/v2/resize:fit:720/format:webp/0*ZLrIO_B67108JStC.jpg)

거래3가 블록에 실렸는지 확인하고 싶다면, 블록 생성 시마다 해당 블록의 머클루트 획득에 필요한 해시들만 가져오면 된다.
