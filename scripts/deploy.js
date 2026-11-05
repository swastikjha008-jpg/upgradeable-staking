const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const StakingV1 = await ethers.getContractFactory("StakingV1");
  const proxy = await upgrades.deployProxy(StakingV1, [deployer.address], { kind: "uups" });
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Proxy:         ", proxyAddress);
  console.log("Implementation:", implAddress);

  const file = path.join(__dirname, "..", "deployments.json");
  const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
  all[network.name] = { proxy: proxyAddress, implementation: implAddress, version: "1.0.0" };
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
