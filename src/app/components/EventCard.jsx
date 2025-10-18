import React from "react";
import { formatRange } from "../utils/date";

const Pill = ({ children }) => (
    <span className="rounded-full border px-3 py-1 text-xs opacity-90 bg-white/60">{children}</span>
);

export default function EventCard({ ev, onOpen }) {
    const soldOut = ev.spots_left <= 0;
    return (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
            <div className="h-40 md:h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${ev.cover})` }} />
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold leading-tight">{ev.title}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${soldOut ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>
                        {soldOut ? "Нет мест" : `Осталось: ${ev.spots_left}`}
                    </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm opacity-80">
                    <Pill>📍 {ev.city}</Pill>
                    <Pill>🎯 {ev.level}</Pill>
                    <Pill>🕒 {formatRange(ev.date_start, ev.date_end)}</Pill>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <div className="text-xl font-semibold">{ev.price} ₽</div>
                    <button
                        type="button"
                        onClick={() => onOpen(ev.id)}
                        disabled={soldOut}
                        className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50"
                    >
                        Записаться
                    </button>
                </div>
            </div>
        </div>
    );
}
