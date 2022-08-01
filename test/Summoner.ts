import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { FirstSaleMinter, Summoner } from '../typechain-types';

describe('FirstSaleMinter', async () => {
    let summoner: Summoner;
    beforeEach(async () => {
        const SummonerContract = await ethers.getContractFactory('Summoner');
        summoner = await upgrades.deployProxy(SummonerContract) as Summoner;
        await summoner.deployed();
    })

    it(`Deploy success`,async () => {
        expect(summoner.address).to.be.properAddress;
    });
})