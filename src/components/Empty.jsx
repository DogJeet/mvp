import React from "react";

export default function Empty({ query }) {
    return (
        <div className="empty-state">
            <div className="empty-state__icon" aria-hidden>
                😕
            </div>
            <div className="empty-state__title">Ничего не нашли</div>
            <div className="empty-state__subtitle">
                Попробуй изменить фильтры{query ? ` или убрать запрос «${query}»` : ""}.
            </div>
        </div>
    );
}
