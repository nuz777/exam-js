import { renderApiUnavailable, renderLogin } from '../controllers/authController.js';
import { renderShell } from '../controllers/layoutController.js';
import { loadData } from '../services/apiService.js';
import { state } from '../state/store.js';
import { toast } from '../utils/dom.js';
import { routes } from './routes.js';

export async function router() {
  if (!state.user) {
    renderLogin();
    return;
  }
  const hash = location.hash && location.hash !== '#/login' ? location.hash : '#/';
  const route = routes[hash] || routes['#/'];
  if (!route.roles.includes(state.user.role)) {
    toast('Route protected by role guard.', 'error');
    location.hash = '#/';
    return;
  }
  try {
    await loadData();
    renderShell(hash, route);
  } catch (error) {
    renderApiUnavailable(error);
  }
}

export function initRouter() {
  window.addEventListener('hashchange', router);
  router();
}
