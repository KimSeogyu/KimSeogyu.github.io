---
public: true
title: Bitcoin Segwit
date: '2025-12-27'
category: Blockchain
tags: [Blockchain]
excerpt: >-
  Bitcoin Segwit


  비트코인에서, 거래는 입력(inputs)과 출력(outputs)을 포함합니다. 트랜잭션이 네트워크로 전송될 때 노드에서 트랜잭션의 유효성을
  검사하여 트랜잭션이 합법적이고 입력이 이중으로 사용되지 않는지 확인해야 합니다. 원래 비트코인 프...
---
# Bitcoin Segwit

비트코인에서, 거래는 입력(inputs)과 출력(outputs)을 포함합니다. 트랜잭션이 네트워크로 전송될 때 노드에서 트랜잭션의 유효성을 검사하여 트랜잭션이 합법적이고 입력이 이중으로 사용되지 않는지 확인해야 합니다. 원래 비트코인 프로토콜에서는 디지털 서명(증인 데이터)이 트랜잭션 입력에 포함되어 트랜잭션이 커지고 네트워크 처리량이 감소했습니다. 이를 해결하기 위해 2017년에 분리 증인(SegWit)이라는 새로운 거래 형식이 도입되었습니다. SegWit는 거래의 입력에서 증인 데이터를 분리하여 증인이라는 거래의 별도 섹션에 배치합니다. SegWit 주소는 SegWit 트랜잭션 형식과 호환되는 비트코인 주소입니다. SegWit 주소로 자금을 보낼 때 자금의 소유권을 증명하는 증인을 거래에 포함시킬 수 있습니다. 감시자와 트랜잭션을 만들려면 SegWit 주소를 트랜잭션의 출력 주소로 사용해야 하며, 트랜잭션에 서명할 때 감시자 데이터를 포함해야 합니다. SegWit 트랜잭션의 script_pubkey에는 자금을 사용할 수 있는 조건을 지정하는 감시 프로그램이 포함되어 있으며, SegWit 주소를 만드는 데 사용됩니다.

```rust
use bitcoin::{
    blockdata::transaction::{Transaction, TxIn, TxOut},
    network::constants::Network,
    util::bip143::{SigHashCache, SigHashType},
    PublicKey,
    Script,
    TxBuilder,
    TxInWitness,
};

fn create_transaction() -> Transaction {
    // Create inputs
    let txin = TxIn {
        previous_output: bitcoin::OutPoint::new(
            bitcoin::hash::Sha256dHash::default(),
            0,
        ),
        script_sig: Script::new(),
        sequence: 0xFFFFFFFF,
        witness: TxInWitness::default(),
    };

    // Create outputs
    let txout = TxOut {
        value: 1000000, // Satoshis
        script_pubkey: Script::new(),
    };

    // Create transaction
    let mut tx_builder = TxBuilder::new();
    let tx = tx_builder
        .add_input(txin)
        .add_output(txout)
        .build()
        .unwrap();

    // Sign transaction
    let key = bitcoin::PrivateKey::from_wif("cTJtmP6oZmnBp9jWsnJzBvTuwT54qfN3rq8WxjZgCCzU6DDHMC6N").unwrap();
    let public_key = PublicKey::from_private_key(&key, true).unwrap();
    let sig_hash = SigHashCache::new(&tx).signature_hash(0, &Script::new(), 1000000, SigHashType::All);
    let signature = key.sign(&sig_hash);
    let mut witness = TxInWitness::default();
    witness.push(signature.serialize_der().to_vec());
    witness.push(public_key.to_bytes());
    tx_builder.set_witness(0, witness);

    tx
}

fn main() {
    let tx = create_transaction();
    println!("{}", tx);
}
```

```toml
[dependencies]
bitcoin = "0.28.1"
secp256k1 = "0.17.0"
hex = "0.4.2"
```

이 예에서는 먼저 하나의 입력과 하나의 출력으로 트랜잭션을 만듭니다. 그런 다음 개인 키를 사용하여 트랜잭션에 서명하고 디지털 서명과 공개 키를 포함하는 증인을 생성합니다. 마지막으로 TxBuilder의 set_witness 메서드를 사용하여 트랜잭션에 대한 감시를 설정하고 트랜잭션을 콘솔에 인쇄합니다.

이 예에서는 트랜잭션에 더미 입력 및 출력을 사용하고 서명에 임의로 생성된 개인 키를 사용했습니다. 실제 응용 프로그램에서는 이 값을 사용 사례의 실제 값으로 대체해야 합니다.
