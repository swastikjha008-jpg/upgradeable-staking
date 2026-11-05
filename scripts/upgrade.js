const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const LOCK_PERIOD = 21 * 24 * 60 * 60; // 21 days

async function main() {
  const file = path.join(__dirname, "..", "deployments.json");
  const all = JSON.parse(fs.readFileSync(file));
  const entry = all[network.name];
  if (!entry) throw new Error(`No deployment found for ${network.name}. Run deploy first.`);

  const StakingV2 = await ethers.getContractFactory("StakingV2");
  const upgraded = await upgrades.upgradeProxy(entry.proxy, StakingV2, {
    kind: "uups",
    call: { fn: "initializeV2", args: [LOCK_PERIOD] },
  });
  await upgraded.waitForDeployment();

  const implAddress = await upgrades.erc1967.getImplementationAddress(entry.proxy);
  console.log("Proxy (unchanged):", entry.proxy);
  console.log("New implementation:", implAddress);

  all[network.name] = { ...entry, implementation: implAddress, version: "2.0.0" };
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
