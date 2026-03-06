import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { graphData, filters, total, totalEntries } = body;

        if (!graphData || !graphData.labels || !graphData.values) {
            return new NextResponse("Missing graph data", { status: 400 });
        }

        // Prepare human-readable filter strings
        let filterDescriptions = [];
        if (filters.region && filters.region !== 'All Regions') filterDescriptions.push(`Region: ${filters.region}`);
        if (filters.division) filterDescriptions.push(`Division: ${filters.division}`);
        if (filters.municipality) filterDescriptions.push(`Municipality: ${filters.municipality}`);

        if (filters.aa_variables) {
            filters.aa_variables.forEach(v => {
                const displayLabel = v.label || v.column || 'Variable';
                if (v.values && v.values.length > 0) {
                    filterDescriptions.push(`${displayLabel} (IN: ${v.values.join(', ')})`);
                } else if (v.min !== undefined && v.max !== undefined) {
                    filterDescriptions.push(`${displayLabel} (BETWEEN ${v.min} and ${v.max})`);
                }
            });
        }

        const currentPct = totalEntries > 0 ? ((total / totalEntries) * 100).toFixed(2) : 0;

        const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>STRIDE Advanced Analytics Report</title>
    <!-- Use Plotly CDN for standalone rendering -->
    <script src="https://cdn.plot.ly/plotly-2.32.0.min.js"></script>
    <style>
        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .header {
            background-color: #003366;
            color: white;
            padding: 30px;
            border-bottom: 4px solid #FFB81C;
        }
        .header-title-box {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .header-icon {
            background-color: #FFB81C;
            color: #003366;
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 900;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #bfdbfe;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .content {
            padding: 30px;
        }
        .metrics-bar {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
        }
        .metric-item {
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            font-weight: 900;
            color: #0369a1;
        }
        .metric-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #7dd3fc;
            letter-spacing: 0.05em;
        }
        .filters-section {
            background: white;
            border: 1px dashed #cbd5e1;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .filters-title {
            font-size: 11px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin: 0 0 10px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #f1f5f9;
        }
        .filters-list {
            margin: 0;
            padding-left: 20px;
            font-size: 13px;
            color: #475569;
        }
        .filters-list li {
            margin-bottom: 5px;
        }
        .chart-container {
            margin-top: 40px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        .chart-header {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #plotly-div {
            width: 100%;
            height: ${Math.max(400, graphData.labels.length * 40)}px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #94a3b8;
            font-size: 11px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            font-weight: 600;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; border: none; }
            .header { background-color: #003366 !important; -webkit-print-color-adjust: exact; }
            .metrics-bar { background-color: #f0f9ff !important; -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-title-box">
                <div class="header-icon">📊</div>
                <div>
                    <h1>Advanced Matrix Analytics Report</h1>
                    <p>STRIDE System &bull; Database Query Snapshot</p>
                </div>
            </div>
        </div>

        <div class="content">
            <div class="metrics-bar">
                <div class="metric-item">
                    <div class="metric-value">${Number(total).toLocaleString()}</div>
                    <div class="metric-label">Schools Matched</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value" style="color:#0ea5e9;">${currentPct}%</div>
                    <div class="metric-label">Of Total Database</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value" style="color:#64748b;">${Number(totalEntries).toLocaleString()}</div>
                    <div class="metric-label">Total Entries Evaluated</div>
                </div>
            </div>

            <div class="filters-section">
                <h3 class="filters-title">Applied Query Parameters</h3>
                ${filterDescriptions.length > 0 ? `
                <ul class="filters-list">
                    ${filterDescriptions.map(f => `<li><strong>${f}</strong></li>`).join('')}
                </ul>
                ` : '<p style="font-size:13px; color:#94a3b8; margin:0; font-style:italic;">No custom variables applied. Showing all data.</p>'}
            </div>

            <div class="chart-container">
                <div class="chart-header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    ${graphData.title}
                </div>
                <div id="plotly-div"></div>
            </div>
        </div>

        <div class="footer">
            Generated by STRIDE v2 Analytics Engine &bull; Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
    </div>

    <!-- Inject Data safely -->
    <script>
        const graphData = ${JSON.stringify(graphData)};
        
        const data = [{
            y: graphData.labels,
            x: graphData.values,
            type: 'bar',
            orientation: 'h',
            text: graphData.values.map(v => v.toLocaleString()),
            textposition: 'outside',
            insidetextanchor: 'end',
            cliponaxis: false,
            textfont: {
                family: 'Inter, sans-serif',
                size: 11,
                color: '#475569'
            },
            marker: {
                color: '#0066CC',
                opacity: 0.95,
                line: {
                    color: '#00499b',
                    width: 1
                }
            }
        }];

        const layout = {
            font: { family: 'Inter, sans-serif', color: '#475569', size: 12 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            autosize: true,
            showlegend: false,
            margin: { t: 5, r: 200, b: 35, l: 150 },
            hovermode: 'closest',
            dragmode: false,
            xaxis: {
                visible: false,
                range: [0, Math.max(...graphData.values) * 1.25]
            },
            yaxis: {
                autorange: 'reversed',
                automargin: true,
                tickmode: 'linear',
                dtick: 1
            }
        };

        const config = { 
            displayModeBar: false, 
            responsive: true,
            staticPlot: true // Ensure it renders cleanly as a static document 
        };

        Plotly.newPlot('plotly-div', data, layout, config);
    </script>
</body>
</html>
        `;

        const filename = `STRIDE_AdvancedAnalytics_Report_${new Date().toISOString().split('T')[0]}.html`;

        return new NextResponse(htmlTemplate.trim(), {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error("Advanced Analytics Export Report Failed:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
