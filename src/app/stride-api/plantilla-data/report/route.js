import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const positions = searchParams.getAll('positions');
        const region = searchParams.get('region');
        const division = searchParams.get('division');

        if (!positions || positions.length === 0) {
            return new NextResponse("No positions selected for export.", { status: 400 });
        }

        const groupingKey = division ? 'gmis_division' : (region ? 'gmis_division' : 'gmis_region');
        const displayKey = division ? 'Division' : (region ? 'Division' : 'Region');

        let query = `
            SELECT ${groupingKey} AS group_name, SUM(total_filled) AS filled, SUM(total_unfilled) AS unfilled
            FROM gmis_filling
            WHERE position = ANY($1)
        `;
        const params = [positions];

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

        const csvRows = [];

        // CSV Header
        csvRows.push(`${displayKey},Total Filled,Total Unfilled,Total Items,Fill Rate (%)`);

        // CSV Body
        dbRes.rows.forEach(row => {
            if (!row.group_name || row.group_name === '<not available>' || row.group_name === 'Unknown') return;

            const filled = Number(row.filled) || 0;
            const unfilled = Number(row.unfilled) || 0;
            const total = filled + unfilled;
            const fillRate = total > 0 ? ((filled / total) * 100).toFixed(1) : 0;

            // Re-escape quotes if group_name contains quotes or commas
            let cleanGroup = row.group_name;
            if (cleanGroup.includes(',') || cleanGroup.includes('"')) {
                cleanGroup = `"${cleanGroup.replace(/"/g, '""')}"`;
            } else {
                cleanGroup = `"${cleanGroup}"`;
            }

            csvRows.push(`${cleanGroup},${filled},${unfilled},${total},${fillRate}`);
        });

        const csvString = csvRows.join('\r\n');

        // Define export filename contextually
        const filename = region
            ? `plantilla_division_report_${region.replace(/\s+/g, '_')}.csv`
            : `plantilla_national_region_report.csv`;

        return new NextResponse(csvString, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            }
        });

    } catch (error) {
        return new NextResponse(`Export failed: ${error.message}`, { status: 500 });
    }
}
