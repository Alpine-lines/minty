const { expect } = require("chai");
const { ethers } = require("hardhat");
const { default: Web3 } = require("web3");

describe("AMinty", function () {
    let AMinty;
    let aMinty;
    let deployer;
    let admin;
    let customer1;
    let customer2;

    const id1 = 1;

    const uri = "ipfs://<CID>/";

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [deployer, admin, customer1, customer2] = await ethers.getSigners();

        // const mockProxyFactory = await ethers.getContractFactory(
        //     "MockProxyRegistry",
        //     deployer
        // );
        // const mockProxy = await mockProxyFactory.deploy();

        // expect(mockProxy.address).to.properAddress;

        AMinty = await ethers.getContractFactory("AMinty");
        aMinty = await AMinty.deploy(
            "Foo",
            "F",
            uri + "contract",
            uri
            // 11000,
            // mockProxy.address
        );
    });

    // it("correctly checks all the supported interfaces", async function () {
    //     expect(await aMinty.supportsInterface("0x80ac58cd")).to.equal(true);
    //     expect(await aMinty.supportsInterface("0x5b5e139f")).to.equal(true);
    //     expect(await aMinty.supportsInterface("0x780e9d63")).to.equal(false);
    // });

    it("returns the correct contract name", async function () {
        expect(await aMinty.name()).to.equal("Foo");
    });

    it("returns the correct contract symbol", async function () {
        expect(await aMinty.symbol()).to.equal("F");
    });

    it("returns the correct contract symbol", async function () {
        expect(await aMinty.contractURI()).to.equal(uri + "contract");
    });

    it("returns correct balanceOf", async function () {
        await aMinty.connect(customer1).mint(5);
        expect(await aMinty.balanceOf(customer1.address)).to.equal(5);
    });

    it("throws when trying to get count of NFTs owned by 0x0 address", async function () {
        await expect(aMinty.balanceOf(ZERO_ADDRESS)).to.be.reverted;
    });

    it("finds the correct owner of token @ id", async function () {
        await aMinty.connect(customer1).mint(5);
        // for (let i = 1; i++; i <= 5) {}
        expect(await aMinty.ownerOf(3)).to.equal(customer1.address);
    });

    it("correctly approves account", async function () {
        await aMinty.connect(customer1).mint(5);
        expect(
            await aMinty.connect(customer1).approve(customer2.address, id1)
        ).to.emit(aMinty, "Approval");
        expect(await aMinty.getApproved(id1)).to.equal(customer2.address);
    });

    it("correctly cancels approval", async function () {
        await aMinty.connect(customer1).mint(5);
        await aMinty.connect(customer1).approve(customer2.address, id1);
        await aMinty
            .connect(customer1)
            .setApprovalForAll(customer2.address, false);
        await aMinty.connect(customer1).approve(ZERO_ADDRESS, id1);
        expect(await aMinty.getApproved(id1)).to.equal(ZERO_ADDRESS);
    });

    it("throws when trying to get approval of non-existing NFT id", async function () {
        await expect(aMinty.getApproved(id1)).to.be.reverted;
    });

    it("throws when trying to approve NFT ID from a third party", async function () {
        await aMinty.connect(customer1).mint(5);
        await expect(aMinty.connect(customer2).approve(customer2.address)).to.be
            .reverted;
    });

    it("correctly sets an operator", async function () {
        await aMinty.connect(customer1).mint(5);
        expect(
            await aMinty
                .connect(customer1)
                .setApprovalForAll(customer2.address, true)
        ).to.emit(aMinty, "ApprovalForAll");
        expect(
            await aMinty.isApprovedForAll(customer1.address, customer2.address)
        ).to.equal(true);
    });

    it("correctly sets then cancels an operator", async function () {
        await aMinty.connect(customer1).mint(5);
        await aMinty
            .connect(customer1)
            .setApprovalForAll(customer2.address, true);
        await aMinty
            .connect(customer1)
            .setApprovalForAll(customer2.address, false);
        expect(
            await aMinty.isApprovedForAll(customer1.address, customer2.address)
        ).to.equal(false);
    });

    it("correctly transfers NFT from owner", async function () {
        await aMinty.connect(customer1).mint(5);
        expect(
            await aMinty
                .connect(customer1)
                .transferFrom(customer1.address, customer2.address, id1)
        ).to.emit(aMinty, "Transfer");
        expect(await aMinty.balanceOf(customer1.address)).to.equal(4);
        expect(await aMinty.balanceOf(customer2.address)).to.equal(1);
        expect(await aMinty.ownerOf(id1)).to.equal(customer2.address);
    });

    it("correctly transfers NFT from approved address", async function () {
        await aMinty.connect(customer1).mint(5);
        await aMinty.connect(customer1).approve(customer2.address, id1);
        await aMinty
            .connect(customer2)
            .transferFrom(customer1.address, customer2.address, id1);
        expect(await aMinty.balanceOf(customer1.address)).to.equal(4);
        expect(await aMinty.balanceOf(customer2.address)).to.equal(1);
        expect(await aMinty.ownerOf(id1)).to.equal(customer2.address);
    });

    it("correctly transfers NFT as operator", async function () {
        await aMinty.connect(customer1).mint(5);
        await aMinty
            .connect(customer1)
            .setApprovalForAll(customer2.address, true);
        await aMinty
            .connect(customer2)
            .transferFrom(customer1.address, customer2.address, id1);
        expect(await aMinty.balanceOf(customer1.address)).to.equal(4);
        expect(await aMinty.balanceOf(customer2.address)).to.equal(1);
        expect(await aMinty.ownerOf(id1)).to.equal(customer2.address);
    });

    it("throws when trying to transfer NFT as an address that is not owner, approved or operator", async function () {
        await aMinty.connect(customer1).mint(5);
        await expect(
            aMinty
                .connect(customer2)
                .transferFrom(customer1.address, customer2.address, id1)
        ).to.be.reverted;
    });

    it("throws when trying to transfer NFT to a zero address", async function () {
        await aMinty.connect(customer1).mint(5);
        await expect(
            aMinty
                .connect(customer1)
                .transferFrom(customer1.address, ZERO_ADDRESS, id1)
        ).to.be.reverted;
    });

    it("throws when trying to transfer an invalid NFT", async function () {
        await expect(
            aMinty
                .connect(customer1)
                .transferFrom(customer1.address, customer2.address, id1)
        ).to.be.reverted;
    });

    it("throws when trying to transfer an invalid NFT", async function () {
        await expect(
            aMinty
                .connect(customer1)
                .transferFrom(customer1.address, customer2.address, id1)
        ).to.be.reverted;
    });

    it("correctly safe transfers NFT from owner", async function () {
        await aMinty.connect(customer1).mint(5);
        expect(
            await aMinty
                .connect(customer1)
                ["safeTransferFrom(address,address,uint256)"](
                    customer1.address,
                    customer2.address,
                    id1
                )
        ).to.emit(aMinty, "Transfer");
        expect(await aMinty.balanceOf(customer1.address)).to.equal(4);
        expect(await aMinty.balanceOf(customer2.address)).to.equal(1);
        expect(await aMinty.ownerOf(id1)).to.equal(customer2.address);
    });

    it("throws when trying to safe transfers NFT from owner to a smart contract", async function () {
        await aMinty.connect(customer2).mint(5);
        await expect(
            aMinty
                .connect(customer2)
                ["safeTransferFrom(address,address,uint256)"](
                    customer2.address,
                    aMinty.address,
                    id1
                )
        ).to.be.reverted;
    });

    it("correctly mints a NFT", async function () {
        expect(await aMinty.connect(customer1).mint(5)).to.emit(
            aMinty,
            "Transfer"
        );
        expect(await aMinty.balanceOf(customer1.address)).to.equal(5);
        expect(await aMinty.tokenURI(id1)).to.equal(uri + "1");
    });

    it("throws when trying to get URI of invalid NFT ID", async function () {
        await expect(aMinty.tokenURI()).to.be.reverted;
    });

    it("correctly burns a NFT", async function () {
        await aMinty.connect(customer2).mint(3);
        expect(await aMinty.balanceOf(customer2.address)).to.equal(3);
        expect(await aMinty.connect(customer2).burn(id1)).to.emit(
            aMinty,
            "Transfer"
        );
        expect(await aMinty.balanceOf(customer2.address)).to.equal(2);
        await expect(aMinty.ownerOf(id1)).to.be.reverted;
        await expect(aMinty.tokenURI(id1)).to.be.reverted;
    });
});
