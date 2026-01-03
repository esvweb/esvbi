
import React, { useState } from 'react';
import { Upload, Download, Users, FileSpreadsheet } from 'lucide-react';

interface RepGroup {
    name: string;
    count: number;
    data: any[];
}

export const RepSplitterView: React.FC = () => {
    const [groups, setGroups] = useState<RepGroup[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const processFile = (file: File) => {
        setIsProcessing(true);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            if (!data) return;

            const XLSX = (window as any).XLSX;
            if (!XLSX) {
                alert("Excel library not loaded");
                setIsProcessing(false);
                return;
            }

            try {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                // Grouping Logic
                const grouped: Record<string, any[]> = {};
                json.forEach((row: any) => {
                    // Try to find rep column (flexible matching)
                    const keys = Object.keys(row);
                    const repKey = keys.find(k => k.toLowerCase().includes('assign') || k.toLowerCase().includes('rep') || k.toLowerCase().includes('employee')) || 'Unknown';
                    const repName = row[repKey] || 'Unassigned';
                    
                    if (!grouped[repName]) grouped[repName] = [];
                    grouped[repName].push(row);
                });

                const result = Object.entries(grouped).map(([name, rows]) => ({
                    name,
                    count: rows.length,
                    data: rows
                })).sort((a, b) => b.count - a.count);

                setGroups(result);
            } catch (err) {
                console.error(err);
                alert("Failed to parse file");
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadRepFile = (group: RepGroup) => {
        const XLSX = (window as any).XLSX;
        const ws = XLSX.utils.json_to_sheet(group.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leads");
        const safeName = group.name.replace(/[^a-z0-9]/gi, '_');
        XLSX.writeFile(wb, `${safeName}_Leads.xlsx`);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">Rep Splitter Utility</h1>
                    <p className="text-sm text-slate-500">Split one master file into individual files per sales rep.</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="glass-panel p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-500 transition-colors">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                    <Upload size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Upload Master List</h3>
                    <p className="text-sm text-slate-500">Excel or CSV files supported</p>
                </div>
                <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
            </div>

            {/* Results Grid */}
            {groups.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((g) => (
                        <div key={g.name} className="glass-panel p-6 rounded-2xl flex flex-col gap-4 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-slate-700 dark:text-slate-200 text-lg truncate w-full" title={g.name}>{g.name}</div>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded">
                                    {g.count}
                                </span>
                            </div>
                            <button 
                                onClick={() => downloadRepFile(g)}
                                className="mt-auto w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <Download size={16} /> Download CSV
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
