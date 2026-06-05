import { api } from '../services/apiService.js';
import { getRoom, getShow, state } from '../state/store.js';
import { closeModal, openModal, setActions, toast, view } from '../utils/dom.js';
import { escapeHtml, formatDate } from '../utils/formatters.js';
import { router } from '../router/index.js';
import { removeRecord } from './reservationsController.js';

export function renderAdminFunctions() {
  setActions(`<button class="btn" data-action="new-function">New function</button>`);
  view().innerHTML = `<div class="card table-wrap"><table><thead><tr><th>Movie</th><th>Room</th><th>Date</th><th>Capacity</th><th>Available</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.data.functions.map((show) => `<tr><td>${escapeHtml(show.movie)}</td><td>${escapeHtml(getRoom(show.roomId)?.name || 'No room')}</td><td>${formatDate(show.date)} ${show.time}</td><td>${show.capacity}</td><td>${show.available}</td><td><span class="badge ${show.status === 'Activa' ? 'success' : 'danger'}">${show.status}</span></td><td class="actions"><button class="btn small secondary" data-edit-function="${show.id}">Edit</button><button class="btn small danger" data-delete-function="${show.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>`;
  document.querySelector('[data-action="new-function"]').addEventListener('click', () => openFunctionModal());
  document.querySelectorAll('[data-edit-function]').forEach((button) => button.addEventListener('click', () => openFunctionModal(button.dataset.editFunction)));
  document.querySelectorAll('[data-delete-function]').forEach((button) => button.addEventListener('click', () => deleteFunction(button.dataset.deleteFunction)));
}

export function renderRooms() {
  setActions(`<button class="btn" data-action="new-room">New room</button>`);
  view().innerHTML = `<div class="card table-wrap"><table><thead><tr><th>Name</th><th>Capacity</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.data.rooms.map((room) => `<tr><td>${escapeHtml(room.name)}</td><td>${room.capacity}</td><td>${room.type}</td><td><span class="badge ${room.status === 'Activa' ? 'success' : 'danger'}">${room.status}</span></td><td class="actions"><button class="btn small secondary" data-edit-room="${room.id}">Edit</button><button class="btn small danger" data-delete-room="${room.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>`;
  document.querySelector('[data-action="new-room"]').addEventListener('click', () => openRoomModal());
  document.querySelectorAll('[data-edit-room]').forEach((button) => button.addEventListener('click', () => openRoomModal(button.dataset.editRoom)));
  document.querySelectorAll('[data-delete-room]').forEach((button) => button.addEventListener('click', () => deleteRoom(button.dataset.deleteRoom)));
}

export function renderUsers() {
  view().innerHTML = `<div class="card table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>${state.data.users.map((user) => `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td><span class="badge ${user.role === 'admin' ? 'warning' : 'success'}">${user.role}</span></td></tr>`).join('')}</tbody></table></div>`;
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
