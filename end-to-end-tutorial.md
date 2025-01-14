---
title: End-to-end tutorial
description: Go from nothing, to having an NFT pinned on Pinata in just a few minutes.
date: 2022-03-12
---

# End-to-end tutorial

## Prerequisites

Install and run Minty, you must have NPM installed. Windows is not currently supported.

## Download and install Minty

Installation of Minty is fairly simple. Just download the GitHub repository, install the NPM dependencies, and start the local testnet environment.

1. Clone this repository and move into the `minty` directory:

    ```shell
    git clone https://github.com/Alpine-lines/minty-cli
    cd minty
    ```

2. Install the NPM dependencies:

    ```shell
    yarn install
    ```

3. Add the `minty` command to your `$PATH`. This makes it easier to run Minty from anywhere on your computer:

    ```shell
    yarn link
    ```

4. Run the `start-local-environment.sh` script to start the local Ethereum testnet and IPFS daemon:

    ```shell
      ./start-local-environment.sh
      Compiling smart contract
      Nothing to compile
      Running IPFS and development blockchain
      [eth] Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
      ...
      [ipfs] Daemon is ready
      ...
    ```

    This command continues to run. All further commands must be entered in another terminal window.

## Deploy the contract

Before running any of the other `minty` commands, you'll need to deploy an instance of the
smart contract:

```shell
 minty deploy --contract PreMinty
? Enter a name for your new NFT contract:
? Enter a description for your new NFT contract:
? Enter a token symbol for your new NFT contract:
? Enter an image file path for your new NFT contract:
? Enter an external url for your new NFT contract:
? Enter an Opensea seller fee, in basis points, for your new NFT contract:
? Enter a fee recipient wallet address for your new NFT contract:
deploying contract for token  () to network "localhost". You can now view contract metadata at http://localhost:8080/ipfs/bafybeigckklrdakkvf2qf3amzobf363yv3k2r636o4qejvqpnxgstqga44/metadata.json ...
deployed contract for token  () to 0x59b670e9fA9D0A427751Af201D676719a970857b (network: localhost, metadata: ipfs://bafybeigckklrdakkvf2qf3amzobf363yv3k2r636o4qejvqpnxgstqga44/metadata.json)
Writing deployment info to minty-deployment.json
```

This deploys to the network configured in [`hardhat.config.js`](./hardhat.config.js), which is set to the `localhost` network by default. If you get an error about not being able to reach the network, make sure to run the local development network with `./start-local-environment.sh`.

When the contract is deployed, the address and other information about the deployment is written to `minty-deployment.json`. This file must be present for subsequent commands to work.

### Deploying to other networks

To deploy to another network, see the [Hardhat configuration docs](https://hardhat.org/config/) to learn how to configure a JSON-RPC node. Once you've added a new network to the Hardhat config, you can use it by setting the `HARDHAT_NETWORK` environment variable to the name of the new network when you run `minty` commands. Alternatively, you can change the `defaultNetwork` in `hardhat.config.js` to always prefer the new network.

Deploying this contract to the Ethereum mainnet is a bad idea since the contract itself lacks any access control. See the [Open Zeppelin article](https://docs.openzeppelin.com/contracts/3.x/access-control) about what access control is, and why it's important to have.

## Mint an NFT

Once you have the local Ethereum network and IPFS daemon running, minting an NFT it increaibly simple. Just specify what you want to _tokenize_, the name of the NFT, and a description to tell users what the NFT is for.

### Create something to mint

First, let's create something to mint. NFTs have a huge range of use-cases, so we're going to create a ticket for an flight to the moon.

1. Create a file called `flight-to-the-moon.json`:

    ```shell
    touch ~/flight-to-the-moon.json
    ```

2. Open the file and enter some flight information:

```
{
   "name": "Moon Flight #4",
   "description": "This ticket serves as proof-of-ownership of a first-class seat on a flight to the moon.",
   "attributes": [
      {
         "trait_type": "Base",
         "value": "Starfish"
      },
      {
         "trait_type": "Eyes",
         "value": "Big"
      },
      {
         "trait_type": "Mouth",
         "value": "Surprised"
      },
      {
         "trait_type": "Level",
         "value": 5
      },
      {
         "trait_type": "Stamina",
         "value": 1.4
      },
      {
         "trait_type": "Personality",
         "value": "Sad"
      },
      {
         "display_type": "boost_number",
         "trait_type": "Aqua Power",
         "value": 40
      },
      {
         "display_type": "boost_percentage",
         "trait_type": "Stamina Increase",
         "value": 10
      },
      {
         "display_type": "number",
         "trait_type": "Generation",
         "value": 2
      }
   ],
   "external_url": "https://alpinelines.dev/nft"
}

```

3. Save and close the file.

4. Find an image you enjoy and collect its path, i.e. ~/pictures/profile.jpg

### Mint the file

Now that we've got our ticket, we can mint it.

1. Call the `mint` command and supply the file we want to mint, the name of our NFT, and a description:

    ```shell
    minty mint ~/pictures/profile.jpg --file ~/flight-to-the-moon.json

    > 🌿 Minted a new NFT:
    > Token ID:              1
    > Metadata URI:          ipfs://Qma4RRDu9Q5ZXb4F6HSPAHXeyinYYFuBMTrk7HbHrsbcN9/metadata.json
    > Metadata Gateway URL:  http://localhost:8080/ipfs/Qma4RRDu9Q5ZXb4F6HSPAHXeyinYYFuBMTrk7HbHrsbcN9/metadata.json
    > Asset URI:             ipfs://QmbwYvCrjnv9nKqagwYoniNzppf96za7BnateWD18mQnHX/flight-to-the-moon.txt
    > Asset Gateway URL:     http://localhost:8080/ipfs/QmbwYvCrjnv9nKqagwYoniNzppf96za7BnateWD18mQnHX/flight-to-the-moon.txt
    > NFT Metadata:
    > {
    >   "name": "Moon Flight #1",
    >   "description": "This ticket serves are proof-of-ownership of a first-class seat on a flight to the moon.",
    >   "image": "ipfs://QmbwYvCrjnv9nKqagwYoniNzppf96za7BnateWD18mQnHX/flight-to-the-moon.txt"
    > }
    ```

Great! You've created your NFT, but it's only available to other people as long as you have you IPFS node running! If you shutdown your computer or you lose your internet connection, then no one else will be able to view your NFT! To get around this issue you should pin it to a pinning service.

## Batch Mint NFTs

Now that you can mint a single NFT, let's learn how to batch mint!

1. Let's get started by preparing an image directory for our NFTs. Create a directory called images and add 3 image files to it. Rename them 1, 2, and 3.

```shell
   mkdir img-to-the-moon \
   mv ~/Downloads/<img1.ext> img-to-the-moon/1.ext \
   mv ~/Downloads/<img1.ext> img-to-the-moon/2.ext \
   mv ~/Downloads/<img1.ext> img-to-the-moon/3.ext
```

2. Now that our images are ready, let's move forward with creating a directory to house the metadata JSON files and get some files ready.

```shell
   mkdir md-to-the-moon \
   touch md-to-the-moon/1.json \
   touch md-to-the-moon/2.json \
   touch md-to-the-moon/3.json
```

3. Next open each file and enter the some JSON from the example above, changing the number 1 to the appropriate number for each file.

4. Finally, use the minty batchMint command with the args --metadataDir & --imageDir to deploy all of the tokens described in your metadata directory.

```shell
   minty batchMint --imageDir ~/img-to-the-moon --metadataDir ~/md-to-the-moon

   > 🌿 Minted new NFTs:
   > Token IDs:             1, 2, 3
   > Failed to Mint Files:  n/a
```

## Pin your NFT

To make the data highly available without needing to run a local IPFS daemon 24/7, you can request that a [Remote Pinning Service](https://ipfs.github.io/pinning-services-api-spec) like [Pinata](https://pinata.cloud/) store a copy of your IPFS data on their IPFS nodes. You can link Pinata and Minty together by signing up to Pinata, getting an API key, and adding the key to Minty's configuration file.

### Sign up to Pinata

1. Head over to [pinata.cloud](https://pinata.cloud/).
2. Click **Sign up** and use your email address to create an account.

Pinata gives each user 1GB of free storage space, which is plenty for storing a few NFTs.

### Get an API key

Your API key allows Minty to interact with your Pinata account automatically:

1. Log into Pinata and select **API keys** from the sidebar menu.
2. Click **New Key**.
3. Expand the **Pinning Services API** dropdown and select all the options under **Pins**:

    ![The permissions options available to API keys in Pinata.](./images/pinata-api-key-permissions.png)

4. Pinata will give you an _API key_, and _API secret_, and a _JWT_:

    ```
    API Key: 43537d17e88805007086
    API Secret: 492b24f041b9120cbf8e35a247fb686793231a3d89045f1046a4f5b2d2175082
    JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiZDQ3NjM1Ny1lYWRhLTQ1ZDUtYTVmNS1mM2EwZjRmZGZmYmEiLCJlbWFpbCI6InRhaWxzbm93QHByb3Rvbm1haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZX0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjQzNTM3ZDE3ZTg4ODA1MDA3MDg2Iiwic2NvcGVkS2V5U2VjcmV0IjoiNDkyYjI0ZjA0MWI5MTIwY2JmOGUzNWEyNDdmYjY4Njc5MzIzMWEzZDg5MDQ1ZjEwNDZhNGY1YjJkMjE3NTA4MiIsImlhdCI6MTYxNjAxMzExNX0.xDV9-cPwDIQInuiB0M--XiJ8dQwwDYMch4gJbc6ogXs
    ```

    We just need the `API Key` and `API Secret`. You can ignore the `JWT` for now.
