import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not found in .env");

  const provider = new ethers.providers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Deploying contract with account: ${wallet.address}`);

  // This assumes the contract is already compiled. 
  // For simplicity in this scaffold, we'll use a pre-compiled JSON or expect the user to compile it.
  // Since we have foundry.toml, we can point to the out directory.
  const artifactPath = path.join(__dirname, "../out/PrivibaseAnchor.sol/PrivibaseAnchor.json");
  
  if (!fs.existsSync(artifactPath)) {
    console.error("Artifact not found. Please run 'forge build' first or ensure the path is correct.");
    return;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  const contract = await factory.deploy();
  await contract.deployed();

  console.log(`PrivibaseAnchor deployed to: ${contract.address}`);
  console.log("Update your .env with this address!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
