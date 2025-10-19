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

export default function Filters({ onChange, initial, className = "" }) {
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
        <form className={`filters-panel ${className}`.trim()} onSubmit={apply}>
            <label className="filters-search">
                <span className="sr-only">Поиск</span>
                <input
                    type="search"
                    placeholder="Поиск по названию, клубу..."
                    className="filters-input filters-input--search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </label>
            <div className="filters-row">
                <label className="filters-field">
                    <span className="filters-label">Город</span>
                    <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="filters-select"
                    >
                        {cityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="filters-field">
                    <span className="filters-label">Уровень</span>
                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="filters-select"
                    >
                        {levelOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <button type="submit" className="button button--primary filters-button">
                Применить фильтры
            </button>
        </form>
    );
}
