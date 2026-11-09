import { $ } from '../utils/dom.js';

let timer;
export function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.className = isError ? 'err' : '';
  el.style.display = 'block';
  clearTimeout(timer);
  timer = setTimeout(() => (el.style.display = 'none'), 3200);
}
