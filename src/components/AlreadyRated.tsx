import type { FC } from "react";

export type AlreadyRatedProps = {
    onBack: () => void;
};

const AlreadyRated: FC<AlreadyRatedProps> = ({ onBack }) => {
    return (
        <section className="card flex flex-col items-center gap-4 p-6 text-center">
            <div className="text-4xl" aria-hidden="true">
                🎉
            </div>
            <h2 className="text-lg font-semibold text-text">Вы уже оставили оценку</h2>
            <p className="max-w-sm text-sm text-subtext">
                Спасибо за активность! Вы можете вернуться к списку преподавателей и выбрать другого
                учителя для оценки.
            </p>
            <button type="button" className="btn btn-primary" onClick={onBack}>
                Назад к рейтингу
            </button>
        </section>
    );
};

export default AlreadyRated;
