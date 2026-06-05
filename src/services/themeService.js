import { THEME_KEY } from '../config.js';

export function initTheme() {
  document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || 'light';
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
}
