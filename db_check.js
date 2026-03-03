const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgres://Administrator1:pRZTbQ2T1JD7@stride-posgre-prod-01.postgres.database.azure.com:5432/STRIDE",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Testing connection...');
        const res = await pool.query('SELECT DISTINCT "position" FROM gmis_filling WHERE "position" IS NOT NULL ORDER BY "position" LIMIT 50');
        console.log('Distinct Positions in gmis_filling:', res.rows.map(r => r.position));

        const countRes = await pool.query("SELECT COUNT(*) FROM dim_gmis_filling_up");
        console.log('Count in dim_gmis_filling_up:', countRes.rows[0].count);

        const countRes2 = await pool.query("SELECT COUNT(*) FROM gmis_filling");
        console.log('Count in gmis_filling:', countRes2.rows[0].count);
    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        pool.end();
    }
}

run();
