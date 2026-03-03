import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dim_schools'");
        const sample = await pool.query("SELECT * FROM dim_schools LIMIT 1");
        return NextResponse.json({ columns: res.rows, sample: sample.rows[0] });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
