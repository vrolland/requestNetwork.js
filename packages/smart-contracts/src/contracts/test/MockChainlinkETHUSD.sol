// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;


contract MockChainlinkETHUSD {
  function latestAnswer() external view returns (int256) {
        // mock of the rate from ETH to USD (18 decimals)
    return 38089012251;
  }
}