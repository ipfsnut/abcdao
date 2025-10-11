# ABC DAO

Community Grants for Farcaster Builders

## Structure

This is a monorepo containing:

- `packages/frontend` - Next.js Farcaster mini-app
- `packages/contracts` - Smart contracts (Foundry)

## Quick Start

### Frontend Development
```bash
npm install
npm run dev
```

### Contract Development
```bash
cd packages/contracts
forge install
forge build
forge test
```

## Deployment

### Frontend
The frontend deploys to abc.epicdylan.com via Cloudflare Pages

### Contracts
Deployed to Base Mainnet

## Documentation

See [whitepaper.txt](./whitepaper.txt) for the full project specification.