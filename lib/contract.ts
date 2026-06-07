import { ethers } from "ethers";
import abi from "./contract/abi.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;

export function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
}

export function getSignedContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
}

export { abi, CONTRACT_ADDRESS };