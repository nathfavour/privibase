# Setup Guide

Follow these steps to get Privibase running and connected to Telegram via iExec TEE.

## 1. Telegram Bot Setup
1.  Message [@BotFather](https://t.me/botfather) on Telegram.
2.  Use `/newbot` to create your bot and get the **Bot Token**.
3.  Add the token to your `.env` file as `TELEGRAM_BOT_TOKEN`.

## 2. iExec User Setup (Confidential Channel)
For a user to receive notifications without sharing their PII with Privibase:
1.  The user must visit the [iExec Web3Telegram App](https://web3telegram.iex.ec/).
2.  They must "Protect their Data" (this creates the `protectedDataAddress`).
3.  They must "Grant Access" to the Web3Telegram application.
4.  Once they have their `protectedDataAddress`, they send it to the Privibase bot using the registration flow.

## 3. Contract Deployment
If you haven't deployed the anchor contract:
1.  Ensure you have `forge` installed (part of Foundry).
2.  Run `forge build`.
3.  Run `bun run scripts/deploy.ts` (Ensure `PRIVATE_KEY` has Arbitrum Sepolia ETH).
4.  Copy the resulting address to `CONTRACT_ADDRESS` in `.env`.

## 4. Running the Daemon
```bash
bun install
bun run index.ts
```

## 5. Testing the Trigger
You can simulate a hardware trigger or a system event via the webhook:
```bash
curl -X POST http://localhost:3000/notify 
     -H "Content-Type: application/json" 
     -d '{"user": "0xUSER_ETH_ADDRESS", "message": "Intruder detected in Server Room A"}'
```
