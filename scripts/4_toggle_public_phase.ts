import { ethers, network } from "hardhat"
import { getContracts } from "./utils"

(async function main() {
    const networkName = network.name;
    const firstSaleMinterVrfAddress = getContracts()[networkName]['FirstSaleMinterVrf'];
    const firstSaleMinterVrf = await ethers.getContractAt('FirstSaleMinterVrf', firstSaleMinterVrfAddress);
    const tx = await firstSaleMinterVrf.togglePublicPhase();
    await tx.wait();
    const currentStatus = await firstSaleMinterVrf.publicPhaseOpen();
    console.log(`Toggle success, current status of public phase is ${currentStatus}`);
})()