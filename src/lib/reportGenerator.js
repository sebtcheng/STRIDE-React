/**
 * reportGenerator.js
 * Client-side utility to generate standalone HTML reports from Plotly chart data.
 * Updated to match RMarkdown style with Executive Summary and Analysis boxes.
 */

const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
};

const getAnalysisData = (chart) => {
    if (!chart.data || !chart.data[0]) return null;

    // Aggregate category values across all traces
    const categoryTotals = {};
    chart.data.forEach(trace => {
        const isHorizontal = trace.orientation === 'h';
        const categories = isHorizontal ? trace.y : trace.x;
        const values = isHorizontal ? trace.x : trace.y;

        if (!categories || !values) return;

        categories.forEach((cat, idx) => {
            const val = Number(values[idx]) || 0;
            categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
        });
    });

    // Filter and sort
    const entries = Object.entries(categoryTotals)
        .filter(([cat, val]) => {
            const lowCat = cat.toLowerCase();
            return val > 0 && !lowCat.includes('total') && !lowCat.includes('sum') && !lowCat.includes('na');
        })
        .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) return null;

    return {
        top: entries[0],
        bottom: entries[entries.length - 1],
        total: entries.reduce((acc, curr) => acc + curr[1], 0)
    };
};

export const generateHTMLReport = (title, subtitle, charts, metadata = {}) => {
    const timestamp = new Date().toLocaleString();

    // 1. Generate Executive Summary Sentences
    const summarySentences = charts.map(chart => {
        const analysis = getAnalysisData(chart);
        if (!analysis) return '';
        return `Regarding <strong>${chart.title}</strong>, the highest figure was observed in <strong>${analysis.top[0]}</strong> with a total of <strong>${formatNumber(analysis.top[1])}</strong>. `;
    }).filter(Boolean);

    const summarySection = summarySentences.length > 0 ? `
        <div class="summary-section p-8 mb-12 rounded-2xl shadow-sm border border-gray-100 bg-white relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1.5 h-full bg-[#003366]"></div>
            <h3 class="text-xl font-bold text-[#003366] mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                Executive Summary
            </h3>
            <p class="text-gray-700 leading-relaxed text-base">
                This executive summary highlights the key findings from the selected data metrics, focusing on the highest recorded values for each category.
                <span class="block mt-4">${summarySentences.join(' ')}</span>
            </p>
        </div>
    ` : '';

    // 2. Create chart elements and analysis boxes
    const chartElements = charts.map((chart, index) => {
        const analysis = getAnalysisData(chart);
        const analysisBox = analysis ? `
            <div class="analysis-box p-6 mt-8 rounded-xl border-l-4 border-[#003366] bg-[#f8fbff] text-sm text-gray-700 shadow-sm">
                <div class="flex items-center gap-2 mb-3 text-[#003366] font-black uppercase tracking-widest text-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.3-4.3"></path><circle cx="10" cy="10" r="7"></circle></svg>
                    Analytical Insights
                </div>
                <p class="leading-relaxed">
                    The visualization above illustrates the distribution for <b>${chart.title}</b>. 
                    The data indicates that <b>${analysis.top[0]}</b> holds the highest share with <b>${formatNumber(analysis.top[1])}</b>. 
                    Conversely, <b>${analysis.bottom[0]}</b> represents the lowest value in this dataset with <b>${formatNumber(analysis.bottom[1])}</b>. 
                    The total recorded count across all displayed categories is <b>${formatNumber(analysis.total)}</b>.
                </p>
            </div>
        ` : '';

        return `
            <div class="chart-container shadow-md border border-gray-100 rounded-xl bg-white p-6 mb-12">
                <h3 class="text-xl font-bold text-[#003366] mb-4">${chart.title || `Chart ${index + 1}`}</h3>
                <div id="chart-${index}" class="w-full h-[500px]"></div>
                ${analysisBox}
                <hr class="mt-8 border-gray-100" />
            </div>
        `;
    }).join('');

    const chartScripts = charts.map((chart, index) => `
        Plotly.newPlot('chart-${index}', ${JSON.stringify(chart.data)}, ${JSON.stringify({
        ...chart.layout,
        autosize: true,
        margin: { t: 40, r: 180, b: 80, l: 150 },
        font: { family: 'Inter, sans-serif' },
        xaxis: {
            title: 'Value',
            automargin: true
        },
        yaxis: {
            title: '',
            categoryorder: "total ascending",
            automargin: true
        }
    })}, { responsive: true, displayModeBar: false });
    `).join('\n');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #1e293b; }
        .header-gradient { background: linear-gradient(135deg, #003366 0%, #001a33 100%); }
        .summary-section { background-color: #f8f9fa; border-left: 5px solid #003366; }
        .analysis-box { background-color: #ffffff; }
        h1, h2, h3 { color: #003366; }
        @media print {
            .no-print { display: none; }
            body { background: white; p: 0; }
            .chart-container { break-inside: avoid; shadow: none; border: 1px solid #eee; }
        }
    </style>
</head>
<body class="p-8">
    <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <header class="header-gradient text-white p-10 rounded-3xl shadow-2xl mb-12 relative overflow-hidden">
            <div class="relative z-10">
                <div class="flex items-center gap-3 mb-4">
                    <div class="bg-yellow-400 p-2 rounded-lg text-[#003366] font-black text-xs uppercase tracking-tighter shadow-lg">
                        STRIDE REPORT
                    </div>
                    ${metadata.drill_level ? `<div class="bg-white/10 px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-blue-100">Scope: ${metadata.drill_level}</div>` : ''}
                </div>
                <h1 class="text-4xl font-black mb-2 tracking-tight text-white">${title}</h1>
                <p class="text-blue-200 text-lg font-medium opacity-90 mb-6">${subtitle}</p>
                <div class="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-blue-100/60">
                    <div class="bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm italic">Generated: ${timestamp}</div>
                    ${metadata.region ? `<div class="bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">Region: ${metadata.region}</div>` : ''}
                    ${metadata.division ? `<div class="bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">Division: ${metadata.division}</div>` : ''}
                </div>
            </div>
            <!-- Decorative circle -->
            <div class="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </header>

        <!-- Executive Summary -->
        ${summarySection}

        <!-- Metadata / Filters Applied -->
        ${metadata.filters ? `
        <div class="bg-white border border-gray-200 rounded-2xl p-6 mb-12 shadow-sm">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div class="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                Active Analysis Parameters
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                ${Object.entries(metadata.filters).map(([key, val]) => {
        if (!val || (Array.isArray(val) && val.length === 0)) return '';
        return `
                        <div>
                            <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">${key.replace(/_/g, ' ')}</span>
                            <span class="text-sm font-bold text-[#003366]">${Array.isArray(val) ? val.join(', ') : val}</span>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Charts Content -->
        <main>
            ${chartElements}
        </main>

        <!-- Footer -->
        <footer class="mt-20 pt-10 border-t border-gray-200 text-center">
            <p class="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
                Strategic Resource Inventory for Deployment Efficiency (STRIDE)
            </p>
            <p class="text-gray-300 text-[9px] mt-2 font-medium italic">
                This document is a computer-generated summary for planning purposes only.
            </p>
        </footer>
    </div>

    <script>
        window.addEventListener('load', () => {
            ${chartScripts}
        });
    </script>
</body>
</html>
    `;

    // Download the file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${dateStr}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
