// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VotingBoard {
    address public owner;

    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 deadline;
        uint256 yesCount;
        uint256 noCount;
        bool closed;
    }

    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public eligibleVoters;

    event ProposalCreated(uint256 indexed id, string title, uint256 deadline);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool vote);
    event ProposalClosed(uint256 indexed id);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) external onlyOwner returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be in future");
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: _title,
            description: _description,
            deadline: _deadline,
            yesCount: 0,
            noCount: 0,
            closed: false
        });
        emit ProposalCreated(proposalCount, _title, _deadline);
        return proposalCount;
    }

    function registerVoter(address _voter) external onlyOwner {
        eligibleVoters[_voter] = true;
    }

    function castVote(uint256 _proposalId, bool _vote) external {
        require(eligibleVoters[msg.sender], "Not eligible voter");
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.closed, "Proposal is closed");
        require(block.timestamp < proposal.deadline, "Deadline passed");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        hasVoted[_proposalId][msg.sender] = true;

        if (_vote) {
            proposal.yesCount++;
        } else {
            proposal.noCount++;
        }

        emit VoteCast(_proposalId, msg.sender, _vote);
    }

    function closeProposal(uint256 _proposalId) external onlyOwner {
        proposals[_proposalId].closed = true;
        emit ProposalClosed(_proposalId);
    }

    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        return proposals[_proposalId];
    }

    function getVoteCounts(uint256 _proposalId) external view returns (uint256 yes, uint256 no) {
        return (proposals[_proposalId].yesCount, proposals[_proposalId].noCount);
    }
}
