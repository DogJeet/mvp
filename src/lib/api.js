const rawBaseUrl = process.env.REACT_APP_API_BASE_URL;
const defaultBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000';
const API_BASE_URL = (rawBaseUrl && rawBaseUrl.trim().length > 0 ? rawBaseUrl : defaultBaseUrl).replace(/\/$/, '');

const toQueryString = (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.append(key, value);
    });
    const rendered = query.toString();
    return rendered ? `?${rendered}` : '';
};

const request = async (path, options = {}) => {
    const { method = 'GET', headers = {}, body, parse = 'json' } = options;
    const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const requestHeaders = { Accept: 'application/json', ...headers };
    const init = { method, headers: requestHeaders };

    if (body !== undefined) {
        if (typeof body === 'string') {
            init.body = body;
        } else {
            init.body = JSON.stringify(body);
            init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json';
        }
    }

    const response = await fetch(url, init);

    if (!response.ok) {
        let message;
        const contentType = response.headers.get('content-type') || '';
        try {
            if (contentType.includes('application/json')) {
                const errorPayload = await response.json();
                message = errorPayload?.message || errorPayload?.error;
            } else {
                message = await response.text();
            }
        } catch (error) {
            message = response.statusText || 'Request failed';
        }
        throw new Error(message || `Request failed with status ${response.status}`);
    }

    if (parse === 'text') {
        return response.text();
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
};

const api = {
    async listEvents(filters = {}) {
        const query = toQueryString({
            city: filters.city,
            level: filters.level,
            q: filters.q,
        });
        return request(`/api/events${query}`);
    },
    async getEvent(id) {
        if (!id) throw new Error('Event id is required');
        return request(`/api/events/${encodeURIComponent(id)}`);
    },
    async register(eventId, payload = {}) {
        if (!eventId) throw new Error('Event id is required');
        return request(`/api/events/${encodeURIComponent(eventId)}/register`, {
            method: 'POST',
            body: { payload },
        });
    },
    async createPayment(reservationId) {
        if (!reservationId) throw new Error('Reservation id is required');
        return request(`/api/reservations/${encodeURIComponent(reservationId)}/payments`, {
            method: 'POST',
        });
    },
    async joinWaitlist(eventId, payload = {}) {
        if (!eventId) throw new Error('Event id is required');
        return request(`/api/events/${encodeURIComponent(eventId)}/waitlist`, {
            method: 'POST',
            body: { payload },
        });
    },
    async getPlayerDashboard(userId) {
        const query = toQueryString({ user_id: userId });
        return request(`/api/dashboards/player${query}`);
    },
    async getAdminOverview() {
        return request('/api/dashboards/admin');
    },
    async exportRegistrations() {
        return request('/api/exports/registrations', {
            headers: { Accept: 'text/csv' },
            parse: 'text',
        });
    },
};

export default api;
