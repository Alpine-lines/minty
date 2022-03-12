---
title: Minty Commands
description: Minty CLI Reference
date: 2022-03-12
---

# Minty Commands

## NFT Command Line Interface with IPFS integration

This project includes the original IPFS minty functionality with an additional batchMint function.
Currently, the project is a work in progress. Planned updates include;

-   continued improvements to batchMint command
    -   set all constructor args as options & support all templates
-   IPNS on top of IPFS w/ update content commands
-   integration of [mintgate](mintgate.io) for event ticketing and/or single page token gated content
-   integration of [rarible sdk](rarible.com) including additional args to deploy to Tezos or Flow
-   integration of [mintbase](mintbase.com) including commands to deploy to Near Protocol
-   add DeckBuilder template (from Melvin McGee's The Secret Sarden)

## minty help

```
    Usage: minty [options] [command]

    Options:
    -h, --help                        display help for command

    Commands:
    mint [options] <image-path>       create a new NFT from an image file
    batchMint [options]               bulk mint n NFTs and upload n images and metadata.json objects to IPFS w/ optional pinning service
    show [options] <token-id>         get info about an NFT using its token ID
    transfer <token-id> <to-address>  transfer an NFT to a new owner
    pin <token-id>                    "pin" the data for an NFT to a remote IPFS Pinning Service
    deploy [options]                  deploy an instance of the Minty NFT contract
    help [command]                    display help for command
```

## minty mint

```
Usage: minty mint [options] <image-path>

create a new NFT from an image file

Options:
  -m, --metadata <metadata>    JSON content containing NFT metadata
  -f, --file <file>            Path of  JSON file containing NFT metadata
  -n, --name <name>            The name of the NFT
  -d, --description <desc>     A description of the NFT
  -a, --attrs <attrs>          An attributes json file path for the NFT
  -e, --exUrl <exUrl>          An external URL where the NFT can be found
  -b, --background <bg>        Opensea NFT hexidecimal background color
  -a, --animation <animation>  URL where NFT animation can be found
  -v, --video <video>          URL where video can be found, i.e. https://youtube.com/<uri>
  -o, --owner <address>        The ethereum address that should own the NFT.If not provided, defaults to the first signing address.
  -h, --help                   display help for command
```

## minty batchMint

```
Usage: minty batchMint [options]

bulk mint n NFTs and upload n images and metadata.json objects to IPFS w/ optional pinning service

Options:
  -i, --imageDir <imageDir>        Image directory path where collection images are held
  -m, --metadataDir <metadataDir>  Metadata directory path where metada JSON files are held
  -c, --imgCid <imgCid>            Address where new tokens will be sent.
  -d, --mdCid <mdCid>              Address where new tokens will be sent.
  -o, --owner <owner>              Address where new tokens will be sent.
  -h, --help                       display help for command
```

## minty show

```
Usage: minty show [options] <token-id>

get info about an NFT using its token ID

Options:
  -c, --creation-info  include the creator address and block number the NFT was minted
  -h, --help           display help for command
```

## minty transfer

```
Usage: minty transfer [options] <token-id> <to-address>

transfer an NFT to a new owner

Options:
  -h, --help  display help for command
```

## minty pin

```
Usage: minty pin [options] <token-id>

"pin" the data for an NFT to a remote IPFS Pinning Service

Options:
  -h, --help  display help for command

```

## minty deploy

```
Usage: minty deploy [options]

deploy an instance of the Minty NFT contract

Options:
  -o, --output <deploy-file-path>  Path to write deployment info to (default: "minty-deployment.json")
  -f, --file <file>                Collection metadata file for contract deployment.
  -c, --contract <contract>        Contract template to deploy. Must be either Minty, OpenMinty, or PreMinty
  -n, --name <name>                The name of the token contract
  -d, --description <desc>         A description of the token contract
  -i, --image <image>              An image file path for the token contract
  -s, --symbol <symbol>            A short symbol for the tokens in this contract
  -e, --exUrl <exUrl>              The external url of the collection website
  -s, --sellerFee <fee>            The seller fee, in basis points, to be charged to opensea sellers and credited to the listed fee recipient
  -r, --recipient <recipient>      The fee recipient where seller fees will be sent following sales on opensea.
  -m, --metadata <metadata>        The token contracts metadata in JSON format
  -f, --file <file>                Path to the JSON file containing the token contracts metadata.
  -h, --help                       display help for command
```
