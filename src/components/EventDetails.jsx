import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../lib/api";
import { formatRange } from "../utils/date";
import PaymentTimeline from "./PaymentTimeline";

export default function EventDetails({ id, open, onClose, onRegistered, onWaitlisted }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [regResult, setRegResult] = useState(null);
    const [payUrl, setPayUrl] = useState(null);
    const [paymentResult, setPaymentResult] = useState(null);
    const [waitlistResult, setWaitlistResult] = useState(null);
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        if (!id || !open) {
            setData(null);
            setRegResult(null);
            setPayUrl(null);
            setBusy(false);
            setPaymentResult(null);
            setWaitlistResult(null);
            setActionError(null);
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
        setActionError(null);
        try {
            const reservation = await api.register(id, { name: "Гость" });
            setRegResult(reservation);
            const payment = await api.createPayment(reservation.reservation_id);
            setPaymentResult(payment);
            setPayUrl(payment.payment_url || null);
            onRegistered?.();
        } catch (err) {
            setActionError("Не удалось создать бронь. Попробуйте позже.");
        } finally {
            setBusy(false);
        }
    };

    const handleWaitlist = async () => {
        if (!id || busy) return;
        setBusy(true);
        setActionError(null);
        try {
            const result = await api.joinWaitlist(id, { name: "Гость" });
            setWaitlistResult(result);
            onWaitlisted?.();
        } catch (err) {
            setActionError("Не удалось добавить в лист ожидания. Попробуйте позже.");
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    return createPortal(
        <div className="modal-backdrop">
            <div className="modal-backdrop__overlay" onClick={onClose} />
            <div className="modal-sheet">
                <div className="modal-content">
                    <div className="modal-header">
                        <div>
                            <h3 className="modal-title">{loading ? "Загрузка..." : data?.title}</h3>
                            {!loading && data && (
                                <div className="modal-meta">
                                    <span className="modal-chip">📍 {data.city}</span>
                                    <span className="modal-chip">🎯 {data.level}</span>
                                    <span className="modal-chip">
                                        {data.status === "published" ? "Статус: опубликовано" : "Статус: черновик"}
                                    </span>
                                    <span className="modal-chip">🕒 {formatRange(data.date_start, data.date_end)}</span>
                                </div>
                            )}
                        </div>
                        {!loading && data && (
                            <div className="modal-price">
                                <div className="modal-price__value">{data.price} ₽</div>
                                <div className="modal-price__caption">Вместимость: {data.capacity}</div>
                            </div>
                        )}
                    </div>

                    {error && <div className="app-alert app-alert--error">{error}</div>}

                    {!loading && data && (
                        <div className="modal-note">
                            <div className="modal-note__title">Место проведения:</div>
                            <p className="modal-note__text">
                                <b>{data.venue}</b>, {data.address}. Приходите за 10 минут до начала. После регистрации откроется окно
                                оплаты.
                            </p>
                            <p className="modal-note__text">
                                Формат: <b>{data.category || "Событие"}</b>. Организатор: {data.organizer}. При отмене бронь автоматически
                                освободится для следующего участника из листа ожидания.
                            </p>
                        </div>
                    )}

                    <div className="modal-actions">
                        <span className={`modal-badge ${soldOut ? "modal-badge--soldout" : ""}`}>
                            {soldOut ? "Нет мест" : `Свободно мест: ${data?.spots_left ?? "—"}`}
                        </span>
                        <div className="modal-actions__buttons">
                            <button
                                type="button"
                                onClick={handleRegister}
                                disabled={soldOut || busy || !data}
                                className="button button--primary modal-actions__cta"
                            >
                                {busy ? "Создание платежа..." : "Записаться и оплатить"}
                            </button>
                            {soldOut && (
                                <button
                                    type="button"
                                    className="button button--ghost"
                                    onClick={handleWaitlist}
                                    disabled={busy || Boolean(waitlistResult)}
                                >
                                    {waitlistResult ? "Вы в листе ожидания" : "Стать в лист ожидания"}
                                </button>
                            )}
                        </div>
                    </div>

                    {actionError && <div className="app-alert app-alert--error">{actionError}</div>}

                    {regResult && (
                        <div className="modal-summary">
                            <div className="modal-summary__title">Бронь создана</div>
                            <div className="modal-summary__caption">Номер брони: {regResult.reservation_id}</div>
                            {payUrl && (
                                <button
                                    type="button"
                                    className="button button--ghost modal-summary__button"
                                    onClick={() => window.open(payUrl, "_blank", "noopener")}
                                >
                                    Перейти к оплате
                                </button>
                            )}
                        </div>
                    )}

                    {waitlistResult && (
                        <div className="modal-summary modal-summary--waitlist">
                            <div className="modal-summary__title">Вы добавлены в лист ожидания</div>
                            <div className="modal-summary__caption">
                                Позиция #{waitlistResult.position} из {waitlistResult.waitlist_limit}. Уведомление придёт в Telegram
                                и Email.
                            </div>
                        </div>
                    )}

                    {(regResult || paymentResult) && <PaymentTimeline reservation={regResult} payment={paymentResult} />}
                </div>
            </div>
        </div>,
        document.body,
    );
}
