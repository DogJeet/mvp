import { useCallback, useMemo, useState } from "react";
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
                    <ReviewForm teacherId={screen.teacherId} onSuccess={markRated} onAlreadyRated={markRated} />
                )}
                {screen.type === "rated" && <AlreadyRated onBack={showList} />}
            </main>
        </div>
    );
}
