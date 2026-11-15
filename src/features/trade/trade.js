/** Shared purchase / sale form logic (kind = 'purchase' | 'sale'). */
import { state, persist } from '../../core/store.js';
import { productName } from '../../core/selectors.js';
import { rerender } from '../../core/router.js';
import { rs, esc, today } from '../../utils/format.js';
import { $ } from '../../utils/dom.js';
import { table, options, renderProductSelect } from '../../components/ui.js';
import { toast } from '../../components/toast.js';

let busy = false;

export function txForm(kind) {
  const d = state.data;
  const sale = kind === 'sale';
  const people = d.ppl.filter((p) => (sale ? p.t === 'Customer' : p.t !== 'Customer')).map((p) => [p.n, p.n]);
  if (sale) people.unshift(['Walk-in', 'Walk-in customer (retail)']);
  const firstPrice = d.prod[0]?.p || '';
  return `<div class="card purchase-card">
    <div class="purchase-card-header">
      <h3>${sale ? 'New sale' : 'New purchase'}</h3>
      ${sale ? '<div class="sale-type-toggle"><label><input type="radio" name="ty" value="Wholesale" checked> <span>Wholesale</span></label><label><input type="radio" name="ty" value="Retail"> <span>Retail</span></label></div>' : ''}
    </div>
    <div class="purchase-form-grid purchase-meta-grid">
      <label class="field">${sale ? 'Customer' : 'Supplier / Farmer'}<select id="who">${options(people)}</select></label>
      <label class="field">Date<input id="tx-date" type="date" value="${today()}"></label>
    </div>
    <div class="purchase-item-row">
      <label class="field">Product${renderProductSelect({ id: 'line-product', value: '', changeHandler: 'fillPrice', products: d.prod })}</label>
      <label class="field">Quantity (kg)<input id="line-qty" type="number" min="0" step="any" inputmode="decimal"></label>
      <label class="field">Unit price (Rs.)<input id="line-price" type="number" min="0" value="${firstPrice}"></label>
      <button class="btn purchase-add-btn" type="button" data-act="addLine" data-arg="${kind}">+ Add item</button>
    </div>
    <div id="cart" class="purchase-cart"></div>
    <div class="purchase-summary-block">
      <label class="field amount-paid-field">Amount ${sale ? 'received' : 'paid'} now (blank = in full)<input id="paid" type="number" min="0"></label>
      <div class="purchase-actions">
        <button class="btn btn-secondary" type="button" data-act="cancelPurchase" data-arg="${kind}">Cancel</button>
        <button class="btn btn-primary" type="button" data-act="saveTx" data-arg="${kind}">Save ${sale ? 'sale' : 'purchase'} ✓</button>
      </div>
    </div>
  </div>`;
}

export function drawCart(kind) {
  const el = $('#cart');
  if (!el) return;
  const cart = state.cart[kind];
  const total = cart.reduce((a, l) => a + l.a, 0);
  el.innerHTML =
    '<div class="purchase-table-wrap">' +
    table(['#', 'Product', 'Qty', 'Unit Price', 'Amount', ''], cart.map((l, i) => [
      i + 1,
      esc(productName(l.pid)),
      l.q + ' kg',
      rs(l.p),
      rs(l.a),
      `<button class="btn btn-remove" aria-label="Remove item" data-act="removeLine" data-arg="${kind}:${i}">✕</button>`,
    ])) +
    '</div>' +
    `<div class="purchase-total-row"><span>Total amount</span><strong>${rs(total)}</strong></div>`;
}

export const history = (kind) =>
  table(['Date', 'Product', 'Party', 'Qty', 'Amount', 'Paid', 'Due'],
    state.data.tx.filter((x) => x.t === kind).slice().reverse()
      .map((x) => [x.d, esc(productName(x.pid)), esc(x.who), x.q + ' kg', rs(x.a), rs(x.pd), rs(x.a - x.pd)]));

export const tradeActions = {
  fillPrice(_, el) {
    const p = state.data.prod.find((x) => x.id === el.value);
    if (p) $('#line-price').value = p.p || '';
  },
  addLine(kind) {
    const pid = $('#line-product').value, q = +$('#line-qty').value, p = +$('#line-price').value;
    if (!pid) return toast('Select a product first', true);
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
  cancelPurchase(kind) {
    state.cart[kind] = [];
    rerender();
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
