import hre, { ethers, network, upgrades } from "hardhat";
import { sleep, saveContract, getContracts } from "./utils";

(async function main() {
    console.log(`Start deploying Summoner contract`);
    const networkName = network.name;    
    const baseUri = "ipfs://QmchMZQHjPG1LSaeihEKF2Vew8ZDRKxPyQPoo4kKqrhg11/";
    const SummonerContract = await ethers.getContractFactory('Summoner');
    const TreasuryAddress = getContracts()[networkName]['Treasury'];
    const feeNumerator = 500 // 500/10000 = 5%
    const summoner = await upgrades.deployProxy(SummonerContract, [baseUri, TreasuryAddress, feeNumerator]);
    await summoner.deployed();

    console.log(`Deploy summoner contract success at address ${summoner.address}`);

    await saveContract(networkName, "Summoner", summoner.address);
    console.log(`Saved contract address`);

    console.log(`Sleep 60 second for confirmation`);
    await sleep(60000);

    console.log(`Start verifying contract`);
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(summoner.address);


    await hre.run("verify:verify", {
        address: implementationAddress,
    });
    console.log(`Verify success`);
})();
