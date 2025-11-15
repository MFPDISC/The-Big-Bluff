import { create } from 'zustand';
import axios from 'axios';

const API_BASE = '/api';

const useStore = create((set, get) => ({
  // State
  companies: [],
  stockPrices: [],
  macroData: null,
  bitcoinPrice: null,
  riskIndex: null,
  alerts: [],
  loading: false,
  error: null,
  // UI State
  isMobileSidebarOpen: false,

  // Actions
  fetchCompanies: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axios.get(`${API_BASE}/stocks/companies`);
      set({ companies: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchStockPrices: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axios.get(`${API_BASE}/stocks/prices`);
      set({ stockPrices: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMacroData: async () => {
    try {
      const response = await axios.get(`${API_BASE}/macro`);
      set({ macroData: response.data });
    } catch (error) {
      console.error('Error fetching macro data:', error);
    }
  },

  fetchBitcoinPrice: async () => {
    try {
      const response = await axios.get(`${API_BASE}/bitcoin/price`);
      set({ bitcoinPrice: response.data });
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
    }
  },

  fetchRiskIndex: async () => {
    try {
      // Use new bubble risk index API
      const response = await axios.get(`${API_BASE}/bubble/risk-index`);
      // Transform to match expected format for sidebar
      const bubbleData = response.data;
      set({ 
        riskIndex: {
          averageIndex: bubbleData.compositeScore,
          interpretation: {
            level: bubbleData.riskLevel,
            message: bubbleData.riskLevel
          }
        }
      });
    } catch (error) {
      console.error('Error fetching risk index:', error);
    }
  },

  fetchAlerts: async () => {
    try {
      const response = await axios.get(`${API_BASE}/alerts`);
      set({ alerts: response.data });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  },

  // Real-time updates
  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts]
    }));
  },

  // UI Actions
  toggleMobileSidebar: () => {
    set((state) => ({
      isMobileSidebarOpen: !state.isMobileSidebarOpen
    }));
  },

  closeMobileSidebar: () => {
    set({ isMobileSidebarOpen: false });
  },

  // Initialize all data
  initializeData: async () => {
    const actions = get();
    await Promise.all([
      actions.fetchCompanies(),
      actions.fetchStockPrices(),
      actions.fetchMacroData(),
      actions.fetchBitcoinPrice(),
      actions.fetchRiskIndex(),
      actions.fetchAlerts()
    ]);
  }
}));

export default useStore;
