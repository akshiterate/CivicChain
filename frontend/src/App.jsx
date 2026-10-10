import { useEffect, useState } from "react";
import {
  CONTRACT_ADDRESS,
  EXPECTED_CHAIN_ID,
  STATUS_NAMES,
  CATEGORIES,
  connectWallet,
  getWriteContract,
  loadAllComplaints,
  getReadOnlyContract,
} from "./contract.js";

// One file, small sections. Each section is a plain function below.
// Data flow: button -> ethers contract call -> tx.wait() -> reload list from chain.
export default function App() {
  const [wallet, setWallet] = useState("");
  const [chainId, setChainId] = useState(0);
  const [authority, setAuthority] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const wrongNetwork = wallet !== "" && chainId !== EXPECTED_CHAIN_ID;

  // Load public feed + authority address on start.
  useEffect(() => {
    refreshFeed();
  }, []);

  async function refreshFeed() {
    try {
      const list = await loadAllComplaints();
      setComplaints(list);
      const readOnly = getReadOnlyContract();
      const authorityAddress = await readOnly.authority();
      setAuthority(authorityAddress);
    } catch (error) {
      setMessage("Read error: " + errorMessage(error));
    }
  }

  async function onConnect() {
    setMessage("");
    try {
      const result = await connectWallet();
      setWallet(result.address);
      setChainId(result.chainId);
      setMessage("Wallet connected: " + result.address);
    } catch (error) {
      setMessage("Connect error: " + errorMessage(error));
    }
  }

  // Submit form handler lives in <SubmitForm>, this is the shared chain call.
  async function submitComplaint(description, category, locationText) {
    setBusy(true);
    setMessage("Submitting... waiting for MetaMask confirmation.");
    try {
      const contract = await getWriteContract();
      const tx = await contract.submitComplaint(description, category, locationText);
      setMessage("Pending... tx " + tx.hash);
      await tx.wait();
      setMessage("Confirmed! Complaint recorded. Tx " + tx.hash);
      await refreshFeed();
    } catch (error) {
      setMessage("Submit error: " + errorMessage(error));
    }
    setBusy(false);
  }

  // Authority advances status by exactly one step (contract enforces it).
  async function advanceStatus(complaint) {
    if (complaint.status >= 2) {
      setMessage("Already Resolved.");
      return;
    }
    const nextStatus = complaint.status + 1;
    setBusy(true);
    setMessage("Updating status to " + STATUS_NAMES[nextStatus] + "...");
    try {
      const contract = await getWriteContract();
      const tx = await contract.updateStatus(complaint.id, nextStatus);
      setMessage("Pending... tx " + tx.hash);
      await tx.wait();
      setMessage("Confirmed! Status updated. Tx " + tx.hash);
      await refreshFeed();
    } catch (error) {
      setMessage("Update error: " + errorMessage(error));
    }
    setBusy(false);
  }

  // Plain loop filter so a beginner can explain it.
  function visibleComplaints() {
    const result = [];
    for (const item of complaints) {
      if (statusFilter !== "All" && STATUS_NAMES[item.status] !== statusFilter) {
        continue;
      }
      if (categoryFilter !== "All" && item.category !== categoryFilter) {
        continue;
      }
      result.push(item);
    }
    return result;
  }

  const isAuthority = wallet !== "" && authority !== "" && wallet.toLowerCase() === authority.toLowerCase();

  return (
    <div className="page">
      <header>
        <h1>CivicChain</h1>
        <p>Decentralized civic complaints. The contract is the source of truth.</p>
        <div className="walletBar">
          {wallet === "" ? (
            <button onClick={onConnect}>Connect MetaMask</button>
          ) : (
            <span>
              {wallet} (chain {chainId})
            </span>
          )}
          <button onClick={refreshFeed}>Refresh feed</button>
        </div>
        {CONTRACT_ADDRESS === "" && <p className="error">Set VITE_CONTRACT_ADDRESS first (see frontend/.env.example).</p>}
        {wrongNetwork && (
          <p className="error">
            Wrong network. Expected chain {EXPECTED_CHAIN_ID}, connected to {chainId}. Switch in MetaMask.
          </p>
        )}
        {authority !== "" && <p>Authority wallet: {authority}</p>}
        {message !== "" && <p className="message">{message}</p>}
      </header>

      <SubmitForm onSubmit={submitComplaint} busy={busy} />

      <section>
        <h2>Public complaints</h2>
        <div className="filters">
          <label>
            Status:{" "}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              {STATUS_NAMES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Category:{" "}
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option>All</option>
              {CATEGORIES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <ComplaintList items={visibleComplaints()} onAdvance={advanceStatus} isAuthority={isAuthority} busy={busy} />
      </section>

      <section>
        <h2>Authority dashboard</h2>
        {isAuthority ? (
          <p>You are the authority. Use “Advance status” on any Reported / In Progress complaint.</p>
        ) : (
          <p>Connect the authority wallet to update statuses. The contract rejects anyone else.</p>
        )}
      </section>
    </div>
  );
}

// Small form: description + category + optional location.
function SubmitForm({ onSubmit, busy }) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [locationText, setLocationText] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (description.trim() === "") {
      alert("Description is required.");
      return;
    }
    await onSubmit(description.trim(), category, locationText.trim());
    setDescription("");
    setLocationText("");
  }

  return (
    <section>
      <h2>Report a problem</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Describe the problem (required)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="row">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <input
            placeholder="Location (optional)"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy}>
          Submit complaint
        </button>
      </form>
    </section>
  );
}

// Plain list. Each card shows details + advance button.
function ComplaintList({ items, onAdvance, isAuthority, busy }) {
  if (items.length === 0) {
    return <p>No complaints match the filters.</p>;
  }
  return (
    <div className="cards">
      {items.map((item) => (
        <div key={item.id} className="card">
          <strong>
            #{item.id} — {item.category} — {STATUS_NAMES[item.status]}
          </strong>
          <p>{item.description}</p>
          {item.locationText !== "" && <p>Location: {item.locationText}</p>}
          <small>
            Reporter {item.reporter} · {new Date(item.createdAt * 1000).toLocaleString()}
          </small>
          <br />
          {item.status < 2 && (
            <button disabled={busy || !isAuthority} onClick={() => onAdvance(item)} title={isAuthority ? "" : "Authority wallet only"}>
              Advance to {STATUS_NAMES[item.status + 1]}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// MetaMask errors are nested; pull out the human-readable part.
function errorMessage(error) {
  if (error === null || error === undefined) {
    return "unknown error";
  }
  if (error.reason !== undefined && error.reason !== "") {
    return error.reason;
  }
  if (error.shortMessage !== undefined && error.shortMessage !== "") {
    return error.shortMessage;
  }
  if (error.message !== undefined) {
    return error.message;
  }
  return String(error);
}
