import { state } from './store.js';

export const sum = (filter, pick) => state.data.tx.filter(filter).reduce((a, x) => a + pick(x), 0);
export const productName = (id) => (state.data.prod.find((p) => p.id === id) || { n: id }).n;
export const isExpense = (x) => x.t === 'expense' || x.t === 'prod';

/** Cash position and outstanding balances derived from transactions. */
export function money() {
  const d = state.data;
  const cashIn = sum((x) => x.t === 'sale', (x) => x.pd) + sum((x) => x.t === 'payin', (x) => x.a);
  const cashOut =
    sum((x) => x.t === 'purchase', (x) => x.pd) + sum((x) => isExpense(x) || x.t === 'payout', (x) => x.a);
  return {
    cash: d.cash + cashIn - cashOut,
    cashIn,
    cashOut,
    receivable: Math.max(0, sum((x) => x.t === 'sale', (x) => x.a - x.pd) - sum((x) => x.t === 'payin', (x) => x.a)),
    payable: Math.max(0, sum((x) => x.t === 'purchase', (x) => x.a - x.pd) - sum((x) => x.t === 'payout', (x) => x.a)),
  };
}

export const recentLedger = (n) =>
  state.data.tx
    .filter((x) => (x.t === 'sale' || x.t === 'purchase' ? x.pd > 0 : true))
    .slice()
    .sort((a, b) => (a.d < b.d ? 1 : -1))
    .slice(0, n);

export const ledgerKind = (x) =>
  ({
    sale: ['In', 'Sale'], payin: ['In', 'Payment received'], purchase: ['Out', 'Purchase'],
    payout: ['Out', 'Payment made'], prod: ['Out', 'Processing cost'], expense: ['Out', 'Expense'],
  }[x.t]);

export function personBalance(p) {
  const isCustomer = p.t === 'Customer';
  const owed = isCustomer
    ? sum((x) => x.t === 'sale' && x.who === p.n, (x) => x.a - x.pd) - sum((x) => x.t === 'payin' && x.who === p.n, (x) => x.a)
    : sum((x) => x.t === 'purchase' && x.who === p.n, (x) => x.a - x.pd) - sum((x) => x.t === 'payout' && x.who === p.n, (x) => x.a);
  return Math.max(0, owed);
}
