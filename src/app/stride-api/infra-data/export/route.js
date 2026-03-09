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

            if (chartType === 'pipeline') {
                whereClause += ` AND CAST(f.fundingyear AS INTEGER) >= 2026`;
            } else if (chartType === 'completion') {
                whereClause += ` AND CAST(f.fundingyear AS INTEGER) >= 2023`;
            }
        }

        const sql = `
            SELECT 
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
        `;

        const result = await pool.query(sql, params);

        // Convert rows to CSV
        const header = ["Region", "Division", "School", "School ID", "Funding Year", "Program Category", "Allocation (PHP)", "Status"];
        const csvRows = [header.join(",")];

        result.rows.forEach(row => {
            csvRows.push([
                `"${row.region || ''}"`,
                `"${row.division || ''}"`,
                `"${(row.schoolname || '').replace(/"/g, '""')}"`,
                `"${row.schoolid || ''}"`,
                `"${row.year || ''}"`,
                `"${row.category || ''}"`,
                `${row.allocation || 0}`,
                `"${row.completion_status || ''}"`
            ].join(","));
        });

        const csvString = csvRows.join("\n");
        const filename = `STRIDE_Infra_Report_${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csvString, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error("Error exporting infra data:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
