// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title MilestoneEscrow
/// @notice USDC milestone holds for a freelance brief. Built for Arc, where USDC is gas.
contract MilestoneEscrow {
    enum Status { None, Funded, Delivered, Released, Refunded, Disputed, Resolved }

    struct Deal {
        address client;
        address worker;
        address token;
        uint256 amount;
        uint64 fundedAt;
        uint64 reviewDeadline;
        Status status;
        bytes32 briefHash;
    }

    uint64 public reviewWindow = 3 days;
    address public arbiter;
    uint256 public nextId = 1;
    mapping(uint256 => Deal) public deals;

    event Funded(uint256 indexed id, address indexed client, address indexed worker, address token, uint256 amount, bytes32 briefHash);
    event Delivered(uint256 indexed id, uint64 reviewDeadline);
    event Released(uint256 indexed id, address to, uint256 amount);
    event Refunded(uint256 indexed id, address to, uint256 amount);
    event Disputed(uint256 indexed id);
    event Resolved(uint256 indexed id, address to, uint256 amount);

    error BadWorker();
    error BadAmount();
    error BadStatus();
    error NotWorker();
    error NotClient();
    error NotArbiter();
    error ReviewOpen();
    error ReviewClosed();
    error BadPayee();
    error TransferFailed();

    constructor(address _arbiter) {
        if (_arbiter == address(0)) revert BadPayee();
        arbiter = _arbiter;
    }

    function fund(address worker, address token, uint256 amount, bytes32 briefHash) external returns (uint256 id) {
        if (worker == address(0) || worker == msg.sender) revert BadWorker();
        if (token == address(0) || amount == 0) revert BadAmount();
        id = nextId++;
        deals[id] = Deal({
            client: msg.sender,
            worker: worker,
            token: token,
            amount: amount,
            fundedAt: uint64(block.timestamp),
            reviewDeadline: 0,
            status: Status.Funded,
            briefHash: briefHash
        });
        if (!IERC20(token).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        emit Funded(id, msg.sender, worker, token, amount, briefHash);
    }

    function markDelivered(uint256 id) external {
        Deal storage d = deals[id];
        if (msg.sender != d.worker) revert NotWorker();
        if (d.status != Status.Funded) revert BadStatus();
        d.status = Status.Delivered;
        d.reviewDeadline = uint64(block.timestamp) + reviewWindow;
        emit Delivered(id, d.reviewDeadline);
    }

    function release(uint256 id) external {
        Deal storage d = deals[id];
        if (msg.sender != d.client) revert NotClient();
        if (d.status != Status.Funded && d.status != Status.Delivered) revert BadStatus();
        d.status = Status.Released;
        if (!IERC20(d.token).transfer(d.worker, d.amount)) revert TransferFailed();
        emit Released(id, d.worker, d.amount);
    }

    function claimAfterReview(uint256 id) external {
        Deal storage d = deals[id];
        if (msg.sender != d.worker) revert NotWorker();
        if (d.status != Status.Delivered) revert BadStatus();
        if (block.timestamp < d.reviewDeadline) revert ReviewOpen();
        d.status = Status.Released;
        if (!IERC20(d.token).transfer(d.worker, d.amount)) revert TransferFailed();
        emit Released(id, d.worker, d.amount);
    }

    function refund(uint256 id) external {
        Deal storage d = deals[id];
        if (msg.sender != d.worker) revert NotWorker();
        if (d.status != Status.Funded) revert BadStatus();
        d.status = Status.Refunded;
        if (!IERC20(d.token).transfer(d.client, d.amount)) revert TransferFailed();
        emit Refunded(id, d.client, d.amount);
    }

    function dispute(uint256 id) external {
        Deal storage d = deals[id];
        if (msg.sender != d.client) revert NotClient();
        if (d.status != Status.Delivered) revert BadStatus();
        if (block.timestamp >= d.reviewDeadline) revert ReviewClosed();
        d.status = Status.Disputed;
        emit Disputed(id);
    }

    function resolve(uint256 id, address to) external {
        Deal storage d = deals[id];
        if (msg.sender != arbiter) revert NotArbiter();
        if (d.status != Status.Disputed) revert BadStatus();
        if (to != d.client && to != d.worker) revert BadPayee();
        d.status = Status.Resolved;
        if (!IERC20(d.token).transfer(to, d.amount)) revert TransferFailed();
        emit Resolved(id, to, d.amount);
    }
}
