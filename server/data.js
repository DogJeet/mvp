const { randomUUID } = require('node:crypto');

const events = [
    {
        id: 'volleyball-beginners',
        title: 'Волейбол для новичков',
        city: 'Москва',
        level: 'Новички',
        price: 700,
        date_start: '2025-10-21T10:00:00+03:00',
        date_end: '2025-10-21T12:00:00+03:00',
        venue: 'Спортивный центр №1',
        address: 'ул. Академика, 12',
        capacity: 16,
        spots_left: 6,
        status: 'published',
        organizer: 'GameUp Team',
        category: 'Командные виды',
        waitlist_limit: 10,
        cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1600&auto=format&fit=crop',
    },
    {
        id: 'board-games',
        title: 'Вечер настольных игр',
        city: 'Санкт-Петербург',
        level: 'Все уровни',
        price: 500,
        date_start: '2025-10-22T18:00:00+03:00',
        date_end: '2025-10-22T21:00:00+03:00',
        venue: 'Клуб BoardTime',
        address: 'Невский проспект, 82',
        capacity: 20,
        spots_left: 0,
        status: 'published',
        organizer: 'BoardTime',
        category: 'Социальные',
        waitlist_limit: 15,
        cover: 'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?q=80&w=1600&auto=format&fit=crop',
    },
    {
        id: 'basketball-pro',
        title: 'Тренировка по баскетболу',
        city: 'Москва',
        level: 'Продвинутый',
        price: 1000,
        date_start: '2025-10-26T12:00:00+03:00',
        date_end: '2025-10-26T14:00:00+03:00',
        venue: 'Arena 24',
        address: 'ул. Центральная, 24',
        capacity: 20,
        spots_left: 12,
        status: 'draft',
        organizer: 'Arena 24',
        category: 'Профессиональные',
        waitlist_limit: 5,
        cover: 'https://images.unsplash.com/photo-1587385789094-ded6f6d75f49?q=80&w=1600&auto=format&fit=crop',
    },
];

const users = [
    {
        id: 'player-1',
        name: 'Мария Л.',
        level: 'Средний',
        phone: '+7 900 123-45-67',
        email: 'player@example.com',
        telegram: '@maria',
        role: 'player',
    },
    {
        id: 'organizer-1',
        name: 'GameUp Team',
        role: 'organizer',
        email: 'team@gameup.io',
        phone: '+7 812 555-10-10',
    },
];

const registrations = [
    {
        id: 'reg-1001',
        event_id: 'volleyball-beginners',
        user_id: 'player-1',
        status: 'confirmed',
        payment_status: 'paid',
        amount: 700,
        created_at: '2025-10-05T09:10:00+03:00',
    },
    {
        id: 'reg-1002',
        event_id: 'basketball-pro',
        user_id: 'player-1',
        status: 'pending',
        payment_status: 'pending',
        amount: 1000,
        created_at: '2025-10-12T11:40:00+03:00',
    },
];

const payments = [
    {
        id: 'pay-1001',
        registration_id: 'reg-1001',
        provider: 'ЮKassa',
        receipt_url: 'https://example.com/receipt/1001',
        status: 'paid',
        amount: 700,
        paid_at: '2025-10-05T09:15:00+03:00',
    },
    {
        id: 'pay-1002',
        registration_id: 'reg-1002',
        provider: 'CloudPayments',
        status: 'pending',
        amount: 1000,
    },
];

const attendance = [
    {
        id: 'att-1001',
        registration_id: 'reg-1001',
        status: 'visited',
        marked_at: '2025-10-21T10:05:00+03:00',
    },
];

const waitlist = [
    {
        id: 'wait-1001',
        event_id: 'board-games',
        user_id: 'player-1',
        position: 2,
        created_at: '2025-10-10T13:00:00+03:00',
        notified: true,
    },
    {
        id: 'wait-1002',
        event_id: 'board-games',
        user_id: 'external-1',
        position: 3,
        created_at: '2025-10-11T15:22:00+03:00',
        notified: false,
    },
];

const notifications = [
    {
        id: 'notif-1',
        channel: 'Email',
        title: 'Платёж подтверждён',
        message: 'Чек по оплате #pay-1001 отправлен на почту',
        created_at: '2025-10-05T09:16:00+03:00',
    },
    {
        id: 'notif-2',
        channel: 'Telegram',
        title: 'Напоминание о тренировке',
        message: 'Сегодня волейбол в 10:00. Не забудьте форму!',
        created_at: '2025-10-21T08:00:00+03:00',
    },
];

const auditLog = [
    {
        id: 'log-1',
        actor: 'Мария Л.',
        action: 'Создана бронь',
        target: 'Волейбол для новичков',
        created_at: '2025-10-05T09:10:00+03:00',
    },
    {
        id: 'log-2',
        actor: 'GameUp Team',
        action: 'Экспорт участников (CSV)',
        target: 'BoardTime',
        created_at: '2025-10-18T12:00:00+03:00',
    },
];

const reservations = [
    {
        id: 'res-1001',
        registration_id: 'reg-1001',
        status: 'reserved',
        created_at: '2025-10-05T09:10:00+03:00',
    },
    {
        id: 'res-1002',
        registration_id: 'reg-1002',
        status: 'reserved',
        created_at: '2025-10-12T11:40:00+03:00',
    },
];

const state = {
    events,
    users,
    registrations,
    payments,
    attendance,
    waitlist,
    notifications,
    auditLog,
    reservations,
};

const getEventIndex = () => {
    const map = new Map();
    state.events.forEach((event) => {
        map.set(event.id, event);
    });
    return map;
};

const getUserIndex = () => {
    const map = new Map();
    state.users.forEach((user) => {
        map.set(user.id, user);
    });
    return map;
};

const createAuditEntry = (actor, action, target) => {
    state.auditLog.unshift({
        id: randomUUID(),
        actor,
        action,
        target,
        created_at: new Date().toISOString(),
    });
};

const createReservation = (eventId, userId, payload = {}) => {
    const event = state.events.find((item) => item.id === eventId);
    if (!event) {
        return { error: 'NOT_FOUND' };
    }
    if (event.spots_left !== undefined && event.spots_left <= 0) {
        return { error: 'NO_SPOTS' };
    }

    const reservationId = `res-${randomUUID().slice(0, 8)}`;
    const registrationId = `reg-${Date.now()}`;

    const registration = {
        id: registrationId,
        event_id: eventId,
        user_id: userId,
        status: 'pending',
        payment_status: 'pending',
        amount: payload?.amount ?? event.price ?? 0,
        created_at: new Date().toISOString(),
    };

    const reservation = {
        id: reservationId,
        registration_id: registrationId,
        status: 'reserved',
        payload,
        created_at: new Date().toISOString(),
    };

    state.registrations.push(registration);
    state.reservations.push(reservation);
    if (typeof event.spots_left === 'number' && event.spots_left > 0) {
        event.spots_left -= 1;
    }

    createAuditEntry('Сервис бронирования', 'Создана бронь', event.title);

    return { reservation, registration };
};

const createPayment = (reservationId) => {
    const reservation = state.reservations.find((item) => item.id === reservationId);
    if (!reservation) {
        return { error: 'NOT_FOUND' };
    }

    const registration = state.registrations.find((item) => item.id === reservation.registration_id);
    if (!registration) {
        return { error: 'NOT_FOUND' };
    }

    const payment = {
        id: `pay-${Date.now()}`,
        registration_id: registration.id,
        provider: 'demo',
        status: 'pending',
        amount: registration.amount,
        reservation_id: reservationId,
        payment_url: `https://example.com/pay/${reservationId}`,
        created_at: new Date().toISOString(),
    };

    state.payments.push(payment);
    registration.payment_status = 'pending';

    createAuditEntry('Сервис оплаты', 'Создан счёт', `Бронь ${reservationId}`);

    return { payment };
};

const addToWaitlist = (eventId, userId, payload = {}) => {
    const event = state.events.find((item) => item.id === eventId);
    if (!event) {
        return { error: 'NOT_FOUND' };
    }

    const existing = state.waitlist.filter((item) => item.event_id === eventId);
    const entry = {
        id: `wait-${Date.now()}`,
        event_id: eventId,
        user_id: userId,
        position: existing.length + 1,
        created_at: new Date().toISOString(),
        notified: false,
        contact: payload?.contact,
    };

    state.waitlist.push(entry);

    createAuditEntry('Игрок', 'Добавлен в лист ожидания', event.title);

    return { entry, event };
};

const getPlayerDashboard = (userId) => {
    const eventIndex = getEventIndex();
    const userIndex = getUserIndex();
    const user = userIndex.get(userId);
    if (!user) {
        return { error: 'NOT_FOUND' };
    }

    const registrationsWithRelations = state.registrations
        .filter((registration) => registration.user_id === userId)
        .map((registration) => ({
            ...registration,
            event: eventIndex.get(registration.event_id) || null,
            payment: state.payments.find((payment) => payment.registration_id === registration.id) || null,
            attendance: state.attendance.find((item) => item.registration_id === registration.id) || null,
        }));

    const waitlistEntries = state.waitlist
        .filter((entry) => entry.user_id === userId)
        .map((entry) => ({
            ...entry,
            event: eventIndex.get(entry.event_id) || null,
        }));

    const paidSum = registrationsWithRelations
        .filter((registration) => registration.payment_status === 'paid')
        .reduce((acc, item) => acc + (item.amount || 0), 0);

    const upcoming = registrationsWithRelations.filter((registration) => {
        const event = eventIndex.get(registration.event_id);
        return event && new Date(event.date_start) > new Date();
    }).length;

    const attendanceMarked = registrationsWithRelations.filter((registration) =>
        Boolean(state.attendance.find((item) => item.registration_id === registration.id)),
    ).length;

    return {
        user,
        stats: {
            upcoming,
            waitlisted: waitlistEntries.length,
            paidSum,
            attendanceMarked,
        },
        registrations: registrationsWithRelations,
        waitlist: waitlistEntries,
        notifications: state.notifications,
    };
};

const getAdminOverview = () => {
    const eventIndex = getEventIndex();
    const userIndex = getUserIndex();

    const totalRevenue = state.payments
        .filter((payment) => payment.status === 'paid')
        .reduce((acc, payment) => acc + (payment.amount || 0), 0);

    const totalCapacity = state.events.reduce((acc, event) => acc + event.capacity, 0);
    const totalSpotsLeft = state.events.reduce((acc, event) => acc + event.spots_left, 0);

    return {
        summary: {
            totalEvents: state.events.length,
            activeRegistrations: state.registrations.filter((registration) => registration.status !== 'cancelled').length,
            pendingPayments: state.payments.filter((payment) => payment.status !== 'paid').length,
            waitlistCount: state.waitlist.length,
            totalRevenue,
            occupancyRate: totalCapacity ? Math.round(((totalCapacity - totalSpotsLeft) / totalCapacity) * 100) : 0,
        },
        events: state.events.map((event) => ({
            ...event,
            occupancy: event.capacity ? Math.round(((event.capacity - event.spots_left) / event.capacity) * 100) : 0,
        })),
        waitlist: state.waitlist.map((entry) => ({
            ...entry,
            event: eventIndex.get(entry.event_id) || null,
            user: userIndex.get(entry.user_id) || null,
        })),
        payments: state.payments.map((payment) => ({
            ...payment,
            registration: state.registrations.find((registration) => registration.id === payment.registration_id) || null,
            event: eventIndex.get(
                state.registrations.find((registration) => registration.id === payment.registration_id)?.event_id || '',
            ),
        })),
        auditLog: state.auditLog.slice(0, 50),
    };
};

const exportRegistrations = () => {
    const eventIndex = getEventIndex();
    const rows = [
        ['registration_id', 'event', 'status', 'payment_status', 'amount'],
        ...state.registrations.map((registration) => [
            registration.id,
            eventIndex.get(registration.event_id)?.title ?? '—',
            registration.status,
            registration.payment_status,
            registration.amount,
        ]),
    ];
    return rows.map((row) => row.join(',')).join('\n');
};

module.exports = {
    state,
    createReservation,
    createPayment,
    addToWaitlist,
    getPlayerDashboard,
    getAdminOverview,
    exportRegistrations,
};
