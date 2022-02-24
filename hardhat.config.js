require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("dotenv");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  defaultNetwork: "localhost",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://localhost:8545/",
    },
    // mumbai: {
    //   url: "https://rpc-mumbai.maticvigil.com",
    //   accounts: [process.env.PRIVATE_KEY],
    // },
    // matic: {
    //   url: "wss://rpc-mainnet.matic.network",
    //   accounts: [process.env.PRIVATE_KEY],
    // },
  },
};
