---
public: true
title: Move on Aptos
date: '2025-12-27'
category: Blockchain
tags: []
excerpt: >-
  Move on Aptos


  앱토스 블록체인은 합의 프로토콜을 실행하는 밸리데이터 노드들로 구성됩니다. 합의 프로토콜은 Move Virtual
  Machine(`MoveVM`)에서 실행될 때 트랜잭션들의 순서와 출력(`output`)에 동의합니다. 각 밸리데이터 노드는...
---
# Move on Aptos

앱토스 블록체인은 합의 프로토콜을 실행하는 밸리데이터 노드들로 구성됩니다. 합의 프로토콜은 Move Virtual Machine(`MoveVM`)에서 실행될 때 트랜잭션들의 순서와 출력(`output`)에 동의합니다. 각 밸리데이터 노드는 현재 블록체인 원장 상태와 함께 트랜잭션을 VM에 대한 입력으로 변환합니다. `MoveVM은` 이 입력을 처리하여 변변경사항(`changeset`) 또는 스토리지 델타를 출력으로 생성합니다. 합의 프로토콜이 동의하고 출력이 커밋되면 이는 공개적으로 보이는 상태가 됩니다.

## What is Move?

`Move`는 희소성과 접근 제어를 강조하는, Web3를 위한 안전하고 보안이 뛰어난 프로그래밍 언어입니다. `Move`의 모든 자산은 리소스로 또는 리소스에 저장되어 표현될 수 있습니다. 희소성은 구조체(`struct`)를 복제할 수 없기 때문에 기본적으로 강제됩니다. 오직 바이트코드 계층에서 명시적으로 복사본(`copy`)으로 정의된 경우에만 복제할 수 있습니다.

접근제어(`Access Control`)는 모듈(`module`) 접근 권한과 계정(`accounts`)의 개념에서 비롯됩니다. `Move`의 모듈은 자산을 생성(`create`), 저장(`store`), 전송(`transfer`)하는 라이브러리 또는 프로그램일 수 있습니다. `Move`는 오직 공개(`public`)모듈 기능(`functions`)들만 다른 모듈에서 접근할 수 있음을 보증합니다. 구조체가 `public`  생성자(`constructor`)를 가진 것이 아니라면, 오직 해당 구조체를 정의하고 있는 모듈에서만 생성될 수 있습니다. 마찬가지로, 구조체 내의 필드는 해당 모듈 내에서 또는 `public` `getter`또는 `setter`를 통해서만 액세스하고 변경할 수 있습니다.

`Move`에서 트랜잭션의 전송자는 특정 `account`의 확인된 소유자인 `signer`로 표현합니다.  `signer`는 `Move`에서 가장 높은 권한 레벨을 가지고 있고 `account`에 `resources`를 추가할 수 있는 유일한 엔티티입니다. 게다가, 모듈 개발자는 `resource`에 접근하거나 계정에 저장된 자산을 수정하기 위해  `signer`가 있어야한다고 요구할 수 있습니다.

## Comparison to other VMs

| | Aptos/Move | Solana/SeaLevel | EVM |
|--|------|------|------|
| Data Storage | 소유자의 계정에 저장됨 Stored within the owner's account | 프로그램과 관련된 소유자 계정 내에 저장 Stored within the owner's account associated with a program | 컨트랙트와 관련된 계정내에 저장 Stored within the account associated with a smart contract |
| Parallelization | 앱토스 내에서 런타임에 병렬화를 추론할 수 있음 Capable of inferring parallelization at runtime within Aptos | 트랜잭션 내에서 액세스하는 모든 계정 및 프로그램을 지정해야 함 Requires specifying within the transaction all accounts and programs accessed | 현재로선 직렬화 하지 않음 Currently serial nothing in production |
| Transaction safety | Sequence number | 트랜잭션 고유성 + 트랜잭션 기억 Transaction uniqueness + remembering transactions | nonces, similar to sequence numbers |
| Type safety | Module structs and generics| Program structs | Contract types |
| Function calling | 제네릭이 아닌 정적 디스패치 Static dispatch not on generics | 정적 디스패치 Static dispatch | 동적 디스패치 Dynamic dispatch |

## Aptos Move features

`MoveVM`의 각 배포는 어댑터 레이어를 통해 코어 `MoveVM`을 추가 기능으로 확장할 수 있는 기능이 있습니다. 또한 `MoveVM`에는 컴퓨터가 `OS`를 가진 것 처럼 표준작업을 지원하는 프레임워크가 있습니다.

`Aptos Move Adapter`에는 아래 기능들이 있습니다.
- 계정에 저장된 데이터 양을 분리하여 계정과 관련된 트랜잭션의 가스 요금에 영향을 미치는 세분화된 스토리지 (`Fine grained storage`) 
- 크기에 맞게 계정 내에 키, 값 데이터를 저장할 수 있는 `Tables`
- 사용자의 입력 없이 트랜잭션을 동시에 실행할 수 있는 `Block-STM`을 통한 병렬성

`Aptos framework`는 여러 유용한 라이브러리를 포함합니다.
- 스마트 계약을 게시하지 않고도 NFT 및 기타 풍부한 토큰을 생성할 수 있는 `Token standard`
- 가벼운 모듈을 게시하여 안전한 유형의 코인 생성을 가능하게 하는 `Coin standard`
- 스테이킹 및 위임 프레임워크
- 주어진 유형의 주소, 모듈 및 구조체 이름을 런타임에 식별하는 `type_of` 서비스
- 여러 `signer` 엔터티를 허용하는 `Multi-Signer` 프레임워크
- 실제 현재 유닉스타임에 매핑되는 단조롭게 증가하는 시계를 제공하는 `timestamp` 서비스

## Key Concepts in Aptos Move

- 데이터는 모듈을 게시한 계정이 아닌 데이터를 소유한 계정 내에 저장되어야 합니다.
- 데이터 흐름에는 생태계 유용성에 중점을 둔 최소한의 제약이 있어야 합니다.
- 제네릭을 통한 런타임 안전보다 정적 유형 안전을 선호합니다.
- 명시적으로 명확하지 않은 경우 `signer`는 자산을 계정에 추가하거나 제거할 수 있는 액세스를 제한해야 합니다.

### Data ownership

데이터는 모듈을 게시한 계정이 아니라 데이터를 소유한 계정에 저장해야 합니다.  

`Solidity`에서 데이터는 계약을 생성한 계정의 네임스페이스 내에 저장됩니다. 일반적으로 이것은 값에 대한 주소의 맵 또는 소유자의 주소에 대한 인스턴스 ID의 맵으로 표시됩니다.  

`Solana`에서 데이터는 계약과 관련된 별개의 계정에 저장됩니다.  

`Move`에서 데이터는 모듈 소유자의 계정에 저장될 수 있지만, 이는 소유권 모호성 문제를 야기하며 다음 두 가지 문제를 암시한다:  
1. 자산에 소유자와 연결된 리소스가 없기 때문에 소유권이 모호해집니다  
2. 모듈 작성자는 임대, 회수 등과 같은 리소스의 수명에 대한 책임을 집니다  

첫 번째로, 자산을 계정 내의 신뢰할 수 있는 리소스에 배치함으로써 소유자는 악의적으로 프로그래밍된 모듈조차도 해당 자산을 수정할 수 없도록 할 수 있습니다. `Move`에서는 표준 주문서 구조와 인터페이스를 프로그래밍하여 상단에 구축된 애플리케이션이 계정이나 주문서 항목에 백도어 액세스를 할 수 없도록 할 수 있습니다.  
  
다음 두 가지 `Coin` 보관 전략을 비교해 보십시오:  
  
다음은 인덱스로 표시된 소유권을 가진 단일 `Account`로 코인을 배치합니다.

```move
struct CoinStore has key {
	coins: table<address, Coin>,
}
```

대신에  `Account` 에 `Coin`을 저장하는 접근법에서는 소유권을 명시적으로 할 수 있습니다.

```move
struct CoinStore has key {
    coin: Coin,
}
```

### Data flow

데이터 흐름은 생태계 유용성에 중점을 두고 최소한의 제약 조건을 가져야 합니다.

Move에서 어떤 인터페이스도 해당 구조체(`struct`)를 값 형태로 나타내지 않도록 하고, 대신 모듈내에 정의된 데이터를 조작하기 위한 기능만을 제공하도록 할 수 있습니다(캡슐화, `encapsulation`). 이를 통해 자산이 오직 모듈 내에서만 접근 할 수 있도록 프로그래밍 할 수 있습니다. 이것은 직접적인 읽기와 쓰기 접근을 제한하여 다른 모듈과의 상호운용성이 차단됩니다. 

`Coin<T>`를 `input`으로 하고 `Ticket`을 `return`하는 컨트랙트가 있다고 가정해보겠습니다. 만약 `Coin<T>`를 모듈 내에서만 정의했고 외부로 내보낼 수 없는 경우, 해당 `Coin<T>`에 대한 요청들은 모듈이 정의한 항목으로만 제한됩니다.
  
입금 및 인출을 사용하여 코인 전송을 구현하는 다음의 두 가지 기능을 비교해 보십시오:

```move
public fun transfer<T>(sender: &signer, recipient: address, amount: u64) {
    let coin = withdraw(&sender, amount);
    deposit(recipient, coin);
}
```

모듈 외부에서 코인을 사용할 수 있는 범위는 다음과 같습니다.

```move
fun withdraw<T>(account: &signer, amount: u64): Coin<T>
fun deposit<T>(account: address, coin: Coin<T>)
```

인출 및 입금에 `public accessors`를 추가하면 코인을 모듈 외부로 가져와 다른 모듈에서 사용하고 모듈로 반환할 수 있습니다.

```move
public fun withdraw<T>(account: &signer, amount: u64): Coin<T>
public fun deposit<T>(account: address, coin: Coin<T>)
```

### Type-safety

`Move`에서 `A`라고 하는 특정 구조체가 주어지면 서로 다른 인스턴스를 두 가지 방식으로 구분할 수 있습니다.

- GUID와 같은 내부 식별자
- `T`가 또 다른 구조체인 `A<T>`와 같은 제네릭

내부 식별자는 단순하고 프로그래밍이 용이하기 때문에 편리할 수 있습니다. 그러나 제네릭은 명시적 컴파일 또는 유효성 검사 시간을 포함한 훨씬 더 높은 보장을 제공하지만 일부 비용이 발생합니다.

제네릭은 이러한 유형을 예상하는 완전히 다른 유형과 리소스 및 인터페이스를 허용합니다. 예를 들어, 주문서에는 모든 주문에 대해 두 개의 통화가 예상되지만 그 중 하나는 수정되어야 한다고 명시할 수 있습니다. 예를 들어, `buy<T>(Coin: Coin<APT>): Coin<T>`. 이것은 사용자가 어떠한 `Coin<T>`도 구매할 수 있지만 `Coin<APT>`로 결제해야 한다는 것을 명시합니다.

제네릭의 복잡성은 데이터를 `T`에 저장하는 것이 바람직할 때 발생합니다. `Move`는 제네릭에서 정적 디스패치를 지원하지 않으므로, `create<T>(...) : Coin<T>`와 같은 함수에서 T는 팬텀 유형이어야 합니다. 즉, Coin에서 유형 매개 변수로만 사용되거나 생성할 입력으로 지정되어야 합니다. 모든 `T`가 해당 함수를 구현하더라도 `T:: function`과 같이 사용될 수 없습니다.

대량으로 생성될 수 있는 구조체의 경우 제네릭은 데이터 추적 및 이벤트 방출과 관련된 많은 새 저장소 및 리소스를 생성하는 결과를 낳습니다.

이 때문에, 우리는 두 가지 "토큰" 표준을 만드는 어려운 선택을 했습니다. 하나는 `Coin`이라는 통화와 관련된 토큰에 대한 것이고, 다른 하나는 자산과 또는 NFT로 불리는 `Token`에 대한 것입니다. `Coin`은 제네릭을 통해 정적 유형의 안전성을 활용하지만 훨씬 단순한 계약입니다. `Token`은 자체 범용 식별자를 통해 동적 유형 안전을 활용하고 사용의 인체공학에 영향을 미치는 복잡성 때문에 일반론을 회피합니다

### Data access

- `signer`는 명시적으로 명확하지 않은 한 계정에 자산을 추가하거나 제거하는 액세스를 제한해야 합니다.

`Move`에서 모듈은 계정 소유자 서명자의 존재에 관계없이 리소스에 액세스하는 방법과 리소스 내용을 수정하는 방법을 정의할 수 있습니다. 즉, 프로그래머가 실수로 다른 사용자의 계정에서 임의로 자산을 생성하거나 제거할 수 있는 리소스를 만들 수 있습니다.

Aptos Core Framework를 개발하면서 접근 권한을 허용 또는 방지한 위치에 대한 몇 가지 예가 있습니다:

- A유저가 이미  `U Token`을 보유한 것이 아니라면, `U Token`은 A유저의 `account`에 직접 생성할 수 없습니다.
- 접근 제어 목록을 효과적으로 사용해서  `TokenTransfers`가 유저가 명시적으로 다른 유저의 리소스의 토큰을 요구할 수 있도록 한다.
- A유저가 `Coin<T>`을 저장할 `CoinStore<Coin<T>>`리소스를 가지고 있는 한, 어떤 유저든 A유저에게 `Coin<T>`을 직접 전송할 수 있습니다.

`Token`에 대한 엄격한 노력이 부족하면 사용자가 다른 사용자 계정으로 직접 `Token`을 에어드롭할 수 있으며, 이는 사용자 계정에 추가 스토리지를 추가하고 처음 승인하지 않은 콘텐츠의 소유자가 됩니다.

구체적인 예로, 인출 기능이 있는 이전 `Coin` 케이스로 돌아가십시오. 대신 `withdraw` 함수가 다음과 같이 정의된 경우(`signer` 인수가 없음에 유의하십시오):

```move
public fun withdraw<T>(account: address, amount: u64): Coin<T>
```

누구나 계정에서 코인을 제거할 수 있습니다.

### Resource accounts

`Move` 모델은 종종 트랜잭션의 `signer`를 알아야 하기 때문에, Aptos는 `signer` 기능을 할당하기 위한 리소스 계정을 제공합니다. 리소스 계정을 생성하면 `signer` 기능에 액세스하여 자동으로 사용할 수 있습니다. `signer` 기능은 리소스 계정의 `signer`가 리소스 계정을 생성하거나 모듈의 로컬 저장소에 배치된 원본 계정의 주소와 함께 검색할 수 있습니다. `create_nft_with_resource_account.move`에서 `resource_signer_cap` 참조를 참조하십시오.

리소스 계정을 생성할 때 해당 계정에 `signer` 기능도 부여합니다. `signer` 기능 내의 유일한 필드는 `signer`의 주소입니다. `signer` 기능에서 `signer`를 생성하는 방법을 보려면 `create_nft_with_resource_account.move`의 `let resource_signer` 함수를 검토하십시오.  
  
보안 침해를 방지하기 위해 모듈과 리소스 계정만 서명자 기능을 호출할 수 있습니다. 서명자 기능에서 서명자를 역으로 생성할 수 없으며, 대신 새 리소스 계정을 생성해야 합니다. 예를 들어 개인 키에서 서명자 기능을 생성할 수 없습니다.

`signer` 취약성을 추가로 방지하려면 지갑 이벤트를 모니터링하고 다음 사항을 확인하십시오:  
  
- 공제되는 금액이 맞습니다.  
- NFT 생성 이벤트가 있습니다.  
- NFT 인출 이벤트가 없습니다.

See [resource accounts](https://aptos.dev/guides/resource-accounts) to learn more.

### Coins

APT(Aptos Token)는 임의의 주소로 전송할 수 있으므로 존재하지 않는 주소에 대한 계정을 만들 수 있습니다. 예를 들어, USDC를 구입했으며 이를 APT로 변환하려고 합니다. 사용자를 보호하려면 해당 토큰을 수락해야 합니다.

### Wrapping

`Coin` 대신 밸런스를 직접 보관하는 이유는 무엇입니까? 우리는 당신이 `wrapper` 기능을 추가할 수 있도록 간접적으로 추가합니다.

예를 들어, `Coin`에서 출금 및 입금 이벤트를 전송할 수 있습니다.

하지만 에스크로의 경우 `Coin`을 보유하기 위한 이벤트도 방출할 수 있습니다.

모듈 내에서 다른 구조체들을(`structure`)를 `destructure` 하여 간접적으로 잔액 대신 직접 `Coin`에서 동작시킬 수 있습니다.

그것은 개별 구현에 달려 있습니다. 동일한 모듈에서 `Coin`과 밸런스를 모두 정의하는 경우 `destructure`를 통해 내부의 `Coin`에 대한 참조를 얻을 수 있으며 구조 자체에 대한 변경 가능한 참조를 얻을 수 있습니다. 대신 `Coin` 모듈에 의존하는 경우, 사용자에게 입금하기 위해 `Balance` 메서드를 사용하거나 `BalanceWithdraw` 메서드를 사용하여 실제 `Coin`을 얻어야 합니다. 함께 추가하려면 `CoinMerge를` 사용하십시오.

### Generics

사용자 지정 토큰과 Aptos 토큰 모두에 제네릭을 사용할 수 있습니다. Aptos가 제공하는 유일한 마법은 Aptos가 애그리게이터를 사용한다는 것입니다. 다른 코인 유형에는 아직 사용할 수 없습니다.

### Visibility

`Functions`는 `private`이 기본 값이므로 같은 파일에서만 호출될 수 있습니다. [`public`, `public(entry)`, etc.] 를 사용해서 파일 바깥에서 호출 하도록 할 수 있습니다.

-   `entry` - 함수 호출을 실제 entry 함수로 만들어 분리합니다. 재중복성을 방지합니다(컴파일러 오류 발생)
-   `public` - 누구나 어디서나 함수를 호출할 수 있습니다
-   `public(entry)` - 관련 트랜잭션에 정의된 메서드만 함수를 호출할 수 있습니다
-   `public(friend)` - 현재 모듈이 신뢰하는 모듈을 선언하는 데 사용됩니다.
-   `public(script)` - Aptos 네트워크에서 임의 이동 코드를 제출, 컴파일 및 실행할 수 있습니다

가능한 `public(entry)`이 아닌 `entry`를 사용하는 것을 권장하는데, 코드가 추가 개체(`object`)로 감싸이지 않도록 해주기 때문입니다.

`Move`는 두 가지 방법으로 재진입을 방지합니다

1.  동적 디스패치가 없는 경우 모듈 내의 다른 모듈을 호출하려면 해당 모듈에 명시적으로 의존해야 합니다. 따라서 다른 모듈은 사용자에게 의존해야 합니다.
2.  순환 종속성은 허용되지 않습니다. 따라서 A가 B를 호출하고 B가 A에 상호 의존하면 모듈 B를 배포할 수 없습니다.

Find out more about the Move programming language among the [Move Guides](https://aptos.dev/).
