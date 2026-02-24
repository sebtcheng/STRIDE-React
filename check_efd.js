const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE',
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'fact_efd_masterlist'
`, (err, res) => {
    if (err) console.error("DB Error:", err);
    else console.log(res.rows.map(r => r.column_name));
    pool.end();
});
