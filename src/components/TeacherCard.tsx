export type TeacherCardProps = {
    name: string;
    rating: number;
    count: number;
    onClick?: () => void;
    className?: string;
};

const formatRating = (value: number) => {
    if (!Number.isFinite(value)) return "—";
    return value.toFixed(1);
};

const formatCount = (value: number) => {
    if (!Number.isFinite(value)) return "0 отзывов";
    const formatted = new Intl.NumberFormat("ru-RU").format(Math.max(0, Math.floor(value)));
    return `${formatted} отзывов`;
};

const mergeClassNames = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" ");

export default function TeacherCard({ name, rating, count, onClick, className }: TeacherCardProps) {
    const content = (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-text">{name}</h3>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                    <span aria-hidden="true" className="text-lg leading-none">
                        ★
                    </span>
                    <span>{formatRating(rating)}</span>
                </span>
            </div>
            <p className="text-sm text-subtext">{formatCount(count)}</p>
        </div>
    );

    if (onClick) {
        return (
            <button type="button" className={mergeClassNames("card p-4 text-left", className)} onClick={onClick}>
                {content}
            </button>
        );
    }

    return <div className={mergeClassNames("card p-4", className)}>{content}</div>;
}
