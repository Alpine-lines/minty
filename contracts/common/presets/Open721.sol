//SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
// import "@openzeppelin/contracts/utils/Strings.sol";
import "../meta-transactions/ContentMixin.sol";
import "../meta-transactions/NativeMetaTransaction.sol";

contract OwnableDelegateProxy {}

/**
 * Used to delegate ownership of a contract to another address, to save on unneeded transactions to approve contract use for users
 */
contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

abstract contract Open721 is ContextMixin, NativeMetaTransaction, Ownable, ERC721 {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    address proxyRegistryAddress;

    string private CONTRACT_URI;
    string private BASE_TOKEN_URI;
    uint256 private MAX_SUPPLY;

    mapping(uint256 => string) private _tokenURIs;

    constructor(
        string memory _name, 
        string memory _symbol, 
        string memory _contractURI,
        uint256 _maxSupply,
        address _proxyRegistryAddress
    ) 
        ERC721(_name, _symbol)
    {
        proxyRegistryAddress = _proxyRegistryAddress;
        CONTRACT_URI = _contractURI;
        MAX_SUPPLY = _maxSupply;
        _initializeEIP712(_name);
    }

    function contractURI() public view returns (string memory) {
        return CONTRACT_URI;
    }

    // function tokenURI(uint tokenId) public view override returns (string memory) {
    //     return _tokenURIs[tokenId];
    // }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function maxSupply() public view returns (uint256) {
        return MAX_SUPPLY;
    }

    // function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyOwner {
    //     _setTokenURI(tokenId, _tokenURI);
    // }

    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        MAX_SUPPLY = _maxSupply;
    }

    function mintToken(address _to)
        public
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 id = _tokenIds.current();

        _safeMint(_to, id);

        // _setTokenURI(id, metadataURI);

        return id;
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }


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

    function _baseURI() internal view override returns (string memory) {
        return BASE_TOKEN_URI;
    }

    // function _setTokenURI(uint tokenId, string memory _tokenURI) public {
        // _tokenURIs[tokenId] = _tokenURI;
    // }

    function _msgSender()
        internal
        override
        view
        returns (address sender)
    {
        return ContextMixin.msgSender();
    }
}
