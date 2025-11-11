import React, { useMemo, useState } from "react";
import useTgTheme from "./lib/useTgTheme";

const initialTeachers = [
    {
        id: "anna",
        name: "Анна Петрова",
        rating: 4.9,
        totalVotes: 128,
        distribution: [
            { label: "5", percent: 80 },
            { label: "4", percent: 16 },
            { label: "3", percent: 3 },
            { label: "2", percent: 1 },
            { label: "1", percent: 0 },
        ],
        comments: [
            {
                author: "Владимир, 10 класс",
                date: "13 марта",
                rating: 5,
                text: "Объяснения понятные, сразу видно прогресс по домашкам.",
            },
            {
                author: "Алина",
                date: "8 марта",
                rating: 4,
                text: "Иногда темп высокий, но успевает ответить на вопросы.",
            },
        ],
    },
    {
        id: "olga",
        name: "Ольга Сергеевна",
        rating: 4.7,
        totalVotes: 94,
        distribution: [
            { label: "5", percent: 72 },
            { label: "4", percent: 20 },
            { label: "3", percent: 6 },
            { label: "2", percent: 2 },
            { label: "1", percent: 0 },
        ],
        comments: [
            {
                author: "Игорь",
                date: "10 марта",
                rating: 5,
                text: "Помогла разобраться с темой за два занятия, спасибо!",
            },
            {
                author: "Катя",
                date: "1 марта",
                rating: 4,
                text: "Удобно, что даёт короткие шпаргалки после урока.",
            },
        ],
    },
    {
        id: "maksim",
        name: "Максим Андреевич",
        rating: 4.5,
        totalVotes: 76,
        distribution: [
            { label: "5", percent: 60 },
            { label: "4", percent: 28 },
            { label: "3", percent: 9 },
            { label: "2", percent: 2 },
            { label: "1", percent: 1 },
        ],
        comments: [
            {
                author: "Марина",
                date: "9 марта",
                rating: 5,
                text: "Всегда даёт дополнительные задачи для тренировки.",
            },
            {
                author: "Роман",
                date: "2 марта",
                rating: 4,
                text: "Много практики на занятиях, но хотелось бы больше примеров.",
            },
        ],
    },
];

const ratingScale = [1, 2, 3, 4, 5];

function DistributionRow({ label, percent }) {
    return (
        <div className="distribution-row">
            <span className="distribution-row__label">{label}</span>
            <div className="distribution-row__bar" aria-hidden>
                <div className="distribution-row__fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="distribution-row__percent">{percent}%</span>
        </div>
    );
}

function CommentItem({ comment }) {
    return (
        <li className="comment-item card">
            <div className="comment-item__header">
                <span className="comment-item__author">{comment.author}</span>
                <span className="comment-item__meta">{comment.date}</span>
                <span className="comment-item__rating" aria-label={`Оценка ${comment.rating} из 5`}>
                    ★ {comment.rating}
                </span>
            </div>
            <p className="comment-item__text">{comment.text}</p>
        </li>
    );
}

function TeacherCard({ teacher }) {
    const formattedRating = useMemo(() => teacher.rating.toFixed(1), [teacher.rating]);

    return (
        <article className="teacher-card card" aria-label={`Профиль преподавателя ${teacher.name}`}>
            <header className="teacher-card__header">
                <h2 className="teacher-card__name">{teacher.name}</h2>
                <div className="teacher-card__rating" aria-label={`Средняя оценка ${formattedRating} из 5`}>
                    <span className="teacher-card__rating-value">{formattedRating}</span>
                    <span className="teacher-card__rating-caption">{teacher.totalVotes} отзывов</span>
                </div>
            </header>

            <section className="teacher-card__distribution" aria-labelledby={`${teacher.id}-distribution`}>
                <h3 id={`${teacher.id}-distribution`} className="section-title">
                    Распределение оценок
                </h3>
                <div className="distribution-list">
                    {teacher.distribution.map((item) => (
                        <DistributionRow key={item.label} label={item.label} percent={item.percent} />
                    ))}
                </div>
            </section>

            <section className="teacher-card__comments" aria-labelledby={`${teacher.id}-comments`}>
                <h3 id={`${teacher.id}-comments`} className="section-title">
                    Последние комментарии
                </h3>
                <ul className="comments-list">
                    {teacher.comments.map((comment, index) => (
                        <CommentItem key={`${teacher.id}-comment-${index}`} comment={comment} />
                    ))}
                </ul>
            </section>
        </article>
    );
}

export default function App() {
    useTgTheme();

    const [teachers, setTeachers] = useState(initialTeachers);
    const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeachers[0].id);
    const [selectedRating, setSelectedRating] = useState(0);
    const [comment, setComment] = useState("");
    const [snackbar, setSnackbar] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedTeacher = useMemo(
        () => teachers.find((teacher) => teacher.id === selectedTeacherId),
        [teachers, selectedTeacherId],
    );

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedTeacher) {
            setSnackbar("Выберите преподавателя");
            return;
        }

        if (!selectedRating) {
            setSnackbar("Поставьте оценку от 1 до 5");
            return;
        }

        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 400));

        setTeachers((prevTeachers) =>
            prevTeachers.map((teacher) => {
                if (teacher.id !== selectedTeacherId) {
                    return teacher;
                }

                const updatedTotalVotes = teacher.totalVotes + 1;
                const updatedAverage = (teacher.rating * teacher.totalVotes + selectedRating) / updatedTotalVotes;
                const updatedDistribution = teacher.distribution.map((item) =>
                    item.label === String(selectedRating)
                        ? { ...item, percent: Math.min(item.percent + 1, 100) }
                        : item,
                );

                const newComment = comment.trim()
                    ? {
                          author: "Вы",
                          date: "сегодня",
                          rating: selectedRating,
                          text: comment.trim(),
                      }
                    : {
                          author: "Вы",
                          date: "сегодня",
                          rating: selectedRating,
                          text: "Спасибо за урок!",
                      };

                return {
                    ...teacher,
                    rating: Number(updatedAverage.toFixed(1)),
                    totalVotes: updatedTotalVotes,
                    distribution: updatedDistribution,
                    comments: [newComment, ...teacher.comments].slice(0, 3),
                };
            }),
        );

        setIsSubmitting(false);
        setSnackbar("Спасибо! Оценка сохранена");
        setSelectedRating(0);
        setComment("");
    };

    return (
        <div className="app-shell">
            <header className="hero">
                <span className="hero__badge">Прототип</span>
                <h1 className="hero__title">Рейтинг учителей</h1>
                <p className="hero__subtitle">
                    Несколько карточек с основными показателями: средняя оценка, распределение баллов и свежие комментарии учеников.
                </p>
            </header>

            <main className="app-content">
                <section className="teachers-section card" aria-label="Список преподавателей">
                    <div className="teachers-header">
                        <h2 className="section-title">Преподаватели</h2>
                        <p className="teachers-header__hint">Все карточки показывают только имя, оценки и отзывы.</p>
                    </div>
                    <div className="teachers-grid">
                        {teachers.map((teacher) => (
                            <TeacherCard key={teacher.id} teacher={teacher} />
                        ))}
                    </div>
                </section>

                <aside className="rating-panel card" aria-labelledby="rating-panel-title">
                    <h2 id="rating-panel-title" className="section-title">
                        Добавьте отзыв
                    </h2>
                    <p className="rating-panel__hint">
                        Выберите учителя и поставьте оценку. Мы сохраним её локально, чтобы проверить сценарий.
                    </p>

                    <div className="teacher-selector" role="group" aria-label="Выбор преподавателя">
                        {teachers.map((teacher) => (
                            <button
                                key={`select-${teacher.id}`}
                                type="button"
                                className={`teacher-selector__button btn btn-ghost${
                                    teacher.id === selectedTeacherId ? " teacher-selector__button--active" : ""
                                }`}
                                onClick={() => setSelectedTeacherId(teacher.id)}
                            >
                                {teacher.name}
                            </button>
                        ))}
                    </div>

                    <form className="rating-form" onSubmit={handleSubmit}>
                        <fieldset className="rating-form__stars">
                            <legend className="rating-form__legend">Оценка занятия</legend>
                            <div className="rating-form__stars-grid">
                                {ratingScale.map((value) => {
                                    const isActive = value <= selectedRating;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            className={`star-button${isActive ? " star-button--active" : ""}`}
                                            onClick={() => setSelectedRating(selectedRating === value ? value - 1 : value)}
                                            aria-pressed={isActive}
                                            aria-label={`Поставить ${value} из 5`}
                                        >
                                            ★
                                        </button>
                                    );
                                })}
                            </div>
                            <span className="rating-form__value" aria-live="polite">
                                {selectedRating ? `Вы выбрали ${selectedRating} из 5` : "Оценка ещё не выбрана"}
                            </span>
                        </fieldset>

                        <label className="rating-form__field">
                            <span className="rating-form__label">Комментарий</span>
                            <textarea
                                className="textarea"
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                                placeholder="Что понравилось на занятии?"
                                rows={4}
                            />
                        </label>

                        <button type="submit" className="rating-form__submit btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "Сохраняем..." : "Отправить"}
                        </button>
                    </form>
                </aside>
            </main>

            {snackbar && (
                <div className="snackbar card" role="status" aria-live="polite">
                    {snackbar}
                    <button className="snackbar__close btn btn-ghost" type="button" onClick={() => setSnackbar("")}>
                        Закрыть
                    </button>
                </div>
            )}
        </div>
    );
}
