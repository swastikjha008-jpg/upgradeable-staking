// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

/// @title StakingV1
/// @notice Stake native ETH, withdraw it any time. Deployed behind a UUPS proxy.
contract StakingV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardTransient {
    mapping(address => uint256) public stakedBalance;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    error ZeroAmount();
    error InsufficientStake();
    error TransferFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public virtual initializer {
        __Ownable_init(initialOwner);
    }

    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    function stake() public payable virtual nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        stakedBalance[msg.sender] += msg.value;
        totalStaked += msg.value;
        emit Staked(msg.sender, msg.value);
    }

    receive() external payable {
        stake();
    }

    function unstake(uint256 amount) external virtual nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (stakedBalance[msg.sender] < amount) revert InsufficientStake();
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Unstaked(msg.sender, amount);
    }

    /// @dev Only the owner can authorize an upgrade.
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}
}
