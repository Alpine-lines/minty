// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";

/**
 * @title AMinty
 */
contract AMinty is ERC721A {

    string public baseTokenURI;
    string public contractURI;
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        string memory _baseTokenURI
    ) ERC721A(_name, _symbol) {
        baseTokenURI = _baseTokenURI;
        contractURI = _contractURI;
    }

    function mint(uint256 quantity) external payable {
        _safeMint(msg.sender, quantity);
    }

    function burn(uint256 _id) external {
        _burn(_id);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

}