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
                    <span className="bottom-nav__icon bottom-nav__icon--badge" aria-hidden>
                        М
                    </span>
                    <span className="bottom-nav__label">Мои</span>
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
