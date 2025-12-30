---
public: false
title: OffchainDB P2P 프로토콜 설계
date: '2025-12-27'
category: AI_ML
tags: []
excerpt: >-
  OffchainDB P2P 프로토콜 설계


  OffchainDB는 노드간의 P2P 네트워크로 이뤄지며, 각 노드는 Master 또는 Worker 역할을 담당할 수 있다. 이 문서에서는
  OffchainDB의 P2P 네트워크 통신이 어떻게 이뤄지는지 기술한다


  ![[스...
---

# OffchainDB P2P 프로토콜 설계

OffchainDB는 노드간의 P2P 네트워크로 이뤄지며, 각 노드는 Master 또는 Worker 역할을 담당할 수 있다. 이 문서에서는 OffchainDB의 P2P 네트워크 통신이 어떻게 이뤄지는지 기술한다

![[스크린샷 2025-03-10 오후 4.34.37.png]]

## 통신 프로토콜

노드 간의 통신은 gRPC 프로토콜을 사용하며, Unary RPC 방식을 원칙으로 한다.

## Network utils 패키지 설계

### grpc-utils

go-grpc를 사용해서 client와 server를 초기화해주고, 관련한 기본 설정값을 제공하는 패키지

### event-emitter

멤버변수로 토픽 별 이벤트 핸들러 목록을 가질 수 있으며, 신규 이벤트 발생 시 각 핸들러로 분배하는 역할을 제공하는 패키지
