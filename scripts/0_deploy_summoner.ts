import hre, { ethers, network, upgrades } from "hardhat";
import { saveContract } from "./utils";

(async function main() {
    console.log(`Start deploying Summoner contract`);
    const networkName = network.name;    
    const SummonerContract = await ethers.getContractFactory('Summoner');
    const summoner = await upgrades.deployProxy(SummonerContract);
    await summoner.deployed();

    console.log(`Deploy summoner contract success at address ${summoner.address}`);

    await saveContract(networkName, "Summoner", summoner.address);
    console.log(`Saved contract address`);

    console.log(`Start verifying contract`);
    await hre.run("verify:verify", {
        address: summoner.address,
    });
    console.log(`Verify success`);
})();
