import hre, { ethers, network, upgrades } from "hardhat";
import { getContracts, saveContract } from "./utils";

(async function main() {
    console.log(`Start deploying Summoner contract`);
    const networkName = network.name;    
    const baseUri = "ipfs://QmRjC7FrYHZLC2nJWPsSJjFX5cBHM58YZHAKmwDAJkGn8V/";
    const SummonerContract = await ethers.getContractFactory('Summoner');
    const summoner = await upgrades.deployProxy(SummonerContract, [baseUri]);
    await summoner.deployed();

    console.log(`Deploy summoner contract success at address ${summoner.address}`);

    await saveContract(networkName, "Summoner", summoner.address);
    console.log(`Saved contract address`);

    console.log(`Start verifying contract`);
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(summoner.address);
    await hre.run("verify:verify", {
        address: implementationAddress,
    });
    console.log(`Verify success`);
})();
