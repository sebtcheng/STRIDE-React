import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const positions = searchParams.getAll('positions'); // Array of selected positions
        const region = searchParams.get('region');
        const division = searchParams.get('division');

        if (!positions || positions.length === 0) {
            return NextResponse.json({ status: "success", data: { positionsData: [], groupingLevel: division ? 'Division' : (region ? 'Division' : 'Region'), regionContext: region, divisionContext: division } });
        }

        const groupingKey = division ? 'gmis_division' : (region ? 'gmis_division' : 'gmis_region');
        const displayKey = division ? 'Division' : (region ? 'Division' : 'Region'); // What frontend expects
        const results = [];

        for (const pos of positions) {
            let totalFilled = 0;
            let totalUnfilled = 0;

            // Query DB directly for this position
            let query = `
                SELECT ${groupingKey} AS group_name, SUM(total_filled) AS filled, SUM(total_unfilled) AS unfilled
                FROM gmis_filling
                WHERE position = $1
            `;
            const params = [pos];

            if (region) {
                query += ` AND gmis_region = $${params.length + 1}`;
                params.push(region);
            }

            if (division) {
                query += ` AND gmis_division = $${params.length + 1}`;
                params.push(division);
            }

            query += ` GROUP BY ${groupingKey} ORDER BY SUM(total_filled + total_unfilled) DESC`;

            const dbRes = await pool.query(query, params);

            const groupings = [];
            const filledData = [];
            const unfilledData = [];

            dbRes.rows.forEach(row => {
                if (!row.group_name || row.group_name === '<not available>' || row.group_name === 'Unknown') return;

                const f = Number(row.filled) || 0;
                const u = Number(row.unfilled) || 0;

                totalFilled += f;
                totalUnfilled += u;

                groupings.push(row.group_name);
                filledData.push(f);
                unfilledData.push(u);
            });

            results.push({
                position: pos,
                summary: {
                    totalFilled,
                    totalUnfilled,
                    totalItems: totalFilled + totalUnfilled,
                    fillRate: totalFilled + totalUnfilled > 0 ? ((totalFilled / (totalFilled + totalUnfilled)) * 100).toFixed(1) : 0
                },
                chartData: {
                    groupings: groupings,
                    filled: filledData,
                    unfilled: unfilledData
                }
            });
        }

        return NextResponse.json({
            status: "success",
            data: {
                positionsData: results,
                groupingLevel: displayKey, // Keep frontend happy
                regionContext: region
            }
        });
    } catch (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
