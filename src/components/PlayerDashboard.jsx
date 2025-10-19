import React from "react";
import { formatRange } from "../utils/date";

function StatCard({ label, value, hint }) {
    return (
        <div className="dashboard-card">
            <div className="dashboard-card__value">{value}</div>
            <div className="dashboard-card__label">{label}</div>
            {hint && <div className="dashboard-card__hint">{hint}</div>}
        </div>
    );
}

function RegistrationRow({ registration }) {
    const { event, status, payment_status: paymentStatus, amount, payment, attendance } = registration;
    if (!event) return null;
    return (
        <tr>
            <td>
                <div className="dashboard-table__title">{event.title}</div>
                <div className="dashboard-table__meta">{event.city} • {formatRange(event.date_start, event.date_end)}</div>
            </td>
            <td>
                <span className={`badge badge--status-${status}`}>{status === "confirmed" ? "Подтверждена" : "Ожидает"}</span>
            </td>
            <td>
                <span className={`badge badge--payment-${paymentStatus}`}>
                    {paymentStatus === "paid" ? "Оплачено" : paymentStatus === "pending" ? "Ожидает" : paymentStatus}
                </span>
            </td>
            <td>{amount ? `${amount} ₽` : "—"}</td>
            <td>
                {payment?.receipt_url ? (
                    <a className="link" href={payment.receipt_url} target="_blank" rel="noreferrer">
                        Чек
                    </a>
                ) : (
                    "—"
                )}
            </td>
            <td>
                {attendance ? (
                    <span className="badge badge--success">Отмечено</span>
                ) : (
                    <span className="badge">Ожидает</span>
                )}
            </td>
        </tr>
    );
}

function WaitlistRow({ entry }) {
    const { event, position, notified, created_at: createdAt } = entry;
    if (!event) return null;
    return (
        <tr>
            <td>
                <div className="dashboard-table__title">{event.title}</div>
                <div className="dashboard-table__meta">{event.city} • {event.level}</div>
            </td>
            <td>#{position}</td>
            <td>{new Date(createdAt).toLocaleString("ru-RU")}</td>
            <td>
                <span className={`badge ${notified ? "badge--success" : "badge--muted"}`}>
                    {notified ? "Уведомление отправлено" : "Ожидает слот"}
                </span>
            </td>
        </tr>
    );
}

export default function PlayerDashboard({ data, loading, error, onRefresh }) {
    if (loading) {
        return (
            <section className="app-panel">
                <h2 className="app-panel__title">Личный кабинет</h2>
                <p className="app-panel__subtitle">Загружаем ваши записи...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="app-panel">
                <h2 className="app-panel__title">Личный кабинет</h2>
                <div className="app-alert app-alert--error">{error}</div>
                <button type="button" className="button button--primary" onClick={onRefresh}>
                    Повторить
                </button>
            </section>
        );
    }

    if (!data) return null;

    const { stats, registrations, waitlist, notifications, user } = data;
    const displayName = user?.name || user?.full_name || user?.telegram || "Игрок";
    const levelLabel = user?.level || user?.skill_level || "—";
    const safeStats = {
        upcoming: stats?.upcoming ?? 0,
        waitlisted: stats?.waitlisted ?? 0,
        paidSum: stats?.paidSum ?? stats?.paid_sum ?? 0,
        attendanceMarked: stats?.attendanceMarked ?? stats?.attendance_marked ?? 0,
    };
    const registrationList = Array.isArray(registrations) ? registrations : [];
    const waitlistList = Array.isArray(waitlist) ? waitlist : [];
    const notificationsList = Array.isArray(notifications) ? notifications : [];

    return (
        <section className="dashboard">
            <header className="dashboard__header">
                <div>
                    <h2 className="app-panel__title">Личный кабинет игрока</h2>
                    <p className="app-panel__subtitle">
                        {displayName} • уровень: {levelLabel}. Управляйте записями, статусами оплат и листом ожидания.
                    </p>
                </div>
                <button type="button" className="button button--ghost" onClick={onRefresh}>
                    Обновить данные
                </button>
            </header>

            <div className="dashboard__stats">
                <StatCard label="Ближайшие" value={safeStats.upcoming} hint="Записи с датой в будущем" />
                <StatCard label="Лист ожидания" value={safeStats.waitlisted} hint="События без свободных мест" />
                <StatCard label="Оплачено" value={`${safeStats.paidSum} ₽`} hint="Подтверждённые платежи" />
                <StatCard label="Посещено" value={safeStats.attendanceMarked} hint="Отмеченные посещения" />
            </div>

            <section className="dashboard-section">
                <div className="dashboard-section__header">
                    <h3 className="dashboard-section__title">Мои регистрации</h3>
                    <span className="dashboard-section__caption">
                        История оплат и статусов — обновляется через API провайдера
                    </span>
                </div>
                <div className="dashboard-table__wrapper">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Событие</th>
                                <th>Статус</th>
                                <th>Оплата</th>
                                <th>Сумма</th>
                                <th>Чек</th>
                                <th>Посещение</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrationList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="dashboard-table__empty">
                                        Записей пока нет. Найдите событие в каталоге.
                                    </td>
                                </tr>
                            ) : (
                                registrationList.map((registration) => (
                                    <RegistrationRow key={registration.id} registration={registration} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-section__header">
                    <h3 className="dashboard-section__title">Лист ожидания</h3>
                    <span className="dashboard-section__caption">
                        Автоматические уведомления приходят в Telegram и Email
                    </span>
                </div>
                <div className="dashboard-table__wrapper">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Событие</th>
                                <th>Позиция</th>
                                <th>Добавлен</th>
                                <th>Статус уведомления</th>
                            </tr>
                        </thead>
                        <tbody>
                            {waitlistList.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="dashboard-table__empty">
                                        Вы ещё не добавлялись в лист ожидания.
                                    </td>
                                </tr>
                            ) : (
                                waitlistList.map((entry) => <WaitlistRow key={entry.id} entry={entry} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="dashboard-section">
                <div className="dashboard-section__header">
                    <h3 className="dashboard-section__title">Уведомления</h3>
                    <span className="dashboard-section__caption">Email, SMS и Telegram по ключевым событиям</span>
                </div>
                <ul className="notification-list">
                    {notificationsList.map((notification) => (
                        <li key={notification.id} className="notification-item">
                            <div className="notification-item__channel">{notification.channel}</div>
                            <div className="notification-item__title">{notification.title}</div>
                            <div className="notification-item__message">{notification.message}</div>
                            <div className="notification-item__time">
                                {new Date(notification.created_at).toLocaleString("ru-RU")}
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </section>
    );
}
