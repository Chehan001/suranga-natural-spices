import { api } from '../services/api.js';

/** Single source of UI + business state. */
export const state = {
  data: api.load(),
  tab: { purchases: 'new', sales: 'new', inventory: 'sum', people: 'Farmer' },
  cart: { purchase: [], sale: [] },
};

export const persist = () => api.save(state.data);
export const clearAll = () => {
  state.data = api.empty();
  persist();
};
