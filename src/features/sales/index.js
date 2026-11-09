import { state } from '../../core/store.js';
import { tabs } from '../../components/ui.js';
import { txForm, drawCart, history } from '../trade/trade.js';

export const sales = {
  id: 'sales', title: 'Sell Products', icon: 'cart',
  render() {
    return tabs('sales', [['new', 'New Sale'], ['hist', 'Sales History']]) +
      (state.tab.sales === 'new' ? txForm('sale') : `<div class="card">${history('sale')}</div>`);
  },
  mount() { if (state.tab.sales === 'new') drawCart('sale'); },
};
