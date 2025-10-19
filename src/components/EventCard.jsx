import React from "react";
import { formatRange } from "../utils/date";

const Pill = ({ children }) => <span className="event-card__pill">{children}</span>;

export default function EventCard({ ev, onOpen }) {
    const soldOut = ev.spots_left <= 0;
    return (
        <article className="event-card">
            <div className="event-card__cover" style={{ backgroundImage: `url(${ev.cover})` }} />
            <div className="event-card__body">
                <div className="event-card__header">
                    <h3 className="event-card__title">{ev.title}</h3>
                    <span className={`event-card__badge ${soldOut ? "event-card__badge--soldout" : ""}`}>
                        {soldOut ? "Нет мест" : `Осталось: ${ev.spots_left}`}
                    </span>
                </div>
                <div className="event-card__meta">
                    <Pill>📍 {ev.city}</Pill>
                    <Pill>🎯 {ev.level}</Pill>
                    <Pill>🕒 {formatRange(ev.date_start, ev.date_end)}</Pill>
                </div>
                <div className="event-card__footer">
                    <div className="event-card__price">{ev.price} ₽</div>
                    <button
                        type="button"
                        onClick={() => onOpen(ev.id)}
                        disabled={soldOut}
                        className="button button--primary event-card__action"
                    >
                        Записаться
                    </button>
                </div>
            </div>
        </article>
    );
}
