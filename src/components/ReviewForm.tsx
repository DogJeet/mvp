import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { sendReview } from "../lib/api";

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

export default function ReviewForm({ teacherId, onSuccess, onAlreadyRated }: ReviewFormProps) {
    const [rating, setRating] = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<
        | { type: "idle" }
        | { type: "success"; message: string }
        | { type: "already"; message: string }
        | { type: "error"; message: string }
    >({ type: "idle" });
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const setStatusSafe = (
        next:
            | { type: "idle" }
            | { type: "success"; message: string }
            | { type: "already"; message: string }
            | { type: "error"; message: string }
    ) => {
        if (isMountedRef.current) {
            setStatus(next);
        }
    };

    const setSubmittingSafe = (value: boolean) => {
        if (isMountedRef.current) {
            setSubmitting(value);
        }
    };

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

        setSubmittingSafe(true);
        setStatusSafe({ type: "idle" });

        try {
            const reviewStatus = await sendReview({
                teacher_id: teacherId,
                rating,
                comment: trimmedComment,
                initData: readTelegramInitData(),
            });

            if (reviewStatus === "ok") {
                setStatusSafe({ type: "success", message: "Спасибо! Ваш отзыв отправлен." });
                await new Promise((resolve) => setTimeout(resolve, 600));
                setSubmittingSafe(false);
                onSuccess();
                return;
            }

            if (reviewStatus === "already") {
                setStatusSafe({
                    type: "already",
                    message: "Вы уже оставляли отзыв для этого преподавателя.",
                });
                await new Promise((resolve) => setTimeout(resolve, 600));
                setSubmittingSafe(false);
                onAlreadyRated();
                return;
            }
        } catch (err) {
            if (err instanceof Error) {
                setStatusSafe({ type: "error", message: err.message });
            } else {
                setStatusSafe({ type: "error", message: "Не удалось отправить отзыв" });
            }
            setSubmittingSafe(false);
            return;
        }

        setSubmittingSafe(false);
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
                {status.type === "success" && (
                    <p className="text-sm text-[rgb(var(--accent))]">{status.message}</p>
                )}
                {status.type === "already" && (
                    <p className="text-sm text-yellow-400">{status.message}</p>
                )}
                {status.type === "error" && <p className="text-sm text-red-400">{status.message}</p>}
            </div>
        </form>
    );
}
