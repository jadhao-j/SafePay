const hre = require("hardhat");

async function main() {

    const [deployer, bank1, bank2, bank3] =
        await hre.ethers.getSigners();

    const FraudRegistry =
        await hre.ethers.getContractFactory("FraudRegistry");

    const fraudRegistry =
        await FraudRegistry.deploy();

    await fraudRegistry.waitForDeployment();

    console.log(
        "FraudRegistry deployed to:",
        await fraudRegistry.getAddress()
    );

    const Reputation =
        await hre.ethers.getContractFactory("Reputation");

    const reputation =
        await Reputation.deploy();

    await reputation.waitForDeployment();

    console.log(
        "Reputation deployed to:",
        await reputation.getAddress()
    );

    await fraudRegistry.addBank(bank1.address);
    await fraudRegistry.addBank(bank2.address);
    await fraudRegistry.addBank(bank3.address);

    await reputation.addBank(bank1.address);
    await reputation.addBank(bank2.address);
    await reputation.addBank(bank3.address);

    console.log("Bank1:", bank1.address);
    console.log("Bank2:", bank2.address);
    console.log("Bank3:", bank3.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});