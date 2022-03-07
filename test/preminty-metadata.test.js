const { expect } = require("chai");
const { ethers } = require("hardhat");
const { default: Web3 } = require("web3");

describe("PreMinty", function () {
    let PreMinty;
    let preMinty;
    let deployer;
    let minter;
    let admin;
    let customer;

    const id1 = 1;

    const uri1 = "https://example.com/1.json";

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [deployer, minter, admin, customer] = await ethers.getSigners();

        const mockProxyFactory = await ethers.getContractFactory(
            "MockProxyRegistry",
            deployer
        );
        const mockProxy = await mockProxyFactory.deploy();

        expect(mockProxy.address).to.properAddress;

        PreMinty = await ethers.getContractFactory("PreMinty");

        preMinty = await PreMinty.deploy(
            "Foo",
            "F",
            [minter.address, admin.address],
            "https://example.com/",
            11000,
            mockProxy.address
        );

        // [deployer, minter, admin, customer] = await ethers.getSigners();

        await preMinty.deployed();
    });

    // it("correctly checks all the supported interfaces", async function () {
    //     expect(await preMinty.supportsInterface("0x80ac58cd")).to.equal(true);
    //     expect(await preMinty.supportsInterface("0x5b5e139f")).to.equal(true);
    //     expect(await preMinty.supportsInterface("0x780e9d63")).to.equal(false);
    // });

    it("returns the correct contract name", async function () {
        expect(await preMinty.name()).to.equal("Foo");
    });

    it("returns the correct contract symbol", async function () {
        expect(await preMinty.symbol()).to.equal("F");
    });

    it("returns the correct contract symbol", async function () {
        expect(await preMinty.contractURI()).to.equal("https://example.com/");
    });

    it("correctly mints a NFT", async function () {
        expect(
            await preMinty.connect(minter).mintToken(customer.address, uri1)
        ).to.emit(preMinty, "Transfer");
        expect(await preMinty.tokenURI(id1)).to.equal(uri1);
    });

    it("throws when trying to get URI of invalid NFT ID", async function () {
        await expect(preMinty.tokenURI()).to.be.reverted;
    });

    it("correctly burns a NFT", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        expect(await preMinty.connect(admin).burn(id1)).to.emit(
            preMinty,
            "Transfer"
        );
        expect(await preMinty.balanceOf(customer.address)).to.equal(0);
        await expect(preMinty.ownerOf(id1)).to.be.reverted;
        await expect(preMinty.tokenURI(id1)).to.be.reverted;
    });
});
