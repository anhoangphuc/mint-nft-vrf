import { ethers, network } from "hardhat"
import { getContracts } from "./utils"

(async function main() {
    const networkName = network.name;
    const summonerAddress = getContracts()[networkName]['Summoner'];
    const summoner = await ethers.getContractAt('Summoner', summonerAddress);

    const firstSaleMinterVrfAddress = getContracts()[networkName]['FirstSaleMinterVrf'];
    console.log(`Summoner at ${summonerAddress}, FirstSaleMinter at ${firstSaleMinterVrfAddress}`);
    await summoner.grantRole(await summoner.MINTER_ROLE(), firstSaleMinterVrfAddress);
    console.log(`Grant role success`);
})()