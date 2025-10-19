import React from "react";

export default function Empty({ query }) {
    return (
        <div className="text-center py-16 opacity-80">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full border-2 border-dashed border-slate-300 grid place-items-center text-xl">
                😕
            </div>
            <div className="text-lg font-medium">Ничего не нашли</div>
            <div className="text-sm">Попробуй изменить фильтры{query ? ` или убрать запрос «${query}»` : ""}.</div>
        </div>
    );
}
