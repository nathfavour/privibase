# iExec Bun Compatibility Feedback

## Overview
This project was scaffolded using **Bun** as the primary runtime and build tool. Below is the feedback regarding the integration of iExec SDKs with Bun.

## Positive Findings
- **Installation**: `@iexec/dataprotector` and `@iexec/web3telegram` install seamlessly via `bun add`.
- **Esm Support**: Bun's native ESM support handles iExec packages without additional configuration.

## Challenges
- **Peer Dependencies**: `ethers@5.7.2` is strictly required by some iExec SDK versions. Bun's resolution works fine, but users should be warned to avoid `ethers@6` unless the SDK specifically supports it.
- **Node Polyfills**: iExec SDKs rely on some Node.js built-ins. Bun's built-in polyfills seem to handle most cases, but extensive testing in TEE environments is still required.
- **Binary Size**: Using `bun build --compile` results in a ~90MB binary, which is great for distribution but should be considered for TEE memory constraints.

## Recommendations
- Provide official Bun-compatible examples in the iExec documentation.
- Ensure that future versions of the SDK maintain compatibility with non-Node runtimes like Bun and Deno.
