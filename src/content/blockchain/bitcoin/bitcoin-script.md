---
public: true
title: Bitcoin Script
date: '2025-12-27'
category: Blockchain
tags: []
excerpt: >-
  Bitcoin Script


  비트코인은 트랜잭션에 스크립팅 시스템을 사용합니다. 스크립트는 단순하고, 스택 기반이며, 좌에서 우로 진행합니다. 이것은 의도적으로
  튜링완전하지 않으며, 루프가 허용되지 않습니다.


  스크립트는 본질적으로 각 트랜잭션에 기록된 지시어들의...
---
# Bitcoin Script

비트코인은 트랜잭션에 스크립팅 시스템을 사용합니다. 스크립트는 단순하고, 스택 기반이며, 좌에서 우로 진행합니다. 이것은 의도적으로 튜링완전하지 않으며, 루프가 허용되지 않습니다.

스크립트는 본질적으로 각 트랜잭션에 기록된 지시어들의 배열이고, 지시어들은 전송되는 비트코인을 사용하려는 다음 사람이 접근 할 수 있는 지를 설명합니다.

일반적으로 비트코인을 수신자 주소로 전송하는 스크립트는 두가지이고 사용자가 제공해야 합니다. 첫번째로 트랜잭션이 해시될 때 스크립트에 포함된 수신자 주소를 생성하는 Public Key, 두번째로 첫번째로 제공한 Public Key에 대응하는 Private Key 소유권을 증명하는 서명입니다.

스크립팅은 전송된 비트코인을 사용하는데 필요한 매개변수를 변경할 수 있는 유연성을 제공합니다. 예를 들어, 스크립팅 시스템을 사용하여 두 개의 개인 키를 요구하거나 여러개의 키를 조합하거나 아예 키를 사용하지 않을 수 있습니다.

트랜잭션은 스크립트 조합에서 에러를 발생하지 않고, 최상위 스택 항목이 True(non-zero)인 경우에 유효합니다.

## 예시

### p2pkh(pay-to-pubkey-hash)

```
scriptPubKey: OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
scriptSig: <sig> <pubKey>
```

| Stack                                             | Script                                                                         | Description                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| Empty                                             | `<sig>` `<pubKey>` OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG | scriptSig와 scriptPubKey가 결합된다      |
| `<sig>` `<pubKey>`                                | OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                    | 상수를 스택에 추가한다                   |
| `<sig>` `<pubKey>` `<pubKey>`                     | OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                           | 최상위 스택 아이템이 복사되었다          |
| `<sig>` `<pubKey>` `<pubKeyHashA>`                | `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                                      | 최상위 스택 아이템이 해싱되었다          |
| `<sig>` `<pubKey>` `<pubKeyHashA>` `<pubkeyHash>` | OP_EQUALVERIFY OP_CHECKSIG                                                     | 상수를 스택에 추가한다                   |
| `<sig>` `<pubKey>`                                | OP_CHECKSIG                                                                    | 최상위 두개 아이템이 동일함을 확인하였다 |
| true                                              | Empty                                                                          | 최상위 두개 아이템의 서명이 확인되었다   |

### p2wpkh(pay-to-witness-pubkey-hash)

```
scriptPubKey: OP_0 <pubkey.hash:20>
scriptSig: Empty.
witness: <sig> <pubkey>
```

| Stack                                             | Script                                                                         | Description                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Empty                                             | OP_0 <pubkey.hash:20>                                                          | scriptSig와 scriptPubKey가 결합된다                                                |
| Empty                                             | `<sig>` `<pubKey>` OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG | p2wpkh패턴, witness정보의 `<sig>` `<pubkey>`을 통해 `<pubkey.hash:20>`을 치환한다. |
| `<sig>` `<pubKey>`                                | OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                    | 상수를 스택에 추가한다                                                             |
| `<sig>` `<pubKey>` `<pubKey>`                     | OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                           | 최상위 스택 아이템이 복사되었다                                                    |
| `<sig>` `<pubKey>` `<pubKeyHashA>`                | `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                                      | 최상위 스택 아이템이 해싱되었다                                                    |
| `<sig>` `<pubKey>` `<pubKeyHashA>` `<pubkeyHash>` | OP_EQUALVERIFY OP_CHECKSIG                                                     | 상수를 스택에 추가한다                                                             |
| `<sig>` `<pubKey>`                                | OP_CHECKSIG                                                                    | 최상위 두개 아이템이 동일함을 확인하였다                                           |
| true                                              | Empty                                                                          | 최상위 두개 아이템의 서명이 확인되었다                                             |

### p2sh-p2wpkh

```
scriptPubKey: <OP_HASH160> <script-hash> <OP_EQUAL>
scriptSig(redeemScript): hash160(<OP_2> <pubkey-a> <pubkey-b> <pubkey-c> <OP_3> <OP_CHECKMULTISIG>)
witness: <sig> <pubkey>
```

| Stack                                             | Script                                                                         | Description                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Empty                                             | `<redeem_script>` OP_HASH160 `<script-hash>` `OP_EQUAL`                        | scriptSig와 scriptPubKey가 결합된다                                                |
| Empty                                             | `<sig>` `<pubKey>` OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG | p2wpkh패턴, witness정보의 `<sig>` `<pubkey>`을 통해 `<pubkey.hash:20>`을 치환한다. |
| `<sig>` `<pubKey>`                                | OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                    | 상수를 스택에 추가한다                                                             |
| `<sig>` `<pubKey>` `<pubKey>`                     | OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                           | 최상위 스택 아이템이 복사되었다                                                    |
| `<sig>` `<pubKey>` `<pubKeyHashA>`                | `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                                      | 최상위 스택 아이템이 해싱되었다                                                    |
| `<sig>` `<pubKey>` `<pubKeyHashA>` `<pubkeyHash>` | OP_EQUALVERIFY OP_CHECKSIG                                                     | 상수를 스택에 추가한다                                                             |
| `<sig>` `<pubKey>`                                | OP_CHECKSIG                                                                    | 최상위 두개 아이템이 동일함을 확인하였다                                           |
| true                                              | Empty                                                                          | 최상위 두개 아이템의 서명이 확인되었다                                             |

### 미래 특정 시점까지 자금을 동결하고 싶은 경우

```
scriptPubKey: <expiry-time> OP_CHECKLOCKTIMEVERIFY OP_DROP OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
scriptSig: <sig> <pubKey>
```

| Stack                                             | Script                                                                                                                | Description                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Empty                                             | `<sig>` `<pubKey>` `<expiry-time>` OP_CHECKLOCKTIMEVERIFY OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG | scriptSig와 scriptPubKey가 결합된다                           |
| `<sig>` `<pubKey>` `<expiry-time>`                | OP_CHECKLOCKTIMEVERIFY OP_DROP OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                            | 상수를 스택에 추가한다                                        |
| `<sig>` `<pubKey>` `<expiry-time>`                | OP_DROP OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                                                   | 최상위 스택 아이템를 현재 시간 또는 블록 높이와 비교 확인한다 |
| `<sig>` `<pubKey>`                                | OP_DUP OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                                                           | 최상위 스택 아이템을 제거한다                                 |
| `<sig>` `<pubKey>` `<pubKey>`                     | OP_HASH160 `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                                                                  | 최상위 스택 아이템이 복사되었다                               |
| `<sig>` `<pubKey>` `<pubKeyHashA>`                | `<pubkeyHash>` OP_EQUALVERIFY OP_CHECKSIG                                                                             | 최상위 스택 아이템이 해싱되었다                               |
| `<sig>` `<pubKey>` `<pubKeyHashA>` `<pubkeyHash>` | OP_EQUALVERIFY OP_CHECKSIG                                                                                            | 상수를 스택에 추가한다                                        |
| `<sig>` `<pubKey>`                                | OP_CHECKSIG                                                                                                           | 최상위 두개 아이템이 동일함을 확인하였다                      |
| true                                              | Empty                                                                                                                 | 최상위 두개 아이템의 서명이 확인되었다                        |

### pay-to-multi-signature (2-out-of-3)

```
scriptPubKey: <OP_2> <pubkey-a> <pubkey-b> <pubkey-c> <OP_3> <OP_CHECKMULTISIG>
scriptSig: <OP_0> <sig> <sig> <OP_2>
```

### pay-to-script

```
scriptPubKey: <OP_HASH160> <script-hash> <OP_EQUAL>
scriptSig(redeemScript): hash160(<OP_2> <pubkey-a> <pubkey-b> <pubkey-c> <OP_3> <OP_CHECKMULTISIG>)
```

![](https://learnmeabitcoin.com/technical/images/address/encode-p2sh.png)

위 그림을 보면 중간에 hash160(script)가 있는데 이게 `redeem-script`의 해시값이라고 볼 수 있다. 이것을 base58로 변환했을때 a로 시작하는 P2SH주소 형태로 상대방에게 전달할 수 있습니다.

## Ref

- https://learnmeabitcoin.com/technical/p2sh
- https://medium.com/programming-bitcoin/chapter-13-세그윗-865a0c3f6414
- https://dev-notes.eu/2020/11/Bitcoin-Pay-To-Script-Hash/
- https://bitcoin.design/guide/glossary/address/
- https://developer.bitcoin.org/reference/rpc/
- https://en.bitcoin.it/wiki/Category:Technical
