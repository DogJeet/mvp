import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const levels = ["Новички", "Средний", "Продвинутый"];

export default function ProfileDialog({ open, onOpenChange }) {
    useEffect(() => {
        if (!open) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onOpenChange(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    if (!open) return null;

    return createPortal(
        <div
            className="profile-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => onOpenChange(false)}
        >
            <div className="profile-dialog" onClick={(event) => event.stopPropagation()}>
                <div className="profile-dialog__title">Профиль</div>
                <form className="profile-form">
                    <div className="profile-form__row">
                        <label className="profile-field">
                            <span className="profile-field__label">Имя</span>
                            <input
                                defaultValue="Гость"
                                className="profile-input"
                                placeholder="Имя"
                                name="name"
                            />
                        </label>
                        <label className="profile-field">
                            <span className="profile-field__label">Уровень</span>
                            <select defaultValue={levels[0]} className="profile-input" name="level">
                                {levels.map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label className="profile-field">
                        <span className="profile-field__label">Телефон</span>
                        <input className="profile-input" placeholder="Телефон" name="phone" />
                    </label>
                    <label className="profile-field">
                        <span className="profile-field__label">Комментарий</span>
                        <textarea
                            rows={3}
                            className="profile-input profile-input--textarea"
                            placeholder="Пожелания / комментарий к записи (необязательно)"
                            name="comment"
                        />
                    </label>
                    <div className="profile-actions">
                        <button type="button" className="button button--ghost" onClick={() => onOpenChange(false)}>
                            Закрыть
                        </button>
                        <button type="submit" className="button button--primary">
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
