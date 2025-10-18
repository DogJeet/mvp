import { useEffect, useState } from "react";
export const useTelegram = () => {
    const [tg, setTg] = useState(null);
    const [initDataUnsafe, setInitDataUnsafe] = useState(null);
    useEffect(() => {
        const w = window;
        const webApp = w?.Telegram?.WebApp;
        if (webApp) {
            webApp.ready();
            webApp.expand?.();
            setTg(webApp);
            setInitDataUnsafe(webApp.initDataUnsafe || null);
            document.documentElement.classList.toggle("dark", webApp.colorScheme === "dark");
            const bg = webApp.themeParams?.bg_color || (webApp.colorScheme === "dark" ? "#0b0f14" : "#f8fafc");
            document.body.style.background = bg;
        }
    }, []);
    return { tg, initDataUnsafe };
};
export default useTelegram;