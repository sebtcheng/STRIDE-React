"use client";

import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Search, Info, MapPin, Loader2, Database } from "lucide-react";

export default function AdvancedAnalyticsTab({ filters }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [hasQueried, setHasQueried] = useState(false);

    useEffect(() => {
        const executeQuery = async () => {
            if (!filters.aa_variables || filters.aa_variables.length === 0) return;

            setLoading(true);
            setHasQueried(true);
            try {
                const req = await fetch('/api/advanced-analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variables: filters.aa_variables,
                        region: filters.region,
                        division: filters.division,
                        municipality: filters.municipality
                    })
                });
                const res = await req.json();

                if (res.status === "success") {
                    setResults(res.data.rows || []);
                    setTotal(res.data.totalMatched || 0);
                }
            } catch (e) {
                console.error("Advanced Analytics Matrix failed:", e);
            } finally {
                setLoading(false);
            }
        };

        if (filters.aa_trigger) {
            executeQuery();
        }
    }, [filters.aa_trigger, filters.aa_variables, filters.region, filters.division, filters.municipality]);

    const columns = [
        { name: "School ID", selector: (row) => row.schoolid, sortable: true, width: "120px" },
        { name: "School Name", selector: (row) => row.name, sortable: true, grow: 2 },
        { name: "Division", selector: (row) => row.division, sortable: true },
        { name: "Municipality", selector: (row) => row.municipality, sortable: true },
        { name: "Sector Type", selector: (row) => row.school_type || 'Unknown', sortable: true }
    ];

    if (!filters.aa_variables || filters.aa_variables.length === 0) {
        return (
            <div className="flex flex-col h-full bg-slate-50 overflow-y-auto p-12 justify-center items-center">
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 flex flex-col items-center justify-center text-gray-400 max-w-2xl text-center shadow-sm">
                    <div className="bg-gray-50 p-6 rounded-full mb-6">
                        <Database size={48} className="opacity-20 text-[#003366]" />
                    </div>
                    <p className="font-black text-2xl text-gray-800 mb-2">Advanced Matrix Analytics</p>
                    <p className="text-sm font-medium">Use the left sidebar to add custom filters like Enrolment numbers or Resource Shortages to query the entire database.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-y-auto p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-[#003366] text-sm flex items-center gap-2">
                        <Search size={16} /> Filtered Database Results ({Number(total).toLocaleString()})
                    </h3>
                    {loading && (
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            <Loader2 size={12} className="animate-spin" /> Querying Dataset...
                        </div>
                    )}
                </div>

                {hasQueried && !loading && results.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-20">
                        <Info size={32} className="mb-4 text-gray-300" />
                        <p className="font-bold">No schools matched your criteria.</p>
                        <p className="text-[10px] mt-2">Try widening the Min/Max thresholds or adding more Categorical variants.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <DataTable
                            keyField="schoolid"
                            columns={columns}
                            data={results}
                            highlightOnHover
                            pointerOnHover
                            pagination
                            fixedHeader
                            progressPending={loading}
                            customStyles={{
                                headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' } },
                                rows: { style: { minHeight: '52px', '&:not(:last-child)': { borderBottom: '1px solid #f1f5f9' } } }
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="mt-6 flex gap-4">
                {(filters.aa_variables || []).map((v, i) => (
                    <div key={i} className="bg-white px-4 py-2 border border-blue-100 border-l-4 border-l-[#003366] rounded shadow-sm text-xs font-bold text-gray-700">
                        {v.column.toUpperCase()}
                        {v.min !== undefined ? ` [${v.min} - ${v.max}]` : ` [${(v.values || []).length} choices]`}
                    </div>
                ))}
            </div>
        </div>
    );
}
