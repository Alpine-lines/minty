require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
const secrets = require("./.secrets.json");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: "0.8.3",
    defaultNetwork: "matic",
    networks: {
        hardhat: {},
        // localhost: {
        //     url: "http://localhost:8545/",
        // },
        // mumbai: {
        //     url: "https://rpc-mumbai.maticvigil.com",
        //     accounts: [
        //     ],
        // },
        matic: {
            url: "https://polygon-rpc.com/",
            accounts: [secrets.privateKey],
        },
    },
};
