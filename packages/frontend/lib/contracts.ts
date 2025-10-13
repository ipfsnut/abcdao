// Contract addresses and ABIs for the ABC DAO system

export const CONTRACTS = {
  // ABC token (LIVE - deployed via Clanker)
  ABC_TOKEN: {
    address: '0x5c0872b790bb73e2b3a9778db6e7704095624b07' as `0x${string}`,
    decimals: 18,
    symbol: 'ABC',
    name: 'ABC'
  },
  
  // ABC Staking V2 Fixed contract (deployed with reward debt fixes!)
  ABC_STAKING: {
    address: '0x577822396162022654D5bDc9CB58018cB53e7017' as `0x${string}`,
    abi: [
      {
        "type": "function",
        "name": "getStakeInfo",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [
          {"name": "amount", "type": "uint256", "internalType": "uint256"},
          {"name": "lastStakeTime", "type": "uint256", "internalType": "uint256"},
          {"name": "totalEthEarned", "type": "uint256", "internalType": "uint256"},
          {"name": "pendingEth", "type": "uint256", "internalType": "uint256"}
        ],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "pendingRewards",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "totalStaked",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "totalRewardsDistributed",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "stake",
        "inputs": [{"name": "_amount", "type": "uint256", "internalType": "uint256"}],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "startUnbonding",
        "inputs": [{"name": "_amount", "type": "uint256", "internalType": "uint256"}],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "unstake",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "withdrawRewards",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "getUnbondingInfo",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [{
          "name": "", 
          "type": "tuple[]", 
          "internalType": "struct EmarkStakingV2.UnbondingInfo[]",
          "components": [
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
            {"name": "releaseTime", "type": "uint256", "internalType": "uint256"}
          ]
        }],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "getWithdrawableAmount",
        "inputs": [{"name": "_user", "type": "address", "internalType": "address"}],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view"
      }
    ] as const
  },
  
  // ABC Rewards contract for claimable commit rewards
  ABC_REWARDS: {
    address: '0x6f0A63404C6C8CAb2e0f92bf112F4293F9f92E15' as `0x${string}`,
    abi: [
      {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "getClaimableAmount",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "getUserRewardInfo",
        "outputs": [
          {"name": "totalAllocated", "type": "uint256"},
          {"name": "totalClaimed", "type": "uint256"},
          {"name": "claimable", "type": "uint256"},
          {"name": "lastUpdated", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "claimRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getContractStats",
        "outputs": [
          {"name": "totalAllocated", "type": "uint256"},
          {"name": "totalClaimed", "type": "uint256"},
          {"name": "contractBalance", "type": "uint256"},
          {"name": "batchCount", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ] as const
  }
};

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Helper to check if contracts are configured
export const isContractsConfigured = () => {
  return CONTRACTS.ABC_STAKING.address.length > 0;
};