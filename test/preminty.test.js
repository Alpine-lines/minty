const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PreMinty", function () {
    let PreMinty;
    let preMinty;
    let deployer;
    let minter;
    let admin;
    let customer;
    let customer2;
    let customer3;

    const id1 = 1;
    const id2 = 2;

    const uri1 = "https://example.com/1.json";
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [deployer, minter, admin, customer, customer2, customer3] =
            await ethers.getSigners();

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
            [minter.address, admin.address],
            "http://bafybeifz7tu5nxbi4fm4gh2skuwhxbmgn4wmmnyfat3cvu4alsl63l2bbe.ipfs.localhost:8080/metadata.json",
            11000,
            mockProxy.address
        );
    });

    // it("correctly checks all the supported interfaces", async function () {
    //     expect(await preMinty.supportsInterface("0x80ac58cd")).to.equal(true);
    //     expect(await preMinty.supportsInterface("0x5b5e139f")).to.equal(false);
    // });

    it("correctly mints a NFT", async function () {
        expect(
            await preMinty.connect(minter).mintToken(customer.address, uri1)
        ).to.emit(preMinty, "Transfer");
        expect(await preMinty.balanceOf(customer.address)).to.equal(1);
    });

    it("returns correct balanceOf", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        expect(await preMinty.balanceOf(customer.address)).to.equal(1);
        await preMinty
            .connect(minter)
            .mintToken(customer.address, "https://example.com/2.json");
        expect(await preMinty.balanceOf(customer.address)).to.equal(2);
    });

    it("throws when trying to get count of NFTs owned by 0x0 address", async function () {
        await expect(preMinty.balanceOf(ZERO_ADDRESS)).to.be.reverted;
    });

    it("throws when trying to mint NFT to 0x0 address", async function () {
        await expect(preMinty.connect(minter).mintToken(ZERO_ADDRESS, uri1)).to
            .be.reverted;
    });

    it("finds the correct owner of preMinty id", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        expect(await preMinty.ownerOf(id1)).to.equal(
            customer.address,
            "https://example.com/2.json"
        );
    });

    it("correctly approves account", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        expect(
            await preMinty.connect(customer).approve(customer3.address, id1)
        ).to.emit(preMinty, "Approval");
        expect(await preMinty.getApproved(id1)).to.equal(customer3.address);
    });

    it("correctly cancels approval", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        await preMinty.connect(customer).approve(customer3.address, id1);
        await preMinty
            .connect(customer)
            .setApprovalForAll(customer3.address, false);
        await preMinty.connect(customer).approve(ZERO_ADDRESS, id1);
        expect(await preMinty.getApproved(id1)).to.equal(ZERO_ADDRESS);
    });

    it("throws when trying to get approval of non-existing NFT id", async function () {
        await expect(preMinty.getApproved(id1)).to.be.reverted;
    });

    it("throws when trying to approve NFT ID from a third party", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        await expect(preMinty.connect(customer3).approve(customer3.address)).to
            .be.reverted;
    });

    it("correctly sets an operator", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        expect(
            await preMinty
                .connect(customer)
                .setApprovalForAll(customer3.address, true)
        ).to.emit(preMinty, "ApprovalForAll");
        expect(
            await preMinty.isApprovedForAll(customer.address, customer3.address)
        ).to.equal(true);
    });

    it("correctly sets then cancels an operator", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        await preMinty
            .connect(customer)
            .setApprovalForAll(customer3.address, true);
        await preMinty
            .connect(customer)
            .setApprovalForAll(customer3.address, false);
        expect(
            await preMinty.isApprovedForAll(customer.address, customer3.address)
        ).to.equal(false);
    });

    it("correctly transfers NFT from owner", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        expect(
            await preMinty
                .connect(customer)
                .transferFrom(customer.address, customer3.address, id1)
        ).to.emit(preMinty, "Transfer");
        expect(await preMinty.balanceOf(customer.address)).to.equal(0);
        expect(await preMinty.balanceOf(customer3.address)).to.equal(1);
        expect(await preMinty.ownerOf(id1)).to.equal(customer3.address);
    });

    it("correctly transfers NFT from approved address", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        await preMinty.connect(customer).approve(customer3.address, id1);
        await preMinty
            .connect(customer3)
            .transferFrom(customer.address, customer2.address, id1);
        expect(await preMinty.balanceOf(customer.address)).to.equal(0);
        expect(await preMinty.balanceOf(customer2.address)).to.equal(1);
        expect(await preMinty.ownerOf(id1)).to.equal(customer2.address);
    });

    it("correctly transfers NFT as operator", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        await preMinty
            .connect(customer)
            .setApprovalForAll(customer3.address, true);
        await preMinty
            .connect(customer3)
            .transferFrom(customer.address, customer2.address, id1);
        expect(await preMinty.balanceOf(customer.address)).to.equal(0);
        expect(await preMinty.balanceOf(customer2.address)).to.equal(1);
        expect(await preMinty.ownerOf(id1)).to.equal(customer2.address);
    });

    it("throws when trying to transfer NFT as an address that is not owner, approved or operator", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        await expect(
            preMinty
                .connect(customer3)
                .transferFrom(customer.address, customer2.address, id1)
        ).to.be.reverted;
    });

    it("throws when trying to transfer NFT to a zero address", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        await expect(
            preMinty
                .connect(customer)
                .transferFrom(customer.address, ZERO_ADDRESS, id1)
        ).to.be.reverted;
    });

    it("throws when trying to transfer an invalid NFT", async function () {
        await expect(
            preMinty
                .connect(customer)
                .transferFrom(customer.address, customer2.address, id1)
        ).to.be.reverted;
    });

    it("throws when trying to transfer an invalid NFT", async function () {
        await expect(
            preMinty
                .connect(customer)
                .transferFrom(customer.address, customer2.address, id1)
        ).to.be.reverted;
    });

    it("correctly safe transfers NFT from owner", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        expect(
            await preMinty
                .connect(customer)
                ["safeTransferFrom(address,address,uint256)"](
                    customer.address,
                    customer2.address,
                    id1
                )
        ).to.emit(preMinty, "Transfer");
        expect(await preMinty.balanceOf(customer.address)).to.equal(0);
        expect(await preMinty.balanceOf(customer2.address)).to.equal(1);
        expect(await preMinty.ownerOf(id1)).to.equal(customer2.address);
    });

    it("throws when trying to safe transfers NFT from owner to a smart contract", async function () {
        await preMinty.connect(minter).mintToken(customer.address, uri1);
        await expect(
            preMinty
                .connect(customer)
                ["safeTransferFrom(address,address,uint256)"](
                    customer.address,
                    preMinty.address,
                    id1
                )
        ).to.be.reverted;
    });

    // it("correctly safe transfers NFT from owner to smart contract that can receive NFTs", async function () {
    //     const tokenReceiverContract = await ethers.getContractFactory(
    //         "preMintyReceiverTestMock"
    //     );
    //     const tokenReceiver = await tokenReceiverContract.deploy();
    //     await tokenReceiver.deployed();

    //     await preMinty.connect(minter).mintToken(customer.address);
    //     await preMinty
    //         .connect(customer)
    //         ["safeTransferFrom(address,address,uint256)"](
    //             customer.address uri1,
    //             tokenReceiver.address,
    //             id1
    //         );
    //     expect(await preMinty.balanceOf(customer.address)).to.equal(0);
    //     expect(await preMinty.balanceOf(tokenReceiver.address)).to.equal(1);
    //     expect(await preMinty.ownerOf(id1)).to.equal(tokenReceiver.address);
    // });

    // it("correctly safe transfers NFT from owner to smart contract that can receive NFTs with data", async function () {
    //     const tokenReceiverContract = await ethers.getContractFactory(
    //         "preMintyReceiverTestMock"
    //     );
    //     const tokenReceiver = await tokenReceiverContract.deploy();
    //     await tokenReceiver.deployed();

    //     await preMinty.connect(minter).mintToken(customer.address);
    //     expect(
    //         await preMinty
    //             .connect(customer)
    //             ["safeTransferFrom(address,address,uint256,bytes)"](
    //                 customer.address uri1,
    //                 tokenReceiver.address,
    //                 id1,
    //                 "0x01"
    //             )
    //     ).to.emit(preMinty, "Transfer");
    //     expect(await preMinty.balanceOf(customer.address)).to.equal(0);
    //     expect(await preMinty.balanceOf(tokenReceiver.address)).to.equal(1);
    //     expect(await preMinty.ownerOf(id1)).to.equal(tokenReceiver.address);
    // });

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

    it("throws when trying to burn non existent NFT", async function () {
        await expect(preMinty.connect(admin).burn(id1)).to.be.reverted;
    });

    // it.only('safeTransfer does not call onERC721Received to constructing contract', async function() {
    //   const sendsToSelfOnConstructContract = await ethers.getContractFactory('SendsToSelfOnConstruct');
    //   const sendsToSelfOnConstruct = await sendsToSelfOnConstructContract.deploy();
    //   expect(await sendsToSelfOnConstruct.deployed().deployTransaction).to.emit(sendsToSelfOnConstructContract, 'Transfer');

    //   console.log('here');
    //   // console.log(log);
    //   // console.log(sendsToSelfOnConstruct); No Receive event, 2x Transfer
    // });
});
