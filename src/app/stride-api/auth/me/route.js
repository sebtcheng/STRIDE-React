import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'stride-secure-secret-key-12345';

export async function GET(request) {
    try {
        const token = request.cookies.get('stride_session')?.value;

        if (!token) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        );

        if (!payload || !payload.uid) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        // Fetch full profile from DB
        const query = `
            SELECT id, email, role, first_name, last_name, position, office_name, school_id 
            FROM users 
            WHERE id = $1
        `;
        const result = await pool.query(query, [payload.uid]);

        if (result.rows.length === 0) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        return NextResponse.json({ user: result.rows[0] }, { status: 200 });

    } catch (error) {
        // If JWT is invalid/expired
        return NextResponse.json({ user: null }, { status: 200 });
    }
}
