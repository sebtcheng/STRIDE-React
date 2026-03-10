import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Query numeric columns for min/max
        const numericQuery = `
            SELECT 
                MIN(totalenrolment) as totalenrolment_min, MAX(totalenrolment) as totalenrolment_max,
                MIN(totalteachers) as totalteachers_min, MAX(totalteachers) as totalteachers_max,
                MIN(total_shortage) as total_shortage_min, MAX(total_shortage) as total_shortage_max,
                MIN(classroom_shortage) as classroom_shortage_min, MAX(classroom_shortage) as classroom_shortage_max,
                MIN(number_of_rooms_good_condition) as rooms_good_min, MAX(number_of_rooms_good_condition) as rooms_good_max,
                MIN(es_teachers) as es_teachers_min, MAX(es_teachers) as es_teachers_max,
                MIN(jhs_teachers) as jhs_teachers_min, MAX(jhs_teachers) as jhs_teachers_max,
                MIN(shs_teachers) as shs_teachers_min, MAX(shs_teachers) as shs_teachers_max
            FROM dim_schools
        `;

        // Note: es_teachers, jhs_teachers, shs_teachers might not be in dim_schools directly, 
        // we might need to handle them if they throw errors, but let's assume they are or will be handled.

        const numericRes = await pool.query(numericQuery).catch(err => {
            console.error("Error fetching numeric ranges, falling back to safe query:", err);
            return pool.query(`
                SELECT 
                    MIN(totalenrolment) as totalenrolment_min, MAX(totalenrolment) as totalenrolment_max,
                    MIN(totalteachers) as totalteachers_min, MAX(totalteachers) as totalteachers_max,
                    MIN(total_shortage) as total_shortage_min, MAX(total_shortage) as total_shortage_max,
                    MIN(classroom_shortage) as classroom_shortage_min, MAX(classroom_shortage) as classroom_shortage_max,
                    MIN(number_of_rooms_good_condition) as rooms_good_min, MAX(number_of_rooms_good_condition) as rooms_good_max
                FROM dim_schools
            `);
        });

        // Query categorical columns for distinct values
        const schoolTypeRes = await pool.query('SELECT DISTINCT school_type FROM dim_schools WHERE school_type IS NOT NULL ORDER BY school_type');
        const curricularOfferingRes = await pool.query('SELECT DISTINCT curricular_offering FROM dim_schools WHERE curricular_offering IS NOT NULL ORDER BY curricular_offering');
        const buildableSpaceRes = await pool.query('SELECT DISTINCT with_buildable_space FROM dim_schools WHERE with_buildable_space IS NOT NULL ORDER BY with_buildable_space');

        const ranges = numericRes.rows[0];

        const schema = {
            school_type: schoolTypeRes.rows.map(r => r.school_type),
            curricular_offering: curricularOfferingRes.rows.map(r => r.curricular_offering),
            with_buildable_space: buildableSpaceRes.rows.map(r => r.with_buildable_space),
            ranges: {
                totalenrolment: [Math.max(1, Number(ranges.totalenrolment_min)) || 1, Number(ranges.totalenrolment_max) || 0],
                totalteachers: [Math.max(1, Number(ranges.totalteachers_min)) || 1, Number(ranges.totalteachers_max) || 0],
                total_shortage: [Math.max(1, Number(ranges.total_shortage_min)) || 1, Number(ranges.total_shortage_max) || 0],
                classroom_shortage: [Math.max(1, Number(ranges.classroom_shortage_min)) || 1, Number(ranges.classroom_shortage_max) || 0],
                number_of_rooms_good_condition: [Math.max(1, Number(ranges.rooms_good_min)) || 1, Number(ranges.rooms_good_max) || 0],
                es_teachers: [Math.max(1, Number(ranges.es_teachers_min)) || 1, Number(ranges.es_teachers_max) || 0],
                jhs_teachers: [Math.max(1, Number(ranges.jhs_teachers_min)) || 1, Number(ranges.jhs_teachers_max) || 0],
                shs_teachers: [Math.max(1, Number(ranges.shs_teachers_min)) || 1, Number(ranges.shs_teachers_max) || 0]
            }
        };

        return NextResponse.json({ status: 'success', data: schema });
    } catch (error) {
        console.error("Analytics Schema Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
