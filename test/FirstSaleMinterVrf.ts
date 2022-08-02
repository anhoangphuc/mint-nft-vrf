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

    context(`Complete mint`, async() => {
        let femaleIndexStart: number;
        let whitelistMint: number;
        let maleToken: number;
        let femaleToken: number;
        let publicMint: number;
        beforeEach(async() => {
            femaleIndexStart = await firstSaleMinterVrf.FEMALE_INDEX_START();
            whitelistMint = await firstSaleMinterVrf.WHITELIST_MINT();
            publicMint = await firstSaleMinterVrf.PUBLIC_MINT();
            maleToken = await firstSaleMinterVrf.MALE_TOKEN();
            femaleToken = await firstSaleMinterVrf.FEMALE_TOKEN();
        });

        it(`Complete mint success`, async() => {
            const s = Array.from(Array(publicMint + whitelistMint).keys()).sort(() => Math.random() - 0.5);
            for (const x of s) {
                if (x < publicMint) {
                    await firstSaleMinterVrf.connect(account1).mintPublic();
                } else {
                    await firstSaleMinterVrf.connect(account1).mintWhitelist();
                }
                const counter = await vrfCoordinator.counter();
                await vrfCoordinator.connect(admin).rawFulfillRandomWords(counter.toNumber() - 1);
            }
            const balance = await summoner.balanceOf(account1.address);
            expect(balance).to.be.equal(maleToken + femaleToken);
        });
    })
})