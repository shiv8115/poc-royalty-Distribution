// import {ethers, getNamedAccounts,deployments} from 'hardhat';
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { expect } from "chai";
import { splitterAbi } from "./Splitter.abi";
import { BigNumber } from "ethers";

async function royaltyDistribution() {
  await deployments.fixture([
    "TestERC1155",
    "TestERC721",
    "RoyaltyEngineV1",
    "TestERC20",
    "MockMarketplace",
    "Catalyst",
  ]);
  const {
    deployer,
    seller,
    buyer,
    commonRoyaltyReceiver,
    royaltyReceiver,
    user,
    commonRoyaltyReceiver2,
  } = await getNamedAccounts();
  const ERC1155 = await ethers.getContract("TestERC1155");
  const ERC721 = await ethers.getContract("TestERC721");
  const ERC20 = await ethers.getContract("TestERC20");
  const manager = await ethers.getContract("Manager");
  const mockMarketplace = await ethers.getContract("MockMarketplace");
  const RoyaltyRegistry = await ethers.getContract("RoyaltyRegistry");
  const RoyaltyEngineV1 = await ethers.getContract("RoyaltyEngineV1");
  const catalyst = await ethers.getContract("Catalyst");

  await RoyaltyEngineV1.initialize(deployer, RoyaltyRegistry.address);
  const ERC1155AsSeller = ERC1155.connect(await ethers.getSigner(seller));
  const ERC20AsBuyer = ERC20.connect(await ethers.getSigner(buyer));
  const managerAsOwner = manager.connect(await ethers.getSigner(deployer));

  return {
    ERC1155,
    ERC721,
    ERC20,
    manager,
    mockMarketplace,
    ERC1155AsSeller,
    ERC20AsBuyer,
    deployer,
    seller,
    buyer,
    user,
    commonRoyaltyReceiver,
    royaltyReceiver,
    RoyaltyRegistry,
    managerAsOwner,
    commonRoyaltyReceiver2,
    catalyst,
  };
}

describe("Token", () => {
  it("should split ERC20 using EIP2981", async function () {
    const {
      ERC1155,
      ERC20,
      manager,
      mockMarketplace,
      ERC20AsBuyer,
      deployer,
      seller,
      buyer,
      commonRoyaltyReceiver,
      royaltyReceiver,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(deployer)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );
    await ERC20.mint(buyer, 1000000);
    await ERC20AsBuyer.approve(mockMarketplace.address, 1000000);
    expect(await ERC1155.balanceOf(seller, 1)).to.be.equals(1);
    await mockMarketplace.distributeRoyaltyEIP2981(
      1000000,
      ERC20.address,
      ERC1155.address,
      1,
      buyer
    );
    const splitter = await manager._creatorRoyaltiesSplitter(deployer);

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    const splitterContract = await ethers.getContractAt(splitterAbi, splitter);

    const balance = await ERC20.balanceOf(splitter);

    expect(balance).to.be.equal(1000000 * (_defaultRoyaltyBPS / 10000));

    await splitterContract
      .connect(await ethers.getSigner(royaltyReceiver))
      .splitERC20Tokens(ERC20.address);

    const balanceRoyaltyReceiver = await ERC20.balanceOf(royaltyReceiver);
    const balanceCommonRoyaltyReceiver = await ERC20.balanceOf(
      commonRoyaltyReceiver
    );

    expect(balanceRoyaltyReceiver).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
    expect(balanceCommonRoyaltyReceiver).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
  });

  it("should split ERC20 using RoyaltyEngine", async function () {
    const {
      ERC1155,
      ERC20,
      mockMarketplace,
      ERC20AsBuyer,
      deployer,
      seller,
      buyer,
      commonRoyaltyReceiver,
      royaltyReceiver,
      RoyaltyRegistry,
    } = await royaltyDistribution();

    await RoyaltyRegistry.connect(
      await ethers.getSigner(deployer)
    ).setRoyaltyLookupAddress(ERC1155.address, ERC1155.address);
    await ERC1155.connect(await ethers.getSigner(deployer)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );
    await ERC20.mint(buyer, 1000000);
    await ERC20AsBuyer.approve(mockMarketplace.address, 1000000);
    expect(await ERC1155.balanceOf(seller, 1)).to.be.equals(1);
    await mockMarketplace.distributeRoyaltyRoyaltyEngine(
      1000000,
      ERC20.address,
      ERC1155.address,
      1,
      buyer
    );

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    const balanceRoyaltyReceiver = await ERC20.balanceOf(royaltyReceiver);

    const balanceCommonRoyaltyReceiver = await ERC20.balanceOf(
      commonRoyaltyReceiver
    );

    expect(balanceRoyaltyReceiver).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
    expect(balanceCommonRoyaltyReceiver).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
  });

  it("should split ETh using EIP2981", async function () {
    const {
      ERC1155,
      ERC20,
      mockMarketplace,
      deployer,
      seller,
      buyer,
      commonRoyaltyReceiver,
      royaltyReceiver,
      user,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(deployer)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );
    await ERC1155.connect(await ethers.getSigner(seller)).setApprovalForAll(
      mockMarketplace.address,
      true
    );
    expect(await ERC1155.balanceOf(seller, 1)).to.be.equals(1);
    const balanceRoyaltyReceiver = await ethers.provider.getBalance(
      royaltyReceiver
    );
    const balanceCommonRoyaltyReceiver = await ethers.provider.getBalance(
      commonRoyaltyReceiver
    );
    const value = ethers.utils.parseUnits("1000", "ether");
    await mockMarketplace
      .connect(await ethers.getSigner(user))
      .distributeRoyaltyEIP2981(0, ERC20.address, ERC1155.address, 1, buyer, {
        value: value,
      });

    const balanceRoyaltyReceiverNew = await ethers.provider.getBalance(
      royaltyReceiver
    );
    const balanceCommonRoyaltyReceiverNew = await ethers.provider.getBalance(
      commonRoyaltyReceiver
    );

    expect(balanceRoyaltyReceiverNew.sub(balanceRoyaltyReceiver)).to.be.equal(
      balanceCommonRoyaltyReceiverNew.sub(balanceCommonRoyaltyReceiver)
    );

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    expect(
      balanceRoyaltyReceiverNew
        .sub(balanceRoyaltyReceiver)
        .add(balanceCommonRoyaltyReceiverNew.sub(balanceCommonRoyaltyReceiver))
    ).to.be.equal(
      value.mul(BigNumber.from(_defaultRoyaltyBPS)).div(BigNumber.from(10000))
    );
  });

  it("should split ETh using RoyaltyEngine", async function () {
    const {
      ERC1155,
      ERC20,
      mockMarketplace,
      deployer,
      seller,
      buyer,
      commonRoyaltyReceiver,
      royaltyReceiver,
      user,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(deployer)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );
    await ERC1155.connect(await ethers.getSigner(seller)).setApprovalForAll(
      mockMarketplace.address,
      true
    );
    expect(await ERC1155.balanceOf(seller, 1)).to.be.equals(1);
    const balanceRoyaltyReceiver = await ethers.provider.getBalance(
      royaltyReceiver
    );
    const balanceCommonRoyaltyReceiver = await ethers.provider.getBalance(
      commonRoyaltyReceiver
    );
    const value = ethers.utils.parseUnits("1000", "ether");
    await mockMarketplace
      .connect(await ethers.getSigner(user))
      .distributeRoyaltyRoyaltyEngine(
        0,
        ERC20.address,
        ERC1155.address,
        1,
        buyer,
        {
          value: value,
        }
      );

    const balanceRoyaltyReceiverNew = await ethers.provider.getBalance(
      royaltyReceiver
    );
    const balanceCommonRoyaltyReceiverNew = await ethers.provider.getBalance(
      commonRoyaltyReceiver
    );

    expect(balanceRoyaltyReceiverNew.sub(balanceRoyaltyReceiver)).to.be.equal(
      balanceCommonRoyaltyReceiverNew.sub(balanceCommonRoyaltyReceiver)
    );

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    expect(
      balanceRoyaltyReceiverNew
        .sub(balanceRoyaltyReceiver)
        .add(balanceCommonRoyaltyReceiverNew.sub(balanceCommonRoyaltyReceiver))
    ).to.be.equal(
      value.mul(BigNumber.from(_defaultRoyaltyBPS)).div(BigNumber.from(10000))
    );
  });

  it("creator should receive Royalty in Eth to new address set by the admin", async function () {
    const {
      ERC1155,
      ERC20,
      manager,
      mockMarketplace,
      deployer,
      seller,
      buyer,
      commonRoyaltyReceiver,
      royaltyReceiver,
      user,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter = await manager._creatorRoyaltiesSplitter(seller);

    const splitterContract = await ethers.getContractAt(splitterAbi, splitter);

    expect(await splitterContract._recipient()).to.be.equal(royaltyReceiver);

    const tnx = await ERC1155.connect(
      await ethers.getSigner(seller)
    ).setRoyaltyRecipient(seller);

    await tnx.wait();

    expect(await splitterContract._recipient()).to.be.equal(seller);

    const balanceSeller = await ethers.provider.getBalance(seller);
    const balanceCommonRoyaltyReceiver = await ethers.provider.getBalance(
      commonRoyaltyReceiver
    );
    const value = ethers.utils.parseUnits("1000", "ether");
    await mockMarketplace
      .connect(await ethers.getSigner(user))
      .distributeRoyaltyRoyaltyEngine(
        0,
        ERC20.address,
        ERC1155.address,
        1,
        buyer,
        {
          value: value,
        }
      );

    const balanceSellerNew = await ethers.provider.getBalance(seller);
    const balanceCommonRoyaltyReceiverNew = await ethers.provider.getBalance(
      commonRoyaltyReceiver
    );

    expect(balanceSellerNew.sub(balanceSeller)).to.be.equal(
      balanceCommonRoyaltyReceiverNew.sub(balanceCommonRoyaltyReceiver)
    );

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    expect(
      balanceSellerNew
        .sub(balanceSeller)
        .add(balanceCommonRoyaltyReceiverNew.sub(balanceCommonRoyaltyReceiver))
    ).to.be.equal(
      value.mul(BigNumber.from(_defaultRoyaltyBPS)).div(BigNumber.from(10000))
    );
  });

  it("common recipient should receive Royalty in Eth to new address set by the owner on registry", async function () {
    const {
      ERC1155,
      ERC20,
      mockMarketplace,
      commonRoyaltyReceiver2,
      managerAsOwner,
      seller,
      buyer,
      commonRoyaltyReceiver,
      royaltyReceiver,
      user,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    expect(await managerAsOwner.commonRecipient()).to.be.equal(
      commonRoyaltyReceiver
    );

    await managerAsOwner.setRecipient(commonRoyaltyReceiver2);

    expect(await managerAsOwner.commonRecipient()).to.be.equal(
      commonRoyaltyReceiver2
    );

    const balanceRoyaltyReceiver = await ethers.provider.getBalance(
      royaltyReceiver
    );
    const balanceCommonRoyaltyReceiver2 = await ethers.provider.getBalance(
      commonRoyaltyReceiver2
    );
    const value = ethers.utils.parseUnits("1000", "ether");
    await mockMarketplace
      .connect(await ethers.getSigner(user))
      .distributeRoyaltyRoyaltyEngine(
        0,
        ERC20.address,
        ERC1155.address,
        1,
        buyer,
        {
          value: value,
        }
      );

    const balanceRoyaltyReceiverNew = await ethers.provider.getBalance(
      royaltyReceiver
    );
    const balanceCommonRoyaltyReceiver2New = await ethers.provider.getBalance(
      commonRoyaltyReceiver2
    );

    expect(balanceRoyaltyReceiverNew.sub(balanceRoyaltyReceiver)).to.be.equal(
      balanceCommonRoyaltyReceiver2New.sub(balanceCommonRoyaltyReceiver2)
    );

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    expect(
      balanceRoyaltyReceiverNew
        .sub(balanceRoyaltyReceiver)
        .add(
          balanceCommonRoyaltyReceiver2New.sub(balanceCommonRoyaltyReceiver2)
        )
    ).to.be.equal(
      value.mul(BigNumber.from(_defaultRoyaltyBPS)).div(BigNumber.from(10000))
    );
  });

  it("common recipient should receive Royalty in Eth with new splits set by the owner on registry", async function () {
    const {
      ERC1155,
      ERC20,
      mockMarketplace,
      commonRoyaltyReceiver2,
      managerAsOwner,
      seller,
      buyer,
      commonRoyaltyReceiver,
      royaltyReceiver,
      user,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    await managerAsOwner.setSplit(6000);
    const balanceRoyaltyReceiver = await ethers.provider.getBalance(
      royaltyReceiver
    );
    const balanceCommonRoyaltyReceiver = await ethers.provider.getBalance(
      commonRoyaltyReceiver
    );
    const value = ethers.utils.parseUnits("1000", "ether");
    await mockMarketplace
      .connect(await ethers.getSigner(user))
      .distributeRoyaltyRoyaltyEngine(
        0,
        ERC20.address,
        ERC1155.address,
        1,
        buyer,
        {
          value: value,
        }
      );

    const balanceRoyaltyReceiverNew = await ethers.provider.getBalance(
      royaltyReceiver
    );
    const balanceCommonRoyaltyReceiverNew = await ethers.provider.getBalance(
      commonRoyaltyReceiver
    );

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    const TotalRoyalty = value
      .mul(BigNumber.from(_defaultRoyaltyBPS))
      .div(BigNumber.from(10000));

    const sellerRoyaltyShare = TotalRoyalty.mul(BigNumber.from(4000)).div(
      BigNumber.from(10000)
    );

    const commonRecipientShare = TotalRoyalty.mul(BigNumber.from(6000)).div(
      BigNumber.from(10000)
    );

    expect(balanceRoyaltyReceiverNew.sub(balanceRoyaltyReceiver)).to.be.equal(
      sellerRoyaltyShare
    );

    expect(
      balanceCommonRoyaltyReceiverNew.sub(balanceCommonRoyaltyReceiver)
    ).to.be.equal(commonRecipientShare);

    expect(
      balanceRoyaltyReceiverNew
        .sub(balanceRoyaltyReceiver)
        .add(balanceCommonRoyaltyReceiverNew.sub(balanceCommonRoyaltyReceiver))
    ).to.be.equal(
      value.mul(BigNumber.from(_defaultRoyaltyBPS)).div(BigNumber.from(10000))
    );
  });

  it("creator should receive Royalty in ERC20 to new address royalty recipient address", async function () {
    const {
      ERC1155,
      ERC20,
      manager,
      mockMarketplace,
      ERC20AsBuyer,
      seller,
      buyer,
      commonRoyaltyReceiver,
      royaltyReceiver,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter = await manager._creatorRoyaltiesSplitter(seller);

    const splitterContract = await ethers.getContractAt(splitterAbi, splitter);

    expect(await splitterContract._recipient()).to.be.equal(royaltyReceiver);

    const tnx = await ERC1155.connect(
      await ethers.getSigner(seller)
    ).setRoyaltyRecipient(seller);

    await tnx.wait();

    expect(await splitterContract._recipient()).to.be.equal(seller);

    await ERC20.mint(buyer, 1000000);
    await ERC20AsBuyer.approve(mockMarketplace.address, 1000000);
    expect(await ERC1155.balanceOf(seller, 1)).to.be.equals(1);
    await mockMarketplace.distributeRoyaltyEIP2981(
      1000000,
      ERC20.address,
      ERC1155.address,
      1,
      buyer
    );

    await splitterContract
      .connect(await ethers.getSigner(seller))
      .splitERC20Tokens(ERC20.address);
    const balanceRoyaltyReceiver = await ERC20.balanceOf(royaltyReceiver);
    expect(balanceRoyaltyReceiver).to.be.equal(0);

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    const balanceCommonRoyaltyReceiver = await ERC20.balanceOf(
      commonRoyaltyReceiver
    );

    const balanceSeller = await ERC20.balanceOf(seller);

    expect(balanceSeller).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
    expect(balanceCommonRoyaltyReceiver).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
  });

  it("common recipient should receive Royalty in ERC20 to new address set by the owner on registry", async function () {
    const {
      ERC1155,
      ERC20,
      mockMarketplace,
      ERC20AsBuyer,
      seller,
      buyer,
      managerAsOwner,
      commonRoyaltyReceiver2,
      commonRoyaltyReceiver,
      royaltyReceiver,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    expect(await managerAsOwner.commonRecipient()).to.be.equal(
      commonRoyaltyReceiver
    );

    await managerAsOwner.setRecipient(commonRoyaltyReceiver2);

    expect(await managerAsOwner.commonRecipient()).to.be.equal(
      commonRoyaltyReceiver2
    );

    await ERC20.mint(buyer, 1000000);
    await ERC20AsBuyer.approve(mockMarketplace.address, 1000000);
    expect(await ERC1155.balanceOf(seller, 1)).to.be.equals(1);
    await mockMarketplace.distributeRoyaltyRoyaltyEngine(
      1000000,
      ERC20.address,
      ERC1155.address,
      1,
      buyer
    );

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    const balanceCommonRoyaltyReceiver2 = await ERC20.balanceOf(
      commonRoyaltyReceiver2
    );
    const balanceCommonRoyaltyReceiver1 = await ERC20.balanceOf(
      commonRoyaltyReceiver
    );
    
    expect(balanceCommonRoyaltyReceiver1).to.be.equal(0);
    const balanceRoyaltyReceiver = await ERC20.balanceOf(royaltyReceiver);

    expect(balanceRoyaltyReceiver).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
    expect(balanceCommonRoyaltyReceiver2).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
  });

  it("common recipient should receive Royalty in ERC20 with new splits set by the owner on registry", async function () {
    const {
      ERC1155,
      ERC20,
      mockMarketplace,
      ERC20AsBuyer,
      seller,
      buyer,
      managerAsOwner,
      commonRoyaltyReceiver2,
      commonRoyaltyReceiver,
      royaltyReceiver,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    await managerAsOwner.setSplit(6000);

    await ERC20.mint(buyer, 1000000);
    await ERC20AsBuyer.approve(mockMarketplace.address, 1000000);
    expect(await ERC1155.balanceOf(seller, 1)).to.be.equals(1);
    await mockMarketplace.distributeRoyaltyRoyaltyEngine(
      1000000,
      ERC20.address,
      ERC1155.address,
      1,
      buyer
    );

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    const balanceCommonRoyaltyReceiver = await ERC20.balanceOf(
      commonRoyaltyReceiver
    );

    const balanceRoyaltyReceiver = await ERC20.balanceOf(royaltyReceiver);

    expect(balanceRoyaltyReceiver).to.be.equal(
      ((1000000 * (_defaultRoyaltyBPS / 10000)) / 5) * 2
    );
    expect(balanceCommonRoyaltyReceiver).to.be.equal(
      ((1000000 * (_defaultRoyaltyBPS / 10000)) / 5) * 3
    );
  });

  it("common recipient should receive Royalty in ERC20 with new splits set by the owner on registry", async function () {
    const {
      ERC1155,
      ERC20,
      manager,
      mockMarketplace,
      ERC20AsBuyer,
      seller,
      buyer,
      managerAsOwner,
      commonRoyaltyReceiver2,
      commonRoyaltyReceiver,
      royaltyReceiver,
    } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    await managerAsOwner.setSplit(6000);

    await ERC20.mint(buyer, 1000000);
    await ERC20AsBuyer.approve(mockMarketplace.address, 1000000);
    expect(await ERC1155.balanceOf(seller, 1)).to.be.equals(1);
    await mockMarketplace.distributeRoyaltyRoyaltyEngine(
      1000000,
      ERC20.address,
      ERC1155.address,
      1,
      buyer
    );

    const _defaultRoyaltyBPS = await ERC1155._defaultRoyaltyBPS();

    const balanceCommonRoyaltyReceiver = await ERC20.balanceOf(
      commonRoyaltyReceiver
    );

    const balanceRoyaltyReceiver = await ERC20.balanceOf(royaltyReceiver);

    expect(balanceRoyaltyReceiver).to.be.equal(
      ((1000000 * (_defaultRoyaltyBPS / 10000)) / 5) * 2
    );
    expect(balanceCommonRoyaltyReceiver).to.be.equal(
      ((1000000 * (_defaultRoyaltyBPS / 10000)) / 5) * 3
    );
  });

  it("creator could change the recipient for his splitter", async function () {
    const { ERC1155, manager, seller, royaltyReceiver } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter = await manager._creatorRoyaltiesSplitter(seller);

    const splitterContract = await ethers.getContractAt(splitterAbi, splitter);

    expect(await splitterContract._recipient()).to.be.equal(royaltyReceiver);

    const tnx = await ERC1155.connect(
      await ethers.getSigner(seller)
    ).setRoyaltyRecipient(seller);

    await tnx.wait();

    expect(await splitterContract._recipient()).to.be.equal(seller);
  });

  it("only creator could change the recipient for his splitter", async function () {
    const { ERC1155, seller, royaltyReceiver } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );
    await expect(
      ERC1155.connect(
        await ethers.getSigner(royaltyReceiver)
      ).setRoyaltyRecipient(seller)
    ).to.revertedWith("No splitter deployed for the creator");
  });

  it("should have same splitter address for tokens with minted by same creator", async function () {
    const { ERC1155, seller, royaltyReceiver } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter1 = await ERC1155._tokenRoyaltiesSplitter(1);

    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      2,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter2 = await ERC1155._tokenRoyaltiesSplitter(2);

    expect(splitter1).to.be.equal(splitter2);
  });

  it("should not have same splitter address for tokens with minted by different creator", async function () {
    const { ERC1155, seller, buyer, royaltyReceiver } =
      await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter1 = await ERC1155._tokenRoyaltiesSplitter(1);

    await ERC1155.connect(await ethers.getSigner(buyer)).mint(
      buyer,
      2,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter2 = await ERC1155._tokenRoyaltiesSplitter(2);

    expect(splitter1).to.not.be.equal(splitter2);
  });

  it("should return splitter address on for a tokenId on royaltyInfo function call", async function () {
    const { ERC1155, seller, royaltyReceiver } = await royaltyDistribution();
    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter = await ERC1155._tokenRoyaltiesSplitter(1);

    const royaltyInfo = await ERC1155.royaltyInfo(1, 10000);

    expect(splitter).to.be.equal(royaltyInfo[0]);
  });

  it("Token owner can set default royalty Bps", async function () {
    const { ERC1155, deployer } = await royaltyDistribution();
    expect(await ERC1155._defaultRoyaltyBPS()).to.be.equal(300);
    await ERC1155.connect(
      await ethers.getSigner(deployer)
    ).setDefaultRoyaltyBps(400);
    expect(await ERC1155._defaultRoyaltyBPS()).to.be.equal(400);
  });

  it("Token owner can set default royalty address", async function () {
    const { ERC1155, royaltyReceiver, deployer } = await royaltyDistribution();
    expect(await ERC1155._defaultRoyaltyReceiver()).to.be.equal(
      royaltyReceiver
    );
    await ERC1155.connect(
      await ethers.getSigner(deployer)
    ).setDefaultRoyaltyReceiver(deployer);
    expect(await ERC1155._defaultRoyaltyReceiver()).to.be.equal(deployer);
  });

  it("only Token owner can set default royalty Bps", async function () {
    const { ERC1155, seller } = await royaltyDistribution();
    await expect(
      ERC1155.connect(await ethers.getSigner(seller)).setDefaultRoyaltyBps(400)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("only Token owner can set default royalty address", async function () {
    const { ERC1155, seller } = await royaltyDistribution();
    await expect(
      ERC1155.connect(await ethers.getSigner(seller)).setDefaultRoyaltyReceiver(
        seller
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("manager owner can set common royalty recipient", async function () {
    const { seller, commonRoyaltyReceiver, manager, managerAsOwner } =
      await royaltyDistribution();
    expect(await managerAsOwner.commonRecipient()).to.be.equal(
      commonRoyaltyReceiver
    );
    await managerAsOwner.setRecipient(seller);
    expect(await managerAsOwner.commonRecipient()).to.be.equal(seller);
  });

  it("manager owner can set common split", async function () {
    const { seller, commonRoyaltyReceiver, manager, managerAsOwner } =
      await royaltyDistribution();
    expect(await managerAsOwner.commonSplit()).to.be.equal(5000);
    await managerAsOwner.setSplit(3000);
    expect(await managerAsOwner.commonSplit()).to.be.equal(3000);
  });

  it("only manager owner can set common royalty recipient", async function () {
    const { seller, managerAsOwner } = await royaltyDistribution();
    await expect(
      managerAsOwner
        .connect(await ethers.provider.getSigner(seller))
        .setRecipient(seller)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("only manager owner can set common split", async function () {
    const { seller, managerAsOwner } = await royaltyDistribution();
    await expect(
      managerAsOwner
        .connect(await ethers.provider.getSigner(seller))
        .setSplit(3000)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("manager owner Eip 2981 royaltyBps for other contracts (catalyst)", async function () {
    const { managerAsOwner, catalyst } = await royaltyDistribution();
    expect(await managerAsOwner.contractRoyalty(catalyst.address)).to.be.equal(
      0
    );
    await managerAsOwner.setContractRoyalty(catalyst.address, 500);
    expect(await managerAsOwner.contractRoyalty(catalyst.address)).to.be.equal(
      500
    );
  });

  it("only registry owner Eip 2981 royaltyBps for other contracts (catalyst)", async function () {
    const { manager, seller, catalyst } = await royaltyDistribution();
    await expect(
      manager
        .connect(await ethers.provider.getSigner(seller))
        .setContractRoyalty(catalyst.address, 500)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("registry should return EIP2981 royalty recipient and royalty bps for other contracts(catalyst)", async function () {
    const { commonRoyaltyReceiver, catalyst, managerAsOwner } =
      await royaltyDistribution();
    await managerAsOwner.setContractRoyalty(catalyst.address, 500);
    const royaltyInfo = await catalyst.getRoyaltyInfo();
    expect(royaltyInfo[0]).to.be.equals(commonRoyaltyReceiver);
    expect(royaltyInfo[1]).to.be.equals(500);
  });

  it("ERC721: should mint ERC721 Token and split ERC20 using EIP2981", async function () {
    const {
      ERC721,
      ERC20,
      manager,
      mockMarketplace,
      ERC20AsBuyer,
      deployer,
      seller,
      buyer,
      commonRoyaltyReceiver,
      royaltyReceiver,
    } = await royaltyDistribution();
    await ERC721.connect(await ethers.getSigner(deployer)).mint(
      seller,
      1,
      royaltyReceiver,
      "0x"
    );
    await ERC20.mint(buyer, 1000000);
    await ERC20AsBuyer.approve(mockMarketplace.address, 1000000);
    expect(await ERC721.balanceOf(seller)).to.be.equals(1);
    await mockMarketplace.distributeRoyaltyEIP2981(
      1000000,
      ERC20.address,
      ERC721.address,
      1,
      buyer
    );
    const splitter = await manager._creatorRoyaltiesSplitter(deployer);

    const _defaultRoyaltyBPS = await ERC721._defaultRoyaltyBPS();

    const splitterContract = await ethers.getContractAt(splitterAbi, splitter);

    const balance = await ERC20.balanceOf(splitter);

    expect(balance).to.be.equal(1000000 * (_defaultRoyaltyBPS / 10000));

    await splitterContract
      .connect(await ethers.getSigner(royaltyReceiver))
      .splitERC20Tokens(ERC20.address);

    const balanceRoyaltyReceiver = await ERC20.balanceOf(royaltyReceiver);
    const balanceCommonRoyaltyReceiver = await ERC20.balanceOf(
      commonRoyaltyReceiver
    );

    expect(balanceRoyaltyReceiver).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
    expect(balanceCommonRoyaltyReceiver).to.be.equal(
      (1000000 * (_defaultRoyaltyBPS / 10000)) / 2
    );
  });

  it("ERC721: creator could change the recipient for his splitter", async function () {
    const { ERC721, manager, seller, royaltyReceiver } = await royaltyDistribution();
    await ERC721.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter = await manager._creatorRoyaltiesSplitter(seller);

    const splitterContract = await ethers.getContractAt(splitterAbi, splitter);

    expect(await splitterContract._recipient()).to.be.equal(royaltyReceiver);

    const tnx = await ERC721.connect(
      await ethers.getSigner(seller)
    ).setRoyaltyRecipient(seller);

    await tnx.wait();

    expect(await splitterContract._recipient()).to.be.equal(seller);
  });

  it("ERC721: only creator could change the recipient for his splitter", async function () {
    const { ERC721, seller, royaltyReceiver } = await royaltyDistribution();
    await ERC721.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      royaltyReceiver,
      "0x"
    );
    await expect(
      ERC721.connect(
        await ethers.getSigner(royaltyReceiver)
      ).setRoyaltyRecipient(seller)
    ).to.revertedWith("No splitter deployed for the creator");
  });

  it("ERC721: should have same splitter address for tokens with minted by same creator", async function () {
    const { ERC721, seller, royaltyReceiver } = await royaltyDistribution();
    await ERC721.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter1 = await ERC721._tokenRoyaltiesSplitter(1);

    await ERC721.connect(await ethers.getSigner(seller)).mint(
      seller,
      2,
      royaltyReceiver,
      "0x"
    );

    const splitter2 = await ERC721._tokenRoyaltiesSplitter(2);

    expect(splitter1).to.be.equal(splitter2);
  });

  it("ERC721 and ERC1155: should have same splitter address for tokens with minted by same creator", async function () {
    const { ERC1155, ERC721, seller, royaltyReceiver } = await royaltyDistribution();
    await ERC721.connect(await ethers.getSigner(seller)).mint(
      seller,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter1 = await ERC721._tokenRoyaltiesSplitter(1);

    await ERC1155.connect(await ethers.getSigner(seller)).mint(
      seller,
      2,
      1,
      royaltyReceiver,
      "0x"
    );

    const splitter2 = await ERC1155._tokenRoyaltiesSplitter(2);

    expect(splitter1).to.be.equal(splitter2);
  });
});
