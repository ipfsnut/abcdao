# $ABC Token Supply Visualization

## 🎯 **Chart Design: Donut/Ring Chart**

```
        🟢 Circulating (45B)
    ┌─────────────────────────┐
   🔵│     Staked (2.5B)     │🟣
   │  ┌─────────────────┐   │ Bot Wallet 
   │  │                 │   │  (2.5B)
   │  │   100B Total    │   │
   │  │     Supply      │   │
   │  │                 │   │
   │  └─────────────────┘   │
   │     ⚫ Clanker Pool     │
    └─────────────────────────┘
           (50B - greyed)
```

## 📊 **Token Categories**

### **🟢 Circulating Supply (Green)**
- **Purpose**: Available for trading, rewards, transfers
- **Sources**: All $ABC not locked in contracts
- **Calculation**: `Total - Clanker - Staked - Bot Wallet - Dev Lockup`

### **🔵 Staked Supply (Blue)**  
- **Purpose**: Locked in staking contract earning ETH rewards
- **Sources**: Read from staking contract `totalStaked()`
- **Dynamic**: Changes as users stake/unstake

### **🟣 Bot Wallet (Purple)**
- **Purpose**: Treasury for developer rewards & operations
- **Sources**: Read bot wallet $ABC balance
- **Dynamic**: Decreases as rewards are distributed

### **🟡 Development Lockup (Yellow)**
- **Purpose**: Team allocation with vesting schedule
- **Amount**: 5B tokens (5% of total supply)
- **Sources**: Locked in vesting contract
- **Static**: Fixed 5% allocation

### **⚫ Clanker Pool (Grey)**
- **Purpose**: Locked liquidity pool (not circulating)
- **Sources**: Clanker deployment allocation
- **Static**: Fixed amount from launch

## 🔧 **Data Structure**

```json
{
  "total_supply": 100000000000,
  "breakdown": {
    "circulating": {
      "amount": 42500000000,
      "percentage": 42.5,
      "color": "#22c55e",
      "label": "Circulating",
      "description": "Available for trading and transfers"
    },
    "staked": {
      "amount": 2500000000,
      "percentage": 2.5,
      "color": "#3b82f6", 
      "label": "Staked",
      "description": "Earning ETH rewards in staking contract"
    },
    "bot_wallet": {
      "amount": 2500000000,
      "percentage": 2.5,
      "color": "#8b5cf6",
      "label": "Treasury",
      "description": "Reserved for developer rewards"
    },
    "dev_lockup": {
      "amount": 5000000000,
      "percentage": 5.0,
      "color": "#eab308",
      "label": "Development",
      "description": "Team allocation with vesting schedule",
      "locked": true
    },
    "clanker_pool": {
      "amount": 47500000000,
      "percentage": 47.5,
      "color": "#6b7280",
      "label": "Clanker Pool",
      "description": "Locked liquidity (not circulating)",
      "locked": true
    }
  },
  "last_updated": "2025-10-13T16:45:00Z"
}
```

## 📡 **API Endpoints**

### **GET /api/stats/token-supply**
```javascript
// Returns current token distribution
{
  "total_supply": 100000000000,
  "circulating_supply": 45000000000,
  "breakdown": { ... },
  "market_data": {
    "market_cap": null, // If available
    "circulating_market_cap": null
  }
}
```

### **Data Sources Required:**
```javascript
// 1. Staking Contract
const stakingContract = new Contract(STAKING_ADDRESS, stakingABI, provider);
const totalStaked = await stakingContract.totalStaked();

// 2. Bot Wallet Balance  
const botBalance = await tokenContract.balanceOf(BOT_WALLET_ADDRESS);

// 3. Development Lockup (static)
const devLockup = 5_000_000_000; // 5B tokens (5%)

// 4. Clanker Pool (remaining allocation)  
const clankerPool = 47_500_000_000; // 47.5B tokens

// 5. Calculate circulating
const circulating = TOTAL_SUPPLY - clankerPool - devLockup - totalStaked - botBalance;
```

## 🎨 **Frontend Component**

### **React Component Structure**
```tsx
interface TokenSupplyChartProps {
  data: TokenSupplyData;
  size?: number;
  showLegend?: boolean;
  interactive?: boolean;
}

<TokenSupplyChart 
  data={supplyData}
  size={300}
  showLegend={true}
  interactive={true}
/>
```

### **Chart Features**
- **Donut chart** with center text showing total supply
- **Hover effects** showing exact amounts and percentages  
- **Legend** with color coding and descriptions
- **Responsive** design for mobile/desktop
- **Animation** when data updates
- **Clickable sections** for drill-down info

### **Center Text Display**
```
    100B
   TOTAL
   SUPPLY
     $ABC
```

## 📱 **UI Integration**

### **Dashboard Stats Bar**
Add as 5th stat tile:
```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│  Treasury   │ Total Staked│ ETH Rewards │ Active Devs │Supply Chart │
│   2.5B $ABC │   2.5B $ABC │  0.123 ETH  │      4      │    [○]      │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### **Dedicated Token Page**
Create `/token` page with:
- Large supply chart
- Historical charts
- Staking statistics  
- Distribution details
- Token utility explanation

## 🔄 **Real-time Updates**

### **WebSocket Updates** (Future)
```javascript
// Subscribe to supply changes
ws.on('supply_update', (data) => {
  updateChart(data);
});
```

### **Polling Updates** (Initial)
```javascript
// Refresh every 30 seconds
useEffect(() => {
  const interval = setInterval(fetchSupplyData, 30000);
  return () => clearInterval(interval);
}, []);
```

## 📊 **Chart Library Options**

### **Option 1: Chart.js** 
- Pros: Lightweight, good donut charts
- Cons: Less interactive

### **Option 2: Recharts**
- Pros: React-native, good animations  
- Cons: Larger bundle size

### **Option 3: Custom SVG**
- Pros: Full control, lightweight
- Cons: More development time

**Recommendation: Start with Recharts for rapid development**

## 🎯 **Implementation Priority**

1. **Phase 1**: Backend API with static data
2. **Phase 2**: Contract integration for real data  
3. **Phase 3**: Frontend component with basic chart
4. **Phase 4**: Polish, animations, interactivity
5. **Phase 5**: Historical data and trends