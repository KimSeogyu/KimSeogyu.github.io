---
public: true
title: AWS ElastiCache for Redis (OSS) - 샤딩과 마스터 Failover 정리
date: '2025-12-27'
category: Backend_DevOps
tags: []
excerpt: "AWS ElastiCache for Redis (OSS) - 샤딩과 마스터 Failover 정리\n\n![[Pasted image 20250328100819.png]]\n\n \U0001F4CC 핵심 개념 요약\n\n- Redis Cluster 모드에서는 데이터를 샤딩하여 여러 마스터..."
---
# AWS ElastiCache for Redis (OSS) - 샤딩과 마스터 Failover 정리

![[Pasted image 20250328100819.png]]

## 📌 핵심 개념 요약

- Redis Cluster 모드에서는 데이터를 샤딩하여 여러 마스터 노드에 분산 저장할 수 있다.
- 그러나 **하나의 키는 반드시 하나의 마스터 노드만이 관리**한다.
- 이 구조에서 **마스터 노드의 장애(Failover)** 발생 시, 리플리카를 자동 승격시켜 서비스를 지속할 수 있도록 한다.

---

## 🧱 샤딩 구조

### 🔹 해시 슬롯 기반 샤딩

- Redis Cluster는 키를 **0 ~ 16383 해시 슬롯** 중 하나에 매핑한다.
- 각 해시 슬롯은 **하나의 샤드(= 마스터 노드)** 가 담당한다.
- 샤드 수가 늘어나면 슬롯이 분산되며, 각 샤드는 자신이 맡은 슬롯 범위의 키만 관리한다.

### 🔹 키 관리

- 하나의 키는 하나의 해시 슬롯에 매핑되므로,
- **동일한 키에 대해 동시에 여러 마스터가 접근하는 일은 없음**.

---

## 🔁 마스터 노드 Failover 처리

### 🔹 리플리카 구성

- ElastiCache는 **각 마스터 노드에 대해 하나 이상의 리플리카 노드(replica)를 구성**할 수 있도록 지원한다.
- 리플리카는 마스터의 데이터를 비동기 복제한다.

### 🔹 Failover 시나리오

1. 마스터 노드에 장애 발생
2. ElastiCache 감시 시스템이 자동 감지
3. 해당 샤드의 리플리카 노드 중 하나를 **자동으로 마스터로 승격(promote)**
4. 클러스터 메타데이터가 갱신됨
5. 클라이언트는 재접속 시 **MOVED 리다이렉션 응답**을 통해 새 마스터에 연결됨

### 🔹 구성 예시

샤드 1: 마스터 A <–> 리플리카 A’

샤드 2: 마스터 B <–> 리플리카 B’

샤드 3: 마스터 C <–> 리플리카 C’

- 마스터 B가 죽으면 → 리플리카 B'가 새 마스터로 승격

---

## ⚠️ 주의사항

- Redis의 복제는 **비동기(asynchronous)** 이므로, 장애 발생 시 **일부 데이터 손실 가능성**이 존재한다.
- 강력한 데이터 정합성이 요구되는 경우, 사용 시점 및 구조를 신중하게 설계해야 한다.
- **리플리카가 없으면 Failover가 불가능**하므로, 최소한 샤드당 1개의 리플리카 구성이 권장된다.

---

## ✅ 모범 구성

- **Multi-AZ 배포**로 장애 도메인 분리
- 각 샤드에 **1개 이상의 리플리카 구성**
- 클라이언트 라이브러리는 `Cluster-aware` 모드 사용 (예: `lettuce`, `Jedis`, `ioredis` 등)

---

## 📚 참고 자료

- [AWS 공식 문서 - ElastiCache에서 클러스터 관리](https://docs.aws.amazon.com/ko_kr/AmazonElastiCache/latest/dg/Clusters.html)
-
