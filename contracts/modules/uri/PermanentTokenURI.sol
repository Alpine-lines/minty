//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

abstract contract PermanentTokenURI {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(uint256 => string) private _tokenURIs;

    event PermanentURI(string _value, uint256 indexed _id); 
    
    function __setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
        emit PermanentURI(_tokenURI, tokenId); 
    }

    function tokenURI(uint _id) public view returns (string memory) {
        return _tokenURIs[_id];
    }
}