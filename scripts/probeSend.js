const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Standalone check: can we send submitComplaint like the Caliper workload does?
async function main() {
  const guard = setTimeout(() => {
    console.log("TIMEOUT: hung for 45s");
    process.exit(2);
  }, 45000);

  const rpcUrl = "http://127.0.0.1:8545";
  // Well-known PUBLIC Hardhat demo key (see note in scripts/setupCaliper.js).
  const citizenKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(citizenKey, provider);

  const contractJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "caliper", "contract.json"), "utf8"));
  const artifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", "CivicChain.sol", "CivicChain.json"), "utf8")
  );
  const contract = new ethers.Contract(contractJson.address, artifact.abi, wallet);

  console.log("nonce start:", await provider.getTransactionCount(wallet.address));
  const start = Date.now();
  const tx = await contract.submitComplaint("standalone probe", "Pothole", "probe street");
  console.log("sent in", Date.now() - start, "ms hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("mined in", Date.now() - start, "ms status:", receipt.status);
  console.log("total now:", await contract.getTotalComplaints());
  clearTimeout(guard);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
