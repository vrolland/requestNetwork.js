// SPDX-License-Identifier: MIT

pragma solidity ^0.5.0;

contract MockChainlinkEURUSD {
    function latestAnswer() external view returns (int256) {
        return 117736400;
    }
}
