import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ status: "error", message: "School ID required" }, { status: 400 });
        }

        const sql = `
            SELECT 
                fundingyear as year,
                category,
                CAST(allocation AS NUMERIC) as allocation,
                completion,
                status
            FROM efd_masterlist
            WHERE schoolid = $1
            ORDER BY fundingyear DESC
        `;

        const result = await pool.query(sql, [id]);

        return NextResponse.json({
            status: "success",
            data: result.rows
        });

    } catch (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
