// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StakingV1} from "./StakingV1.sol";

/// @title StakingV2
/// @notice Upgrade of StakingV1: withdrawals now go through a lock period (default 21 days).
///         Storage layout of V1 is untouched; new variables are appended.
contract StakingV2 is StakingV1 {
    struct WithdrawRequest {
        uint256 amount;
        uint256 unlockTime;
    }

    // ---- new storage (appended after V1 layout) ----
    uint256 public lockPeriod;
    mapping(address => WithdrawRequest[]) private _requests;
    uint256 public totalPendingWithdrawals;

    event WithdrawRequested(address indexed user, uint256 indexed id, uint256 amount, uint256 unlockTime);
    event WithdrawClaimed(address indexed user, uint256 indexed id, uint256 amount);
    event LockPeriodUpdated(uint256 newLockPeriod);

    error UseRequestUnstake();
    error StillLocked(uint256 unlockTime);
    error InvalidRequest();
    error AlreadyClaimed();

    /// @dev Called once through upgradeToAndCall.
    function initializeV2(uint256 _lockPeriod) public reinitializer(2) {
        lockPeriod = _lockPeriod;
        emit LockPeriodUpdated(_lockPeriod);
    }

    function version() public pure override returns (string memory) {
        return "2.0.0";
    }

    /// @notice Instant unstake is disabled in V2.
    function unstake(uint256) external pure override {
        revert UseRequestUnstake();
    }

    /// @notice Start the withdrawal. Funds stop counting as staked and unlock after `lockPeriod`.
    function requestUnstake(uint256 amount) external nonReentrant returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (stakedBalance[msg.sender] < amount) revert InsufficientStake();

        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        totalPendingWithdrawals += amount;

        uint256 unlockTime = block.timestamp + lockPeriod;
        id = _requests[msg.sender].length;
        _requests[msg.sender].push(WithdrawRequest(amount, unlockTime));
        emit WithdrawRequested(msg.sender, id, amount, unlockTime);
    }

    /// @notice Claim ETH once the lock has passed.
    function claim(uint256 id) external nonReentrant {
        if (id >= _requests[msg.sender].length) revert InvalidRequest();
        WithdrawRequest storage r = _requests[msg.sender][id];
        uint256 amount = r.amount;
        if (amount == 0) revert AlreadyClaimed();
        if (block.timestamp < r.unlockTime) revert StillLocked(r.unlockTime);

        r.amount = 0;
        totalPendingWithdrawals -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit WithdrawClaimed(msg.sender, id, amount);
    }

    function withdrawRequestCount(address user) external view returns (uint256) {
        return _requests[user].length;
    }

    function getWithdrawRequest(address user, uint256 id) external view returns (uint256 amount, uint256 unlockTime) {
        WithdrawRequest memory r = _requests[user][id];
        return (r.amount, r.unlockTime);
    }

    function setLockPeriod(uint256 newLockPeriod) external onlyOwner {
        lockPeriod = newLockPeriod;
        emit LockPeriodUpdated(newLockPeriod);
    }
}
