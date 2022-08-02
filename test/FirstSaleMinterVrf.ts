import { FirstSaleMinterVrf, Summoner, VrfCoordinatorV2Mock } from "../typechain-types"
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';

context(`FirstSaleMinterVrf`, async () => {
    let firstSaleMinterVrf: FirstSaleMinterVrf;
    let summoner: Summoner;
    let vrfCoordinator: VrfCoordinatorV2Mock;
    let admin: SignerWithAddress, account1: SignerWithAddress, account2: SignerWithAddress;
    beforeEach(async () => {
        [admin, account1, account2] = await ethers.getSigners();
        const SummonerContract = await ethers.getContractFactory('Summoner', admin);
        summoner = await upgrades.deployProxy(SummonerContract) as Summoner;
        await summoner.deployed();

        const VrfCoordinatorContract = await ethers.getContractFactory('VrfCoordinatorV2Mock', admin);
        vrfCoordinator = await VrfCoordinatorContract.deploy();
        await vrfCoordinator.deployed();

        const FirstSaleMinterVrfContract = await ethers.getContractFactory('FirstSaleMinterVrf', admin);
        firstSaleMinterVrf = await FirstSaleMinterVrfContract.deploy(vrfCoordinator.address, '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f', 100, summoner.address);
        await firstSaleMinterVrf.deployed();

        await summoner.connect(admin).grantRole(await summoner.MINTER_ROLE(), firstSaleMinterVrf.address);
    });

    it(`Deploy success`, async () => {
        expect(firstSaleMinterVrf.address).to.be.properAddress;
    });
})