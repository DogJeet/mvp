import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Filters from "./components/Filters";
import EventCard from "./components/EventCard";
import BottomNav from "./components/BottomNav";
import Empty from "./components/Empty";
import ProfileDialog from "./components/ProfileDialog";
import EventDetails from "./components/EventDetails";
import PlayerDashboard from "./components/PlayerDashboard";
import AdminPanel from "./components/AdminPanel";
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
    const [playerData, setPlayerData] = useState(null);
    const [playerLoading, setPlayerLoading] = useState(false);
    const [playerError, setPlayerError] = useState(null);
    const [playerReloadKey, setPlayerReloadKey] = useState(0);
    const [adminData, setAdminData] = useState(null);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState(null);
    const [adminReloadKey, setAdminReloadKey] = useState(0);

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

    useEffect(() => {
        if (tab !== "my") return undefined;
        let cancelled = false;
        setPlayerLoading(true);
        setPlayerError(null);
        api.getPlayerDashboard()
            .then((data) => {
                if (!cancelled) {
                    setPlayerData(data);
                    setPlayerLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setPlayerData(null);
                    setPlayerError("Не удалось загрузить данные игрока");
                    setPlayerLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [tab, playerReloadKey]);

    useEffect(() => {
        if (tab !== "admin") return undefined;
        let cancelled = false;
        setAdminLoading(true);
        setAdminError(null);
        api.getAdminOverview()
            .then((data) => {
                if (!cancelled) {
                    setAdminData(data);
                    setAdminLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setAdminData(null);
                    setAdminError("Не удалось загрузить панель администратора");
                    setAdminLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [tab, adminReloadKey]);

    const handleFilterChange = (next) => {
        setFilters(next);
    };

    const closeHandler = useMemo(() => {
        if (!tg || typeof tg.close !== "function") {
            return undefined;
        }
        return () => tg.close();
    }, [tg]);

    const refreshPlayerData = () => setPlayerReloadKey((key) => key + 1);
    const refreshAdminData = () => setAdminReloadKey((key) => key + 1);

    return (
        <div className="app-shell">
            <Header onOpenProfile={() => setProfileOpen(true)} onCloseApp={closeHandler} />
            <main className="app-main">
                <div className="app-content">
                    {tab === "catalog" ? (
                        <div className="catalog-view">
                            <section className="app-hero">
                                <h1 className="app-hero__title">Играй, учись и знакомься с единомышленниками</h1>
                                <p className="app-hero__subtitle">
                                    Собрали подборку турниров, тренировок и мероприятий в твоём городе. Фильтруй, находи и записывайся в пару
                                    кликов.
                                </p>
                            </section>
                            <Filters onChange={handleFilterChange} initial={filters} className="catalog-filters" />
                            {error && <div className="app-alert app-alert--error">{error}</div>}
                            {loading ? (
                                <div className="card-grid card-grid--loading">
                                    {skeletonItems.map((i) => (
                                        <div key={i} className="skeleton-card" />
                                    ))}
                                </div>
                            ) : events.length === 0 ? (
                                <Empty query={filters.q} />
                            ) : (
                                <div className="card-grid">
                                    {events.map((ev) => (
                                        <EventCard key={ev.id} ev={ev} onOpen={setSelected} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : tab === "my" ? (
                        <PlayerDashboard
                            data={playerData}
                            loading={playerLoading}
                            error={playerError}
                            onRefresh={refreshPlayerData}
                        />
                    ) : (
                        <AdminPanel
                            data={adminData}
                            loading={adminLoading}
                            error={adminError}
                            onRefresh={refreshAdminData}
                        />
                    )}
                </div>
            </main>
            <footer className="app-footer">© {new Date().getFullYear()} GameUp</footer>
            <EventDetails
                id={selected}
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                onRegistered={refreshPlayerData}
                onWaitlisted={refreshPlayerData}
            />
            <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
            <BottomNav active={tab} onChange={setTab} onProfile={() => setProfileOpen(true)} />
        </div>
    );
}
