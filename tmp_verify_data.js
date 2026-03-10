const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE",
    ssl: { rejectUnauthorized: false }
});

async function verify() {
    try {
        console.log("COUNTING ROWS IN dim_schools...");
        const res1 = await pool.query("SELECT COUNT(*) FROM dim_schools");
        console.log("TOTAL ROWS:", res1.rows[0].count);

        console.log("\nCHECKING REGIONS...");
        const res2 = await pool.query("SELECT DISTINCT region FROM dim_schools WHERE region IS NOT NULL ORDER BY region");
        console.log("REGIONS FOUND:", res2.rows.map(r => r.region));

        console.log("\nSAMPLE ROW FROM dim_schools...");
        const res3 = await pool.query("SELECT * FROM dim_schools LIMIT 1");
        console.log(JSON.stringify(res3.rows[0], null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
verify();
