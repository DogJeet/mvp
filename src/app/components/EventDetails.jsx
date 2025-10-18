import React, { useEffect, useState } from "react";
)}
<div className="p-5 space-y-4">
    <div className="flex items-start justify-between">
        <div>
            <h3 className="text-xl font-semibold leading-tight">{data?.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-sm opacity-80">
                <span className="rounded-full border px-3 py-1 text-xs"><MapPin className="inline h-3 w-3 mr-1" />{data?.city}</span>
                <span className="rounded-full border px-3 py-1 text-xs"><User className="inline h-3 w-3 mr-1" />{data?.level}</span>
                <span className="rounded-full border px-3 py-1 text-xs"><Clock className="inline h-3 w-3 mr-1" />{data ? formatRange(data.date_start, data.date_end) : ""}</span>
            </div>
        </div>
        <div className="text-right">
            <div className="text-xl font-semibold">{data?.price} ₽</div>
            <div className="text-xs opacity-70">Вместимость: {data?.capacity}</div>
        </div>
    </div>


    <Card className="bg-muted/30">
        <CardContent className="p-4 text-sm leading-relaxed">
            <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 opacity-70" />
                <p>
                    Место проведения: <b>{data?.venue}</b>, {data?.address}. Приходите за 10 минут до начала. После регистрации откроется окно оплаты.
                </p>
            </div>
        </CardContent>
    </Card>


    <div className="flex items-center justify-between gap-3">
        <Badge variant={soldOut ? "destructive" : "secondary"}>
            {soldOut ? "Нет мест" : `Свободно мест: ${data?.spots_left}`}
        </Badge>
        <Button size="lg" onClick={handleRegister} disabled={soldOut || busy} className="flex-1 h-12">
            <CreditCard className="mr-2 h-4 w-4" /> {busy ? "Создание платежа..." : "Записаться и оплатить"}
        </Button>
    </div>


    {regResult && (
        <div className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <div className="font-medium">Бронь создана</div>
            </div>
            <div className="text-sm opacity-80">Номер брони: {regResult.reservation_id}</div>
            {payUrl && (
                <Button variant="secondary" onClick={() => window.open(payUrl, "_blank")} className="h-11 w-full">Перейти к оплате</Button>
            )}
        </div>
    )}
</div>
</div>
</SheetContent>
</Sheet>
);
}