export const formatRange = (startISO, endISO) => {
    const s = new Date(startISO);
    const e = new Date(endISO);
    const sameDay = s.toDateString() === e.toDateString();
    const dtf = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    const dtfShort = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return sameDay ? `${dtf.format(s)} — ${dtfShort.format(e)}` : `${dtf.format(s)} — ${dtf.format(e)}`;
};
