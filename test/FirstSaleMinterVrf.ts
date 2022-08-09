import { FirstSaleMinterVrf, IERC20, Summoner, VrfCoordinatorV2Mock, WETH } from "../typechain-types"
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { BigNumber, constants } from "ethers";

context(`FirstSaleMinterVrf`, async () => {
    let firstSaleMinterVrf: FirstSaleMinterVrf;
    let summoner: Summoner;
    let vrfCoordinator: VrfCoordinatorV2Mock;
    let admin: SignerWithAddress, account1: SignerWithAddress, account2: SignerWithAddress, treasury: SignerWithAddress;
    let weth: WETH;
    beforeEach(async () => {
        [admin, account1, account2, treasury] = await ethers.getSigners();
        const SummonerContract = await ethers.getContractFactory('Summoner', admin);
        summoner = await upgrades.deployProxy(SummonerContract, ['']) as Summoner;
        await summoner.deployed();

        const VrfCoordinatorContract = await ethers.getContractFactory('VrfCoordinatorV2Mock', admin);
        vrfCoordinator = await VrfCoordinatorContract.deploy();
        await vrfCoordinator.deployed();

        const WETHContract = await ethers.getContractFactory('WETH');
        weth = await WETHContract.deploy();
        await weth.deployed();

        const FirstSaleMinterVrfContract = await ethers.getContractFactory('FirstSaleMinterVrf', admin);
        firstSaleMinterVrf = await FirstSaleMinterVrfContract.deploy(vrfCoordinator.address, '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f', 100, summoner.address, weth.address, treasury.address);
        await firstSaleMinterVrf.deployed();

        await summoner.connect(admin).grantRole(await summoner.MINTER_ROLE(), firstSaleMinterVrf.address);
    });

    it(`Deploy success`, async () => {
        expect(firstSaleMinterVrf.address).to.be.properAddress;
    });

    async function mintWETH(account: SignerWithAddress) {
        await weth.connect(account).mint();
        const balance = await weth.balanceOf(account.address);
        await weth.connect(account).approve(firstSaleMinterVrf.address, balance);
    }

    xcontext(`Complete mint`, async() => {
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
            await mintWETH(account1);
            await mintWETH(account2);
            await firstSaleMinterVrf.connect(admin).toggleWhitelistPhase();
            await firstSaleMinterVrf.connect(admin).togglePublicPhase();
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

            const totalSupply = await summoner.totalSupply();
            expect(totalSupply).to.be.equal(maleToken + femaleToken);
        });
    })

    xcontext('Public mint success', async() => {
        let femaleIndexStart: number;
        let maleToken: number;
        let publicMint: number;
        beforeEach(async() => {
            femaleIndexStart = await firstSaleMinterVrf.FEMALE_INDEX_START();
            maleToken = await firstSaleMinterVrf.MALE_TOKEN();
            publicMint = await firstSaleMinterVrf.PUBLIC_MINT();

            await mintWETH(account1);
            await mintWETH(account2);
            await firstSaleMinterVrf.connect(admin).togglePublicPhase();
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

    xcontext('Whitelist mint success', async() => {
        let femaleIndexStart: number;
        let whitelistMint: number;
        let maleToken: number;
        let femaleToken: number;
        beforeEach(async() => {
            femaleIndexStart = await firstSaleMinterVrf.FEMALE_INDEX_START();
            whitelistMint = await firstSaleMinterVrf.WHITELIST_MINT();
            maleToken = await firstSaleMinterVrf.MALE_TOKEN();
            femaleToken = await firstSaleMinterVrf.FEMALE_TOKEN();

            await mintWETH(account1);
            await mintWETH(account2);

            await firstSaleMinterVrf.connect(admin).toggleWhitelistPhase();
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
            
            const totalSupply = await summoner.totalSupply();
            expect(totalSupply).to.be.equal(2);
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

    xcontext('Minting fee', async() => {
        let publicFee: BigNumber;
        let whitelistFee: BigNumber;
        beforeEach(async() => {
            await mintWETH(account1);
            await mintWETH(account2);
            publicFee = await firstSaleMinterVrf.PUBLIC_FEE();
            whitelistFee = await firstSaleMinterVrf.WHITELIST_FEE();
            await firstSaleMinterVrf.connect(admin).togglePublicPhase();
            await firstSaleMinterVrf.connect(admin).toggleWhitelistPhase();
        });

        it('Public mint', async() => {
            await expect(() => firstSaleMinterVrf.connect(account1).mintPublic())
            .to.changeTokenBalances(weth, [account1, treasury], [publicFee.mul(-1), publicFee]);
        });

        it('Whitelist mint', async() => {
            await expect(() => firstSaleMinterVrf.connect(account1).mintWhitelist())
            .to.changeTokenBalances(weth, [account1, treasury], [whitelistFee.mul(-1), whitelistFee]);
        });
    });

    xcontext('Set treasury', async() => {
        it('Set treasury success', async () => {
            await expect(firstSaleMinterVrf.connect(admin).setTreasury(account2.address))
            .to.emit(firstSaleMinterVrf, "TreasuryChanged").withArgs(treasury.address, account2.address);
            const newTreasury = await firstSaleMinterVrf.treasury();
            expect(newTreasury).to.be.equal(account2.address);
        });

        it('Revert if set zero address to treasury', async() => {
            await expect(firstSaleMinterVrf.connect(admin).setTreasury(constants.AddressZero))
                .to.be.revertedWith("setTreasury::zero address");
        })
    });

    context('Modifier pubicPhase and whitelistPhase', async() => {
        it(`Revert if mint public when public not opened`, async () => {
            await expect(firstSaleMinterVrf.connect(account1).mintPublic())
                .to.be.revertedWith("public::not open");
        });

        it(`Revert if mint whitelist when whitelist not opened`, async () => {
            await expect(firstSaleMinterVrf.connect(account1).mintWhitelist())
                .to.be.revertedWith("whitelist::not open");
        });

        it(`Toggle public phase success`, async () => {
            await expect(firstSaleMinterVrf.connect(admin).togglePublicPhase())
            .to.be.emit(firstSaleMinterVrf, "PublicPhaseToggled")
            .withArgs(true);
        });

        it(`Toggle whitelist phase success`, async () => {
            await expect(firstSaleMinterVrf.connect(admin).toggleWhitelistPhase())
            .to.be.emit(firstSaleMinterVrf, "WhitelistPhaseToggled")
            .withArgs(true);
        });
    })
})