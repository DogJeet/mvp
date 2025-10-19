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
        status: "published",
        organizer: "GameUp Team",
        category: "Командные виды",
        waitlist_limit: 10,
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
        status: "published",
        organizer: "BoardTime",
        category: "Социальные",
        waitlist_limit: 15,
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
        status: "draft",
        organizer: "Arena 24",
        category: "Профессиональные",
        waitlist_limit: 5,
        cover: "https://images.unsplash.com/photo-1587385789094-ded6f6d75f49?q=80&w=1600&auto=format&fit=crop",
    },
];

const demoUsers = [
    {
        id: "player-1",
        name: "Мария Л.",
        level: "Средний",
        phone: "+7 900 123-45-67",
        email: "player@example.com",
        telegram: "@maria",
        role: "player",
    },
    {
        id: "organizer-1",
        name: "GameUp Team",
        role: "organizer",
        email: "team@gameup.io",
        phone: "+7 812 555-10-10",
    },
];

const currentUserId = demoUsers[0].id;

const demoRegistrations = [
    {
        id: "reg-1001",
        event_id: "volleyball-beginners",
        user_id: currentUserId,
        status: "confirmed",
        payment_status: "paid",
        amount: 700,
        created_at: "2025-10-05T09:10:00+03:00",
    },
    {
        id: "reg-1002",
        event_id: "basketball-pro",
        user_id: currentUserId,
        status: "pending",
        payment_status: "pending",
        amount: 1000,
        created_at: "2025-10-12T11:40:00+03:00",
    },
];

const demoPayments = [
    {
        id: "pay-1001",
        registration_id: "reg-1001",
        provider: "ЮKassa",
        receipt_url: "https://example.com/receipt/1001",
        status: "paid",
        amount: 700,
        paid_at: "2025-10-05T09:15:00+03:00",
    },
    {
        id: "pay-1002",
        registration_id: "reg-1002",
        provider: "CloudPayments",
        status: "pending",
        amount: 1000,
    },
];

const demoAttendance = [
    {
        id: "att-1001",
        registration_id: "reg-1001",
        status: "visited",
        marked_at: "2025-10-21T10:05:00+03:00",
    },
];

const demoWaitlist = [
    {
        id: "wait-1001",
        event_id: "board-games",
        user_id: currentUserId,
        position: 2,
        created_at: "2025-10-10T13:00:00+03:00",
        notified: true,
    },
    {
        id: "wait-1002",
        event_id: "board-games",
        user_id: "external-1",
        position: 3,
        created_at: "2025-10-11T15:22:00+03:00",
        notified: false,
    },
];

const demoNotifications = [
    {
        id: "notif-1",
        channel: "Email",
        title: "Платёж подтверждён",
        message: "Чек по оплате #pay-1001 отправлен на почту",
        created_at: "2025-10-05T09:16:00+03:00",
    },
    {
        id: "notif-2",
        channel: "Telegram",
        title: "Напоминание о тренировке",
        message: "Сегодня волейбол в 10:00. Не забудьте форму!",
        created_at: "2025-10-21T08:00:00+03:00",
    },
];

const demoAuditLog = [
    {
        id: "log-1",
        actor: "Мария Л.",
        action: "Создана бронь",
        target: "Волейбол для новичков",
        created_at: "2025-10-05T09:10:00+03:00",
    },
    {
        id: "log-2",
        actor: "GameUp Team",
        action: "Экспорт участников (CSV)",
        target: "BoardTime",
        created_at: "2025-10-18T12:00:00+03:00",
    },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeFilters = (filters = {}) => ({
    city: filters.city,
    level: filters.level,
    q: filters.q,
});

const buildEventIndex = () => {
    const map = new Map();
    demoEvents.forEach((event) => {
        map.set(event.id, event);
    });
    return map;
};

const getAttendanceByRegistration = (registrationId) =>
    demoAttendance.find((attendance) => attendance.registration_id === registrationId) || null;

const getPaymentByRegistration = (registrationId) =>
    demoPayments.find((payment) => payment.registration_id === registrationId) || null;

const api = {
    async listEvents(filters = {}) {
        const normalized = normalizeFilters(filters);
        await wait(180);
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
        await wait(160);
        const event = demoEvents.find((item) => item.id === eventId);
        if (!event) {
            throw new Error("Not found");
        }
        const reservationId = `demo-${eventId}-${Date.now()}`;
        const registrationId = `reg-${Date.now()}`;
        demoRegistrations.push({
            id: registrationId,
            event_id: eventId,
            user_id: currentUserId,
            status: "pending",
            payment_status: "pending",
            amount: payload?.amount ?? event.price ?? 0,
            created_at: new Date().toISOString(),
        });
        if (event.spots_left > 0) {
            event.spots_left -= 1;
        }
        return {
            reservation_id: reservationId,
            status: "reserved",
            payload,
        };
    },
    async createPayment(reservation_id) {
        await wait(150);
        const payment = {
            payment_url: "https://example.com/pay?demo=1",
            provider: "demo",
            payment_id: `p_${Math.random().toString(36).slice(2)}`,
            status: "pending",
            reservation_id,
            expires_at: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        };
        const lastRegistration = demoRegistrations[demoRegistrations.length - 1];
        demoPayments.push({
            id: payment.payment_id,
            registration_id: lastRegistration?.id,
            provider: payment.provider,
            status: payment.status,
            amount: lastRegistration?.amount ?? 0,
        });
        if (lastRegistration) {
            lastRegistration.payment_status = payment.status;
        }
        return payment;
    },
    async joinWaitlist(eventId, payload) {
        await wait(140);
        const event = demoEvents.find((item) => item.id === eventId);
        if (!event) {
            throw new Error("Not found");
        }
        const existing = demoWaitlist.filter((entry) => entry.event_id === eventId);
        const entry = {
            id: `wait-${Date.now()}`,
            event_id: eventId,
            user_id: currentUserId,
            position: existing.length + 1,
            created_at: new Date().toISOString(),
            notified: false,
            contact: payload?.contact ?? demoUsers[0].phone,
        };
        demoWaitlist.push(entry);
        return {
            ...entry,
            event_title: event.title,
            waitlist_limit: event.waitlist_limit,
        };
    },
    async getPlayerDashboard(userId = currentUserId) {
        await wait(220);
        const eventIndex = buildEventIndex();
        const user = demoUsers.find((item) => item.id === userId);
        if (!user) throw new Error("Unknown user");

        const registrations = demoRegistrations
            .filter((registration) => registration.user_id === userId)
            .map((registration) => {
                const event = eventIndex.get(registration.event_id);
                return {
                    ...registration,
                    event,
                    payment: getPaymentByRegistration(registration.id),
                    attendance: getAttendanceByRegistration(registration.id),
                };
            });

        const waitlistEntries = demoWaitlist
            .filter((entry) => entry.user_id === userId)
            .map((entry) => ({
                ...entry,
                event: eventIndex.get(entry.event_id),
            }));

        const paidSum = registrations
            .filter((registration) => registration.payment_status === "paid")
            .reduce((acc, item) => acc + (item.amount || 0), 0);
        const upcoming = registrations.filter((registration) => {
            const event = eventIndex.get(registration.event_id);
            return event && new Date(event.date_start) > new Date();
        }).length;
        const attendanceMarked = registrations.filter((registration) =>
            Boolean(getAttendanceByRegistration(registration.id)),
        ).length;

        return {
            user,
            stats: {
                upcoming,
                waitlisted: waitlistEntries.length,
                paidSum,
                attendanceMarked,
            },
            registrations,
            waitlist: waitlistEntries,
            notifications: demoNotifications,
        };
    },
    async getAdminOverview() {
        await wait(250);
        const eventIndex = buildEventIndex();

        const totalRevenue = demoPayments
            .filter((payment) => payment.status === "paid")
            .reduce((acc, payment) => acc + (payment.amount || 0), 0);

        const totalCapacity = demoEvents.reduce((acc, event) => acc + event.capacity, 0);
        const totalSpotsLeft = demoEvents.reduce((acc, event) => acc + event.spots_left, 0);

        const overview = {
            summary: {
                totalEvents: demoEvents.length,
                activeRegistrations: demoRegistrations.filter((registration) => registration.status !== "cancelled").length,
                pendingPayments: demoPayments.filter((payment) => payment.status !== "paid").length,
                waitlistCount: demoWaitlist.length,
                totalRevenue,
                occupancyRate: totalCapacity
                    ? Math.round(((totalCapacity - totalSpotsLeft) / totalCapacity) * 100)
                    : 0,
            },
            events: demoEvents.map((event) => ({
                ...event,
                occupancy: event.capacity ? Math.round(((event.capacity - event.spots_left) / event.capacity) * 100) : 0,
            })),
            waitlist: demoWaitlist.map((entry) => ({
                ...entry,
                event: eventIndex.get(entry.event_id),
                user: demoUsers.find((user) => user.id === entry.user_id) || demoUsers[0],
            })),
            payments: demoPayments.map((payment) => ({
                ...payment,
                registration: demoRegistrations.find((registration) => registration.id === payment.registration_id),
                event: eventIndex.get(
                    demoRegistrations.find((registration) => registration.id === payment.registration_id)?.event_id || "",
                ),
            })),
            auditLog: demoAuditLog,
        };

        return overview;
    },
    async exportRegistrations() {
        await wait(120);
        const eventIndex = buildEventIndex();
        const rows = [
            ["registration_id", "event", "status", "payment_status", "amount"],
            ...demoRegistrations.map((registration) => [
                registration.id,
                eventIndex.get(registration.event_id)?.title ?? "—",
                registration.status,
                registration.payment_status,
                registration.amount,
            ]),
        ];
        return rows.map((row) => row.join(",")).join("\n");
    },
};

export default api;
