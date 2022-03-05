const fs = require("fs");
const path = require("path");
const { F_OK } = require("fs");
const CID = require("cids");
const ipfsClient = require("ipfs-http-client");
const inquirer = require("inquirer");
const { BigNumber } = require("ethers");

// The getconfig package loads configuration from files located in the the `config` directory.
// See https://www.npmjs.com/package/getconfig for info on how to override the default config for
// different environments (e.g. testnet, mainnet, staging, production, etc).
const config = require("getconfig");
const { NONAME } = require("dns");

// ipfs.add parameters for more deterministic CIDs
const ipfsAddOptions = {
    cidVersion: 1,
    hashAlg: "sha2-256",
};

const ipfs = ipfsClient(config.ipfsApiUrl);

async function deployContract(options) {
    let { name, image, symbol, fee, recipient, contract, file } = options;

    if (file) {
        file = require(file);
        name = file.name;
        symbol = file.symbol;
        description = file.description;
        imageIpfs = file.image;
        recipient_address = file.recipient_address;
        seller_fee_basis_points = file.seller_fee_basis_points;
    }

    const hardhat = require("hardhat");
    const network = hardhat.network.name;

    let imageURI;
    let imageGatewayURL;

    if (image) {
        // fetch image content
        const content = fs.readFileSync(image);

        // add the asset to IPFS
        const imagePath = image || "asset.bin";
        const basename = path.basename(imagePath);

        // When you add an object to IPFS with a directory prefix in its path,
        // IPFS will create a directory structure for you. This is nice, because
        // it gives us URIs with descriptive filenames in them e.g.
        // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM/cat-pic.png' instead of
        // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM'
        const ipfsPath = "/contract/" + basename;
        const { cid: imageCid } = await ipfs.add(
            { path: ipfsPath, content },
            ipfsAddOptions
        );
        imageURI = ensureIpfsUriPrefix(imageCid) + "/" + basename;
        imageGatewayURL = makeGatewayURL(imageURI);
    }

    // make the NFT metadata JSON
    const md = await makeContractMetadata(imageURI, options);

    // add the metadata to IPFS
    const { cid: metadataCid } = await ipfs.add(
        { path: "/contract/metadata.json", content: JSON.stringify(md) },
        ipfsAddOptions
    );
    const metadataURI = ensureIpfsUriPrefix(metadataCid) + "/metadata.json";
    const metadataGatewayURL = makeGatewayURL(metadataURI);

    // OpenSea proxy registry addresses for rinkeby and mainnet.
    let proxyRegistryAddress = "";
    let mockProxy;

    if (contract !== "Minty") {
        if (network === "localhost") {
            const signers = await hardhat.ethers.getSigners();

            const MockProxy = await hardhat.ethers.getContractFactory(
                "MockProxyRegistry"
            );
            mockProxy = await MockProxy.deploy();

            await mockProxy.deployed();
            // console.log(signers, signers[0]);
            await mockProxy.setProxy(signers[0].address, signers[9].address);
        } else if (network === "mumbai") {
            proxyRegistryAddress = "0xf57b2c51ded3a29e6891aba85459d600256cf317";
        } else {
            proxyRegistryAddress = "0xa5409ec958c83c3f309868babaca7c86dcb077c1";
        }
    }

    console.log(
        `deploying contract for token ${name} (${symbol}) to network "${network}". You can now view contract metadata at ${metadataGatewayURL} ...`
    );
    const Contract = await hardhat.ethers.getContractFactory(contract);
    let contractInstance;

    if (contract === "Minty") {
        contractInstance = await Contract.deploy(name, symbol, metadataURI);
    } else if (contract === "PreMinty" || contract === "OpenMinty") {
        contractInstance = await Contract.deploy(
            name,
            symbol,
            minters,
            admins,
            metadataURI,
            11000,
            mockProxy.address ? mockProxy.address : proxyRegistryAddress
        );
    }

    await minty.deployed();
    console.log(
        `deployed contract for token ${name} (${symbol}) to ${minty.address} (network: ${network}, metadata: ${metadataURI})`
    );

    return deploymentInfo(hardhat, minty, contract, metadataURI);
}

function makeContractMetadata(assetURI, options) {
    // const {
    //     name,
    //     description,
    //     symbol,
    //     external_url,
    //     seller_fee_basis_points,
    //     fee_recipient,
    //     metadata,
    //     file,
    // } = options;

    // if (file) {
    //     md = {
    //         ...JSON.parse(metadata),
    //     };
    // } else if (metadata) {
    //     md = {
    //         ...JSON.parse(metadata),
    //     };
    // } else {
    //     md = {
    //         name,
    //         description,
    //         symbol,
    //         external_url,
    //         seller_fee_basis_points,
    //         fee_recipient,
    //         metadata,
    //         file,
    //     };
    // }

    return options.file
        ? { ...JSON.parse(options.file), image: assetURI }
        : options.metadata
        ? { ...JSON.parse(options.metadata), image: assetURI }
        : { ...options, image: assetURI };
}

function deploymentInfo(hardhat, minty, contract, metadataURI) {
    return {
        network: hardhat.network.name,
        template: contract,
        contract: {
            name: contract,
            address: minty.address,
            signerAddress: minty.signer.address,
            abi: minty.interface.format(),
            metadataURI,
        },
    };
}

async function saveDeploymentInfo(
    info,
    filename = undefined,
    metadataURI = undefined
) {
    if (!filename) {
        filename = config.deploymentConfigFile || "minty-deployment.json";
    }
    const exists = await fileExists(filename);
    if (exists) {
        const overwrite = await confirmOverwrite(filename);
        if (!overwrite) {
            return false;
        }
    }

    console.log(`Writing deployment info to ${filename}`);

    if (metadataURI) {
        info.contract.metadataURI = metadataURI;
    }
    const content = JSON.stringify(info, null, 2);
    await fs.writeFile(filename, content, { encoding: "utf-8" });

    return true;
}

async function loadDeploymentInfo() {
    let { deploymentConfigFile } = config;
    if (!deploymentConfigFile) {
        console.log(
            'no deploymentConfigFile field found in minty config. attempting to read from default path "./minty-deployment.json"'
        );
        deploymentConfigFile = "minty-deployment.json";
    }
    const content = fs.readFileSync(deploymentConfigFile, {
        encoding: "utf8",
    });
    deployInfo = JSON.parse(content);
    try {
        validateDeploymentInfo(deployInfo);
    } catch (e) {
        throw new Error(
            `error reading deploy info from ${deploymentConfigFile}: ${e.message}`
        );
    }
    return deployInfo;
}

function validateDeploymentInfo(deployInfo) {
    const { contract } = deployInfo;
    if (!contract) {
        throw new Error('required field "contract" not found');
    }
    const required = (arg) => {
        if (!deployInfo.contract.hasOwnProperty(arg)) {
            throw new Error(`required field "contract.${arg}" not found`);
        }
    };

    required("name");
    required("address");
    required("abi");
    required("metadataURI");
}

async function fileExists(path) {
    try {
        await fs.access(path, F_OK);
        return true;
    } catch (e) {
        return false;
    }
}

async function confirmOverwrite(filename) {
    const answers = await inquirer.prompt([
        {
            type: "confirm",
            name: "overwrite",
            message: `File ${filename} exists. Overwrite it?`,
            default: false,
        },
    ]);
    return answers.overwrite;
}

//////////////////////////////////////////////
// -------- URI helpers
//////////////////////////////////////////////

/**
 * @param {string} cidOrURI either a CID string, or a URI string of the form `ipfs://${cid}`
 * @returns the input string with the `ipfs://` prefix stripped off
 */
function stripIpfsUriPrefix(cidOrURI) {
    if (cidOrURI.startsWith("ipfs://")) {
        return cidOrURI.slice("ipfs://".length);
    }
    return cidOrURI;
}

function ensureIpfsUriPrefix(cidOrURI) {
    let uri = cidOrURI.toString();
    if (!uri.startsWith("ipfs://")) {
        uri = "ipfs://" + cidOrURI;
    }
    // Avoid the Nyan Cat bug (https://github.com/ipfs/go-ipfs/pull/7930)
    if (uri.startsWith("ipfs://ipfs/")) {
        uri = uri.replace("ipfs://ipfs/", "ipfs://");
    }
    return uri;
}

/**
 * Return an HTTP gateway URL for the given IPFS object.
 * @param {string} ipfsURI - an ipfs:// uri or CID string
 * @returns - an HTTP url to view the IPFS object on the configured gateway.
 */
function makeGatewayURL(ipfsURI) {
    return config.ipfsGatewayUrl + "/" + stripIpfsUriPrefix(ipfsURI);
}

module.exports = {
    deployContract,
    loadDeploymentInfo,
    saveDeploymentInfo,
};
