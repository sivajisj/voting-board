import hre from "hardhat";
import { ethers } from "ethers";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);
  console.log("Deploying with account:", await signer.getAddress());

  const artifact = await hre.artifacts.readArtifact("VotingBoard");
  
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("VotingBoard deployed to:", address);

  mkdirSync(join(process.cwd(), "lib/contract"), { recursive: true });

  writeFileSync(
    join(process.cwd(), "lib/contract/abi.json"),
    JSON.stringify(artifact.abi, null, 2)
  );

  writeFileSync(
    join(process.cwd(), "lib/contract/address.json"),
    JSON.stringify({ address }, null, 2)
  );

  console.log("ABI and address written to lib/contract/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
