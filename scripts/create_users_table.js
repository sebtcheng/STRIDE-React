require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'structural',
                station_level VARCHAR(100),
                office_name VARCHAR(255),
                school_id VARCHAR(50),
                position VARCHAR(100),
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(100),
                age INT,
                birthday DATE,
                address TEXT,
                region VARCHAR(100),
                division VARCHAR(100),
                district VARCHAR(100),
                school VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table 'users' created successfully in Azure SQL.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await pool.end();
    }
}

createTable();
