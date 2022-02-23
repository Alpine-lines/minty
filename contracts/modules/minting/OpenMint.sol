//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

abstract contract OpenMint {
    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;

    /**
        @dev Returns the total tokens minted so far.
        1 is always subtracted from the Counter since it tracks the next available tokenId.
    */
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function mintToken() public virtual returns (uint256) {
        _tokenIds.increment();
        uint256 _id = _tokenIds.current();

        return _id;
    }
}