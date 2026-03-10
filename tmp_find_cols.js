const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE",
    ssl: { rejectUnauthorized: false }
});

async function findColumns() {
    try {
        console.log("CHECKING raw_school_unique_v2 COLUMNS...");
        const res1 = await pool.query("SELECT * FROM raw_school_unique_v2 LIMIT 1");
        console.log("COLUMNS IN rv2:", Object.keys(res1.rows[0]));

        console.log("\nCHECKING dim_schools COLUMNS...");
        const res2 = await pool.query("SELECT * FROM dim_schools LIMIT 1");
        console.log("COLUMNS IN dim_schools:", Object.keys(res2.rows[0]));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findColumns();
