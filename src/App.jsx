import React, { useMemo, useState } from "react";

const teacher = {
    name: "Анна Петрова",
    subject: "Математика",
    rating: 4.9,
    totalVotes: 128,
    experience: "8 лет опыта преподавания",
    description:
        "Анна помогает школьникам и абитуриентам полюбить математику, объясняя сложные темы на понятных примерах. Занятия проходят в небольших группах и в индивидуальном формате.",
    highlights: ["Подготовка к ОГЭ и ЕГЭ", "Интерактивные задания", "Индивидуальные программы"],
    achievements: [
        "Победитель городского конкурса педагогического мастерства (2022)",
        "Автор курса по углублённой математике для старшеклассников",
        "Куратор научного кружка по прикладной математике",
    ],
    distribution: [
        { label: "5", percent: 82 },
        { label: "4", percent: 14 },
        { label: "3", percent: 3 },
        { label: "2", percent: 1 },
        { label: "1", percent: 0 },
    ],
    lastReview: {
        author: "Дмитрий, 11 класс",
        date: "14 марта",
        text: "За полгода занятий поднял оценку по профильной математике с 3 до 5. Анна всегда объясняет, откуда берутся формулы, и даёт много практики.",
    },
};

const ratingScale = [1, 2, 3, 4, 5];

const difficultyOptions = [
    { value: "light", label: "Легко" },
    { value: "medium", label: "Средне" },
    { value: "hard", label: "Сложно" },
];

function TeacherStat({ label, value }) {
    return (
        <div className="profile-card__stat">
            <span className="profile-card__stat-label">{label}</span>
            <span className="profile-card__stat-value">{value}</span>
        </div>
    );
}

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

export default function App() {
    const [selectedRating, setSelectedRating] = useState(0);
    const [difficulty, setDifficulty] = useState(difficultyOptions[1].value);
    const [comment, setComment] = useState("");
    const [snackbar, setSnackbar] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formattedRating = useMemo(() => teacher.rating.toFixed(1), []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedRating) {
            setSnackbar("Поставьте оценку от 1 до 5");
            return;
        }

        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 600));
        setIsSubmitting(false);

        setSnackbar("Спасибо! Оценка сохранена");
        setSelectedRating(0);
        setDifficulty(difficultyOptions[1].value);
        setComment("");
    };

    return (
        <div className="app-shell">
            <header className="hero">
                <span className="hero__badge">Пилотный запуск</span>
                <h1 className="hero__title">Рейтинг учителей</h1>
                <p className="hero__subtitle">
                    Тестируем прототип мини-приложения Telegram. Для примера доступен профиль преподавателя Анны, мы собираем
                    обратную связь по интерфейсу и логике оценок.
                </p>
            </header>

            <main className="app-content">
                <div className="layout">
                    <section className="profile-card" aria-labelledby="profile-title">
                        <div className="profile-card__header">
                            <div>
                                <h2 id="profile-title" className="profile-card__name">
                                    {teacher.name}
                                </h2>
                                <p className="profile-card__meta">{teacher.subject}</p>
                                <p className="profile-card__meta">{teacher.experience}</p>
                            </div>
                            <div className="profile-card__rating" aria-label={`Средняя оценка ${formattedRating} из 5`}>
                                <span className="profile-card__rating-value">{formattedRating}</span>
                                <span className="profile-card__rating-caption">{teacher.totalVotes} оценок</span>
                            </div>
                        </div>

                        <p className="profile-card__description">{teacher.description}</p>

                        <div className="profile-card__chips" role="list">
                            {teacher.highlights.map((item) => (
                                <span key={item} role="listitem" className="profile-card__chip">
                                    {item}
                                </span>
                            ))}
                        </div>

                        <div className="profile-card__stats">
                            <TeacherStat label="Средняя оценка" value={`${formattedRating} / 5`} />
                            <TeacherStat label="Всего отзывов" value={teacher.totalVotes} />
                            <TeacherStat label="Формат занятий" value="Групповые и индивидуальные" />
                        </div>

                        <section className="profile-card__achievements" aria-labelledby="achievements-title">
                            <h3 id="achievements-title" className="section-title">
                                Достижения
                            </h3>
                            <ul className="profile-card__achievements-list">
                                {teacher.achievements.map((achievement) => (
                                    <li key={achievement}>{achievement}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="profile-card__details" aria-labelledby="details-title">
                            <h3 id="details-title" className="section-title">
                                О занятиях
                            </h3>
                            <p>
                                Анна строит программу с ориентацией на итоговую цель ученика: поступление, экзамены или повышение текущей
                                успеваемости. Каждое занятие включает короткий разбор теории, практику с подробным разбором решений и
                                рекомендации по самостоятельной работе.
                            </p>
                            <p>
                                В мини-приложении можно быстро оставить оценку урока после занятия. Эти данные помогут составить рейтинг
                                преподавателей и сделать подбор наставника прозрачным и понятным.
                            </p>
                        </section>
                    </section>

                    <aside className="profile-side">
                        <section className="rating-widget" aria-labelledby="rate-title">
                            <h3 id="rate-title" className="section-title">
                                Поставьте свою оценку
                            </h3>
                            <p className="rating-widget__hint">
                                Выберите звёзды и укажите, насколько занятия показались сложными. Это тестовая форма: данные сохраняются
                                локально и помогают проверить поток пользователя.
                            </p>

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
                                    <span className="rating-form__label">Сложность занятия</span>
                                    <div className="rating-form__options">
                                        {difficultyOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                className={`option-chip${option.value === difficulty ? " option-chip--active" : ""}`}
                                                onClick={() => setDifficulty(option.value)}
                                                aria-pressed={option.value === difficulty}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </label>

                                <label className="rating-form__field" htmlFor="comment">
                                    <span className="rating-form__label">Комментарий</span>
                                    <textarea
                                        id="comment"
                                        className="rating-form__textarea"
                                        value={comment}
                                        onChange={(event) => setComment(event.target.value)}
                                        placeholder="Что понравилось или стоит улучшить?"
                                        rows={4}
                                    />
                                </label>

                                <button type="submit" className="rating-form__submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Отправляем..." : "Сохранить оценку"}
                                </button>
                            </form>
                        </section>

                        <section className="distribution-card" aria-labelledby="distribution-title">
                            <h3 id="distribution-title" className="section-title">
                                Распределение оценок
                            </h3>
                            <div className="distribution-card__list">
                                {teacher.distribution.map((item) => (
                                    <DistributionRow key={item.label} {...item} />
                                ))}
                            </div>
                            <p className="distribution-card__hint">Больше всего оценок на уровне 5. Статистика обновляется ежедневно.</p>
                        </section>

                        <section className="review-card" aria-labelledby="review-title">
                            <h3 id="review-title" className="section-title">
                                Последний отзыв
                            </h3>
                            <div className="review-card__meta">
                                <span className="review-card__author">{teacher.lastReview.author}</span>
                                <span className="review-card__date">{teacher.lastReview.date}</span>
                            </div>
                            <p className="review-card__text">{teacher.lastReview.text}</p>
                            <p className="review-card__footnote">Отзывы проходят модерацию и отображаются в ленте учителя.</p>
                        </section>
                    </aside>
                </div>
            </main>

            <footer className="app-footer">Прототип мини-приложения • {new Date().getFullYear()}</footer>

            {snackbar && (
                <div className="snackbar" role="status" aria-live="polite">
                    {snackbar}
                </div>
            )}
        </div>
    );
}
