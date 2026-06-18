import type { Wallet } from "@/lib/types";

export type UseWalletResult = {
  wallet: Wallet | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export function useWallet(): UseWalletResult {
  // TODO: Fetch wallet and balance data from /wallet endpoints.
  return {
    wallet: null,
    isLoading: false,
    refresh: async (): Promise<void> => {
      return;
    }
  };
}
