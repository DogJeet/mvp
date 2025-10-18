import React from "react";
import { XCircle } from "lucide-react";


export default function Empty({ query }) {
    return (
        <div className="text-center py-16 opacity-80">
            <XCircle className="mx-auto h-10 w-10 mb-3" />
            <div className="text-lg font-medium">Ничего не нашли</div>
            <div className="text-sm">Попробуй изменить фильтры{query ? ` или убрать запрос «${query}»` : ""}.</div>
        </div>
    );
}