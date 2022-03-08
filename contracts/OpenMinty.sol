// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./common/presets/Open721.sol";

/**
 * @title OpenMinty
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