import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
    try {
        const { email, otp_code } = await request.json();

        if (!email || !otp_code) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const query = `
            SELECT id FROM otps 
            WHERE email = $1 AND otp_code = $2 AND expires_at > NOW()
            ORDER BY created_at DESC LIMIT 1
        `;
        const res = await pool.query(query, [email.toLowerCase(), otp_code]);

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
        }

        return NextResponse.json({ success: true, message: 'OTP Verified' }, { status: 200 });

    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
