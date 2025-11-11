import { useCallback, useMemo, useState } from "react";
import TeacherList from "./components/TeacherList";
import useTgTheme from "./lib/useTgTheme";

type ScreenState =
    | { type: "list" }
    | { type: "review"; teacherId: string; teacherName: string }
    | { type: "rated" };

type ReviewFormProps = {
    teacherName: string;
    onSubmit: () => void;
    onBack: () => void;
};

function ReviewForm({ teacherName, onSubmit, onBack }: ReviewFormProps) {
    return (
        <section className="space-y-6">
            <header className="space-y-2">
                <h2 className="text-xl font-semibold text-text">Форма отзыва</h2>
                <p className="text-sm text-subtext">
                    Заглушка формы для преподавателя <span className="text-text">{teacherName}</span>.
                </p>
            </header>

            <p className="rounded-2xl border border-white/5 bg-card/60 p-4 text-sm text-subtext">
                Здесь появится форма с выбором оценки и полем комментария. Пока что используем кнопку для проверки
                навигации между экранами.
            </p>

            <div className="flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary" onClick={onSubmit}>
                    Отправить тестовый отзыв
                </button>
                <button type="button" className="btn btn-ghost" onClick={onBack}>
                    Назад к списку
                </button>
            </div>
        </section>
    );
}

type AlreadyRatedProps = {
    onReset: () => void;
};

function AlreadyRated({ onReset }: AlreadyRatedProps) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text">Отзыв отправлен</h2>
            <p className="text-sm text-subtext">
                Заглушка финального экрана. Здесь можно показать благодарность и поделиться результатами.
            </p>
            <button type="button" className="btn btn-primary" onClick={onReset}>
                Вернуться к преподавателям
            </button>
        </section>
    );
}

export default function App() {
    useTgTheme();

    const [screen, setScreen] = useState<ScreenState>({ type: "list" });

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
        setScreen({ type: "review", teacherId, teacherName });
    }, []);

    const showList = useCallback(() => {
        setScreen({ type: "list" });
    }, []);

    const markRated = useCallback(() => {
        setScreen({ type: "rated" });
    }, []);

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
                        <h1 className="text-lg font-semibold text-text">Рейтинг учителей</h1>
                        <span className="text-sm text-subtext">{headerSubtitle}</span>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
                {screen.type === "list" && <TeacherList onSelect={openReview} />}
                {screen.type === "review" && (
                    <ReviewForm teacherName={screen.teacherName} onSubmit={markRated} onBack={showList} />
                )}
                {screen.type === "rated" && <AlreadyRated onReset={showList} />}
            </main>
        </div>
    );
}
