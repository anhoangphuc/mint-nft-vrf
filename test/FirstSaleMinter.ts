import { SignerWithAddress }from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat';
import { FirstSaleMinter } from '../typechain-types';
import { expect } from 'chai';
context(`FirstSaleMinter`, async () => {
    let admin: SignerWithAddress, account1: SignerWithAddress, account2: SignerWithAddress;
    let firstSaleMinter: FirstSaleMinter;
    beforeEach(async () => {
        const SummonerContract = await ethers.getContractFactory('Summoner');
        const summoner = await upgrades.deployProxy(SummonerContract);
        await summoner.deployed();
        [admin, account1, account2] = await ethers.getSigners();
        const FirstSaleMinterContract = await ethers.getContractFactory('FirstSaleMinter');
        firstSaleMinter = await upgrades.deployProxy(FirstSaleMinterContract, [summoner.address]) as FirstSaleMinter;
        await firstSaleMinter.deployed();
    });

    it('Deploy success', async () => {
        expect(firstSaleMinter.address).to.be.properAddress;
    });

})