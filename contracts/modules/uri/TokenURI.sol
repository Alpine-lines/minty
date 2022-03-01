//SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

abstract contract TokenURI is ERC721 {
    using Strings for uint256;

    string private BASE_URI;
    
    // Optional mapping for token URIs
    mapping(uint256 => string) internal _tokenURIs;

    constructor() {}

    function _setBaseURI(string memory _baseURI) internal virtual {
        BASE_URI = _baseURI;
    }

    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    
    function baseURI() public view virtual returns (string memory) {
        return BASE_URI;
    }

    function tokenURI(uint256 _tokenId) virtual override public view returns (string memory) {
        return string(abi.encodePacked(baseURI(), Strings.toString(_tokenId)));
    }
}