# Upgradeable Staking (UUPS)

Native-ETH staking contract behind a UUPS proxy, built with Hardhat + OpenZeppelin Upgrades.

| Version | Behaviour |
|---------|-----------|
| **V1** | `stake()` ETH, `unstake(amount)` instantly |
| **V2** | Instant unstake disabled. `requestUnstake(amount)` then `claim(id)` after a **21-day lock** (approach #1 from the cohort notes) |

The proxy address stays the same across upgrades. State (balances, owner) is preserved. V2 only appends storage.

## Layout

```
contracts/StakingV1.sol   initial implementation
contracts/StakingV2.sol   upgrade with withdrawal lock
scripts/deploy.js         deploys V1 behind a UUPS proxy
scripts/upgrade.js        upgrades proxy to V2 and calls initializeV2(21 days)
test/Staking.test.js      V1 + upgrade + V2 tests
```

## Quick start

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Local deploy and upgrade

```bash
npx hardhat node                 # terminal 1
npm run deploy:local             # terminal 2 (writes deployments.json)
npm run upgrade:local
```

## Sepolia

```bash
cp .env.example .env             # fill SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY
npm run deploy:sepolia
npm run upgrade:sepolia
```

## Push to GitHub

```bash
git init
git add .
git commit -m "feat: UUPS upgradeable ETH staking (V1 + V2)"
git branch -M main
git remote add origin https://github.com/swastikjha008-jpg/upgradeable-staking.git
git push -u origin main
```

## Notes

- Upgrades are authorized by `onlyOwner` via `_authorizeUpgrade`.
- Implementations call `_disableInitializers()` in the constructor.
- `.env` is gitignored. Never commit private keys.
- Other approaches from the notes (ERC-20 receipt token, staking an ERC-20 instead of ETH) can be added as V3 the same way.
- Unaudited, for learning. Do not use with real funds as is.
