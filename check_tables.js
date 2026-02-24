const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE',
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
`, (err, res) => {
    if (err) {
        console.error("DB Error:", err);
    } else {
        console.log("Tables in public schema:");
        res.rows.forEach(r => console.log(`- ${r.table_name}`));
    }
    pool.end();
});
