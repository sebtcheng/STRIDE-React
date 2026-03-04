import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const region = searchParams.get('region') || 'All Regions';
        const division = searchParams.get('division') || '';
        const district = searchParams.get('district') || '';
        const municipality = searchParams.get('municipality') || '';

        // Build SQL Query with LEFT JOIN to EFD Masterlist for Infra Project data
        let sql = `
            SELECT 
                s.schoolid as id, 
                s.school_name as name, 
                s.region, 
                s.division, 
                s.municipality, 
                s.latitude as lat, 
                s.longitude as lng, 
                CAST(COALESCE(s.totalenrolment, '0') AS NUMERIC) as enrolment,
                COALESCE(p.project_count, 0) as infra_projects,
                COALESCE(p.total_allocation, 0) as total_infra_value
            FROM raw_school_unique_v2 s
            LEFT JOIN (
                SELECT schoolid, COUNT(*) as project_count, SUM(CAST(allocation AS NUMERIC)) as total_allocation
                FROM fact_efd_masterlist
                GROUP BY schoolid
            ) p ON s.schoolid::text = p.schoolid::text
            WHERE 1=1
        `;
        const params = [];

        // Add Filters
        if (region && region !== 'All Regions') {
            params.push(region);
            sql += ` AND s.region = $${params.length}`;
        }
        if (division) {
            params.push(division);
            sql += ` AND s.division = $${params.length}`;
        }
        if (district) {
            params.push(district);
            sql += ` AND s.district = $${params.length}`;
        }
        if (municipality) {
            params.push(municipality);
            sql += ` AND s.municipality = $${params.length}`;
        }

        if (query) {
            params.push(`%${query}%`);
            sql += ` AND (
                s.school_name ILIKE $${params.length} OR 
                CAST(s.schoolid AS TEXT) ILIKE $${params.length}
            )`;
        }

        sql += ` ORDER BY s.region ASC`;

        const result = await pool.query(sql, params);

        return NextResponse.json({
            status: "success",
            data: {
                totalMatched: result.rowCount,
                rows: result.rows.map((row, index) => ({
                    ...row,
                    unique_key: `${row.id}_${index}`,
                    infra_projects: Number(row.infra_projects),
                    total_infra_value: Number(row.total_infra_value)
                }))
            }
        });

    } catch (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}

