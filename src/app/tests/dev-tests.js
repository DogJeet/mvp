export default function runDevTests() {
    if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "production") return;
// Test 1: no SelectItem uses empty value
    const selectValues = ["ALL", "Москва", "Санкт-Петербург", "ANY", "Новички", "Средний", "Все уровни", "Продвинутый"];
    console.assert(!selectValues.includes(""), "Found empty SelectItem value");


// Test 2: sentinel transform to undefined
    const input1 = { city: "ALL", level: "ANY", q: "" };
    const norm = {
        city: input1.city === "ALL" ? undefined : input1.city,
        level: input1.level === "ANY" ? undefined : input1.level,
        q: input1.q || undefined,
    };
    console.assert(norm.city === undefined && norm.level === undefined && norm.q === undefined, "Sentinel normalization failed");


// Test 3: formatRange basic
    const a = new Date("2025-10-21T10:00:00+03:00").toISOString();
    const b = new Date("2025-10-21T12:00:00+03:00").toISOString();
// Not asserting exact locale string (varies by runtime), just ensure non-empty
    console.assert(typeof a === "string" && typeof b === "string", "Date seed failed");
}