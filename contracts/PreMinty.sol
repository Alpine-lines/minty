// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Pre721.sol";

/**
 * @title Creature
 * Creature - a contract for my non-fungible creatures.
 */
contract PreMinty is Pre721 {
    constructor(
        string memory _name, 
        string memory _symbol, 
        string memory _contractURI, 
        address _proxyRegistryAddress
    )
        Pre721(_name, _symbol, _contractURI, _proxyRegistryAddress)
    {}
}