import { filteredShows, getRoom, resetFilters, state } from '../state/store.js';
import { setActions, view } from '../utils/dom.js';
import { escapeHtml, formatDate } from '../utils/formatters.js';
import { openReservationModal } from './reservationsController.js';

export function renderShows() {
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
  document.querySelector('[data-action="clear-filters"]')?.addEventListener('click', () => { resetFilters(); renderShows(); });
}

function showCard(show) {
  const room = getRoom(show.roomId);
  const isBookable = show.status === 'Activa' && Number(show.available) > 0;
  return `<article class="card"><span class="badge ${show.status === 'Activa' ? 'success' : 'danger'}">${show.status}</span><h3>${escapeHtml(show.movie)}</h3><p class="muted">${formatDate(show.date)} · ${show.time}<br>${room?.name || 'No room'} · ${room?.type || ''}</p><p><strong>${show.available}</strong> seats available of ${show.capacity}</p><button class="btn" data-book="${show.id}" ${isBookable ? '' : 'disabled'}>${isBookable ? 'Reserve tickets' : 'Unavailable'}</button></article>`;
}

function bindFilters(callback) {
  ['search', 'date', 'status'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', (event) => { state.filters[id] = event.target.value; callback(); }));
}
