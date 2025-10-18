import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";


export default function ProfileDialog({ open, onOpenChange }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Профиль</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Имя" defaultValue="Гость" />
                        <Select defaultValue="Новички">
                            <SelectTrigger>
                                <SelectValue placeholder="Уровень" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Новички">Новички</SelectItem>
                                <SelectItem value="Средний">Средний</SelectItem>
                                <SelectItem value="Продвинутый">Продвинутый</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Input placeholder="Телефон" />
                    <Textarea placeholder="Пожелания / комментарий к записи (необязательно)" />
                    <div className="flex justify-end">
                        <Button className="h-11">Сохранить</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}