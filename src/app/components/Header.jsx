import React from "react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";


export default function Header({ onOpenProfile, onCloseApp }) {
    return (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg" />
                <div>
                    <div className="text-lg font-semibold leading-none">GameUp</div>
                    <div className="text-[12px] opacity-70">Регистрация на игры и события</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={onOpenProfile}>
                        <User className="h-4 w-4 mr-2" /> Профиль
                    </Button>
                    {onCloseApp && (
                        <Button variant="outline" size="sm" onClick={onCloseApp}>Закрыть</Button>
                    )}
                </div>
            </div>
        </div>
    );
}