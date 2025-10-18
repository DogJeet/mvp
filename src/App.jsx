import React, { useEffect, useState } from "react";
<TabsTrigger value="my">Мои записи</TabsTrigger>
</TabsList>
<TabsContent value="catalog" className="mt-3 space-y-3">
    <Filters onChange={setFilters} initial={filters} />


    {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
            ))}
        </div>
    ) : events.length === 0 ? (
        <Empty query={filters.q} />
    ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.map((ev) => (
                <AnimatePresence key={ev.id}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <EventCard ev={ev} onOpen={(id) => setSelected(id)} />
                    </motion.div>
                </AnimatePresence>
            ))}
        </div>
    )}
</TabsContent>


<TabsContent value="my" className="mt-3">
    <Card className="rounded-2xl">
        <CardContent className="p-6 text-sm opacity-80">
            Здесь появятся ваши активные и прошедшие записи после интеграции с API.
        </CardContent>
    </Card>
</TabsContent>
</Tabs>
</div>


<div className="text-center text-[11px] opacity-70 py-4">© {new Date().getFullYear()} GameUp</div>


<EventDetails id={selected} open={!!selected} onClose={() => setSelected(null)} />
<ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />


<BottomNav
    active={tab}
    onChange={(v) => setTab(v)}
    onProfile={() => setProfileOpen(true)}
/>
</div>
);
}