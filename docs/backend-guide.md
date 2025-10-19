# Backend Implementation Guide

This guide walks through building a minimal backend that satisfies the API contract used by the tournament front-end. It assumes you are new to backend development and want a pragmatic, step-by-step path. The example stack below uses **Node.js**, **Express**, and **PostgreSQL**, but you can adapt the same ideas to other languages or frameworks.

## 1. Project bootstrap
1. Install dependencies:
   ```bash
   npm init -y
   npm install express cors cookie-parser pg bcrypt jsonwebtoken dotenv
   npm install -D nodemon
   ```
2. Create the following folder structure:
   ```
   backend/
     src/
       index.js
       config.js
       db.js
       middleware/
         auth.js
         error-handler.js
       routes/
         player.js
         events.js
         admin.js
         payments.js
       services/
         auth.js
         events.js
         payments.js
         dashboard.js
     prisma/ or migrations/
   ```
   You can keep the backend in a separate repository or as a sibling directory to the front-end.

## 2. Environment configuration
Create a `.env` file with database credentials and secrets:
```ini
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tournaments
JWT_SECRET=super-secret-key
SESSION_COOKIE_NAME=session
CORS_ORIGIN=http://localhost:3000
```
Use `dotenv` in `config.js` to read these values and export them for the rest of the app.

## 3. Database schema
Below is a starter schema that covers players, events, registrations, payments, and audit logs.

```sql
-- players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT,
  level TEXT,
  notes TEXT,
  roles TEXT[] DEFAULT ARRAY['player'],
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  location TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  max_players INTEGER,
  price_cents INTEGER,
  level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- waitlist table
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_reference TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- audit log
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES players(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
Use a migration tool (Prisma Migrate, Knex, or plain SQL files) to apply the schema.

## 4. Database helper (`db.js`)
```js
import pg from 'pg';
import { DATABASE_URL } from './config.js';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

export const query = (text, params) => pool.query(text, params);
```

## 5. Authentication & authorization
1. **Registration/login endpoints** (not used by the front-end yet) should hash passwords with `bcrypt` and issue JWTs or signed cookies.
2. Store the session token (e.g., JWT) in an HTTP-only cookie named after `SESSION_COOKIE_NAME`.
3. Create `middleware/auth.js`:
   ```js
   import jwt from 'jsonwebtoken';
   import { JWT_SECRET, SESSION_COOKIE_NAME } from '../config.js';

   export const requireAuth = async (req, res, next) => {
     const token = req.cookies[SESSION_COOKIE_NAME];
     if (!token) return res.status(401).json({ message: 'Unauthorized' });
     try {
       req.user = jwt.verify(token, JWT_SECRET);
       next();
     } catch (error) {
       return res.status(401).json({ message: 'Invalid session' });
     }
   };

   export const requireAdmin = (req, res, next) => {
     if (!req.user?.roles?.includes('admin')) {
       return res.status(403).json({ message: 'Forbidden' });
     }
     next();
   };
   ```
4. Apply `requireAuth` globally to the API router and `requireAdmin` for admin routes.

## 6. Core routes
Create an Express app in `src/index.js`:
```js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PORT, CORS_ORIGIN } from './config.js';
import { requireAuth } from './middleware/auth.js';
import errorHandler from './middleware/error-handler.js';
import playerRoutes from './routes/player.js';
import eventRoutes from './routes/events.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';

const app = express();

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', requireAuth); // everything below requires auth
app.use('/api/player', playerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
```

### Player routes (`routes/player.js`)
```js
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/profile', async (req, res) => {
  const { rows } = await query('SELECT id, email, phone, name, level, notes, roles FROM players WHERE id = $1', [req.user.id]);
  res.json(rows[0] ?? null);
});

router.patch('/profile', async (req, res) => {
  const { name, phone, email, level, notes } = req.body;
  const { rows } = await query(
    `UPDATE players SET name=$1, phone=$2, email=$3, level=$4, notes=$5, updated_at=now() WHERE id=$6 RETURNING id, email, phone, name, level, notes, roles`,
    [name, phone, email, level, notes, req.user.id]
  );
  res.json(rows[0]);
});

router.get('/dashboard', async (req, res) => {
  const upcoming = await query(
    `SELECT r.id, e.title, e.start_time, r.status, r.payment_status
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.player_id = $1 AND e.start_time > now()
     ORDER BY e.start_time ASC`,
    [req.user.id]
  );

  const payments = await query(
    `SELECT p.id, p.amount_cents, p.status, p.created_at
     FROM payments p
     JOIN registrations r ON r.id = p.registration_id
     WHERE r.player_id = $1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );

  res.json({
    user: (await query('SELECT id, name, roles FROM players WHERE id = $1', [req.user.id])).rows[0],
    registrations: upcoming.rows,
    payments: payments.rows,
    notifications: [],
  });
});

router.get('/notifications', (req, res) => {
  res.json([]);
});

router.get('/payments', async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.amount_cents, p.status, p.created_at
     FROM payments p
     JOIN registrations r ON r.id = p.registration_id
     WHERE r.player_id = $1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

export default router;
```

### Event routes (`routes/events.js`)
```js
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const params = [];
  const where = [];
  if (req.query.city) {
    params.push(req.query.city);
    where.push(`city = $${params.length}`);
  }
  if (req.query.level) {
    params.push(req.query.level);
    where.push(`level = $${params.length}`);
  }
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    where.push(`(LOWER(title) LIKE LOWER($${params.length}) OR LOWER(description) LIKE LOWER($${params.length}))`);
  }
  const sql = `SELECT * FROM events ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY start_time ASC`;
  const { rows } = await query(sql, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.sendStatus(404);
  res.json(rows[0]);
});

router.post('/:id/register', async (req, res) => {
  const client = await query('BEGIN');
  try {
    const registration = await query(
      `INSERT INTO registrations (player_id, event_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [req.user.id, req.params.id]
    );
    await query('COMMIT');
    res.status(201).json(registration.rows[0]);
  } catch (error) {
    await query('ROLLBACK');
    if (error.code === '23505') {
      res.status(409).json({ message: 'Already registered' });
    } else {
      throw error;
    }
  }
});

router.post('/:id/waitlist', async (req, res) => {
  const { rows } = await query(
    `INSERT INTO waitlist (player_id, event_id)
     VALUES ($1, $2)
     ON CONFLICT (player_id, event_id) DO NOTHING
     RETURNING *`,
    [req.user.id, req.params.id]
  );
  res.status(rows[0] ? 201 : 200).json(rows[0] ?? null);
});

export default router;
```

### Payment route (`routes/payments.js`)
```js
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.post('/', async (req, res) => {
  const { reservation_id, provider = 'manual' } = req.body;
  const registration = await query(
    `SELECT r.id, e.price_cents
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.id = $1 AND r.player_id = $2`,
    [reservation_id, req.user.id]
  );
  if (!registration.rows[0]) return res.status(404).json({ message: 'Reservation not found' });
  const { rows } = await query(
    `INSERT INTO payments (registration_id, provider, amount_cents, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [reservation_id, provider, registration.rows[0].price_cents]
  );
  res.status(201).json(rows[0]);
});

export default router;
```

### Admin routes (`routes/admin.js`)
```js
import { Router } from 'express';
import { query } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);

router.get('/dashboard', async (req, res) => {
  const registrations = await query('SELECT COUNT(*) FROM registrations');
  const revenue = await query("SELECT COALESCE(SUM(amount_cents),0) AS revenue FROM payments WHERE status = 'succeeded'");
  res.json({ summary: { registrations: Number(registrations.rows[0].count), revenue_cents: Number(revenue.rows[0].revenue) } });
});

router.get('/events', async (req, res) => {
  const { rows } = await query(
    `SELECT e.*, COUNT(r.id) AS registrations
     FROM events e
     LEFT JOIN registrations r ON r.event_id = e.id
     GROUP BY e.id
     ORDER BY e.start_time DESC`
  );
  res.json(rows);
});

router.get('/waitlist', async (req, res) => {
  const { rows } = await query(
    `SELECT w.*, p.name AS player_name, e.title AS event_title
     FROM waitlist w
     JOIN players p ON p.id = w.player_id
     JOIN events e ON e.id = w.event_id`
  );
  res.json(rows);
});

router.get('/payments', async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, pl.name AS player_name, e.title AS event_title
     FROM payments p
     JOIN registrations r ON r.id = p.registration_id
     JOIN players pl ON pl.id = r.player_id
     JOIN events e ON e.id = r.event_id`
  );
  res.json(rows);
});

router.get('/audit-log', async (req, res) => {
  const { rows } = await query(
    `SELECT a.*, pl.name AS admin_name
     FROM admin_audit_log a
     LEFT JOIN players pl ON pl.id = a.admin_id
     ORDER BY a.created_at DESC
     LIMIT 100`
  );
  res.json(rows);
});

router.get('/events/export', async (req, res) => {
  const { rows } = await query(
    `SELECT e.title, pl.name AS player_name, r.status, r.payment_status
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     JOIN players pl ON pl.id = r.player_id`
  );
  const header = 'Event,Player,Registration Status,Payment Status\n';
  const csv = header + rows.map(row => `${row.title},${row.player_name},${row.status},${row.payment_status}`).join('\n');
  res.header('Content-Type', 'text/csv');
  res.send(csv);
});

export default router;
```

## 7. Error handling middleware
`middleware/error-handler.js` should translate thrown errors into JSON responses:
```js
export default function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
}
```

## 8. Running the backend
```bash
npm run dev
```
Add the script to `package.json`:
```json
"scripts": {
  "dev": "nodemon src/index.js"
}
```

Start PostgreSQL (local Docker container or managed instance) and run your migrations. Then update `VITE_API_BASE_URL` in the front-end `.env` file to `http://localhost:4000` and test the flow end to end.

## 9. Next steps
- Integrate a real payment provider (Stripe) by creating payment intents in `/api/payments` and updating statuses via webhooks.
- Add email notifications when registrations are confirmed or waitlist spots open up.
- Implement rate limiting (e.g., `express-rate-limit`) to protect the API.
- Harden authentication with refresh tokens, password resets, and multi-factor auth for admins.

By following these steps you will have a functioning backend that satisfies the expectations of the front-end code in this repository.
