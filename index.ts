import { Bot, InlineKeyboard } from "grammy";
import { IExecWeb3telegram } from "@iexec/web3telegram";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "subscriptions.json");

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

const web3telegram = new IExecWeb3telegram(PRIVATE_KEY);
const bot = new Bot(TELEGRAM_BOT_TOKEN);

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

// --- UI Components ---

const mainMenu = new InlineKeyboard()
  .text("🔔 Subscribe to Alerts", "action_subscribe").row()
  .text("🔍 Check My Status", "action_status").row()
  .text("❓ How it Works", "action_help").row()
  .url("🛡️ iExec Web3Telegram", "https://web3telegram.iex.ec/");

const backButton = new InlineKeyboard().text("⬅️ Back to Menu", "action_menu");

// --- Bot Logic ---

bot.command("start", (ctx) => 
  ctx.reply("Welcome to **Privibase**! \n\nSovereign, privacy-preserving notifications for Arbitrum RWA events.", {
    parse_mode: "Markdown",
    reply_markup: mainMenu,
  })
);

bot.command("menu", (ctx) => ctx.reply("Main Menu:", { reply_markup: mainMenu }));

bot.callbackQuery("action_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Main Menu:", { reply_markup: mainMenu });
});

bot.callbackQuery("action_subscribe", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "To subscribe, please provide your mapping in the following format:\n\n`<ethAddress>:<protectedDataAddress>`\n\n*Example:* `0x123...:0xabc...`",
    { parse_mode: "Markdown", reply_markup: backButton }
  );
});

bot.callbackQuery("action_status", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "Please send your **ETH Address** to check its subscription status.",
    { reply_markup: backButton }
  );
});

bot.callbackQuery("action_help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "**How Privibase Works:**\n\n" +
    "1. **Protect Data**: Go to iExec Web3Telegram and create a 'Protected Data' hash for your Telegram.\n" +
    "2. **Grant Access**: Grant the Web3Telegram app access to that hash.\n" +
    "3. **Map Here**: Send your ETH address and that hash to this bot.\n" +
    "4. **Get Alerts**: When a contract event fires on Arbitrum, we trigger a TEE-based notification via iExec.",
    { parse_mode: "Markdown", reply_markup: backButton }
  );
});

bot.on("message:text", (ctx) => {
  const text = ctx.message.text.trim();

  // Handle Subscription Registration
  if (text.includes(":")) {
    const [ethAddress, protectedDataAddress] = text.split(":").map(s => s.trim().toLowerCase());
    if (ethers.utils.isAddress(ethAddress) && ethers.utils.isAddress(protectedDataAddress)) {
      subscriptionMap.set(ethAddress, protectedDataAddress);
      saveDb();
      ctx.reply(`✅ **Success!**\n\nAddress \`${ethAddress}\` is now subscribed to notifications via protected data \`${protectedDataAddress}\`.`, {
        parse_mode: "Markdown",
        reply_markup: mainMenu
      });
    } else {
      ctx.reply("❌ **Invalid Format**\n\nPlease use: `<ethAddress>:<protectedDataAddress>`", { parse_mode: "Markdown" });
    }
    return;
  }

  // Handle Status Check
  if (ethers.utils.isAddress(text.toLowerCase())) {
    const addr = text.toLowerCase();
    const mapped = subscriptionMap.get(addr);
    if (mapped) {
      ctx.reply(`✅ **Status**: \`${addr}\` is active.\n\n**Protected Data**: \`${mapped}\``, {
        parse_mode: "Markdown",
        reply_markup: mainMenu
      });
    } else {
      ctx.reply(`⚠️ **Status**: \`${addr}\` is not subscribed yet.`, {
        parse_mode: "Markdown",
        reply_markup: mainMenu
      });
    }
    return;
  }

  ctx.reply("I didn't quite get that. Use /menu to see options.");
});

bot.start();

// --- Ethers & Bun.serve logic remains the same ---

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
