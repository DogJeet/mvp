import { neon } from '@netlify/neon';

export const sql = neon();

export const DEFAULT_SETTINGS = {
    min_comment_length: "10",
    max_rating: "5",
    one_review_per_teacher: "true",
};

let schemaPromise;

const createTables = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS teachers (
            id SERIAL PRIMARY KEY,
            full_name TEXT NOT NULL,
            subject TEXT,
            avg_rating REAL DEFAULT 0,
            reviews_count INT DEFAULT 0
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            teacher_id INT NOT NULL REFERENCES teachers(id),
            user_hash TEXT NOT NULL,
            rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 10 AND 800),
            created_at TIMESTAMP DEFAULT now(),
            UNIQUE (user_hash, teacher_id)
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `;

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        // Insert default values without overwriting existing ones.
        // eslint-disable-next-line no-await-in-loop
        await sql`
            INSERT INTO settings (key, value)
            VALUES (${key}, ${value})
            ON CONFLICT (key) DO NOTHING
        `;
    }
};

export const ensureSchema = async () => {
    if (!schemaPromise) {
        schemaPromise = createTables().catch((error) => {
            schemaPromise = undefined;
            throw error;
        });
    }

    return schemaPromise;
};
