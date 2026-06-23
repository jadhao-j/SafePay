const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reputation", function () {

  let reputation;
  let owner;
  let bank1;

  beforeEach(async function () {

    [owner, bank1] =
      await ethers.getSigners();

    const Reputation =
      await ethers.getContractFactory(
        "Reputation"
      );

    reputation =
      await Reputation.deploy();

    await reputation.waitForDeployment();

    await reputation.addBank(
      bank1.address
    );
  });

  it("should allow authorized bank to update reputation", async function () {

    const hash =
      ethers.keccak256(
        ethers.toUtf8Bytes("account123")
      );

    await reputation
      .connect(bank1)
      .updateReputation(hash, 90);

    const result =
      await reputation.getReputation(hash);

    expect(result[0]).to.equal(90);
  });

  it("should return correct score and timestamp", async function () {

    const hash =
      ethers.keccak256(
        ethers.toUtf8Bytes("account123")
      );

    await reputation
      .connect(bank1)
      .updateReputation(hash, 75);

    const result =
      await reputation.getReputation(hash);

    expect(result[0]).to.equal(75);
    expect(result[1]).to.be.gt(0);
  });

  it("should emit ReputationUpdated event", async function () {

    const hash =
      ethers.keccak256(
        ethers.toUtf8Bytes("account123")
      );

    await expect(
      reputation
        .connect(bank1)
        .updateReputation(hash, 85)
    ).to.emit(
      reputation,
      "ReputationUpdated"
    );
  });
});