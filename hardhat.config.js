require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
// const { ethers } = require("hardhat");
// import { Network } from "@ethersproject/networks";

const secrets = require("./.secrets.json");

// export const matic = new Network({
//     name: "matic",
//     chainId: 137,
//     _defaultProvider: (providers) =>
//         new providers.JsonRpcProvider("https://polygon-rpc.com/"),
// });

/**
 * @dev hardhat task
 */
task("getOwner", "Fetch the address of the deployed contract's owner.")
    // .addParam(
    //     "contract",
    //     "The contract template you deployed (used to fetch the correct ABI)..."
    // )
    .addParam("contractAddress", "The address of the deployed contract...")
    .setAction(async (taskArgs) => {
        const abi = [
            "constructor(string _name, string _symbol, string _contractURI, uint256 _maxSupply, address _proxyRegistryAddress)",
            "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
            "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
            "event MetaTransactionExecuted(address userAddress, address relayerAddress, bytes functionSignature)",
            "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
            "event PermanentURI(string _value, uint256 indexed _id)",
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
            "function ERC712_VERSION() view returns (string)",
            "function approve(address to, uint256 tokenId)",
            "function balanceOf(address owner) view returns (uint256)",
            "function contractURI() view returns (string)",
            "function executeMetaTransaction(address userAddress, bytes functionSignature, bytes32 sigR, bytes32 sigS, uint8 sigV) payable returns (bytes)",
            "function getApproved(uint256 tokenId) view returns (address)",
            "function getChainId() view returns (uint256)",
            "function getDomainSeperator() view returns (bytes32)",
            "function getNonce(address user) view returns (uint256 nonce)",
            "function isApprovedForAll(address _owner, address _operator) view returns (bool isOperator)",
            "function mintToken(address _to, string metadataURI) returns (uint256)",
            "function name() view returns (string)",
            "function owner() view returns (address)",
            "function ownerOf(uint256 tokenId) view returns (address)",
            "function renounceOwnership()",
            "function safeTransferFrom(address from, address to, uint256 tokenId)",
            "function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)",
            "function setApprovalForAll(address operator, bool approved)",
            "function supportsInterface(bytes4 interfaceId) view returns (bool)",
            "function symbol() view returns (string)",
            "function tokenURI(uint256 tokenId) view returns (string)",
            "function totalSupply() view returns (uint256)",
            "function transferFrom(address from, address to, uint256 tokenId)",
            "function transferOwnership(address newOwner)",
        ];
        const signer = await ethers.getSigner();

        const contract = await new ethers.Contract(
            taskArgs.contractAddress,
            abi,
            signer
        );

        const result = await contract.owner();

        console.log(result);
    });
task(
    "transferOwnership",
    "Transfers contract ownership to adress provided in newOwner arg."
)
    .addParam("newOwner", "The address of the new contract owner...")
    // .addParam(
    //     "contract",
    //     "The contract template you deployed (used to fetch the correct ABI)..."
    // )
    .addParam("contractAddress", "The address of the deployed contract...")
    .setAction(async (taskArgs) => {
        // const ContractFactory = await ethers.getContractFactory(
        //     taskArgs.contract
        // );
        // const contract = await ContractFactory.attach(taskArgs.contractAddress);

        const abi = [
            "constructor(string _name, string _symbol, string _contractURI, uint256 _maxSupply, address _proxyRegistryAddress)",
            "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
            "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
            "event MetaTransactionExecuted(address userAddress, address relayerAddress, bytes functionSignature)",
            "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
            "event PermanentURI(string _value, uint256 indexed _id)",
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
            "function ERC712_VERSION() view returns (string)",
            "function approve(address to, uint256 tokenId)",
            "function balanceOf(address owner) view returns (uint256)",
            "function contractURI() view returns (string)",
            "function executeMetaTransaction(address userAddress, bytes functionSignature, bytes32 sigR, bytes32 sigS, uint8 sigV) payable returns (bytes)",
            "function getApproved(uint256 tokenId) view returns (address)",
            "function getChainId() view returns (uint256)",
            "function getDomainSeperator() view returns (bytes32)",
            "function getNonce(address user) view returns (uint256 nonce)",
            "function isApprovedForAll(address _owner, address _operator) view returns (bool isOperator)",
            "function mintToken(address _to, string metadataURI) returns (uint256)",
            "function name() view returns (string)",
            "function owner() view returns (address)",
            "function ownerOf(uint256 tokenId) view returns (address)",
            "function renounceOwnership()",
            "function safeTransferFrom(address from, address to, uint256 tokenId)",
            "function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)",
            "function setApprovalForAll(address operator, bool approved)",
            "function supportsInterface(bytes4 interfaceId) view returns (bool)",
            "function symbol() view returns (string)",
            "function tokenURI(uint256 tokenId) view returns (string)",
            "function totalSupply() view returns (uint256)",
            "function transferFrom(address from, address to, uint256 tokenId)",
            "function transferOwnership(address newOwner)",
        ];
        const signer = await ethers.getSigner();

        const contract = await new ethers.Contract(
            taskArgs.contractAddress,
            abi,
            signer
        );

        console.log({
            signer: signer.address,
            newOwner: taskArgs.newOwner,
            contractAddress: taskArgs.contractAddress,
        });

        const result = await contract
            .connect(signer)
            .transferOwnership(taskArgs.newOwner);

        console.log(result);
    });

task(
    "collectionDetails",
    "Fetch collection name, symbol, and current circulating supply."
)
    .addParam("contractAddress", "The address of the deployed contract...")
    // .addParam(
    //     "contract",
    //     "The contract template you deployed (used to fetch the correct ABI)..."
    // )
    .setAction(async (taskArgs) => {
        // const ContractFactory = await ethers.getContractFactory(
        //     taskArgs.contract
        // );
        // const contract = await ContractFactory.attach(taskArgs.contractAddress);

        const abi = [
            "constructor(string _name, string _symbol, string _contractURI, uint256 _maxSupply, address _proxyRegistryAddress)",
            "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
            "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
            "event MetaTransactionExecuted(address userAddress, address relayerAddress, bytes functionSignature)",
            "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
            "event PermanentURI(string _value, uint256 indexed _id)",
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
            "function ERC712_VERSION() view returns (string)",
            "function approve(address to, uint256 tokenId)",
            "function balanceOf(address owner) view returns (uint256)",
            "function contractURI() view returns (string)",
            "function executeMetaTransaction(address userAddress, bytes functionSignature, bytes32 sigR, bytes32 sigS, uint8 sigV) payable returns (bytes)",
            "function getApproved(uint256 tokenId) view returns (address)",
            "function getChainId() view returns (uint256)",
            "function getDomainSeperator() view returns (bytes32)",
            "function getNonce(address user) view returns (uint256 nonce)",
            "function isApprovedForAll(address _owner, address _operator) view returns (bool isOperator)",
            "function mintToken(address _to, string metadataURI) returns (uint256)",
            "function name() view returns (string)",
            "function owner() view returns (address)",
            "function ownerOf(uint256 tokenId) view returns (address)",
            "function renounceOwnership()",
            "function safeTransferFrom(address from, address to, uint256 tokenId)",
            "function safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)",
            "function setApprovalForAll(address operator, bool approved)",
            "function supportsInterface(bytes4 interfaceId) view returns (bool)",
            "function symbol() view returns (string)",
            "function tokenURI(uint256 tokenId) view returns (string)",
            "function totalSupply() view returns (uint256)",
            "function transferFrom(address from, address to, uint256 tokenId)",
            "function transferOwnership(address newOwner)",
        ];
        const signer = await ethers.getSigner();

        const contract = await ethers.getContractAt(
            abi,
            taskArgs.contractAddress,
            signer
        );

        const result = {};

        result.name = await contract.name();
        result.symbol = await contract.symbol();
        result.totalSupply = await contract.totalSupply();
        result.signer = signer.address;

        console.log(result);
    });

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
            // gas: 3950000,
            // gasPrice: 8000000000,
            // gasMultiplier: 1.1,
        },
    },
};
