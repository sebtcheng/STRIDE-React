const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE',
    ssl: { rejectUnauthorized: false }
});

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'dim_school_unique_48k'", (err, res) => {
    if (err) console.error(err);
    else console.log(res.rows.map(r => r.column_name));
    pool.end();
});
