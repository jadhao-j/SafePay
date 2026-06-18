export type UseAuthResult = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

export function useAuth(): UseAuthResult {
  // TODO: Connect auth hook to backend /auth endpoints and session management.
  return {
    isAuthenticated: false,
    isLoading: false,
    login: async (): Promise<void> => {
      return;
    },
    logout: async (): Promise<void> => {
      return;
    }
  };
}
