import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
    TeacherSummary,
    TeacherReviewRecord,
    getTeachers,
    createTeacher,
    deleteTeacher,
    fetchTeacherReviews,
    adminLogout,
} from "../../lib/api";

interface AdminDashboardProps {
    onLoggedOut: () => void;
    onDataChanged?: () => void;
}

const formatRating = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) {
        return "—";
    }
    return value.toFixed(1);
};

export default function AdminDashboard({ onLoggedOut, onDataChanged }: AdminDashboardProps) {
    const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [teachersError, setTeachersError] = useState<string | null>(null);
    const [listVersion, setListVersion] = useState(0);

    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccess, setAddSuccess] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
    const [selectedTeacherName, setSelectedTeacherName] = useState<string>("");
    const [reviews, setReviews] = useState<TeacherReviewRecord[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState<string | null>(null);

    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [logoutPending, setLogoutPending] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);

    const loadTeachers = useCallback(() => {
        let cancelled = false;
        setLoadingTeachers(true);
        setTeachersError(null);

        getTeachers()
            .then((data) => {
                if (cancelled) return;
                setTeachers(Array.isArray(data) ? data : []);
            })
            .catch((error) => {
                if (cancelled) return;
                const message =
                    error instanceof Error ? error.message : "Не удалось загрузить преподавателей";
                setTeachersError(message);
                setTeachers([]);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingTeachers(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const cleanup = loadTeachers();
        return cleanup;
    }, [loadTeachers, listVersion]);

    const resetReviews = useCallback(() => {
        setReviews([]);
        setReviewsError(null);
        setSelectedTeacherId(null);
        setSelectedTeacherName("");
    }, []);

    const handleAddTeacher = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (adding) return;

            const trimmedName = name.trim();
            const trimmedSubject = subject.trim();

            if (!trimmedName) {
                setAddError("Укажите имя преподавателя");
                setAddSuccess(null);
                return;
            }

            setAddError(null);
            setAddSuccess(null);
            setAdding(true);

            try {
                await createTeacher({
                    full_name: trimmedName,
                    subject: trimmedSubject ? trimmedSubject : undefined,
                });
                setName("");
                setSubject("");
                setAddSuccess("Преподаватель добавлен");
                setListVersion((version) => version + 1);
                resetReviews();
                onDataChanged?.();
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Не удалось добавить преподавателя";
                setAddError(message);
            } finally {
                setAdding(false);
            }
        },
        [adding, name, subject, onDataChanged, resetReviews]
    );

    const handleSelectReviews = useCallback(async (teacher: TeacherSummary) => {
        setSelectedTeacherId(teacher.id);
        setSelectedTeacherName(teacher.full_name);
        setReviews([]);
        setReviewsError(null);
        setReviewsLoading(true);

        try {
            const teacherReviews = await fetchTeacherReviews(teacher.id);
            setReviews(teacherReviews);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Не удалось загрузить отзывы";
            setReviewsError(message);
        } finally {
            setReviewsLoading(false);
        }
    }, []);

    const handleDeleteTeacher = useCallback(
        async (teacher: TeacherSummary) => {
            if (deletingId !== null) return;

            const confirmed =
                typeof window !== "undefined"
                    ? window.confirm(`Удалить преподавателя «${teacher.full_name}»?`)
                    : true;
            if (!confirmed) {
                return;
            }

            setDeletingId(teacher.id);
            setAddError(null);
            setAddSuccess(null);

            try {
                await deleteTeacher(teacher.id);
                setListVersion((version) => version + 1);
                if (selectedTeacherId === teacher.id) {
                    resetReviews();
                }
                onDataChanged?.();
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "Не удалось удалить преподавателя";
                setTeachersError(message);
            } finally {
                setDeletingId(null);
            }
        },
        [deletingId, onDataChanged, resetReviews, selectedTeacherId]
    );

    const handleLogout = useCallback(async () => {
        if (logoutPending) return;
        setLogoutPending(true);
        setLogoutError(null);

        try {
            await adminLogout();
            onLoggedOut();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Не удалось выйти";
            setLogoutError(message);
        } finally {
            setLogoutPending(false);
        }
    }, [logoutPending, onLoggedOut]);

    const teacherList = useMemo(() => {
        return [...teachers].sort((a, b) => {
            const ratingA = a.avg_rating ?? 0;
            const ratingB = b.avg_rating ?? 0;
            if (ratingA === ratingB) {
                return (b.reviews_count ?? 0) - (a.reviews_count ?? 0);
            }
            return ratingB - ratingA;
        });
    }, [teachers]);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-text">Админ-панель</h1>
                    <p className="text-sm text-subtext">
                        Управляйте преподавателями и следите за отзывами.
                    </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={handleLogout}
                        disabled={logoutPending}
                    >
                        {logoutPending ? "Выходим..." : "Выход"}
                    </button>
                    {logoutError && <span className="text-xs text-red-400">{logoutError}</span>}
                </div>
            </header>

            <section className="card space-y-4 p-6">
                <header className="space-y-1">
                    <h2 className="text-lg font-semibold text-text">Добавить преподавателя</h2>
                    <p className="text-sm text-subtext">Заполните форму, чтобы пополнить список.</p>
                </header>
                <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleAddTeacher}>
                    <label className="flex flex-col gap-2 sm:col-span-1">
                        <span className="text-sm text-subtext">Имя и фамилия</span>
                        <input
                            className="input"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Например, Анна Иванова"
                            disabled={adding}
                            required
                        />
                    </label>
                    <label className="flex flex-col gap-2 sm:col-span-1">
                        <span className="text-sm text-subtext">Предмет (необязательно)</span>
                        <input
                            className="input"
                            type="text"
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder="Математика"
                            disabled={adding}
                        />
                    </label>
                    <div className="sm:col-span-2 flex flex-col gap-2">
                        <button type="submit" className="btn btn-primary self-start" disabled={adding}>
                            {adding ? "Сохраняем..." : "Добавить"}
                        </button>
                        {addError && <span className="text-sm text-red-400">{addError}</span>}
                        {addSuccess && <span className="text-sm text-[rgb(var(--accent))]">{addSuccess}</span>}
                    </div>
                </form>
            </section>

            <section className="card space-y-4 p-6">
                <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-text">Список преподавателей</h2>
                        <p className="text-sm text-subtext">Нажмите, чтобы посмотреть отзывы или удалить.</p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setListVersion((version) => version + 1)}
                        disabled={loadingTeachers}
                    >
                        {loadingTeachers ? "Обновляем..." : "Обновить"}
                    </button>
                </header>
                {teachersError && <p className="text-sm text-red-400">{teachersError}</p>}
                {loadingTeachers && <p className="text-sm text-subtext">Загружаем список...</p>}
                {!loadingTeachers && teacherList.length === 0 && (
                    <p className="text-sm text-subtext">Пока нет добавленных преподавателей.</p>
                )}
                <ul className="space-y-3">
                    {teacherList.map((teacher) => {
                        const isSelected = teacher.id === selectedTeacherId;
                        return (
                            <li
                                key={teacher.id}
                                className={`card flex flex-col gap-3 p-4 transition-colors ${
                                    isSelected ? "border border-[rgb(var(--accent))]" : ""
                                }`}
                            >
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-lg font-semibold text-text">{teacher.full_name}</h3>
                                    {teacher.subject && (
                                        <span className="text-sm text-subtext">{teacher.subject}</span>
                                    )}
                                    <span className="text-sm text-subtext">
                                        Рейтинг: {formatRating(teacher.avg_rating)} · Отзывов: {teacher.reviews_count}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => handleSelectReviews(teacher)}
                                        disabled={reviewsLoading && isSelected}
                                    >
                                        {reviewsLoading && isSelected ? "Загружаем..." : "Отзывы"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost text-red-400"
                                        onClick={() => handleDeleteTeacher(teacher)}
                                        disabled={deletingId === teacher.id}
                                    >
                                        {deletingId === teacher.id ? "Удаляем..." : "Удалить"}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {selectedTeacherId !== null && (
                <section className="card space-y-4 p-6">
                    <header className="space-y-1">
                        <h2 className="text-lg font-semibold text-text">
                            Отзывы: {selectedTeacherName}
                        </h2>
                        <p className="text-sm text-subtext">
                            Последние комментарии учеников. Здесь отображаются только новые данные.
                        </p>
                    </header>
                    {reviewsError && <p className="text-sm text-red-400">{reviewsError}</p>}
                    {reviewsLoading && <p className="text-sm text-subtext">Загружаем отзывы...</p>}
                    {!reviewsLoading && reviews.length === 0 && !reviewsError && (
                        <p className="text-sm text-subtext">Пока отзывов нет.</p>
                    )}
                    <ul className="space-y-3">
                        {reviews.map((review) => (
                            <li key={review.id} className="card space-y-2 p-4">
                                <div className="flex items-center gap-2 text-sm text-subtext">
                                    <span className="font-semibold text-text">Оценка: {review.rating}</span>
                                    <span>·</span>
                                    <span>{new Date(review.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-sm leading-relaxed text-text">{review.comment}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
