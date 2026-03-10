const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE",
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("TESTING ANALYTICS QUERY...");
        // Example: Schools with enrollment between 100 and 500
        const sql = `
            SELECT COUNT(*) 
            FROM dim_schools 
            WHERE totalenrolment BETWEEN 100 AND 500
        `;
        const res = await pool.query(sql);
        console.log(`[OK] Schools with 100-500 enrollment: ${res.rows[0].count}`);

        if (parseInt(res.rows[0].count) > 0) {
            console.log("FIX VERIFIED: Data is now accessible through dim_schools.");
        } else {
            console.log("FIX FAILED: Still 0 results.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
main();
