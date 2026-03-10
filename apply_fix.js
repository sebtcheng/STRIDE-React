const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE",
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("DROPPING EXISTING dim_schools VIEW...");
        await pool.query("DROP VIEW IF EXISTS dim_schools CASCADE");

        console.log("RECREATING dim_schools VIEW...");
        const sql = `
            CREATE VIEW dim_schools AS 
            SELECT 
                s48.*,
                rv2.totalenrolment,
                rv2.totalteachers,
                rv2.total_shortage,
                rv2.es_teachers,
                rv2.jhs_teachers,
                rv2.shs_teachers,
                rv2.instructional_rooms_2023_2024
            FROM dim_school_unique_48k s48
            LEFT JOIN raw_school_unique_v2 rv2 ON s48.schoolid = rv2.schoolid;
        `;
        await pool.query(sql);
        console.log("[OK] dim_schools view recreated successfully.");

        console.log("\nVERIFYING COLUMNS...");
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'dim_schools' AND column_name IN ('totalenrolment', 'totalteachers', 'total_shortage')");
        res.rows.forEach(row => console.log(`  Found column: ${row.column_name}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
main();
