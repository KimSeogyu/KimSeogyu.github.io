---
public: true
title: ACID
date: '2025-12-27'
category: Database
tags: []
excerpt: |-
  ACID

   정의

  - Atomic

    트랜잭션의 연산은 모두 정상적으로 실패하거나 모두 실패해야 한다.

  - Consistent

    트랜잭션이 성공한 후에 데이터베이스의 제약조건을 포함한 일관성이 지켜져야 한다.

  - Isolation

    현재 진행중인...
---
# ACID

## 정의

- Atomic

  트랜잭션의 연산은 모두 정상적으로 실패하거나 모두 실패해야 한다.

- Consistent

  트랜잭션이 성공한 후에 데이터베이스의 제약조건을 포함한 일관성이 지켜져야 한다.

- Isolation

  현재 진행중인 트랜잭션이 있다면 다른 트랜잭션이 이 트랜잭션에 접근할 수 없다. 각 트랜잭션은 독립적으로 수행되어야 한다.

- Durability

  트랜잭션이 성공되었다면 데이터베이스는 이 결과를 영구적으로 반영해야 한다. 하나라도 손실이 있으면 안된다.

## 더 나아가서

Redis와 함께 데이터베이스 트랜잭션 및 분산 잠금을 사용하는 것은 백엔드에서 동시성 처리의 원자성과 일관성을 보장하는 좋은 방법입니다. 응용프로그램의 특정 요구에 따라 이러한 기술을 적용할 수 있는 추가 방법이 있습니다.

빅테크에서 원자성과 일관성을 보장하는 한 가지 추가적인 방법은 여러 데이터베이스 또는 서비스에 분산 트랜잭션을 사용하는 것입니다. 예를 들어 각 서비스에 자체 데이터베이스가 있는 마이크로서비스 아키텍처가 있는 경우 분산 트랜잭션을 사용하여 특정 트랜잭션과 관련된 모든 서비스가 함께 커밋되거나 롤백되도록 할 수 있습니다.

분산 트랜잭션을 지원하기 위해 2PC(Two-Phase Commit) 프로토콜, X/Open XA 프로토콜, Saga 패턴 등 다양한 도구와 기술을 사용할 수 있습니다. 이러한 기술을 통해 트랜잭션이 완전히 커밋되거나 관련된 모든 서비스에 걸쳐 완전히 롤백되어 시스템이 일관되게 유지됩니다.

그러나 분산 트랜잭션은 구현하기가 복잡하고 성능 오버헤드가 발생할 수 있습니다. 따라서 절충안을 신중하게 고려하고 사용 사례에 필요한지 여부를 결정하는 것이 중요합니다.

분산 트랜잭션 외에도 Big Tech에서 원자성과 일관성을 보장하기 위한 다른 모범 사례로는 데이터 유효성 검사 구현, 최적의 잠금 기술 사용, 정기적인 데이터 백업 및 재해 복구 계획 수행 등이 있습니다. 이러한 모범 사례는 예기치 않은 오류나 오류가 발생한 경우에도 데이터를 일관성 있게 유지하고 사용할 수 있도록 보장하는 데 도움이 됩니다.

Using database transactions and distributed locks with Redis is a good way to ensure atomicity and consistency in concurrency processing at the backend. There are additional ways to apply these techniques depending on the specific needs of your application.

One additional way to ensure atomicity and consistency in Big Tech is to use distributed transactions across multiple databases or services. For example, if you have a microservices architecture where each service has its own database, you can use distributed transactions to ensure that all the services involved in a particular transaction either commit or rollback together.

There are various tools and technologies available to support distributed transactions, such as Two-Phase Commit (2PC) protocol, X/Open XA protocol, and the Saga pattern. These technologies ensure that transactions are either fully committed or fully rolled back across all services involved, ensuring that the system remains consistent.

However, it's important to note that distributed transactions can be complex to implement and can introduce performance overhead. Therefore, it's important to carefully consider the trade-offs and determine if they are necessary for your use case.

In addition to distributed transactions, other best practices to ensure atomicity and consistency in Big Tech include implementing data validation checks, using optimistic locking techniques, and performing regular data backups and disaster recovery planning. These best practices help to ensure that data remains consistent and available even in the face of unexpected failures or errors.

## Ref

- [ACID](https://ko.wikipedia.org/wiki/ACID)
