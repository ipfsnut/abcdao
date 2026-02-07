# Pool Card Spec — CHAOS Rails

## Overview

Pool cards replace the static HTML table on `/february-protocol`. Each card represents a CHAOS liquidity pool in one of three states: **active**, **created**, or **pending**.

## Data Source

- **Registry**: `/chaos-rails/pool-registry.json` — local static JSON, source of truth for pool metadata and card state
- **GeckoTerminal**: live TVL + volume data for active pools
- **Data cascade**: registry metadata + GeckoTerminal live data merged at render time

## Card States

### Active (green)
- Pool is live on GeckoTerminal with TVL > 0
- Shows: pair name, fee badge, purpose, TVL, 24h volume
- Green left border accent

### Created (yellow)
- Pool deployed on-chain but not yet indexed by GeckoTerminal
- Shows: pair name, fee badge, purpose, "Awaiting indexing" with pulse dot
- Yellow left border accent
- Optional Basescan TX link if `deployTxHash` is set

### Pending (dark)
- Pool is in deployment queue, not yet on-chain
- Shows: pair name, fee badge, purpose, "In deployment queue"
- Dark left border accent, dimmest text

## Sort Order

1. Active pools sorted by TVL descending
2. Created pools
3. Pending pools

## Registry Schema

See `pool-registry.json` for the full schema. Key fields:
- `id`: unique slug
- `poolId`: on-chain pool ID (null if pending)
- `baseSymbol` / `quoteSymbol`: token pair
- `fee`: fee tier string
- `purpose`: human-readable purpose
- `cardState`: `"active"` | `"created"` | `"pending"`
- `deployTxHash`: optional tx hash for created pools
- `notes`: optional note string

## Updating the Registry

1. Edit `pool-registry.json`
2. Push + deploy to update the live page
3. Pool deployments are infrequent — manual updates are acceptable
