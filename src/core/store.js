import { api } from '../services/api.js';

/** Single source of UI + business state. */
export const state = {
  data: api.load(),
  tab: { purchases: 'new', sales: 'new', inventory: 'sum', people: 'Farmer' },
  cart: { purchase: [], sale: [] },
};

let savedData = JSON.stringify(state.data);

export const persist = () => {
  try {
    api.save(state.data);
    savedData = JSON.stringify(state.data);
    return true;
  } catch (error) {
    console.error('Could not save business data to browser storage.', error);
    state.data = JSON.parse(savedData);
    return false;
  }
};

export const clearAll = () => {
  state.data = api.empty();
  if (!persist()) return false;
  state.cart = { purchase: [], sale: [] };
  return true;
};
