---
public: true
title: Aptos Move Structure
date: '2025-12-27'
category: Blockchain
tags: [Blockchain]
excerpt: >-
  Aptos Move Structure


  여러분의 Move 코드를 어떻게 구성하는게 좋은지 이해하는 시간을 가져봅시다


  Move의 구조체는 함수 클래스 역할을 하는 Rust와 같은 다른 프로그래밍 언어의 구조체와 비슷합니다. 원하는 만큼 구조체에 많은 필드를
  가질 수...
---
# Aptos Move Structure

여러분의 Move 코드를 어떻게 구성하는게 좋은지 이해하는 시간을 가져봅시다

Move의 구조체는 함수 클래스 역할을 하는 Rust와 같은 다른 프로그래밍 언어의 구조체와 비슷합니다. 원하는 만큼 구조체에 많은 필드를 가질 수 있지만 개체 지향 프로그래밍에서와 같이 구조체에 메서드를 가질 수는 없습니다. 마찬가지로 Move에는 상속이 없습니다. 대신 구조체를 다시 생성하려면 구조체를 복제해야 합니다.

일단 게시되면 Move의 구조체 정의는 변경할 수 없습니다. 구조체 자체는 업그레이드할 수 없지만 해당 필드의 값은 변경될 수 있습니다. Move의 보안을 위해 구조체가 정의된 모듈만 구조체를 분해하거나 해당 속성에 액세스할 수 있습니다.

## Abilities

Move의 구조체(Structures)에는 해당 유형으로 수행할 수 있는 작업을 설명하는 다양한 기능이 부여될 수 있습니다. 다음과 같은 네 가지 기능이 있습니다.

- copy: 복사할 수 있는 기능. 지리적 ID가 좋은 활용 사례가 될 것입니다. NFT는 이 기능을 가지고 있어서는 안 됩니다.  values of types with this ability to be copied. A geographic ID would be a good use case. NFTs should not have this ability.
- drop: 팝/드롭할 수 있는 기능.
- store: 글로벌 스토리지의 구조체 내부에 저장 또는 저장할 수 있는 기능.
- key: 글로벌 스토리지 작업의 키 역할을 하는 유형입니다. 이 기능을 사용하면 값을 계정 내 최상위 항목으로 저장할 수 있습니다.

## Global storage

Move에서 각 계정은 주어진 유형의 리소스를 하나만 가질 수 있습니다. `Coin`예를 들어 Move의 계정은 하나의 유형 만 존재하는 해시맵과 유사하기 때문입니다 . 해시맵은 리소스 유형 또는 모듈 이름을 리소스 값에 매핑한 것입니다. 이것이 Aptos가 여러 코인과 토큰을 보유하기 위한 추상화를 제공하기 위해 `CoinStore`및 의 홀더 패턴을 제공하는 이유입니다. `TokenStore`이러한 홀더는 테이블을 포함하거나 저장을 위해 제네릭을 사용합니다.

Aptos 는 효율적인 상태 동기화 및 인증된 스토리지 읽기를 위해 [Merkle 트리 를 사용합니다.](https://aptos.dev/reference/glossary/#merkle-trees)

## Signers

Aptos에서 서명자는 엄청나게 강력합니다. 구조체는 서명자 주소로 게시됩니다. 서명자는 트랜잭션에 서명하고 제출할 때 생성됩니다. 트랜잭션을 제출할 때 서명자는 기본적으로 첫 번째 매개변수입니다. 서명자는 자신의 구조체를 체인에 포함하는 데 동의했습니다. 서명자에게는 저장 또는 키 기능이 없고 복사 기능만 있습니다.

## key

다른 사용자가 서명자를 사용할 수 있도록 하기 위해 서명자는 리소스에 저장됩니다. `key` 기능을 통해 `type`은 `store` 기능이 있는 `Coin`과 같은 글로벌 스토리지 작업의 `key` 역할을 할 수 있습니다. `Balance`에는 `key`기능이 있으므로 계정 내 최상위 항목으로 `store`할 수 있습니다.

Aptos는 서명자를 저장하지 않고 서명자 기능을 저장합니다. 제한된 `native` 기능만 서명자 기능을 만들 수 있습니다. NFT를 `minting`하려면 컬렉션을 생성한 서명자에 대한 액세스 권한이 필요합니다. 이것이 동적 발행을 수행할 때 많은 사람들이 NFT를 미리 발행(`pre-mint`)하는 이유입니다. Aptos는 트랜잭션에 자율적으로 서명할 수 있는 리소스 계정을 제공합니다.

## acquires

유저가 구조체와 같은 글로벌 리소스를 사용할때마다 항상 먼저 이것을 획득(`acquire`)해야합니다. 예를 들어,  NFT 입출금시 `TokenStore`를 획득해야 합니다. 리소스를 획득하는 모듈 내부의 함수를 호출하는 다른 모듈의 함수가 있는 경우, 첫 번째 함수에 `acquires()`로 레이블을 지정할 필요가 없습니다.

리소스가 계정 내부에 저장되므로 소유권이 명확해집니다. 계정은 리소스를 생성할 수 있는지 여부를 결정할 수 있습니다. 해당 리소스를 정의하는 모듈은 해당 구조체를 읽고 수정하는 권한을 가집니다. 따라서 해당 모듈 내부의 코드는 해당 구조체를 명시적으로 획득해야 합니다.

그래도 Move에서 빌리거나 이동하는 모든 위치에서 자동으로 리소스를 획득하게 됩니다. 명확성을 위해 명시적 포함을 위해 취득을 사용하십시오. 마찬가지로 `exists()` 함수에는 `acquires()` 함수가 필요하지 않습니다.

참고: 자신의 모듈에 정의된 구조체에서 모든 계정의 모듈 내 전역(`global`)을 빌릴 수 있습니다. 모듈 외부에서 전역을 빌릴 수 없습니다.

## move_to

그런 다음 `move_to` 함수를 서명자 및 계정에 대한 참조와 함께 사용하여 구조체를 계정으로 이동할 수 있습니다. 그 과정에서 우리는 가치가 있는 코인의 새로운 인스턴스를 생성합니다.
You may then use the `move_to` function along with a reference to signer and account to move the struct into an account. In the process, we create a new instance of coin with value.

## Initialization

`init_module`은 모듈이 배포될 때 자동으로 호출되고 실행됩니다.
The `init_module` automatically gets called and run when the module is published:

```shell
    fun init_module(resource_account: &signer) {
        let resource_signer_cap = resource_account::retrieve_resource_account_cap(resource_account, @source_addr);
        let resource_signer = account::create_signer_with_capability(&resource_signer_cap);
```

`mint_nft_ticket()` 함수는 콜렉션을 가져오고 토큰을 생성합니다.
The `mint_nft_ticket()` function gets a collection and creates a token.

TokenData ID의 결과로, 함수는 모듈의 리소스 서명자를 사용하여 토큰을 NFT 수신자에 `mint`합니다.

For example:

```shell
    public entry fun mint_nft(receiver: &signer) acquires ModuleData {
        let receiver_addr = signer::address_of(receiver);
```

## Signing

모든 `entry fun`은 `&signer` 유형을 첫 번째 매개변수로 사용합니다. Move와 Aptos 모두 트랜잭션을 제출할 때마다 트랜잭션에 서명하는 개인 키가 자동으로 연결된 계정을 서명자의 첫 번째 매개변수로 만듭니다.

서명자에서 주소로 이동할 수 있지만 일반적으로 그 반대는 아닙니다. 따라서 NFT를 청구할 때 아래 지침과 같이 생성자와 수신자의 개인 키가 모두 필요합니다.

`init_module`에서 서명자는 항상 계약을 업로드하는 계정입니다. 이것은 다음과 결합됩니다.

```move
        token::create_collection(&resource_signer, collection, description, collection_uri, maximum_supply, mutate_setting);

```

Then:

```move
        signer_cap: account::SignerCapability,
```

서명자 기능을 사용하면 모듈이 자율적으로 서명할 수 있습니다. 자원 계정은 누구도 개인 키를 가져오지 못하도록 하며 전적으로 계약에 의해 제어됩니다.

## Module data

그런 다음 'ModuleData'가 초기화되고 서명자 기능이 있는 리소스 계정으로 `_moved_`됩니다.

```shell
        move_to(resource_account, ModuleData {
```

`mint_nft_ticket()` 함수에서 첫 번째 단계는 `ModuleData` 구조체를 차용하는 것입니다.

```shell
        let module_data = borrow_global_mut<ModuleData>(@mint_nft);
```

그런 다음 `ModuleData` 구조체의 서명자 기능에 대한 참조를 사용하여 `resource_signer`를 만듭니다.

```shell
        let resource_signer = account::create_signer_with_capability(&module_data.signer_cap);
```

이러한 방식으로 모듈에 이미 저장된 서명자 기능을 나중에 사용할 수 있습니다. 모듈과 해당 구조를 계정으로 이동하면 해당 계정과 연결된 Aptos Explorer에 표시됩니다.

## Accounts

예를 들어 NFT를 발행할 때 NFT는 계정 주소에 저장됩니다. 트랜잭션을 제출하면 트랜잭션에 서명합니다. `aptos init`를 실행하는 위치(아래)와 관련된 `.aptos/config.yaml`에서 계정 구성 정보를 찾으십시오.

리소스 계정을 사용하면 트랜잭션 서명을 위임할 수 있습니다. 리소스 계정을 생성하여 동일한 계정의 새 리소스에 저장할 수 있고 자율적으로 트랜잭션에 서명할 수 있는 서명자 기능을 부여합니다. 아무도 자원 계정의 개인 키에 액세스할 수 없으므로 서명자 기능이 보호됩니다.
