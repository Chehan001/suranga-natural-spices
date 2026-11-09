import { esc } from '../utils/format.js';
import { state } from '../core/store.js';

export const kpi = (label, value, color) => `<div class="kpi ${color}"><small>${label}</small><b>${value}</b></div>`;

export const table = (headers, rows) =>
  '<div class="tw"><table><tr>' + headers.map((h) => `<th>${h}</th>`).join('') + '</tr>' +
  (rows.length
    ? rows.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('')
    : `<tr><td colspan="${headers.length}">No records yet</td></tr>`) +
  '</table></div>';

export const tabs = (key, list) =>
  '<div class="tabs" role="tablist">' +
  list.map(([v, t]) => `<button role="tab" class="${state.tab[key] === v ? 'on' : ''}" data-act="setTab" data-arg="${key}:${v}">${t}</button>`).join('') +
  '</div>';

export const options = (pairs) => pairs.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
export const productOptions = () => options(state.data.prod.map((p) => [p.id, p.n]));
