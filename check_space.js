const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE',
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    select with_buildable_space from dim_school_unique_48k limit 5;
`, (err, res) => {
    if (err) console.error("DB Error:", err);
    else console.log(res.rows);
    pool.end();
});
