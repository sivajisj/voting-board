

# Voting Board

A full-stack decentralised voting application built with Next.js, Solidity, MongoDB, and ethers.js. Admins create proposals and register eligible voters. Voters connect their Ethereum wallet and cast on-chain votes. Results are displayed in real time using charts.

---

## Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: `npm install -g pnpm`
- **MongoDB**: Running locally on port `27017`
- **MetaMask**: Browser extension installed

---

## Local Setup

### 1. Clone the repository and install dependencies
```bash
git clone <your-repo-url>
cd voting-board
pnpm install

```

### 2. Set up environment variables

```bash
cp .env.example .env

```

> **Note:** Fill in the values in `.env`. See the [Environment Variables](https://www.google.com/search?q=%23environment-variables) section below.

### 3. Start MongoDB

```bash
sudo systemctl start mongod

```

### 4. Start the Hardhat local node

Open a dedicated terminal and keep it running:

```bash
pnpm hardhat:node

```

### 5. Deploy the smart contract

In a separate terminal, run:

```bash
pnpm hardhat:deploy:local

```

Copy the deployed contract address from the terminal output and update `NEXT_PUBLIC_CONTRACT_ADDRESS` in your `.env` file.

### 6. Start the development server

```bash
pnpm dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | JWT expiry duration (e.g., `7d`) |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed `VotingBoard` contract address |
| `NEXT_PUBLIC_RPC_URL` | Local Hardhat node RPC URL |

---

## MetaMask Setup

1. Open MetaMask and add a new network manually:
* **Network Name**: Hardhat
* **RPC URL**: `http://127.0.0.1:8545`
* **Chain ID**: `31337`
* **Currency Symbol**: ETH


2. Import a test account using one of the private keys printed in your `pnpm hardhat:node` terminal output.

---

## Usage Walkthrough

### Admin Journey

1. Register at `/register` with the role set to **Admin**.
2. Log in at `/login`.
3. On the admin dashboard, create a proposal by providing a title, description, and deadline.
4. Register voter wallet addresses using the **Register Voter Wallet** form.
5. View all proposals, monitor live vote counts, and close proposals when voting ends.

### Voter Journey

1. Register at `/register` with the role set to **Voter**.
2. Log in at `/login`.
3. On the voter dashboard, click **Connect Wallet** and approve the connection request in MetaMask.
4. Cast a **Yes** or **No** vote on any open proposal.
5. Visit the **Results** page to see real-time visual charts.

---

## Architecture

* **Source of Truth**: Vote counts are always read directly from the smart contract; they are never stored in MongoDB.
* **Security**: JWTs are stored securely in an `httpOnly` cookie and are never exposed via `localStorage`.
* **On-Chain Validation**: The smart contract enforces strict eligibility checks and prevents double-voting (one vote per wallet).
* **Database Role**: MongoDB stores user authentication accounts and proposal metadata only.

---

## Assumptions and Known Limitations

* The application runs entirely on a local machine with no external network services.
* MetaMask must be explicitly connected to the local Hardhat network (Chain ID `31337`).
* The Hardhat node must be running before deploying or interacting with the contract.
* **State Reset**: Restarting the Hardhat node resets all blockchain state. You must redeploy the contract and update the `NEXT_PUBLIC_CONTRACT_ADDRESS` in your `.env` after every node restart.
* Built using **ethers.js v6** throughout. No third-party wallet connection libraries are utilized.

```

```
