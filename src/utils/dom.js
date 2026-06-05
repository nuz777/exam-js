export const app = document.querySelector('#app');
export const toastRoot = document.querySelector('#toast-root');

export function view() {
  return document.querySelector('#view');
}

export function setActions(html = '') {
  document.querySelector('#page-actions').innerHTML = html;
}

export function openModal(content) {
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal-backdrop"><section class="card modal"><div class="actions" style="justify-content:flex-end"><button class="btn secondary small" data-close-modal>Close</button></div>${content}</section></div>`);
  document.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  document.querySelector('#modal-backdrop').addEventListener('click', (event) => { if (event.target.id === 'modal-backdrop') closeModal(); });
}

export function closeModal() {
  document.querySelector('#modal-backdrop')?.remove();
}

export function toast(message, type = '') {
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  toastRoot.append(node);
  setTimeout(() => node.remove(), 3400);
}
