# ABC DAO Data Consistency Fixes

## Issues Identified

### **Staking Data Inconsistencies**

1. **Multiple Sources:**
   - `useStaking.ts`: Direct blockchain calls via wagmi/viem
   - `staking-data-manager.js`: Backend cached blockchain data
   - Components mixing both sources inconsistently

2. **Specific Problems:**
   - MetricsDashboard uses `useStaking()` (blockchain)
   - Profile page uses `useStakingPosition()` (backend API)
   - Different caching intervals cause temporary mismatches
   - APY calculations in backend but not exposed consistently

### **Repository Data Inconsistencies**

1. **Multiple Count Sources:**
   - Profile: `stats?.uniqueRepositories` (systematic API)
   - Repositories tab: Live count from repository API
   - Different APIs return different repository counts

2. **Endpoint Fragmentation:**
   - `/api/repositories/:fid/repositories` - Management
   - `/api/users-commits/profile/:identifier` - Stats
   - No single source of truth

## **Recommended Fixes**

### **1. Unify Staking Data Sources**

#### Frontend Changes:
- Create single `useStakingUnified.ts` hook
- Use backend staking data manager as primary source
- Keep blockchain calls for write operations only
- Consistent formatting across all components

#### Backend Changes:
- Extend staking data manager to include all displayed metrics
- Add real-time WebSocket updates for immediate consistency
- Expose formatted staking data through unified endpoint

### **2. Unify Repository Data Sources**

#### Backend Changes:
- Extend `users-commits` API to include repository counts
- Make repository stats part of user profile data
- Single endpoint for all user repository information

#### Frontend Changes:
- Use systematic hooks for all repository count displays
- Remove direct repository API calls for stats
- Consistent repository data across all verticals

### **3. Implementation Priority**

1. **High Priority (Fix Now):**
   - Create unified staking hook
   - Update MetricsDashboard to use backend data
   - Fix repository count inconsistencies

2. **Medium Priority:**
   - Add WebSocket real-time updates
   - Optimize caching strategies
   - Add data freshness indicators

3. **Low Priority:**
   - Performance optimizations
   - Additional monitoring
   - Enhanced error handling

## **Specific File Changes Required**

### Frontend Files to Update:
- `components/metrics-dashboard.tsx` - Use unified staking hook
- `app/(simplified)/profile/page.tsx` - Consistent data sources
- `components/developers/repositories-tab.tsx` - Use systematic API
- Create: `hooks/useStakingUnified.ts` - New unified hook

### Backend Files to Update:
- `src/services/staking-data-manager.js` - Expose more metrics
- `src/routes/users-commits.js` - Add repository counts
- `src/routes/staking.js` - Unified staking endpoint

## **Expected Benefits**

1. **Consistent Data:** Same numbers across all app verticals
2. **Better Performance:** Fewer redundant API calls
3. **Easier Maintenance:** Single source of truth
4. **Better UX:** No confusing mismatched numbers
5. **Reliable Real-time:** WebSocket updates for instant consistency

## **Testing Strategy**

1. **Before/After Comparison:** Document current inconsistencies
2. **Cross-Component Testing:** Verify same data everywhere
3. **Real-time Testing:** Verify immediate updates after actions
4. **Load Testing:** Ensure performance isn't degraded
5. **Edge Case Testing:** Handle network failures gracefully