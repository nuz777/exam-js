import { state, reservationsForCurrentUser } from '../state/store.js';
import { view } from '../utils/dom.js';

function kpi(label, value) {
  return `<article class="card kpi"><strong>${value}</strong><span>${label}</span></article>`;
}

export function renderDashboard() {
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
