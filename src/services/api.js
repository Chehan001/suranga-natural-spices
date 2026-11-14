const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const KEY = 'agro-erp:v1';
let loadError = null;

export const empty = () => ({ prod: [], stock: {}, cost: {}, cash: 0, ppl: [], tx: [] });

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isFiniteRecord = (value) => isRecord(value) && Object.values(value).every(Number.isFinite);
const isTransaction = (item) => {
  if (!isRecord(item) || typeof item.d !== 'string' || !Number.isFinite(item.a) || !Number.isFinite(item.pd)) return false;
  if (item.t === 'purchase' || item.t === 'sale') {
    return typeof item.pid === 'string' && typeof item.who === 'string' &&
      Number.isFinite(item.q) && (item.t !== 'sale' || Number.isFinite(item.cg));
  }
  if (item.t === 'prod') {
    return typeof item.pid === 'string' && typeof item.out === 'string' &&
      Number.isFinite(item.q) && Number.isFinite(item.oq) && Number.isFinite(item.y);
  }
  return (item.t === 'payin' || item.t === 'payout' || item.t === 'expense') && typeof item.who === 'string';
};
const isData = (value) =>
  isRecord(value) &&
  Array.isArray(value.prod) &&
  value.prod.every((item) => isRecord(item) && typeof item.id === 'string' && typeof item.n === 'string' &&
    typeof item.c === 'string' && typeof item.u === 'string' && Number.isFinite(item.p) && Number.isFinite(item.ro)) &&
  isFiniteRecord(value.stock) &&
  isFiniteRecord(value.cost) &&
  Number.isFinite(value.cash) &&
  Array.isArray(value.ppl) &&
  value.ppl.every((item) => isRecord(item) && typeof item.n === 'string' &&
    ['Farmer', 'Supplier', 'Customer'].includes(item.t) && typeof item.ph === 'string' && typeof item.l === 'string') &&
  Array.isArray(value.tx) &&
  value.tx.every(isTransaction);

export const api = {
  empty,
  getLoadError: () => loadError,
  async checkConnection() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${API_BASE_URL}/health/live`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`API health check failed (${response.status})`);
      }

      const result = await response.json();
      if (result.status !== 'ok') {
        throw new Error('API returned an unexpected health response');
      }
      return result;
    } finally {
      clearTimeout(timeout);
    }
  },
  load() {
    try {
      const stored = localStorage.getItem(KEY);
      if (!stored) return empty();
      const data = JSON.parse(stored);
      if (!isData(data)) throw new Error('Saved data has an invalid format');
      return data;
    } catch (error) {
      loadError = 'Saved business data could not be loaded. A new empty workspace is being used.';
      console.error(loadError, error);
      return empty();
    }
  },
  save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
};
