import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { Summoner } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('FirstSaleMinter', async () => {
    let summoner: Summoner;
    let admin: SignerWithAddress, account1: SignerWithAddress;
    beforeEach(async () => {
        const SummonerContract = await ethers.getContractFactory('Summoner');
        summoner = await upgrades.deployProxy(SummonerContract) as Summoner;
        await summoner.deployed();
        await ethers.getSigners();
        [admin, account1] = await ethers.getSigners();
    })

    it(`Deploy success`,async () => {
        expect(summoner.address).to.be.properAddress;
    });

    it(`Revert if mint address is not minter`,async () => {
        await expect(summoner.connect(account1).mint(account1.address, 1)).to.be.revertedWith("mint::not minter");
    });
})