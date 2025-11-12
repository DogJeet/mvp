import { Fragment, useEffect, useMemo, useState } from "react";
import TeacherCard from "./TeacherCard";
import { getTeachers, type TeacherSummary } from "../lib/api";

type SortOrder = "desc" | "asc";

type TeacherListProps = {
    onSelect: (teacherId: string, teacherName: string) => void;
    refreshKey?: number;
};

const SORT_OPTIONS: Record<SortOrder, { label: string; value: SortOrder }> = {
    desc: { label: "Сначала высокий рейтинг", value: "desc" },
    asc: { label: "Сначала низкий рейтинг", value: "asc" },
};

export default function TeacherList({ onSelect, refreshKey }: TeacherListProps) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [allTeachers, setAllTeachers] = useState<TeacherSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => window.clearTimeout(handle);
    }, [search]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        getTeachers()
            .then((data) => {
                if (!active) return;
                setAllTeachers(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Не удалось загрузить список учителей");
                setAllTeachers([]);
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [refreshKey]);

    const teachers = useMemo(() => {
        const query = debouncedSearch.toLowerCase();
        const filtered = query
            ? allTeachers.filter((teacher) => teacher.full_name.toLowerCase().includes(query))
            : allTeachers.slice();

        return filtered.sort((a, b) => {
            const ratingA = a.avg_rating ?? 0;
            const ratingB = b.avg_rating ?? 0;
            if (ratingA === ratingB) {
                return (b.reviews_count ?? 0) - (a.reviews_count ?? 0);
            }
            return sortOrder === "desc" ? ratingB - ratingA : ratingA - ratingB;
        });
    }, [allTeachers, debouncedSearch, sortOrder]);

    const emptyState = !loading && !error && teachers.length === 0;

    const helperText = useMemo(() => {
        if (loading) return "Загружаем преподавателей...";
        if (error) return error;
        if (emptyState) return "Нет учителей";
        return null;
    }, [loading, error, emptyState]);

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex w-full flex-col gap-2 sm:max-w-xs">
                    <span className="text-sm font-medium text-subtext">Поиск</span>
                    <input
                        className="input"
                        type="search"
                        placeholder="Введите имя"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </label>
                <label className="flex w-full flex-col gap-2 sm:max-w-xs">
                    <span className="text-sm font-medium text-subtext">Сортировка</span>
                    <select
                        className="input"
                        value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                    >
                        <option value="desc">{SORT_OPTIONS.desc.label}</option>
                        <option value="asc">{SORT_OPTIONS.asc.label}</option>
                    </select>
                </label>
            </div>

            {helperText && <p className="text-sm text-subtext">{helperText}</p>}

            <div className="grid gap-3">
                {teachers.map((teacher) => (
                    <Fragment key={teacher.id}>
                        <TeacherCard
                            name={teacher.full_name}
                            rating={teacher.avg_rating}
                            count={teacher.reviews_count}
                            onClick={() => onSelect(teacher.id.toString(), teacher.full_name)}
                        />
                    </Fragment>
                ))}
            </div>
        </section>
    );
}
