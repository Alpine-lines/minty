const values = require("./valuesCommon.js");

// A function in case we need to change this relationship
const tokenIndexToId = (a) => a;

// Configure the nfts

const setupOpenMinty = async (openMinty, owner) => {
    for (let i = 0; i < values.MINT_INITIAL_SUPPLY; i++) {
        const id = tokenIndexToId(i);
        await openMinty.mintToken(owner);
    }
};

// Configure the lootbox

const setupOpenMintyBundle = async (bundle, factory) => {
    await bundle.setState(
        factory.address,
        values.NUM_BUNDLE_OPTIONS,
        values.NUM_CLASSES,
        1337
    );
    // We have one token id per rarity class.
    for (let i = 0; i < values.NUM_CLASSES; i++) {
        const id = tokenIndexToId(i);
        await bundle.setTokenIdsForClass(i, [id]);
    }
    await bundle.setOptionSettings(
        values.BUNDLE_OPTION_BASIC,
        3,
        [7300, 2100, 400, 100, 50, 50],
        [0, 0, 0, 0, 0, 0]
    );
    await bundle.setOptionSettings(
        values.BUNDLE_OPTION_PREMIUM,
        5,
        [7300, 2100, 400, 100, 50, 50],
        [3, 0, 0, 0, 0, 0]
    );
    await bundle.setOptionSettings(
        values.BUNDLE_OPTION_GOLD,
        7,
        [7300, 2100, 400, 100, 50, 50],
        [3, 0, 2, 0, 1, 0]
    );
};

// Deploy and configure everything

const setupTests = async (openMinty, factory, bundle, owner) => {
    await setupOpenMinty(openMinty, owner);
    await openMinty.setApprovalForAll(factory.address, true, { from: owner });
    await openMinty.transferOwnership(factory.address);
    await setupOpenMintyBundle(bundle, factory);
    await bundle.transferOwnership(factory.address);
};

module.exports = {
    setupOpenMinty,
    setupOpenMintyBundle,
    setupTests,
};
