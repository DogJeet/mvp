import React, { useMemo } from "react";

const resolveRoles = (profile) => {
    if (!profile) return [];
    if (Array.isArray(profile.roles)) return profile.roles;
    if (profile.role) return [profile.role];
    return [];
};

export default function Header({ onOpenProfile, onCloseApp, profile, profileLoading, profileError }) {
    const roles = useMemo(() => resolveRoles(profile), [profile]);
    const isAdmin = roles.some((role) => ["admin", "super_admin", "organizer"].includes(role));
    const name = profile?.name || profile?.full_name || profile?.telegram || "Гость";
    const roleLabel = profileLoading
        ? "Загружаем профиль..."
        : profileError
        ? profileError
        : isAdmin
        ? "Администратор"
        : "Игрок";

    return (
        <header className="header-bar">
            <div className="header-inner">
                <div className="header-brand">
                    <div className="header-brand__icon" aria-hidden />
                    <div>
                        <div className="header-brand__title">GameUp</div>
                        <div className="header-brand__subtitle">Регистрация на игры и события</div>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="header-user">
                        <div className="header-user__name">{name}</div>
                        <div className="header-user__role">{roleLabel}</div>
                    </div>
                    <div className="header-buttons">
                        <button type="button" className="button button--ghost" onClick={onOpenProfile}>
                            Профиль
                        </button>
                        {onCloseApp && (
                            <button type="button" className="button button--ghost" onClick={onCloseApp}>
                                Закрыть
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
