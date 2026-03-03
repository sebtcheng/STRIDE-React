import pool from './src/lib/db.js';

async function checkCols() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gmis_filling'");
        console.log(JSON.stringify(res.rows, null, 2));

        const sample = await pool.query("SELECT * FROM gmis_filling LIMIT 1");
        console.log("Sample:", JSON.stringify(sample.rows[0], null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkCols();
