import { state } from '../../core/store.js';
import { sum, isExpense } from '../../core/selectors.js';
import { rs, esc } from '../../utils/format.js';
import { kpi, table } from '../../components/ui.js';

export const reports = {
  id: 'reports', title: 'Reports', icon: 'chart',
  render() {
    const sales = sum((x) => x.t === 'sale', (x) => x.a);
    const purchases = sum((x) => x.t === 'purchase', (x) => x.a);
    const expenses = sum(isExpense, (x) => x.a);
    const gross = sales - sum((x) => x.t === 'sale', (x) => x.cg);
    const rows = state.data.prod.map((p) => {
      const isSale = (x) => x.t === 'sale' && x.pid === p.id;
      const a = sum(isSale, (x) => x.a), c = sum(isSale, (x) => x.cg);
      return [esc(p.n), sum(isSale, (x) => x.q), rs(a), rs(c), rs(a - c), sum((x) => x.t === 'purchase' && x.pid === p.id, (x) => x.q)];
    });
    return `<div class="kp">${kpi('Total sales', rs(sales), 'c1')}${kpi('Total purchases', rs(purchases), 'c3')}${kpi('Expenses', rs(expenses), 'c4')}${kpi('Gross profit (est.)', rs(gross), 'c2')}${kpi('Operating profit (est.)', rs(gross - expenses), 'c1')}</div>
    <div class="card"><h3>By product</h3>${table(['Product', 'Sold (kg)', 'Sales', 'Cost of goods', 'Gross profit', 'Bought (kg)'], rows)}</div>
    <p class="note">Profit figures are provisional estimates using average cost, not final accounting. Operating profit = gross profit − expenses. Purchases are not subtracted from sales.</p>`;
  },
};
