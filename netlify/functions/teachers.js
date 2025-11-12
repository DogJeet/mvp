import { ensureSchema, sql } from './db.js';
import { requireManager } from './_auth.js';

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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

  if (method === 'POST' || method === 'DELETE') {
    const auth = requireManager(event);
    if (!auth.ok) {
      return auth.response;
    }
  }

  return jsonResponse(405, { error: 'Method Not Allowed' });
}
