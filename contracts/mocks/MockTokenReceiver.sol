// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MockERC20.sol";

/**
 * @notice Contract that has a `deposit()` function which will `transferFrom` the specified token. Used for testing
 *  purposes only.
 */
contract MockTokenReceiver {
  mapping(address => uint256) private balance;

  function deposit(address tokenAddress) external {
    IERC20 token = IERC20(tokenAddress);

    uint256 allowance = token.allowance(msg.sender, address(this));
    require(allowance > 0, "Invalid allowance");

    bool success = token.transferFrom(msg.sender, address(this), allowance);
    require(success, "Token transfer failed");

    balance[msg.sender] += allowance;
  }

  function balanceOf(address who) external view returns (uint256) {
    return balance[who];
  }
}
