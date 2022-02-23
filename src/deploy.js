const fs = require("fs/promises");
const { F_OK } = require("fs");

const inquirer = require("inquirer");
const { BigNumber } = require("ethers");
const config = require("getconfig");

// const CONTRACT_NAME = "Minty";

// ipfs.add parameters for more deterministic CIDs
const ipfsAddOptions = {
  cidVersion: 1,
  hashAlg: "sha2-256",
};

async function deployContract(options) {
  const { name, image, symbol, contract } = options;

  const hardhat = require("hardhat");
  const network = hardhat.network.name;

  // add the asset to IPFS
  const imagePath = image || "asset.bin";
  const basename = path.basename(imagePath);

  // When you add an object to IPFS with a directory prefix in its path,
  // IPFS will create a directory structure for you. This is nice, because
  // it gives us URIs with descriptive filenames in them e.g.
  // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM/cat-pic.png' instead of
  // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM'
  const ipfsPath = "/contract/" + basename;
  const { cid: imageCid } = await this.ipfs.add(
    { path: ipfsPath, content },
    ipfsAddOptions
  );
  const imageURI = ensureIpfsUriPrefix(imageCid) + "/" + basename;

  // make the NFT metadata JSON
  const md = await makeContractMetadata(imageURI, options);

  // add the metadata to IPFS
  const { cid: metadataCid } = await this.ipfs.add(
    { path: "/contract/metadata.json", content: JSON.stringify(md) },
    ipfsAddOptions
  );
  const metadataURI =
    ensureIpfsUriPrefix(metadataCid) + "contract/metadata.json";

  // OpenSea proxy registry addresses for rinkeby and mainnet.
  let proxyRegistryAddress = "";
  if (network == "localhost") {
    const signers = hardhat.ethers.getSigners();

    const MockProxy = await hardhat.ethers.getContractFactory(
      "MockProxyRegistry"
    );
    const mockProxy = await MockProxy.deploy();

    await mockProxy.deployed();
    await mockProxy.setProxy(signers[0].address, signers[10].address);
  } else if (network === "rinkeby") {
    proxyRegistryAddress = "0xf57b2c51ded3a29e6891aba85459d600256cf317";
  } else {
    proxyRegistryAddress = "0xa5409ec958c83c3f309868babaca7c86dcb077c1";
  }

  console.log(
    `deploying contract for token ${name} (${symbol}) to network "${network}". You can now view contract metadata at ${metadataURI}..`
  );
  const Minty = await hardhat.ethers.getContractFactory(contract);
  const minty = await Minty.deploy(name, symbol, metadataURI);

  await minty.deployed();
  console.log(
    `deployed contract for token ${name} (${symbol}) to ${minty.address} (network: ${network}, metadata: ${metadataURI})`
  );

  return deploymentInfo(hardhat, minty, contract);
}

function makeContractMetadata(assetURI, options) {
  console.log(options);
  const {
    name,
    description,
    symbol,
    external_url,
    seller_fee_basis_points,
    fee_recipient,
    metadata,
    file,
  } = options;

  let md;

  if (!metadata) {
    if (!file) {
      md = {
        name,
        description,
        image: assetURI,
        symbol,
        external_url,
        seller_fee_basis_points,
        fee_recipient,
        metadata,
        file,
      };
    } else {
      md = {
        ...require(file),
        image: assetURI,
      };
    }
  } else {
    md = {
      ...JSON.parse(metadata),
      image: assetURI,
    };
  }

  return md;
}

function deploymentInfo(hardhat, minty, contract) {
  return {
    network: hardhat.network.name,
    contract: {
      name: contract,
      address: minty.address,
      signerAddress: minty.signer.address,
      abi: minty.interface.format(),
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

  if (metadata) {
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
  const content = await fs.readFile(deploymentConfigFile, { encoding: "utf8" });
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

  required("contract");
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

module.exports = {
  deployContract,
  loadDeploymentInfo,
  saveDeploymentInfo,
};
