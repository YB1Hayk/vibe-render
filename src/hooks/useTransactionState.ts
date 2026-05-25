import { useCallback, useState } from 'react';

/**
 * Машина состояний для любой on-chain кнопки (Lock Escrow, Withdraw, Claim Job).
 *
 * Аудит выявил: кнопки в текущем MVP статичны. Этот хук даёт каждой
 * on-chain кнопке полноценный жизненный цикл — UI просто читает `status`
 * и рисует нужную надпись/спиннер/тост.
 *
 * idle -> awaitingSignature -> pending -> success | error
 *
 * Пример:
 *   const tx = useTransactionState();
 *   <button disabled={tx.isBusy} onClick={() =>
 *     tx.run(async () => writeContractAsync({ ...escrowDeposit }))
 *   }>{tx.isBusy ? t('wallet.pending') : t('designers.lockEscrow')}</button>
 */
export type TxStatus =
  | 'idle'
  | 'awaitingSignature'
  | 'pending'
  | 'success'
  | 'error';

export interface TxState {
  status: TxStatus;
  hash?: `0x${string}`;
  error?: string;
}

export function useTransactionState() {
  const [state, setState] = useState<TxState>({ status: 'idle' });

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  const run = useCallback(
    async (action: () => Promise<`0x${string}` | void>) => {
      try {
        setState({ status: 'awaitingSignature' });
        const hash = await action();
        if (hash) setState({ status: 'pending', hash });
        // TODO(Claude Code): дождаться waitForTransactionReceipt({ hash })
        // перед переводом в 'success'.
        setState({ status: 'success', hash: hash ?? undefined });
        return hash;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Transaction failed';
        // Отмена пользователем в кошельке — это не ошибка, тихо возвращаемся в idle.
        if (/user rejected|user denied|rejected the request/i.test(msg)) {
          setState({ status: 'idle' });
        } else {
          setState({ status: 'error', error: msg });
        }
      }
    },
    [],
  );

  const isBusy =
    state.status === 'awaitingSignature' || state.status === 'pending';

  return { ...state, isBusy, run, reset };
}
