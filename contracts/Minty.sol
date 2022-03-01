//SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./modules/minting/OpenMint.sol";
import "./modules/uri/TokenURI.sol";
import "./modules/uri/ContractURI.sol";

contract Minty is ERC721, OpenMint, ContractURI, TokenURI {
    constructor(string memory tokenName, string memory symbol, string memory _contractURI) 
        ERC721(tokenName, symbol) 
        ContractURI(_contractURI) 
    { }

    function tokenURI(uint256 _id) public view override(ERC721, TokenURI) returns (string memory) {}

    function mintToken(address to, string memory metadataURI)
        public
        returns (uint256)
    {
        uint256 id = super.mintToken();
        _safeMint(to, id);

        _setTokenURI(id, metadataURI);

        return id;
    }
}