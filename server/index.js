const http = require('node:http');
const { URL } = require('node:url');
const { state, createReservation, createPayment, addToWaitlist, getPlayerDashboard, getAdminOverview, exportRegistrations } = require('./data');

const DEFAULT_PORT = parseInt(process.env.API_PORT || process.env.PORT || '4000', 10);
const DEFAULT_PLAYER_ID = 'player-1';

const clone = (value) => JSON.parse(JSON.stringify(value));

const sendJson = (res, statusCode, payload, extraHeaders = {}) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...extraHeaders,
    });
    res.end(JSON.stringify(payload));
};

const sendText = (res, statusCode, text, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) => {
    res.writeHead(statusCode, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...extraHeaders,
    });
    res.end(text);
};

const parseBody = (req) =>
    new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
            if (body.length > 1_000_000) {
                reject(new Error('Payload too large'));
                req.destroy();
            }
        });
        req.on('end', () => {
            if (!body) {
                resolve(null);
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });

const listEvents = (searchParams) => {
    const city = searchParams.get('city');
    const level = searchParams.get('level');
    const query = searchParams.get('q');

    return state.events.filter((event) => {
        if (city && event.city !== city) return false;
        if (level && event.level !== level) return false;
        if (query) {
            const needle = query.toLowerCase();
            const haystack = `${event.title} ${event.venue} ${event.city}`.toLowerCase();
            if (!haystack.includes(needle)) return false;
        }
        return true;
    });
};

const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin || '*';
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname, searchParams } = url;

    try {
        if (req.method === 'GET' && pathname === '/api/health') {
            sendJson(res, 200, { status: 'ok' });
            return;
        }

        if (req.method === 'GET' && pathname === '/api/events') {
            const events = listEvents(searchParams);
            sendJson(res, 200, clone(events));
            return;
        }

        if (req.method === 'GET' && pathname.startsWith('/api/events/')) {
            const [, , , eventId] = pathname.split('/');
            const event = state.events.find((item) => item.id === eventId);
            if (!event) {
                sendJson(res, 404, { error: 'EVENT_NOT_FOUND' });
                return;
            }
            sendJson(res, 200, clone(event));
            return;
        }

        if (req.method === 'POST' && pathname.startsWith('/api/events/') && pathname.endsWith('/register')) {
            const segments = pathname.split('/');
            const eventId = segments[3];
            const body = await parseBody(req).catch((error) => {
                sendJson(res, 400, { error: 'INVALID_JSON', message: error.message });
            });
            if (res.writableEnded) return;

            const payload = body?.payload || body || {};
            const userId = body?.user_id || DEFAULT_PLAYER_ID;
            const { reservation, registration, error } = createReservation(eventId, userId, payload);
            if (error === 'NOT_FOUND') {
                sendJson(res, 404, { error: 'EVENT_NOT_FOUND' });
                return;
            }
            if (error === 'NO_SPOTS') {
                sendJson(res, 409, { error: 'NO_SPOTS_AVAILABLE' });
                return;
            }

            sendJson(res, 201, {
                reservation_id: reservation.id,
                status: reservation.status,
                payload,
                registration,
            });
            return;
        }

        if (req.method === 'POST' && pathname.startsWith('/api/events/') && pathname.endsWith('/waitlist')) {
            const segments = pathname.split('/');
            const eventId = segments[3];
            const body = await parseBody(req).catch((error) => {
                sendJson(res, 400, { error: 'INVALID_JSON', message: error.message });
            });
            if (res.writableEnded) return;

            const payload = body?.payload || body || {};
            const userId = body?.user_id || DEFAULT_PLAYER_ID;
            const { entry, event, error } = addToWaitlist(eventId, userId, payload);
            if (error === 'NOT_FOUND') {
                sendJson(res, 404, { error: 'EVENT_NOT_FOUND' });
                return;
            }

            sendJson(res, 201, {
                ...entry,
                event_title: event.title,
                waitlist_limit: event.waitlist_limit,
            });
            return;
        }

        if (req.method === 'POST' && pathname.startsWith('/api/reservations/') && pathname.endsWith('/payments')) {
            const segments = pathname.split('/');
            const reservationId = segments[3];
            const { payment, error } = createPayment(reservationId);
            if (error === 'NOT_FOUND') {
                sendJson(res, 404, { error: 'RESERVATION_NOT_FOUND' });
                return;
            }
            sendJson(res, 201, payment);
            return;
        }

        if (req.method === 'GET' && pathname === '/api/dashboards/player') {
            const userId = searchParams.get('user_id') || DEFAULT_PLAYER_ID;
            const result = getPlayerDashboard(userId);
            if (result?.error) {
                sendJson(res, 404, { error: 'USER_NOT_FOUND' });
                return;
            }
            sendJson(res, 200, clone(result));
            return;
        }

        if (req.method === 'GET' && pathname === '/api/dashboards/admin') {
            const overview = getAdminOverview();
            sendJson(res, 200, clone(overview));
            return;
        }

        if (req.method === 'GET' && pathname === '/api/exports/registrations') {
            const csv = exportRegistrations();
            sendText(
                res,
                200,
                csv,
                'text/csv; charset=utf-8',
                {
                    'Content-Disposition': 'attachment; filename="registrations.csv"',
                },
            );
            return;
        }

        sendJson(res, 404, { error: 'NOT_FOUND' });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[API] Unhandled error', error);
        sendJson(res, 500, { error: 'INTERNAL_ERROR' });
    }
});

server.listen(DEFAULT_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API server ready on http://localhost:${DEFAULT_PORT}`);
});

module.exports = server;
