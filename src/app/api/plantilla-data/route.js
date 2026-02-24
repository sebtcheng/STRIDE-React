import { NextResponse } from 'next/server';
import { initializeGlobalData } from '@/lib/dataService';

export async function GET(request) {
    try {
        const cache = await initializeGlobalData();
        const { searchParams } = new URL(request.url);
        // Possible filter: ?position=Teacher I
        const selectedPosition = searchParams.get('position');

        if (!cache.dfGMIS) {
            return NextResponse.json({ status: "error", message: "dfGMIS not loaded" }, { status: 503 });
        }

        let totalFilled = 0;
        let totalUnfilled = 0;
        const positionBreakdown = {};

        // Aggregate and filter
        cache.dfGMIS.forEach(row => {
            const pos = row.Position;
            if (!pos) return;

            // If a specific position is requested, skip non-matching rows
            if (selectedPosition && pos !== selectedPosition) return;

            const filled = Number(row['Total.Filled']) || 0;
            const unfilled = Number(row['Total.Unfilled']) || 0;

            totalFilled += filled;
            totalUnfilled += unfilled;

            if (!positionBreakdown[pos]) {
                positionBreakdown[pos] = { filled: 0, unfilled: 0 };
            }
            positionBreakdown[pos].filled += filled;
            positionBreakdown[pos].unfilled += unfilled;
        });

        // Prepare pie chart or bar chart data based on top 10 positions
        const sortedPositions = Object.keys(positionBreakdown)
            .sort((a, b) => (positionBreakdown[b].filled + positionBreakdown[b].unfilled) - (positionBreakdown[a].filled + positionBreakdown[a].unfilled))
            .slice(0, 10); // top 10 positions by volume

        return NextResponse.json({
            status: "success",
            data: {
                summary: {
                    totalFilled,
                    totalUnfilled,
                    totalItems: totalFilled + totalUnfilled,
                    fillRate: totalFilled + totalUnfilled > 0 ? ((totalFilled / (totalFilled + totalUnfilled)) * 100).toFixed(1) : 0
                },
                chartData: {
                    positions: sortedPositions,
                    filled: sortedPositions.map(p => positionBreakdown[p].filled),
                    unfilled: sortedPositions.map(p => positionBreakdown[p].unfilled)
                }
            }
        });
    } catch (error) {
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
