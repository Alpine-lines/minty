//SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

abstract contract ContractURI {
    string private CONTRACT_URI;

    constructor(string memory _contractURI) {
        CONTRACT_URI = _contractURI;
    }
    
    function contractURI() virtual public view returns (string memory) {
        return CONTRACT_URI;
    }
}