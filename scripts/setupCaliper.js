const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Deploy a FRESH CivicChain to the local Hardhat node and write the Caliper
// network config with the ABI + address embedded.
//
// Why embedded? Caliper 0.5.0's ethereum connector deploys contracts WITHOUT
// constructor arguments, but CivicChain needs an authority address. So we
// deploy with ethers here, and Caliper attaches to the live contract through
// its adapter (sutAdapter.sendRequests) so every tx is counted in the report.
// Local test keys only. Never run benchmarks against Sepolia.
async function main() {
  const rpcUrl = "http://127.0.0.1:8545";
  // Well-known PUBLIC Hardhat demo key (printed by `npx hardhat node` on every
  // boot, holds no real funds, local dev only). Real Sepolia keys must NEVER
  // be committed — those live in .env (see .env.example).
  const authorityKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(authorityKey, provider);
  console.log("Authority:", wallet.address);

  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "CivicChain.sol", "CivicChain.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(wallet.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("Deployed to:", address);

  const caliperDir = path.join(__dirname, "..", "caliper");
  fs.writeFileSync(
    path.join(caliperDir, "contract.json"),
    JSON.stringify({ address: address, authority: wallet.address }, null, 2)
  );

  const networkConfig = {
    caliper: { blockchain: "ethereum" },
    ethereum: {
      url: "ws://127.0.0.1:8545",
      fromAddress: wallet.address,
      fromAddressPrivateKey: authorityKey,
      contractDeployerAddress: wallet.address,
      contractDeployerAddressPrivateKey: authorityKey,
      contracts: {
        CivicChain: {
          address: address,
          abi: artifact.abi,
          gas: { submitComplaint: 500000, updateStatus: 200000 }
        }
      }
    }
  };
  fs.writeFileSync(path.join(caliperDir, "networkConfig.json"), JSON.stringify(networkConfig, null, 2));
  console.log("Wrote caliper/contract.json and caliper/networkConfig.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
