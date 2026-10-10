import { ethers } from "ethers";

// Public config only. Never put a private key in VITE_* variables.
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
export const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || "31337");
export const PUBLIC_RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

export const STATUS_NAMES = ["Reported", "In Progress", "Resolved"];
export const CATEGORIES = ["Pothole", "Streetlight", "Garbage", "Water", "Other"];

// Human-readable ABI: only the functions and events the UI needs.
// Easier to explain in a viva than the full JSON artifact.
export const CONTRACT_ABI = [
  "function submitComplaint(string _description, string _category, string _locationText) returns (uint256)",
  "function updateStatus(uint256 _id, uint8 _newStatus)",
  "function getComplaint(uint256 _id) view returns (tuple(uint256 id, string description, string category, string locationText, address reporter, uint256 createdAt, uint8 status))",
  "function getTotalComplaints() view returns (uint256)",
  "function authority() view returns (address)",
  "event ComplaintSubmitted(uint256 indexed id, address indexed reporter, string category)",
  "event StatusUpdated(uint256 indexed id, uint8 oldStatus, uint8 newStatus)",
];

// Read-only contract (no wallet needed) for the public feed.
export function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(PUBLIC_RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// Wallet-connected contract (MetaMask signer) for writes.
export async function getWriteContract() {
  if (window.ethereum === undefined) {
    throw new Error("MetaMask not found. Install MetaMask to continue.");
  }
  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  const signer = await browserProvider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// Ask MetaMask for the user's address.
export async function connectWallet() {
  if (window.ethereum === undefined) {
    throw new Error("MetaMask not found. Install MetaMask to continue.");
  }
  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await browserProvider.send("eth_requestAccounts", []);
  const network = await browserProvider.getNetwork();
  return { address: accounts[0], chainId: Number(network.chainId), browserProvider };
}

// Load every complaint by index: 0 .. total-1. Simple loop, easy to explain.
export async function loadAllComplaints() {
  if (CONTRACT_ADDRESS === "") {
    throw new Error("Contract address not set. Set VITE_CONTRACT_ADDRESS.");
  }
  const contract = getReadOnlyContract();
  const totalBig = await contract.getTotalComplaints();
  const total = Number(totalBig);
  const list = [];
  for (let id = 0; id < total; id++) {
    const raw = await contract.getComplaint(id);
    list.push(normalizeComplaint(raw));
  }
  // Newest first for the feed.
  list.reverse();
  return list;
}

// ethers returns a tuple; convert BigInts to plain numbers/strings for React.
export function normalizeComplaint(raw) {
  return {
    id: Number(raw.id),
    description: raw.description,
    category: raw.category,
    locationText: raw.locationText,
    reporter: raw.reporter,
    createdAt: Number(raw.createdAt),
    status: Number(raw.status),
  };
}
