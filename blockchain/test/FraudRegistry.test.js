const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FraudRegistry", function () {

  let fraudRegistry;
  let owner;
  let bank1;
  let user;

  beforeEach(async function () {

    [owner, bank1, user] =
      await ethers.getSigners();

    const FraudRegistry =
      await ethers.getContractFactory(
        "FraudRegistry"
      );

    fraudRegistry =
      await FraudRegistry.deploy();

    await fraudRegistry.waitForDeployment();

    await fraudRegistry.addBank(
      bank1.address
    );
  });

  it("should allow authorized bank to report fraud", async function () {

    const hash =
      ethers.keccak256(
        ethers.toUtf8Bytes("device123")
      );

    await fraudRegistry
      .connect(bank1)
      .reportFraud(hash, 0);

    const result =
      await fraudRegistry.checkSignal(hash);

    expect(result[0]).to.equal(true);
  });

  it("should reject fraud report from unauthorized address", async function () {

    const hash =
      ethers.keccak256(
        ethers.toUtf8Bytes("device123")
      );

    await expect(
      fraudRegistry
        .connect(user)
        .reportFraud(hash, 0)
    ).to.be.revertedWith(
      "Not an authorized bank"
    );
  });

  it("should return false for unreported hash", async function () {

    const hash =
      ethers.keccak256(
        ethers.toUtf8Bytes("unknown")
      );

    const result =
      await fraudRegistry.checkSignal(hash);

    expect(result[0]).to.equal(false);
  });

  it("should return true and correct metadata for reported hash", async function () {

    const hash =
      ethers.keccak256(
        ethers.toUtf8Bytes("device123")
      );

    await fraudRegistry
      .connect(bank1)
      .reportFraud(hash, 0);

    const result =
      await fraudRegistry.checkSignal(hash);

    expect(result[0]).to.equal(true);
    expect(result[1]).to.be.gt(0);
    expect(result[2]).to.equal(bank1.address);
  });

  it("should emit FraudReported event on report", async function () {

    const hash =
      ethers.keccak256(
        ethers.toUtf8Bytes("device123")
      );

    await expect(
      fraudRegistry
        .connect(bank1)
        .reportFraud(hash, 0)
    ).to.emit(
      fraudRegistry,
      "FraudReported"
    );
  });
});