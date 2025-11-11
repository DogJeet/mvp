import { useEffect, useMemo, useState } from "react";

type ThemeValues = {
    bg: string;
    card: string;
    text: string;
    subtext: string;
    primary: string;
    accent: string;
};

const FALLBACK_THEME: ThemeValues = {
    bg: "#14161A",
    card: "#1E2127",
    text: "#ECEFF4",
    subtext: "#A0A7B5",
    primary: "#4E9CFF",
    accent: "#78DC82",
};

const CSS_VARIABLES: Array<keyof ThemeValues> = ["bg", "card", "text", "subtext", "primary", "accent"];

type ThemeParams = Partial<Record<string, string>>;

type TelegramWebApp = {
    themeParams?: ThemeParams;
    ready?: () => void;
    expand?: () => void;
    onEvent?: (eventType: string, callback: () => void) => void;
    offEvent?: (eventType: string, callback: () => void) => void;
};

const readTelegramWebApp = (): TelegramWebApp | undefined => {
    if (typeof window === "undefined") {
        return undefined;
    }

    const telegram = (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram;
    return telegram?.WebApp;
};

const extractTheme = (params: ThemeParams | undefined): ThemeValues => ({
    bg: params?.bg_color ?? FALLBACK_THEME.bg,
    card: params?.secondary_bg_color ?? FALLBACK_THEME.card,
    text: params?.text_color ?? FALLBACK_THEME.text,
    subtext: params?.hint_color ?? FALLBACK_THEME.subtext,
    primary: params?.button_color ?? FALLBACK_THEME.primary,
    accent: params?.button_text_color ?? FALLBACK_THEME.accent,
});

const applyThemeToDocument = (theme: ThemeValues) => {
    if (typeof document === "undefined") {
        return;
    }

    const root = document.documentElement;
    CSS_VARIABLES.forEach((variable) => {
        root.style.setProperty(`--${variable}`, theme[variable]);
    });
};

export default function useTgTheme() {
    const [theme, setTheme] = useState<ThemeValues>(() => {
        const telegram = readTelegramWebApp();
        return extractTheme(telegram?.themeParams);
    });

    useEffect(() => {
        const telegram = readTelegramWebApp();

        const updateTheme = () => {
            const nextTheme = extractTheme(telegram?.themeParams);
            setTheme(nextTheme);
            applyThemeToDocument(nextTheme);
        };

        updateTheme();

        telegram?.ready?.();
        telegram?.expand?.();
        telegram?.onEvent?.("themeChanged", updateTheme);

        return () => {
            telegram?.offEvent?.("themeChanged", updateTheme);
        };
    }, []);

    useEffect(() => {
        applyThemeToDocument(theme);
    }, [theme]);

    return useMemo(() => theme, [theme]);
}
