const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const KEY = 'agro-erp:v1';

export const empty = () => ({ prod: [], stock: {}, cost: {}, cash: 0, ppl: [], tx: [] });

export const api = {
  empty,
  async checkConnection() {
    const response = await fetch(`${API_BASE_URL}/health/live`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`API health check failed (${response.status})`);
    }

    const result = await response.json();
    if (result.status !== 'ok') {
      throw new Error('API returned an unexpected health response');
    }
    return result;
  },
  load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || empty();
    } catch {
      return empty();
    }
  },
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable: ignore */
    }
  },
};
