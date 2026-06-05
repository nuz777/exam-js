import { renderAdminFunctions, renderRooms, renderUsers } from '../controllers/adminController.js';
import { renderDashboard } from '../controllers/dashboardController.js';
import { renderAdminReservations, renderMyReservations } from '../controllers/reservationsController.js';
import { renderShows } from '../controllers/showsController.js';

export const routes = {
  '#/': { label: 'Dashboard', roles: ['admin', 'user'], render: renderDashboard },
  '#/cartelera': { label: 'Cartelera', roles: ['admin', 'user'], render: renderShows },
  '#/mis-reservas': { label: 'Mis reservas', roles: ['user'], render: renderMyReservations },
  '#/admin/funciones': { label: 'Funciones', roles: ['admin'], render: renderAdminFunctions },
  '#/admin/reservas': { label: 'Reservas', roles: ['admin'], render: renderAdminReservations },
  '#/admin/salas': { label: 'Salas', roles: ['admin'], render: renderRooms },
  '#/usuarios': { label: 'Usuarios', roles: ['admin'], render: renderUsers },
};
