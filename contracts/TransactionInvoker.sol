// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
 * @title ERC-3074 (Batch) Transaction Invoker
 * @author Maarten Zuidhoorn <maarten@zuidhoorn.com>
 * @notice An EIP-3074 based contract that can send one or more arbitrary transactions in the context of an Externally
 *  Owned Address (EOA), by using `AUTH` and `AUTHCALL`. See https://github.com/Mrtenz/transaction-invoker for more
 *  information.
 */
contract TransactionInvoker {
  string private constant NAME = "Transaction Invoker";
  string private constant VERSION = "0.1.0";

  // keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
  bytes32 public constant EIP712DOMAIN_TYPE = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;

  // keccak256("Transaction(uint256 nonce,TransactionPayload[] payload)TransactionPayload(address to,uint256 value,uint256 gasLimit,bytes data)")
  bytes32 public constant TRANSACTION_TYPE = 0xe43c8854098b835e471c37ee14db9703a9b3fcf054cbac1fe0b25fcb1bbd8602;

  // keccak256("TransactionPayload(address to,uint256 value,uint256 gasLimit,bytes data)")
  bytes32 public constant TRANSACTION_PAYLOAD_TYPE = 0x7e78c6e5723a05fb86c72eb2f059bbce3bae9ed4ae123fab4e6b377b890618f1;

  bytes32 public immutable DOMAIN_SEPARATOR;

  mapping(address => uint256) public nonces;

  struct Signature {
    uint256 r;
    uint256 s;
    bool v;
  }

  struct Transaction {
    uint256 nonce;
    TransactionPayload[] payload;
  }

  struct TransactionPayload {
    address to;
    uint256 value;
    uint256 gasLimit;
    bytes data;
  }

  constructor() {
    // Since the domain separator depends on the chain ID and contract address, it is dynamically calculated here.
    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        EIP712DOMAIN_TYPE,
        keccak256(abi.encodePacked(NAME)),
        keccak256(abi.encodePacked(VERSION)),
        block.chainid,
        address(this)
      )
    );
  }

  /**
   * @notice Authenticate and send the provided transaction payload(s) in the context of the signer. This function
   *  reverts if the signature is invalid, the nonce is incorrect, or one of the calls failed.
   * @param signature The signature of the transactions to verify.
   * @param transaction The nonce and payload(s) to send.
   */
  function invoke(Signature calldata signature, Transaction calldata transaction) external payable {
    require(transaction.payload.length > 0, "No transaction payload");

    address signer = authenticate(signature, transaction);
    require(signer != address(0), "Invalid signature");
    require(transaction.nonce == nonces[signer], "Invalid nonce");

    nonces[signer] += 1;

    for (uint256 i = 0; i < transaction.payload.length; i++) {
      bool success = call(transaction.payload[i]);
      require(success, "Transaction failed");
    }

    // To ensure that the caller does not send more funds than used in the transaction payload, we check if the contract
    // balance is zero here.
    require(address(this).balance == 0, "Invalid balance");
  }

  /**
   * @notice Authenticate based on the signature and transaction. This will calculate the EIP-712 message hash and use
   *  that as commit for authentication.
   * @param signature The signature to authenticate with.
   * @param transaction The transaction that was signed.
   * @return signer The recovered signer, or `0x0` if the signature is invalid.
   */
  function authenticate(Signature calldata signature, Transaction calldata transaction)
    private
    view
    returns (address signer)
  {
    bytes32 commit = getCommitHash(transaction);

    uint256 r = signature.r;
    uint256 s = signature.s;
    bool v = signature.v;

    // solhint-disable-next-line no-inline-assembly
    assembly {
      signer := auth(commit, v, r, s)
    }
  }

  /**
   * @notice Send an authenticated call to the address provided in the payload.
   * @dev Currently this function does not return the call data.
   * @param payload The payload to send.
   * @return success Whether the call succeeded.
   */
  function call(TransactionPayload calldata payload) private returns (bool success) {
    uint256 gasLimit = payload.gasLimit;
    address to = payload.to;
    uint256 value = payload.value;
    bytes memory data = payload.data;

    // solhint-disable-next-line no-inline-assembly
    assembly {
      success := authcall(gasLimit, to, value, 0, add(data, 0x20), mload(data), 0, 0)
    }
  }

  /**
   * @notice Get the EIP-712 commit hash for a transaction, that can be used for authentication.
   * @param transaction The transaction to hash.
   * @return The commit hash, including the EIP-712 prefix and domain separator.
   */
  function getCommitHash(Transaction calldata transaction) private view returns (bytes32) {
    return keccak256(abi.encodePacked(bytes1(0x19), bytes1(0x01), DOMAIN_SEPARATOR, hash(transaction)));
  }

  /**
   * @notice Get the EIP-712 hash for a transaction.
   * @param transaction The transaction to hash.
   * @return The hashed transaction.
   */
  function hash(Transaction calldata transaction) private pure returns (bytes32) {
    return keccak256(abi.encode(TRANSACTION_TYPE, transaction.nonce, hash(transaction.payload)));
  }

  /**
   * @notice Get the EIP-712 hash for a transaction payload array.
   * @param payload The payload(s) to hash.
   * @return The hashed transaction payloads.
   */
  function hash(TransactionPayload[] calldata payload) private pure returns (bytes32) {
    bytes32[] memory values = new bytes32[](payload.length);
    for (uint256 i = 0; i < payload.length; i++) {
      values[i] = hash(payload[i]);
    }

    return keccak256(abi.encodePacked(values));
  }

  /**
   * @notice Get the EIP-712 hash for a transaction payload array.
   * @param payload The payload to hash.
   * @return The hashed transaction payloads.
   */
  function hash(TransactionPayload calldata payload) private pure returns (bytes32) {
    return
      keccak256(
        abi.encode(TRANSACTION_PAYLOAD_TYPE, payload.to, payload.value, payload.gasLimit, keccak256(payload.data))
      );
  }
}
