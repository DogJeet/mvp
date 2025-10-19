import React, { useState } from "react";
import api from "../lib/api";
import { formatRange } from "../utils/date";

function StatCard({ label, value, caption, tone = "default" }) {
    return (
        <div className={`dashboard-card dashboard-card--${tone}`}>
            <div className="dashboard-card__value">{value}</div>
            <div className="dashboard-card__label">{label}</div>
            {caption && <div className="dashboard-card__hint">{caption}</div>}
        </div>
    );
}

export default function AdminPanel({ data, loading, error, onRefresh }) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            const csv = await api.exportRegistrations();
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `registrations-${Date.now()}.csv`;
            anchor.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <section className="app-panel">
                <h2 className="app-panel__title">Администрирование</h2>
                <p className="app-panel__subtitle">Загружаем метрики и отчёты...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="app-panel">
                <h2 className="app-panel__title">Администрирование</h2>
                <div className="app-alert app-alert--error">{error}</div>
                <button type="button" className="button button--primary" onClick={onRefresh}>
                    Повторить
                </button>
            </section>
        );
    }

    if (!data) return null;

    const { summary, events, waitlist, payments, auditLog } = data;

    return (
        <section className="dashboard">
            <header className="dashboard__header">
                <div>
                    <h2 className="app-panel__title">Административная панель</h2>
                    <p className="app-panel__subtitle">
                        Управление расписанием, платежами, листом ожидания и экспортом данных.
                    </p>
                </div>
                <div className="dashboard__actions">
                    <button type="button" className="button button--ghost" onClick={onRefresh}>
                        Обновить
                    </button>
                    <button
                        type="button"
                        className="button button--primary"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? "Формируем CSV..." : "Экспорт участников"}
                    </button>
                </div>
            </header>

            <div className="dashboard__stats">
                <StatCard label="События" value={summary.totalEvents} caption="в расписании" />
                <StatCard
                    label="Регистрации"
                    value={summary.activeRegistrations}
                    caption="активные участники"
                    tone="accent"
                />
                <StatCard
                    label="Оплаты"
                    value={`${summary.totalRevenue} ₽`}
                    caption="подтверждённая выручка"
                    tone="success"
                />
                <StatCard
                    label="Заполненность"
                    value={`${summary.occupancyRate}%`}
                    caption="средняя по событиям"
                    tone="warning"
                />
            </div>

            <section className="dashboard-section">
                <div className="dashboard-section__header">
                    <h3 className="dashboard-section__title">События</h3>
                    <span className="dashboard-section__caption">Публикация, лимиты и свободные места</span>
                </div>
                <div className="dashboard-table__wrapper">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Дата и время</th>
                                <th>Город</th>
                                <th>Статус</th>
                                <th>Места</th>
                                <th>Заполненность</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td>
                                        <div className="dashboard-table__title">{event.title}</div>
                                        <div className="dashboard-table__meta">Организатор: {event.organizer}</div>
                                    </td>
                                    <td>{formatRange(event.date_start, event.date_end)}</td>
                                    <td>{event.city}</td>
                                    <td>
                                        <span className={`badge badge--status-${event.status}`}>
                                            {event.status === "published" ? "Опубликовано" : "Черновик"}
                                        </span>
                                    </td>
                                    <td>
                                        {event.capacity - event.spots_left}/{event.capacity}
                                    </td>
                                    <td>
                                        <div className="progress-row">
                                            <div className="progress">
                                                <div className="progress__bar" style={{ width: `${event.occupancy}%` }} />
                                            </div>
                                            <span className="progress__label">{event.occupancy}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-section__header">
                    <h3 className="dashboard-section__title">Лист ожидания</h3>
                    <span className="dashboard-section__caption">Контроль уведомлений и ручное подтверждение</span>
                </div>
                <div className="dashboard-table__wrapper">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Событие</th>
                                <th>Участник</th>
                                <th>Позиция</th>
                                <th>Контакт</th>
                                <th>Уведомление</th>
                            </tr>
                        </thead>
                        <tbody>
                            {waitlist.map((entry) => (
                                <tr key={entry.id}>
                                    <td>
                                        <div className="dashboard-table__title">{entry.event?.title}</div>
                                        <div className="dashboard-table__meta">{entry.event?.city}</div>
                                    </td>
                                    <td>{entry.user?.name || "Участник"}</td>
                                    <td>#{entry.position}</td>
                                    <td>{entry.contact || entry.user?.phone || "—"}</td>
                                    <td>
                                        <span className={`badge ${entry.notified ? "badge--success" : "badge--muted"}`}>
                                            {entry.notified ? "Отправлено" : "Ожидает"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-section__header">
                    <h3 className="dashboard-section__title">Платежи</h3>
                    <span className="dashboard-section__caption">Интеграция с ЮKassa и CloudPayments</span>
                </div>
                <div className="dashboard-table__wrapper">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Событие</th>
                                <th>Регистрация</th>
                                <th>Провайдер</th>
                                <th>Сумма</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>{payment.event?.title || "—"}</td>
                                    <td>{payment.registration?.id || "—"}</td>
                                    <td>{payment.provider}</td>
                                    <td>{payment.amount ? `${payment.amount} ₽` : "—"}</td>
                                    <td>
                                        <span className={`badge badge--payment-${payment.status}`}>
                                            {payment.status === "paid" ? "Оплачено" : "В ожидании"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-section__header">
                    <h3 className="dashboard-section__title">Журнал действий</h3>
                    <span className="dashboard-section__caption">HMAC-подписи, логи API и ручные операции</span>
                </div>
                <ul className="audit-log">
                    {auditLog.map((entry) => (
                        <li key={entry.id} className="audit-log__item">
                            <div className="audit-log__primary">
                                <span className="audit-log__actor">{entry.actor}</span>
                                <span className="audit-log__action">{entry.action}</span>
                            </div>
                            <div className="audit-log__meta">
                                <span>{entry.target}</span>
                                <span>{new Date(entry.created_at).toLocaleString("ru-RU")}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </section>
    );
}
