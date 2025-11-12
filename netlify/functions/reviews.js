import { createHmac, timingSafeEqual } from 'node:crypto';
import { ensureSchema, sql } from './db.js';

const TELEGRAM_WEBAPP_SECRET = process.env.TELEGRAM_WEBAPP_SECRET;
const HMAC_SECRET = process.env.HMAC_SECRET;

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const parseJsonBody = (body) => {
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error('invalid_json');
  }
};

const buildDataCheckString = (params) => {
  const entries = Object.entries(params)
    .filter(([key]) => key !== 'hash')
    .map(([key, value]) => `${key}=${value}`)
    .sort();

  return entries.join('\n');
};

const verifyInitData = (initData) => {
  if (!TELEGRAM_WEBAPP_SECRET) {
    throw new Error('missing_telegram_secret');
  }

  const params = Object.fromEntries(new URLSearchParams(initData));
  const hash = params.hash;

  if (!hash) {
    throw new Error('missing_hash');
  }

  const dataCheckString = buildDataCheckString(params);

  const hmac = createHmac('sha256', TELEGRAM_WEBAPP_SECRET);
  hmac.update(dataCheckString);
  const calculatedHashHex = hmac.digest('hex');

  const received = Buffer.from(hash, 'hex');
  const calculated = Buffer.from(calculatedHashHex, 'hex');

  if (received.length !== calculated.length || !timingSafeEqual(received, calculated)) {
    throw new Error('invalid_hash');
  }

  const userPayload = params.user;
  if (!userPayload) {
    throw new Error('missing_user');
  }

  try {
    const user = JSON.parse(userPayload);
    if (!user || typeof user.id !== 'number') {
      throw new Error('invalid_user');
    }
    return user;
  } catch {
    throw new Error('invalid_user');
  }
};

const createUserHash = (userId) => {
  if (!HMAC_SECRET) {
    throw new Error('missing_hmac_secret');
  }

  return createHmac('sha256', HMAC_SECRET).update(String(userId)).digest('hex');
};

const validatePayload = ({ teacher_id, rating, comment, initData }) => {
  if (!Number.isInteger(teacher_id) || teacher_id <= 0) {
    return 'Некорректный идентификатор преподавателя';
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'Оценка должна быть числом от 1 до 5';
  }

  if (typeof comment !== 'string') {
    return 'Комментарий обязателен';
  }

  const trimmedComment = comment.trim();
  if (trimmedComment.length < 10 || trimmedComment.length > 800) {
    return 'Комментарий должен содержать от 10 до 800 символов';
  }

  if (typeof initData !== 'string' || !initData.trim()) {
    return 'initData обязателен';
  }

  return null;
};

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    await ensureSchema();

    const bodyString = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body;

    const payload = parseJsonBody(bodyString);
    const validationError = validatePayload(payload);

    if (validationError) {
      return jsonResponse(400, { error: validationError });
    }

    const { teacher_id, rating, comment, initData } = payload;
    const telegramUser = verifyInitData(initData);
    const userHash = createUserHash(telegramUser.id);

    const teacher = await sql`SELECT id FROM teachers WHERE id = ${teacher_id} LIMIT 1`;
    if (teacher.length === 0) {
      return jsonResponse(400, { error: 'Преподаватель не найден' });
    }

    const existing = await sql`
      SELECT id FROM reviews WHERE user_hash = ${userHash} AND teacher_id = ${teacher_id} LIMIT 1
    `;

    if (existing.length > 0) {
      return jsonResponse(409, { error: 'Вы уже оставили отзыв для этого преподавателя' });
    }

    await sql`
      INSERT INTO reviews (teacher_id, user_hash, rating, comment)
      VALUES (${teacher_id}, ${userHash}, ${rating}, ${comment.trim()})
    `;

    await sql`
      UPDATE teachers SET
        avg_rating = COALESCE((SELECT AVG(rating)::real FROM reviews WHERE teacher_id = ${teacher_id}), 0),
        reviews_count = COALESCE((SELECT COUNT(*) FROM reviews WHERE teacher_id = ${teacher_id}), 0)
      WHERE id = ${teacher_id}
    `;

    return jsonResponse(201, { status: 'created' });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'invalid_json':
          return jsonResponse(400, { error: 'Некорректный JSON' });
        case 'missing_telegram_secret':
        case 'missing_hmac_secret':
          return jsonResponse(500, { error: 'Сервер не настроен' });
        case 'missing_hash':
        case 'invalid_hash':
        case 'missing_user':
        case 'invalid_user':
          return jsonResponse(401, { error: 'Не удалось подтвердить пользователя' });
        default:
          break;
      }
    }

    console.error('Failed to create review', error);
    return jsonResponse(500, { error: 'Не удалось сохранить отзыв' });
  }
}
