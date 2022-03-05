require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");

const secrets = require("./.secrets.json");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: "0.8.3",
    defaultNetwork: "matic",
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
            // gas: 3950000,
            // gasPrice: 8000000000,
            // gasMultiplier: 1.1,
        },
    },
};
