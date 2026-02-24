import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'Standard';
        const type = searchParams.get('type') || 'Teaching Deployment';
        const layer = searchParams.get('layer') || 'All Schools';
        const region = searchParams.get('region');
        const division = searchParams.get('division');

        let sql = "";
        let params = [];

        // Logic based on Resource Mode and Category
        if (mode === 'Standard') {
            if (type === 'Teaching Deployment') {
                sql = `
                    SELECT 
                        schoolid as id, school_name as name, municipality as mun, latitude as lat, longitude as lng,
                        total_shortage as shortage, enrollment_k12 as enrollment
                    FROM schools_master
                    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                `;
            } else if (type === 'Infrastructure') {
                sql = `
                    SELECT 
                        s.schoolid as id, s.school_name as name, s.municipality as mun, s.latitude as lat, s.longitude as lng,
                        COUNT(e.id) as metric_val, 'Projects' as metric_label
                    FROM schools_master s
                    LEFT JOIN efd_masterlist e ON s.schoolid = e.schoolid
                    WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
                `;
            } else if (type === 'Last Mile Schools') {
                sql = `
                    SELECT 
                        schoolid as id, school_name as name, municipality as mun, latitude as lat, longitude as lng,
                        1 as metric_val, 'LMS' as metric_label
                    FROM schools_master
                    WHERE (lms_status ILIKE 'yes' OR lms_school = 1)
                    AND latitude IS NOT NULL AND longitude IS NOT NULL
                `;
            } else {
                // Default Generic
                sql = `SELECT schoolid as id, school_name as name, municipality as mun, latitude as lat, longitude as lng FROM schools_master WHERE 1=1`;
            }
        } else {
            // Immersive View - Layer Based
            sql = `
                SELECT 
                    schoolid as id, school_name as name, municipality as mun, latitude as lat, longitude as lng
                FROM schools_master
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            `;
            if (layer === "Teacher Shortage") sql += " AND total_shortage > 0";
            else if (layer === "Classroom Shortage") sql += " AND classroom_requirement > 0";
            else if (layer === "Last Mile School") sql += " AND (lms_status ILIKE 'yes' OR lms_school = 1)";
        }

        // Apply Common Geographic Filters
        if (region) {
            params.push(region);
            sql += ` AND region = $${params.length}`;
        }
        if (division) {
            params.push(division);
            sql += ` AND division = $${params.length}`;
        }

        // Grouping for Infrastructure if needed
        if (mode === 'Standard' && type === 'Infrastructure') {
            sql += ` GROUP BY s.schoolid, s.school_name, s.municipality, s.latitude, s.longitude`;
        }

        sql += ` LIMIT 2000`;

        const result = await pool.query(sql, params);

        return NextResponse.json({
            status: "success",
            data: {
                totalMatched: result.rowCount,
                points: result.rows
            }
        });

    } catch (error) {
        console.error("Resource Mapping API Failed:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
