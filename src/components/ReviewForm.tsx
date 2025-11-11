import { FormEvent, useMemo, useState } from "react";

type ReviewFormProps = {
    teacherId: number;
    onSuccess: () => void;
    onAlreadyRated: () => void;
};

const MIN_COMMENT_LENGTH = 10;
const MAX_COMMENT_LENGTH = 800;
const RATINGS = [1, 2, 3, 4, 5] as const;

const readTelegramInitData = () => {
    if (typeof window === "undefined") {
        return "";
    }

    const telegram = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram;
    return telegram?.WebApp?.initData ?? "";
};

const extractErrorMessage = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            const payload = await response.json();
            if (payload && typeof payload === "object") {
                const message = (payload as Record<string, unknown>).message;
                const error = (payload as Record<string, unknown>).error;
                if (typeof message === "string" && message.trim()) {
                    return message;
                }
                if (typeof error === "string" && error.trim()) {
                    return error;
                }
            }
        } catch (error) {
            console.error("Failed to parse JSON error response", error);
        }
    } else {
        try {
            const text = await response.text();
            if (text.trim()) {
                return text;
            }
        } catch (error) {
            console.error("Failed to read text error response", error);
        }
    }

    return `Ошибка ${response.status}`;
};

export default function ReviewForm({ teacherId, onSuccess, onAlreadyRated }: ReviewFormProps) {
    const [rating, setRating] = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const trimmedComment = useMemo(() => comment.trim(), [comment]);

    const isRatingValid = rating !== null && rating >= 1 && rating <= 5;
    const isCommentValid =
        trimmedComment.length >= MIN_COMMENT_LENGTH && trimmedComment.length <= MAX_COMMENT_LENGTH;
    const isValid = isRatingValid && isCommentValid;

    const currentRating = hoverRating ?? rating ?? 0;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isValid || submitting || rating === null) {
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    teacher_id: teacherId,
                    rating,
                    comment: trimmedComment,
                    initData: readTelegramInitData(),
                }),
            });

            if (response.status === 201) {
                onSuccess();
                return;
            }

            if (response.status === 409) {
                onAlreadyRated();
                return;
            }

            if (response.status === 400 || response.status === 401) {
                const message = await extractErrorMessage(response);
                setError(message);
                return;
            }

            const fallbackMessage = await extractErrorMessage(response);
            setError(fallbackMessage || "Не удалось отправить отзыв");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Не удалось отправить отзыв");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="space-y-3">
                <header className="space-y-1">
                    <h2 className="text-xl font-semibold text-text">Оценка преподавателя</h2>
                    <p className="text-sm text-subtext">Выберите количество звёзд и добавьте комментарий.</p>
                </header>

                <div className="flex items-center gap-2" role="radiogroup" aria-label="Оценка от 1 до 5">
                    {RATINGS.map((value) => {
                        const isActive = value <= currentRating;
                        return (
                            <button
                                key={value}
                                type="button"
                                className={`text-2xl transition-colors ${
                                    isActive ? "text-[rgb(var(--primary))]" : "text-subtext"
                                }`}
                                aria-label={`Поставить оценку ${value}`}
                                aria-pressed={rating === value}
                                onClick={() => setRating(value)}
                                onMouseEnter={() => setHoverRating(value)}
                                onMouseLeave={() => setHoverRating(null)}
                            >
                                ★
                            </button>
                        );
                    })}
                </div>
                {!isRatingValid && (
                    <p className="text-xs text-subtext">Пожалуйста, выберите оценку от 1 до 5 звёзд.</p>
                )}
            </section>

            <section className="space-y-2">
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-subtext">Комментарий</span>
                    <textarea
                        className="textarea"
                        placeholder="Расскажите, что вам понравилось"
                        value={comment}
                        maxLength={MAX_COMMENT_LENGTH}
                        onChange={(event) => setComment(event.target.value)}
                        rows={5}
                        required
                    />
                </label>
                <div className="flex justify-between text-xs text-subtext">
                    <span>
                        Минимум {MIN_COMMENT_LENGTH} символов. Сейчас: {trimmedComment.length}.
                    </span>
                    <span>Максимум {MAX_COMMENT_LENGTH}.</span>
                </div>
                {!isCommentValid && trimmedComment.length > 0 && (
                    <p className="text-xs text-red-400">
                        Комментарий должен содержать от {MIN_COMMENT_LENGTH} до {MAX_COMMENT_LENGTH} символов.
                    </p>
                )}
            </section>

            <div className="space-y-3">
                <button type="submit" className="btn btn-primary" disabled={!isValid || submitting}>
                    {submitting ? "Отправляем..." : "Отправить"}
                </button>
                {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
        </form>
    );
}
