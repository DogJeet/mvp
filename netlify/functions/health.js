exports.handler = async () => {
    try {
        const { ensureSchema, sql } = await import("./db.js");
        await ensureSchema();
        await sql`SELECT * FROM teachers LIMIT 1`;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ok" }),
        };
    } catch (error) {
        console.error("Health check failed", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "error" }),
        };
    }
};
