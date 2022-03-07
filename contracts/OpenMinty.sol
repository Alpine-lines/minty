// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "./common/presets/Open721.sol";

/**
 * @title Creature
 * Creature - a contract for my non-fungible creatures.
 */
contract OpenMinty is Open721 {
    constructor(
        string memory _name, 
        string memory _symbol, 
        string memory _contractURI, 
        uint256 _maxSupply,
        address _proxyRegistryAddress
    )
        Open721(_name, _symbol, _contractURI, _maxSupply, _proxyRegistryAddress)
    {}
}