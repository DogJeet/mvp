import React, { useCallback, useEffect, useMemo, useState } from "react";
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
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSaveError, setProfileSaveError] = useState(null);
    const [profileReloadKey, setProfileReloadKey] = useState(0);

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
                    setEvents(Array.isArray(list) ? list : []);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error(err);
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
        let cancelled = false;
        setProfileLoading(true);
        setProfileError(null);
        api.getProfile()
            .then((data) => {
                if (!cancelled) {
                    setProfile(data);
                    setProfileLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error(err);
                    setProfile(null);
                    setProfileError("Не удалось загрузить профиль");
                    setProfileLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [profileReloadKey]);

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

    const roles = useMemo(() => {
        if (!profile) return [];
        if (Array.isArray(profile.roles)) return profile.roles;
        if (typeof profile.role === "string") return [profile.role];
        return [];
    }, [profile]);

    const isAdmin = useMemo(() => roles.some((role) => ["admin", "super_admin", "organizer"].includes(role)), [roles]);

    useEffect(() => {
        if (tab !== "admin" || !isAdmin) return undefined;
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
            .catch((err) => {
                if (!cancelled) {
                    setAdminData(null);
                    const message = err?.status === 403 ? "Доступ ограничен" : err?.message;
                    setAdminError(message || "Не удалось загрузить панель администратора");
                    setAdminLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [tab, adminReloadKey, isAdmin]);

    useEffect(() => {
        if (!isAdmin && tab === "admin") {
            setTab("catalog");
        }
    }, [isAdmin, tab]);

    const handleFilterChange = (next) => {
        setFilters(next);
    };

    const refreshProfile = useCallback(() => {
        setProfileReloadKey((key) => key + 1);
    }, []);

    const handleProfileSubmit = useCallback(
        async (formData) => {
            if (profileSaving) return;
            setProfileSaving(true);
            setProfileSaveError(null);
            try {
                const updated = await api.updateProfile(formData);
                setProfile((prev) => ({ ...(prev || {}), ...formData, ...(updated || {}) }));
                setProfileSaving(false);
                setProfileOpen(false);
            } catch (err) {
                console.error(err);
                setProfileSaveError(err.message || "Не удалось сохранить профиль");
                setProfileSaving(false);
            }
        },
        [profileSaving],
    );

    useEffect(() => {
        if (profileOpen) {
            setProfileSaveError(null);
        }
    }, [profileOpen]);

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
            <Header
                onOpenProfile={() => setProfileOpen(true)}
                onCloseApp={closeHandler}
                profile={profile}
                profileLoading={profileLoading}
                profileError={profileError}
            />
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
                            error={isAdmin ? adminError : "Доступ ограничен"}
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
                onRegistered={() => {
                    refreshPlayerData();
                    refreshAdminData();
                }}
                onWaitlisted={() => {
                    refreshPlayerData();
                    refreshAdminData();
                }}
                profile={profile}
            />
            <ProfileDialog
                open={profileOpen}
                onOpenChange={setProfileOpen}
                profile={profile}
                loading={profileLoading}
                error={profileError}
                saving={profileSaving}
                saveError={profileSaveError}
                onRetry={refreshProfile}
                onSubmit={handleProfileSubmit}
            />
            <BottomNav
                active={tab}
                onChange={(nextTab) => {
                    if (nextTab === "admin" && !isAdmin) return;
                    setTab(nextTab);
                }}
                onProfile={() => setProfileOpen(true)}
                showAdmin={isAdmin}
            />
        </div>
    );
}
