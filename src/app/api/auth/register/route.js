import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'stride-secure-secret-key-12345';

export async function POST(request) {
    try {
        const payload = await request.json();
        const { email, password, confirmPassword, ...userData } = payload;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        if (!email.toLowerCase().endsWith('@deped.gov.ph')) {
            return NextResponse.json({ error: 'Unauthorized: Only @deped.gov.ph emails are allowed.' }, { status: 403 });
        }

        // Check if user exists
        const checkQuery = `SELECT id FROM users WHERE email = $1`;
        const checkRes = await pool.query(checkQuery, [email.toLowerCase()]);
        if (checkRes.rows.length > 0) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert
        const insertQuery = `
            INSERT INTO users (
                email, password_hash, role, station_level, office_name, school_id, position,
                first_name, middle_name, last_name, age, birthday, address, region, division, district, school
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            ) RETURNING id, email, role, first_name, last_name
        `;
        const values = [
            email.toLowerCase(), passwordHash, userData.role || 'structural',
            userData.stationLevel || null, userData.officeName || null, userData.schoolId || null,
            userData.position || null, userData.firstName || null, userData.middleName || null,
            userData.lastName || null, userData.age || null, userData.birthday || null,
            userData.address || null, userData.region || null, userData.division || null,
            userData.district || null, userData.school || null
        ];

        const insertRes = await pool.query(insertQuery, values);
        const user = insertRes.rows[0];

        // Create JWT
        const token = await new SignJWT({
            uid: user.id,
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(new TextEncoder().encode(JWT_SECRET));

        const response = NextResponse.json({ success: true, user }, { status: 201 });
        response.cookies.set('stride_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
