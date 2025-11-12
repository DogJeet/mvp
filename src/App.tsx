import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AlreadyRated from "./components/AlreadyRated";
import ReviewForm from "./components/ReviewForm";
import TeacherList from "./components/TeacherList";
import AdminDashboard from "./components/admin/AdminDashboard";
import useTgTheme from "./lib/useTgTheme";
import { adminLogin, fetchAdminSession } from "./lib/api";

type ScreenState =
    | { type: "list" }
    | { type: "review"; teacherId: number; teacherName: string }
    | { type: "rated" };

export default function App() {
    useTgTheme();

    const initialPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [screen, setScreen] = useState<ScreenState>({ type: "list" });
    const [teacherListVersion, setTeacherListVersion] = useState(0);
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
    const [passphrase, setPassphrase] = useState("");
    const [passphraseError, setPassphraseError] = useState<string | null>(null);
    const [passphraseSubmitting, setPassphraseSubmitting] = useState(false);
    const [attemptTimestamps, setAttemptTimestamps] = useState<number[]>([]);
    const [adminStatus, setAdminStatus] = useState<"idle" | "checking" | "authorized" | "unauthorized">("idle");
    const [adminCheckError, setAdminCheckError] = useState<string | null>(null);
    const titleTapState = useRef<{ count: number; timeout: number | null }>({
        count: 0,
        timeout: null,
    });

    const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 минут
    const MAX_ATTEMPTS = 5;
    const TAP_RESET_DELAY = 1200; // 1.2 секунды, чтобы отслеживать серию нажатий

    const isAdminDashboard = currentPath === "/admin/dashboard";

    const navigate = useCallback(
        (path: string, options?: { replace?: boolean }) => {
            if (typeof window === "undefined") {
                setCurrentPath(path);
                return;
            }

            if (options?.replace) {
                window.history.replaceState(null, "", path);
            } else {
                window.history.pushState(null, "", path);
            }

            setCurrentPath(path);
        },
        []
    );

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    const showBack = !isAdminDashboard && screen.type !== "list";

    const headerSubtitle = useMemo(() => {
        if (isAdminDashboard) {
            return "Панель управления преподавателями";
        }
        if (screen.type === "review") {
            return `Оставьте отзыв о преподавателе ${screen.teacherName}`;
        }
        if (screen.type === "rated") {
            return "Спасибо за оценку!";
        }
        return "Выберите преподавателя и оставьте отзыв";
    }, [isAdminDashboard, screen]);

    const openReview = useCallback((teacherId: string, teacherName: string) => {
        const numericId = Number(teacherId);
        if (Number.isNaN(numericId)) {
            console.error("Невозможно открыть форму отзыва: некорректный идентификатор преподавателя", teacherId);
            return;
        }
        setScreen({ type: "review", teacherId: numericId, teacherName });
    }, []);

    const refreshTeachers = useCallback(() => {
        setTeacherListVersion((version) => version + 1);
    }, []);

    const showList = useCallback(() => {
        setScreen({ type: "list" });
    }, []);

    const markRated = useCallback(() => {
        setScreen({ type: "rated" });
    }, []);

    const resetTapState = useCallback(() => {
        const state = titleTapState.current;
        if (state.timeout !== null) {
            window.clearTimeout(state.timeout);
        }
        state.count = 0;
        state.timeout = null;
    }, []);

    useEffect(() => resetTapState, [resetTapState]);

    const handleTitleClick = useCallback(() => {
        if (isAdminDashboard) {
            return;
        }

        const state = titleTapState.current;

        if (state.timeout !== null) {
            window.clearTimeout(state.timeout);
        }

        const nextCount = state.count + 1;
        state.count = nextCount;

        if (nextCount >= 4) {
            resetTapState();
            setPassphrase("");
            setPassphraseError(null);
            setIsManagerModalOpen(true);
            return;
        }

        state.timeout = window.setTimeout(() => {
            state.count = 0;
            state.timeout = null;
        }, TAP_RESET_DELAY);
    }, [isAdminDashboard, resetTapState]);

    const activeAttempts = useMemo(() => {
        const now = Date.now();
        return attemptTimestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
    }, [attemptTimestamps, RATE_LIMIT_WINDOW]);

    const isRateLimited = activeAttempts.length >= MAX_ATTEMPTS;
    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - activeAttempts.length);

    const closeManagerModal = useCallback(() => {
        setIsManagerModalOpen(false);
        setPassphrase("");
        setPassphraseError(null);
        setPassphraseSubmitting(false);
    }, []);

    useEffect(() => {
        if (!isManagerModalOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeManagerModal();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isManagerModalOpen, closeManagerModal]);

    const handlePassphraseSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (passphraseSubmitting) {
                return;
            }

            const trimmed = passphrase.trim();
            const now = Date.now();
            const filtered = attemptTimestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);

            if (filtered.length >= MAX_ATTEMPTS) {
                setAttemptTimestamps(filtered);
                setPassphraseError("Превышено количество попыток. Попробуйте позже.");
                return;
            }

            if (!trimmed) {
                setAttemptTimestamps(filtered);
                setPassphraseError("Введите код доступа.");
                return;
            }

            const updated = [...filtered, now];
            setAttemptTimestamps(updated);
            setPassphraseError(null);
            setPassphraseSubmitting(true);

            try {
                const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
                await adminLogin(trimmed, userAgent);
                closeManagerModal();
                navigate("/admin/dashboard");
            } catch (error) {
                if (error instanceof Error) {
                    setPassphraseError(error.message);
                } else {
                    setPassphraseError("Не удалось проверить код. Попробуйте позже.");
                }
            } finally {
                setPassphraseSubmitting(false);
            }
        },
        [MAX_ATTEMPTS, RATE_LIMIT_WINDOW, attemptTimestamps, closeManagerModal, navigate, passphrase, passphraseSubmitting]
    );

    useEffect(() => {
        if (!isAdminDashboard) {
            setAdminStatus("idle");
            setAdminCheckError(null);
            return;
        }

        let cancelled = false;
        setAdminStatus("checking");
        setAdminCheckError(null);

        fetchAdminSession()
            .then(() => {
                if (cancelled) {
                    return;
                }
                setAdminStatus("authorized");
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }
                setAdminStatus("unauthorized");
                setAdminCheckError(error instanceof Error ? error.message : "Доступ запрещен");
                navigate("/", { replace: true });
            });

        return () => {
            cancelled = true;
        };
    }, [isAdminDashboard, navigate]);

    const handleAdminLoggedOut = useCallback(() => {
        setAdminStatus("idle");
        setAdminCheckError(null);
        navigate("/", { replace: true });
        setScreen({ type: "list" });
        refreshTeachers();
    }, [navigate, refreshTeachers]);

    const adminContent = useMemo(() => {
        if (!isAdminDashboard) {
            return null;
        }

        if (adminStatus === "checking" || adminStatus === "idle") {
            return <p className="text-sm text-subtext">Проверяем доступ...</p>;
        }

        if (adminStatus === "authorized") {
            return <AdminDashboard onLoggedOut={handleAdminLoggedOut} onDataChanged={refreshTeachers} />;
        }

        if (adminStatus === "unauthorized") {
            return (
                <p className="text-sm text-red-400">
                    {adminCheckError ?? "Недостаточно прав для просмотра панели."}
                </p>
            );
        }

        return null;
    }, [adminCheckError, adminStatus, handleAdminLoggedOut, isAdminDashboard, refreshTeachers]);

    const userContent = useMemo(() => {
        if (isAdminDashboard) {
            return null;
        }

        return (
            <>
                {screen.type === "list" && <TeacherList onSelect={openReview} refreshKey={teacherListVersion} />}
                {screen.type === "review" && (
                    <ReviewForm
                        teacherId={screen.teacherId}
                        onSuccess={() => {
                            refreshTeachers();
                            markRated();
                        }}
                        onAlreadyRated={markRated}
                    />
                )}
                {screen.type === "rated" && <AlreadyRated onBack={showList} />}
            </>
        );
    }, [isAdminDashboard, markRated, openReview, refreshTeachers, screen, showList, teacherListVersion]);

    return (
        <div className="min-h-screen bg-[rgb(var(--bg))] text-text transition-colors">
            <header className="sticky top-0 z-10 border-b border-white/5 bg-[rgba(var(--bg),0.72)] backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4">
                    {showBack && (
                        <button type="button" className="btn btn-ghost" onClick={showList}>
                            Назад
                        </button>
                    )}
                    <div className="flex flex-col">
                        <h1
                            className="text-lg font-semibold text-text"
                            onClick={handleTitleClick}
                        >
                            Рейтинг учителей
                        </h1>
                        <span className="text-sm text-subtext">{headerSubtitle}</span>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
                {isAdminDashboard ? adminContent : userContent}
            </main>

            {isManagerModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.45)] px-4"
                    onClick={closeManagerModal}
                >
                    <div
                        className="card max-w-sm flex-1 gap-4 p-6"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="manager-passphrase-title"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 id="manager-passphrase-title" className="text-lg font-semibold text-text">
                                    Код доступа
                                </h2>
                                <p className="text-sm text-subtext">
                                    Введите код, чтобы открыть панель менеджера.
                                </p>
                            </div>
                            <button type="button" className="btn btn-ghost" onClick={closeManagerModal}>
                                Закрыть
                            </button>
                        </div>

                        <form className="flex flex-col gap-4" onSubmit={handlePassphraseSubmit}>
                            <label className="flex flex-col gap-2 text-sm text-subtext">
                                Код доступа
                                <input
                                    type="password"
                                    autoComplete="off"
                                    className="input"
                                    value={passphrase}
                                    onChange={(event) => setPassphrase(event.target.value)}
                                    disabled={isRateLimited || passphraseSubmitting}
                                    placeholder="••••••"
                                />
                            </label>
                            {passphraseError && (
                                <p className="text-sm text-red-400">{passphraseError}</p>
                            )}
                            {isRateLimited && (
                                <p className="text-xs text-subtext">
                                    Лимит попыток исчерпан. Попробуйте позднее.
                                </p>
                            )}
                            {!isRateLimited && attemptsLeft < MAX_ATTEMPTS && (
                                <p className="text-xs text-subtext">
                                    Осталось попыток: {attemptsLeft}.
                                </p>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isRateLimited || passphraseSubmitting}
                                >
                                    {passphraseSubmitting ? "Проверяем..." : "Отправить"}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={closeManagerModal}>
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
