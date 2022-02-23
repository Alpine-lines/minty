//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

abstract contract PermanentTokenURI is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event PermanentURI(string _value, uint256 indexed _id); 
    
    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual override {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
        emit PermanentURI(_tokenURI, tokenId); 
    }

    function tokenURI(uint _id) public view virtual override(ERC721URIStorage) returns (string memory) {
        return _tokenURIs[_id];
    }

    /** 
     * @dev Make _burn implementation of ERC721URIStorage impossible to call.
     */
    function _burn(uint _id) internal pure virtual override {
        require(_id == 99999999999999999999, "NO BURNING"); // Always reverts
    }
}