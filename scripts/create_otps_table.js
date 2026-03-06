require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otps (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp_code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Successfully created 'otps' table in Azure SQL.");
    } catch (err) {
        console.error("Error creating otps table:", err);
    } finally {
        await pool.end();
    }
}

createTable();
