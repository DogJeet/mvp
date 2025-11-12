import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

const ADMIN_PASSPHRASE_HASH = process.env.ADMIN_PASSPHRASE_HASH;
const HMAC_SECRET = process.env.HMAC_SECRET;
const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || '__mgr';
const ADMIN_TTL_MIN = Number.parseInt(process.env.ADMIN_TTL_MIN || '30', 10);
const ADMIN_COOKIE_DOMAIN = process.env.ADMIN_COOKIE_DOMAIN;

const textResponse = (status, message, extraHeaders = {}) =>
  new Response(message, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });

const jsonResponse = (status, payload, extraHeaders = {}) =>
  textResponse(status, JSON.stringify(payload), extraHeaders);

const parseBody = (event) => {
  if (!event.body) {
    return {};
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('invalid_json');
  }
};

const base64UrlEncode = (value) =>
  Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const createJwt = (payload) => {
  if (!HMAC_SECRET) {
    throw new Error('missing_hmac_secret');
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const segments = [base64UrlEncode(header), base64UrlEncode(payload)];
  const signingInput = segments.join('.');
  const signature = createHmac('sha256', HMAC_SECRET)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signingInput}.${signature}`;
};

const hashUserAgent = (ua) => {
  if (!HMAC_SECRET) {
    throw new Error('missing_hmac_secret');
  }

  return createHmac('sha256', HMAC_SECRET).update(ua || '').digest('hex');
};

const parseScryptHash = (hashString) => {
  const parts = hashString.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    throw new Error('unsupported_hash');
  }

  const [_, n, r, p, saltB64, keyB64] = parts;
  const N = Number.parseInt(n, 10);
  const rNum = Number.parseInt(r, 10);
  const pNum = Number.parseInt(p, 10);

  if (!Number.isInteger(N) || !Number.isInteger(rNum) || !Number.isInteger(pNum)) {
    throw new Error('invalid_scrypt_params');
  }

  return {
    N,
    r: rNum,
    p: pNum,
    salt: Buffer.from(saltB64, 'base64'),
    key: Buffer.from(keyB64, 'base64'),
  };
};

const verifyScrypt = (passphrase) => {
  const { N, r, p, salt, key } = parseScryptHash(ADMIN_PASSPHRASE_HASH);
  const derived = scryptSync(passphrase, salt, key.length, { N, r, p });
  return timingSafeEqual(derived, key);
};

const verifyPassphrase = async (passphrase) => {
  if (!ADMIN_PASSPHRASE_HASH) {
    throw new Error('missing_admin_hash');
  }

  if (ADMIN_PASSPHRASE_HASH.startsWith('$argon2')) {
    const { verify } = await import('argon2');
    return verify(ADMIN_PASSPHRASE_HASH, passphrase);
  }

  if (ADMIN_PASSPHRASE_HASH.startsWith('scrypt$')) {
    return verifyScrypt(passphrase);
  }

  throw new Error('unsupported_hash');
};

const buildCookie = (jwt, ttlSeconds) => {
  if (!ADMIN_COOKIE_DOMAIN) {
    throw new Error('missing_cookie_domain');
  }

  const directives = [
    `${ADMIN_COOKIE_NAME}=${jwt}`,
    `Max-Age=${ttlSeconds}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Domain=${ADMIN_COOKIE_DOMAIN}`,
  ];

  return directives.join('; ');
};

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    const { passphrase, ua } = parseBody(event);

    if (typeof passphrase !== 'string' || passphrase.length === 0) {
      return jsonResponse(400, { error: 'Passphrase required' });
    }

    const isValid = await verifyPassphrase(passphrase);

    if (!isValid) {
      return jsonResponse(401, { error: 'Invalid credentials' });
    }

    const now = Math.floor(Date.now() / 1000);
    const ttlMinutes = Number.isFinite(ADMIN_TTL_MIN) && ADMIN_TTL_MIN > 0 ? ADMIN_TTL_MIN : 30;
    const ttlSeconds = Math.round(ttlMinutes * 60);

    const payload = {
      role: 'manager',
      ua_hash: hashUserAgent(typeof ua === 'string' ? ua : ''),
      iat: now,
      exp: now + ttlSeconds,
    };

    const jwt = createJwt(payload);

    return new Response(null, {
      status: 204,
      headers: {
        'Set-Cookie': buildCookie(jwt, ttlSeconds),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'invalid_json') {
        return jsonResponse(400, { error: 'Invalid JSON' });
      }

      if (error.message === 'missing_admin_hash' || error.message === 'missing_hmac_secret' || error.message === 'missing_cookie_domain') {
        console.error('Admin login misconfiguration:', error.message);
        return jsonResponse(500, { error: 'Server misconfigured' });
      }

      if (error.message === 'unsupported_hash' || error.message === 'invalid_scrypt_params') {
        console.error('Unsupported admin hash format');
        return jsonResponse(500, { error: 'Server misconfigured' });
      }
    }

    console.error('Admin login failed');
    return jsonResponse(401, { error: 'Invalid credentials' });
  }
}
