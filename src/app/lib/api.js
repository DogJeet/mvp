const api = {
        level: "Все уровни",
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
}
},
async getEvent(id) {
    try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) throw new Error("Bad status");
        return await res.json();
    } catch {
        const all = await api.listEvents();
        return all.find((e) => e.id === id);
    }
},
async register(eventId, payload) {
    try {
        const res = await fetch(`/api/events/${eventId}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Bad status");
        return await res.json();
    } catch {
        return { reservation_id: `demo-${Date.now()}`, status: "reserved" };
    }
},
async createPayment(reservation_id) {
    try {
        const res = await fetch(`/api/payments/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservation_id, provider: "demo" }),
        });
        if (!res.ok) throw new Error("Bad status");
        return await res.json();
    } catch {
        return {
            payment_url: "https://example.com/pay?demo=1",
            provider: "demo",
            payment_id: `p_${Math.random().toString(36).slice(2)}`,
            status: "pending",
        };
    }
},
};
export default api;