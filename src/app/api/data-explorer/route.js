import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const region = searchParams.get('region') || 'All Regions';
        const limit = parseInt(searchParams.get('limit') || '1500');

        // Build SQL Query with JOIN to Infra data
        let sql = `
            SELECT 
                s.*,
                COALESCE(p.project_count, 0) as infra_projects,
                COALESCE(p.total_allocation, 0) as total_infra_value
            FROM schools_master s
            LEFT JOIN (
                SELECT schoolid, COUNT(*) as project_count, SUM(CAST(allocation AS NUMERIC)) as total_allocation
                FROM efd_masterlist
                GROUP BY schoolid
            ) p ON s.schoolid = p.schoolid
            WHERE 1=1
        `;
        const params = [];

        if (region && region !== 'All Regions') {
            params.push(region);
            sql += ` AND s.region = $${params.length}`;
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

        const result = await pool.query(sql, params);

        return NextResponse.json({
            status: "success",
            data: {
                totalMatched: result.rowCount,
                displayed: result.rows.length,
                rows: result.rows.map(row => ({
                    ...row,
                    infra_projects: Number(row.infra_projects),
                    total_infra_value: Number(row.total_infra_value)
                })),
                columns: result.fields.map(f => f.name)
            }
        });

    } catch (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
