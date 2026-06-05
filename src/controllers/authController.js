import { app, toast } from '../utils/dom.js';
import { escapeHtml } from '../utils/formatters.js';
import { api } from '../services/apiService.js';
import { persistSession, removeStoredSession } from '../services/sessionService.js';
import { setUser } from '../state/store.js';
import { router } from '../router/index.js';

export function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <section class="card login-card">
        <div class="login-panel">
          <div class="brand"><span class="logo">🎬</span><span>Cine Reservas</span></div>
          <h1>Sign in</h1>
          <p class="muted">Role based cinema booking platform powered by Vite, Vanilla JS and json-server.</p>
          <form id="login-form" class="form">
            <label>Email <input name="email" type="email" value="admin@cine.com" required /></label>
            <label>Password <input name="password" type="password" value="admin123" required /></label>
            <label><span><input name="remember" type="checkbox" checked /> Keep session with localStorage</span></label>
            <button class="btn" type="submit">Login</button>
          </form>
          <p class="muted"><strong>Admin:</strong> admin@cine.com / admin123<br><strong>Users:</strong> ana@cine.com or luis@cine.com / user123</p>
        </div>
        <div class="login-art">
          <div><span class="badge">SPA challenge</span><h2>Manage shows, seats and reservations without page reloads.</h2></div>
          <p>Includes authentication, session persistence, route guards, role permissions, CRUD, dashboard, filters, dark mode and toast messages.</p>
        </div>
      </section>
    </main>`;
  document.querySelector('#login-form').addEventListener('submit', login);
}

export async function login(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = form.get('email').trim();
  const password = form.get('password').trim();
  try {
    const users = await api(`/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    if (!users.length) throw new Error('Invalid email or password.');
    const cleanUser = persistSession(users[0], form.get('remember') === 'on');
    setUser(cleanUser);
    toast(`Welcome ${users[0].name}`, 'success');
    location.hash = '#/';
    router();
  } catch (error) {
    toast(error.message, 'error');
  }
}

export function clearSession() {
  removeStoredSession();
  setUser(null);
  location.hash = '#/login';
  router();
}

export function renderApiUnavailable(error) {
  app.innerHTML = `<main class="login-page"><section class="card login-card"><div class="login-panel"><h1>API unavailable</h1><p class="muted">Run <strong>npm run api</strong> before using the SPA.</p><p>${escapeHtml(error.message)}</p><button class="btn" id="retry">Retry</button></div></section></main>`;
  document.querySelector('#retry')?.addEventListener('click', router);
}
