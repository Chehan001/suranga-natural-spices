import { icon } from './icons.js';
import { $ } from '../utils/dom.js';

export const renderSidebar = (routes, active) => {
  $('#nav').innerHTML = routes
    .map(
      (r) =>
        `<a href="#${r.id}" class="nav-link ${r.id === active ? 'is-active' : ''}" ${r.id === active ? 'aria-current="page"' : ''}>${icon(r.icon)}<span>${r.title}</span></a>`
    )
    .join('');
};
export const toggleNav = () => $('#sidebar').classList.toggle('is-open');
export const closeNav = () => $('#sidebar').classList.remove('is-open');
