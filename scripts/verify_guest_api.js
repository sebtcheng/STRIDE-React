const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function verify() {
    try {
        // 1. Check if table exists and show columns
        const columnsRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'guests'
            ORDER BY ordinal_position;
        `);
        console.log("Table 'guests' columns:");
        console.table(columnsRes.rows);

        // 2. Insert a test guest
        const insertRes = await pool.query(`
            INSERT INTO guests (name, email, organization, purpose)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `, ['Test Verification', 'verify@test.com', 'STRIDE Bot', 'Verifying Azure SQL integration']);
        console.log("Test guest inserted:");
        console.log(insertRes.rows[0]);

        // 3. Clean up test row (optional)
        await pool.query("DELETE FROM guests WHERE email = 'verify@test.com'");
        console.log("Test guest cleaned up.");

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await pool.end();
    }
}

verify();
