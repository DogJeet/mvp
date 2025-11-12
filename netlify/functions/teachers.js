import { ensureSchema, sql } from './db.js';
import { requireManager } from './_auth.js';

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const parseJsonBody = (event) => {
  if (!event.body) return {};

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('invalid_json');
  }
};

const readTeacherIdFromPath = (event) => {
  const path = event.path || '';
  const match = path.match(/teachers\/(\d+)$/);
  if (!match) return null;
  const id = Number.parseInt(match[1], 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validateTeacherPayload = (payload) => {
  const fullName = typeof payload.full_name === 'string' ? payload.full_name.trim() : '';
  if (!fullName) {
    return 'Имя преподавателя обязательно';
  }

  if (fullName.length > 255) {
    return 'Имя преподавателя слишком длинное';
  }

  if (payload.subject != null && typeof payload.subject !== 'string') {
    return 'Некорректный предмет';
  }

  const subject = typeof payload.subject === 'string' ? payload.subject.trim() : null;
  if (subject && subject.length > 255) {
    return 'Название предмета слишком длинное';
  }

  return null;
};

export async function handler(event) {
  try {
    await ensureSchema();
  } catch (error) {
    console.error('Failed to ensure schema', error);
    return jsonResponse(500, { error: 'Database unavailable' });
  }

  const method = event.httpMethod || 'GET';

  if (method === 'GET') {
    const teachers = await sql`
      SELECT id, full_name, subject, avg_rating, reviews_count
      FROM teachers
      ORDER BY avg_rating DESC, reviews_count DESC;
    `;

    return jsonResponse(200, teachers);
  }

  if (method === 'POST') {
    const auth = requireManager(event);
    if (!auth.ok) {
      return auth.response;
    }

    try {
      const payload = parseJsonBody(event);
      const validationError = validateTeacherPayload(payload);
      if (validationError) {
        return jsonResponse(400, { error: validationError });
      }

      const fullName = payload.full_name.trim();
      const subject = typeof payload.subject === 'string' ? payload.subject.trim() : null;

      const inserted = await sql`
        INSERT INTO teachers (full_name, subject, avg_rating, reviews_count)
        VALUES (${fullName}, ${subject}, 0, 0)
        RETURNING id, full_name, subject, avg_rating, reviews_count
      `;

      return jsonResponse(201, inserted[0]);
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid_json') {
        return jsonResponse(400, { error: 'Некорректный JSON' });
      }

      console.error('Failed to create teacher', error);
      return jsonResponse(500, { error: 'Не удалось создать преподавателя' });
    }
  }

  if (method === 'DELETE') {
    const auth = requireManager(event);
    if (!auth.ok) {
      return auth.response;
    }

    const teacherId = readTeacherIdFromPath(event);
    if (!teacherId) {
      return jsonResponse(400, { error: 'Некорректный идентификатор преподавателя' });
    }

    try {
      await sql`DELETE FROM reviews WHERE teacher_id = ${teacherId}`;
      const result = await sql`DELETE FROM teachers WHERE id = ${teacherId} RETURNING id`;

      if (result.length === 0) {
        return jsonResponse(404, { error: 'Преподаватель не найден' });
      }

      return new Response(null, { status: 204 });
    } catch (error) {
      console.error('Failed to delete teacher', error);
      return jsonResponse(500, { error: 'Не удалось удалить преподавателя' });
    }
  }

  return jsonResponse(405, { error: 'Method Not Allowed' });
}
