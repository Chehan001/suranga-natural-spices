/** Event delegation: elements declare data-act (click) or data-change (change) + optional data-arg. */
const handlers = {};
export const register = (map) => Object.assign(handlers, map);

export function bindEvents(root = document) {
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el && handlers[el.dataset.act]) handlers[el.dataset.act](el.dataset.arg, el, e);
  });
  root.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && handlers[el.dataset.change]) handlers[el.dataset.change](el.dataset.arg, el, e);
  });
}
