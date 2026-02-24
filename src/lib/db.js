import { Pool } from 'pg';

// Create a singleton pool to manage PostgreSQL connections
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for some Azure Postgres configurations
    }
});

export default pool;
