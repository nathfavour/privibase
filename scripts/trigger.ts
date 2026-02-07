import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!privateKey || !contractAddress) {
    console.error("Missing PRIVATE_KEY or CONTRACT_ADDRESS in .env");
    return;
  }

  const provider = new ethers.providers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const abi = ["function triggerAlert(string calldata messageType) external"];
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  console.log(`Triggering alert on-chain for contract ${contractAddress}...`);
  const tx = await contract.triggerAlert("CRITICAL_TEMP_ALARM");
  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log("Transaction confirmed!");
}

main().catch(console.error);
