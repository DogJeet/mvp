/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                bg: "rgb(var(--bg) / <alpha-value>)",
                card: "rgb(var(--card) / <alpha-value>)",
                text: "rgb(var(--text) / <alpha-value>)",
                subtext: "rgb(var(--subtext) / <alpha-value>)",
                primary: "rgb(var(--primary) / <alpha-value>)",
                accent: "rgb(var(--accent) / <alpha-value>)",
            },
        },
    },
    plugins: [],
};
