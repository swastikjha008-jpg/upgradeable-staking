# ⚡ Upgradeable ETH Staking Protocol

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge&logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/Ethereum-Smart_Contracts-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenZeppelin-5.x-4E5EE4?style=for-the-badge&logo=openzeppelin&logoColor=white" />
  <img src="https://img.shields.io/badge/Hardhat-2.x-FFF100?style=for-the-badge&logo=hardhat&logoColor=black" />
</p>

<p align="center">
  A native ETH staking protocol demonstrating <strong>UUPS upgradeable smart contracts</strong>, state preservation, and time-locked withdrawals.
</p>

<p align="center">
  <strong>V1 → V2 | UUPS Proxy | ERC-1967 | 21-Day Withdrawal Lock</strong>
</p>

---

## 📖 About the Project

**Upgradeable ETH Staking** is a Solidity-based staking protocol that demonstrates how smart contracts can evolve without deploying an entirely new contract or losing existing user data.

The project uses the **UUPS (Universal Upgradeable Proxy Standard)** architecture with OpenZeppelin to upgrade a staking contract from Version 1 to Version 2.

The protocol starts with basic ETH staking and instant withdrawals in V1. In V2, it introduces a withdrawal request mechanism with a configurable lock period of 21 days by default.

The primary goal is to understand:

- How upgradeable smart contracts work.
- How UUPS proxies manage contract upgrades.
- How existing storage and user balances are preserved.
- How new functionality can be introduced without changing the proxy address.
- How withdrawal requests and time-based restrictions work on-chain.

## ✨ Key Features

- **Native ETH Staking:** Users can deposit ETH directly into the smart contract.
- **Balance Tracking:** Tracks individual staking balances and total ETH staked.
- **UUPS Upgradeability:** Upgrade contract implementations without changing the proxy address.
- **State Preservation:** Existing user balances and ownership remain intact after upgrading.
- **Time-Locked Withdrawals:** V2 introduces a 21-day withdrawal lock by default.
- **Withdrawal Requests:** Users can request withdrawals and claim their ETH after the lock expires.
- **Access Control:** Only the contract owner can authorize upgrades and modify the withdrawal lock period.
- **Security Mechanisms:** Uses OpenZeppelin upgradeable components, reentrancy protection, and custom errors.
- **Automated Testing:** Tests staking, withdrawals, ownership, and the V1 → V2 upgrade process.

---

## 🏗️ Architecture

This project uses the **UUPS Proxy Pattern**.

Instead of directly interacting with the implementation contract, users interact with a proxy contract.

The proxy delegates calls to the current implementation while maintaining the contract's persistent storage.

### How it works

```text
                 👤 USERS
                    |
                    |
                    ▼
          ┌─────────────────────┐
          │    UUPS PROXY       │
          │    ERC-1967         │
          │                     │
          │  Persistent Storage │
          └──────────┬──────────┘
                     |
                     | Delegate Call
                     |
                     ▼
          ┌─────────────────────┐
          │   IMPLEMENTATION    │
          │                     │
          │    StakingV1        │
          └─────────────────────┘
                     |
                     |
              UPGRADE BY OWNER
                     |
                     ▼
          ┌─────────────────────┐
          │   IMPLEMENTATION    │
          │                     │
          │    StakingV2        │
          └─────────────────────┘
```

### Why use a proxy?

Normally, deployed smart contract logic cannot simply be edited.

With a proxy architecture:

1. Users interact with one permanent proxy address.
2. The proxy delegates execution to an implementation contract.
3. The owner authorizes an implementation upgrade.
4. The proxy points to the new implementation.
5. Existing storage remains at the proxy address.

**Important:** The implementation address changes during an upgrade, but the proxy address remains the same.

---

## 🔄 Contract Versions

The project contains two implementations: `StakingV1.sol` and `StakingV2.sol`.

### 🟢 V1 — Basic ETH Staking

V1 provides the basic functionality of an ETH staking protocol.

Users can deposit native ETH, track their balances, and withdraw their funds instantly.

**Features:**

- Accepts ETH through the `stake()` function.
- Also supports staking through direct ETH transfers.
- Tracks individual balances using `stakedBalance`.
- Tracks total deposited ETH using `totalStaked`.
- Allows users to withdraw their ETH at any time.
- Uses `nonReentrant` protection for staking and withdrawal operations.
- Restricts contract upgrades to the owner.

**Example:**

Alice deposits 3 ETH into the staking contract.

```text
Alice deposits 3 ETH
        |
        ▼
  StakingV1 Contract
        |
        ▼
  Alice's Balance: 3 ETH
  Total Staked:    3 ETH
        |
        ▼
 Alice can withdraw instantly
```

V1 provides the foundation for the protocol before introducing more advanced withdrawal functionality.

### 🔵 V2 — Time-Locked ETH Withdrawals

V2 upgrades V1 and introduces a withdrawal request mechanism.

Instead of allowing users to withdraw ETH instantly, users must request a withdrawal and wait for a predefined lock period.

The default lock period is **21 days**.

**New Features:**

- Disables instant withdrawals.
- Introduces `requestUnstake()` to initiate withdrawals.
- Introduces `claim()` to withdraw ETH after the lock expires.
- Tracks individual withdrawal requests.
- Records the amount and unlock timestamp of each request.
- Tracks pending withdrawals using `totalPendingWithdrawals`.
- Allows the owner to modify the withdrawal lock period.
- Preserves existing V1 storage and staking balances.

**Example:**

Alice already has 3 ETH staked in V1.

The contract is upgraded to V2.

```text
       Alice has 3 ETH
              |
              ▼
       V1 → V2 Upgrade
              |
              ▼
    Existing balance preserved
              |
              ▼
      Alice requests 2 ETH
              |
              ▼
     21-Day Withdrawal Lock
              |
              ▼
       Lock period expires
              |
              ▼
       Alice claims 2 ETH
```

**How the withdrawal process works:**

1. Alice calls `requestUnstake(2 ETH)`.
2. The requested amount is deducted from her staked balance.
3. The amount is added to pending withdrawals.
4. The contract records the unlock timestamp.
5. After 21 days, Alice calls `claim(requestId)`.
6. The contract transfers the ETH to Alice.

Each withdrawal request is tracked separately, and a claimed request cannot be claimed again.

**Important:** The existing staking balance is preserved during the upgrade. The new lock period applies to withdrawal requests created after the upgrade.

---

## ⚖️ V1 vs V2 Comparison

| Feature | V1 | V2 |
|---|---|---|
| ETH Staking | ✅ | ✅ |
| Balance Tracking | ✅ | ✅ |
| Total Staked Tracking | ✅ | ✅ |
| Instant Withdrawal | ✅ | ❌ |
| Withdrawal Requests | ❌ | ✅ |
| Time-Locked Withdrawals | ❌ | ✅ |
| Claim Mechanism | ❌ | ✅ |
| Configurable Lock Period | ❌ | ✅ |
| UUPS Upgradeability | ✅ | ✅ |
| State Preservation | — | ✅ |

---

## 🧠 Important Concepts Demonstrated

### 1. UUPS Upgradeable Proxy

UUPS allows the implementation of a smart contract to be upgraded while maintaining the same proxy address and persistent storage.

The upgrade authorization is implemented through `_authorizeUpgrade()`, which restricts upgrades to the owner.

### 2. ERC-1967

ERC-1967 defines standard storage slots used by proxy contracts to store implementation and administrative information.

This project uses the ERC-1967 proxy architecture through OpenZeppelin's UUPS implementation.

### 3. State Preservation

One of the most important parts of upgrading a smart contract is maintaining its existing storage layout.

V2 inherits V1 and appends new storage variables rather than changing the existing V1 storage layout.

This allows existing staking balances and ownership information to remain available after the upgrade.

### 4. Reinitializer

V2 introduces `initializeV2()` using OpenZeppelin's `reinitializer(2)` mechanism.

It initializes the new V2 state exactly once during the upgrade process.

### 5. Reentrancy Protection

The staking and withdrawal functions use reentrancy protection to prevent external calls from re-entering protected operations.

The project uses `ReentrancyGuardTransient`, which relies on EVM transient storage and is configured for the Cancun EVM version.

---

## 🛠️ Tech Stack

### Technology Badges

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge&logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/Ethereum-EVM_Cancun-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white" />
  <img src="https://img.shields.io/badge/Hardhat-2.x-FFF100?style=for-the-badge&logo=ethereum&logoColor=black" />
  <img src="https://img.shields.io/badge/OpenZeppelin-5.x-4E5EE4?style=for-the-badge&logo=openzeppelin&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/UUPS-Upgradeable_Proxy-FF6B35?style=for-the-badge" />
  <img src="https://img.shields.io/badge/ERC--1967-Proxy_Standard-00C2A8?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Ethers.js-v6-2535A0?style=for-the-badge&logo=ethers&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Mocha-Testing-8D6748?style=for-the-badge&logo=mocha&logoColor=white" />
  <img src="https://img.shields.io/badge/Chai-Assertions-A30701?style=for-the-badge&logo=chai&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/npm-Package_Manager-CB3837?style=for-the-badge&logo=npm&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Sepolia-Testnet-627EEA?style=for-the-badge&logo=ethereum&logoColor=white" />
  <img src="https://img.shields.io/badge/Git-Version_Control-F05032?style=for-the-badge&logo=git&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub-Hosted-181717?style=for-the-badge&logo=github&logoColor=white" />
</p>

### Technology Breakdown

| Layer | Technologies |
|---|---|
| Smart Contracts | Solidity `0.8.24` |
| Blockchain | Ethereum EVM, Cancun |
| Contract Libraries | OpenZeppelin Contracts 5.x |
| Upgrade Architecture | UUPS, ERC-1967 |
| Development Framework | Hardhat 2.x |
| Upgrade Plugin | OpenZeppelin Hardhat Upgrades |
| Testing | Mocha, Chai |
| Client Library | ethers.js v6 |
| Configuration | dotenv |
| Networks | Hardhat Local Network, Sepolia |
| Version Control | Git, GitHub |

---

## 📂 Project Structure

```text
upgradeable-staking/
│
├── contracts/
│   ├── StakingV1.sol        # Basic ETH staking
│   └── StakingV2.sol        # Upgrade with withdrawal lock
│
├── scripts/
│   ├── deploy.js            # Deploy V1 proxy
│   └── upgrade.js           # Upgrade V1 to V2
│
├── test/
│   └── Staking.test.js      # Automated contract tests
│
├── .env.example             # Environment variables template
├── .gitignore
├── hardhat.config.js        # Hardhat configuration
├── package.json
├── package-lock.json
│
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

Make sure you have installed:

- Node.js 18 or newer
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/swastikjha008-jpg/upgradeable-staking.git

cd upgradeable-staking
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Add the following variables:

```env
SEPOLIA_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Security Reminder:** Never share your private key or commit your actual `.env` file to GitHub.

### 4. Compile Smart Contracts

```bash
npm run compile
```

This compiles the Solidity contracts using the configured compiler and Cancun EVM target.

### 5. Run Tests

```bash
npm test
```

The test suite checks the staking functionality, withdrawal restrictions, access control, and upgrade process.

---

## 🖥️ Local Deployment

You can deploy and upgrade the contracts using a local Hardhat network.

### Step 1: Start the Local Blockchain

Open a terminal and run:

```bash
npm run node
```

This starts a local Ethereum development network.

### Step 2: Deploy V1

Open another terminal and execute:

```bash
npm run deploy:local
```

This deploys the V1 implementation behind a UUPS proxy.

The deployment script records the proxy address and implementation address in `deployments.json`.

### Step 3: Upgrade to V2

After deploying V1, execute:

```bash
npm run upgrade:local
```

This upgrades the existing proxy to StakingV2 and initializes the default 21-day withdrawal lock.

The proxy address remains unchanged while the implementation address changes.

---

## 🌐 Sepolia Testnet Deployment

The project also supports deployment to the Ethereum Sepolia testnet.

Make sure your `.env` file contains a valid RPC URL and private key, and that your wallet has Sepolia test ETH.

### Deploy V1

```bash
npm run deploy:sepolia
```

### Upgrade to V2

```bash
npm run upgrade:sepolia
```

The deployment information is stored in `deployments.json` for each network.

**Note:** These commands perform deployment and upgrade transactions. They require test ETH for gas on Sepolia.

---

## 🧪 Testing

The project includes automated tests using Hardhat, Mocha, Chai, and Hardhat Network Helpers.

The test suite covers:

| Test Area | What Is Tested |
|---|---|
| Initialization | Owner and initial contract version |
| Access Control | Only the owner can authorize upgrades |
| ETH Staking | Deposits and balance tracking |
| Direct Transfers | ETH transfers through the receive function |
| Withdrawals | Instant V1 withdrawals |
| Error Handling | Zero amounts and insufficient balances |
| Contract Upgrade | V1 → V2 upgrade |
| State Preservation | Existing balances and ownership |
| V2 Initialization | Reinitialization protection |
| Withdrawal Lock | 21-day withdrawal restriction |
| Claim Mechanism | Successful claims and double-claim prevention |
| Lock Configuration | Owner-only lock period changes |

Run the complete test suite:

```bash
npm test
```

---

## 🔐 Security Considerations

This project demonstrates important smart contract security concepts:

- Owner-only upgrade authorization.
- Reentrancy protection for sensitive ETH operations.
- Initialization protection using OpenZeppelin.
- Storage layout preservation during upgrades.
- Withdrawal request validation.
- Prevention of repeated withdrawal claims.

**Disclaimer:** This is an educational and experimental project, not an audited financial protocol. It does not generate staking rewards or APY. A professional security audit and additional testing are necessary before using it with real funds.

---

## 🎯 Learning Objectives

This project helped explore practical concepts in Ethereum development:

- Writing smart contracts using Solidity.
- Working with OpenZeppelin upgradeable contracts.
- Understanding UUPS proxy architecture.
- Understanding ERC-1967 storage standards.
- Deploying and upgrading smart contracts using Hardhat.
- Preserving contract state across upgrades.
- Implementing withdrawal requests and time-based restrictions.
- Writing automated tests for smart contract functionality.

---

## 📌 Future Improvements

Potential extensions for the protocol include:

- Frontend dashboard for staking and withdrawals.
- Wallet connectivity using MetaMask or other EVM wallets.
- Transaction history and withdrawal request tracking.
- Multiple staking pools.
- Optional staking reward mechanisms.
- Deployment verification and monitoring.

---

## 📜 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ⚡ Solidity, Ethereum & OpenZeppelin
</p>

<p align="center">
  <strong>Learning. Building. Upgrading.</strong>
</p>

<p align="center">
  <a href="https://github.com/swastikjha008-jpg">GitHub</a>
  ·
  <a href="https://github.com/swastikjha008-jpg/upgradeable-staking">Repository</a>
</p>
