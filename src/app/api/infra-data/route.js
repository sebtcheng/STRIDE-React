import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { filters } = body;

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

        // We want to fetch everything we need for all 4 charts at once:
        // 1. Total Allocations per Year per Category
        // 2. Average Completion rate per Year per Category

        const sql = `
            SELECT 
                f.fundingyear as year,
                COALESCE(f.typeefd, 'Uncategorized') as category,
                SUM(CAST(f.allocation AS NUMERIC)) as total_allocation,
                COUNT(f.schoolid) as total_projects,
                SUM(CASE WHEN f.status ILIKE '%complet%' THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(f.schoolid), 0) as avg_completion
            FROM fact_efd_masterlist f
            LEFT JOIN dim_schools s ON f.schoolid = s.schoolid
            WHERE ${whereClause}
            GROUP BY f.fundingyear, f.typeefd
            ORDER BY f.fundingyear ASC, f.typeefd ASC
        `;

        const result = await pool.query(sql, params);

        // Transform SQL rows into a structured object for the frontend Recharts engine
        const yearlyData = {};
        let grandTotalProjects = 0;

        result.rows.forEach(row => {
            const year = row.year || 'Unknown';
            const cat = row.category;
            const allocation = Number(row.total_allocation) || 0;
            const completion = Number(row.avg_completion) || 0;

            if (!yearlyData[year]) {
                yearlyData[year] = { year, total_allocation: 0, categories: {} };
            }

            yearlyData[year].total_allocation += allocation;
            yearlyData[year].categories[cat] = {
                allocation: allocation,
                completion: completion,
                projects: Number(row.total_projects)
            };

            grandTotalProjects += Number(row.total_projects);
        });

        return NextResponse.json({
            status: "success",
            data: {
                summary: { totalProjects: grandTotalProjects },
                yearlyData: yearlyData
            }
        });

    } catch (error) {
        console.error("Error in infra-data API:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
