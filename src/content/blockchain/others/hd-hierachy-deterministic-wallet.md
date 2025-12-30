---
public: true
title: HD(Hierarchical Deterministic) Wallet
date: '2025-12-27'
category: Blockchain
tags: [Blockchain, Wallet, BIP-32, BIP-39, BIP-44]
excerpt: "HD 지갑의 개념과 BIP-32/39/44 표준, 키 파생 경로 구조를 알아봅니다."
---
# HD(Hierarchical Deterministic) Wallet

## 개요

HD 지갑은 하나의 **시드(Seed)**로부터 무한한 개수의 개인키/공개키 쌍을 계층적으로 파생할 수 있는 지갑 구조입니다. BIP-32 표준에 정의되어 있으며, 현대 대부분의 암호화폐 지갑이 이 방식을 사용합니다.

## 왜 HD 지갑이 필요한가?

### 기존 지갑의 문제점

- 각 주소마다 별도의 개인키를 생성하고 백업해야 함
- 새 주소를 만들 때마다 백업 갱신 필요
- 개인키 관리가 복잡하고 분실 위험 증가

### HD 지갑의 장점

- **단일 시드 백업**: 12~24개 니모닉 단어만 백업하면 모든 키 복구 가능
- **결정론적 파생**: 동일한 시드에서 항상 동일한 키 시퀀스 생성
- **계층적 구조**: 용도별로 계정을 분리 관리 가능

---

## 핵심 BIP 표준

### BIP-39: 니모닉 시드 구문

사람이 읽을 수 있는 단어 목록으로 시드를 표현합니다.

```
abandon ability able about above absent absorb abstract absurd abuse access accident
```

- 12, 15, 18, 21, 24개 단어 지원
- 2048개 단어 목록에서 선택
- 마지막 단어에 체크섬 포함

### BIP-32: 키 파생 구조

시드로부터 마스터 키를 생성하고, 이를 기반으로 자식 키를 파생합니다.

```
Seed → Master Key → Child Key → Grandchild Key → ...
```

**키 파생 방식:**

- **일반 파생 (Normal)**: 확장 공개키로 자식 공개키 파생 가능
- **강화 파생 (Hardened)**: 개인키가 있어야만 자식 키 파생 가능 (보안 강화)

### BIP-44: 경로 규약

다중 코인, 다중 계정을 지원하기 위한 표준화된 경로 구조입니다.

```
m / purpose' / coin_type' / account' / change / address_index
```

| 레벨 | 설명 | 예시 |
|-----|------|------|
| `purpose'` | BIP 번호 (44 = BIP-44) | 44' |
| `coin_type'` | 코인 종류 | 0' (BTC), 60' (ETH) |
| `account'` | 계정 번호 | 0', 1', 2' |
| `change` | 외부(0) / 내부(1) | 0 |
| `address_index` | 주소 인덱스 | 0, 1, 2... |

**경로 예시:**

```
m/44'/0'/0'/0/0   → 첫 번째 비트코인 주소
m/44'/60'/0'/0/0  → 첫 번째 이더리움 주소
m/44'/501'/0'/0'  → 첫 번째 솔라나 주소
```

---

## 보안 고려사항

### 강화 파생을 사용해야 하는 곳

- `purpose`, `coin_type`, `account` 레벨은 반드시 강화 파생(`'`) 사용
- 일반 파생 키가 노출되면 형제 개인키 추론 가능

### 니모닉 보관

- 오프라인 환경에서 생성
- 물리적 매체(종이, 금속판)에 백업
- 디지털 저장 절대 금지

---

## 주요 코인별 경로

| 코인 | BIP-44 경로 | coin_type |
|-----|------------|-----------|
| Bitcoin | m/44'/0'/... | 0 |
| Ethereum | m/44'/60'/... | 60 |
| Solana | m/44'/501'/... | 501 |
| Ripple | m/44'/144'/... | 144 |
| Aptos | m/44'/637'/... | 637 |

---

## 참고 자료

- [BIP-32: Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP-39: Mnemonic code for generating deterministic keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP-44: Multi-Account Hierarchy](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [SLIP-44: Registered coin types](https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
