//SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// import "hardhat/console.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../meta-transactions/ContentMixin.sol";
import "../meta-transactions/NativeMetaTransaction.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract OwnableDelegateProxy {}

/**
 * Used to delegate ownership of a contract to another address, to save on unneeded transactions to approve contract use for users
 */
contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

abstract contract Pre721 is ContextMixin, NativeMetaTransaction, AccessControl, ERC721 {
    using SafeMath for uint256;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    bytes32 private constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address proxyRegistryAddress;

    string private CONTRACT_URI;
    uint256 private MAX_SUPPLY;

    mapping(uint256 => string) private _tokenURIs;

    constructor(
        string memory _name, 
        string memory _symbol, 
        address[] memory _admins,
        string memory _contractURI, 
        uint256 _maxSupply,
        address _proxyRegistryAddress
    ) ERC721(_name, _symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        
        for (uint256 i = 0; i < _admins.length; ++i) {
            _setupRole(ADMIN_ROLE, _admins[i]);
        }

        CONTRACT_URI = _contractURI;
        MAX_SUPPLY = _maxSupply;

        proxyRegistryAddress = _proxyRegistryAddress;

        _initializeEIP712(_name);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool interfaceSupported) {
        interfaceSupported = super.supportsInterface(interfaceId);
        return interfaceSupported;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
    function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyRole(ADMIN_ROLE) {
        // require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _setTokenURI(tokenId, _tokenURI);
    }

    function setMaxSupply(uint256 _maxSupply) public onlyRole(ADMIN_ROLE) {
        // require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        MAX_SUPPLY = _maxSupply;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist!");
        return _tokenURIs[tokenId];
    }

    function contractURI() public view returns (string memory) {
        return CONTRACT_URI;
    }

    function mintToken(address _to, string memory metadataURI)
        public
        onlyRole(ADMIN_ROLE) 
    returns (uint256)
    {
        // require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        require(_tokenIds.current() < MAX_SUPPLY, "Maximum token supply already met!");
        _tokenIds.increment();
        uint256 id = _tokenIds.current();

        _safeMint(_to, id);

        _setTokenURI(id, metadataURI);
        
        return id;
    }

    function burn(uint256 tokenId) public onlyRole(ADMIN_ROLE) {
        // require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _burn(tokenId);
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

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
    }
    

}
