import { Fragment, useEffect, useMemo, useState } from "react";
import TeacherCard from "./TeacherCard";
import { getTeachers, type TeacherSummary } from "../lib/api";

type SortOrder = "desc" | "asc";

type TeacherListProps = {
    onSelect: (teacherId: string, teacherName: string) => void;
};

const SORT_OPTIONS: Record<SortOrder, { label: string; value: string }> = {
    desc: { label: "Сначала высокий рейтинг", value: "-rating" },
    asc: { label: "Сначала низкий рейтинг", value: "rating" },
};

export default function TeacherList({ onSelect }: TeacherListProps) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => window.clearTimeout(handle);
    }, [search]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        getTeachers({
            search: debouncedSearch || undefined,
            sort: SORT_OPTIONS[sortOrder].value,
            signal: controller.signal,
        })
            .then((data) => {
                if (!controller.signal.aborted) {
                    setTeachers(data);
                }
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                setError(err instanceof Error ? err.message : "Не удалось загрузить список учителей");
                setTeachers([]);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [debouncedSearch, sortOrder]);

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
                            onClick={() => onSelect(teacher.id, teacher.full_name)}
                        />
                    </Fragment>
                ))}
            </div>
        </section>
    );
}
