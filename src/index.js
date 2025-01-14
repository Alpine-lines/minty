#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

// const fs = require("fs/promises");
const path = require("path");
const { Command } = require("commander");
const inquirer = require("inquirer");
const chalk = require("chalk");
const colorize = require("json-colorizer");
const config = require("getconfig");
const { MakeMinty } = require("./minty");
const { deployContract, saveDeploymentInfo } = require("./deploy");

const colorizeOptions = {
    pretty: true,
    colors: {
        STRING_KEY: "blue.bold",
        STRING_LITERAL: "green",
    },
};

async function main() {
    const program = new Command();

    // commands
    program
        .command("mint <image-path>")
        .description("create a new NFT from an image file")
        .option(
            "-m, --metadata <metadata>",
            "JSON content containing NFT metadata"
        )
        .option(
            "-f, --file <file>",
            "Path of  JSON file containing NFT metadata"
        )
        .option("-n, --name <name>", "The name of the NFT")
        .option("-d, --description <desc>", "A description of the NFT")
        .option(
            "-a, --attrs <attrs>",
            "An attributes json file path for the NFT"
        )
        .option(
            "-e, --exUrl <exUrl>",
            "An external URL where the NFT can be found"
        )
        .option(
            "-b, --background <bg>",
            "Opensea NFT hexidecimal background color"
        )
        .option(
            "-a, --animation <animation>",
            "URL where NFT animation can be found"
        )
        .option(
            "-v, --video <video>",
            "URL where video can be found, i.e. https://youtube.com/<uri>"
        )
        .option(
            "-o, --owner <address>",
            "The ethereum address that should own the NFT." +
                "If not provided, defaults to the first signing address."
        )
        .action(createNFT);

    program
        .command("batchMint")
        .description(
            "bulk mint n NFTs and upload n images and metadata.json objects to IPFS w/ optional pinning service"
        )
        .option(
            "-i, --imageDir <imageDir>",
            "Path of the directory where collection images are held"
        )
        .option(
            "-m, --metadataDir <metadataDir>",
            "Path of the directory where metada JSON files are held"
        )
        .option(
            "-c, --imgCid <imgCid>",
            "IPFS CID where images are hosted, use when preemptively uploading images to IPFS."
        )
        .option(
            "-d, --mdCid <mdCid>",
            "IPFS CID where images are hosted, use when preemptively uploading images to IPFS."
        )
        .option(
            "-o, --owner <owner>",
            "Address to receive newly minted tokens."
        )
        .action(batchMint);

    program
        .command("show <token-id>")
        .description("get info about an NFT using its token ID")
        .option(
            "-c, --creation-info",
            "include the creator address and block number the NFT was minted"
        )
        .action(getNFT);

    program
        .command("transfer <token-id> <to-address>")
        .description("transfer an NFT to a new owner")
        .action(transferNFT);

    program
        .command("pin <token-id>")
        .description(
            '"pin" the data for an NFT to a remote IPFS Pinning Service'
        )
        .action(pinNFTData);

    // program
    //     .command("initiate-sale")
    //     .description(
    //         "initiate opensea sale of type Fixed Price (DEFAULT), English Auction, or Dutch Auction"
    //     )
    //     .option(
    //         "-p, --price <price>",
    //         "Sell price (starting if either English or Dutch auction"
    //     )
    //     .option(
    //         "-d, --duration <duration>",
    //         "Sell order duration (in # of days"
    //     )
    //     .option("-a, --all <all>", "Create sell order for all tokens")
    //     .option("-i, --id <id>", "Create sell order for one token by ID")
    //     .option("-d, --dutch <dutch>", "Create dutch auction")
    //     .option("-e, --english <english>", "Create english auction")
    //     .action(initiateSale);

    program
        .command("deploy")
        .description("deploy an instance of the Minty NFT contract")
        .option(
            "-o, --output <deploy-file-path>",
            "Path to write deployment info to",
            config.deploymentConfigFile || "minty-deployment.json"
        )
        .option(
            "-f, --file <file>",
            "Collection metadata file for contract deployment."
        )
        .option(
            "-c, --contract <contract>",
            "Contract template to deploy. Must be either Minty, OpenMinty, or PreMinty"
        )
        .option("-n, --name <name>", "The name of the token contract")
        .option(
            "-d, --description <desc>",
            "A description of the token contract"
        )
        .option(
            "-i, --image <image>",
            "An image file path for the token contract"
        )
        .option(
            "-s, --symbol <symbol>",
            "A short symbol for the tokens in this contract"
        )
        .option(
            "-e, --exUrl <exUrl>",
            "The external url of the collection website"
        )
        .option(
            "-s, --sellerFee <fee>",
            "The seller fee, in basis points, to be charged to opensea sellers and credited to the listed fee recipient"
        )
        .option(
            "-r, --recipient <recipient>",
            "The fee recipient where seller fees will be sent following sales on opensea."
        )
        .option(
            "-m, --metadata <metadata>",
            "The token contracts metadata in JSON format"
        )
        .option(
            "-f, --file <file>",
            "Path to the JSON file containing the token contracts metadata."
        )
        .action(deploy);

    // The hardhat and getconfig modules both expect to be running from the root directory of the project,
    // so we change the current directory to the parent dir of this script file to make things work
    // even if you call minty from elsewhere
    const rootDir = path.join(__dirname, "..");
    process.chdir(rootDir);

    await program.parseAsync(process.argv);
}

async function createNFT(imagePath, options) {
    const minty = await MakeMinty();

    // prompt for missing details if not provided as cli args
    const answers = await promptForMissing(
        options,
        !options.metadata
            ? !options.file
                ? {
                      name: {
                          message: "Enter a name for your new NFT: ",
                      },

                      description: {
                          message: "Enter a description for your new NFT: ",
                      },

                      attrs: {
                          message:
                              "Enter an attributes json file path for your new NFT: ",
                      },

                      exUrl: {
                          message: "Enter an external url for your new NFT: ",
                      },

                      bg: {
                          message:
                              "Enter a hexidecimal color code for Opensea NFT background: ",
                      },

                      animation: {
                          message: "Enter an animation URL for your new NFT: ",
                      },

                      video: {
                          message: "Enter a video URL for your new NFT: ",
                      },
                  }
                : {
                      file: {
                          message:
                              "Enter a path for your NFT metadata JSON file: ",
                      },
                  }
            : {
                  metadata: {
                      message: "Provide metadata JSON content: ",
                  },
              }
    );

    const nft = await minty.createNFTFromAssetFile(imagePath, answers);
    console.log("🌿 Minted a new NFT: ");

    alignOutput([
        ["Token ID:", chalk.green(nft.tokenId)],
        ["Metadata Address:", chalk.blue(nft.metadataURI)],
        ["Metadata Gateway URL:", chalk.blue(nft.metadataGatewayURL)],
        ["Asset Address:", chalk.blue(nft.assetURI)],
        ["Asset Gateway URL:", chalk.blue(nft.assetGatewayURL)],
    ]);
    console.log("NFT Metadata:");
    console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions));
}

async function batchMint(options) {
    const minty = await MakeMinty();

    const { failed, ids, metadataDir, mdCid } = await minty.batchMint(options);

    const output = [];

    output.push(["Minted Token IDs:", chalk.blue(ids)]);
    output.push(["Failed Token Mint Metadata Files:", chalk.blue(failed)]);
    output.push(["IPFS Metadata JSON CID:", chalk.blue(mdCid)]);

    alignOutput(output);
}

async function getNFT(tokenId, options) {
    const { creationInfo: fetchCreationInfo } = options;
    const minty = await MakeMinty();
    const nft = await minty.getNFT(tokenId, { fetchCreationInfo });

    const output = [
        ["Token ID:", chalk.green(nft.tokenId)],
        ["Owner Address:", chalk.yellow(nft.ownerAddress)],
    ];
    if (nft.creationInfo) {
        output.push([
            "Creator Address:",
            chalk.yellow(nft.creationInfo.creatorAddress),
        ]);
        output.push(["Block Number:", nft.creationInfo.blockNumber]);
    }
    output.push(["Metadata Address:", chalk.blue(nft.metadataURI)]);
    output.push(["Metadata Gateway URL:", chalk.blue(nft.metadataGatewayURL)]);
    output.push(["Asset Address:", chalk.blue(nft.assetURI)]);
    output.push(["Asset Gateway URL:", chalk.blue(nft.assetGatewayURL)]);
    alignOutput(output);

    console.log("NFT Metadata:");
    console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions));
}

async function transferNFT(tokenId, toAddress) {
    const minty = await MakeMinty();

    await minty.transferToken(tokenId, toAddress);
    console.log(
        `🌿 Transferred token ${chalk.green(tokenId)} to ${chalk.yellow(
            toAddress
        )}`
    );
}

async function pinNFTData(tokenId) {
    const minty = await MakeMinty();
    const { assetURI, metadataURI } = await minty.pinTokenData(tokenId);
    console.log(`🌿 Pinned all data for token id ${chalk.green(tokenId)}`);
}

// async function initiateSale(tokenId) {
//     const minty = await MakeMinty();
//     const { assetURI, metadataURI } = await minty.pinTokenData(tokenId);
//     console.log(`🌿 Pinned all data for token id ${chalk.green(tokenId)}`);
// }

async function deploy(options) {
    const answers = await promptForMissing(
        options,
        !options.metadata
            ? !options.file
                ? {
                      contract: {
                          message:
                              "Select a contract template for your new NFT contract. Accepts Minty | OpenMinty | PreMinty ...",
                      },

                      name: {
                          message: "Enter a name for your new NFT contract: ",
                      },

                      description: {
                          message:
                              "Enter a description for your new NFT contract: ",
                      },

                      symbol: {
                          message:
                              "Enter a token symbol for your new NFT contract: ",
                      },

                      image: {
                          message:
                              "Enter an image file path for your new NFT contract: ",
                      },

                      exUrl: {
                          message:
                              "Enter an external url for your new NFT contract: ",
                      },

                      sellerFee: {
                          message:
                              "Enter an Opensea seller fee, in basis points, for your new NFT contract: ",
                      },

                      recipient: {
                          message:
                              "Enter a fee recipient wallet address for your new NFT contract: ",
                      },
                  }
                : {
                      file: {
                          message:
                              "Enter a path for your NFT metadata JSON file: ",
                      },

                      contract: {
                          message: "Enter a contract template: ",
                      },

                      image: {
                          message: "Enter and image path for contract: ",
                      },
                  }
            : {
                  metadata: {
                      message: "Provide metadata JSON content: ",
                  },
              }
    );
    const filename = options.output;
    const info = await deployContract(answers);
    await saveDeploymentInfo(info, filename);
}

// ---- helpers

async function promptForMissing(cliOptions, prompts) {
    const questions = [];
    for (const [name, prompt] of Object.entries(prompts)) {
        prompt.name = name;
        prompt.when = (answers) => {
            if (cliOptions[name]) {
                answers[name] = cliOptions[name];
                return false;
            }
            return true;
        };
        questions.push(prompt);
    }
    return inquirer.prompt(questions);
}

function alignOutput(labelValuePairs) {
    const maxLabelLength = labelValuePairs
        .map(([l, _]) => l.length)
        .reduce((len, max) => (len > max ? len : max));
    for (const [label, value] of labelValuePairs) {
        console.log(label.padEnd(maxLabelLength + 1), value);
    }
}

// ---- main entry point when running as a script

// make sure we catch all errors
main()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
