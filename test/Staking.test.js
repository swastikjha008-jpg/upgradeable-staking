const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const DAY = 24 * 60 * 60;
const LOCK = 21 * DAY;

describe("Upgradeable Staking", function () {
  let owner, alice, bob, proxy;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const V1 = await ethers.getContractFactory("StakingV1");
    proxy = await upgrades.deployProxy(V1, [owner.address], { kind: "uups" });
    await proxy.waitForDeployment();
  });

  describe("V1", () => {
    it("initializes owner and version", async () => {
      expect(await proxy.owner()).to.equal(owner.address);
      expect(await proxy.version()).to.equal("1.0.0");
    });

    it("cannot be initialized twice", async () => {
      await expect(proxy.initialize(alice.address)).to.be.reverted;
    });

    it("stakes ETH and tracks balances", async () => {
      await proxy.connect(alice).stake({ value: ethers.parseEther("2") });
      expect(await proxy.stakedBalance(alice.address)).to.equal(ethers.parseEther("2"));
      expect(await proxy.totalStaked()).to.equal(ethers.parseEther("2"));
    });

    it("stakes via plain ETH transfer", async () => {
      await alice.sendTransaction({ to: await proxy.getAddress(), value: ethers.parseEther("1") });
      expect(await proxy.stakedBalance(alice.address)).to.equal(ethers.parseEther("1"));
    });

    it("reverts on zero stake", async () => {
      await expect(proxy.connect(alice).stake({ value: 0 })).to.be.revertedWithCustomError(proxy, "ZeroAmount");
    });

    it("unstakes instantly", async () => {
      await proxy.connect(alice).stake({ value: ethers.parseEther("2") });
      await expect(proxy.connect(alice).unstake(ethers.parseEther("1"))).to.changeEtherBalances(
        [alice, proxy],
        [ethers.parseEther("1"), -ethers.parseEther("1")]
      );
      expect(await proxy.stakedBalance(alice.address)).to.equal(ethers.parseEther("1"));
    });

    it("cannot unstake more than staked", async () => {
      await proxy.connect(alice).stake({ value: 1n });
      await expect(proxy.connect(alice).unstake(2n)).to.be.revertedWithCustomError(proxy, "InsufficientStake");
    });

    it("only owner can upgrade", async () => {
      const V2 = await ethers.getContractFactory("StakingV2", alice);
      await expect(upgrades.upgradeProxy(await proxy.getAddress(), V2, { kind: "uups" })).to.be.reverted;
    });
  });

  describe("Upgrade V1 -> V2", () => {
    let v2;

    beforeEach(async () => {
      await proxy.connect(alice).stake({ value: ethers.parseEther("3") });
      await proxy.connect(bob).stake({ value: ethers.parseEther("1") });

      const V2 = await ethers.getContractFactory("StakingV2");
      v2 = await upgrades.upgradeProxy(await proxy.getAddress(), V2, {
        kind: "uups",
        call: { fn: "initializeV2", args: [LOCK] },
      });
    });

    it("keeps the same proxy address and preserves state", async () => {
      expect(await v2.getAddress()).to.equal(await proxy.getAddress());
      expect(await v2.version()).to.equal("2.0.0");
      expect(await v2.stakedBalance(alice.address)).to.equal(ethers.parseEther("3"));
      expect(await v2.stakedBalance(bob.address)).to.equal(ethers.parseEther("1"));
      expect(await v2.totalStaked()).to.equal(ethers.parseEther("4"));
      expect(await v2.owner()).to.equal(owner.address);
      expect(await v2.lockPeriod()).to.equal(LOCK);
    });

    it("cannot re-run initializeV2", async () => {
      await expect(v2.initializeV2(1)).to.be.reverted;
    });

    it("disables instant unstake", async () => {
      await expect(v2.connect(alice).unstake(1n)).to.be.revertedWithCustomError(v2, "UseRequestUnstake");
    });

    it("enforces the 21 day lock on withdrawals", async () => {
      await v2.connect(alice).requestUnstake(ethers.parseEther("2"));
      expect(await v2.stakedBalance(alice.address)).to.equal(ethers.parseEther("1"));
      expect(await v2.totalStaked()).to.equal(ethers.parseEther("2"));
      expect(await v2.totalPendingWithdrawals()).to.equal(ethers.parseEther("2"));

      await expect(v2.connect(alice).claim(0)).to.be.revertedWithCustomError(v2, "StillLocked");

      await time.increase(LOCK - 60);
      await expect(v2.connect(alice).claim(0)).to.be.revertedWithCustomError(v2, "StillLocked");

      await time.increase(120);
      await expect(v2.connect(alice).claim(0)).to.changeEtherBalances(
        [alice, v2],
        [ethers.parseEther("2"), -ethers.parseEther("2")]
      );
      expect(await v2.totalPendingWithdrawals()).to.equal(0);
    });

    it("cannot claim twice", async () => {
      await v2.connect(alice).requestUnstake(1n);
      await time.increase(LOCK + 1);
      await v2.connect(alice).claim(0);
      await expect(v2.connect(alice).claim(0)).to.be.revertedWithCustomError(v2, "AlreadyClaimed");
    });

    it("rejects invalid request ids and over-withdrawal", async () => {
      await expect(v2.connect(alice).claim(5)).to.be.revertedWithCustomError(v2, "InvalidRequest");
      await expect(v2.connect(bob).requestUnstake(ethers.parseEther("2"))).to.be.revertedWithCustomError(
        v2,
        "InsufficientStake"
      );
    });

    it("lets only the owner change the lock period", async () => {
      await expect(v2.connect(alice).setLockPeriod(1)).to.be.revertedWithCustomError(v2, "OwnableUnauthorizedAccount");
      await v2.connect(owner).setLockPeriod(DAY);
      expect(await v2.lockPeriod()).to.equal(DAY);
    });

    it("still accepts new stakes", async () => {
      await v2.connect(bob).stake({ value: ethers.parseEther("1") });
      expect(await v2.stakedBalance(bob.address)).to.equal(ethers.parseEther("2"));
    });
  });
});
