import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import { refreshProducts, state } from './core/store.js';
import { register, bindEvents } from './core/events.js';
import { startRouter, rerender } from './core/router.js';
import { closeNav, toggleNav } from './components/sidebar.js';
import { startDateDisplay } from './components/dateDisplay.js';
import { icon } from './components/icons.js';
import { $ } from './utils/dom.js';
import { routes, featureActions } from './features/index.js';
import { api } from './services/api.js';
import { toast } from './components/toast.js';
import { applyTheme, getInitialTheme, setTheme } from './core/theme.js';

let currentTheme = getInitialTheme();
applyTheme(currentTheme);
const themeToggle = $('#theme-toggle');
const updateThemeToggle = () => {
  themeToggle.innerHTML = icon(currentTheme === 'dark' ? 'moon' : 'sun', 20);
  themeToggle.setAttribute('aria-label', `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`);
  themeToggle.setAttribute('aria-pressed', String(currentTheme === 'dark'));
  themeToggle.title = `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`;
};

register({
  ...featureActions,
  toggleNav,
  closeNav,
  toggleTheme() {
    currentTheme = setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    updateThemeToggle();
  },
  setTab(arg) {
    const [key, value] = arg.split(':');
    state.tab[key] = value;
    rerender();
  },
});

$('#menu-btn').innerHTML = icon('menu', 22);
updateThemeToggle();
let stopDateDisplay = startDateDisplay();
addEventListener('pagehide', () => stopDateDisplay());
addEventListener('pageshow', (event) => {
  if (event.persisted) stopDateDisplay = startDateDisplay();
});
bindEvents(document);
startRouter(routes);

if (api.getLoadError()) toast(api.getLoadError(), true);

refreshProducts().then((ok) => {
  if (!ok && state.products.error) toast(state.products.error, true);
  rerender();
});

const apiStatus = $('#api-status');
api.checkConnection()
  .then(() => {
    apiStatus.textContent = 'API online';
    apiStatus.dataset.state = 'connected';
    apiStatus.title = 'Connected to the backend API';
  })
  .catch((error) => {
    console.error('Backend API health check failed.', error);
    apiStatus.textContent = 'API offline';
    apiStatus.dataset.state = 'disconnected';
    apiStatus.title = 'Backend API is unavailable. Check that the backend is running.';
  });
