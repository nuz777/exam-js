import { API_URL } from '../config.js';
import { state } from '../state/store.js';

export async function api(path, options = {}) {
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

export async function loadData() {
  const [users, rooms, functions, reservations] = await Promise.all([
    api('/users'), api('/rooms'), api('/functions'), api('/reservations'),
  ]);
  state.data = { users, rooms, functions, reservations };
}
