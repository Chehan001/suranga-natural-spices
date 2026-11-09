import { state, persist } from '../../core/store.js';
import { sum, personBalance } from '../../core/selectors.js';
import { rerender } from '../../core/router.js';
import { rs, esc } from '../../utils/format.js';
import { $ } from '../../utils/dom.js';
import { table, tabs } from '../../components/ui.js';
import { toast } from '../../components/toast.js';

export const people = {
  id: 'people', title: 'People', icon: 'users',
  render() {
    const type = state.tab.people;
    const rows = state.data.ppl.filter((p) => p.t === type).map((p) => [
      esc(p.n), esc(p.ph), esc(p.l),
      rs(sum((x) => x.who === p.n && (x.t === 'sale' || x.t === 'purchase'), (x) => x.a)),
      rs(personBalance(p)),
    ]);
    return tabs('people', [['Farmer', 'Farmers'], ['Supplier', 'Suppliers'], ['Customer', 'Customers']]) +
      `<div class="card"><h3>Add ${type.toLowerCase()}</h3><div class="g"><label>Name<input id="n-name"></label><label>Phone<input id="n-phone" type="tel"></label><label>Location<input id="n-loc"></label><button class="btn" data-act="addPerson">+ Add</button></div></div>
      <div class="card">${table(['Name', 'Phone', 'Location', 'Total business', 'Balance'], rows)}</div>`;
  },
};

export const peopleActions = {
  addPerson() {
    const name = $('#n-name').value.trim();
    if (name.length < 2) return toast('Enter a name', true);
    state.data.ppl.push({ n: name, t: state.tab.people, ph: $('#n-phone').value, l: $('#n-loc').value });
    persist(); toast('Person added'); rerender();
  },
};
