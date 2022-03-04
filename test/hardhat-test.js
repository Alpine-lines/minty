const { expect } = require("chai");
const { ethers } = require("hardhat");
const { default: Web3 } = require("web3");

describe("PreMinty", function () {
    let PreMinty;
    let preMinty;
    let deployer;
    let other;

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [deployer, minter, admin, customer, other] = await ethers.getSigners();

        const mockProxyFactory = await ethers.getContractFactory(
            "MockProxyRegistry",
            deployer
        );
        const mockProxy = await mockProxyFactory.deploy();

        expect(mockProxy.address).to.properAddress;

        PreMinty = await ethers.getContractFactory("PreMinty");
        preMinty = await PreMinty.deploy(
            "PreMinty!",
            "PMNT",
            [minter],
            [admin],
            "http://bafybeifz7tu5nxbi4fm4gh2skuwhxbmgn4wmmnyfat3cvu4alsl63l2bbe.ipfs.localhost:8080/metadata.json",
            11000,
            mockProxy.address
        );
        await preMinty.deployed();
    });
    describe("Functionality", () => {
        it("Should fetch the right contractURI and totalySupply", async () => {
            expect(await preMinty.contractURI()).to.equal(
                "http://bafybeifz7tu5nxbi4fm4gh2skuwhxbmgn4wmmnyfat3cvu4alsl63l2bbe.ipfs.localhost:8080/metadata.json"
            );
            expect(await preMinty.totalSupply()).to.equal(0);
        });
        it("Should mint a token and set the correct URI", async function () {
            await preMinty.mintToken(
                "ipfs://QmZvYPzPqMtxg4YrWHv1ojgr5d2BZP7Psm7agGrVTbA3GJ/metadata.json"
            );
            expect(await preMinty.tokenURI(1)).to.equal(
                "ipfs://QmZvYPzPqMtxg4YrWHv1ojgr5d2BZP7Psm7agGrVTbA3GJ/metadata.json"
            );
            expect(await preMinty.totalSupply()).to.equal(1);
            expect(await preMinty.balanceOf(deployer.address)).to.equal(1);
            expect(await preMinty.ownerOf(1)).to.equal(deployer.address);
        });
        it("Should transfer the token", async function () {
            await preMinty.mintToken(
                "ipfs://QmZvYPzPqMtxg4YrWHv1ojgr5d2BZP7Psm7agGrVTbA3GJ/metadata.json"
            );
            await preMinty.transferFrom(deployer.address, other.address, 1);
            expect(await preMinty.tokenURI(1)).to.equal(
                "ipfs://QmZvYPzPqMtxg4YrWHv1ojgr5d2BZP7Psm7agGrVTbA3GJ/metadata.json"
            );
            expect(await preMinty.totalSupply()).to.equal(1);
            expect(await preMinty.balanceOf(deployer.address)).to.equal(0);
            expect(await preMinty.balanceOf(other.address)).to.equal(1);
            expect(await preMinty.ownerOf(1)).to.equal(other.address);
        });
    });
});
