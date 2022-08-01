import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { Summoner } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { extendEnvironment } from 'hardhat/config';

context('FirstSaleMinter', async () => {
    let summoner: Summoner;
    let admin: SignerWithAddress, account1: SignerWithAddress;
    beforeEach(async () => {
        const SummonerContract = await ethers.getContractFactory('Summoner');
        summoner = await upgrades.deployProxy(SummonerContract) as Summoner;
        await summoner.deployed();
        await ethers.getSigners();
        [admin, account1] = await ethers.getSigners();
    });

    it(`Deploy success`,async () => {
        expect(summoner.address).to.be.properAddress;
    });

    it(`Revert if mint address is not minter`, async () => {
        await expect(summoner.connect(account1).mint(account1.address, 1)).to.be.revertedWith("mint::not minter");
    });

    context(`Mint success a token`, async () => {
        let minterRole: string;
        beforeEach(async() => {
        minterRole = await summoner.MINTER_ROLE();
            await summoner.connect(admin).grantRole(minterRole, account1.address);
        });

        it(`Grant role success`, async () => {
            const hasRole = await summoner.hasRole(minterRole, account1.address);
            expect(hasRole).to.be.equal(true);
        });
    });
})