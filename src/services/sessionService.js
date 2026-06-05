import { SESSION_KEY } from '../config.js';

export function getStoredSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null');
}

export function persistSession(user, persistent) {
  const cleanUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (persistent ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(cleanUser));
  return cleanUser;
}

export function removeStoredSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
