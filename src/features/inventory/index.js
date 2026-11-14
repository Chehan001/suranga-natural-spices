import { state } from '../../core/store.js';
import { productName } from '../../core/selectors.js';
import { rs, esc } from '../../utils/format.js';
import { kpi, table, tabs } from '../../components/ui.js';

const status = (p) => {
  const q = state.data.stock[p.id] || 0;
  return q <= 0 ? ['Out of stock', 'out'] : q <= p.ro ? ['Low', 'wn'] : ['OK', 'in'];
};

export const inventory = {
  id: 'inventory', title: 'My Stock', icon: 'box',
  render() {
    const d = state.data;
    const value = d.prod.reduce((a, p) => a + (d.stock[p.id] || 0) * (d.cost[p.id] || 0), 0);
    const movements = d.tx.filter((x) => x.pid).slice().reverse().slice(0, 25)
      .map((x) => [x.d, esc(productName(x.pid)), x.t, x.t === 'purchase' ? '+' + x.q : '−' + x.q + ' kg', x.t === 'prod' ? '+' + x.oq + ' ' + esc(productName(x.out)) : '']);
    return `<div class="kp">${kpi('Stock value (est. at cost)', rs(value), 'c1')}${kpi('Total items', d.prod.length, 'c3')}${kpi('Low stock', d.prod.filter((p) => status(p)[1] === 'wn').length, 'c2')}${kpi('Out of stock', d.prod.filter((p) => status(p)[1] === 'out').length, 'c4')}</div>` +
      tabs('inventory', [['sum', 'Stock Summary'], ['mv', 'Stock Movement']]) +
      '<div class="card">' +
      (state.tab.inventory === 'sum'
        ? table(['Product', 'Category', 'Available', 'Unit', 'Stock value', 'Reorder at', 'Status'],
            d.prod.map((p) => [esc(p.n), esc(p.c), Math.round(d.stock[p.id] || 0), p.u, rs((d.stock[p.id] || 0) * (d.cost[p.id] || 0)), p.ro, `<span class="pill ${status(p)[1]}">${status(p)[0]}</span>`]))
        : table(['Date', 'Product', 'Type', 'Change', 'Output'], movements)) + '</div>';
  },
};
