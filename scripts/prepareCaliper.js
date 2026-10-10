const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deploy to the running local node and save the address for Caliper + frontend.
// Authority = Hardhat account #0 (default deployer).
async function main() {
  const signers = await hre.ethers.getSigners();
  const authority = signers[0].address;
  console.log("Authority (account 0):", authority);

  const Factory = await hre.ethers.getContractFactory("CivicChain");
  const contract = await Factory.deploy(authority);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("Deployed to:", address);

  const outPath = path.join(__dirname, "..", "caliper", "contract.json");
  fs.writeFileSync(outPath, JSON.stringify({ address: address, authority: authority }, null, 2));
  console.log("Wrote:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
