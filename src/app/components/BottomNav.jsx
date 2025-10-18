import React from "react";
import { CalendarDays, UserRound } from "lucide-react";


export default function BottomNav({ active, onChange, onProfile }) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
            <div className="mx-auto max-w-md md:max-w-3xl lg:max-w-5xl grid grid-cols-3 h-14 text-sm">
                <button
                    className={`flex items-center justify-center gap-2 ${active === "catalog" ? "font-medium" : "opacity-70"}`}
                    onClick={() => onChange("catalog")}
                >
                    <CalendarDays className="h-5 w-5" />
                    <span className="hidden sm:inline">Каталог</span>
                </button>
                <button
                    className={`flex items-center justify-center gap-2 ${active === "my" ? "font-medium" : "opacity-70"}`}
                    onClick={() => onChange("my")}
                >
                    <span className="h-5 w-5 rounded-full border grid place-items-center text-[11px]">М</span>
                    <span className="hidden sm:inline">Мои</span>
                </button>
                <button className="flex items-center justify-center gap-2" onClick={onProfile}>
                    <UserRound className="h-5 w-5" />
                    <span className="hidden sm:inline">Профиль</span>
                </button>
            </div>
        </nav>
    );
}