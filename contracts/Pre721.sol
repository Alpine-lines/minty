//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
// import "@openzeppelin/contracts/utils/Strings.sol";
import "./modules/common/meta-transactions/ContentMixin.sol";
import "./modules/common/meta-transactions/NativeMetaTransaction.sol";

contract OwnableDelegateProxy {}

/**
 * Used to delegate ownership of a contract to another address, to save on unneeded transactions to approve contract use for users
 */
contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

abstract contract Pre721 is ERC721, ContextMixin, NativeMetaTransaction, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address proxyRegistryAddress;
    string private CONTRACT_URI;

    mapping(uint256 => string) private _tokenURIs;

    constructor(
        string memory _name, 
        string memory _symbol, 
        string memory _contractURI, 
        address _proxyRegistryAddress
    ) ERC721(_name, _symbol) {
        proxyRegistryAddress = _proxyRegistryAddress;
        CONTRACT_URI = _contractURI;
        _initializeEIP712(_name);
    }

    event PermanentURI(string _value, uint256 indexed _id); 
    
    function totalSupply() public view returns (uint256) {
        console.log(_tokenIds.current());
        return _tokenIds.current();
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) private {
        _tokenURIs[tokenId] = _tokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        console.log(_tokenURIs[tokenId]);
        return _tokenURIs[tokenId];
    }

    function contractURI() public view returns (string memory) {
        console.log(CONTRACT_URI);
        return CONTRACT_URI;
    }

    function mintToken(string memory metadataURI)
    public
    onlyOwner 
    returns (uint256)
    {
        _tokenIds.increment();
        uint256 id = _tokenIds.current();

        _safeMint(_msgSender(), id);

        _setTokenURI(id, metadataURI);
        emit PermanentURI(metadataURI, id); 

        return id;
    }

    /**
     * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(address owner, address operator)
        override
        public
        view
        returns (bool)
    {
        // Whitelist OpenSea proxy contract for easy trading.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (address(proxyRegistry.proxies(owner)) == operator) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

    /**
     * This is used instead of msg.sender as transactions won't be sent by the original token owner, but by OpenSea.
     */
    function _msgSender()
        internal
        override
        view
        returns (address sender)
    {
        return ContextMixin.msgSender();
    }
}
