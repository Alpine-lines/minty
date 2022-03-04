const opensea = require("opensea-js");
const { WyvernSchemaName } = require("opensea-js/lib/types");
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const MnemonicWalletSubprovider =
    require("@0x/subproviders").MnemonicWalletSubprovider;
const RPCSubprovider = require("web3-provider-engine/subproviders/rpc");
const Web3ProviderEngine = require("web3-provider-engine");

const wallet = require("../../.wallet.json");

const MNEMONIC = wallet.MNEMONIC;
const NODE_API_KEY = wallet.NODE_API_KEY || wallet.ALCHEMY_KEY;
const isInfura = !!wallet.isInfura;
const FACTORY_CONTRACT_ADDRESS = wallet.FACTORY_CONTRACT_ADDRESS;
const NFT_CONTRACT_ADDRESS = wallet.NFT_CONTRACT_ADDRESS;
const OWNER_ADDRESS = wallet.OWNER_ADDRESS;
const NETWORK = wallet.NETWORK;
const API_KEY = wallet.API_KEY || ""; // API key is optional but useful if you're doing a high volume of requests.

if (!MNEMONIC || !NODE_API_KEY || !NETWORK || !OWNER_ADDRESS) {
    console.error(
        "Please set a mnemonic, Alchemy/Infura key, owner, network, API key, nft contract, and factory contract address."
    );
    return;
}

if (!FACTORY_CONTRACT_ADDRESS && !NFT_CONTRACT_ADDRESS) {
    console.error("Please either set a factory or NFT contract address.");
    return;
}

const BASE_DERIVATION_PATH = `44'/60'/0'/0`;

const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({
    mnemonic: MNEMONIC,
    baseDerivationPath: BASE_DERIVATION_PATH,
});

const network =
    NETWORK === "mainnet" || NETWORK === "live" ? "mainnet" : "rinkeby";
const infuraRpcSubprovider = new RPCSubprovider({
    rpcUrl: isInfura
        ? "https://" + network + ".infura.io/v3/" + NODE_API_KEY
        : "https://eth-" + network + ".alchemyapi.io/v2/" + NODE_API_KEY,
});

const providerEngine = new Web3ProviderEngine();
providerEngine.addProvider(mnemonicWalletSubprovider);
providerEngine.addProvider(infuraRpcSubprovider);
providerEngine.start();

const seaport = new OpenSeaPort(
    providerEngine,
    {
        networkName:
            NETWORK === "mainnet" || NETWORK === "live"
                ? Network.Main
                : Network.Rinkeby,
        apiKey: API_KEY,
    },
    (arg) => console.log(arg)
);

async function listOpenseaFixed(
    tokenId = 1,
    startPrice = 0.1,
    durationDays = 31
) {
    // Example: simple fixed-price sale of an item owned by a user.
    expirationTime = expirationTime
        ? expirationTime
        : Math.round(Date.now() / 1000 + 60 * 60 * 24 * durationDays);
    console.log(`Auctioning an item for a fixed price... ${expirationTime}`);
    const fixedPriceSellOrder = await seaport.createSellOrder({
        asset: {
            tokenId: tokenId ? tokenId : "1",
            tokenAddress: NFT_CONTRACT_ADDRESS,
            schemaName: WyvernSchemaName.ERC721,
        },
        startAmount: startPrice,
        expirationTime: expirationTime,
        accountAddress: OWNER_ADDRESS,
    });
    console.log(
        `Successfully created a fixed-price sell order! ${fixedPriceSellOrder.asset.openseaLink}\n`
    );
}

async function listOpenseaDutch(
    tokenId = 1,
    startPrice = 0.1,
    durationDays = 31
) {
    // // Example: Dutch auction.
    expirationTime = expirationTime
        ? expirationTime
        : Math.round(Date.now() / 1000 + 60 * 60 * 24 * durationDays);
    console.log(`Dutch auctioning an item...${expirationTime}`);
    const dutchAuctionSellOrder = await seaport.createSellOrder({
        asset: {
            tokenId: tokenId,
            tokenAddress: NFT_CONTRACT_ADDRESS,
            schemaName: WyvernSchemaName.ERC721,
        },
        startAmount: startPrice,
        endAmount: expirationTime,
        expirationTime: expirationTime,
        accountAddress: OWNER_ADDRESS,
    });
    console.log(
        `Successfully created a dutch auction sell order! ${dutchAuctionSellOrder.asset.openseaLink}\n`
    );
}

async function listOpenseaEnglish(
    tokenId = 1,
    startPrice = 0.1,
    durationDays = 31
) {
    // Example: English auction.
    expirationTime = expirationTime
        ? expirationTime
        : Math.round(Date.now() / 1000 + 60 * 60 * 24 * durationDays);
    console.log(`English auctioning an item in DAI...${expirationTime}`);
    const wethAddress =
        NETWORK === "mainnet" || NETWORK === "live"
            ? "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
            : "0xc778417e063141139fce010982780140aa0cd5ab";
    const englishAuctionSellOrder = await seaport.createSellOrder({
        asset: {
            tokenId: tokenId,
            tokenAddress: NFT_CONTRACT_ADDRESS,
            schemaName: WyvernSchemaName.ERC721,
        },
        startAmount: startPrice,
        expirationTime: expirationTime,
        waitForHighestBid: true,
        paymentTokenAddress: wethAddress,
        accountAddress: OWNER_ADDRESS,
    });
    console.log(
        `Successfully created an English auction sell order! ${englishAuctionSellOrder.asset.openseaLink}\n`
    );
}

// for (let i = 1; i++; i < 1100) {
// listOpenseaFixed(i, 0.01);
// }

module.exports = [listOpenseaFixed, listOpenseaDutch, listOpenseaEnglish];
