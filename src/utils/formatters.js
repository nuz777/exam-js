export function hasStarted(show) {
  return show ? new Date(`${show.date}T${show.time}`) <= new Date() : true;
}

export function statusClass(status) {
  return status === 'Confirmada' ? 'success' : status === 'Cancelada' ? 'danger' : 'warning';
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
