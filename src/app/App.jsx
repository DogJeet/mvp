import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Filters from "./components/Filters";
import EventCard from "./components/EventCard";
import BottomNav from "./components/BottomNav";
import Empty from "./components/Empty";
import ProfileDialog from "./components/ProfileDialog";
import EventDetails from "./components/EventDetails";
import api from "./lib/api";
import useTelegram from "./lib/telegram";
import runDevTests from "./tests/dev-tests";

const skeletonItems = Array.from({ length: 6 }, (_, i) => i);

export default function App() {
    const { tg } = useTelegram();
    const [tab, setTab] = useState("catalog");
    const [filters, setFilters] = useState({});
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        runDevTests?.();
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        api.listEvents(filters)
            .then((list) => {
                if (!cancelled) {
                    setEvents(list);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setEvents([]);
                    setError("Не удалось загрузить события");
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [filters]);

    const handleFilterChange = (next) => {
        setFilters(next);
    };

    const closeHandler = useMemo(() => {
        if (!tg || typeof tg.close !== "function") {
            return undefined;
        }
        return () => tg.close();
    }, [tg]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <Header onOpenProfile={() => setProfileOpen(true)} onCloseApp={closeHandler} />
            <main className="flex-1 pb-24">
                <div className="mx-auto max-w-md md:max-w-3xl lg:max-w-5xl px-4">
                    {tab === "catalog" ? (
                        <div className="space-y-4 pt-4">
                            <Filters onChange={handleFilterChange} initial={filters} />
                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {error}
                                </div>
                            )}
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {skeletonItems.map((i) => (
                                        <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
                                    ))}
                                </div>
                            ) : events.length === 0 ? (
                                <Empty query={filters.q} />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {events.map((ev) => (
                                        <EventCard key={ev.id} ev={ev} onOpen={setSelected} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="pt-4">
                            <div className="rounded-2xl border bg-white p-6 text-sm opacity-80">
                                Здесь появятся ваши активные и прошедшие записи после интеграции с API.
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <div className="text-center text-[11px] opacity-70 py-4">© {new Date().getFullYear()} GameUp</div>
            <EventDetails id={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
            <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
            <BottomNav active={tab} onChange={setTab} onProfile={() => setProfileOpen(true)} />
        </div>
    );
}
