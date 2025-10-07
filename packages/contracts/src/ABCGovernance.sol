// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ABCStaking.sol";

contract ABCGovernance is ReentrancyGuard {
    IERC20 public immutable abcToken;
    ABCStaking public immutable stakingContract;
    
    uint256 public constant PROPOSAL_THRESHOLD = 10000 * 10**18; // 10,000 ABC minimum to propose
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public proposalCount;
    
    struct Proposal {
        uint256 id;
        address proposer;
        address recipient;
        uint256 amount;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool cancelled;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public treasuryBalance;
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address proposer, address recipient, uint256 amount);
    event VoteCast(uint256 indexed proposalId, address voter, bool support, uint256 votes);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event TreasuryFunded(uint256 amount);
    
    constructor(address _abcToken, address payable _stakingContract) {
        abcToken = IERC20(_abcToken);
        stakingContract = ABCStaking(_stakingContract);
    }
    
    // Receive ABC tokens for treasury
    function fundTreasury(uint256 _amount) external {
        abcToken.transferFrom(msg.sender, address(this), _amount);
        treasuryBalance += _amount;
        emit TreasuryFunded(_amount);
    }
    
    function createProposal(
        address _recipient,
        uint256 _amount,
        string memory _description
    ) external returns (uint256) {
        require(stakingContract.getVotingPower(msg.sender) >= PROPOSAL_THRESHOLD, "Insufficient voting power");
        require(_amount <= treasuryBalance, "Amount exceeds treasury balance");
        require(_recipient != address(0), "Invalid recipient");
        
        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.proposer = msg.sender;
        newProposal.recipient = _recipient;
        newProposal.amount = _amount;
        newProposal.description = _description;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + VOTING_PERIOD;
        
        emit ProposalCreated(proposalCount, msg.sender, _recipient, _amount);
        return proposalCount;
    }
    
    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(!proposal.cancelled, "Proposal cancelled");
        
        uint256 votingPower = stakingContract.getVotingPower(msg.sender);
        require(votingPower > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (_support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        emit VoteCast(_proposalId, msg.sender, _support, votingPower);
    }
    
    function executeProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(block.timestamp > proposal.endTime + EXECUTION_DELAY, "Execution delay not met");
        require(proposal.forVotes > proposal.againstVotes, "Proposal did not pass");
        require(proposal.amount <= treasuryBalance, "Insufficient treasury balance");
        
        proposal.executed = true;
        treasuryBalance -= proposal.amount;
        
        abcToken.transfer(proposal.recipient, proposal.amount);
        
        emit ProposalExecuted(_proposalId);
    }
    
    function cancelProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(msg.sender == proposal.proposer, "Only proposer can cancel");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Already cancelled");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        
        proposal.cancelled = true;
        emit ProposalCancelled(_proposalId);
    }
    
    function getProposal(uint256 _proposalId) external view returns (
        address proposer,
        address recipient,
        uint256 amount,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        bool executed,
        bool cancelled
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.proposer,
            proposal.recipient,
            proposal.amount,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed,
            proposal.cancelled
        );
    }
}