# Cine Reservas SPA

## Description

Cine Reservas SPA is a Vite + Vanilla JavaScript web application for a cinema chain that needs to manage movie functions and ticket reservations. It implements authentication, role-based permissions, protected routes, session persistence, CRUD operations and a simulated REST API with `json-server`.

## Technologies used

- Vite
- Vanilla JavaScript with ES modules
- HTML5 and CSS3
- Fetch API
- Hash based SPA routing
- localStorage and sessionStorage
- json-server

## Installation

```bash
npm install
```

## Running the project

Start the web application:

```bash
npm run dev
```

The Vite app runs at the URL printed by the terminal, normally `http://localhost:5173`.

## Running json-server

In another terminal, run:

```bash
npm run api
```

The REST API runs at `http://localhost:3000` and reads data from `db.json`.

You can also run the API and Vite together with:

```bash
npm start
```

## Test users

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@cine.com` | `admin123` |
| User | `ana@cine.com` | `user123` |
| User | `luis@cine.com` | `user123` |

## Project structure

```text
.
├── db.json                 # json-server seed data
├── index.html              # Vite entry HTML
├── package.json            # scripts and dependencies
├── src/
│   ├── config.js           # Shared constants such as API and storage keys
│   ├── main.js             # Application bootstrap
│   ├── controllers/        # Screen rendering and user-action handlers
│   ├── router/             # Route table and hash router guard
│   ├── services/           # API, session and theme persistence services
│   ├── state/              # Global store and domain selectors
│   ├── utils/              # DOM helpers, modal/toast utilities and formatters
│   └── styles.css          # responsive UI, dashboard, modal, table and dark mode styles
└── README.md
```

## Role permissions

### Admin

- View all reservations.
- Create, edit and delete cinema functions.
- Approve, cancel, edit and delete any reservation.
- Manage rooms.
- View registered users.
- View dashboard occupation statistics.

### User

- View the available billboard.
- Create reservations for active functions with available seats.
- View only their own reservations.
- Edit or cancel active personal reservations before the function starts.
- Cannot access administrative routes, functions, rooms, users or other users' reservations.

## Technical decisions

- The app uses hash routing because it works in static hosting without server rewrite rules.
- Route guards are centralized in `src/router/routes.js` and validate the authenticated user's role before rendering a view.
- Controllers, services, router, state and utilities are split into folders so each module has a focused responsibility.
- Session persistence supports both `localStorage` and `sessionStorage`; the login form lets the user choose persistent or browser-session storage.
- All CRUD operations are performed with the Fetch API against json-server endpoints.
- Seat availability is updated when reservations are created, edited or canceled to avoid overselling.
- The UI includes optional enhancements from the brief: dashboard statistics, dark mode, search, date/status filters and toast notifications.

## API resources

- `/users`
- `/rooms`
- `/functions`
- `/reservations`
