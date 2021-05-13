# EIP-3074 (Batch) Transaction Invoker

An [EIP-3074](EIP-3074) based contract that can send one or more arbitrary transactions in the context of an Externally
Owned Address (EOA), by using `AUTH` and `AUTHCALL`. The contract currently uses EIP-712-based messages for
authentication.

This contract is a proof of concept, and is **NOT** audited. It's not recommended to use this in production
environments.

## Getting started

The contract is deployed on the [Puxi testnet](https://github.com/quilt/puxi) at 0x17C1244D6bBFD6cF5798035505cBdA305d388Bc1. Manually deploying this contract requires a custom version of Solidity, which you can find here: https://github.com/quilt/solidity/tree/eip-3074. Alternatively, you can use [this forked version of Remix](https://remix.puxi.quilt.link/) to compile and deploy the contract.

### Signing a transaction

The contract currently uses EIP-712-based messages. You can use the following typed data object for creating the
messages:

```json
{
  "types": {
    "EIP712Domain": [
      { "name": "name", "type": "string" },
      { "name": "version", "type": "string" },
      { "name": "chainId", "type": "uint256" },
      { "name": "verifyingContract", "type": "address" }
    ],
    "Transaction": [
      { "name": "nonce", "type": "uint256" },
      { "name": "payload", "type": "TransactionPayload[]" }
    ],
    "TransactionPayload": [
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" },
      { "name": "gasLimit", "type": "uint256" },
      { "name": "data", "type": "bytes" }
    ]
  },
  "primaryType": "Transaction",
  "domain": {
    "name": "Transaction Invoker",
    "version": "0.1.0",
    "chainId": 224525,
    "verifyingContract": "0x17C1244D6bBFD6cF5798035505cBdA305d388Bc1"
  },
  "message": {
    "nonce": 0,
    "payload": [
      {
        "to": "0xeb2bdABFE67489072c01D3b51Ad0596974926dE7",
        "value": 0,
        "gasLimit": 200000,
        "data": "0xa9059cbb000000000000000000000000fffd6973e250e3db5471ede26c9f0ca7f8f708170000000000000000000000000000000000000000000000000000000000000001"
      }
    ]
  }
}
```

Simply replace the values in `message` with the actual values. If you're using your own version of the contract, make sure to also replace the values in the `domain` section.

You can use the script in `scripts/sign.ts` to sign a message using a private key:

```
yarn sign PRIVATE_KEY
```
