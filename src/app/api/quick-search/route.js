import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const region = searchParams.get('region') || 'All Regions';

        // Build SQL Query with LEFT JOIN to EFD Masterlist for Infra Project data
        let sql = `
            SELECT 
                s.schoolid as id, 
                s.schoolname as name, 
                s.region, 
                s.division, 
                s.municipality, 
                s.latitude as lat, 
                s.longitude as lng, 
                s.totalenrolment as enrolment,
                COALESCE(p.project_count, 0) as infra_projects,
                COALESCE(p.total_allocation, 0) as total_infra_value
            FROM dim_schools s
            LEFT JOIN (
                SELECT schoolid, COUNT(*) as project_count, SUM(CAST(allocation AS NUMERIC)) as total_allocation
                FROM fact_efd_masterlist
                GROUP BY schoolid
            ) p ON s.schoolid = p.schoolid
            WHERE 1=1
        `;
        const params = [];

        // Add Filters
        if (region && region !== 'All Regions') {
            params.push(region);
            sql += ` AND s.region = $${params.length}`;
        }

        if (query) {
            params.push(`%${query}%`);
            sql += ` AND (
                s.schoolname ILIKE $${params.length} OR 
                s.division ILIKE $${params.length} OR 
                s.municipality ILIKE $${params.length} OR 
                CAST(s.schoolid AS TEXT) ILIKE $${params.length}
            )`;
        }

        sql += ` LIMIT 1000`;

        const result = await pool.query(sql, params);

        return NextResponse.json({
            status: "success",
            data: {
                totalMatched: result.rowCount,
                rows: result.rows.map(row => ({
                    ...row,
                    infra_projects: Number(row.infra_projects),
                    total_infra_value: Number(row.total_infra_value)
                }))
            }
        });

    } catch (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}

