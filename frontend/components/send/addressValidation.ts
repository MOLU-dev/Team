export type AppEnvironment = 'production' | 'staging' | 'development' | 'prod' | 'stage' | 'dev' | 'local';

export function validateCryptoAddress(
  address: string,
  chainId: string,
  env?: string
): { valid: boolean; error?: string } {
  const addr = address.trim();
  if (!addr) return { valid: false, error: 'Address is required' };

  const rawChain = chainId.toLowerCase().trim();
  const chain = canonicalChain(rawChain);

  // Determine current environment
  const currentEnv = (env || process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development').toLowerCase().trim();

  // 1. Detect which networks (mainnet, testnet, regtest) this address belongs to
  const networks = detectNetworks(chain, addr);
  if (networks.length === 0) {
    return { valid: false, error: `Invalid ${getChainDisplayName(chain)} address format` };
  }

  // 2. Enforce environment-specific rules:
  // - In production: do not accept test and regtest address
  // - In staging: do not accept mainnet and regtest address
  // - In development: do not accept main and testnet address
  if (currentEnv === 'production' || currentEnv === 'prod') {
    if (!networks.includes('mainnet')) {
      return {
        valid: false,
        error: 'Testnet and regtest addresses are not accepted in production',
      };
    }
  } else if (currentEnv === 'staging' || currentEnv === 'stage') {
    if (networks.includes('mainnet') && networks.length === 1) {
      return {
        valid: false,
        error: 'Mainnet addresses are not accepted in staging (testnet only)',
      };
    }
    if (networks.includes('regtest') && !networks.includes('testnet')) {
      return {
        valid: false,
        error: 'Regtest addresses are not accepted in staging (testnet only)',
      };
    }
    if (!networks.includes('testnet')) {
      return {
        valid: false,
        error: 'Only testnet addresses are accepted in staging',
      };
    }
  } else if (currentEnv === 'development' || currentEnv === 'dev' || currentEnv === 'local') {
    if (networks.includes('mainnet') && networks.length === 1) {
      return {
        valid: false,
        error: 'Mainnet addresses are not accepted in development (regtest only)',
      };
    }
    if (networks.includes('testnet') && !networks.includes('regtest')) {
      return {
        valid: false,
        error: 'Testnet addresses are not accepted in development (regtest only)',
      };
    }
    if (!networks.includes('regtest')) {
      return {
        valid: false,
        error: 'Only regtest addresses are accepted in development',
      };
    }
  }

  return { valid: true };
}

type NetworkType = 'mainnet' | 'testnet' | 'regtest';

function detectNetworks(chain: string, addr: string): NetworkType[] {
  switch (chain) {
    case 'bitcoin': {
      if (/^bc1[a-z0-9]{11,90}$/i.test(addr) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
        return ['mainnet'];
      }
      if (/^tb1[a-z0-9]{11,90}$/i.test(addr)) {
        return ['testnet'];
      }
      if (/^bcrt1[a-z0-9]{11,90}$/i.test(addr)) {
        return ['regtest'];
      }
      if (/^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
        return ['testnet', 'regtest'];
      }
      return [];
    }

    case 'litecoin': {
      if (/^ltc1[a-z0-9]{11,90}$/i.test(addr) || /^[LM3][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
        return ['mainnet'];
      }
      if (/^tltc1[a-z0-9]{11,90}$/i.test(addr)) {
        return ['testnet'];
      }
      if (/^rltc1[a-z0-9]{11,90}$/i.test(addr)) {
        return ['regtest'];
      }
      if (/^[mnQ2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
        return ['testnet', 'regtest'];
      }
      return [];
    }

    case 'dogecoin': {
      if (/^[D9A][a-km-zA-HJ-NP-Z1-9]{32,34}$/.test(addr)) {
        return ['mainnet'];
      }
      if (/^[mn2][a-km-zA-HJ-NP-Z1-9]{32,34}$/.test(addr)) {
        return ['testnet', 'regtest'];
      }
      return [];
    }

    case 'dash': {
      if (/^[X7][1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)) {
        return ['mainnet'];
      }
      if (/^[y8][1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)) {
        return ['testnet', 'regtest'];
      }
      return [];
    }

    case 'bitcoincash': {
      if (/^bchtest:[qp][a-z0-9]{41}$/i.test(addr)) {
        return ['testnet'];
      }
      if (/^bchreg:[qp][a-z0-9]{41}$/i.test(addr)) {
        return ['regtest'];
      }
      if (/^(bitcoincash:)?[qp][a-z0-9]{41}$/i.test(addr) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
        return ['mainnet'];
      }
      if (/^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) {
        return ['testnet', 'regtest'];
      }
      return [];
    }

    case 'ethereum':
    case 'bsc': {
      if (/^0x[a-fA-F0-9]{40}$/.test(addr)) {
        return ['mainnet', 'testnet', 'regtest'];
      }
      return [];
    }

    case 'tron': {
      if (/^T[a-km-zA-HJ-NP-Z1-9]{33}$/.test(addr) || /^(41|0x)[a-fA-F0-9]{40}$/i.test(addr)) {
        return ['mainnet', 'testnet', 'regtest'];
      }
      return [];
    }

    case 'solana': {
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
        return ['mainnet', 'testnet', 'regtest'];
      }
      return [];
    }

    case 'ripple': {
      if (/^X[1-9A-HJ-NP-Za-km-z]{46}$/.test(addr)) {
        return ['mainnet'];
      }
      if (/^T[1-9A-HJ-NP-Za-km-z]{46}$/.test(addr)) {
        return ['testnet', 'regtest'];
      }
      if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(addr)) {
        return ['mainnet', 'testnet', 'regtest'];
      }
      return [];
    }

    default:
      return ['mainnet', 'testnet', 'regtest'];
  }
}

function canonicalChain(c: string): string {
  switch (c) {
    case 'btc':
    case 'bitcoin':
      return 'bitcoin';
    case 'eth':
    case 'ethereum':
    case 'sepolia':
    case 'holesky':
      return 'ethereum';
    case 'bsc':
    case 'bsctestnet':
    case 'binance':
      return 'bsc';
    case 'trx':
    case 'tron':
    case 'trontestnet':
    case 'shasta':
    case 'nile':
      return 'tron';
    case 'sol':
    case 'solana':
    case 'solanadevnet':
    case 'solanatestnet':
      return 'solana';
    case 'ltc':
    case 'litecoin':
      return 'litecoin';
    case 'doge':
    case 'dogecoin':
      return 'dogecoin';
    case 'dash':
      return 'dash';
    case 'bch':
    case 'bitcoincash':
      return 'bitcoincash';
    case 'xrp':
    case 'ripple':
      return 'ripple';
    default:
      return c;
  }
}

function getChainDisplayName(chain: string): string {
  switch (chain) {
    case 'bitcoin': return 'Bitcoin';
    case 'ethereum': return 'Ethereum';
    case 'bsc': return 'BNB Smart Chain';
    case 'tron': return 'TRON';
    case 'solana': return 'Solana';
    case 'litecoin': return 'Litecoin';
    case 'dogecoin': return 'Dogecoin';
    case 'dash': return 'Dash';
    case 'bitcoincash': return 'Bitcoin Cash';
    case 'ripple': return 'Ripple (XRP)';
    default: return chain;
  }
}

export function getMaxMemoLength(network: string): number {
  const net = canonicalChain(network.toLowerCase().trim());
  if (['bitcoin', 'litecoin', 'dogecoin', 'dash'].includes(net)) {
    return 80;
  }
  if (net === 'bitcoincash') {
    return 220;
  }
  return 256;
}
