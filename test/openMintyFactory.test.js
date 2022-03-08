const { expect } = require("chai");
const { ethers } = require("hardhat");

// const { setupTests } = require("../lib/setup.js");
const testVals = require("../lib/testValuesCommon.js");
const vals = require("../lib/valuesCommon.js");

describe("OpenMintyFactory", (accounts) => {
    const TOTAL_OPTIONS = 3;

    let owner;
    let userA;
    let userB;
    let proxyForOwner;
    let attacker;

    let OpenMinty;
    let openMinty;
    let Factory;
    let myFactory;
    let Bundle;
    let myBundle;
    let Proxy;
    let proxy;

    // To install the proxy mock and the attack contract we deploy our own
    // instances of all the classes here rather than using the ones that Truffle
    // deployed.
    before(async () => {
        [owner, userA, userB, proxyForOwner, attacker] =
            await ethers.getSigners();

        Proxy = await ethers.getContractFactory("MockProxyRegistry");
        proxy = await Proxy.deploy();
        await proxy.setProxy(owner.address, proxyForOwner.address);

        OpenMinty = await ethers.getContractFactory("OpenMinty");
        openMinty = await OpenMinty.deploy(
            "OpenMinty",
            "OMT",
            "https://example.com/contract",
            11000,
            proxy.address
        );

        Factory = await ethers.getContractFactory("OpenMintyFactory");
        myFactory = await Factory.deploy(
            proxy.address,
            openMinty.address,
            "https://example.com/",
            11000,
            3
        );

        Bundle = await ethers.getContractFactory("OpenMintyBundle");
        myBundle = Bundle.attach(await myFactory.bundleNftAddress());

        // Reentrancy = await ethers.getContractFactory("TestForReentrancyAttack");
        // attacker = await TestForReentrancyAttack.deploy();
        // await attacker.setFactoryAddress(myFactory.address);

        // await setupTests(openMinty, myFactory, myBundle, owner);
    });

    // This also tests the proxyRegistryAddress and bundleNftAddress accessors.
    describe("#constructor()", () => {
        it("should set proxyRegistryAddress to the supplied value", async () => {
            expect(await myFactory.proxyRegistryAddress()).to.equal(
                proxy.address
            );
            expect(await myFactory.bundleNftAddress()).to.equal(
                myBundle.address
            );
        });
    });

    describe("#name()", () => {
        it("should return the correct name", async () => {
            expect(await myFactory.name()).to.equal("OpenMinty Item Sale");
        });
    });

    describe("#symbol()", () => {
        it("should return the correct symbol", async () => {
            expect(await myFactory.symbol()).to.equal("OMS");
        });
    });

    describe("#supportsFactoryInterface()", () => {
        it("should return true", async () => {
            expect(await myFactory.supportsFactoryInterface()).to.equal(true);
        });
    });

    describe("#numOptions()", () => {
        it("should return the correct number of options", async () => {
            expect(await myFactory.numOptions()).to.equal(TOTAL_OPTIONS);
        });
    });

    describe("#mint()", () => {
        it("should not allow non-owner or non-operator to mint", async () => {
            await expect(
                myFactory.connect(userA).mint(vals.CLASS_COMMON, userA)
            ).to.be.reverted;
        });

        it("should allow owner to mint", async () => {
            expect(
                await myFactory
                    .connect(owner)
                    .mint(vals.CLASS_COMMON, userA.address)
            ).to.emit(openMinty, "Transfer");

            expect(await openMinty.balanceOf(userA.address)).to.equal(1);
            expect(await openMinty.balanceOf(owner.address)).to.equal(0);
        });

        it("should allow proxy to mint", async () => {
            expect(
                await myFactory
                    .connect(proxyForOwner)
                    .mint(vals.CLASS_COMMON, userA.address)
            ).to.emit(openMinty, "Transfer");

            expect(await openMinty.balanceOf(userA.address)).to.equal(2);
            expect(await openMinty.balanceOf(owner.address)).to.equal(0);
        });
    });

    describe("#tokenURI()", () => {
        it("should return the correct token URI", async () => {
            expect(await myFactory.tokenURI(1)).to.equal(
                "https://example.com/1"
            );
            expect(await myFactory.tokenURI(2)).to.equal(
                "https://example.com/2"
            );
        });
    });

    //     /**
    //      * NOTE: This check is difficult to test in a development
    //      * environment, due to the OwnableDelegateProxy. To get around
    //      * this, in order to test this function below, you'll need to:
    //      *
    //      * 1. go to OpenMintyFactory.sol, and
    //      * 2. modify _isOwnerOrProxy
    //      *
    //      * --> Modification is:
    //      *      comment out
    //      *         return owner() == _address || address(proxyRegistry.proxies(owner())) == _address;
    //      *      replace with
    //      *         return true;
    //      * Then run, you'll get the reentrant error, which passes the test
    //      **/

    // describe("Re-Entrancy Check", () => {
    //     it("Should have the correct factory address set", async () => {
    //         // assert.equal(await attacker.factoryAddress(), myFactory.address);
    //     });

    //         // With unmodified code, this fails with:
    //         //   OpenMintyFactory#_mint: CANNOT_MINT_MORE
    //         // which is the correct behavior (no reentrancy) for the wrong reason
    //         // (the attacker is not the owner or proxy).

    //         xit("Minting from factory should disallow re-entrancy attack", async () => {
    //             await truffleAssert.passes(
    //                 myFactory.mint(1, userA.address, 1, "0x0", { from: owner })
    //             );
    //             await truffleAssert.passes(
    //                 myFactory.mint(1, userA.address, 1, "0x0", { from: userA.address })
    //             );
    //             await truffleAssert.fails(
    //                 myFactory.mint(1, attacker.address, 1, "0x0", {
    //                     from: attacker.address,
    //                 }),
    //                 truffleAssert.ErrorType.revert,
    //                 "ReentrancyGuard: reentrant call"
    //             );
    // });
    // });
});
