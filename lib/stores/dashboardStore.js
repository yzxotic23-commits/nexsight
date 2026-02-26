import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  // Shared dashboard data
  marketData: null,
  depositData: null,
  withdrawData: null,
  wealthAccountData: null, // { production: {...}, status: {...} }
  bankAccountData: null,

  // Loading states
  isLoading: false,
  loadingModules: {
    market: false,
    deposit: false,
    withdraw: false,
    wealth: false,
    bank: false,
  },

  // Actions
  setMarketData: (data) => set({ marketData: data }),
  setDepositData: (data) => set({ depositData: data }),
  setWithdrawData: (data) => set({ withdrawData: data }),
  setWealthAccountData: (data) => set({ wealthAccountData: data }),
  setBankAccountData: (data) => set({ bankAccountData: data }),

  setLoading: (loading) => set({ isLoading: loading }),
  setModuleLoading: (module, loading) =>
    set((state) => ({
      loadingModules: {
        ...state.loadingModules,
        [module]: loading,
      },
    })),

  // Reset all data
  resetData: () =>
    set({
      marketData: null,
      depositData: null,
      withdrawData: null,
      wealthAccountData: null,
      bankAccountData: null,
    }),
}))
