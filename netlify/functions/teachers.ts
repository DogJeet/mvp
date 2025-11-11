import type { Handler } from "@netlify/functions";
import { sql } from "./db";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parseNumber = (value: string | undefined, fallback: number, max?: number) => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) return fallback;
    if (typeof max === "number" && parsed > max) {
        return max;
    }
    return parsed;
};

const normalizeSort = (rawSort?: string) => {
    switch (rawSort) {
        case "rating":
            return "asc" as const;
        case "-rating":
        default:
            return "desc" as const;
    }
};

const escapeSearchTerm = (value: string) => value.replace(/[%_]/g, (match) => `\\${match}`);

export const handler: Handler = async (event) => {
    try {
        const { search, sort, limit, offset } = event.queryStringParameters || {};

        const normalizedSort = normalizeSort(sort || undefined);
        const limitValue = parseNumber(limit, DEFAULT_LIMIT, MAX_LIMIT);
        const offsetValue = parseNumber(offset, 0);

        const searchFilter = search && search.trim() ? `%${escapeSearchTerm(search.trim())}%` : null;

        const whereClause = searchFilter ? sql`WHERE t.full_name ILIKE ${searchFilter}` : sql``;
        const orderClause =
            normalizedSort === "asc"
                ? sql`ORDER BY avg_rating ASC, full_name ASC`
                : sql`ORDER BY avg_rating DESC, full_name ASC`;

        const rows = await sql<{
            id: string;
            full_name: string;
            avg_rating: number | string | null;
            reviews_count: number | string | null;
        }[]>`
            WITH teacher_stats AS (
                SELECT
                    t.id::text AS id,
                    t.full_name,
                    COALESCE(AVG(r.rating)::numeric, 0) AS avg_rating,
                    COUNT(r.rating) AS reviews_count
                FROM teachers t
                LEFT JOIN teacher_reviews r ON r.teacher_id = t.id
                ${whereClause}
                GROUP BY t.id
            )
            SELECT
                id,
                full_name,
                ROUND(avg_rating, 2) AS avg_rating,
                reviews_count
            FROM teacher_stats
            ${orderClause}
            LIMIT ${limitValue}
            OFFSET ${offsetValue}
        `;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
                rows.map((row) => ({
                    id: row.id,
                    full_name: row.full_name,
                    avg_rating: row.avg_rating === null ? 0 : Number(row.avg_rating),
                    reviews_count: row.reviews_count === null ? 0 : Number(row.reviews_count),
                }))
            ),
        };
    } catch (error) {
        console.error("Failed to load teachers", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Не удалось загрузить учителей" }),
        };
    }
};
