import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
    try {
        const { name, email, organization, purpose } = await request.json();

        // Validate basic requirements
        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and Email are required.' },
                { status: 400 }
            );
        }

        const query = `
            INSERT INTO guests (name, email, organization, purpose)
            VALUES ($1, $2, $3, $4)
            RETURNING id, created_at;
        `;
        const values = [name, email, organization || null, purpose || null];

        const result = await pool.query(query, values);

        return NextResponse.json({
            message: 'Guest data saved successfully to Azure SQL.',
            guestId: result.rows[0].id,
            timestamp: result.rows[0].created_at
        }, { status: 201 });

    } catch (error) {
        console.error('Error saving guest data to Azure PostgreSQL:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
