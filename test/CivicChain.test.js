const { expect } = require("chai");
const { ethers } = require("hardhat");

// Tests use plain if-free expects so a beginner can read each case.
// Each test deploys a fresh contract: deployer is authority by default.
async function deployFresh(authorityOverride) {
  const [deployer, authority, citizen, stranger] = await ethers.getSigners();
  const chosenAuthority = authorityOverride || authority.address;
  const Factory = await ethers.getContractFactory("CivicChain");
  const contract = await Factory.deploy(chosenAuthority);
  await contract.waitForDeployment();
  return { contract, deployer, authority, citizen, stranger };
}

describe("CivicChain", function () {
  it("sets the authority from the constructor", async function () {
    const { contract, authority } = await deployFresh();
    expect(await contract.authority()).to.equal(authority.address);
  });

  it("reverts when constructor gets the zero address", async function () {
    const Factory = await ethers.getContractFactory("CivicChain");
    await expect(
      Factory.deploy(ethers.ZeroAddress)
    ).to.be.revertedWith("CivicChain: authority is zero address");
  });

  it("submits a complaint with unique IDs", async function () {
    const { contract, citizen } = await deployFresh();
    const id0 = await contract.connect(citizen).submitComplaint.staticCall(
      "Pothole on MG Road",
      "Pothole",
      "Near bus stop"
    );
    expect(id0).to.equal(0);

    await contract.connect(citizen).submitComplaint("Pothole on MG Road", "Pothole", "Near bus stop");
    await contract.connect(citizen).submitComplaint("Streetlight off", "Streetlight", "Park gate");

    expect(await contract.getTotalComplaints()).to.equal(2);

    const first = await contract.getComplaint(0);
    expect(first.id).to.equal(0);
    expect(first.description).to.equal("Pothole on MG Road");
    expect(first.category).to.equal("Pothole");
    expect(first.reporter).to.equal(citizen.address);
    expect(first.status).to.equal(0); // Reported
  });

  it("retrieves complaint details and timestamp", async function () {
    const { contract, citizen } = await deployFresh();
    await contract.connect(citizen).submitComplaint("Garbage overflow", "Garbage", "Lane 4");
    const complaint = await contract.getComplaint(0);
    expect(complaint.description).to.equal("Garbage overflow");
    expect(complaint.locationText).to.equal("Lane 4");
    expect(complaint.createdAt).to.be.greaterThan(0);
  });

  it("rejects empty descriptions", async function () {
    const { contract, citizen } = await deployFresh();
    await expect(
      contract.connect(citizen).submitComplaint("", "Pothole", "Somewhere")
    ).to.be.revertedWith("CivicChain: description empty");
  });

  it("rejects unknown complaint IDs", async function () {
    const { contract } = await deployFresh();
    await expect(contract.getComplaint(0)).to.be.revertedWith("CivicChain: bad complaint id");
    await expect(contract.getComplaint(99)).to.be.revertedWith("CivicChain: bad complaint id");
  });

  it("lets only the authority update status, forward by one step", async function () {
    const { contract, authority, citizen } = await deployFresh();
    await contract.connect(citizen).submitComplaint("Pothole", "Pothole", "X");

    // Citizen (not authority) must fail.
    await expect(
      contract.connect(citizen).updateStatus(0, 1)
    ).to.be.revertedWith("CivicChain: caller is not authority");

    // Valid: Reported(0) -> InProgress(1).
    await contract.connect(authority).updateStatus(0, 1);
    expect((await contract.getComplaint(0)).status).to.equal(1);

    // Valid: InProgress(1) -> Resolved(2).
    await contract.connect(authority).updateStatus(0, 2);
    expect((await contract.getComplaint(0)).status).to.equal(2);
  });

  it("rejects skipped, repeated, and backwards transitions", async function () {
    const { contract, authority, citizen } = await deployFresh();
    await contract.connect(citizen).submitComplaint("Pothole", "Pothole", "X");

    // Skip: 0 -> 2 must fail.
    await expect(
      contract.connect(authority).updateStatus(0, 2)
    ).to.be.revertedWith("CivicChain: status must advance by one");

    // Repeat: 0 -> 0 must fail.
    await expect(
      contract.connect(authority).updateStatus(0, 0)
    ).to.be.revertedWith("CivicChain: status must advance by one");

    // Go forward once, then try backwards 1 -> 0.
    await contract.connect(authority).updateStatus(0, 1);
    await expect(
      contract.connect(authority).updateStatus(0, 0)
    ).to.be.revertedWith("CivicChain: status must advance by one");
  });

  it("rejects status updates for unknown IDs", async function () {
    const { contract, authority } = await deployFresh();
    await expect(
      contract.connect(authority).updateStatus(5, 1)
    ).to.be.revertedWith("CivicChain: bad complaint id");
  });

  it("emits ComplaintSubmitted and StatusUpdated events", async function () {
    const { contract, authority, citizen } = await deployFresh();

    await expect(
      contract.connect(citizen).submitComplaint("Pothole", "Pothole", "X")
    )
      .to.emit(contract, "ComplaintSubmitted")
      .withArgs(0, citizen.address, "Pothole");

    await expect(contract.connect(authority).updateStatus(0, 1))
      .to.emit(contract, "StatusUpdated")
      .withArgs(0, 0, 1);
  });

  it("filters by status and category", async function () {
    const { contract, authority, citizen } = await deployFresh();
    await contract.connect(citizen).submitComplaint("Pothole A", "Pothole", "A");
    await contract.connect(citizen).submitComplaint("Light B", "Streetlight", "B");
    await contract.connect(authority).updateStatus(0, 1);

    const inProgress = await contract.getComplaintsByStatus(1);
    expect(inProgress.length).to.equal(1);
    expect(inProgress[0].description).to.equal("Pothole A");

    const potholes = await contract.getComplaintsByCategory("Pothole");
    expect(potholes.length).to.equal(1);
    expect(potholes[0].description).to.equal("Pothole A");
  });

  it("lets the authority rotate to a new wallet", async function () {
    const { contract, authority, stranger, citizen } = await deployFresh();
    await contract.connect(authority).setAuthority(stranger.address);
    expect(await contract.authority()).to.equal(stranger.address);

    // Old authority can no longer update.
    await contract.connect(citizen).submitComplaint("Pothole", "Pothole", "X");
    await expect(
      contract.connect(authority).updateStatus(0, 1)
    ).to.be.revertedWith("CivicChain: caller is not authority");
  });
});
