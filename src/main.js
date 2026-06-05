import './styles.css';

const API_URL = 'http://localhost:3000';
const SESSION_KEY = 'cine-session';
const THEME_KEY = 'cine-theme';
const state = {
  user: getStoredSession(),
  data: { users: [], rooms: [], functions: [], reservations: [] },
  filters: { search: '', date: '', status: '', page: 1 },
};

const routes = {
  '#/': { label: 'Dashboard', roles: ['admin', 'user'], render: renderDashboard },
  '#/cartelera': { label: 'Cartelera', roles: ['admin', 'user'], render: renderShows },
  '#/mis-reservas': { label: 'Mis reservas', roles: ['user'], render: renderMyReservations },
  '#/admin/funciones': { label: 'Funciones', roles: ['admin'], render: renderAdminFunctions },
  '#/admin/reservas': { label: 'Reservas', roles: ['admin'], render: renderAdminReservations },
  '#/admin/salas': { label: 'Salas', roles: ['admin'], render: renderRooms },
  '#/usuarios': { label: 'Usuarios', roles: ['admin'], render: renderUsers },
};

const app = document.querySelector('#app');
const toastRoot = document.querySelector('#toast-root');

document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || 'light';
window.addEventListener('hashchange', router);
router();

function getStoredSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null');
}

function saveSession(user, persistent) {
  const cleanUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (persistent ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(cleanUser));
  state.user = cleanUser;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  state.user = null;
  location.hash = '#/login';
  router();
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function loadData() {
  const [users, rooms, functions, reservations] = await Promise.all([
    api('/users'), api('/rooms'), api('/functions'), api('/reservations'),
  ]);
  state.data = { users, rooms, functions, reservations };
}

async function router() {
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
    app.innerHTML = `<main class="login-page"><section class="card login-card"><div class="login-panel"><h1>API unavailable</h1><p class="muted">Run <strong>npm run api</strong> before using the SPA.</p><p>${escapeHtml(error.message)}</p><button class="btn" id="retry">Retry</button></div></section></main>`;
    document.querySelector('#retry')?.addEventListener('click', router);
  }
}

function renderLogin() {
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

async function login(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = form.get('email').trim();
  const password = form.get('password').trim();
  try {
    const users = await api(`/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    if (!users.length) throw new Error('Invalid email or password.');
    saveSession(users[0], form.get('remember') === 'on');
    toast(`Welcome ${users[0].name}`, 'success');
    location.hash = '#/';
    router();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function renderShell(currentHash, route) {
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

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
}

function renderDashboard() {
  const { reservations, functions, rooms, users } = state.data;
  const activeShows = functions.filter((show) => show.status === 'Activa');
  const confirmed = reservations.filter((reservation) => reservation.status === 'Confirmada');
  const sold = confirmed.reduce((total, reservation) => total + Number(reservation.tickets), 0);
  const capacity = functions.reduce((total, show) => total + Number(show.capacity), 0) || 1;
  const userReservations = reservationsForCurrentUser();

  view().innerHTML = `
    <section class="hero">
      <div class="card"><span class="badge success">Live system</span><h1>Modern cinema reservations</h1><p class="muted">Book tickets, protect capacity and keep administrators informed about room occupation.</p><div class="actions"><a class="btn" href="#/cartelera">Open billboard</a>${state.user.role === 'admin' ? '<a class="btn secondary" href="#/admin/reservas">Manage reservations</a>' : '<a class="btn secondary" href="#/mis-reservas">My reservations</a>'}</div></div>
      <div class="card"><h3>Occupation</h3><strong style="font-size:4rem">${Math.round((sold / capacity) * 100)}%</strong><p class="muted">${sold} confirmed tickets over ${capacity} total seats.</p></div>
    </section>
    <section class="grid cols-4">
      ${kpi('Active shows', activeShows.length)}
      ${kpi('Reservations', state.user.role === 'admin' ? reservations.length : userReservations.length)}
      ${kpi('Rooms', rooms.length)}
      ${kpi('Users', users.length)}
    </section>`;
}

function renderShows() {
  setActions(`<button class="btn secondary" data-action="clear-filters">Clear filters</button>`);
  const shows = filteredShows();
  view().innerHTML = `
    <div class="toolbar">
      <input id="search" placeholder="Search movie or room" value="${escapeHtml(state.filters.search)}" />
      <input id="date" type="date" value="${escapeHtml(state.filters.date)}" />
      <select id="status"><option value="">All states</option><option ${state.filters.status === 'Activa' ? 'selected' : ''}>Activa</option><option ${state.filters.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option></select>
    </div>
    <div class="grid cols-3">${shows.map(showCard).join('') || '<div class="empty">No shows found.</div>'}</div>`;
  bindFilters(renderShows);
  document.querySelectorAll('[data-book]').forEach((button) => button.addEventListener('click', () => openReservationModal(button.dataset.book)));
  document.querySelector('[data-action="clear-filters"]')?.addEventListener('click', () => { state.filters = { search: '', date: '', status: '', page: 1 }; renderShows(); });
}

function showCard(show) {
  const room = getRoom(show.roomId);
  const isBookable = show.status === 'Activa' && Number(show.available) > 0;
  return `<article class="card"><span class="badge ${show.status === 'Activa' ? 'success' : 'danger'}">${show.status}</span><h3>${escapeHtml(show.movie)}</h3><p class="muted">${formatDate(show.date)} · ${show.time}<br>${room?.name || 'No room'} · ${room?.type || ''}</p><p><strong>${show.available}</strong> seats available of ${show.capacity}</p><button class="btn" data-book="${show.id}" ${isBookable ? '' : 'disabled'}>${isBookable ? 'Reserve tickets' : 'Unavailable'}</button></article>`;
}

function renderMyReservations() {
  const reservations = reservationsForCurrentUser();
  view().innerHTML = renderReservationsTable(reservations, false);
  bindReservationActions();
}

function renderAdminReservations() {
  setActions(`<button class="btn secondary" data-action="refresh">Refresh</button>`);
  view().innerHTML = renderReservationsTable(state.data.reservations, true);
  bindReservationActions();
  document.querySelector('[data-action="refresh"]')?.addEventListener('click', router);
}

function renderReservationsTable(reservations, isAdmin) {
  const rows = reservations.map((reservation) => {
    const show = getShow(reservation.functionId);
    const user = getUser(reservation.userId);
    const canEdit = isAdmin || (reservation.userId === state.user.id && reservation.status !== 'Cancelada' && !hasStarted(show));
    return `<tr><td>${escapeHtml(user?.name || 'Unknown')}</td><td>${escapeHtml(show?.movie || 'Deleted show')}<br><span class="muted">${show ? `${formatDate(show.date)} ${show.time}` : ''}</span></td><td>${reservation.tickets}</td><td>${formatDateTime(reservation.reservedAt)}</td><td><span class="badge ${statusClass(reservation.status)}">${reservation.status}</span></td><td class="actions">${canEdit ? `<button class="btn small secondary" data-edit-reservation="${reservation.id}">Edit</button><button class="btn small warning" data-status="${reservation.id}:Cancelada">Cancel</button>` : ''}${isAdmin ? `<button class="btn small success" data-status="${reservation.id}:Confirmada">Approve</button><button class="btn small danger" data-delete-reservation="${reservation.id}">Delete</button>` : ''}</td></tr>`;
  }).join('');
  return `<div class="card table-wrap"><table><thead><tr><th>User</th><th>Function</th><th>Tickets</th><th>Reserved at</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty">No reservations.</td></tr>'}</tbody></table></div>`;
}

function renderAdminFunctions() {
  setActions(`<button class="btn" data-action="new-function">New function</button>`);
  view().innerHTML = `<div class="card table-wrap"><table><thead><tr><th>Movie</th><th>Room</th><th>Date</th><th>Capacity</th><th>Available</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.data.functions.map((show) => `<tr><td>${escapeHtml(show.movie)}</td><td>${escapeHtml(getRoom(show.roomId)?.name || 'No room')}</td><td>${formatDate(show.date)} ${show.time}</td><td>${show.capacity}</td><td>${show.available}</td><td><span class="badge ${show.status === 'Activa' ? 'success' : 'danger'}">${show.status}</span></td><td class="actions"><button class="btn small secondary" data-edit-function="${show.id}">Edit</button><button class="btn small danger" data-delete-function="${show.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>`;
  document.querySelector('[data-action="new-function"]').addEventListener('click', () => openFunctionModal());
  document.querySelectorAll('[data-edit-function]').forEach((button) => button.addEventListener('click', () => openFunctionModal(button.dataset.editFunction)));
  document.querySelectorAll('[data-delete-function]').forEach((button) => button.addEventListener('click', () => deleteFunction(button.dataset.deleteFunction)));
}

function renderRooms() {
  setActions(`<button class="btn" data-action="new-room">New room</button>`);
  view().innerHTML = `<div class="card table-wrap"><table><thead><tr><th>Name</th><th>Capacity</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.data.rooms.map((room) => `<tr><td>${escapeHtml(room.name)}</td><td>${room.capacity}</td><td>${room.type}</td><td><span class="badge ${room.status === 'Activa' ? 'success' : 'danger'}">${room.status}</span></td><td class="actions"><button class="btn small secondary" data-edit-room="${room.id}">Edit</button><button class="btn small danger" data-delete-room="${room.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>`;
  document.querySelector('[data-action="new-room"]').addEventListener('click', () => openRoomModal());
  document.querySelectorAll('[data-edit-room]').forEach((button) => button.addEventListener('click', () => openRoomModal(button.dataset.editRoom)));
  document.querySelectorAll('[data-delete-room]').forEach((button) => button.addEventListener('click', () => deleteRoom(button.dataset.deleteRoom)));
}

function renderUsers() {
  view().innerHTML = `<div class="card table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>${state.data.users.map((user) => `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td><span class="badge ${user.role === 'admin' ? 'warning' : 'success'}">${user.role}</span></td></tr>`).join('')}</tbody></table></div>`;
}

function openReservationModal(functionId, reservationId = null) {
  const show = getShow(functionId);
  const reservation = reservationId ? state.data.reservations.find((item) => item.id === reservationId) : null;
  openModal(`
    <h2>${reservation ? 'Edit reservation' : 'New reservation'}</h2>
    <p class="muted">${escapeHtml(show.movie)} · ${formatDate(show.date)} ${show.time}. Available seats: ${show.available}</p>
    <form id="reservation-form" class="form">
      <label>Tickets <input name="tickets" type="number" min="1" value="${reservation?.tickets || 1}" required /></label>
      ${state.user.role === 'admin' ? `<label>Status <select name="status"><option ${reservation?.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option><option ${reservation?.status === 'Confirmada' ? 'selected' : ''}>Confirmada</option><option ${reservation?.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option></select></label>` : ''}
      <button class="btn" type="submit">Save reservation</button>
    </form>`);
  document.querySelector('#reservation-form').addEventListener('submit', (event) => saveReservation(event, functionId, reservation));
}

async function saveReservation(event, functionId, reservation = null) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const show = getShow(functionId);
  const tickets = Number(form.get('tickets'));
  const previousTickets = reservation && reservation.status !== 'Cancelada' ? Number(reservation.tickets) : 0;
  const newStatus = form.get('status') || reservation?.status || 'Pendiente';
  const needsSeats = newStatus !== 'Cancelada' ? tickets - previousTickets : -previousTickets;
  if (show.status !== 'Activa') return toast('Canceled functions cannot receive reservations.', 'error');
  if (reservation?.status === 'Cancelada') return toast('Canceled reservations cannot be reactivated.', 'error');
  if (state.user.role !== 'admin' && hasStarted(show)) return toast('This function has already started.', 'error');
  if (needsSeats > Number(show.available)) return toast('Not enough available seats.', 'error');
  const payload = { userId: reservation?.userId || state.user.id, functionId, tickets, reservedAt: reservation?.reservedAt || new Date().toISOString(), status: newStatus };
  try {
    if (reservation) await api(`/reservations/${reservation.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    else await api('/reservations', { method: 'POST', body: JSON.stringify(payload) });
    await api(`/functions/${functionId}`, { method: 'PATCH', body: JSON.stringify({ available: Number(show.available) - needsSeats }) });
    closeModal();
    toast('Reservation saved.', 'success');
    router();
  } catch (error) { toast(error.message, 'error'); }
}

function openFunctionModal(functionId = null) {
  const show = functionId ? getShow(functionId) : null;
  openModal(`<h2>${show ? 'Edit function' : 'New function'}</h2><form id="function-form" class="form"><label>Movie <input name="movie" value="${escapeHtml(show?.movie || '')}" required /></label><label>Room <select name="roomId">${state.data.rooms.map((room) => `<option value="${room.id}" ${room.id === show?.roomId ? 'selected' : ''}>${escapeHtml(room.name)} (${room.capacity})</option>`).join('')}</select></label><div class="grid cols-2"><label>Date <input name="date" type="date" value="${show?.date || ''}" required /></label><label>Time <input name="time" type="time" value="${show?.time || ''}" required /></label></div><label>Capacity <input name="capacity" type="number" min="1" value="${show?.capacity || 80}" required /></label><label>Status <select name="status"><option ${show?.status === 'Activa' ? 'selected' : ''}>Activa</option><option ${show?.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option></select></label><button class="btn" type="submit">Save function</button></form>`);
  document.querySelector('#function-form').addEventListener('submit', (event) => saveFunction(event, show));
}

async function saveFunction(event, show = null) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const capacity = Number(form.get('capacity'));
  const sold = show ? show.capacity - show.available : 0;
  if (capacity < sold) return toast('Capacity cannot be lower than already reserved seats.', 'error');
  const payload = { movie: form.get('movie').trim(), roomId: form.get('roomId'), date: form.get('date'), time: form.get('time'), capacity, available: show ? capacity - sold : capacity, status: form.get('status') };
  try {
    await api(show ? `/functions/${show.id}` : '/functions', { method: show ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    closeModal(); toast('Function saved.', 'success'); router();
  } catch (error) { toast(error.message, 'error'); }
}

function openRoomModal(roomId = null) {
  const room = roomId ? getRoom(roomId) : null;
  openModal(`<h2>${room ? 'Edit room' : 'New room'}</h2><form id="room-form" class="form"><label>Name <input name="name" value="${escapeHtml(room?.name || '')}" required /></label><label>Capacity <input name="capacity" type="number" min="1" value="${room?.capacity || 80}" required /></label><label>Type <select name="type"><option ${room?.type === '2D' ? 'selected' : ''}>2D</option><option ${room?.type === '3D' ? 'selected' : ''}>3D</option><option ${room?.type === 'IMAX' ? 'selected' : ''}>IMAX</option></select></label><label>Status <select name="status"><option ${room?.status === 'Activa' ? 'selected' : ''}>Activa</option><option ${room?.status === 'Inactiva' ? 'selected' : ''}>Inactiva</option></select></label><button class="btn" type="submit">Save room</button></form>`);
  document.querySelector('#room-form').addEventListener('submit', (event) => saveRoom(event, room));
}

async function saveRoom(event, room = null) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = { name: form.get('name').trim(), capacity: Number(form.get('capacity')), type: form.get('type'), status: form.get('status') };
  try {
    await api(room ? `/rooms/${room.id}` : '/rooms', { method: room ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    closeModal(); toast('Room saved.', 'success'); router();
  } catch (error) { toast(error.message, 'error'); }
}

async function deleteFunction(id) { await removeRecord(`/functions/${id}`, 'Function deleted.'); }
async function deleteRoom(id) { await removeRecord(`/rooms/${id}`, 'Room deleted.'); }
async function deleteReservation(id) { await removeRecord(`/reservations/${id}`, 'Reservation deleted.'); }
async function removeRecord(path, message) {
  if (!confirm('Are you sure?')) return;
  try { await api(path, { method: 'DELETE' }); toast(message, 'success'); router(); } catch (error) { toast(error.message, 'error'); }
}

function bindReservationActions() {
  document.querySelectorAll('[data-edit-reservation]').forEach((button) => button.addEventListener('click', () => {
    const reservation = state.data.reservations.find((item) => item.id === button.dataset.editReservation);
    openReservationModal(reservation.functionId, reservation.id);
  }));
  document.querySelectorAll('[data-status]').forEach((button) => button.addEventListener('click', async () => {
    const [id, status] = button.dataset.status.split(':');
    await changeReservationStatus(id, status);
  }));
  document.querySelectorAll('[data-delete-reservation]').forEach((button) => button.addEventListener('click', () => deleteReservation(button.dataset.deleteReservation)));
}

async function changeReservationStatus(id, status) {
  const reservation = state.data.reservations.find((item) => item.id === id);
  const show = getShow(reservation.functionId);
  if (reservation.status === 'Cancelada' && status !== 'Cancelada') return toast('Canceled reservations cannot be reactivated.', 'error');
  const seatsDelta = reservation.status !== 'Cancelada' && status === 'Cancelada' ? Number(reservation.tickets) : 0;
  try {
    await api(`/reservations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (seatsDelta) await api(`/functions/${show.id}`, { method: 'PATCH', body: JSON.stringify({ available: Number(show.available) + seatsDelta }) });
    toast('Reservation updated.', 'success');
    router();
  } catch (error) { toast(error.message, 'error'); }
}

function openModal(content) {
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal-backdrop"><section class="card modal"><div class="actions" style="justify-content:flex-end"><button class="btn secondary small" data-close-modal>Close</button></div>${content}</section></div>`);
  document.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  document.querySelector('#modal-backdrop').addEventListener('click', (event) => { if (event.target.id === 'modal-backdrop') closeModal(); });
}
function closeModal() { document.querySelector('#modal-backdrop')?.remove(); }
function toast(message, type = '') { const node = document.createElement('div'); node.className = `toast ${type}`; node.textContent = message; toastRoot.append(node); setTimeout(() => node.remove(), 3400); }
function setActions(html = '') { document.querySelector('#page-actions').innerHTML = html; }
function view() { return document.querySelector('#view'); }
function kpi(label, value) { return `<article class="card kpi"><strong>${value}</strong><span>${label}</span></article>`; }
function getRoom(id) { return state.data.rooms.find((room) => room.id === id); }
function getShow(id) { return state.data.functions.find((show) => show.id === id); }
function getUser(id) { return state.data.users.find((user) => user.id === id); }
function reservationsForCurrentUser() { return state.data.reservations.filter((reservation) => reservation.userId === state.user.id); }
function filteredShows() {
  return state.data.functions.filter((show) => {
    const room = getRoom(show.roomId);
    const text = `${show.movie} ${room?.name || ''}`.toLowerCase();
    return (!state.filters.search || text.includes(state.filters.search.toLowerCase())) && (!state.filters.date || show.date === state.filters.date) && (!state.filters.status || show.status === state.filters.status);
  });
}
function bindFilters(callback) {
  ['search', 'date', 'status'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', (event) => { state.filters[id] = event.target.value; callback(); }));
}
function hasStarted(show) { return show ? new Date(`${show.date}T${show.time}`) <= new Date() : true; }
function statusClass(status) { return status === 'Confirmada' ? 'success' : status === 'Cancelada' ? 'danger' : 'warning'; }
function formatDate(value) { return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)); }
function formatDateTime(value) { return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function escapeHtml(value = '') { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
