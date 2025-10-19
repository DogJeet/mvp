const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

const toJsonBody = (body) => {
    if (!body || body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
        return body;
    }
    return JSON.stringify(body);
};

const request = async (path, { method = "GET", headers, body, ...rest } = {}) => {
    const init = { method, credentials: "include", ...rest };
    const nextHeaders = new Headers(headers || {});

    if (body !== undefined && !(body instanceof FormData) && !(body instanceof Blob)) {
        if (!nextHeaders.has("Content-Type")) {
            nextHeaders.set("Content-Type", "application/json");
        }
        init.body = toJsonBody(body);
    } else if (body !== undefined) {
        init.body = body;
    }

    if (nextHeaders.size > 0) {
        init.headers = nextHeaders;
    }

    const response = await fetch(`${API_BASE}${path}`, init);
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
        let message = `HTTP ${response.status}`;
        if (contentType.includes("application/json")) {
            try {
                const payload = await response.json();
                message = payload?.message || payload?.error || message;
            } catch (error) {
                console.error("Failed to parse error payload", error);
            }
        } else {
            try {
                const text = await response.text();
                if (text) message = text;
            } catch (error) {
                console.error("Failed to read error payload", error);
            }
        }
        const err = new Error(message);
        err.status = response.status;
        throw err;
    }

    if (response.status === 204) {
        return null;
    }

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response.text();
};

const nullableRequest = async (...args) => {
    try {
        return await request(...args);
    } catch (error) {
        if (error?.status === 404) {
            return null;
        }
        throw error;
    }
};

const listEvents = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.city) params.append("city", filters.city);
    if (filters.level) params.append("level", filters.level);
    if (filters.q) params.append("q", filters.q);
    const query = params.toString();
    const path = `/api/events${query ? `?${query}` : ""}`;
    return request(path);
};

const getEvent = (id) => request(`/api/events/${id}`);

const register = (eventId, payload = {}) =>
    request(`/api/events/${eventId}/register`, {
        method: "POST",
        body: payload,
    });

const createPayment = (reservationId, extra = {}) =>
    request("/api/payments", {
        method: "POST",
        body: { reservation_id: reservationId, ...extra },
    });

const joinWaitlist = (eventId, payload = {}) =>
    request(`/api/events/${eventId}/waitlist`, {
        method: "POST",
        body: payload,
    });

const getProfile = () => request("/api/player/profile");

const updateProfile = (payload) =>
    request("/api/player/profile", {
        method: "PATCH",
        body: payload,
    });

const getPlayerDashboard = async () => {
    const [dashboard, profile, notifications, payments] = await Promise.all([
        nullableRequest("/api/player/dashboard"),
        nullableRequest("/api/player/profile"),
        nullableRequest("/api/player/notifications").then((items) => items || []),
        nullableRequest("/api/player/payments").then((items) => items || []),
    ]);

    if (!dashboard && !profile) return null;

    return {
        ...(dashboard || {}),
        user: profile || dashboard?.user || null,
        notifications: notifications || dashboard?.notifications || [],
        payments: payments || dashboard?.payments || [],
    };
};

const getAdminOverview = async () => {
    const [dashboard, events, waitlist, payments, auditLog] = await Promise.all([
        nullableRequest("/api/admin/dashboard"),
        nullableRequest("/api/admin/events").then((items) => items || []),
        nullableRequest("/api/admin/waitlist").then((items) => items || []),
        nullableRequest("/api/admin/payments").then((items) => items || []),
        nullableRequest("/api/admin/audit-log").then((items) => items || []),
    ]);

    return {
        summary: dashboard?.summary || dashboard || {},
        events: events || dashboard?.events || [],
        waitlist: waitlist || dashboard?.waitlist || [],
        payments: payments || dashboard?.payments || [],
        auditLog: auditLog || dashboard?.auditLog || [],
    };
};

const exportRegistrations = () =>
    request("/api/admin/events/export", {
        headers: { Accept: "text/csv" },
    });

const api = {
    listEvents,
    getEvent,
    register,
    createPayment,
    joinWaitlist,
    getProfile,
    updateProfile,
    getPlayerDashboard,
    getAdminOverview,
    exportRegistrations,
};

export default api;
