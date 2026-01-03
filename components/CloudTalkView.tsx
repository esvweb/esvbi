import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, Globe, Map, Info, AlertTriangle, RefreshCw, Phone, ShieldAlert, X } from 'lucide-react';

interface ProcessedBatch {
    oceania: any[];
    global: any[];
    stats: {
        total: number;
        sanitized: number;
        oceaniaCount: number;
        globalCount: number;
    }
}

export const CloudTalkView: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [batchData, setBatchData] = useState<ProcessedBatch | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- LOGIC ENGINE ---

    const processData = (json: any[]) => {
        const oceania: any[] = [];
        const global: any[] = [];
        let sanitizedCount = 0;

        json.forEach(row => {
            // 1. Normalize Keys (Case insensitive lookup)
            const keys = Object.keys(row);
            const getKey = (target: string) => keys.find(k => k.toLowerCase().trim() === target) || '';
            
            const rawName = row[getKey('customer_name')] || 'Unknown';
            const rawPhone = String(row[getKey('customer_phone')] || '');
            const rawTreatment = row[getKey('custom_operation_choice')] || 'General Inquiry';

            // 2. Phone Cleaning
            // Remove all non-numeric characters
            const cleanPhone = rawPhone.replace(/\D/g, '');
            if (cleanPhone.length < 5) return; // Skip invalid numbers

            // 3. Name Sanitization (Rule 2)
            // Allow only Latin letters, numbers, spaces, and basic punctuation
            const isSafeName = /^[a-zA-Z0-9\s\.,'-]+$/.test(rawName);
            let finalName = rawName;

            if (!isSafeName) {
                const last4 = cleanPhone.slice(-4);
                finalName = `Customer ${last4}`;
                sanitizedCount++;
            }

            // 4. Context Injection (Rule 3)
            // Format: "Name//Treatment"
            const cloudTalkName = `${finalName}//${rawTreatment}`;

            const record = {
                name: cloudTalkName,
                phone: cleanPhone
            };

            // 5. Split Logic (Rule 1)
            // Oceania: Starts with 61 (AU) or 64 (NZ)
            if (cleanPhone.startsWith('61') || cleanPhone.startsWith('64')) {
                oceania.push(record);
            } else {
                global.push(record);
            }
        });

        setBatchData({
            oceania,
            global,
            stats: {
                total: json.length,
                sanitized: sanitizedCount,
                oceaniaCount: oceania.length,
                globalCount: global.length
            }
        });
        setIsProcessing(false);
    };

    const parseFile = (file: File) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            if (!data) return;

            const XLSX = (window as any).XLSX;
            if (!XLSX) {
                alert("Excel engine not loaded. Please refresh.");
                setIsProcessing(false);
                return;
            }

            try {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                processData(json);
            } catch (err) {
                console.error(err);
                alert("Failed to parse file.");
                setIsProcessing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    // --- EXPORT ---

    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert("No data in this batch.");
            return;
        }
        // Header + Rows
        const csvContent = "data:text/csv;charset=utf-8," 
            + "name,phone\n" 
            + data.map(e => `"${e.name}",${e.phone}`).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- HANDLERS ---

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) parseFile(e.dataTransfer.files[0]);
    };

    return (
        <div className="animate-fade-in pb-12">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg">
                    <Phone size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">CloudTalk Converter</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Intelligent lead splitting & sanitization for dialer import.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: MAIN ACTION AREA */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {!batchData ? (
                        /* STATE A: IDLE / UPLOAD */
                        <div 
                            className={`border-3 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center text-center transition-all h-[400px] ${
                                isDragging 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                        >
                            <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-blue-500">
                                {isProcessing ? <RefreshCw size={40} className="animate-spin"/> : <FileSpreadsheet size={40} />}
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
                                {isProcessing ? 'Processing Leads...' : 'Drag & Drop Excel File'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm font-medium">
                                Supports .xlsx files. Will automatically split by timezone and sanitize names.
                            </p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".xlsx,.xls" 
                                onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all hover:scale-105"
                            >
                                Select File manually
                            </button>
                        </div>
                    ) : (
                        /* STATE B: SUCCESS / DOWNLOAD */
                        <div className="animate-fade-in space-y-6">
                            
                            {/* Summary Banner */}
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-300">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-green-800 dark:text-green-200">Conversion Ready!</h3>
                                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                            Processed {batchData.stats.total} leads. 
                                            {batchData.stats.sanitized > 0 && <span className="ml-1 font-bold bg-green-200 dark:bg-green-800 px-2 py-0.5 rounded-md text-xs">{batchData.stats.sanitized} Names Sanitized</span>}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setBatchData(null)}
                                    className="text-sm font-bold text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 underline"
                                >
                                    Convert Another File
                                </button>
                            </div>

                            {/* Download Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Oceania Batch */}
                                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                                <Map size={24} />
                                            </div>
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">Batch A</span>
                                        </div>
                                        <h3 className="text-2xl font-black mb-1">Oceania</h3>
                                        <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-6">Australia & New Zealand</p>
                                        
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="text-4xl font-black">{batchData.stats.oceaniaCount}</div>
                                                <div className="text-xs text-blue-100 font-medium">Leads Ready</div>
                                            </div>
                                            <button 
                                                onClick={() => downloadCSV(batchData.oceania, `Oceania_Leads_${new Date().toISOString().split('T')[0]}.csv`)}
                                                className="px-4 py-2 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2"
                                            >
                                                <Download size={16} /> CSV
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Global Batch */}
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                                <Globe size={24} />
                                            </div>
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">Batch B</span>
                                        </div>
                                        <h3 className="text-2xl font-black mb-1">Global</h3>
                                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-6">Rest of World</p>
                                        
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="text-4xl font-black">{batchData.stats.globalCount}</div>
                                                <div className="text-xs text-indigo-200 font-medium">Leads Ready</div>
                                            </div>
                                            <button 
                                                onClick={() => downloadCSV(batchData.global, `Global_Leads_${new Date().toISOString().split('T')[0]}.csv`)}
                                                className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2"
                                            >
                                                <Download size={16} /> CSV
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: SIDEBAR INFO */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3 text-sm">
                            <Info size={16} className="text-blue-500" /> Split Logic
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Leads are automatically separated based on phone prefix to optimize calling hours.
                        </p>
                        <div className="mt-3 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                <span className="font-bold text-slate-600 dark:text-slate-300">Prefix 61, 64</span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Oceania</span>
                            </div>
                            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                <span className="font-bold text-slate-600 dark:text-slate-300">Others</span>
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">Global</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3 text-sm">
                            <ShieldAlert size={16} className="text-orange-500" /> Name Sanitization
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                            Dialers crash on Symbols, Emojis, or Cyrillic/Arabic scripts. We automatically rename unsafe entries.
                        </p>
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-2 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <X size={12} className="text-red-500"/>
                                <span className="text-[10px] text-slate-400 line-through">Ahmed 🚀 King</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={12} className="text-green-500"/>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Customer 4821</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3 text-sm">
                            <RefreshCw size={16} className="text-purple-500" /> Context Injection
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Treatment info is injected into the name field so agents see it immediately during the call.
                        </p>
                        <div className="mt-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            John Doe//Hair Transplant
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};