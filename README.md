# Tournament Front-end

This project implements the user- and admin-facing front-end for a tournament registration platform. It was bootstrapped with Create React App but now expects a live backend that exposes a set of REST endpoints for players, administrators, events, payments, and waitlists.

## Features
- Event catalogue with search filters, event details, and registration/waitlist flows.
- Player profile management stored on the backend and reused for registrations.
- Player dashboard showing upcoming registrations, notifications, and payment history.
- Admin overview gated by administrator role with visibility into events, waitlists, payments, and audit logs.

## Prerequisites
- Node.js 18+
- npm 9+

## Environment variables
The application reads the backend base URL from `VITE_API_BASE_URL`. Create a `.env` file (or set the variable in your shell) before running the app:

```bash
VITE_API_BASE_URL="https://your-backend.example.com"
```

If omitted, the frontend will issue requests relative to the current origin.

## Development
```bash
npm install
npm start
```

The development server runs on [http://localhost:3000](http://localhost:3000) and will proxy API calls to the URL configured in `VITE_API_BASE_URL` (or to the same origin if you are serving the backend on `localhost:3000`).

## Production build
```bash
npm run build
```

The build output is emitted into the `build/` directory and can be served by any static file host.

## API contract
The frontend consumes the following endpoints. Responses should be JSON unless stated otherwise and all endpoints are expected to require authentication via cookie-based session.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/player/profile` | Returns the logged-in user's profile (name, phone, email, level, role/roles, notes). |
| PATCH | `/api/player/profile` | Updates the profile with the same fields returned by the GET endpoint. |
| GET | `/api/events` | Lists events; accepts optional `city`, `level`, and `q` query params. |
| GET | `/api/events/{id}` | Returns full details for a single event. |
| POST | `/api/events/{id}/register` | Registers the current player for the event, returning the reservation/registration record. |
| POST | `/api/events/{id}/waitlist` | Adds the player to the event waitlist. |
| POST | `/api/payments` | Creates a payment intent for a reservation. Returns payment reference/status. |
| GET | `/api/player/dashboard` | Returns the player's dashboard data (upcoming registrations, stats, etc.). |
| GET | `/api/player/notifications` | Returns an array of user-facing notifications. Optional; empty array if none. |
| GET | `/api/player/payments` | Returns payment history for the user. Optional; empty array if none. |
| GET | `/api/admin/dashboard` | Returns aggregated metrics for admins. Requires administrator role. |
| GET | `/api/admin/events` | Returns enriched event list for admins. Requires administrator role. |
| GET | `/api/admin/waitlist` | Returns waitlisted entries. Requires administrator role. |
| GET | `/api/admin/payments` | Returns payments requiring admin attention. Requires administrator role. |
| GET | `/api/admin/audit-log` | Returns recent administrative actions. Requires administrator role. |
| GET | `/api/admin/events/export` | Returns a CSV export of registrations (respond with `text/csv`). |

For implementation guidance, see [docs/backend-guide.md](docs/backend-guide.md).
