import { getStoredSession } from '../services/sessionService.js';

export const state = {
  user: getStoredSession(),
  data: { users: [], rooms: [], functions: [], reservations: [] },
  filters: { search: '', date: '', status: '', page: 1 },
};

export function setUser(user) {
  state.user = user;
}

export function resetFilters() {
  state.filters = { search: '', date: '', status: '', page: 1 };
}

export function getRoom(id) {
  return state.data.rooms.find((room) => room.id === id);
}

export function getShow(id) {
  return state.data.functions.find((show) => show.id === id);
}

export function getUser(id) {
  return state.data.users.find((user) => user.id === id);
}

export function reservationsForCurrentUser() {
  return state.data.reservations.filter((reservation) => reservation.userId === state.user.id);
}

export function filteredShows() {
  return state.data.functions.filter((show) => {
    const room = getRoom(show.roomId);
    const text = `${show.movie} ${room?.name || ''}`.toLowerCase();
    return (!state.filters.search || text.includes(state.filters.search.toLowerCase())) && (!state.filters.date || show.date === state.filters.date) && (!state.filters.status || show.status === state.filters.status);
  });
}
