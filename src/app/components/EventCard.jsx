import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User, Clock, ChevronRight } from "lucide-react";
import { formatRange } from "../utils/date";


const Pill = ({ children }) => (
    <span className="rounded-full border px-3 py-1 text-xs opacity-90">{children}</span>
);


export default function EventCard({ ev, onOpen }) {
    const soldOut = ev.spots_left <= 0;
    return (
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 rounded-2xl">
            <div className="h-40 md:h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${ev.cover})` }} />
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{ev.title}</CardTitle>
                    <Badge variant={soldOut ? "destructive" : "secondary"}>
                        {soldOut ? "Нет мест" : `Осталось: ${ev.spots_left}`}
                    </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm opacity-80">
                    <Pill><MapPin className="inline h-3 w-3 mr-1" />{ev.city}</Pill>
                    <Pill><User className="inline h-3 w-3 mr-1" />{ev.level}</Pill>
                    <Pill><Clock className="inline h-3 w-3 mr-1" />{formatRange(ev.date_start, ev.date_end)}</Pill>
                </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0 pb-4">
                <div className="text-xl font-semibold">{ev.price} ₽</div>
                <Button onClick={() => onOpen(ev.id)} disabled={soldOut} className="h-11">
                    Записаться <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}