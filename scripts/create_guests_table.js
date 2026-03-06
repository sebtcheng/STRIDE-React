const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createTable() {
    const queryText = `
        CREATE TABLE IF NOT EXISTS guests (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            organization VARCHAR(255),
            purpose TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(queryText);
        console.log("Table 'guests' created successfully or already exists.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await pool.end();
    }
}

createTable();
