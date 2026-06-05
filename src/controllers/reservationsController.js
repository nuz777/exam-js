import { api } from '../services/apiService.js';
import { getShow, getUser, reservationsForCurrentUser, state } from '../state/store.js';
import { closeModal, openModal, toast, view } from '../utils/dom.js';
import { escapeHtml, formatDate, formatDateTime, hasStarted, statusClass } from '../utils/formatters.js';
import { router } from '../router/index.js';

export function renderMyReservations() {
  const reservations = reservationsForCurrentUser();
  view().innerHTML = renderReservationsTable(reservations, false);
  bindReservationActions();
}

export function renderAdminReservations() {
  document.querySelector('#page-actions').innerHTML = `<button class="btn secondary" data-action="refresh">Refresh</button>`;
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

export function openReservationModal(functionId, reservationId = null) {
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

async function deleteReservation(id) {
  await removeRecord(`/reservations/${id}`, 'Reservation deleted.');
}

export async function removeRecord(path, message) {
  if (!confirm('Are you sure?')) return;
  try { await api(path, { method: 'DELETE' }); toast(message, 'success'); router(); } catch (error) { toast(error.message, 'error'); }
}
