const hre = require("hardhat");
require("dotenv").config();

// Deploy CivicChain.
// Authority = AUTHORITY_ADDRESS env var if set, else the deployer wallet.
// Never hardcode keys: PRIVATE_KEY and SEPOLIA_RPC_URL come from .env (see .env.example).
async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  console.log("Deployer:", deployer.address);

  const envAuthority = process.env.AUTHORITY_ADDRESS || "";
  let authorityAddress = deployer.address;
  if (envAuthority !== "") {
    authorityAddress = envAuthority;
  }
  console.log("Authority:", authorityAddress);

  const Factory = await hre.ethers.getContractFactory("CivicChain");
  const contract = await Factory.deploy(authorityAddress);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("CivicChain deployed to:", contractAddress);

  const deployTx = contract.deploymentTransaction();
  if (deployTx !== null) {
    console.log("Deployment tx hash:", deployTx.hash);
  }
  console.log("Network:", hre.network.name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
