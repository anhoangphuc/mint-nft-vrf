import hre, { ethers, network, upgrades } from "hardhat";
import { getContracts, sleep } from "../utils";

(async function main() {
    console.log(`Start upgrading Summoner contract`);
    const networkName = network.name;    
    const summonerAddress = getContracts()[networkName]['Summoner'];
    const SummonerContract = await ethers.getContractFactory('Summoner');
    const summoner = await upgrades.upgradeProxy(summonerAddress, SummonerContract);
    console.log(`Summoner upgraded`);

    console.log(`Deploy summoner contract success at address ${summoner.address}`);

    console.log(`Sleep 60 second for confirmation`);
    await sleep(60000);

    console.log(`Start verifying contract`);
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(summoner.address);

    await hre.run("verify:verify", {
        address: implementationAddress,
    });
    console.log(`Verify success`);
})();
