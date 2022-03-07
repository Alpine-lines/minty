const { ethers } = require("hardhat");

// /* Useful aliases */

// // No, we don't have easy access to web3 here.
// // And bn.js new BN() weirdly doesn't work with truffle-assertions

const toBNHex = (a) => a;

// // Configfuration for our tokens

const NUM_TOKENS = 6;
const MINT_INITIAL_SUPPLY = 1000;
const INITIAL_SUPPLY = toBNHex(
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
);

const CLASS_COMMON = 0;
const CLASS_RARE = 1;
const CLASS_EPIC = 2;
const CLASS_LEGENDARY = 3;
const CLASS_DIVINE = 4;
const CLASS_HIDDEN = 5;
const NUM_CLASSES = 6;

const BUNDLE_OPTION_BASIC = ethers.BigNumber.from(0);
const BUNDLE_OPTION_PREMIUM = ethers.BigNumber.from(1);
const BUNDLE_OPTION_GOLD = ethers.BigNumber.from(2);
const BUNDLE_OPTIONS = [
    BUNDLE_OPTION_BASIC,
    BUNDLE_OPTION_PREMIUM,
    BUNDLE_OPTION_GOLD,
];
const NUM_BUNDLE_OPTIONS = BUNDLE_OPTIONS.length;

const NO_SUCH_BUNDLE_OPTION = ethers.BigNumber.from(NUM_BUNDLE_OPTIONS + 10);
const BUNDLE_OPTION_AMOUNTS = [
    ethers.BigNumber.from(3),
    ethers.BigNumber.from(5),
    ethers.BigNumber.from(7),
];
// Note that these are token IDs, not option IDs, so they are one higher
const BUNDLE_OPTION_GUARANTEES = [
    {},
    { 0: ethers.BigNumber.from(3) },
    {
        0: ethers.BigNumber.from(3),
        2: ethers.BigNumber.from(2),
        4: ethers.BigNumber.from(1),
    },
];

module.exports = {
    NUM_TOKENS,
    MINT_INITIAL_SUPPLY,
    INITIAL_SUPPLY,
    CLASS_COMMON,
    CLASS_RARE,
    CLASS_EPIC,
    CLASS_LEGENDARY,
    CLASS_DIVINE,
    CLASS_HIDDEN,
    NUM_CLASSES,
    BUNDLE_OPTION_BASIC,
    BUNDLE_OPTION_PREMIUM,
    BUNDLE_OPTION_GOLD,
    BUNDLE_OPTIONS,
    NUM_BUNDLE_OPTIONS,
    NO_SUCH_BUNDLE_OPTION,
    BUNDLE_OPTION_AMOUNTS,
    BUNDLE_OPTION_GUARANTEES,
};
