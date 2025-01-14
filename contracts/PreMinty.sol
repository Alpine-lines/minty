// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./common/presets/Pre721.sol";

/**
 * @title Creature
 * Creature - a contract for my non-fungible creatures.
 */
contract PreMinty is Pre721 {
    constructor(
        string memory _name, 
        string memory _symbol, 
        address[] memory _admins,
        string memory _contractURI, 
        uint256 _maxSupply,
        address _proxyRegistryAddress
    )
        Pre721(_name, _symbol, _admins, _contractURI, _maxSupply, _proxyRegistryAddress)
    {}
}