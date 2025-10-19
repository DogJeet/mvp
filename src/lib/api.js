const demoEvents = [
    {
        id: "volleyball-beginners",
        title: "Волейбол для новичков",
        city: "Москва",
        level: "Новички",
        price: 700,
        date_start: "2025-10-21T10:00:00+03:00",
        date_end: "2025-10-21T12:00:00+03:00",
        venue: "Спортивный центр №1",
        address: "ул. Академика, 12",
        capacity: 16,
        spots_left: 6,
        cover: "https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1600&auto=format&fit=crop",
    },
    {
        id: "board-games",
        title: "Вечер настольных игр",
        city: "Санкт-Петербург",
        level: "Все уровни",
        price: 500,
        date_start: "2025-10-22T18:00:00+03:00",
        date_end: "2025-10-22T21:00:00+03:00",
        venue: "Клуб BoardTime",
        address: "Невский проспект, 82",
        capacity: 20,
        spots_left: 0,
        cover: "https://images.unsplash.com/photo-1504274066651-8d31a536b11a?q=80&w=1600&auto=format&fit=crop",
    },
    {
        id: "basketball-pro",
        title: "Тренировка по баскетболу",
        city: "Москва",
        level: "Продвинутый",
        price: 1000,
        date_start: "2025-10-26T12:00:00+03:00",
        date_end: "2025-10-26T14:00:00+03:00",
        venue: "Arena 24",
        address: "ул. Центральная, 24",
        capacity: 20,
        spots_left: 12,
        cover: "https://images.unsplash.com/photo-1587385789094-ded6f6d75f49?q=80&w=1600&auto=format&fit=crop",
    },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeFilters = (filters = {}) => ({
    city: filters.city,
    level: filters.level,
    q: filters.q,
});

const api = {
    async listEvents(filters = {}) {
        const normalized = normalizeFilters(filters);
        await wait(200);
        return demoEvents.filter((event) => {
            if (normalized.city && event.city !== normalized.city) return false;
            if (normalized.level && event.level !== normalized.level) return false;
            if (normalized.q) {
                const needle = normalized.q.toLowerCase();
                const haystack = `${event.title} ${event.venue} ${event.city}`.toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    },
    async getEvent(id) {
        await wait(150);
        const event = demoEvents.find((item) => item.id === id);
        if (!event) {
            throw new Error("Not found");
        }
        return event;
    },
    async register(eventId, payload) {
        await wait(150);
        return {
            reservation_id: `demo-${eventId}-${Date.now()}`,
            status: "reserved",
            payload,
        };
    },
    async createPayment(reservation_id) {
        await wait(150);
        return {
            payment_url: "https://example.com/pay?demo=1",
            provider: "demo",
            payment_id: `p_${Math.random().toString(36).slice(2)}`,
            status: "pending",
            reservation_id,
        };
    },
};

export default api;
