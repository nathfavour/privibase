import { Bot } from "grammy";
import { IExecWeb3telegram } from "@iexec/web3telegram";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "subscriptions.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const {
  PRIVATE_KEY,
  TELEGRAM_BOT_TOKEN,
  CONTRACT_ADDRESS,
} = process.env;

if (!PRIVATE_KEY || !TELEGRAM_BOT_TOKEN || !CONTRACT_ADDRESS) {
  console.error("Missing environment variables in .env");
  process.exit(1);
}

// 1. Initialize iExec Web3Telegram
const web3telegram = new IExecWeb3telegram(PRIVATE_KEY);

// 2. Initialize grammY bot
const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Persistence Logic
let subscriptionMap = new Map<string, string>();

function loadDb() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      subscriptionMap = new Map(Object.entries(data));
      console.log(`Loaded ${subscriptionMap.size} subscriptions from DB`);
    } catch (e) {
      console.error("Failed to load DB:", e);
    }
  }
}

function saveDb() {
  try {
    const obj = Object.fromEntries(subscriptionMap);
    fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error("Failed to save DB:", e);
  }
}

loadDb();

bot.command("start", (ctx) => ctx.reply("Welcome to Privibase! Use /subscribe <protectedDataAddress> to receive confidential notifications."));

bot.command("subscribe", async (ctx) => {
  const arg = ctx.match;
  if (!arg) {
    return ctx.reply("Please provide your protected data address: /subscribe 0x...");
  }
  
  // We don't store the Telegram ID, we assume the user provides their mapping.
  // In a more complex flow, the user would use DataProtector to share with web3telegram.
  // Here we just map an address (could be derived from a signature or just provided).
  // For the demo, we'll ask the user to provide their ETH address and protected data address.
  ctx.reply("Please send your ETH address and Protected Data address in this format: <ethAddress>:<protectedDataAddress>");
});

bot.on("message:text", (ctx) => {
  const text = ctx.message.text;
  if (text.includes(":")) {
    const [ethAddress, protectedDataAddress] = text.split(":").map(s => s.trim().toLowerCase());
    if (ethers.utils.isAddress(ethAddress) && ethers.utils.isAddress(protectedDataAddress)) {
      subscriptionMap.set(ethAddress, protectedDataAddress);
      saveDb();
      ctx.reply(`Successfully subscribed ${ethAddress} to notifications!`);
    } else {
      ctx.reply("Invalid addresses. Please use format: <ethAddress>:<protectedDataAddress>");
    }
  }
});

bot.start();

// 3. Ethers Listener
const provider = new ethers.providers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
const abi = ["event ConfidentialAlertTriggered(address indexed user, string messageType)"];
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

contract.on("ConfidentialAlertTriggered", async (user: string, messageType: string) => {
  console.log(`Alert triggered for ${user}: ${messageType}`);
  const protectedDataAddress = subscriptionMap.get(user.toLowerCase());
  
  if (protectedDataAddress) {
    try {
      await web3telegram.sendTelegram({
        graphQLQuery: `query { protectedData(id: "${protectedDataAddress}") { id } }`,
        telegramContent: `Privibase Alert: ${messageType} triggered on Arbitrum Sepolia.`,
      });
      console.log(`Notification sent to ${protectedDataAddress}`);
    } catch (error) {
      console.error("Failed to send telegram notification:", error);
    }
  } else {
    console.log(`No subscription found for user ${user}`);
  }
});

// 4. Webhook for local hardware/system triggers
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/notify" && req.method === "POST") {
      try {
        const { user, message } = await req.json() as { user: string, message: string };
        if (!user || !message) throw new Error("Missing user or message");
        
        const protectedDataAddress = subscriptionMap.get(user.toLowerCase());
        if (protectedDataAddress) {
          await web3telegram.sendTelegram({
            graphQLQuery: `query { protectedData(id: "${protectedDataAddress}") { id } }`,
            telegramContent: `Privibase Hardware Alert: ${message}`,
          });
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: "User not subscribed" }), { status: 404 });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      }
    }
    return new Response("Privibase Node Running", { status: 200 });
  },
});

console.log("Privibase daemon started on port 3000");
