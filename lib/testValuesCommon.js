const { ethers } = require("hardhat");

/* Useful aliases */

const URI_BASE = "https://creatures-api.opensea.io/api/{id}";
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const MAX_UINT256 =
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
const MAX_UINT256_BN = ethers.BigNumber.from(MAX_UINT256);

module.exports = {
    URI_BASE,
    ADDRESS_ZERO,
    MAX_UINT256,
    MAX_UINT256_BN,
};
