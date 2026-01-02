---
public: true
title: 비트코인 NFT와 BRC-20(FT)
date: '2025-12-27'
category: Blockchain
tags: [Blockchain]
excerpt: >-
  비트코인 NFT와 BRC-20(FT)


  연초에 비트코인에서 `NFT` 발행이 가능해졌다는 뉴스가 나왔다. 최근에는 `brc-20` 트랜잭션 급증으로 비트코인 네트워크가 혼잡해지고
  있다.

  본 글에서는 단순했던 비트코인 네트워크에서 어떻게 이더리움같은 `FT`, `NF...
---
# 비트코인 NFT와 BRC-20(FT)

연초에 비트코인에서 `NFT` 발행이 가능해졌다는 뉴스가 나왔다. 최근에는 `brc-20` 트랜잭션 급증으로 비트코인 네트워크가 혼잡해지고 있다.
본 글에서는 단순했던 비트코인 네트워크에서 어떻게 이더리움같은 `FT`, `NFT`를 발행할 수 있었는지 정리한다.

## 비트코인에서의 Ordinals Protocal (서수체계) 도입과 비트코인 NFT의 출현

[Ordinal Numbers](https://github.com/casey/ord/blob/master/bip.mediawiki)의 제안 동기는 비트코인 애플리케이션에서 사용될 수도 있는 안정적인 식별자를 제공하기 위함이라고 하는데, 이는 비트코인 주소 체계 상 안정적으로 사용할 만한 공개 신원 정보가 없기 때문입니다.

서수체계 도입을 위해 모든 사토시를 채굴된 순서로 일련번호를 지정합니다. 이 숫자를 서수, `ordinal number`로 부릅니다. 구체적인 알고리즘은 다음과 같습니다. 이 코드는 블록체인에서 새 블록의 채굴 보상을 계산하고, 해당 블록에 속한 트랜잭션의 출력값에 일련번호(ordinal)를 부여하는 기능을 수행합니다.

```python
# subsidy 함수는 블록의 높이(height)를 입력으로 받아 그 높이에 해당하는 블록의 채굴 보상을 계산합니다. 
# 비트코인의 경우, 채굴 보상은 50 BTC로 시작하여 210,000 블록마다 절반으로 줄어들기 때문에, 이 함수는 높이에 따른 보상을 계산하기 위해 이러한 수식을 사용합니다.
def subsidy(height):
  return 50 * 100_000_000 >> height // 210_000

# first_ordinal 함수는 블록의 높이를 입력으로 받아 해당 높이의 첫 번째 트랜잭션 출력값에 할당될 일련번호를 계산합니다. 
# 이 함수는 이전 블록의 모든 출력값에 대한 일련번호를 더하고 블록의 채굴 보상을 더하여 구합니다.
def first_ordinal(height):
  start = 0
  for height in range(height):
    start += subsidy(height)
  return start

# assign_ordinals 함수는 블록을 입력으로 받아, 각 트랜잭션 출력값에 일련번호를 부여합니다. 
# 이 함수는 먼저 블록 채굴 보상에 대한 일련번호를 계산하고, 이어서 블록 내의 모든 트랜잭션에 대해 다음을 수행합니다. 
# 각 트랜잭션의 입력값에서 일련번호를 가져와 출력값에 할당하고, 출력값에 일련번호를 부여합니다. 
# 마지막으로, 채굴 보상 출력값에 일련번호를 할당합니다. 
# 이러한 과정을 통해 블록 내의 모든 출력값에 일련번호가 부여됩니다.
def assign_ordinals(block):
  first = first_ordinal(block.height)
  last = first + subsidy(block.height)
  coinbase_ordinals = list(range(first, last))

  for transaction in block.transactions[1:]:
    ordinals = []
    for input in transaction.inputs:
      ordinals.extend(input.ordinals)

    for output in transaction.outputs:
      output.ordinals = ordinals[:output.value]
      del ordinals[:output.value]

    coinbase_ordinals.extend(ordinals)

  for output in block.transaction[0].outputs:
    output.ordinals = coinbase_ordinals[:output.value]
    del coinbase_ordinals[:output.value]
```

<br/>

여기에 더해 inscription이 적용되면서 ordinal inscription은 NFT와 유사한 디지털 자산으로 볼 수 있게 되었습니다. 기존의 NFT는 스마트체인 또는 사이드체인의 컨트랙트를 통해 호스팅 되었지만, 비트코인 NFT는 사토시에 바인딩 되어 있기 때문에 사이드 체인이나 별도의 토큰이 필요하지 않습니다.

Ordinals는 단순히 가치 이전만 제공하던 비트코인 네트워크의 새로운 사용 사례를 만들었습니다. 최근 트랜잭션이 늘어나면서 네트워크 비용이 증가하고 기존 비트코인의 단순성을 훼손하는 것이 아니냐는 지적이 있습니다. 그러나 Ordinals의 지지자들은 미래에 블록 보상이 감소하더라도 네트워크 수수료가 비트코인에 대한 해시 파워를 약속하는 주요 인센티브가 될 수 있다고 주장합니다.

## BRC-20의 등장

앞서 설명한 서수의 등장과 탭루트 업그레이드를 통해서 비트코인 블록체인에서 NFT 발행이 가능해졌고, 최근 이를 이용한 BRC-20이 등장하게 되었습니다. BRC-20을 제안한 `domo`가 밝혔듯이, BRC-20은 inscriptions를 활용한 실험이며 아직 진지하게 받아들일 만한 공식 표준이 아닙니다. BRC-20의 기본적인 목적은 서수 이론을 통해 비트코인에 fungibility를 도입할 수 있는지 확인하는 것입니다. 자세한 내용은 [다음 문서](https://domo-2.gitbook.io/brc-20-experiment/)에서 확인할 수 있습니다.

## 참고

1. [비트코인 서수와 NFT - 바이낸스 아카데미](https://academy.binance.com/en/articles/what-are-ordinals-an-overview-of-bitcoin-nfts)
2. [BRC-20 - domo](https://domo-2.gitbook.io/brc-20-experiment/)
3. [BRC-20 토큰 - 바이낸스 아카데미](https://academy.binance.com/cs/glossary/brc-20-tokens)
4. [Ordinal Numbers bip.memiawiki](https://github.com/casey/ord/blob/master/bip.mediawiki)
5. [Ordinal Theory document](https://docs.ordinals.com/overview.html)
6. [Bitcoin Taproot - 바이낸스 아카데미](https://academy.binance.com/en/articles/what-is-taproot-and-how-it-will-benefit-bitcoin)
