import { ethers, network } from "hardhat";
import { getContracts } from "./utils";

(async function main() {
    const networkName = network.name;
    const summonerAddress = getContracts()['mumbai']['Summoner'];
    const summoner = await ethers.getContractAt('Summoner', summonerAddress);
    const totalSupply = await summoner.totalSupply();
    console.log(`total supply is ${totalSupply}`);
})();