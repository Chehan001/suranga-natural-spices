import { api } from '../services/api.js';

/** Single source of UI + business state. */
export const state = {
  data: api.load(),
  products: { status: 'idle', error: null },
  tab: { purchases: 'new', sales: 'new', inventory: 'sum', people: 'Farmer' },
  cart: { purchase: [], sale: [] },
};

let savedData = JSON.stringify({
  stock: state.data.stock,
  cost: state.data.cost,
  cash: state.data.cash,
  ppl: state.data.ppl,
  tx: state.data.tx,
});

const snapshotLegacy = (data) => JSON.stringify({
  stock: data.stock,
  cost: data.cost,
  cash: data.cash,
  ppl: data.ppl,
  tx: data.tx,
});

/** Persists non-product business data to browser storage (temporary until those APIs exist). */
export const persist = () => {
  try {
    if (!api.save(state.data)) {
      const previous = JSON.parse(savedData);
      state.data.stock = previous.stock;
      state.data.cost = previous.cost;
      state.data.cash = previous.cash;
      state.data.ppl = previous.ppl;
      state.data.tx = previous.tx;
      return false;
    }
    savedData = snapshotLegacy(state.data);
    return true;
  } catch (error) {
    console.error('Could not save business data to browser storage.', error);
    const previous = JSON.parse(savedData);
    state.data.stock = previous.stock;
    state.data.cost = previous.cost;
    state.data.cash = previous.cash;
    state.data.ppl = previous.ppl;
    state.data.tx = previous.tx;
    return false;
  }
};

function productLoadError(error) {
  const messages = {
    USER_NOT_PROVISIONED: 'Your account is not assigned to an active business yet.',
    ORGANIZATION_SELECTION_REQUIRED: 'Choose an active business before loading products.',
    INSUFFICIENT_PERMISSION: 'Your account does not have permission to view products.',
    UNAUTHENTICATED: 'Sign in is required to load products.',
    API_UNAVAILABLE: 'Cannot reach the backend API. Check your connection and try again.',
  };
  if (error && typeof error.code === 'string' && messages[error.code]) return messages[error.code];
  return error instanceof Error ? error.message : 'Could not load products.';
}

export async function refreshProducts() {
  state.products.status = 'loading';
  state.products.error = null;
  try {
    const products = await api.listProducts();
    state.data.prod = products.map(api.toLegacyProduct);
    state.products.status = 'ready';
    return true;
  } catch (error) {
    state.data.prod = [];
    state.products.status = 'error';
    state.products.error = productLoadError(error);
    return false;
  }
}

/** Disabled for business data safety — use Settings backup instead. */
export const clearAll = () => false;
