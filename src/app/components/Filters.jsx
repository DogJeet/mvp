import React, { useEffect, useState } from "react";

const cityOptions = [
    { label: "Все города", value: "ALL" },
    { label: "Москва", value: "Москва" },
    { label: "Санкт-Петербург", value: "Санкт-Петербург" },
];

const levelOptions = [
    { label: "Любой", value: "ANY" },
    { label: "Новички", value: "Новички" },
    { label: "Средний", value: "Средний" },
    { label: "Все уровни", value: "Все уровни" },
    { label: "Продвинутый", value: "Продвинутый" },
];

export default function Filters({ onChange, initial }) {
    const [city, setCity] = useState(initial?.city || "ALL");
    const [level, setLevel] = useState(initial?.level || "ANY");
    const [query, setQuery] = useState(initial?.q || "");

    useEffect(() => {
        setCity(initial?.city || "ALL");
        setLevel(initial?.level || "ANY");
        setQuery(initial?.q || "");
    }, [initial?.city, initial?.level, initial?.q]);

    const apply = (event) => {
        event?.preventDefault?.();
        onChange({
            city: city === "ALL" ? undefined : city,
            level: level === "ANY" ? undefined : level,
            q: query.trim() || undefined,
        });
    };

    return (
        <form className="flex flex-col gap-3" onSubmit={apply}>
            <label className="relative w-full text-sm">
                <span className="sr-only">Поиск</span>
                <input
                    type="search"
                    placeholder="Поиск по названию, клубу..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </label>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                    <span className="opacity-70 text-xs">Город</span>
                    <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                        {cityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="opacity-70 text-xs">Уровень</span>
                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                        {levelOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <button type="submit" className="h-11 rounded-xl bg-slate-900 text-white font-medium">
                Применить фильтры
            </button>
        </form>
    );
}
