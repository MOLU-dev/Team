# Multichain Token Support Guide

## Overview
BitSilo supports multichain tokens (USDT, USDC, EURC) across multiple blockchain networks. This document explains how the frontend handles network selection and chain-specific operations.

## Supported Networks

### Ethereum (ERC20)
- **Chain ID**: `ethereum` / `erc20`
- **Tokens**: ETH, USDT, USDC, EURC
- **Color**: `#627eea` (blue)
- **Icon**: Ethereum logo

### Binance Smart Chain (BEP20)
- **Chain ID**: `bsc` / `bep20`
- **Tokens**: BNB, USDT, USDC
- **Color**: `#f3ba2f` (yellow)
- **Icon**: BSC logo

### Tron (TRC20)
- **Chain ID**: `tron` / `trc20`
- **Tokens**: TRX, USDT, USDC
- **Color**: `#eb4141` (red)
- **Icon**: Tron logo

## Token Availability Matrix

| Token | Ethereum | BSC | Tron | Notes |
|-------|----------|-----|------|-------|
| ETH   | ✅       | ❌  | ❌   | Native token |
| USDT  | ✅       | ✅  | ✅   | Available on all chains |
| USDC  | ✅       | ✅  | ✅   | Available on all chains |
| EURC  | ✅       | ❌  | ❌   | **Ethereum only** |
| BNB   | ❌       | ✅  | ❌   | Native token |
| TRX   | ❌       | ❌  | ✅   | Native token |

## Frontend Implementation

### Network Selection Component

The `NetworkSelector` component allows users to choose the blockchain:

```tsx
<NetworkSelector
  networks={availableNetworks}
  selected={selectedNetwork}
  onSelect={setSelectedNetwork}
/>
```

### Asset Selection with Network Context

When selecting an asset, the network options are automatically filtered:

```tsx
// Example from SendForm.tsx
const handleAssetChange = (asset: string) => {
  setSelectedAsset(asset);
  
  // Auto-select Ethereum for EURC
  if (asset === 'eurc') {
    setSelectedNetwork('erc20');
  }
};

// Filter networks based on selected asset
const availableNetworks = networks.filter(network => {
  if (selectedAsset === 'eurc') {
    return network.id === 'erc20'; // EURC only on Ethereum
  }
  return true; // All networks available for other assets
});
```

### API Integration for Multichain Operations

#### 1. Get Balances by Chain

```typescript
import { api } from '@/lib/api';

// Get balance for specific asset on specific chain
const balance = await api.getBalances('USDT', 'ethereum');

// Get all balances across all chains
const allBalances = await api.getAllBalances();
```

**Backend Response Format:**
```json
{
  "success": true,
  "balances": [
    {
      "currency": "USDT",
      "available_balance": "1240.50",
      "chain": "ethereum"
    },
    {
      "currency": "USDT",
      "available_balance": "500.00",
      "chain": "bsc"
    },
    {
      "currency": "USDT",
      "available_balance": "300.00",
      "chain": "tron"
    }
  ]
}
```

#### 2. Request Deposit Address by Chain

```typescript
// Request ETH address on Ethereum
const ethAddress = await api.requestAddress('ethereum');

// Request USDT address on Tron
const tronAddress = await api.requestAddress('tron');
```

#### 3. Send Transaction with Chain Specification

```typescript
// Send USDT on Ethereum
await api.sendPreview(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a',
  'USDT',
  '100',
  'ethereum'  // Chain parameter
);

// Send USDT on BSC
await api.sendPreview(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f8f3a',
  'USDT',
  '100',
  'bsc'  // Different chain
);
```

## Component-Level Multichain Handling

### Send Form (`components/send/SendForm.tsx`)

```tsx
function SendForm() {
  const [selectedAsset, setSelectedAsset] = useState('eth');
  const [selectedNetwork, setSelectedNetwork] = useState('erc20');
  
  // Network filter logic
  const filteredNetworks = networks.filter(network => {
    if (selectedAsset === 'eurc') {
      return network.id === 'erc20';
    }
    // Add more chain-specific logic here
    return true;
  });
  
  // Handle submission
  const handleSubmit = async () => {
    const result = await api.sendPreview(
      recipientAddress,
      selectedAsset.toUpperCase(),
      amount,
      selectedNetwork  // Chain ID sent to backend
    );
  };
}
```

### Receive Container (`components/receive/ReceiveContainer.tsx`)

```tsx
function ReceiveContainer() {
  const [selectedAsset, setSelectedAsset] = useState('usdt');
  const [selectedNetwork, setSelectedNetwork] = useState('erc20');
  
  // Fetch address for specific chain
  const fetchAddress = async () => {
    const response = await api.requestAddress(selectedNetwork);
    setAddress(response.address);
  };
  
  // Network selection changes address
  useEffect(() => {
    fetchAddress();
  }, [selectedNetwork]);
}
```

### Assets List (`components/dashboard/AssetsList.tsx`)

```tsx
// Display assets grouped by chain
const assets = [
  {
    name: 'USDT',
    total: '$2,040.50',
    chains: [
      { name: 'Ethereum', amount: '$1,240.50', badge: 'ERC20' },
      { name: 'BSC', amount: '$500.00', badge: 'BEP20' },
      { name: 'Tron', amount: '$300.00', badge: 'TRC20' },
    ]
  },
  // EURC only shows Ethereum
  {
    name: 'EURC',
    total: '$150.00',
    chains: [
      { name: 'Ethereum', amount: '$150.00', badge: 'ERC20' },
    ]
  }
];
```

## Network Badge Styling

Each network has distinct visual styling:

```tsx
// Network badge classes
const networkStyles = {
  erc20: 'bg-erc20/10 text-erc20 border-erc20/30',  // Blue
  bep20: 'bg-bep20/10 text-bep20 border-bep20/30',  // Yellow
  trc20: 'bg-trc20/10 text-trc20 border-trc20/30',  // Red
};
```

## Chain-Specific Validations

### Address Format Validation

```typescript
function validateAddress(address: string, chain: string): boolean {
  switch(chain) {
    case 'ethereum':
    case 'bsc':
      // EVM-compatible chains use same format
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    
    case 'tron':
      // Tron uses base58 format
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    
    default:
      return false;
  }
}
```

### Minimum Transaction Amounts

```typescript
const minimumAmounts: Record<string, Record<string, string>> = {
  ethereum: {
    ETH: '0.001',
    USDT: '1.00',
    USDC: '1.00',
    EURC: '1.00',
  },
  bsc: {
    BNB: '0.01',
    USDT: '1.00',
    USDC: '1.00',
  },
  tron: {
    TRX: '1.00',
    USDT: '1.00',
    USDC: '1.00',
  },
};
```

## Gas Fee Display by Network

Different networks have different fee structures:

```tsx
// Ethereum gas options
const ethGasOptions = [
  { id: 'slow', time: '~5 min', fee: '$1.20' },
  { id: 'standard', time: '~2 min', fee: '$2.40' },
  { id: 'fast', time: '~30 sec', fee: '$4.80' },
];

// BSC gas options (cheaper)
const bscGasOptions = [
  { id: 'slow', time: '~1 min', fee: '$0.10' },
  { id: 'standard', time: '~30 sec', fee: '$0.20' },
  { id: 'fast', time: '~15 sec', fee: '$0.30' },
];

// Tron uses energy/bandwidth
const tronFeeOptions = [
  { id: 'standard', time: '~3 sec', fee: '~0 TRX (with energy)' },
];
```

## Transaction History by Chain

Filter transactions by network:

```tsx
function TransactionHistory() {
  const [selectedChain, setSelectedChain] = useState('all');
  
  const fetchHistory = async () => {
    const response = await api.getHistory(50, 0);
    
    // Filter by chain if needed
    const filtered = selectedChain === 'all' 
      ? response.transactions
      : response.transactions.filter(tx => tx.chain === selectedChain);
    
    setTransactions(filtered);
  };
}
```

## Network Status Indicators

Show network connectivity:

```tsx
const networkStatus = {
  ethereum: { online: true, blockHeight: 19234567 },
  bsc: { online: true, blockHeight: 35678901 },
  tron: { online: true, blockHeight: 58901234 },
};
```

## Best Practices

1. **Always Include Chain Parameter**
   - Every wallet operation should specify the chain
   - Never assume a default chain

2. **Validate Chain-Asset Combinations**
   - Check if asset is supported on selected chain
   - Show clear error messages for invalid combinations

3. **Display Chain Information**
   - Always show network badges on balances
   - Use consistent colors and icons per chain

4. **Handle Chain Switching**
   - Clear or update form data when chain changes
   - Fetch new addresses for each chain

5. **Error Handling**
   - Different chains may have different error messages
   - Provide chain-specific troubleshooting tips

## Future Enhancements

1. **Dynamic Network List**
   - Fetch available networks from backend
   - Support for adding new chains

2. **Network Auto-Selection**
   - Choose cheapest network for transaction
   - Best route for token swaps

3. **Cross-Chain Bridges**
   - Support for moving tokens between chains
   - Bridge status tracking

4. **Network Analytics**
   - Show gas price trends
   - Transaction volume by chain

## Testing Multichain Functionality

### Test Scenario 1: EURC Restriction
```
1. Go to Send page
2. Select EURC
3. Verify only Ethereum network is available
4. Try switching to BSC - should not be possible
```

### Test Scenario 2: USDT on Multiple Chains
```
1. Go to Dashboard
2. Check USDT balance
3. Verify it shows balances for Ethereum, BSC, and Tron
4. Total should be sum of all chains
```

### Test Scenario 3: Chain-Specific Addresses
```
1. Go to Receive page
2. Select Ethereum
3. Note the address
4. Switch to Tron
5. Address should change to Tron format (starts with T)
```

## Troubleshooting

**Issue**: Wrong network selected for asset
**Solution**: Clear localStorage and refresh

**Issue**: Transaction fails on wrong chain
**Solution**: Backend validates chain-asset combination

**Issue**: Balance not showing for specific chain
**Solution**: Check if wallet has address for that chain

---

For implementation details, see:
- `components/send/SendForm.tsx`
- `components/receive/ReceiveContainer.tsx`
- `components/dashboard/AssetsList.tsx`
- `lib/api.ts`
