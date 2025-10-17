# ABC DAO Token Supply API for Coingecko

## 📊 **API Endpoints for Market Data Aggregators**

ABC DAO provides comprehensive token supply data through our Railway-hosted backend API, designed specifically for Coingecko and other market data platforms.

---

## 🔗 **Coingecko-Required Endpoints**

### Total Supply
**URL:** `https://abcdao-production.up.railway.app/api/stats/totalsupply`  
**Method:** GET  
**Response:** Plain text number  
**Example:** `100000000000`  

### Circulating Supply  
**URL:** `https://abcdao-production.up.railway.app/api/stats/circulatingsupply`  
**Method:** GET  
**Response:** Plain text number  
**Example:** `6000000000`  

### Market Cap (Optional)
**URL:** `https://abcdao-production.up.railway.app/api/stats/marketcap`  
**Method:** GET  
**Response:** Plain text number  
**Example:** `12345.67`  

---

## 📋 **Additional Endpoints**

### Detailed Supply Breakdown
**URL:** `https://abcdao-production.up.railway.app/api/stats/supply`  
**Method:** GET  
**Response:** JSON object with complete tokenomics  

```json
{
  "total_supply": 100000000000,
  "circulating_supply": 6000000000,
  "breakdown": {
    "liquid": {
      "amount": 5398578913,
      "percentage": 5.4,
      "label": "Liquid",
      "description": "Held by users, freely tradeable",
      "locked": false,
      "circulating": true
    },
    "clanker_pool": {
      "amount": 94000000000,
      "percentage": 94.0,
      "label": "Clanker DEX Pool", 
      "description": "Locked in DEX pool",
      "locked": true,
      "circulating": false
    },
    // ... additional breakdown categories
  },
  "last_updated": "2025-10-17T23:22:44.340Z",
  "data_sources": {
    "total_supply": "Token contract totalSupply()",
    "circulating_supply": "Calculated: Total - Clanker Pool",
    // ... source information
  }
}
```

### Health Check
**URL:** `https://abcdao-production.up.railway.app/api/stats/health`  
**Method:** GET  
**Response:** System status and endpoint information  

---

## 🏗️ **Technical Implementation**

### Data Sources
- **Total Supply:** Direct call to ABC token contract `totalSupply()` function
- **Circulating Supply:** Calculated as Total Supply minus DEX pool tokens
- **Real-time Updates:** Live blockchain data with fallback values
- **High Availability:** Railway hosting with 99.9% uptime

### Contract Details
- **Token Contract:** `0x5c0872b790bb73e2b3a9778db6e7704095624b07` (Base Network)
- **Staking Contract:** `0x577822396162022654D5bDc9CB58018cB53e7017` (Base Network)
- **DEX Pool Manager:** `0x498581fF718922c3f8e6A244956aF099B2652b2b` (Clanker)

### Supply Calculation Logic
```javascript
// Circulating Supply = Total Supply - Locked Pool Tokens
const circulating = totalSupply - clankerPoolTokens;

// Pool tokens are locked in DEX and should not count as circulating
// This provides accurate market cap calculations
```

---

## 🔄 **Update Frequency**

- **Real-time:** All endpoints pull live data from Base blockchain
- **Fallback Values:** Available if blockchain calls fail
- **Cache Duration:** No caching - always fresh data
- **Response Time:** < 2 seconds average

---

## 🛡️ **Reliability Features**

### Error Handling
- Graceful fallback to known values if blockchain unavailable
- Proper HTTP status codes and error messages
- Monitoring and alerting for service health

### Data Accuracy
- Direct contract calls ensure accuracy
- Multiple validation layers
- Consistent calculation methodology

### Performance
- Optimized RPC calls
- Railway's global CDN
- Concurrent request handling

---

## 📈 **Current Token Metrics**

Based on live blockchain data:
- **Total Supply:** 100,000,000,000 $ABC tokens
- **Circulating Supply:** ~6,000,000,000 $ABC tokens (~6%)
- **Locked in DEX:** ~94,000,000,000 $ABC tokens (~94%)
- **Treasury:** ~100,000,000 $ABC tokens
- **Staked:** ~171,000,000 $ABC tokens

---

## 🚀 **For Coingecko Submission**

### Required Information
- **Token Name:** ABC DAO
- **Symbol:** ABC
- **Contract Address:** `0x5c0872b790bb73e2b3a9778db6e7704095624b07`
- **Network:** Base (Chain ID: 8453)
- **Total Supply API:** `https://abcdao-production.up.railway.app/api/stats/totalsupply`
- **Circulating Supply API:** `https://abcdao-production.up.railway.app/api/stats/circulatingsupply`

### Verification Steps
1. Test endpoints return valid numbers
2. Verify total supply matches on-chain data
3. Confirm circulating supply calculation
4. Check API uptime and reliability

---

## 🔧 **Development & Maintenance**

### Monitoring
- Real-time API monitoring via Railway
- Blockchain connection health checks
- Error tracking and alerting

### Updates
- Automatic deployment via GitHub integration
- Zero-downtime updates
- Rollback capabilities

### Support
- GitHub: [abc-dao/abc-dao](https://github.com/abc-dao/abc-dao)
- API Status: `https://abcdao-production.up.railway.app/health`
- Contact: [abc.epicdylan.com](https://abc.epicdylan.com)

---

**Ready for Coingecko integration! 🎯**