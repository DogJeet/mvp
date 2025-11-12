import { createHmac, timingSafeEqual } from 'node:crypto';

const HMAC_SECRET = process.env.HMAC_SECRET;
const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || '__mgr';

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const unauthorized = () => jsonResponse(401, { error: 'Unauthorized' });

const base64UrlToBuffer = (segment) => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return Buffer.from(padded, 'base64');
};

const parseCookies = (cookieHeader = '') => {
  const entries = cookieHeader.split(';').map((part) => part.trim());
  const map = new Map();

  for (const entry of entries) {
    if (!entry) continue;
    const index = entry.indexOf('=');
    if (index === -1) continue;
    const key = entry.slice(0, index);
    const value = entry.slice(index + 1);
    map.set(key, value);
  }

  return map;
};

const verifySignature = (signingInput, signature) => {
  if (!HMAC_SECRET) {
    throw new Error('missing_hmac_secret');
  }

  const expected = createHmac('sha256', HMAC_SECRET)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
};

const decodeJwtPayload = (payloadSegment) => {
  try {
    const buffer = base64UrlToBuffer(payloadSegment);
    return JSON.parse(buffer.toString('utf8'));
  } catch {
    throw new Error('invalid_jwt');
  }
};

const hashUserAgent = (ua) => {
  if (!HMAC_SECRET) {
    throw new Error('missing_hmac_secret');
  }

  return createHmac('sha256', HMAC_SECRET).update(ua || '').digest('hex');
};

export const requireManager = (event) => {
  try {
    const cookies = parseCookies(event.headers?.cookie || event.headers?.Cookie);
    const token = cookies.get(ADMIN_COOKIE_NAME);

    if (!token) {
      return { ok: false, response: unauthorized() };
    }

    const segments = token.split('.');
    if (segments.length !== 3) {
      return { ok: false, response: unauthorized() };
    }

    const [headerSegment, payloadSegment, signatureSegment] = segments;
    const signingInput = `${headerSegment}.${payloadSegment}`;

    if (!verifySignature(signingInput, signatureSegment)) {
      return { ok: false, response: unauthorized() };
    }

    const payload = decodeJwtPayload(payloadSegment);

    if (payload?.role !== 'manager') {
      return { ok: false, response: unauthorized() };
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= now) {
      return { ok: false, response: unauthorized() };
    }

    const uaHeader = event.headers?.['user-agent'] || event.headers?.['User-Agent'] || '';
    const uaHash = hashUserAgent(uaHeader);

    if (payload.ua_hash !== uaHash) {
      return { ok: false, response: unauthorized() };
    }

    return { ok: true, payload };
  } catch (error) {
    console.error('Auth middleware error', error instanceof Error ? error.message : error);
    return { ok: false, response: unauthorized() };
  }
};
