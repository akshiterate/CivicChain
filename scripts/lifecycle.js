const hre = require("hardhat");

// Full local workflow mirror of the frontend steps:
// 1 citizen connects, 2 submits, 3 reads, 4 authority connects,
// 5 advances status, 6 verifies update + event, 7 unauthorized fails.
async function main() {
  const signers = await hre.ethers.getSigners();
  const citizen = signers[1];
  const authority = signers[2];
  const stranger = signers[3];
  console.log("1. Citizen wallet:", citizen.address);
  console.log("   Authority wallet:", authority.address);

  const Factory = await hre.ethers.getContractFactory("CivicChain");
  const contract = await Factory.deploy(authority.address);
  await contract.waitForDeployment();
  console.log("Deployed at:", await contract.getAddress());

  console.log("2. Citizen submits complaint...");
  const submitTx = await contract.connect(citizen).submitComplaint(
    "Pothole on MG Road",
    "Pothole",
    "Near bus stop"
  );
  await submitTx.wait();
  console.log("   Submit tx:", submitTx.hash);

  console.log("3. Read complaint from contract...");
  const complaint = await contract.getComplaint(0);
  console.log("   id=" + complaint.id + " status=" + complaint.status + " reporter=" + complaint.reporter);

  console.log("4. Authority advances Reported -> In Progress...");
  const updateTx = await contract.connect(authority).updateStatus(0, 1);
  const receipt = await updateTx.wait();
  console.log("   Update tx:", updateTx.hash);

  console.log("5. Verify updated status and event...");
  const updated = await contract.getComplaint(0);
  console.log("   New status:", updated.status, "(1 = In Progress)");
  let foundEvent = false;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed !== null && parsed.name === "StatusUpdated") {
        foundEvent = true;
        console.log("   Event StatusUpdated id=" + parsed.args.id + " old=" + parsed.args.oldStatus + " new=" + parsed.args.newStatus);
      }
    } catch (e) {
      // Not our event, ignore.
    }
  }
  if (foundEvent === false) {
    throw new Error("StatusUpdated event missing");
  }

  console.log("6. Unauthorized wallet tries to update (must fail)...");
  let blocked = false;
  try {
    const badTx = await contract.connect(stranger).updateStatus(0, 2);
    await badTx.wait();
  } catch (error) {
    blocked = true;
    console.log("   Blocked as expected:", error.shortMessage || error.message);
  }
  if (blocked === false) {
    throw new Error("Unauthorized update was NOT blocked");
  }

  console.log("7. Authority resolves In Progress -> Resolved...");
  const resolveTx = await contract.connect(authority).updateStatus(0, 2);
  await resolveTx.wait();
  const final = await contract.getComplaint(0);
  console.log("   Final status:", final.status, "(2 = Resolved)");
  console.log("INTEGRATION OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
