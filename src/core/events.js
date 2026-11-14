/** Event delegation: elements declare data-act (click) or data-change (change) + optional data-arg. */
const handlers = {};
export const register = (map) => Object.assign(handlers, map);

export function bindEvents(root = document) {
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el && handlers[el.dataset.act]) handlers[el.dataset.act](el.dataset.arg, el, e);
    if (!e.target.closest('.product-select__trigger') && !e.target.closest('.product-select__option')) {
      root.querySelectorAll('.product-select__menu').forEach((menu) => { menu.hidden = true; });
      root.querySelectorAll('.product-select__trigger').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    }
  });
  root.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && handlers[el.dataset.change]) handlers[el.dataset.change](el.dataset.arg, el, e);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      root.querySelectorAll('.product-select__menu').forEach((menu) => { menu.hidden = true; });
      root.querySelectorAll('.product-select__trigger').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    }
  });
}
