import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const defaultProfile = {
    name: "",
    level: "",
    phone: "",
    comment: "",
    email: "",
};

const levels = ["Новички", "Средний", "Продвинутый", "Про"];

const normalizeProfile = (profile) => ({
    ...defaultProfile,
    ...(profile || {}),
    comment: profile?.comment || profile?.notes || defaultProfile.comment,
});

export default function ProfileDialog({
    open,
    onOpenChange,
    profile,
    loading,
    error,
    saving,
    saveError,
    onRetry,
    onSubmit,
}) {
    const [form, setForm] = useState(() => normalizeProfile(profile));

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

    useEffect(() => {
        if (open) {
            setForm(normalizeProfile(profile));
        }
    }, [open, profile]);

    const levelOptions = useMemo(() => {
        const known = new Set(levels);
        const current = form.level || normalizeProfile(profile).level;
        if (current && !known.has(current)) {
            return [...levels, current];
        }
        return levels;
    }, [profile, form.level]);

    if (!open) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (loading || saving) return;
        try {
            await onSubmit?.(form);
        } catch (err) {
            // handled via saveError from parent
        }
    };

    const handleChange = (field) => (event) => {
        const value = event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    return createPortal(
        <div className="profile-overlay" role="dialog" aria-modal="true" onClick={() => onOpenChange(false)}>
            <div className="profile-dialog" onClick={(event) => event.stopPropagation()}>
                <div className="profile-dialog__title">Профиль участника</div>
                {loading && !profile ? (
                    <div className="profile-status">Загружаем данные профиля...</div>
                ) : error && !profile ? (
                    <div className="profile-status profile-status--error">
                        <div>{error}</div>
                        {onRetry && (
                            <button type="button" className="button button--ghost" onClick={onRetry}>
                                Попробовать ещё раз
                            </button>
                        )}
                    </div>
                ) : (
                    <form className="profile-form" onSubmit={handleSubmit}>
                        <div className="profile-form__row">
                            <label className="profile-field">
                                <span className="profile-field__label">Имя</span>
                                <input
                                    value={form.name}
                                    onChange={handleChange("name")}
                                    className="profile-input"
                                    placeholder="Имя"
                                    name="name"
                                    autoComplete="name"
                                />
                            </label>
                            <label className="profile-field">
                                <span className="profile-field__label">Уровень игры</span>
                                <select
                                    value={form.level}
                                    onChange={handleChange("level")}
                                    className="profile-input"
                                    name="level"
                                >
                                    <option value="">—</option>
                                    {levelOptions.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="profile-form__row">
                            <label className="profile-field">
                                <span className="profile-field__label">Телефон</span>
                                <input
                                    value={form.phone}
                                    onChange={handleChange("phone")}
                                    className="profile-input"
                                    placeholder="Телефон"
                                    name="phone"
                                    autoComplete="tel"
                                />
                            </label>
                            <label className="profile-field">
                                <span className="profile-field__label">Email</span>
                                <input
                                    value={form.email}
                                    onChange={handleChange("email")}
                                    className="profile-input"
                                    placeholder="Email"
                                    name="email"
                                    autoComplete="email"
                                />
                            </label>
                        </div>
                        <label className="profile-field">
                            <span className="profile-field__label">Комментарий для организаторов</span>
                            <textarea
                                rows={3}
                                className="profile-input profile-input--textarea"
                                placeholder="Пожелания или особенности"
                                name="comment"
                                value={form.comment}
                                onChange={handleChange("comment")}
                            />
                        </label>
                        {(saveError || (error && profile)) && (
                            <div className="app-alert app-alert--error">{saveError || error}</div>
                        )}
                        <div className="profile-actions">
                            <button type="button" className="button button--ghost" onClick={() => onOpenChange(false)}>
                                Закрыть
                            </button>
                            <button type="submit" className="button button--primary" disabled={saving}>
                                {saving ? "Сохраняем..." : "Сохранить"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body,
    );
}
