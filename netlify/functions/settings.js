import { ensureSchema, sql, DEFAULT_SETTINGS } from './db.js';
import { requireManager } from './_auth.js';

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const parseJsonBody = (event) => {
  if (!event.body) {
    return {};
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  try {
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    throw new Error('invalid_json');
  }
};

const ALLOWED_KEYS = ['min_comment_length', 'max_rating', 'one_review_per_teacher'];

const sanitizeSettings = (rows) => {
  const result = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    if (!row || typeof row.key !== 'string') continue;
    if (!ALLOWED_KEYS.includes(row.key)) continue;
    result[row.key] = String(row.value ?? '');
  }

  return result;
};

const validators = {
  min_comment_length: (value) => {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 800) {
      throw new Error('Минимальная длина комментария должна быть от 1 до 800 символов');
    }
    return String(parsed);
  },
  max_rating: (value) => {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
      throw new Error('Максимальная оценка должна быть числом от 1 до 10');
    }
    return String(parsed);
  },
  one_review_per_teacher: (value) => {
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === 'false') {
      return normalized;
    }
    throw new Error('Значение должно быть true или false');
  },
};

const validatePayload = (payload) => {
  const entries = Object.entries(payload || {}).filter(([key]) => ALLOWED_KEYS.includes(key));

  if (entries.length === 0) {
    throw new Error('Нет допустимых настроек для обновления');
  }

  const updates = [];

  for (const [key, value] of entries) {
    const validator = validators[key];
    if (!validator) {
      continue;
    }

    const sanitized = validator(value);
    updates.push([key, sanitized]);
  }

  return updates;
};

export async function handler(event) {
  const method = event.httpMethod || 'GET';

  try {
    await ensureSchema();
  } catch (error) {
    console.error('Failed to ensure schema', error instanceof Error ? error.message : error);
    return jsonResponse(500, { error: 'Database unavailable' });
  }

  if (method === 'GET') {
    const rows = await sql`SELECT key, value FROM settings`;
    const payload = sanitizeSettings(rows);
    return jsonResponse(200, payload);
  }

  if (method === 'PUT') {
    const auth = requireManager(event);
    if (!auth.ok) {
      return auth.response;
    }

    let payload;
    try {
      payload = parseJsonBody(event);
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid_json') {
        return jsonResponse(400, { error: 'Некорректный JSON' });
      }
      return jsonResponse(400, { error: 'Некорректные данные' });
    }

    let updates;
    try {
      updates = validatePayload(payload);
    } catch (error) {
      return jsonResponse(400, { error: error instanceof Error ? error.message : 'Некорректные данные' });
    }

    try {
      for (const [key, value] of updates) {
        // eslint-disable-next-line no-await-in-loop
        await sql`
          INSERT INTO settings (key, value)
          VALUES (${key}, ${value})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;
      }

      const rows = await sql`SELECT key, value FROM settings`;
      const responsePayload = sanitizeSettings(rows);
      return jsonResponse(200, responsePayload);
    } catch (error) {
      console.error('Failed to update settings', error instanceof Error ? error.message : error);
      return jsonResponse(500, { error: 'Не удалось сохранить настройки' });
    }
  }

  return jsonResponse(405, { error: 'Method Not Allowed' });
}
