import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const school_id = searchParams.get('school_id');
        const region = searchParams.get('region');

        if (!school_id) {
            return NextResponse.json({ status: "error", message: "Missing school_id" }, { status: 400 });
        }

        let sql = `
            SELECT sector, COUNT(*) as cnt 
            FROM fact_industry_distance_matrix 
            WHERE school_id = $1
        `;
        let params = [school_id];

        if (region) {
            params.push(region);
            sql += ` AND region = $2`;
        }

        sql += ` GROUP BY sector`;

        const result = await pool.query(sql, params);

        const sectorsTemplate = {
            'Manufacturing and Engineering': 0,
            'Hospitality and Tourism': 0,
            'Public Administration': 0,
            'Professional/Private Services': 0,
            'Business and Finance': 0,
            'Agriculture and Agri-business': 0
        };

        result.rows.forEach(r => {
            if (sectorsTemplate[r.sector] !== undefined) {
                sectorsTemplate[r.sector] = parseInt(r.cnt, 10);
            }
        });

        return NextResponse.json({
            status: "success",
            data: sectorsTemplate
        });

    } catch (error) {
        console.error("Industries Details API Failed:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
