import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
    TeacherSummary,
    TeacherReviewRecord,
    getTeachers,
    createTeacher,
    deleteTeacher,
    fetchTeacherReviews,
    adminLogout,
    fetchSettings,
    updateSettings,
    SettingsMap,
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

type AdminTab = "teachers" | "settings";

export default function AdminDashboard({ onLoggedOut, onDataChanged }: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<AdminTab>("teachers");
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

    const [settings, setSettings] = useState<SettingsMap | null>(null);
    const [settingsDraft, setSettingsDraft] = useState<SettingsMap | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [settingsFormError, setSettingsFormError] = useState<string | null>(null);
    const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsVersion, setSettingsVersion] = useState(0);

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
        if (activeTab !== "teachers") {
            return;
        }

        const cleanup = loadTeachers();
        return cleanup;
    }, [activeTab, loadTeachers, listVersion]);

    useEffect(() => {
        if (activeTab !== "settings") {
            return;
        }

        let cancelled = false;
        setSettingsLoading(true);
        setSettingsError(null);
        setSettingsFormError(null);
        setSettingsSuccess(null);

        fetchSettings()
            .then((data) => {
                if (cancelled) return;
                setSettings(data);
                setSettingsDraft(data);
            })
            .catch((error) => {
                if (cancelled) return;
                const message = error instanceof Error ? error.message : "Не удалось загрузить настройки";
                setSettingsError(message);
                setSettings(null);
                setSettingsDraft(null);
            })
            .finally(() => {
                if (!cancelled) {
                    setSettingsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [activeTab, settingsVersion]);

    const handleSettingsFieldChange = useCallback(
        <K extends keyof SettingsMap>(key: K, value: SettingsMap[K]) => {
            setSettingsDraft((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    [key]: value,
                } as SettingsMap;
            });
            setSettingsFormError(null);
            setSettingsSuccess(null);
        },
        []
    );

    const handleSettingsToggle = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            const normalized = event.target.value === "true" ? "true" : "false";
            handleSettingsFieldChange("one_review_per_teacher", normalized);
        },
        [handleSettingsFieldChange]
    );

    const reloadSettings = useCallback(() => {
        setSettingsVersion((version) => version + 1);
    }, []);

    const handleSettingsSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!settingsDraft || settingsSaving) {
                return;
            }

            const updates: Partial<Record<keyof SettingsMap, string | boolean>> = {};
            const errors: string[] = [];

            const minLenRaw = settingsDraft.min_comment_length.trim();
            const minLen = Number.parseInt(minLenRaw, 10);
            if (!Number.isInteger(minLen) || minLen < 1 || minLen > 800) {
                errors.push("Минимальная длина комментария должна быть от 1 до 800 символов");
            } else if (minLenRaw !== settings?.min_comment_length) {
                updates.min_comment_length = String(minLen);
            }

            const maxRatingRaw = settingsDraft.max_rating.trim();
            const maxRating = Number.parseInt(maxRatingRaw, 10);
            if (!Number.isInteger(maxRating) || maxRating < 1 || maxRating > 10) {
                errors.push("Максимальная оценка должна быть числом от 1 до 10");
            } else if (maxRatingRaw !== settings?.max_rating) {
                updates.max_rating = String(maxRating);
            }

            const reviewLimitRaw = settingsDraft.one_review_per_teacher.trim().toLowerCase();
            if (reviewLimitRaw !== "true" && reviewLimitRaw !== "false") {
                errors.push("Параметр 'Один отзыв на преподавателя' должен быть true или false");
            } else if (reviewLimitRaw !== settings?.one_review_per_teacher) {
                updates.one_review_per_teacher = reviewLimitRaw;
            }

            if (errors.length > 0) {
                setSettingsFormError(errors[0]);
                setSettingsSuccess(null);
                return;
            }

            if (Object.keys(updates).length === 0) {
                setSettingsFormError(null);
                setSettingsSuccess("Изменений не обнаружено");
                return;
            }

            setSettingsSaving(true);
            setSettingsFormError(null);
            setSettingsSuccess(null);

            try {
                const updated = await updateSettings(updates);
                setSettings(updated);
                setSettingsDraft(updated);
                setSettingsSuccess("Настройки сохранены");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Не удалось сохранить настройки";
                setSettingsFormError(message);
            } finally {
                setSettingsSaving(false);
            }
        },
        [settingsDraft, settingsSaving, settings]
    );

    const handleSettingsReset = useCallback(() => {
        if (settings) {
            setSettingsDraft(settings);
        }
        setSettingsFormError(null);
        setSettingsSuccess(null);
    }, [settings]);

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

            <nav className="flex flex-wrap gap-2">
                <button
                    type="button"
                    className={`btn ${activeTab === "teachers" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setActiveTab("teachers")}
                >
                    Преподаватели
                </button>
                <button
                    type="button"
                    className={`btn ${activeTab === "settings" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setActiveTab("settings")}
                >
                    Настройки
                </button>
            </nav>

            {activeTab === "teachers" && (
                <>
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
                </>
            )}

            {activeTab === "settings" && (
                <section className="card space-y-4 p-6">
                    <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-text">Настройки приложения</h2>
                            <p className="text-sm text-subtext">
                                Управляйте ограничениями отзывов и параметрами рейтинга.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={reloadSettings}
                            disabled={settingsLoading}
                        >
                            {settingsLoading ? "Обновляем..." : "Обновить"}
                        </button>
                    </header>

                    {settingsError && <p className="text-sm text-red-400">{settingsError}</p>}
                    {settingsLoading && <p className="text-sm text-subtext">Загружаем настройки...</p>}

                    {!settingsLoading && settingsDraft && (
                        <form className="space-y-4" onSubmit={handleSettingsSubmit}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm text-subtext">Минимальная длина комментария</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={800}
                                        className="input"
                                        value={settingsDraft.min_comment_length}
                                        onChange={(event) =>
                                            handleSettingsFieldChange("min_comment_length", event.target.value)
                                        }
                                        disabled={settingsSaving}
                                        required
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm text-subtext">Максимальная оценка</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        className="input"
                                        value={settingsDraft.max_rating}
                                        onChange={(event) =>
                                            handleSettingsFieldChange("max_rating", event.target.value)
                                        }
                                        disabled={settingsSaving}
                                        required
                                    />
                                </label>
                                <label className="flex flex-col gap-2 sm:col-span-2">
                                    <span className="text-sm text-subtext">Один отзыв на преподавателя</span>
                                    <select
                                        className="input"
                                        value={settingsDraft.one_review_per_teacher}
                                        onChange={handleSettingsToggle}
                                        disabled={settingsSaving}
                                    >
                                        <option value="true">Включено</option>
                                        <option value="false">Выключено</option>
                                    </select>
                                </label>
                            </div>

                            {settingsFormError && (
                                <p className="text-sm text-red-400">{settingsFormError}</p>
                            )}
                            {settingsSuccess && (
                                <p className="text-sm text-[rgb(var(--accent))]">{settingsSuccess}</p>
                            )}

                            <div className="flex flex-wrap gap-3">
                                <button type="submit" className="btn btn-primary" disabled={settingsSaving}>
                                    {settingsSaving ? "Сохраняем..." : "Сохранить"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={handleSettingsReset}
                                    disabled={settingsSaving}
                                >
                                    Сбросить изменения
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            )}
        </div>
    );
}
