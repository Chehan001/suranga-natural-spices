import { state, persist } from '../../core/store.js';
import { money, recentLedger, ledgerKind } from '../../core/selectors.js';
import { rerender } from '../../core/router.js';
import { rs, esc, today } from '../../utils/format.js';
import { $ } from '../../utils/dom.js';
import { kpi, table, options } from '../../components/ui.js';
import { toast } from '../../components/toast.js';

const CATEGORIES = ['Fuel', 'Transport', 'Labor', 'Electricity', 'Rent', 'Packaging', 'Other'];

export const moneyRoute = {
  id: 'money', title: 'Money', icon: 'wallet',
  render() {
    const m = money();
    return `<div class="kp">${kpi('Cash in hand', rs(m.cash), 'c1')}${kpi('Money received', rs(m.cashIn), 'c3')}${kpi('Money paid', rs(m.cashOut), 'c4')}${kpi('Owed to you / you owe', rs(m.receivable) + ' / ' + rs(m.payable), 'c2')}</div>
    <div class="cols">
      <div class="card"><h3>Record payment</h3><div class="g">
        <label>Direction<select id="m-dir"><option value="payin">Money received (from customer)</option><option value="payout">Money paid (to supplier / farmer)</option></select></label>
        <label>Person<select id="m-who">${options(state.data.ppl.map((p) => [p.n, p.n]))}</select></label>
        <label>Amount (Rs.)<input id="m-amt" type="number" min="0"></label></div>
        <button class="btn" data-act="savePayment">Save payment</button></div>
      <div class="card"><h3>Record expense</h3><div class="g">
        <label>Category<select id="e-cat">${options(CATEGORIES.map((x) => [x, x]))}</select></label>
        <label>Amount (Rs.)<input id="e-amt" type="number" min="0"></label></div>
        <button class="btn" data-act="saveExpense">Save expense</button></div>
    </div>
    <div class="card"><h3>Recent transactions</h3>${table(['Date', 'Source', 'Type', 'Amount'],
      recentLedger(12).map((x) => { const k = ledgerKind(x); return [x.d, esc(x.who || '—'), `<span class="pill ${k[0].toLowerCase()}">${k[0]}</span> ${k[1]}`, rs(x.pd ?? x.a)]; }))}</div>`;
  },
};

export const moneyActions = {
  savePayment() {
    const amount = +$('#m-amt').value, who = $('#m-who').value;
    if (!who) return toast('Add a person in People first', true);
    if (!(amount > 0)) return toast('Enter an amount', true);
    state.data.tx.push({ d: today(), t: $('#m-dir').value, who, a: amount, pd: amount });
    if (!persist()) return toast('Could not save the payment. No changes were saved.', true);
    toast('Payment recorded'); rerender();
  },
  saveExpense() {
    const amount = +$('#e-amt').value;
    if (!(amount > 0)) return toast('Enter an amount', true);
    state.data.tx.push({ d: today(), t: 'expense', who: $('#e-cat').value, a: amount, pd: amount });
    if (!persist()) return toast('Could not save the expense. No changes were saved.', true);
    toast('Expense recorded'); rerender();
  },
};
