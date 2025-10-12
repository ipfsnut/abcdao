// Contract addresses and ABIs for the ABC DAO system

export const CONTRACTS = {
  // EMARK token for testing (already deployed)
  EMARK_TOKEN: {
    address: '0xf87F3ebbF8CaCF321C2a4027bb66Df639a6f4B07' as `0x${string}`,
    decimals: 18,
    symbol: 'EMARK',
    name: 'Evermark'
  },
  
  // EMARK Staking V2 contract (deployed!)
  EMARK_STAKING: {
    address: '0xCb5cF9061f80b64909E8106e3569f0b8D219941E' as `0x${string}`,
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
  return CONTRACTS.EMARK_STAKING.address.length > 0;
};