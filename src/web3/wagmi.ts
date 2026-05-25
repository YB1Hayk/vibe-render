import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, arbitrum } from 'wagmi/chains';
import { http } from 'viem';

/**
 * Конфигурация wagmi + RainbowKit.
 *
 * VITE_WC_PROJECT_ID — бесплатный project id с https://cloud.reown.com
 * (бывший WalletConnect Cloud). Положить в .env.local.
 *
 * Сети намеренно ограничены Base и Arbitrum — синхронно с src/config/chains.ts.
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'VibeRender',
  projectId: import.meta.env.VITE_WC_PROJECT_ID ?? 'PLACEHOLDER_PROJECT_ID',
  chains: [base, arbitrum],
  transports: {
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: false,
});
