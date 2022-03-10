const fs = require("fs");
const path = require("path");
const spawn = require("child_process").spawnSync;
const CID = require("cids");
const ipfsClient = require("ipfs-http-client");
const { globSource } = require("ipfs-http-client");
const all = require("it-all");
const uint8ArrayConcat = require("uint8arrays/concat");
const uint8ArrayToString = require("uint8arrays/to-string");
const { BigNumber } = require("ethers");
const Hash = require("ipfs-only-hash");
const { loadDeploymentInfo } = require("./deploy");
// const { listOpenseaFixed } = require("./sell-opensea");

/**
 * TODO: mintGate integration
 * TODO: migrate from IPFS CIDs to IPNS or DNSLink for tokenURIs
 * TODO: add DeckBuilderNFT extension (Alpine-lines/ERC721CS) for ERC721A
 */

// The getconfig package loads configuration from files located in the the `config` directory.
// See https://www.npmjs.com/package/getconfig for info on how to override the default config for
// different environments (e.g. testnet, mainnet, staging, production, etc).
const config = require("getconfig");
const { JsonRpcBatchProvider } = require("@ethersproject/providers");
const { options } = require("ipfs-http-client/src/lib/core");

// ipfs.add parameters for more deterministic CIDs
const ipfsAddOptions = {
    cidVersion: 1,
    hashAlg: "sha2-256",
};

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Minty>} a new instance of Minty, ready to mint NFTs.
 */
async function MakeMinty() {
    const m = new Minty();
    await m.init();
    return m;
}

/**
 * Minty is the main object responsible for storing NFT data and interacting with the smart contract.
 * Before constructing, make sure that the contract has been deployed and a deployment
 * info file exists (the default location is `minty-deployment.json`)
 *
 * Minty requires async initialization, so the Minty class (and its constructor) are not exported.
 * To make one, use the async {@link MakeMinty} function.
 */
class Minty {
    constructor() {
        this.ipfs = null;
        this.contract = null;
        this.deployInfo = null;
        this._initialized = false;
    }

    async init() {
        if (this._initialized) {
            return;
        }
        this.hardhat = require("hardhat");

        // The Minty object expects that the contract has already been deployed, with
        // details written to a deployment info file. The default location is `./minty-deployment.json`,
        // in the config.
        this.deployInfo = await loadDeploymentInfo();

        // connect to the smart contract using the address and ABI from the deploy info
        const { abi, address } = this.deployInfo.contract;
        this.contract = await this.hardhat.ethers.getContractAt(abi, address);

        // create a local IPFS node
        this.ipfs = ipfsClient(config.ipfsApiUrl);

        this._initialized = true;
    }

    //////////////////////////////////////////////
    // ------ NFT Creation
    //////////////////////////////////////////////

    /**
     * Create a new NFT from the given asset data.
     *
     * @param {Buffer|Uint8Array} content - a Buffer or UInt8Array of data (e.g. for an image)
     * @param {object} options
     * @param {?string} path - optional file path to set when storing the data on IPFS
     * @param {object} metadata - the raw JSON metadata to be stored in IPFS and referenced by the token's metadata URI
     * @param {?string} file - optional JSON file path containing NFT metadata to store pin to IPFS
     * @param {?string} name - optional name to set in NFT metadata
     * @param {?string} description - optional description to store in NFT metadata
     * @param {?string} owner - optional ethereum address that should own the new NFT.
     * If missing, the default signing address will be used.
     * @param {?array} attrs - optional attributes json file to store in NFT metadata
     * @param {?string} exUrl - optional external url to store in NFT metadata
     * @param {?string} bg - optional background color to store in NFT metadata
     * @param {?string} animation - optional animation url to store in NFT metadata
     * @param {?string} video - optional video url to store in NFT metadata
     *
     * @typedef {object} CreateNFTResult
     * @property {string} tokenId - the unique ID of the new token
     * @property {string} ownerAddress - the ethereum address of the new token's owner
     * @property {object} metadata - the JSON metadata stored in IPFS and referenced by the token's metadata URI
     * @property {string} metadataURI - an ipfs:// URI for the NFT metadata
     * @property {string} metadataGatewayURL - an HTTP gateway URL for the NFT metadata
     * @property {string} assetURI - an ipfs:// URI for the NFT asset
     * @property {string} assetGatewayURL - an HTTP gateway URL for the NFT asset
     *
     * @returns {Promise<CreateNFTResult>}
     */
    async createNFTFromAssetData(content, options) {
        // add the asset to IPFS
        const filePath = options.path || "asset.bin";
        const basename = path.basename(filePath);

        // When you add an object to IPFS with a directory prefix in its path,
        // IPFS will create a directory structure for you. This is nice, because
        // it gives us URIs with descriptive filenames in them e.g.
        // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM/cat-pic.png' instead of
        // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM'
        const ipfsPath = "/nft/" + basename;
        const { cid: assetCid } = await this.ipfs.add(
            { path: ipfsPath, content },
            ipfsAddOptions
        );

        // make the NFT metadata JSON
        const assetURI = ensureIpfsUriPrefix(assetCid) + "/" + basename;
        const metadata = await this.makeNFTMetadata(assetURI, options);

        // add the metadata to IPFS
        const { cid: metadataCid } = await this.ipfs.add(
            { path: "/nft/metadata.json", content: JSON.stringify(metadata) },
            ipfsAddOptions
        );
        const metadataURI = ensureIpfsUriPrefix(metadataCid) + "/metadata.json";

        // get the address of the token owner from options, or use the default signing address if no owner is given
        let ownerAddress = options.owner;
        if (!ownerAddress) {
            ownerAddress = await this.defaultOwnerAddress();
        }

        let tokenId;

        this.mintToken({ ownerAddress, metadataURI });

        // format and return the results
        return {
            tokenId,
            ownerAddress,
            metadata,
            assetURI,
            metadataURI,
            assetGatewayURL: makeGatewayURL(assetURI),
            metadataGatewayURL: makeGatewayURL(metadataURI),
        };
    }

    /**
     * Create a new NFT from an asset file at the given path.
     *
     * @param {string} filename - the path to an image file or other asset to use
     * @param {object} options
     * @param {?string} name - optional name to set in NFT metadata
     * @param {?string} description - optional description to store in NFT metadata
     * @param {?string} owner - optional ethereum address that should own the new NFT.
     * If missing, the default signing address will be used.
     *
     * @returns {Promise<CreateNFTResult>}
     **/
    async createNFTFromAssetFile(filename, options) {
        const content = fs.readFileSync(filename);
        return this.createNFTFromAssetData(content, {
            ...options,
            path: filename,
        });
    }

    /**
     *
     * @param {string} imageDir
     * @param {string} metadataDir
     * @param {object} options
     * @param {?string} ownerAddress
     * @returns
     */
    async batchMint(options) {
        const { metadataDir, mdCid, owner } = options;

        const files = fs.readdirSync(metadataDir);

        // get the address of the token owner from options, or use the default signing address if no owner is given
        let ownerAddress = options.owner;
        if (!ownerAddress) {
            ownerAddress = await this.defaultOwnerAddress();
        }

        let ids = [];

        let failed = [];

        for (const f of files) {
            if (!f.includes("metadata")) {
                let id;
                try {
                    id = await this.mintToken(
                        ownerAddress,
                        `ipfs://${mdCid}/${f}`
                    );
                } catch (err) {
                    console.log(err);
                    failed.push(f);
                }
                ids.push(id);
            }
        }

        return { failed, ids, metadataDir, mdCid };
    }

    /**
     * Helper to construct metadata JSON for
     * @param {string} assetCid - IPFS URI for the NFT asset
     * @param {object} options
     * @param {object} metadata - the raw JSON metadata to be stored in IPFS and referenced by the token's metadata URI
     * @param {?string} file - optional JSON file path containing NFT metadata to store pin to IPFS
     * @param {?string} name - optional name to set in NFT metadata
     * @param {?string} description - optional description to store in NFT metadata
     * @param {?array} attrs - optional attributes json file to store in NFT metadata
     * @param {?string} exUrl - optional external url to store in NFT metadata
     * @param {?string} bg - optional background color to store in NFT metadata
     * @param {?string} animation - optional animation url to store in NFT metadata
     * @param {?string} video - optional video url to store in NFT metadata
     * @returns {object} - NFT metadata object
     */
    async makeNFTMetadata(assetURI, options) {
        // const {
        //     metadata,
        //     file,
        //     name,
        //     description,
        //     attrs,
        //     attributes,
        //     exUrl,
        //     bg,
        //     animation,
        //     video,
        // } = file ? require(file) : metadata ? JSON.parse(metadata) : options;

        // assetURI = ensureIpfsUriPrefix(assetURI);

        // return {
        //     name,
        //     description,
        //     attributes: attributes
        //         ? attributes
        //         : attrs
        //         ? require(attrs).attributes
        //         : [],
        //     image: assetURI,
        //     external_url: exUrl,
        //     background_color: bg,
        //     animation_url: animation,
        //     video_url: video,
        // };

        const {
            metadata,
            file,
            name,
            description,
            attrs,
            exUrl,
            bg,
            animation,
            video,
        } = options;

        assetURI = ensureIpfsUriPrefix(assetURI);

        let md;

        if (!metadata) {
            if (!file) {
                md = {
                    name,
                    description,
                    attributes: attrs ? require(attrs).attributes : [],
                    image: assetURI,
                    external_url: exUrl,
                    background_color: bg,
                    animation_url: animation,
                    video_url: video,
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

    /**
     * Get the contents of the IPFS object identified by the given CID or URI, and parse it as JSON, returning the parsed object.
     *
     * @param {string} imdDir - NFT collection image directory
     * @param {string} mdDir - NFT collection metadata JSON directory
     * @returns {Promise<string>} - IPFS CID string or `ipfs://<cid>` style URI
     */
    async makeBatchNFTMetadata(imgDir, mdDir) {
        const imgCID = await all(ipfs.addAll(ipfsFormatFileArray(imgDir)));
        parseCollectionMetadata(imgCID, mdDir);
        const mdURI = await all(ipfs.addAll(ipfsFormatFileArray(mdDir)));
        return mdURI;
    }

    //////////////////////////////////////////////
    // -------- NFT Retreival
    //////////////////////////////////////////////

    /**
     * Get information about an existing token.
     * By default, this includes the token id, owner address, metadata, and metadata URI.
     * To include info about when the token was created and by whom, set `opts.fetchCreationInfo` to true.
     * To include the full asset data (base64 encoded), set `opts.fetchAsset` to true.
     *
     * @param {string} tokenId
     * @param {object} opts
     * @param {?boolean} opts.fetchAsset - if true, asset data will be fetched from IPFS and returned in assetData (base64 encoded)
     * @param {?boolean} opts.fetchCreationInfo - if true, fetch historical info (creator address and block number)
     *
     *
     * @typedef {object} NFTInfo
     * @property {string} tokenId
     * @property {string} ownerAddress
     * @property {object} metadata
     * @property {string} metadataURI
     * @property {string} metadataGatewayURI
     * @property {string} assetURI
     * @property {string} assetGatewayURL
     * @property {?string} assetDataBase64
     * @property {?object} creationInfo
     * @property {string} creationInfo.creatorAddress
     * @property {number} creationInfo.blockNumber
     * @returns {Promise<NFTInfo>}
     */
    async getNFT(tokenId, opts) {
        const { metadata, metadataURI } = await this.getNFTMetadata(tokenId);
        const ownerAddress = await this.getTokenOwner(tokenId);
        const metadataGatewayURL = makeGatewayURL(metadataURI);
        const nft = {
            tokenId,
            metadata,
            metadataURI,
            metadataGatewayURL,
            ownerAddress,
        };

        const { fetchAsset, fetchCreationInfo } = opts || {};
        if (metadata.image) {
            nft.assetURI = metadata.image;
            nft.assetGatewayURL = makeGatewayURL(metadata.image);
            if (fetchAsset) {
                nft.assetDataBase64 = await this.getIPFSBase64(metadata.image);
            }
        }

        if (fetchCreationInfo) {
            nft.creationInfo = await this.getCreationInfo(tokenId);
        }
        return nft;
    }

    /**
     * Fetch the NFT metadata for a given token id.
     *
     * @param tokenId - the id of an existing token
     * @returns {Promise<{metadata: object, metadataURI: string}>} - resolves to an object containing the metadata and
     * metadata URI. Fails if the token does not exist, or if fetching the data fails.
     */
    async getNFTMetadata(tokenId) {
        const metadataURI = await this.contract.tokenURI(tokenId);
        console.log(metadataURI);
        const metadata = await this.getIPFSJSON(metadataURI);

        return { metadata, metadataURI };
    }

    //////////////////////////////////////////////
    // --------- Smart contract interactions
    //////////////////////////////////////////////

    /**
     * Create a new NFT token that references the given metadata CID, owned by the given address.
     *
     * @param {string} ownerAddress - the ethereum address that should own the new token
     * @param {string} metadataURI - IPFS URI for the NFT metadata that should be associated with this token
     * @returns {Promise<string>} - the ID of the new token
     */
    async mintToken(ownerAddress, metadataURI) {
        // Call the mintToken method to issue a new token to the given address
        // This returns a transaction object, but the transaction hasn't been confirmed
        // yet, so it doesn't have our token id.

        let tx;

        const contractTemplate = this.deployInfo.template;

        if (contractTemplate === "Minty") {
            console.log("Minty Template Found", { ownerAddress, metadataURI });
            tx = await this.contract.mintToken(ownerAddress, metadataURI);
        } else if (
            contractTemplate === "PreMinty" ||
            contractTemplate === "OpenMinty"
        ) {
            tx = await new Promise(async (resolve, reject) => {
                setTimeout(async () => resolve({}), 90000);
                if (metadataURI.split("/")[-1] !== "json") {
                    try {
                        console.log("Minting: ", {
                            metadataURI,
                            ownerAddress,
                        });
                        const tx0 = await this.contract.mintToken(
                            ownerAddress,
                            metadataURI
                        );
                        console.log("tx sent");
                        resolve(tx0);
                        clearTimeout();
                    } catch (err) {
                        console.log(err);
                        reject(err);
                    }
                } else {
                    resolve({});
                }
            });
        }

        // The OpenZeppelin base ERC721 contract emits a Transfer event when a token is issued.
        // tx.wait() will wait until a block containing our transaction has been mined and confirmed.
        // The transaction receipt contains events emitted while processing the transaction.
        try {
            const receipt = await tx.wait();
            for (const event of receipt.events) {
                if (event.event !== "Transfer") {
                    console.log("ignoring unknown event type ", event.event);
                    continue;
                }
                // listOpenseaFixed();
                console.log(event.args);
                return event.args.tokenId.toString();
            }

            console.log(new Error("unable to get token id"));
        } catch (err) {}
    }

    async transferToken(tokenId, toAddress) {
        const fromAddress = await this.getTokenOwner(tokenId);

        // because the base ERC721 contract has two overloaded versions of the safeTranferFrom function,
        // we need to refer to it by its fully qualified name.
        const tranferFn =
            this.contract["safeTransferFrom(address,address,uint256)"];
        const tx = await tranferFn(fromAddress, toAddress, tokenId);

        // wait for the transaction to be finalized
        await tx.wait();
    }

    /**
     * @returns {Promise<string>} - the default signing address that should own new tokens, if no owner was specified.
     */
    async defaultOwnerAddress() {
        const signers = await this.hardhat.ethers.getSigners();
        return signers[0].address;
    }

    /**
     * Get the address that owns the given token id.
     *
     * @param {string} tokenId - the id of an existing token
     * @returns {Promise<string>} - the ethereum address of the token owner. Fails if no token with the given id exists.
     */
    async getTokenOwner(tokenId) {
        return this.contract.ownerOf(tokenId);
    }

    /**
     * Get historical information about the token.
     *
     * @param {string} tokenId - the id of an existing token
     *
     * @typedef {object} NFTCreationInfo
     * @property {number} blockNumber - the block height at which the token was minted
     * @property {string} creatorAddress - the ethereum address of the token's initial owner
     *
     * @returns {Promise<NFTCreationInfo>}
     */
    async getCreationInfo(tokenId) {
        const filter = await this.contract.filters.Transfer(
            null,
            null,
            BigNumber.from(tokenId)
        );

        const logs = await this.contract.queryFilter(filter);
        const blockNumber = logs[0].blockNumber;
        const creatorAddress = logs[0].args.to;
        return {
            blockNumber,
            creatorAddress,
        };
    }

    //////////////////////////////////////////////
    // --------- IPFS helpers
    //////////////////////////////////////////////

    /**
     * Get the full contents of the IPFS object identified by the given CID or URI.
     *
     * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
     * @returns {Promise<Uint8Array>} - contents of the IPFS object
     */
    async getIPFS(cidOrURI) {
        const cid = stripIpfsUriPrefix(cidOrURI);
        return await all(this.ipfs.cat(cid));
    }

    /**
     * Get the contents of the IPFS object identified by the given CID or URI, and return it as a string.
     *
     * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
     * @returns {Promise<string>} - the contents of the IPFS object as a string
     */
    async getIPFSString(cidOrURI) {
        const bytes = await this.getIPFS(cidOrURI);
        return bytes;
    }

    /**
     * Get the full contents of the IPFS object identified by the given CID or URI, and return it as a base64 encoded string.
     *
     * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
     * @returns {Promise<string>} - contents of the IPFS object, encoded to base64
     */
    async getIPFSBase64(cidOrURI) {
        const bytes = await this.getIPFS(cidOrURI);
        return uint8ArrayToString(bytes, "base64");
    }

    /**
     * Get the contents of the IPFS object identified by the given CID or URI, and parse it as JSON, returning the parsed object.
     *
     * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
     * @returns {Promise<string>} - contents of the IPFS object, as a javascript object (or array, etc depending on what was stored). Fails if the content isn't valid JSON.
     */
    async getIPFSJSON(cidOrURI) {
        const str = await this.getIPFSString(cidOrURI);
        return JSON.parse(str);
    }

    async parseMetadata(file, cid, metadata) {
        const { externalUrl, sellerFee, feeRecipient } = metadata;

        const imgURI = `ipfs://${cid}/${file.split(".")[0]}.png`;
        const data = fs.readFileSync(file);
        const parsedData = JSON.parse(data);

        parsedData.image = imgURI;

        if (externalUrl) {
            parsedData.external_url = externalUrl;
        }
        if (sellerFee) {
            parsedData.seller_fee_basis_points = sellerFee;
        }
        if (feeRecipient) {
            parsedData.fee_recipient = feeRecipient;
        }

        // console.log(parsedData);
        fs.writeFileSync(filePath, JSON.stringify(parsedData));
        console.log("Wrote image: " + uri + " to " + filePath);
    }

    async parseCollectionMetadata(dir, cid, metadata) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            parseMetadata(`${dir}/${file}`, cid, metadata);
        }
    }

    //////////////////////////////////////////////
    // -------- Pinning to remote services
    //////////////////////////////////////////////

    /**
     * Pins all IPFS data associated with the given tokend id to the remote pinning service.
     *
     * @param {string} tokenId - the ID of an NFT that was previously minted.
     * @returns {Promise<{assetURI: string, metadataURI: string}>} - the IPFS asset and metadata uris that were pinned.
     * Fails if no token with the given id exists, or if pinning fails.
     */
    async pinTokenData(tokenId) {
        const { metadata, metadataURI } = await this.getNFTMetadata(tokenId);
        const { image: assetURI } = metadata;

        console.log(
            `Pinning asset data (${assetURI}) for token id ${tokenId}....`
        );
        await this.pin(assetURI);

        console.log(
            `Pinning metadata (${metadataURI}) for token id ${tokenId}...`
        );
        await this.pin(metadataURI);

        return { assetURI, metadataURI };
    }

    /**
     * Request that the remote pinning service pin the given CID or ipfs URI.
     *
     * @param {string} cidOrURI - a CID or ipfs:// URI
     * @returns {Promise<void>}
     */
    async pin(cidOrURI) {
        const cid = extractCID(cidOrURI);

        // Make sure IPFS is set up to use our preferred pinning service.
        await this._configurePinningService();

        // Check if we've already pinned this CID to avoid a "duplicate pin" error.
        const pinned = await this.isPinned(cid);
        if (pinned) {
            return;
        }

        // Ask the remote service to pin the content.
        // Behind the scenes, this will cause the pinning service to connect to our local IPFS node
        // and fetch the data using Bitswap, IPFS's transfer protocol.
        await this.ipfs.pin.remote.add(cid, {
            service: config.pinningService.name,
        });
    }

    /**
     * Check if a cid is already pinned.
     *
     * @param {string|CID} cid
     * @returns {Promise<boolean>} - true if the pinning service has already pinned the given cid
     */
    async isPinned(cid) {
        if (typeof cid === "string") {
            cid = new CID(cid);
        }

        const opts = {
            service: config.pinningService.name,
            cid: [cid], // ls expects an array of cids
        };
        for await (const result of this.ipfs.pin.remote.ls(opts)) {
            return true;
        }
        return false;
    }

    /**
     * Configure IPFS to use the remote pinning service from our config.
     *
     * @private
     */
    async _configurePinningService() {
        if (!config.pinningService) {
            throw new Error(
                `No pinningService set up in minty config. Unable to pin.`
            );
        }

        // check if the service has already been added to js-ipfs
        for (const svc of await this.ipfs.pin.remote.service.ls()) {
            if (svc.service === config.pinningService.name) {
                // service is already configured, no need to do anything
                return;
            }
        }

        // add the service to IPFS
        const { name, endpoint, key } = config.pinningService;
        if (!name) {
            throw new Error("No name configured for pinning service");
        }
        if (!endpoint) {
            throw new Error(
                `No endpoint configured for pinning service ${name}`
            );
        }
        if (!key) {
            throw new Error(
                `No key configured for pinning service ${name}.` +
                    `If the config references an environment variable, e.g. '$$PINATA_API_TOKEN', ` +
                    `make sure that the variable is defined.`
            );
        }
        await this.ipfs.pin.remote.service.add(name, { endpoint, key });
    }
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

/**
 *
 * @param {string} cidOrURI - an ipfs:// URI or CID string
 * @returns {CID} a CID for the root of the IPFS path
 */
function extractCID(cidOrURI) {
    // remove the ipfs:// prefix, split on '/' and return first path component (root CID)
    const cidString = stripIpfsUriPrefix(cidOrURI).split("/")[0];
    return new CID(cidString);
}

//////////////////////////////////////////////
// -------- Exports
//////////////////////////////////////////////

module.exports = {
    MakeMinty,
};
