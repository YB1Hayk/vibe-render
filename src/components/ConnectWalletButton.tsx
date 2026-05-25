import { useTranslation } from 'react-i18next';
import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * State-aware кнопка кошелька.
 *
 * Аудит выявил: "Connect Wallet" в текущем MVP — статичная кнопка.
 * Здесь — три состояния через RainbowKit ConnectButton.Custom:
 *   1) не подключён  -> "Connect Wallet"
 *   2) не та сеть    -> "Switch Network" (красная)
 *   3) подключён     -> усечённый адрес 0x4f...8a9b
 * Надписи локализованы; вёрстка вписана в фирменный glass-стиль.
 */
export function ConnectWalletButton() {
  const { t } = useTranslation();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, openAccountModal, mounted }) => {
        if (!mounted) {
          return <div className="h-10 w-36 rounded-lg glass animate-pulse" aria-hidden />;
        }

        const connected = account && chain;

        if (!connected) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {t('wallet.connect')}
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white"
            >
              {t('wallet.wrongNetwork')}
            </button>
          );
        }

        return (
          <button
            type="button"
            onClick={openAccountModal}
            className="rounded-lg glass glass-hover px-4 py-2 text-sm font-medium nums"
          >
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
