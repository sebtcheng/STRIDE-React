const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE',
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('dim_schools', 'dim_school_unique_48k', 'raw_school_level_v2')
`, (err, res) => {
    if (err) {
        console.error("DB Error:", err);
    } else {
        const tables = {};
        res.rows.forEach(r => {
            if (!tables[r.table_name]) tables[r.table_name] = [];
            tables[r.table_name].push(`${r.column_name}`);
        });
        console.log(tables);
    }
    pool.end();
});
