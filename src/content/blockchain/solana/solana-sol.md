---
public: true
title: Solana (SOL)
date: '2025-12-27'
category: Blockchain
tags: []
excerpt: "Solana (SOL)\n\n<aside>\n\U0001F4A1 Cheatsheet of SOL for web3 developers.\n\n</aside>\n\n 요약\n\n1. 중앙화를 벗어나지 못함. 재단에서 네트워크를 껐다 켰다 할 수 있음\n2. 노드가 엄청 잘 죽음 (올해만 몇 번 중지..."
---
# Solana (SOL)

<aside>
💡 Cheatsheet of SOL for web3 developers.

</aside>

# 요약

1. 중앙화를 벗어나지 못함. 재단에서 네트워크를 껐다 켰다 할 수 있음
2. 노드가 엄청 잘 죽음 (올해만 몇 번 중지되었는지..)
3. 솔라나와 솔라나 프로그램(컨트랙트) 개발언어가 통일되어 있다는게 매우 매력포인트
4. 재단에서 제공하는 툴들이 너무 환상적임. 아이디어만 있다면 대충 시작할 수 있을 정도
5. 이것도 mempool이 없음

# How to create and manage address or account?

### Using Private Key

```jsx
const account = Keypair.generate()
console.log(JSON.stringify(account.publicKey.toBase58()))
// output: "gVazpxjimX3EP4mto53pEi4YSE36KP2nDwyEvLcKjmR"
```

### Using Mnemonic

```jsx
const mnemonic =
	'pill tomorrow foster begin walnut borrow virtual kick shift mutual shoe scatter'
const seed = bip39.mnemonicToSeedSync(mnemonic, '') // (mnemonic, password)

// BIP39
const keypair = Keypair.fromSeed(seed.slice(0, 32))

// BIP44
for (let i = 0; i < 10; i++) {
	const path = `m/44'/501'/${i}'/0'`
	const keypair = Keypair.fromSeed(derivePath(path, seed.toString('hex')).key)
	console.log(`${path} => ${keypair.publicKey.toBase58()}`)
}

// Check if a given public key has an associated private key
const key = new PublicKey('5oNDL3swdJJF1g9DzJiZ4ynHXgszjAEpUkxVYejchzrY')
console.log(PublicKey.isOnCurve(key.toBytes()))
```

# How to sign and verify messages with wallets

```jsx
const message = "The quick brown fox jumps over the lazy dog";
const messageBytes = decodeUTF8(message);

const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
const result = nacl.sign.detached.verify(
  messageBytes,
  signature,
  keypair.publicKey.toBytes()
);

console.log(result);

-------------------------------------------------------------------------------

{
  let recoverTx = Transaction.populate(Message.from(realDataNeedToSign));
  recoverTx.addSignature(feePayer.publicKey, Buffer.from(feePayerSignature));
  recoverTx.addSignature(alice.publicKey, Buffer.from(aliceSignature));

  console.log(
    `txhash: ${await connection.sendRawTransaction(recoverTx.serialize())}`
  );
}

-------------------------------------------------------------------------------

{
  let recoverTx = Transaction.populate(Message.from(realDataNeedToSign), [
    bs58.encode(feePayerSignature),
    bs58.encode(aliceSignature),
  ]);
  console.log(
    `txhash: ${await connection.sendRawTransaction(recoverTx.serialize())}`
  );
}
```

# How to query balance of address on blockchain?

# How to query transaction?

# How to add a memo to a tx?

```jsx
const transferTransaction = new Transaction().add(
	SystemProgram.transfer({
		fromPubkey: fromKeypair.publicKey,
		toPubkey: toKeypair.publicKey,
		lamports: lamportsToSend,
	}),
)

await transferTransaction.add(
	new TransactionInstruction({
		keys: [
			{ pubkey: fromKeypair.publicKey, isSigner: true, isWritable: true },
		],
		data: Buffer.from('Data to send in transaction', 'utf-8'),
		programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
	}),
)

await sendAndConfirmTransaction(connection, transferTransaction, [fromKeypair])
```

# How to estimate fee?

```jsx
getEstimatedFee
const recentBlockhash = await connection.getLatestBlockhash()
const transaction = new Transaction({
	recentBlockhash: recentBlockhash.blockhash,
}).add(
	SystemProgram.transfer({
		fromPubkey: payer.publicKey,
		toPubkey: payee.publicKey,
		lamports: 10,
	}),
)

const fees = await transaction.getEstimatedFee(connection)
console.log(`Estimated SOL transfer cost: ${fees} lamports`)
// Estimated SOL transfer cost: 5000 lamports

// getFeeForMessage
const message = new Message(messageParams)

const fees = await connection.getFeeForMessage(message)
console.log(`Estimated SOL transfer cost: ${fees.value} lamports`)
// Estimated SOL transfer cost: 5000 lamports
```

# How to Transfer tokens one to another?

```jsx
// Send SOL
const transferTransaction = new Transaction().add(
	SystemProgram.transfer({
		fromPubkey: fromKeypair.publicKey,
		toPubkey: toKeypair.publicKey,
		lamports: lamportsToSend,
	}),
)

await sendAndConfirmTransaction(connection, transferTransaction, [fromKeypair])

// Send SPL Token
// Add token transfer instructions to transaction
const transaction = new web3.Transaction().add(
	splToken.Token.createTransferInstruction(
		splToken.TOKEN_PROGRAM_ID,
		fromTokenAccount.address,
		toTokenAccount.address,
		fromWallet.publicKey,
		[],
		1,
	),
)

// Sign transaction, broadcast, and confirm
await web3.sendAndConfirmTransaction(connection, transaction, [fromWallet])
```

---

## Build Frontend and deploy contract to Solana devnet

I using rust, anchor to develop smart contract. All I have to do is initializing some struct, and add methods in main program module. It’s quite easy to understand, and I think it’s simillar with creating and using gRPC.

![](./solanademo.png)
Screenshot of Demo project (thx to https://buildspace.so)
