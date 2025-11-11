import { neon } from '@netlify/neon';

export const sql = neon();

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
