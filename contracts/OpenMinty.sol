// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Open721.sol";

/**
 * @title Creature
 * Creature - a contract for my non-fungible creatures.
 */
contract Creature is Open721 {
    constructor(
        string memory _name, 
        string memory _symbol, 
        string memory _contractURI, 
        address _proxyRegistryAddress
    )
        Open721(_name, _symbol, _contractURI, _proxyRegistryAddress)
    {}
}