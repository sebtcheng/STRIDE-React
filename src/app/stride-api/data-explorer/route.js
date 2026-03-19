import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const region = searchParams.get('region') || 'All Regions';
        const limitStr = searchParams.get('limit');

        // Build SQL Query with JOIN to Infra and raw_school_unique_v2 data
        let sql = `
            SELECT 
                s.*,
                s.schoolid::text as schoolid_str,
                COALESCE(p.project_count, 0) as infra_projects,
                COALESCE(p.total_allocation, 0) as total_infra_value,
                r.school_size_typology,
                r.total_excess,
                r.outlier_status,
                r.clustering_status,
                r.instructional_rooms_2023_2024,
                r.classroom_requirement,
                u.classroom_shortage,
                r.buildings,
                r.buidable_space,
                r.major_repair_2023_2024,
                r.total_seats_2023_2024,
                u.total_seats_shortage as total_seats_shortage_2023_2024,
                r.ownershiptype,
                r.electricitysource,
                r.watersource,
                r.english,
                r.mathematics,
                r.science,
                r.biological_sciences,
                r.physical_sciences,
                r.general_ed,
                r.araling_panlipunan,
                r.tle,
                r.mapeh,
                r.filipino,
                r.esp,
                r.agriculture,
                r.ece,
                r.sped
            FROM dim_schools s
            LEFT JOIN (
                SELECT schoolid, COUNT(*) as project_count, SUM(CAST(allocation AS NUMERIC)) as total_allocation
                FROM fact_efd_masterlist
                GROUP BY schoolid
            ) p ON s.schoolid::text = p.schoolid::text
            LEFT JOIN raw_school_unique_v2 r ON s.schoolid::text = r.schoolid::text
            LEFT JOIN dim_school_unique_48k u ON s.schoolid::text = u.schoolid::text
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
                s.schoolname ILIKE $${params.length} OR 
                s.division ILIKE $${params.length} OR 
                s.municipality ILIKE $${params.length} OR 
                CAST(s.schoolid AS TEXT) ILIKE $${params.length}
            )`;
        }

        sql += ` ORDER BY s.schoolid ASC`;

        if (limitStr && limitStr !== 'all') {
            const limit = parseInt(limitStr);
            if (!isNaN(limit)) {
                sql += ` LIMIT $${params.length + 1}`;
                params.push(limit);
            }
        }

        const result = await pool.query(sql, params);

        return NextResponse.json({
            status: "success",
            data: {
                totalMatched: result.rowCount,
                displayed: result.rows.length,
                rows: result.rows.map(row => ({
                    ...row,
                    schoolid: row.schoolid_str,
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
