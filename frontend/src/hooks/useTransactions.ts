import type { Transaction } from "@/lib/types";

export type UseTransactionsResult = {
  transactions: Transaction[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export function useTransactions(): UseTransactionsResult {
  // TODO: Fetch transaction history with cursor pagination from /wallet/transactions.
  return {
    transactions: [],
    isLoading: false,
    refresh: async (): Promise<void> => {
      return;
    }
  };
}
