const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE",
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const res1 = await pool.query("SELECT COUNT(*) FROM dim_school_unique_48k");
        console.log("dim_school_unique_48k count:", res1.rows[0].count);

        const res2 = await pool.query("SELECT COUNT(*) FROM raw_school_unique_v2");
        console.log("raw_school_unique_v2 count:", res2.rows[0].count);

        const res3 = await pool.query("SELECT COUNT(*) FROM dim_school_unique_48k s48 JOIN raw_school_unique_v2 rv2 ON s48.schoolid = rv2.schoolid");
        console.log("Joined count:", res3.rows[0].count);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
main();
