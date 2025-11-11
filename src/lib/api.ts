export type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

declare global {
    interface ImportMeta {
        readonly env?: Record<string, string | undefined>;
    }
}

type RequestBody = BodyInit | JsonBody | undefined | null;

type RequestOptions = Omit<RequestInit, "body"> & {
    body?: RequestBody;
};

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

const toJsonBody = (body: RequestBody) => {
    if (
        body === undefined ||
        body === null ||
        body instanceof FormData ||
        body instanceof Blob ||
        body instanceof ArrayBuffer
    ) {
        return body as BodyInit | null | undefined;
    }

    if (typeof body === "object") {
        return JSON.stringify(body);
    }

    return body as BodyInit;
};

type HttpError = Error & { status?: number };

export const request = async (path: string, options: RequestOptions = {}) => {
    const { method = "GET", headers, body, ...rest } = options;
    const init: RequestInit = { method, credentials: "include", ...rest };
    const nextHeaders = new Headers(headers);

    if (body !== undefined && body !== null) {
        if (!(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
            if (!nextHeaders.has("Content-Type")) {
                nextHeaders.set("Content-Type", "application/json");
            }
            init.body = toJsonBody(body);
        } else {
            init.body = body as BodyInit;
        }
    }

    if (Array.from(nextHeaders.keys()).length > 0) {
        init.headers = nextHeaders;
    }

    const response = await fetch(`${API_BASE}${path}`, init);
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
        let message = `HTTP ${response.status}`;

        if (contentType.includes("application/json")) {
            try {
                const payload = await response.json();
                if (typeof payload === "object" && payload !== null) {
                    const maybeMessage = (payload as Record<string, unknown>).message;
                    const maybeError = (payload as Record<string, unknown>).error;
                    if (typeof maybeMessage === "string") {
                        message = maybeMessage;
                    } else if (typeof maybeError === "string") {
                        message = maybeError;
                    }
                }
            } catch (error) {
                console.error("Failed to parse error payload", error);
            }
        } else {
            try {
                const text = await response.text();
                if (text) {
                    message = text;
                }
            } catch (error) {
                console.error("Failed to read error payload", error);
            }
        }

        const err: HttpError = new Error(message);
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

export const nullableRequest = async (...args: Parameters<typeof request>) => {
    try {
        return await request(...args);
    } catch (error) {
        if (typeof error === "object" && error !== null && "status" in error && (error as HttpError).status === 404) {
            return null;
        }
        throw error;
    }
};

export const listEvents = (filters: { city?: string; level?: string; q?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.city) params.append("city", filters.city);
    if (filters.level) params.append("level", filters.level);
    if (filters.q) params.append("q", filters.q);
    const query = params.toString();
    const path = `/api/events${query ? `?${query}` : ""}`;
    return request(path);
};

export const getEvent = (id: string) => request(`/api/events/${id}`);

export const register = (eventId: string, payload: JsonBody = {}) =>
    request(`/api/events/${eventId}/register`, {
        method: "POST",
        body: payload,
    });

export const createPayment = (reservationId: string, extra: Record<string, unknown> = {}) =>
    request("/api/payments", {
        method: "POST",
        body: { reservation_id: reservationId, ...extra },
    });

export const joinWaitlist = (eventId: string, payload: JsonBody = {}) =>
    request(`/api/events/${eventId}/waitlist`, {
        method: "POST",
        body: payload,
    });

export const getProfile = () => request("/api/player/profile");

export const updateProfile = (payload: JsonBody) =>
    request("/api/player/profile", {
        method: "PATCH",
        body: payload,
    });

export const getPlayerDashboard = async () => {
    const [dashboard, profile, notifications, payments] = await Promise.all([
        nullableRequest("/api/player/dashboard"),
        nullableRequest("/api/player/profile"),
        nullableRequest("/api/player/notifications").then((items) => items || []),
        nullableRequest("/api/player/payments").then((items) => items || []),
    ]);

    if (!dashboard && !profile) return null;

    return {
        ...(dashboard || {}),
        user: profile || (dashboard as Record<string, unknown> | null)?.user || null,
        notifications: notifications || (dashboard as Record<string, unknown> | null)?.notifications || [],
        payments: payments || (dashboard as Record<string, unknown> | null)?.payments || [],
    };
};

export const getAdminOverview = async () => {
    const [dashboard, events, waitlist, payments, auditLog] = await Promise.all([
        nullableRequest("/api/admin/dashboard"),
        nullableRequest("/api/admin/events").then((items) => items || []),
        nullableRequest("/api/admin/waitlist").then((items) => items || []),
        nullableRequest("/api/admin/payments").then((items) => items || []),
        nullableRequest("/api/admin/audit-log").then((items) => items || []),
    ]);

    return {
        summary: (dashboard as Record<string, unknown> | null)?.summary || dashboard || {},
        events: events || (dashboard as Record<string, unknown> | null)?.events || [],
        waitlist: waitlist || (dashboard as Record<string, unknown> | null)?.waitlist || [],
        payments: payments || (dashboard as Record<string, unknown> | null)?.payments || [],
        auditLog: auditLog || (dashboard as Record<string, unknown> | null)?.auditLog || [],
    };
};

export const exportRegistrations = () =>
    request("/api/admin/events/export", {
        headers: { Accept: "text/csv" },
    });

export type TeacherSummary = {
    id: string;
    full_name: string;
    avg_rating: number;
    reviews_count: number;
};

export type GetTeachersParams = {
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
};

export const getTeachers = async ({ search, sort, limit, offset, signal }: GetTeachersParams = {}) => {
    const params = new URLSearchParams();

    if (search) {
        params.set("search", search);
    }
    if (sort) {
        params.set("sort", sort);
    }
    if (typeof limit === "number") {
        params.set("limit", String(limit));
    }
    if (typeof offset === "number") {
        params.set("offset", String(offset));
    }

    const query = params.toString();
    const response = await fetch(`/api/teachers${query ? `?${query}` : ""}`, {
        signal,
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as TeacherSummary[];
    return payload;
};

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
    getTeachers,
};

export default api;
