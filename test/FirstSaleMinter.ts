import { SignerWithAddress }from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat';
import { FirstSaleMinter, Summoner } from '../typechain-types';
import { expect } from 'chai';
context(`FirstSaleMinter`, async () => {
    let admin: SignerWithAddress, account1: SignerWithAddress, account2: SignerWithAddress;
    let firstSaleMinter: FirstSaleMinter;
    let summoner: Summoner;
    beforeEach(async () => {
        const SummonerContract = await ethers.getContractFactory('Summoner', admin);
        summoner = await upgrades.deployProxy(SummonerContract) as Summoner;
        await summoner.deployed();
        [admin, account1, account2] = await ethers.getSigners();
        const FirstSaleMinterContract = await ethers.getContractFactory('FirstSaleMinter');
        firstSaleMinter = await upgrades.deployProxy(FirstSaleMinterContract, [summoner.address]) as FirstSaleMinter;
        await firstSaleMinter.deployed();

        await summoner.connect(admin).grantRole(await summoner.MINTER_ROLE(), firstSaleMinter.address);
    });

    it('Deploy success', async () => {
        expect(firstSaleMinter.address).to.be.properAddress;
    });

    context('Public mint success', async() => {
        let femaleIndexStart: number;
        beforeEach(async() => {
            femaleIndexStart = await firstSaleMinter.FEMALE_INDEX_START();
        });

        it('Mint one token success', async() => {
            await expect(firstSaleMinter.connect(account1).publicMint())
            .to.be.emit(firstSaleMinter, 'PublicMint')
            .to.be.emit(summoner, 'Transfer');

            const newMintedToken = await summoner.tokenOfOwnerByIndex(account1.address, 0);
            expect(newMintedToken).greaterThanOrEqual(0).lessThan(femaleIndexStart);
        })
    })
})