//SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

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
    uint256 private MAX_SUPPLY;

    mapping(uint256 => string) private _tokenURIs;

    constructor(
        string memory _name, 
        string memory _symbol, 
        string memory _contractURI, 
        uint256 _maxSupply,
        address _proxyRegistryAddress
    ) ERC721(_name, _symbol) {
        console.log(_name, _symbol, _proxyRegistryAddress, _contractURI);
        proxyRegistryAddress = _proxyRegistryAddress;
        CONTRACT_URI = _contractURI;
        MAX_SUPPLY = _maxSupply;
        _initializeEIP712(_name);
    }

    event PermanentURI(string _value, uint256 indexed _id); 
    
    function totalSupply() public view returns (uint256) {
        console.log(_tokenIds.current());
        return _tokenIds.current();
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) private {
        console.log(tokenId, _tokenURI);
        _tokenURIs[tokenId] = _tokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        console.log(_tokenURIs[tokenId]);
        return _tokenURIs[tokenId];
    }

    function contractURI() public view returns (string memory) {
        console.log(1);
        console.log(CONTRACT_URI);
        return CONTRACT_URI;
    }

    function mintToken(address _to, string memory metadataURI)
        public
        onlyOwner 
    returns (uint256)
    {
        require(_tokenIds.current() < MAX_SUPPLY, "Maximum token supply already met!");
        _tokenIds.increment();
        uint256 id = _tokenIds.current();

        _safeMint(_to, id);

        _setTokenURI(id, metadataURI);
        emit PermanentURI(metadataURI, id); 
        
        return id;
    }

    /**
   * Override isApprovedForAll to auto-approve OS's proxy contract
   */
    function isApprovedForAll(
        address _owner,
        address _operator
    ) public override view returns (bool isOperator) {
      // if OpenSea's ERC721 Proxy Address is detected, auto-return true
        if (_operator == address(0x58807baD0B376efc12F5AD86aAc70E78ed67deaE)) {
            return true;
        }
        
        // otherwise, use the default ERC721.isApprovedForAll()
        return ERC721.isApprovedForAll(_owner, _operator);
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
