const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE',
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    DROP VIEW IF EXISTS dim_schools;
    CREATE VIEW dim_schools AS 
    SELECT 
        l.schoolid,
        l.schoolname,
        l.region,
        l.division,
        l.municipality,
        l.district,
        l.sector,
        l.school_type,
        l.modified_coc AS curricular_offering,
        l.totalenrolment,
        l.kinder,
        l.g1, l.g2, l.g3, l.g4, l.g5, l.g6, l.g7, l.g8, l.g9, l.g10, l.g11, l.g12,
        l.totalteachers,
        l.teachershortage AS total_shortage,
        l.latitude,
        l.longitude,
        u.classroom_shortage,
        u.with_buildable_space,
        u.building_count_good_condition,
        u.building_count_needs_major_repair,
        u.building_count_condemned__for_demolition,
        u.building_count_for_completion,
        u.building_count_ongoing_construction,
        u.number_of_rooms_good_condition,
        u.number_of_rooms_needs_major_repair,
        u.number_of_rooms_condemned__for_demolition,
        u.number_of_rooms_for_completion,
        u.number_of_rooms_ongoing_construction
    FROM raw_school_level_v2 l
    LEFT JOIN dim_school_unique_48k u ON l.schoolid = u.schoolid;
`, (err, res) => {
    if (err) {
        console.error("DB Error:", err);
    } else {
        console.log("View dim_schools created successfully!");
    }
    pool.end();
});
