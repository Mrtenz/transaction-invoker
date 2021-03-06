// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @notice A contract that will always revert transactions. Used for testing purposes only.
 */
contract MockInvalid {
  function foo() external pure {
    revert("Invalid");
  }

  // solhint-disable-next-line payable-fallback
  fallback() external {
    revert("Invalid");
  }
}
