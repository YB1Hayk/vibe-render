import { base, arbitrum } from 'wagmi/chains';

/**
 * ЕДИНСТВЕННЫЙ источник истины по поддерживаемым сетям.
 *
 * Аудит выявил баг: сайт называл три разных набора сетей в трёх местах
 * ("Polygon · zkSync · Base", "Base or Arbitrum", "Base · Arbitrum · Polygon").
 * Любой UI-текст про сети теперь обязан брать значение отсюда.
 */
export const SUPPORTED_CHAINS = [
  { chain: base, short: 'Base', escrowToken: 'USDC' },
  { chain: arbitrum, short: 'Arbitrum', escrowToken: 'USDT' },
] as const;

export const CHAIN_IDS = SUPPORTED_CHAINS.map((c) => c.chain.id);

/** Готовая строка для UI: "Base · Arbitrum". Подставлять через i18n-интерполяцию. */
export const CHAIN_LABEL = SUPPORTED_CHAINS.map((c) => c.short).join(' · ');

export function isSupportedChain(id?: number): boolean {
  return id != null && (CHAIN_IDS as readonly number[]).includes(id);
}
