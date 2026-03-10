const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE",
    ssl: { rejectUnauthorized: false }
});

async function explore() {
    try {
        console.log("CHECKING raw_school_unique_v2 FOR school_type AND modified_coc...");
        const res1 = await pool.query("SELECT school_type, modified_coc FROM raw_school_unique_v2 LIMIT 5");
        console.log("SAMPLE DATA:", JSON.stringify(res1.rows, null, 2));

        console.log("\nCHECKING IF curricular_offering EXISTS IN ANY TABLE...");
        const res2 = await pool.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE column_name ILIKE '%curricular%' OR column_name ILIKE '%offering%'
        `);
        console.log("SEARCH RESULTS:", JSON.stringify(res2.rows, null, 2));

        console.log("\nCHECKING TABLE dim_school_unique_48k AGAIN...");
        const res3 = await pool.query("SELECT * FROM dim_school_unique_48k LIMIT 1");
        console.log("ALL COLUMNS IN s48 (First Row Keys):", Object.keys(res3.rows[0]));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
explore();
