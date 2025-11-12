const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || '__mgr';
const ADMIN_COOKIE_DOMAIN = process.env.ADMIN_COOKIE_DOMAIN;

const clearCookieHeader = () => {
  if (!ADMIN_COOKIE_DOMAIN) {
    throw new Error('missing_cookie_domain');
  }

  const directives = [
    `${ADMIN_COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Domain=${ADMIN_COOKIE_DOMAIN}`,
  ];

  return directives.join('; ');
};

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    return new Response(null, {
      status: 204,
      headers: {
        'Set-Cookie': clearCookieHeader(),
      },
    });
  } catch (error) {
    console.error('Admin logout misconfiguration:', error);
    return jsonResponse(500, { error: 'Server misconfigured' });
  }
}
