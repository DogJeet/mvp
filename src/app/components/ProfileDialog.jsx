import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const levels = ["Новички", "Средний", "Продвинутый"];

export default function ProfileDialog({ open, onOpenChange }) {
    useEffect(() => {
        if (!open) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onOpenChange(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onClick={() => onOpenChange(false)}
        >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 text-lg font-semibold">Профиль</div>
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs opacity-70">Имя</span>
                            <input
                                defaultValue="Гость"
                                className="rounded-xl border border-slate-200 px-3 py-2"
                                placeholder="Имя"
                                name="name"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs opacity-70">Уровень</span>
                            <select defaultValue={levels[0]} className="rounded-xl border border-slate-200 px-3 py-2" name="level">
                                {levels.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="text-xs opacity-70">Телефон</span>
                        <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Телефон" name="phone" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="text-xs opacity-70">Комментарий</span>
                        <textarea
                            rows={3}
                            className="rounded-xl border border-slate-200 px-3 py-2"
                            placeholder="Пожелания / комментарий к записи (необязательно)"
                            name="comment"
                        />
                    </label>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Закрыть
                        </button>
                        <button type="submit" className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white">
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
