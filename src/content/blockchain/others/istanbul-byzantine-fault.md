---
public: true
title: '***Istanbul Byzantine Fault***'
date: '2025-12-27'
category: Blockchain
tags: [Blockchain]
excerpt: >-
  Istanbul Byzantine Fault


  > This article refers to link below!

  > 

  >
  [Link](https://steemit.com/kr/@kanghamin/istanbul-byzantine-fault-toleranc...
---
# ***Istanbul Byzantine Fault***

> This article refers to link below!
> 
> [Link](https://steemit.com/kr/@kanghamin/istanbul-byzantine-fault-tolerance)

## Consensus process

1.  Pre-Prepare
2.  Prepare
3.  Commit

-   Assuming that the bad node is F, System can run if the total number of nodes is 3F+1 or more.
-   Validator is that derive consensus, and they choose a proposer before generating blocks(before every round).

### Protocol: Propose

First, the proposer choose and propose a new block, then announce it with message.

![https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F0a8048d2-f260-4e4c-be50-a88e40aca8a9%2Fimage.png](https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F0a8048d2-f260-4e4c-be50-a88e40aca8a9%2Fimage.png)

### Protocol: Pre-Prepare

Second, protocol is 'pre-prepare' state with sending 'prepare' message when validators receive a message from proposer. This process makes every validators notice that they're in same state.

![https://velog.velcdn.com/images%2Fasap0208%2Fpost%2Fc3524567-17ce-4cc7-ad10-72bb78e13f9a%2Fimage.png](https://velog.velcdn.com/images%2Fasap0208%2Fpost%2Fc3524567-17ce-4cc7-ad10-72bb78e13f9a%2Fimage.png)

### Protocol: Prepare

Third, when validators get more than 2F+1 of messages, protocol is 'prepare' state and send 'commit' message.

![https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F7973d4cc-6dd8-43d7-9349-db904db584f3%2Fimage.png](https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F7973d4cc-6dd8-43d7-9349-db904db584f3%2Fimage.png)

### Protocol: Commit

This protocol makes peers notice that proposed blocks are permitted, and connects those to the chain. When they receive more than 2F+1 of messages, protocol should be 'commit' state, then blocks are connected to chain.

![https://velog.velcdn.com/images%2Fasap0208%2Fpost%2Faf462703-0be6-439d-925f-2c14c0dc9412%2Fimage.png](https://velog.velcdn.com/images%2Fasap0208%2Fpost%2Faf462703-0be6-439d-925f-2c14c0dc9412%2Fimage.png)

### Overall process

![https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F7939f561-1b3d-4801-8bda-e3df4b3482cc%2Fimage.png](https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F7939f561-1b3d-4801-8bda-e3df4b3482cc%2Fimage.png)

Image above shows the whole algorithm, when consensus is failed, go to 'Round change' and then restart over again.

## Wrap up

Consensus process is composed of three state, Success insertion of block means finality. Simply put, there's no way to change it at all.Therefore, it cannot be forked and valid block must be on the main blockchain.
