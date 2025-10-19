import React from "react";

export default function BottomNav({ active, onChange, onProfile }) {
    return (
        <nav className="bottom-nav">
            <div className="bottom-nav__content">
                <button
                    className={`bottom-nav__item ${active === "catalog" ? "is-active" : ""}`.trim()}
                    onClick={() => onChange("catalog")}
                    type="button"
                >
                    <span className="bottom-nav__icon" aria-hidden>
                        📅
                    </span>
                    <span className="bottom-nav__label">Каталог</span>
                </button>
                <button
                    className={`bottom-nav__item ${active === "my" ? "is-active" : ""}`.trim()}
                    onClick={() => onChange("my")}
                    type="button"
                >
                    <span className="bottom-nav__icon" aria-hidden>
                        🏅
                    </span>
                    <span className="bottom-nav__label">Игрок</span>
                </button>
                <button
                    className={`bottom-nav__item ${active === "admin" ? "is-active" : ""}`.trim()}
                    onClick={() => onChange("admin")}
                    type="button"
                >
                    <span className="bottom-nav__icon" aria-hidden>
                        🛠️
                    </span>
                    <span className="bottom-nav__label">Управление</span>
                </button>
                <button className="bottom-nav__item" onClick={onProfile} type="button">
                    <span className="bottom-nav__icon" aria-hidden>
                        👤
                    </span>
                    <span className="bottom-nav__label">Профиль</span>
                </button>
            </div>
        </nav>
    );
}
