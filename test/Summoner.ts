import { ethers, upgrades } from 'hardhat';
import { constants } from 'ethers';
import { expect } from 'chai';
import { Summoner } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

context('Summoner', async () => {
    let summoner: Summoner;
    let admin: SignerWithAddress, account1: SignerWithAddress, account2: SignerWithAddress, treasury: SignerWithAddress;
    let baseURI = 'BaseUri/'
    beforeEach(async () => {
        [admin, account1, account2, treasury] = await ethers.getSigners();
        const SummonerContract = await ethers.getContractFactory('Summoner');
        summoner = await upgrades.deployProxy(SummonerContract, [ baseURI, treasury.address, 500 ]) as Summoner;
        await summoner.deployed();
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

        it(`Mint a specific token`, async () => {
            await expect(summoner.connect(account1).mint(account2.address, 1))
            .to.be.emit(summoner, 'Transfer')
            .withArgs(constants.AddressZero, account2.address, 1);
        })
    });

    context(`Base uri check`, async() => {
        beforeEach(async () => {
            await summoner.connect(admin).grantRole(await summoner.ADMIN_ROLE(), account1.address);
            await summoner.connect(admin).grantRole(await summoner.MINTER_ROLE(), account1.address);
        })

        it(`BaseUri correct`, async() => {
            const contractUri = await summoner.baseURI();
            expect(contractUri).to.be.equal(baseURI);

            await summoner.connect(account1).mint(account1.address, 0);
            const token0Uri = await summoner.tokenURI(0);
            expect(token0Uri).to.be.equal(`${baseURI}0`);
        });

        it(`Revert if access non existed token`, async () => {
            await expect(summoner.tokenURI(0))
                .to.be.revertedWith("ERC721: invalid token ID");
        })

        it(`Change uri success`, async () => {
            const newUri = 'NewURI';
            await summoner.connect(account1).setBaseUri(newUri);
            const contractUri = await summoner.baseURI();
            expect(contractUri).to.be.equal(newUri);
        });

        it(`Revert if not admin change uri`, async () => {
            await expect(summoner.connect(account2).setBaseUri(''))
            .revertedWith('setBaseUri:not admin');
        })
    })
})