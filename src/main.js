import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import { state } from './core/store.js';
import { register, bindEvents } from './core/events.js';
import { startRouter, rerender } from './core/router.js';
import { toggleNav } from './components/sidebar.js';
import { icon } from './components/icons.js';
import { $ } from './utils/dom.js';
import { routes, featureActions } from './features/index.js';
import { api } from './services/api.js';
import { toast } from './components/toast.js';

register({
  ...featureActions,
  toggleNav,
  setTab(arg) {
    const [key, value] = arg.split(':');
    state.tab[key] = value;
    rerender();
  },
});

$('#menu-btn').innerHTML = icon('menu', 22);
bindEvents(document);
startRouter(routes);

if (api.getLoadError()) toast(api.getLoadError(), true);

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
