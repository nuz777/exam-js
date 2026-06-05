import { state } from '../state/store.js';
import { app } from '../utils/dom.js';
import { routes } from '../router/routes.js';
import { clearSession } from './authController.js';
import { toggleTheme } from '../services/themeService.js';

export function renderShell(currentHash, route) {
  const navLinks = Object.entries(routes)
    .filter(([, item]) => item.roles.includes(state.user.role))
    .map(([hash, item]) => `<a class="${hash === currentHash ? 'active' : ''}" href="${hash}">${item.label}</a>`).join('');

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><span class="logo">🎬</span><span>Cine Reservas</span></div>
        <nav class="nav">${navLinks}</nav>
        <div class="user-card">
          <strong>${state.user.name}</strong><br><span class="badge ${state.user.role === 'admin' ? 'warning' : 'success'}">${state.user.role}</span>
          <p class="muted">${state.user.email}</p>
          <button class="btn secondary small" data-action="theme">Toggle theme</button>
          <button class="btn danger small" data-action="logout">Logout</button>
        </div>
      </aside>
      <main class="main">
        <header class="topbar"><div><span class="badge">${route.label}</span><h1>${route.label}</h1></div><div class="actions" id="page-actions"></div></header>
        <section id="view"></section>
      </main>
    </div>`;
  document.querySelector('[data-action="logout"]').addEventListener('click', clearSession);
  document.querySelector('[data-action="theme"]').addEventListener('click', toggleTheme);
  route.render();
}
