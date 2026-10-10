require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Hardhat 2.x CommonJS config. Do not convert to ESM / Hardhat 3 style.
// Networks:
// - hardhat (in-process, for tests)
// - localhost (npx hardhat node, chainId 31337, for frontend dev + Caliper)
// - sepolia (public testnet, chainId 11155111, needs env vars)
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: SEPOLIA_RPC_URL === "" ? "https://rpc.sepolia.org" : SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY === "" ? [] : [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
