import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as chai from "chai";
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
import { keccak256 } from "ethers/lib/utils";

function parseEther(amount: Number) {
    return ethers.utils.parseUnits(amount.toString(), 18);
}

describe("Vault", function () {
    let owner: SignerWithAddress,
        alice: SignerWithAddress,
        carol: SignerWithAddress,
        bob: SignerWithAddress;

    let vault: Contract,
        token: Contract;

    beforeEach(async () => {
        await ethers.provider.send("hardhat_reset", []);
        [owner, alice, bob, carol] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("Floppy", owner);
        token = await Token.deploy();

        const Vault = await ethers.getContractFactory("Vault", owner);
        vault = await Vault.deploy();

        await vault.setToken(token.address);
    })

    //Happy path
    it("Should deposit into the Vault", async () => {
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
        await vault.connect(alice).deposit(parseEther(5 * 10 ** 5));
        expect(await token.balanceOf(vault.address)).equal(parseEther(5 * 10 ** 5));
    })

    it("Should withdraw", async () => {
        //grant withdrawer role to Bob
        let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
        await vault.grantRole(WITHDRAWER_ROLE, bob.address);

        //setter value functions
        vault.setWithdrawEnable(true);
        vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

        //alice deposit into vault 
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
        await vault.connect(alice).deposit(parseEther(5 * 10 ** 5));

        //bob withdraw into alice
        await vault.connect(bob).withdraw(parseEther(3 * 10 ** 5), alice.address);

        expect(await token.balanceOf(alice.address)).equal(parseEther(8 * 10 ** 5));
        expect(await token.balanceOf(vault.address)).equal(parseEther(2 * 10 ** 5));
    })

    //Unhappy path
    it("Should not deposit, Insufficient account balance", async () => {
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
        await expect(vault.connect(alice).deposit(parseEther(5 * 10 ** 6))).revertedWith("Insufficient account balance");
    })

    it("Should not withdraw, Withdraw is not available", async () => {
        //grant withdrawer role to Bob
        let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
        await vault.grantRole(WITHDRAWER_ROLE, bob.address);

        //setter value functions
        vault.setWithdrawEnable(false);
        vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

        //alice deposit into vault 
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
        await vault.connect(alice).deposit(parseEther(5 * 10 ** 5));

        //bob withdraw into alice
        await expect(vault.connect(bob).withdraw(parseEther(3 * 10 ** 5), alice.address)).rejectedWith("Withdraw is not available");
    })

    it("Should not withdraw, Exceed maximum amount", async () => {
        //grant withdrawer role to Bob
        let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
        await vault.grantRole(WITHDRAWER_ROLE, bob.address);

        //setter value functions
        vault.setWithdrawEnable(false);
        vault.setMaxWithdrawAmount(parseEther(3 * 10 ** 5));

        //alice deposit into vault 
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
        await vault.connect(alice).deposit(parseEther(5 * 10 ** 5));

        await expect(vault.connect(bob).withdraw(parseEther(4 * 10 ** 5), alice.address)).revertedWith("Withdraw is not available");
    })

    it("Should not withdraw, Caller is not a withdrawer", async () => {
        //grant withdrawer role to Bob
        let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
        await vault.grantRole(WITHDRAWER_ROLE, bob.address);

        //setter value functions
        vault.setWithdrawEnable(true);
        vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

        //alice deposit into vault 
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
        await vault.connect(alice).deposit(parseEther(5 * 10 ** 5));

        //bob withdraw into alice
        await expect(vault.connect(carol).withdraw(parseEther(3 * 10 ** 5), alice.address)).revertedWith("Caller is not a withdrawer");
    })

    it("Should not withdraw, ERC20: transfer amount exceeds balance", async () => {
        //grant withdrawer role to Bob
        let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
        await vault.grantRole(WITHDRAWER_ROLE, bob.address);

        //setter value functions
        vault.setWithdrawEnable(true);
        vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

        //alice deposit into vault 
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));
        await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
        await vault.connect(alice).deposit(parseEther(3 * 10 ** 5));

        //bob withdraw into alice
        await expect(vault.connect(bob).withdraw(parseEther(5 * 10 ** 5), alice.address)).revertedWith("ERC20: transfer amount exceeds balance");
    })

    it("Should not withdraw, ERC20: insufficient allowance", async () => {
        //alice deposit into vault 
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));

        const initAliceBalance = await token.balanceOf(alice.address);
        const initVaultBalance = await token.balanceOf(vault.address);

        //bob withdraw into alice
        await expect(vault.connect(alice).deposit(parseEther(5 * 10 ** 5))).revertedWith("ERC20: insufficient allowance");

        expect(await token.balanceOf(alice.address)).equal(initAliceBalance);
        expect(await token.balanceOf(vault.address)).equal(initVaultBalance);

    })
})
