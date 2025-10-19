import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../lib/api";
import { formatRange } from "../utils/date";

export default function EventDetails({ id, open, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [regResult, setRegResult] = useState(null);
    const [payUrl, setPayUrl] = useState(null);

    useEffect(() => {
        if (!id || !open) {
            setData(null);
            setRegResult(null);
            setPayUrl(null);
            setBusy(false);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        api.getEvent(id)
            .then((event) => {
                if (!cancelled) {
                    setData(event);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError("Не удалось загрузить событие");
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [id, open]);

    useEffect(() => {
        if (!open) return undefined;
        const handler = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);

    const soldOut = data?.spots_left !== undefined && data.spots_left <= 0;

    const handleRegister = async () => {
        if (!id || busy) return;
        setBusy(true);
        try {
            const reservation = await api.register(id, { name: "Гость" });
            setRegResult(reservation);
            const payment = await api.createPayment(reservation.reservation_id);
            setPayUrl(payment.payment_url || null);
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[90] bg-black/40">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="fixed inset-x-0 bottom-0 mt-auto w-full rounded-t-3xl bg-white shadow-2xl">
                <div className="mx-auto max-w-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-semibold leading-tight">{loading ? "Загрузка..." : data?.title}</h3>
                            {!loading && data && (
                                <div className="mt-2 flex flex-wrap gap-2 text-sm opacity-80">
                                    <span className="rounded-full border px-3 py-1 text-xs">📍 {data.city}</span>
                                    <span className="rounded-full border px-3 py-1 text-xs">🎯 {data.level}</span>
                                    <span className="rounded-full border px-3 py-1 text-xs">🕒 {formatRange(data.date_start, data.date_end)}</span>
                                </div>
                            )}
                        </div>
                        {!loading && data && (
                            <div className="text-right">
                                <div className="text-xl font-semibold">{data.price} ₽</div>
                                <div className="text-xs opacity-70">Вместимость: {data.capacity}</div>
                            </div>
                        )}
                    </div>

                    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

                    {!loading && data && (
                        <div className="rounded-xl border bg-slate-50 p-4 text-sm leading-relaxed">
                            <div className="font-medium">Место проведения:</div>
                            <p className="mt-1">
                                <b>{data.venue}</b>, {data.address}. Приходите за 10 минут до начала. После регистрации откроется окно
                                оплаты.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${soldOut ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>
                            {soldOut ? "Нет мест" : `Свободно мест: ${data?.spots_left ?? "—"}`}
                        </span>
                        <button
                            type="button"
                            onClick={handleRegister}
                            disabled={soldOut || busy || !data}
                            className="flex-1 h-12 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {busy ? "Создание платежа..." : "Записаться и оплатить"}
                        </button>
                    </div>

                    {regResult && (
                        <div className="rounded-xl border p-4 space-y-3 text-sm">
                            <div className="font-medium">Бронь создана</div>
                            <div className="opacity-80">Номер брони: {regResult.reservation_id}</div>
                            {payUrl && (
                                <button
                                    type="button"
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-medium"
                                    onClick={() => window.open(payUrl, "_blank", "noopener")}
                                >
                                    Перейти к оплате
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
