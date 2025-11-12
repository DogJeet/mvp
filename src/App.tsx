import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AlreadyRated from "./components/AlreadyRated";
import ReviewForm from "./components/ReviewForm";
import TeacherList from "./components/TeacherList";
import useTgTheme from "./lib/useTgTheme";

type ScreenState =
    | { type: "list" }
    | { type: "review"; teacherId: number; teacherName: string }
    | { type: "rated" };

export default function App() {
    useTgTheme();

    const [screen, setScreen] = useState<ScreenState>({ type: "list" });
    const [teacherListVersion, setTeacherListVersion] = useState(0);
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
    const [passphrase, setPassphrase] = useState("");
    const [passphraseError, setPassphraseError] = useState<string | null>(null);
    const [attemptTimestamps, setAttemptTimestamps] = useState<number[]>([]);
    const longPressTimeout = useRef<number | null>(null);

    const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 минут
    const MAX_ATTEMPTS = 5;

    const showBack = screen.type !== "list";

    const headerSubtitle = useMemo(() => {
        if (screen.type === "review") {
            return `Оставьте отзыв о преподавателе ${screen.teacherName}`;
        }
        if (screen.type === "rated") {
            return "Спасибо за оценку!";
        }
        return "Выберите преподавателя и оставьте отзыв";
    }, [screen]);

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

    const cancelLongPress = useCallback(() => {
        if (longPressTimeout.current !== null) {
            window.clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
    }, []);

    useEffect(() => cancelLongPress, [cancelLongPress]);

    const handleTitlePressStart = useCallback(() => {
        if (longPressTimeout.current !== null) {
            return;
        }
        longPressTimeout.current = window.setTimeout(() => {
            longPressTimeout.current = null;
            setPassphrase("");
            setPassphraseError(null);
            setIsManagerModalOpen(true);
        }, 3500);
    }, []);

    const handleTitlePressEnd = useCallback(() => {
        cancelLongPress();
    }, [cancelLongPress]);

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

    type ManagerWindow = Window & {
        __handleManagerPassphrase?: (code: string) => boolean | Promise<boolean>;
    };

    const verifyPassphrase = useCallback(
        (code: string) => {
            const managerWindow = window as ManagerWindow;
            const handler = managerWindow.__handleManagerPassphrase;

            if (typeof handler !== "function") {
                setPassphraseError("Неверный код доступа.");
                return;
            }

            try {
                const result = handler(code);

                if (result instanceof Promise) {
                    result
                        .then((success) => {
                            if (success) {
                                window.dispatchEvent(new CustomEvent("manager-access-granted"));
                                closeManagerModal();
                            } else {
                                setPassphraseError("Неверный код доступа.");
                            }
                        })
                        .catch(() => {
                            setPassphraseError("Не удалось проверить код. Попробуйте позже.");
                        });
                } else if (result) {
                    window.dispatchEvent(new CustomEvent("manager-access-granted"));
                    closeManagerModal();
                } else {
                    setPassphraseError("Неверный код доступа.");
                }
            } catch (error) {
                setPassphraseError("Не удалось проверить код. Попробуйте позже.");
            }
        },
        [closeManagerModal]
    );

    const handlePassphraseSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

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
            verifyPassphrase(trimmed);
        },
        [MAX_ATTEMPTS, RATE_LIMIT_WINDOW, attemptTimestamps, passphrase, verifyPassphrase]
    );

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
                            onPointerDown={handleTitlePressStart}
                            onPointerUp={handleTitlePressEnd}
                            onPointerLeave={handleTitlePressEnd}
                            onPointerCancel={handleTitlePressEnd}
                        >
                            Рейтинг учителей
                        </h1>
                        <span className="text-sm text-subtext">{headerSubtitle}</span>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
                {screen.type === "list" && (
                    <TeacherList onSelect={openReview} refreshKey={teacherListVersion} />
                )}
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
                                    disabled={isRateLimited}
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
                                <button type="submit" className="btn btn-primary" disabled={isRateLimited}>
                                    Отправить
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
