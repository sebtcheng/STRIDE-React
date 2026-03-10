const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE",
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("DROPPING EXISTING dim_schools VIEW...");
        await pool.query("DROP VIEW IF EXISTS dim_schools CASCADE");

        console.log("RECREATING COMPREHENSIVE dim_schools VIEW (V2)...");
        const sql = `
            CREATE VIEW dim_schools AS 
            SELECT 
                s48.*,
                rv2.school_name AS schoolname,
                rv2.region,
                rv2.division,
                rv2.district,
                rv2.municipality,
                rv2.legislative_district,
                rv2.latitude,
                rv2.longitude,
                rv2.school_type,
                rv2.modified_coc AS curricular_offering,
                rv2.totalenrolment,
                rv2.totalteachers,
                rv2.total_shortage,
                rv2.es_teachers,
                rv2.jhs_teachers,
                rv2.shs_teachers,
                rv2.total_excess,
                rv2.kinder,
                rv2.g1, rv2.g2, rv2.g3, rv2.g4, rv2.g5, rv2.g6,
                rv2.g7, rv2.g8, rv2.g9, rv2.g10, rv2.g11, rv2.g12,
                rv2.instructional_rooms_2023_2024
            FROM dim_school_unique_48k s48
            LEFT JOIN raw_school_unique_v2 rv2 ON s48.schoolid = rv2.schoolid;
        `;
        await pool.query(sql);
        console.log("[OK] dim_schools view recreated successfully with district columns.");

        console.log("\nVERIFYING KEY COLUMNS...");
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'dim_schools' AND column_name IN ('schoolname', 'region', 'division', 'district', 'legislative_district')");
        res.rows.forEach(row => console.log(`  Found column: ${row.column_name}`));

        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
}
main();
