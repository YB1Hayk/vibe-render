import { baseSepolia, arbitrumSepolia, base, arbitrum } from 'wagmi/chains';

// ─────────────────────────────────────────────────────────────────────────────
// RenderEscrow — deployed contract addresses
// Update these after running `npx hardhat run scripts/deploy.ts --network baseSepolia`
// ─────────────────────────────────────────────────────────────────────────────

export const RENDER_ESCROW_ADDRESS: Partial<Record<number, `0x${string}`>> = {
  // Testnets (active)
  [baseSepolia.id]:      '0x0000000000000000000000000000000000000000',
  [arbitrumSepolia.id]: '0x0000000000000000000000000000000000000000',
  // Mainnets (Q4 2026 post-audit)
  [base.id]:     '0x0000000000000000000000000000000000000000',
  [arbitrum.id]: '0x0000000000000000000000000000000000000000',
};

export function isContractDeployed(chainId: number): boolean {
  const addr = RENDER_ESCROW_ADDRESS[chainId];
  return !!addr && addr !== '0x0000000000000000000000000000000000000000';
}

// ─────────────────────────────────────────────────────────────────────────────
// Minimal ABI — only the functions we call from the frontend
// ─────────────────────────────────────────────────────────────────────────────

export const RENDER_ESCROW_ABI = [
  {
    type: 'function',
    name: 'createJob',
    inputs: [],
    outputs: [{ name: 'jobId', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'refundJob',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'JobCreated',
    inputs: [
      { name: 'jobId',    type: 'uint256', indexed: true },
      { name: 'designer', type: 'address', indexed: true },
      { name: 'amount',   type: 'uint256', indexed: false },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Explorer helpers
// ─────────────────────────────────────────────────────────────────────────────

const EXPLORER_BASE: Partial<Record<number, string>> = {
  [baseSepolia.id]:      'https://sepolia.basescan.org',
  [arbitrumSepolia.id]: 'https://sepolia.arbiscan.io',
  [base.id]:             'https://basescan.org',
  [arbitrum.id]:         'https://arbiscan.io',
};

export function getExplorerTxUrl(chainId: number, hash: string): string {
  const base_ = EXPLORER_BASE[chainId];
  return base_ ? `${base_}/tx/${hash}` : `https://sepolia.basescan.org/tx/${hash}`;
}

export function getExplorerName(chainId: number): string {
  if (chainId === baseSepolia.id || chainId === base.id) return 'Basescan';
  if (chainId === arbitrumSepolia.id || chainId === arbitrum.id) return 'Arbiscan';
  return 'Explorer';
}

// Testnet chain IDs — used to gate UI
export const TESTNET_CHAIN_IDS = [baseSepolia.id, arbitrumSepolia.id] as const;
