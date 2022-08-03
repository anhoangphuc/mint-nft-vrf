import dotenv from 'dotenv';
import { ethers, network } from 'hardhat';
import { getContracts } from './utils';
dotenv.config();

(async function main() {
    console.log(`Start add consumer`);
    const networkName = network.name;
    const firstSaleMinterVrfAddress = getContracts()[networkName]['FirstSaleMinterVrf'];
    const subId = Number(process.env.CHAINLINK_SUB_ID);
    const vrfCoordinatorAddress = getContracts()[networkName]['VrfCoordinator'];
    const vrfCoordinator = await ethers.getContractAt('VRFCoordinatorV2Interface', vrfCoordinatorAddress);
    await vrfCoordinator.addConsumer(subId, firstSaleMinterVrfAddress);
    console.log(`Add consumer success`);
})()