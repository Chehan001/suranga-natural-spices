import { state } from '../../core/store.js';
import { money } from '../../core/selectors.js';
import { rs } from '../../utils/format.js';
import { tabs } from '../../components/ui.js';
import { txForm, drawCart, history } from '../trade/trade.js';

export const purchases = {
  id: 'purchases', title: 'Buy Stock', icon: 'basket',
  render() {
    const t = state.tab.purchases;
    return tabs('purchases', [['new', 'New Purchase'], ['hist', 'Purchase History'], ['pay', 'Supplier Payments']]) +
      (t === 'new' ? txForm('purchase')
        : t === 'hist' ? `<div class="card">${history('purchase')}</div>`
        : `<div class="card"><h3>Outstanding to suppliers</h3><p><b>${rs(money().payable)}</b> payable. Record a payment in <a href="#money">Money</a>.</p></div>`);
  },
  mount() { if (state.tab.purchases === 'new') drawCart('purchase'); },
};
