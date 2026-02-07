# Privibase

**Sovereign, Privacy-Preserving Notification Infrastructure**

Privibase is a decentralized notification daemon designed for the iExec x 50Partners Hack4Privacy. It acts as a "Decentralized Firebase" for Arbitrum RWA (Real World Asset) events, ensuring that user notifications are delivered without exposing Telegram IDs or other PII (Personally Identifiable Information) to the infrastructure provider.

## Value Proposition

- **Sovereignty**: Users own their notification preferences via iExec Protected Data.
- **Privacy**: No mapping between Ethereum addresses and Telegram IDs is stored in cleartext. We only use iExec TEE-compatible protected data hashes.
- **RWA Ready**: Listen to on-chain events on Arbitrum Sepolia and relay them to confidential communication channels.
- **Hardware Integration**: Includes a POST `/notify` webhook for local hardware or system triggers.

## Architecture

1.  **Contract Layer**: `PrivibaseAnchor.sol` emits `ConfidentialAlertTriggered` events.
2.  **Bot Layer**: A grammY-based bot allows users to register their `protectedDataAddress`.
3.  **Relay Layer**: A Bun-powered daemon listens to events and uses `@iexec/web3telegram` to send confidential notifications.

## Getting Started

1.  `bun install`
2.  Set up `.env` (see `.env.example`)
3.  `bun run index.ts` or build the standalone binary: `bun run build`

## Self-Hosting

Privibase is designed for easy self-hosting. You can run it directly as a binary or via Docker.

### Using Docker
1.  Configure your `.env` file.
2.  Launch the infrastructure:
    ```bash
    docker-compose up -d
    ```

## Build Pipeline

The project compiles into a single-binary daemon using Bun's native compilation:
```bash
bun run build
./privibase
```