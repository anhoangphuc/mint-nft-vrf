import hre, { ethers, network } from "hardhat";
import { getContracts, saveContract } from "./utils";
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
    const firstSaleMinterVrf = await FirstSaleMinterVrf.deploy(
        vrfCoordinator,
        gweiKeyHash_500,
        Number(subcriptionId),
        summoner, 
    );
    await firstSaleMinterVrf.deployed();

    console.log(`Deploy FirstSaleMinterVrf success at address ${firstSaleMinterVrf.address}`);

    await saveContract(networkName, 'FirstSaleMinterVrf', firstSaleMinterVrf.address);
    console.log(`Saved contract success`);

    await hre.run("verify:verify", {
        address: firstSaleMinterVrf.address,
        constructorArguments: [
            vrfCoordinator,
            gweiKeyHash_500,
            Number(subcriptionId),
            summoner,
        ]
    })
})();
