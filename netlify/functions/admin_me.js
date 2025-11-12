import { requireManager } from './_auth.js';

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function handler(event) {
  const auth = requireManager(event);
  if (!auth.ok) {
    return auth.response ?? jsonResponse(401, { error: 'Unauthorized' });
  }

  return jsonResponse(200, { role: 'manager' });
}
