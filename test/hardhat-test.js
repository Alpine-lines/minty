const { expect } = require("chai");
const { ethers } = require("hardhat");
const { default: Web3 } = require("web3");

let preMinty;
let preMintyFactory;
let deployer;
let other;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("PreMinty", function () {
  beforeEach(async function () {
    const [deployer, other] = await ethers.getSigners();

    const mockProxyFactory = await ethers.getContractFactory(
      "MockProxyRegistry",
      deployer
    );
    const mockProxy = await mockProxyFactory.deploy();

    expect(mockProxy.address).to.properAddress;

    const PreMinty = await ethers.getContractFactory("PreMinty");
    const preMinty = await PreMinty.deploy(
      "PreMinty!",
      "PMNT",
      "http://localhost:8080/ipfs/bafybeid5tuti2jodimmfbzql3jfwdeojtebei3f7bhb6ft47qbmpa4lf24/metadata.json",
      mockProxy.address
    );

    await preMinty.deployed();
  });
  it("Should return the new contract URI", async function () {
    console.log(await preMinty.contractURI());
    expect(await preMinty.contractURI()).to.equal(
      "http://localhost:8080/ipfs/bafybeid5tuti2jodimmfbzql3jfwdeojtebei3f7bhb6ft47qbmpa4lf24/metadata.json"
    );
    expect(await preMinty.totalSupply()).to.equal(0);
  });
  it("Should mint a token and set the correct URI", async function () {
    expect(
      await preMinty.mintToken("ipfs://0x0000000000000/metadata.json")
    ).to.equal(1);
    expect(
      await preMinty
        .tokenURI(1)
        .to.equal("ipfs://0x0000000000000/metadata.json")
    );
    expect(await preMinty.totalSupply().to.equal(1));
  });
  it("Should not be able to change the token URI", async function () {
    expect(
      await preMinty
        ._setTokenURI("ipfs://0x11111111111/metadata.json")
        .to.toBeReverted()
    );
    expect(
      await preMinty
        .tokenURI(1)
        .to.equal("ipfs://0x0000000000000/metadata.json")
    );
  });
});
