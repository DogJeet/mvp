import React from "react";

export default function Header({ onOpenProfile, onCloseApp }) {
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
        </header>
    );
}
