import { $ } from '../utils/dom.js';
import { renderSidebar, closeNav } from '../components/sidebar.js';

let routes = [];
let activeRoute = null;

export function rerender() {
  const id = location.hash.slice(1);
  const route = routes.find((r) => r.id === id) || routes[0];
  if (activeRoute !== route) {
    if (activeRoute && activeRoute.unmount) activeRoute.unmount();
    activeRoute = route;
  }
  renderSidebar(routes, route.id);
  $('#page-title').textContent = route.title;
  $('#today').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  closeNav();
  $('#view').innerHTML = route.render();
  if (route.mount) route.mount();
}

export function startRouter(list) {
  routes = list;
  addEventListener('hashchange', rerender);
  rerender();
}
