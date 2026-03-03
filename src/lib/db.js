import { Pool } from 'pg';

const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    max: 10
};

let pool;

if (process.env.NODE_ENV === 'production') {
    pool = new Pool(poolConfig);
} else {
    // Determine the global object based on environment (Node.js vs Browser)
    const globalNode = typeof globalThis !== 'undefined' ? globalThis : global;
    if (!globalNode.pgPool) {
        globalNode.pgPool = new Pool(poolConfig);
    }
    pool = globalNode.pgPool;
}

export default pool;
