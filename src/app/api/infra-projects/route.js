import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { filters, clickKey } = body;

        const regions = filters?.infra_regions || [];
        const divisions = filters?.infra_divisions || [];
        const categories = filters?.infra_categories || [];

        let whereClause = '1=1';
        const params = [];

        // Global Filters
        if (regions.length > 0) {
            whereClause += ` AND s.region = ANY($${params.length + 1})`;
            params.push(regions);
        }
        if (divisions.length > 0) {
            whereClause += ` AND s.division = ANY($${params.length + 1})`;
            params.push(divisions);
        }
        if (categories.length > 0) {
            whereClause += ` AND f.typeefd = ANY($${params.length + 1})`;
            params.push(categories);
        }

        // Drilldown (Click Interaction) Filters
        if (clickKey) {
            const { year, category, chartType } = clickKey;

            if (category) {
                whereClause += ` AND f.typeefd = $${params.length + 1}`;
                params.push(category);
            }

            if (year) {
                whereClause += ` AND f.fundingyear = $${params.length + 1}`;
                params.push(year);
            }

            // Optional chart-specific logic if necessary
            // E.g., if chartType === 'pipeline', we strictly ensure >= 2026
            if (chartType === 'pipeline') {
                whereClause += ` AND CAST(f.fundingyear AS INTEGER) >= 2026`;
            } else if (chartType === 'completion') {
                whereClause += ` AND CAST(f.fundingyear AS INTEGER) >= 2023`;
            }
        }

        const sql = `
            SELECT 
                f.id,
                s.region,
                s.division,
                s.schoolname,
                s.schoolid,
                f.fundingyear as year,
                COALESCE(f.typeefd, 'Uncategorized') as category,
                CAST(f.allocation AS NUMERIC) as allocation,
                f.status as completion_status
            FROM fact_efd_masterlist f
            LEFT JOIN dim_schools s ON f.schoolid = s.schoolid
            WHERE ${whereClause}
            ORDER BY f.fundingyear DESC, CAST(f.allocation AS NUMERIC) DESC
            LIMIT 1000
        `;

        const result = await pool.query(sql, params);

        return NextResponse.json({
            status: "success",
            data: result.rows
        });

    } catch (error) {
        console.error("Error in infra-projects API:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
