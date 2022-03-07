// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./common/presets/Open721.sol";
import "./OpenMinty.sol";
import "./common/interfaces/IFactoryERC721.sol";

/**
 * @title OpenMintyBundle
 *
 * OpenMintyBundle - a tradeable loot box of OpenMintys.
 */
contract OpenMintyBundle is Open721 {
    uint256 NUM_TOKENS_PER_BOX = 3;
    uint256 OPTION_ID = 0;
    uint256 NUM_OPTIONS;

    address factoryAddress;
    address nftAddress;

    constructor(address _proxyRegistryAddress, address _factoryAddress, address _nftAddress, uint256 _maxSupply, uint256  _numOptions)
        Open721("OpenMintyBundle", "OMB", "https://example.com", _maxSupply, _proxyRegistryAddress)
    {
        factoryAddress = _factoryAddress;
        nftAddress = _nftAddress;
        NUM_OPTIONS = _numOptions;
    }

    // TODO: Randomize minted tokens
    function unpack(uint256 _tokenId) public {
        OpenMinty openMinty = OpenMinty(nftAddress);
        require(_tokenId + openMinty.totalSupply() < openMinty.maxSupply());
        require(_tokenId < NUM_OPTIONS); // TODO: set number of options in constructor

        // TODO: Insert custom logic for configuring the item here. (RANDOMIZE)
        for (uint256 i = 0; i < NUM_TOKENS_PER_BOX; i++) {
            // Mint the ERC721 item(s).
            FactoryERC721 factory = FactoryERC721(factoryAddress);
            factory.mint(OPTION_ID, _msgSender());
        }
    }

    function baseTokenURI() public view returns (string memory) {
        return Open721._baseURI();
    }

    function itemsPerBundle() public view returns (uint256) {
        return NUM_TOKENS_PER_BOX;
    }
}