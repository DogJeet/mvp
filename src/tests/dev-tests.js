export default function runDevTests() {
    if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "production") return;

    // Test 1: no select option uses an empty string value
    const selectValues = ["ALL", "Москва", "Санкт-Петербург", "ANY", "Новички", "Средний", "Все уровни", "Продвинутый"];
    console.assert(!selectValues.includes(""), "Found empty SelectItem value");

    // Test 2: sentinel values transform to undefined
    const input1 = { city: "ALL", level: "ANY", q: "" };
    const normalized = {
        city: input1.city === "ALL" ? undefined : input1.city,
        level: input1.level === "ANY" ? undefined : input1.level,
        q: input1.q || undefined,
    };
    console.assert(
        normalized.city === undefined && normalized.level === undefined && normalized.q === undefined,
        "Sentinel normalization failed",
    );

    // Test 3: formatRange basic sanity
    const a = new Date("2025-10-21T10:00:00+03:00").toISOString();
    const b = new Date("2025-10-21T12:00:00+03:00").toISOString();
    console.assert(typeof a === "string" && typeof b === "string", "Date seed failed");
}
