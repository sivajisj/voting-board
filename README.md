# Voting Board

A full-stack decentralised voting application built with Next.js, Solidity, MongoDB, and ethers.js. Admins create proposals and register eligible voters. Voters connect their Ethereum wallet and cast on-chain votes. Results are displayed in real time using charts.

## Prerequisites

- Node.js v18 or higher
- pnpm (`npm install -g pnpm`)
- MongoDB running locally on port 27017
- MetaMask browser extension

## Local Setup

### 1. Clone the repository and install dependencies

\`\`\`bash
git clone <your-repo-url>
cd voting-board
pnpm install
\`\`\`

### 2. Set up environment variables

\`\`\`bash
cp .env.example .env
\`\`\`

Fill in the values in `.env`. See the Environment Variables section below.

### 3. Start MongoDB

\`\`\`bash
sudo systemctl start mongod
\`\`\`

### 4. Start the Hardhat local node

Open a dedicated terminal and keep it running:

\`\`\`bash
pnpm hardhat:node
\`\`\`

### 5. Deploy the smart contract

In a separate terminal:

\`\`\`bash
pnpm hardhat:deploy:local
\`\`\`

Copy the deployed contract address from the output and update `NEXT_PUBLIC_CONTRACT_ADDRESS` in your `.env` file.

### 6. Start the development server

\`\`\`bash
pnpm dev
\`\`\`

Open `http://localhost:3000` in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | JWT expiry duration e.g. 7d |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed VotingBoard contract address |
| `NEXT_PUBLIC_RPC_URL` | Local Hardhat node RPC URL |

See `.env.example` for reference values.

## MetaMask Setup

1. Open MetaMask and add a new network manually
2. Network name: Hardhat
3. RPC URL: `http://127.0.0.1:8545`
4. Chain ID: `31337`
5. Currency symbol: ETH
6. Import a test account using a private key from the `pnpm hardhat:node` terminal output

## Usage Walkthrough

### Admin journey
1. Register at `/register` with role set to Admin Role
r
2. Login at `/login`
3. On the admin dashboard, create a proposal with title, description, and deadline
4. Register voter wallet addresses using the Register Voter Wallet form
5. View all proposals, their live vote counts, and close proposals when done

### Voter journey
1. Register at `/register` with role set to Voter
2. Login at `/login`
3. On the voter dashboard, click Connect Wallet and approve in MetaMask
4. Vote Yes or No on any open proposal
5. Visit the Results page to see charts

## Architecture

- Vote counts are always read directly from the smart contract, never stored in MongoDB
- JWT is stored in an httpOnly cookie, never in localStorage
- The smart contract enforces one vote per wallet and eligibility checks on-chain
- MongoDB stores user accounts and proposal metadata only

## Assumptions and Known Limitations

- The application runs entirely on a local machine with no external services
- MetaMask must be connected to the local Hardhat network (chain ID 31337)
- The Hardhat node must be running before deploying or interacting with the contract
- Restarting the Hardhat node resets all contract state. Redeploy the contract and update `NEXT_PUBLIC_CONTRACT_ADDRESS` after every restart
- ethers.js v6 is used throughout. No third party wallet libraries are used
<!-- 0x90F79bf6EB2c4f870365E785982E1f101E93b906
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 -->