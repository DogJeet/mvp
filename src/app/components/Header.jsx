import React from "react";

export default function Header({ onOpenProfile, onCloseApp }) {
    return (
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur">
            <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg" />
                <div>
                    <div className="text-lg font-semibold leading-none">GameUp</div>
                    <div className="text-[12px] opacity-70">Регистрация на игры и события</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
                        onClick={onOpenProfile}
                    >
                        Профиль
                    </button>
                    {onCloseApp && (
                        <button
                            type="button"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            onClick={onCloseApp}
                        >
                            Закрыть
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
