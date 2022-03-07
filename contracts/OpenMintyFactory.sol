// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./common/interfaces/IFactoryERC721.sol";
import "./OpenMinty.sol";
import "./OpenMintyBundle.sol";

contract OpenMintyFactory is FactoryERC721, Ownable {
    using Strings for string;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    address public proxyRegistryAddress;
    address public nftAddress;
    address public bundleNftAddress;
    string public baseURI;

    /*
     * Enforce the existence of only 100 NFTs.
     */
    uint256 CREATURE_SUPPLY = 100;

    /*
     * Three different options for minting OpenMintys (basic, premium, and gold).
     */
    uint256 NUM_OPTIONS;
    uint256 SINGLE_CREATURE_OPTION = 0;
    uint256 MULTIPLE_CREATURE_OPTION = 1;
    uint256 LOOTBOX_OPTION = 2;
    uint256 NUM_CREATURES_IN_MULTIPLE_CREATURE_OPTION = 4;

    constructor(address _proxyRegistryAddress, address _nftAddress, string memory _baseURI, uint256 _maxSupply, uint256 _numOptions) {
        console.log(_numOptions);
        // require(_numOptions > 1 && _numOptions < 3);
        proxyRegistryAddress = _proxyRegistryAddress;
        nftAddress = _nftAddress;
        baseURI = _baseURI;
        NUM_OPTIONS = _numOptions;
        bundleNftAddress = address(
            new OpenMintyBundle(_proxyRegistryAddress, address(this), _nftAddress, _maxSupply, _numOptions)
        );

        fireTransferEvents(address(0), owner());
    }

    function name() override external pure returns (string memory) {
        return "OpenMinty Item Sale";
    }

    function symbol() override external pure returns (string memory) {
        return "OMS";
    }

    function supportsFactoryInterface() override public pure returns (bool) {
        return true;
    }

    function numOptions() override public view returns (uint256) {
        return NUM_OPTIONS;
    }

    function transferOwnership(address newOwner) override public onlyOwner {
        address _prevOwner = owner();
        super.transferOwnership(newOwner);
        fireTransferEvents(_prevOwner, newOwner);
    }

    function fireTransferEvents(address _from, address _to) private {
        for (uint256 i = 0; i < NUM_OPTIONS; i++) {
            emit Transfer(_from, _to, i);
        }
    }

    // TODO: Randomize minted tokens for multi-token option
    function mint(uint256 _optionId, address _toAddress) override public {
        // Must be sent from the owner proxy or owner.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        assert(
            address(proxyRegistry.proxies(owner())) == _msgSender() ||
                owner() == _msgSender() ||
                _msgSender() == bundleNftAddress
        );
        require(canMint(_optionId));

        OpenMinty openMinty = OpenMinty(nftAddress);
        if (_optionId == SINGLE_CREATURE_OPTION) {
            openMinty.mintToken(_toAddress);
        } else if (_optionId == MULTIPLE_CREATURE_OPTION) {
            for (
                uint256 i = 0;
                i < NUM_CREATURES_IN_MULTIPLE_CREATURE_OPTION;
                i++
            ) {
                openMinty.mintToken(_toAddress);
            }
        } else if (_optionId == LOOTBOX_OPTION) {
            OpenMintyBundle openMintyBundle = OpenMintyBundle(
                bundleNftAddress
            );
            openMintyBundle.mintToken(_toAddress);
        }
    }

    function canMint(uint256 _optionId) override public view returns (bool) {
        if (_optionId >= NUM_OPTIONS) {
            return false;
        }

        OpenMinty openMinty = OpenMinty(nftAddress);
        uint256 nftSupply = openMinty.totalSupply();

        uint256 numItemsAllocated = 0;
        if (_optionId == SINGLE_CREATURE_OPTION) {
            numItemsAllocated = 1;
        } else if (_optionId == MULTIPLE_CREATURE_OPTION) {
            numItemsAllocated = NUM_CREATURES_IN_MULTIPLE_CREATURE_OPTION;
        } else if (_optionId == LOOTBOX_OPTION) {
            OpenMintyBundle openMintyBundle = OpenMintyBundle(
                bundleNftAddress
            );
            numItemsAllocated = openMintyBundle.itemsPerBundle();
        }
        return nftSupply < (CREATURE_SUPPLY - numItemsAllocated);
    }

    function tokenURI(uint256 _optionId) override external view returns (string memory) {
        return string(abi.encodePacked(baseURI, Strings.toString(_optionId)));
    }

    /**
     * Hack to get things to work automatically on OpenSea.
     * Use transferFrom so the frontend doesn't have to worry about different method names.
     */
    function transferFrom(
        address,
        address _to,
        uint256 _tokenId
    ) public {
        mint(_tokenId, _to);
    }

    /**
     * Hack to get things to work automatically on OpenSea.
     * Use isApprovedForAll so the frontend doesn't have to worry about different method names.
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        returns (bool)
    {
        if (owner() == _owner && _owner == _operator) {
            return true;
        }

        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (
            owner() == _owner &&
            address(proxyRegistry.proxies(_owner)) == _operator
        ) {
            return true;
        }

        return false;
    }

    /**
     * Hack to get things to work automatically on OpenSea.
     * Use isApprovedForAll so the frontend doesn't have to worry about different method names.
     */
    function ownerOf(uint256) public view returns (address _owner) {
        return owner();
    }
}