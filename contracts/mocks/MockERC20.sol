// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
  function balanceOf(address owner) external view returns (uint256);

  function allowance(address owner, address spender) external view returns (uint256);

  function transfer(address to, uint256 value) external returns (bool);

  function transferFrom(
    address from,
    address to,
    uint256 value
  ) external returns (bool);

  function approve(address spender, uint256 value) external returns (bool);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @notice ERC-20 contract with a `mint` function to create new tokens. Used for testing purposes only.
 */
contract MockERC20 is IERC20 {
  mapping(address => uint256) private balances;
  mapping(address => mapping(address => uint256)) private allowances;

  function balanceOf(address owner) external view override returns (uint256) {
    return balances[owner];
  }

  function allowance(address owner, address spender) external view override returns (uint256) {
    return allowances[owner][spender];
  }

  function transfer(address to, uint256 value) external override returns (bool success) {
    require(balances[msg.sender] >= value, "Insufficient balance");

    balances[msg.sender] -= value;
    balances[to] += value;

    emit Transfer(msg.sender, to, value);
    return true;
  }

  function transferFrom(
    address from,
    address to,
    uint256 value
  ) external override returns (bool success) {
    require(balances[from] >= value, "Insufficient balance");
    require(allowances[from][msg.sender] >= value, "Insufficient allowance");

    balances[from] -= value;
    balances[to] += value;
    allowances[from][msg.sender] -= value;

    emit Transfer(from, to, value);
    return true;
  }

  function approve(address spender, uint256 value) external override returns (bool) {
    allowances[msg.sender][spender] = value;

    emit Approval(msg.sender, spender, value);
    return true;
  }

  function mint(uint256 value) external returns (bool) {
    balances[msg.sender] += value;

    emit Transfer(address(0), msg.sender, value);
    return true;
  }
}
