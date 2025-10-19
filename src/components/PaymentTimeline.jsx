import React from "react";

const statusClass = (status) => {
    switch (status) {
        case "done":
            return "timeline-step--done";
        case "current":
            return "timeline-step--current";
        default:
            return "timeline-step--upcoming";
    }
};

export default function PaymentTimeline({ reservation, payment }) {
    const steps = [
        {
            key: "reservation",
            title: "Бронь",
            description: reservation
                ? `Резерв создан (${reservation.reservation_id})`
                : "Создайте бронь, чтобы зафиксировать место",
            status: reservation ? "done" : "upcoming",
        },
        {
            key: "invoice",
            title: "Счёт на оплату",
            description: payment
                ? `Провайдер: ${payment.provider ? payment.provider.toUpperCase() : "—"}`
                : "Счёт сформируется автоматически после брони",
            status: payment ? "done" : reservation ? "current" : "upcoming",
        },
        {
            key: "payment",
            title: "Оплата",
            description: payment
                ? payment.status === "paid"
                    ? "Оплата подтверждена и чек отправлен"
                    : `Статус: ${payment.status === "pending" ? "ожидает оплаты" : payment.status}`
                : "После выставления счёта доступна онлайн-оплата",
            status: payment ? (payment.status === "paid" ? "done" : "current") : "upcoming",
        },
    ];

    return (
        <ol className="timeline" aria-live="polite">
            {steps.map((step, index) => (
                <li key={step.key} className={`timeline-step ${statusClass(step.status)}`}>
                    <span className="timeline-step__index">{index + 1}</span>
                    <div className="timeline-step__content">
                        <div className="timeline-step__title">{step.title}</div>
                        <div className="timeline-step__description">{step.description}</div>
                    </div>
                </li>
            ))}
        </ol>
    );
}
