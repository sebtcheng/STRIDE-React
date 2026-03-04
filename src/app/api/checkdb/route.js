import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const resLms = await pool.query("SELECT * FROM efd_lms LIMIT 1");
        const resUnique = await pool.query("SELECT * FROM raw_school_unique_v2 LIMIT 1");
        return NextResponse.json({
            lmsCols: Object.keys(resLms.rows[0]),
            uniqueCols: Object.keys(resUnique.rows[0])
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
