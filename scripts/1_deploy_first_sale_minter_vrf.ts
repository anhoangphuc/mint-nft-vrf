import hre, { ethers, network } from "hardhat";
import { getContracts, saveContract, sleep } from "./utils";
import dotenv from 'dotenv';
dotenv.config();

(async function main() {
    console.log(`Start deploying FirstSaleMinterVrf`);
    const networkName = network.name;
    const FirstSaleMinterVrf = await ethers.getContractFactory('FirstSaleMinterVrf');

    const vrfCoordinator = getContracts()[networkName]['VrfCoordinator'];
    const gweiKeyHash_500 = '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f';
    const subcriptionId = process.env.CHAINLINK_SUB_ID;
    const summoner = getContracts()[networkName]['Summoner'];
    const weth = getContracts()[networkName]['WETH'];
    const treasury = getContracts()[networkName]['Treasury'];
    const firstSaleMinterVrf = await FirstSaleMinterVrf.deploy(
        vrfCoordinator,
        gweiKeyHash_500,
        Number(subcriptionId),
        summoner, 
        weth,
        treasury,
    );
    await firstSaleMinterVrf.deployed();

    console.log(`Deploy FirstSaleMinterVrf success at address ${firstSaleMinterVrf.address}`);

    await saveContract(networkName, 'FirstSaleMinterVrf', firstSaleMinterVrf.address);
    console.log(`Saved contract success`);

    console.log(`Sleep 60 second for confirmation`);
    await sleep(60000);
    await hre.run("verify:verify", {
        address: firstSaleMinterVrf.address,
        constructorArguments: [
            vrfCoordinator,
            gweiKeyHash_500,
            Number(subcriptionId),
            summoner,
            weth,
            treasury,
        ]
    })
})();
