import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
    const { id } = await params;

    try {
        // Fetch everything from dim_schools for this school
        const schoolRes = await pool.query('SELECT s.* FROM dim_schools s WHERE s.schoolid = $1', [id]);

        if (schoolRes.rowCount === 0) {
            return NextResponse.json({ status: "error", message: "School not found" }, { status: 404 });
        }

        const school = schoolRes.rows[0];

        // Fetch infrastructure summary
        const infraRes = await pool.query(`
            SELECT 
                COUNT(*) as project_count, 
                SUM(CAST(allocation AS NUMERIC)) as total_allocation,
                COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'Ongoing' THEN 1 END) as ongoing_count
            FROM fact_efd_masterlist
            WHERE schoolid = $1
        `, [id]);

        const infraSummary = infraRes.rows[0];

        // Fetch specific project list
        const projectsRes = await pool.query(`
            SELECT * FROM fact_efd_masterlist WHERE schoolid = $1 ORDER BY fundingyear DESC
        `, [id]);

        return NextResponse.json({
            status: "success",
            data: {
                profile: school,
                infra: {
                    summary: {
                        count: parseInt(infraSummary.project_count),
                        total_budget: parseFloat(infraSummary.total_allocation || 0),
                        completed: parseInt(infraSummary.completed_count),
                        ongoing: parseInt(infraSummary.ongoing_count)
                    },
                    projects: projectsRes.rows
                }
            }
        });

    } catch (error) {
        console.error("Error fetching school profile:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
