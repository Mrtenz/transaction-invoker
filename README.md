# EIP-3074 (Batch) Transaction Invoker

An [EIP-3074](EIP-3074) based contract that can send one or more arbitrary transactions in the context of an Externally
Owned Address (EOA), by using `AUTH` and `AUTHCALL`. The contract currently uses EIP-712-based messages for
authentication.

This contract is a proof of concept, and is **NOT** audited. It's not recommended to use this in production
environments.

## Getting started

The contract is deployed on the [Puxi testnet](https://github.com/quilt/puxi) at
0x17C1244D6bBFD6cF5798035505cBdA305d388Bc1. Manually deploying this contract requires a custom version of Solidity,
which you can find here: https://github.com/quilt/solidity/tree/eip-3074. Alternatively, you can
use [this forked version of Remix](https://remix.puxi.quilt.link/) to compile and deploy the contract, or use the
compiler that is included in this repo to compile it with Hardhat:

```
$ yarn hardhat compile
```

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

Simply replace the values in `message` with the actual values. If you're using your own version of the contract, make
sure to also replace the values in the `domain` section.

You can use the script in `scripts/sign.ts` to sign a message using a private key. It uses the typed message
in `scripts/data/message.json`. If you want to integrate this into your own UI, you can use
[my EIP-712 library](https://github.com/Mrtenz/eip-712) for constructing compatible messages.

```bash
$ yarn sign PRIVATE_KEY
```

### Using the contract

The contract has an `invoke` function which takes a `Signature` and `Transaction`. `Signature` is a struct that has the
signature `r`, `s`, and `v` values (note that the `v` should be either 0 or 1). `Transaction` is a struct with the
following values:

* nonce (`uint256`) - The nonce of the transaction. You can get the expected value by reading `nonces` in the contract.
  It should increase by one for every transaction.
* payload (`TransactionPayload[]`) - The transactions to send.

`TransactionPayload` looks like this:

* to (`address`) - The address to send the transaction to.
* value (`uint256`) - The amount of Ether to send. Note that in order to send Ether, you have to include it in the call
  to the invoker contract. `AUTHCALL` is currently not able to send Ether from an authenticated address.
* gasLimit (`uint256`) - The maximum units of gas the transaction can use.
* data (`bytes`) - The data to send to the contract.

If you are using the signing tool in `scripts/sign.ts`, it will generate Remix-compatible output based on the typed
message. You can simply copy and paste the signature and transaction from there.

## Automated testing

There are some automated tests for the contract in `tests`, which you can run using `yarn test`. Note that this requires 
Geth being available globally (e.g., in `/usr/bin`), which includes support for EIP-3074. The test script will spin up a
private Geth network temporarily, run the tests, and remove the temporary network again.

```
$ yarn test
```

---

## Contract ABI

The contract ABI for the invoker contract:

```json
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "DOMAIN_SEPARATOR",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "EIP712DOMAIN_TYPE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TRANSACTION_PAYLOAD_TYPE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TRANSACTION_TYPE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "r",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "s",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "v",
            "type": "bool"
          }
        ],
        "internalType": "struct TransactionInvoker.Signature",
        "name": "signature",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
          },
          {
            "components": [
              {
                "internalType": "address",
                "name": "to",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "gasLimit",
                "type": "uint256"
              },
              {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
              }
            ],
            "internalType": "struct TransactionInvoker.TransactionPayload[]",
            "name": "payload",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct TransactionInvoker.Transaction",
        "name": "transaction",
        "type": "tuple"
      }
    ],
    "name": "invoke",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "nonces",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
```
