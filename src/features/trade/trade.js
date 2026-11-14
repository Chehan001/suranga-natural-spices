/** Shared purchase / sale form logic (kind = 'purchase' | 'sale'). */
import { state, persist } from '../../core/store.js';
import { productName } from '../../core/selectors.js';
import { rerender } from '../../core/router.js';
import { rs, esc, today } from '../../utils/format.js';
import { $ } from '../../utils/dom.js';
import { table, options, productOptions } from '../../components/ui.js';
import { toast } from '../../components/toast.js';

let busy = false;

export function txForm(kind) {
  const d = state.data;
  const sale = kind === 'sale';
  const people = d.ppl.filter((p) => (sale ? p.t === 'Customer' : p.t !== 'Customer')).map((p) => [p.n, p.n]);
  if (sale) people.unshift(['Walk-in', 'Walk-in customer (retail)']);
  const firstPrice = d.prod[0] ? d.prod[0].p : '';
  return `<div class="card"><h3>${sale ? 'New sale' : 'New purchase'}</h3>
  ${sale ? '<p><label style="display:inline"><input type="radio" name="ty" value="Wholesale" checked> Wholesale</label> &nbsp; <label style="display:inline"><input type="radio" name="ty" value="Retail"> Retail</label></p>' : ''}
  <div class="g"><label>${sale ? 'Customer' : 'Supplier / Farmer'}<select id="who">${options(people)}</select></label>
  <label>Date<input id="tx-date" type="date" value="${today()}"></label></div>
  <div class="g"><label>Product<select id="line-product" data-change="fillPrice">${productOptions()}</select></label>
  <label>Quantity (kg)<input id="line-qty" type="number" min="0" step="any" inputmode="decimal"></label>
  <label>Unit price (Rs.)<input id="line-price" type="number" min="0" value="${firstPrice}"></label>
  <button class="btn" data-act="addLine" data-arg="${kind}">+ Add item</button></div>
  <div id="cart"></div>
  <div class="g"><label>Amount ${sale ? 'received' : 'paid'} now (blank = in full)<input id="paid" type="number" min="0"></label></div>
  <button class="btn big" data-act="saveTx" data-arg="${kind}">Save ${sale ? 'sale' : 'purchase'} ✓</button></div>`;
}

export function drawCart(kind) {
  const el = $('#cart');
  if (!el) return;
  const cart = state.cart[kind];
  el.innerHTML =
    table(['Product', 'Qty', 'Price', 'Amount', ''], cart.map((l, i) => [
      esc(productName(l.pid)), l.q + ' kg', rs(l.p), rs(l.a),
      `<button class="btn r" aria-label="Remove item" data-act="removeLine" data-arg="${kind}:${i}">✕</button>`,
    ])) + `<p style="text-align:right"><b>Total: ${rs(cart.reduce((a, l) => a + l.a, 0))}</b></p>`;
}

export const history = (kind) =>
  table(['Date', 'Product', 'Party', 'Qty', 'Amount', 'Paid', 'Due'],
    state.data.tx.filter((x) => x.t === kind).slice().reverse()
      .map((x) => [x.d, esc(productName(x.pid)), esc(x.who), x.q + ' kg', rs(x.a), rs(x.pd), rs(x.a - x.pd)]));

export const tradeActions = {
  fillPrice(_, el) {
    const p = state.data.prod.find((x) => x.id === el.value);
    if (p) $('#line-price').value = p.p;
  },
  addLine(kind) {
    const pid = $('#line-product').value, q = +$('#line-qty').value, p = +$('#line-price').value;
    if (!pid) return toast('Add products in Settings first', true);
    if (!(Number.isFinite(q) && Number.isFinite(p) && q > 0 && p > 0)) return toast('Enter quantity and price above zero', true);
    if (!Number.isFinite(q * p)) return toast('The line amount is too large', true);
    if (kind === 'sale') {
      const used = state.cart.sale.filter((l) => l.pid === pid).reduce((a, l) => a + l.q, 0);
      const have = state.data.stock[pid] || 0;
      if (q + used > have) return toast(`Only ${have - used} kg of ${productName(pid)} available`, true);
    }
    state.cart[kind].push({ pid, q, p, a: Math.round(q * p) });
    $('#line-qty').value = '';
    drawCart(kind);
  },
  removeLine(arg) {
    const [kind, i] = arg.split(':');
    state.cart[kind].splice(+i, 1);
    drawCart(kind);
  },
  saveTx(kind) {
    if (busy) return;
    const cart = state.cart[kind];
    if (!cart.length) return toast('Add at least one item', true);
    const who = $('#who').value;
    if (!who) return toast('Add a person in People first', true);
    const d = state.data, date = $('#tx-date').value || today();
    const total = cart.reduce((a, l) => a + l.a, 0), pv = $('#paid').value;
    if (!Number.isFinite(total)) return toast('The transaction amount is too large', true);
    if (pv !== '' && (!Number.isFinite(Number(pv)) || Number(pv) < 0)) {
      return toast('Enter a valid payment amount', true);
    }
    let remaining = pv === '' ? total : Math.min(total, Math.max(0, +pv));
    const checked = document.querySelector('input[name=ty]:checked');
    busy = true;
    cart.forEach((l) => {
      const pd = Math.min(remaining, l.a);
      remaining -= pd;
      const onHand = d.stock[l.pid] || 0;
      let cg = 0;
      if (kind === 'purchase') {
        d.cost[l.pid] = Math.round((onHand * (d.cost[l.pid] || 0) + l.q * l.p) / (onHand + l.q));
        d.stock[l.pid] = onHand + l.q;
      } else {
        cg = l.q * d.cost[l.pid];
        d.stock[l.pid] = onHand - l.q;
      }
      d.tx.push({ d: date, t: kind, pid: l.pid, who, q: l.q, a: l.a, pd, cg, ty: checked ? checked.value : undefined });
    });
    if (!persist()) {
      busy = false;
      return toast('Could not save the transaction. No changes were saved.', true);
    }
    state.cart[kind] = [];
    busy = false;
    toast(`${kind === 'sale' ? 'Sale' : 'Purchase'} saved: ${rs(total)}`);
    rerender();
  },
};
