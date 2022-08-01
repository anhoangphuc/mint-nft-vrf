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
        let maleToken: number;
        let publicMint: number;
        beforeEach(async() => {
            femaleIndexStart = await firstSaleMinter.FEMALE_INDEX_START();
            maleToken = await firstSaleMinter.MALE_TOKEN();
            publicMint = await firstSaleMinter.PUBLIC_MINT();
        });

        it('Mint one token success', async() => {
            await expect(firstSaleMinter.connect(account1).publicMint())
            .to.be.emit(firstSaleMinter, 'PublicMint')
            .to.be.emit(summoner, 'Transfer');

            const newMintedToken = await summoner.tokenOfOwnerByIndex(account1.address, 0);
            expect(newMintedToken).greaterThanOrEqual(0).lessThan(femaleIndexStart);
        });

        it('Mint all public mint token success', async() => {
            for (let i = 0; i < publicMint; i++) {
                await firstSaleMinter.connect(account1).publicMint();
            }
            const mintedTokens = new Set<number>();
            for (let i = 0; i < publicMint; i++)
                mintedTokens.add((await summoner.tokenOfOwnerByIndex(account1.address, i)).toNumber());
            expect(mintedTokens.size).to.be.equal(publicMint);
            expect(Array.from(mintedTokens).every((x) => x >= 0 && x < femaleIndexStart));
        });

        it(`Revert if mint public sale exceed`, async () => {
            for (let i = 0; i < publicMint; i++) {
                await firstSaleMinter.connect(account1).publicMint();
            }
            await expect(firstSaleMinter.connect(account1).publicMint())
            .to.be.revertedWith('publicMint::Exceed');
        })
    })
})