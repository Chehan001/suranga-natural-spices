const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const KEY = 'agro-erp:v1';
let accessTokenProvider;
let loadError = null;

export const empty = () => ({ prod: [], stock: {}, cost: {}, cash: 0, ppl: [], tx: [] });

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

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
const isLegacyBusinessData = (value) =>
  isRecord(value) &&
  Array.isArray(value.prod) &&
  isFiniteRecord(value.stock || {}) &&
  isFiniteRecord(value.cost || {}) &&
  Number.isFinite(value.cash ?? 0) &&
  Array.isArray(value.ppl) &&
  Array.isArray(value.tx) &&
  value.tx.every(isTransaction);

function readLegacySnapshot() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return { raw, data: empty() };
  const parsed = JSON.parse(raw);
  if (!isLegacyBusinessData(parsed)) {
    throw new Error('Stored ERP data has an invalid format');
  }
  return {
    raw,
    data: {
      ...empty(),
      stock: parsed.stock || {},
      cost: parsed.cost || {},
      cash: parsed.cash ?? 0,
      ppl: parsed.ppl || [],
      tx: parsed.tx || [],
      prod: Array.isArray(parsed.prod) ? parsed.prod : [],
    },
  };
}

function toLegacyProduct(product) {
  return {
    id: product.id,
    n: product.name,
    nameEn: product.name,
    c: product.category,
    u: product.unit,
    ro: Number(product.reorderLevel),
    p: Number(product.defaultPrice),
    active: product.active !== false,
  };
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessTokenProvider) {
    const token = await accessTokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError('Cannot reach the backend API. Check your connection and try again.', 0, 'API_UNAVAILABLE');
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('The backend returned an invalid response.', response.status, 'INVALID_API_RESPONSE');
  }
  if (!response.ok) {
    throw new ApiError(
      typeof result.message === 'string' ? result.message : 'The request could not be completed.',
      response.status,
      typeof result.code === 'string' ? result.code : 'API_ERROR',
    );
  }
  return result;
}

export const api = {
  empty,
  getLoadError: () => loadError,
  setAccessTokenProvider(provider) {
    accessTokenProvider = provider;
  },
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
  async listProducts() {
    const pageSize = 100;
    const first = await request(`/products?page=1&pageSize=${pageSize}`);
    const items = [...first.items];
    for (let page = 2; items.length < first.total; page += 1) {
      const next = await request(`/products?page=${page}&pageSize=${pageSize}`);
      items.push(...next.items);
    }
    return items;
  },
  createProduct(product) {
    return request('/products', { method: 'POST', body: product });
  },
  updateProduct(id, product) {
    return request(`/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: product });
  },
  archiveProduct(id) {
    return request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  downloadLegacyBackup() {
    const { data } = readLegacySnapshot();
    const exportFile = {
      format: 'suranga-agroerp-local-export',
      version: 1,
      sourceKey: KEY,
      exportedAt: new Date().toISOString(),
      data,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportFile, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `suranga-agroerp-backup-${new Date().toISOString().replaceAll(':', '-')}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return Array.isArray(data.prod) ? data.prod.length : 0;
  },
  /** Loads non-product legacy business data from browser storage. Products come from the API. */
  load() {
    try {
      loadError = null;
      const { data } = readLegacySnapshot();
      return {
        prod: [],
        stock: data.stock,
        cost: data.cost,
        cash: data.cash,
        ppl: data.ppl,
        tx: data.tx,
      };
    } catch (error) {
      loadError = 'Saved business data could not be loaded. A new empty workspace is being used for non-product data.';
      console.error(loadError, error);
      return empty();
    }
  },
  /**
   * Persists non-product legacy data only.
   * Preserves any previously stored local product snapshot; does not write API products back to localStorage.
   */
  save(data) {
    try {
      const { raw, data: existing } = readLegacySnapshot();
      const legacyProducts = raw === null ? [] : existing.prod;
      localStorage.setItem(KEY, JSON.stringify({
        stock: data.stock || {},
        cost: data.cost || {},
        cash: data.cash ?? 0,
        ppl: data.ppl || [],
        tx: data.tx || [],
        prod: legacyProducts,
      }));
      return true;
    } catch (error) {
      console.error('Could not save business data to browser storage.', error);
      return false;
    }
  },
  toLegacyProduct,
};
