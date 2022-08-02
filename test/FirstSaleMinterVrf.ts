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

    context('Public mint success', async() => {
        let femaleIndexStart: number;
        let maleToken: number;
        let publicMint: number;
        beforeEach(async() => {
            femaleIndexStart = await firstSaleMinterVrf.FEMALE_INDEX_START();
            maleToken = await firstSaleMinterVrf.MALE_TOKEN();
            publicMint = await firstSaleMinterVrf.PUBLIC_MINT();
        });

        it('Mint one token success', async() => {
            await firstSaleMinterVrf.connect(account1).mintPublic();
            await expect(vrfCoordinator.connect(admin).rawFulfillRandomWords(0))
            .to.be.emit(firstSaleMinterVrf, 'PublicMint')
            .to.be.emit(summoner, 'Transfer');

            const newMintedToken = await summoner.tokenOfOwnerByIndex(account1.address, 0);
            expect(newMintedToken).greaterThanOrEqual(0).lessThan(femaleIndexStart);
        });

        it('Mint all public mint token success', async() => {
            for (let i = 0; i < publicMint; i++) {
                await firstSaleMinterVrf.connect(account1).mintPublic();
            }
            for (let i = 0; i < publicMint; i++) {
                await vrfCoordinator.connect(admin).rawFulfillRandomWords(i);
            }
            const mintedTokens = new Set<number>();
            for (let i = 0; i < publicMint; i++)
                mintedTokens.add((await summoner.tokenOfOwnerByIndex(account1.address, i)).toNumber());
            expect(mintedTokens.size).to.be.equal(publicMint);
            expect(Array.from(mintedTokens).every((x) => x >= 0 && x < femaleIndexStart));
        });

        it(`Revert if mint public sale exceed`, async () => {
            for (let i = 0; i < publicMint; i++) {
                await firstSaleMinterVrf.connect(account1).mintPublic();
            }
            await expect(firstSaleMinterVrf.connect(account1).mintPublic())
            .to.be.revertedWith('public::exceed');
        })
    })

    context('Whitelist mint success', async() => {
        let femaleIndexStart: number;
        let whitelistMint: number;
        let maleToken: number;
        let femaleToken: number;
        beforeEach(async() => {
            femaleIndexStart = await firstSaleMinterVrf.FEMALE_INDEX_START();
            whitelistMint = await firstSaleMinterVrf.WHITELIST_MINT();
            maleToken = await firstSaleMinterVrf.MALE_TOKEN();
            femaleToken = await firstSaleMinterVrf.FEMALE_TOKEN();
        });

        it('Whitelist mint token success', async() => {
            await firstSaleMinterVrf.connect(account1).mintWhitelist();
            await expect(vrfCoordinator.connect(admin).rawFulfillRandomWords(0))
            .to.be.emit(firstSaleMinterVrf, 'WhitelistMint')
            .to.be.emit(summoner, 'Transfer');

            const balance = await summoner.balanceOf(account1.address);
            expect(balance).to.be.equal(2);
            const newMaleMintedToken = await summoner.tokenOfOwnerByIndex(account1.address, 0);
            const newFemaleMintedToken = await summoner.tokenOfOwnerByIndex(account1.address, 1);
            expect(newMaleMintedToken).greaterThanOrEqual(0).lessThan(femaleIndexStart);
            expect(newFemaleMintedToken).greaterThanOrEqual(femaleIndexStart).lessThan(maleToken + femaleToken);
        });

        it('Mint all whitelist mint token success', async() => {
            for (let i = 0; i < whitelistMint; i++) {
                await firstSaleMinterVrf.connect(account1).mintWhitelist();
            }
            for (let i = 0; i < whitelistMint; i++) {
                await vrfCoordinator.connect(admin).rawFulfillRandomWords(i);
            }
            const mintedTokens = new Set<number>();
            for (let i = 0; i < whitelistMint * 2; i++)
                mintedTokens.add((await summoner.tokenOfOwnerByIndex(account1.address, i)).toNumber());
            expect(mintedTokens.size).to.be.equal(whitelistMint * 2);
            expect(Array.from(mintedTokens).filter((x) => x >= 0 && x < femaleIndexStart).length).to.be.equal(whitelistMint);
            expect(Array.from(mintedTokens).filter((x) => x >= femaleIndexStart && x < femaleToken + maleToken).length).to.be.equal(whitelistMint);
        });

        it(`Revert if mint whitelist sale exceed`, async () => {
            for (let i = 0; i < whitelistMint; i++) {
                await firstSaleMinterVrf.connect(account1).mintWhitelist();
            }
            await expect(firstSaleMinterVrf.connect(account2).mintWhitelist())
            .to.be.revertedWith('whitelist::exceed');
        });
    });
})