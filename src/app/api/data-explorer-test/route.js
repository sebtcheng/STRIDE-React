import { NextResponse } from 'next/server';
// import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const region = searchParams.get('region') || 'All Regions';
        const divisions = searchParams.getAll('division');
        const limit = parseInt(searchParams.get('limit') || '1500');

        console.log(`[DataExplorerAPI] Request: region=${region}, divisions=${divisions}, q=${query}, limit=${limit}`);

        // Simplified query for testing
        let sql = `SELECT * FROM raw_school_unique_v2 s WHERE 1=1 `;
        const params = [];

        if (region && region !== 'All Regions') {
            params.push(region);
            sql += ` AND s.region = $${params.length}`;
        }

        if (divisions && divisions.length > 0) {
            const placeholders = divisions.map((_, i) => `$${params.length + i + 1}`).join(',');
            params.push(...divisions);
            sql += ` AND s.division IN (${placeholders})`;
        }

        if (query) {
            params.push(`%${query}%`);
            sql += ` AND (
                s.school_name ILIKE $${params.length} OR 
                s.division ILIKE $${params.length} OR 
                s.municipality ILIKE $${params.length} OR 
                CAST(s.schoolid AS TEXT) ILIKE $${params.length}
            )`;
        }

        sql += ` LIMIT $${params.length + 1}`;
        params.push(limit);

        // Test dummy response
        return NextResponse.json({
            status: "success",
            data: {
                totalMatched: 1,
                displayed: 1,
                rows: [{ schoolid: '123456', school_name: 'Test School', region: 'NCR', division: 'Manila', district: '1st' }],
                columns: ['schoolid', 'school_name', 'region', 'division', 'district']
            }
        });

    } catch (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
