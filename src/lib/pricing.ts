/**
 * Реактивный расчёт стоимости escrow.
 *
 * Аудит выявил два бага в текущем калькуляторе:
 *  1) "Network fee 0.00 USDT" — нулевая комиссия = нет бизнес-модели;
 *  2) цена за кадр не реагировала на разрешение (8K стоил как 1080p).
 * Эта функция чинит оба: ставка зависит от разрешения, комиссия > 0.
 */
export type Resolution = '1080p' | '4K' | '8K';

/** Ставка за кадр в USDT в зависимости от разрешения. */
const RATE_PER_FRAME: Record<Resolution, number> = {
  '1080p': 0.6,
  '4K': 1.5,
  '8K': 4.2,
};

/** Комиссия протокола. НЕ должна быть 0 — это выручка VibeRender. */
export const PROTOCOL_FEE_RATE = 0.03; // 3%

export interface Quote {
  ratePerFrame: number;
  frames: number;
  base: number;
  protocolFee: number;
  total: number;
}

export function quote(resolution: Resolution, frames: number): Quote {
  const ratePerFrame = RATE_PER_FRAME[resolution];
  const safeFrames = Math.max(0, Math.floor(frames));
  const base = ratePerFrame * safeFrames;
  const protocolFee = base * PROTOCOL_FEE_RATE;
  return { ratePerFrame, frames: safeFrames, base, protocolFee, total: base + protocolFee };
}

/** Форматирование суммы для UI. Используется вместе с классом .nums (tabular-nums). */
export function usdt(amount: number): string {
  return (
    amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' USDT'
  );
}
