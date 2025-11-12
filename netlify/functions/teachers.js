import { sql } from './db.js';

export async function handler(event) {
  const teachers = await sql`
    SELECT id, full_name, subject, avg_rating, reviews_count
    FROM teachers
    ORDER BY avg_rating DESC, reviews_count DESC;
  `;
  return new Response(JSON.stringify(teachers), {
    headers: { 'Content-Type': 'application/json' }
  });
}
