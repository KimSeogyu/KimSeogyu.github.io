---
public: true
title: Namespaced Merkle Tree (NMT)란?
date: '2025-12-27'
category: Blockchain
tags: [Blockchain]
excerpt: >-
  Namespaced Merkle Tree (NMT)란?

    

  Namespaced Merkle Tree (NMT)는 Merkle Tree의 변형된 구조로, 네임스페이스(namespace)를 기반으로 하는
  인증 가능한 데이터 구조다. Cel...
---
**Namespaced Merkle Tree (NMT)란?**

  

**Namespaced Merkle Tree (NMT)**는 **Merkle Tree의 변형된 구조**로, **네임스페이스(namespace)를 기반으로 하는 인증 가능한 데이터 구조**다. Celestia에서는 **특정 네임스페이스에 속하는 데이터만 검증 가능**하도록 설계된 이 구조를 사용한다.

---

**1. Merkle Tree와의 차이점**

  

Merkle Tree는 기본적으로 **전체 데이터 블록을 검증하기 위한 해시 트리 구조**다. 하지만 일반적인 Merkle Tree는 특정 데이터가 포함되어 있는지를 **빠르게 증명하는 기능은 제공하지만, 네임스페이스 단위로 검색하거나 검증하는 기능은 제공하지 않는다**.

  

반면 **NMT는 네임스페이스 단위로 증명(Proof)을 지원**하기 때문에 특정 네임스페이스에 속하는 데이터를 빠르게 검증할 수 있다.

---

**2. NMT의 특징**

1. **네임스페이스 기반 Merkle 해싱**

• 각 노드가 특정 네임스페이스 범위를 포함하고 있으며, 부모 노드는 자식 노드들의 네임스페이스 범위를 유지한다.

• 즉, **Merkle 증명에서 네임스페이스별로 데이터 포함 여부를 쉽게 확인할 수 있다.**

1. **Merkle Proof와 네임스페이스 필터링 지원**

• 일반 Merkle Tree의 경우 특정 데이터가 트리에 포함되어 있는지만 증명할 수 있지만,

**NMT는 특정 네임스페이스에 속하는 데이터가 있는지 없는지 증명할 수 있다.**

1. **부분 데이터 접근성 향상**

• 특정 네임스페이스의 데이터만 빠르게 검색하고, 다운로드하는 것이 가능하다.

---

**3. Celestia에서 NMT가 사용되는 이유**

  

Celestia에서는 **네임스페이스를 기반으로 데이터 가용성을 검증**해야 하기 때문에, 기존 Merkle Tree보다 **NMT가 더 적합**하다. Celestia에서 NMT가 사용되는 이유는 다음과 같다.

1. **Blob 트랜잭션 검증**

• Celestia에서는 트랜잭션과 블록 데이터를 Blob 형태로 저장하며, 각 Blob은 특정 네임스페이스에 속한다.

• NMT를 활용하면 특정 네임스페이스의 Blob이 존재하는지 **효율적으로 증명할 수 있다**.

1. **Data Availability Sampling (DAS) 최적화**

• 라이트 노드는 **데이터 가용성을 검증하기 위해 일부 샘플을 요청**해야 한다.

• NMT를 활용하면 특정 네임스페이스의 데이터를 포함하는 샘플을 보다 **효율적으로 검증 가능**하다.

1. **네임스페이스 기반 데이터 검색 최적화**

• Celestia의 모듈형 블록체인 구조에서는 **다양한 애플리케이션이 서로 다른 네임스페이스를 사용**한다.

• 특정 애플리케이션이 필요한 데이터만 검색할 수 있도록, NMT가 효과적으로 동작한다.

---

**4. NMT의 동작 방식**

  

**📌 기본적인 Merkle Tree와 비교**

  

일반적인 Merkle Tree의 경우, 각 리프 노드(데이터 블록)는 해시로 변환되며, 부모 노드는 자식들의 해시를 조합하여 생성된다.

  

하지만 **Namespaced Merkle Tree (NMT)는 네임스페이스 정보를 추가하여 해싱**한다.

  

**📌 NMT의 해싱 규칙**

1. **각 리프 노드**:

• (namespace, data_hash) 형태로 저장됨.

1. **각 내부 노드**:

• namespace_min = min(left.namespace_min, right.namespace_min)

• namespace_max = max(left.namespace_max, right.namespace_max)

• 부모 노드는 자식의 네임스페이스 범위를 유지하면서 해싱됨.

  

**📌 NMT Merkle Proof 생성**

• 특정 네임스페이스에 속하는 데이터를 포함하는지 검증할 때, **네임스페이스 범위 정보를 가진 Merkle Proof**를 사용하면 효율적으로 증명할 수 있다.

• 특정 네임스페이스의 데이터를 포함하지 않는다면, **해당 네임스페이스 범위가 없음(Empty Proof)** 을 증명할 수 있다.

---

**5. 결론**

• Namespaced Merkle Tree(NMT)는 **Merkle Tree의 확장 버전**으로, **네임스페이스별 데이터 검증이 가능**한 구조다.

• Celestia에서는 **모듈형 블록체인에서 데이터 가용성을 효율적으로 검증하고, 특정 네임스페이스의 데이터만 빠르게 검색할 수 있도록 지원**하기 위해 사용된다.

• **DAS (Data Availability Sampling)와 Blob 트랜잭션 검증에도 중요한 역할**을 한다.

  

👉 **즉, Celestia의 확장성과 데이터 가용성을 높이기 위해 NMT는 필수적인 요소다.** 🚀
