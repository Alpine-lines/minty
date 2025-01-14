require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
// const { ethers } = require("hardhat");
// import { Network } from "@ethersproject/networks";

const secrets = require("./.secrets.json");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: "0.8.4",
    defaultNetwork: "localhost",
    networks: {
        hardhat: {},
        localhost: {
            url: "http://localhost:8545/",
        },
        mumbai: {
            url: "https://rpc-mumbai.maticvigil.com",
            accounts: [secrets.privateKey],
        },
        matic: {
            url: "https://polygon-rpc.com/",
            accounts: [secrets.privateKey],
            gasPrice: 8000000000, // default is 'auto' which breaks chains without the london hardfork
            // gas: 3950000,
            // gasPrice: 8000000000,
            // gasMultiplier: 1.1,
        },
    },
};
