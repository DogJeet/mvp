import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";


export default function Filters({ onChange, initial }) {
    const [city, setCity] = useState(initial?.city || "ALL");
    const [level, setLevel] = useState(initial?.level || "ANY");
    const [query, setQuery] = useState(initial?.q || "");


    const apply = () => {
        onChange({
            city: city === "ALL" ? undefined : city,
            level: level === "ANY" ? undefined : level,
            q: query || undefined,
        });
    };


    return (
        <div className="flex flex-col gap-3">
            <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-60" />
                <Input
                    placeholder="Поиск по названию, клубу..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                        <SelectValue placeholder="Город" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Все города</SelectItem>
                        <SelectItem value="Москва">Москва</SelectItem>
                        <SelectItem value="Санкт-Петербург">Санкт-Петербург</SelectItem>
                    </SelectContent>
                </Select>


                <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                        <SelectValue placeholder="Уровень" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ANY">Любой</SelectItem>
                        <SelectItem value="Новички">Новички</SelectItem>
                        <SelectItem value="Средний">Средний</SelectItem>
                        <SelectItem value="Все уровни">Все уровни</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={apply} className="h-11">
                <Filter className="mr-2 h-4 w-4" /> Применить
            </Button>
        </div>
    );
}