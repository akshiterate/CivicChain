// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// CivicChain: one simple contract that stores civic complaints.
// Citizens call submitComplaint. Only the authority wallet can call updateStatus.
// Status can only move forward: Reported -> InProgress -> Resolved.
contract CivicChain {
    // Complaint lifecycle. Numbers matter: Reported=0, InProgress=1, Resolved=2.
    enum Status {
        Reported,
        InProgress,
        Resolved
    }

    // One complaint. id is the index in the complaints array.
    struct Complaint {
        uint256 id;
        string description;
        string category;
        string locationText;
        address reporter;
        uint256 createdAt;
        Status status;
    }

    // The municipal wallet allowed to update statuses.
    address public authority;

    // All complaints. Private so reads go through getComplaint (clear for viva).
    Complaint[] private complaints;

    // Emitted when anyone submits a complaint.
    event ComplaintSubmitted(
        uint256 indexed id,
        address indexed reporter,
        string category
    );

    // Emitted when the authority advances a status.
    event StatusUpdated(
        uint256 indexed id,
        Status oldStatus,
        Status newStatus
    );

    // Security: only the authority wallet can update status or rotate authority.
    // The check lives in the contract, not in the frontend.
    modifier onlyAuthority() {
        require(msg.sender == authority, "CivicChain: caller is not authority");
        _;
    }

    // Set the first authority at deploy time. Zero address makes no sense, so revert.
    constructor(address _authority) {
        require(_authority != address(0), "CivicChain: authority is zero address");
        authority = _authority;
    }

    // Anyone can submit. Description must not be empty.
    function submitComplaint(
        string memory _description,
        string memory _category,
        string memory _locationText
    ) public returns (uint256) {
        require(bytes(_description).length > 0, "CivicChain: description empty");

        uint256 newId = complaints.length;

        Complaint memory newComplaint = Complaint({
            id: newId,
            description: _description,
            category: _category,
            locationText: _locationText,
            reporter: msg.sender,
            createdAt: block.timestamp,
            status: Status.Reported
        });

        complaints.push(newComplaint);

        emit ComplaintSubmitted(newId, msg.sender, _category);

        return newId;
    }

    // Only authority, only forward by exactly one step.
    // Reported -> InProgress -> Resolved. No skip, no repeat, no backwards.
    function updateStatus(uint256 _id, Status _newStatus) public onlyAuthority {
        require(_id < complaints.length, "CivicChain: bad complaint id");

        Status oldStatus = complaints[_id].status;
        uint256 oldNumber = uint256(oldStatus);
        uint256 newNumber = uint256(_newStatus);

        require(newNumber == oldNumber + 1, "CivicChain: status must advance by one");

        complaints[_id].status = _newStatus;

        emit StatusUpdated(_id, oldStatus, _newStatus);
    }

    // Read one complaint. Reverts on unknown id so callers fail loudly.
    function getComplaint(uint256 _id) public view returns (Complaint memory) {
        require(_id < complaints.length, "CivicChain: bad complaint id");
        return complaints[_id];
    }

    // Total count. IDs are 0 .. total-1.
    function getTotalComplaints() public view returns (uint256) {
        return complaints.length;
    }

    // Filter helper: all complaints with a given status.
    function getComplaintsByStatus(Status _status) public view returns (Complaint[] memory) {
        uint256 matchCount = 0;
        uint256 total = complaints.length;

        // First pass: count matches so we can allocate the exact array size.
        for (uint256 i = 0; i < total; i++) {
            if (complaints[i].status == _status) {
                matchCount++;
            }
        }

        Complaint[] memory result = new Complaint[](matchCount);
        uint256 resultIndex = 0;

        // Second pass: copy matches.
        for (uint256 i = 0; i < total; i++) {
            if (complaints[i].status == _status) {
                result[resultIndex] = complaints[i];
                resultIndex++;
            }
        }

        return result;
    }

    // Filter helper: exact category string match.
    function getComplaintsByCategory(string memory _category) public view returns (Complaint[] memory) {
        bytes32 wanted = keccak256(abi.encodePacked(_category));
        uint256 matchCount = 0;
        uint256 total = complaints.length;

        for (uint256 i = 0; i < total; i++) {
            bytes32 current = keccak256(abi.encodePacked(complaints[i].category));
            if (current == wanted) {
                matchCount++;
            }
        }

        Complaint[] memory result = new Complaint[](matchCount);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < total; i++) {
            bytes32 current = keccak256(abi.encodePacked(complaints[i].category));
            if (current == wanted) {
                result[resultIndex] = complaints[i];
                resultIndex++;
            }
        }

        return result;
    }

    // Let the current authority hand over to a new municipal wallet.
    function setAuthority(address _newAuthority) public onlyAuthority {
        require(_newAuthority != address(0), "CivicChain: authority is zero address");
        authority = _newAuthority;
    }
}
