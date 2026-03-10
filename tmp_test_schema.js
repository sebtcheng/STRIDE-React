const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE",
    ssl: { rejectUnauthorized: false }
});

async function testSchema() {
    try {
        console.log("TESTING NUMERIC QUERY...");
        const numericQuery = `
            SELECT 
                MIN(totalenrolment) as totalenrolment_min, MAX(totalenrolment) as totalenrolment_max,
                MIN(totalteachers) as totalteachers_min, MAX(totalteachers) as totalteachers_max,
                MIN(total_shortage) as total_shortage_min, MAX(total_shortage) as total_shortage_max,
                MIN(classroom_shortage) as classroom_shortage_min, MAX(classroom_shortage) as classroom_shortage_max,
                MIN(number_of_rooms_good_condition) as rooms_good_min, MAX(number_of_rooms_good_condition) as rooms_good_max,
                MIN(es_teachers) as es_teachers_min, MAX(es_teachers) as es_teachers_max,
                MIN(jhs_teachers) as jhs_teachers_min, MAX(jhs_teachers) as jhs_teachers_max,
                MIN(shs_teachers) as shs_teachers_min, MAX(shs_teachers) as shs_teachers_max
            FROM dim_schools
        `;
        const numRes = await pool.query(numericQuery);
        console.log("NUMERIC RANGES:", JSON.stringify(numRes.rows[0], null, 2));

        console.log("\nTESTING CATEGORICAL QUERIES...");
        const schoolTypeRes = await pool.query('SELECT DISTINCT school_type FROM dim_schools WHERE school_type IS NOT NULL ORDER BY school_type');
        console.log("SCHOOL TYPES:", schoolTypeRes.rows.map(r => r.school_type));

        const buildableSpaceRes = await pool.query('SELECT DISTINCT with_buildable_space FROM dim_schools WHERE with_buildable_space IS NOT NULL ORDER BY with_buildable_space');
        console.log("BUILDABLE SPACE OPTIONS:", buildableSpaceRes.rows.map(r => r.with_buildable_space));

        const curricularOfferingRes = await pool.query('SELECT DISTINCT curricular_offering FROM dim_schools WHERE curricular_offering IS NOT NULL ORDER BY curricular_offering');
        console.log("CURRICULAR OFFERING OPTIONS:", curricularOfferingRes.rows.map(r => r.curricular_offering));

        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
}
testSchema();
