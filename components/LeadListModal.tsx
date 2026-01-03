
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lead, FunnelStage } from '../types';
import { X, ExternalLink, Filter, Search, ChevronDown, ArrowUpRight, Copy, Check, Clock, User, Activity, Download, FileSpreadsheet, Clipboard, BarChart2, List } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList, Cell } from 'recharts';

interface LeadListModalProps {
    isOpen: boolean;
    onClose: () => void;
    leads: Lead[];
    title: string;
}

export const LeadListModal: React.FC<LeadListModalProps> = ({ isOpen, onClose, leads, title }) => {
    // New Filters
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedRep, setSelectedRep] = useState<string>('All');
    const [selectedTreatment, setSelectedTreatment] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
    
    // Dropdown states
    const [isStatusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [isExportMenuOpen, setExportMenuOpen] = useState(false);
    
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Click outside handler for dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setStatusDropdownOpen(false);
            }
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setExportMenuOpen(false);
            }
        }
        if (isStatusDropdownOpen || isExportMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isStatusDropdownOpen, isExportMenuOpen]);

    // Reset filters when the modal opens with new data
    useEffect(() => {
        if (isOpen) {
            setSelectedStatuses([]); // Empty means "All"
            setSelectedRep('All');
            setSelectedTreatment('All');
            setSearchQuery('');
            setCopied(false);
            setStatusDropdownOpen(false);
            setExportMenuOpen(false);
            setViewMode('list');
        }
    }, [isOpen, leads]);

    // Extract available options
    const options = useMemo(() => {
        return {
            statuses: Array.from(new Set(leads.map(l => l.originalStatus || 'Unknown'))).sort(),
            reps: Array.from(new Set(leads.map(l => l.repName))).sort(),
            treatments: Array.from(new Set(leads.map(l => l.treatment))).sort(),
        };
    }, [leads]);

    // Filter logic
    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            // Status Multi-select Filter
            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(lead.originalStatus || 'Unknown');
            
            // Rep Filter
            const matchesRep = selectedRep === 'All' || lead.repName === selectedRep;

            // Treatment Filter
            const matchesTreatment = selectedTreatment === 'All' || lead.treatment === selectedTreatment;

            // Search
            const matchesSearch = 
                lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.repName.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesStatus && matchesSearch && matchesRep && matchesTreatment;
        });
    }, [leads, selectedStatuses, selectedRep, selectedTreatment, searchQuery]);

    // Chart Data Logic
    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredLeads.forEach(l => {
            const s = l.originalStatus || 'Unknown';
            counts[s] = (counts[s] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredLeads]);

    const handleCopyList = async () => {
        // Format for Excel/Sheets (Tab Separated Values)
        const headers = ['ID', 'Customer Name', 'Status', 'Original Status', 'NR Count', 'Lead Score', 'Email', 'Country', 'Language', 'Treatment', 'Campaign', 'Rep', 'Created Date', 'Last Update', 'Days Since Update'];
        
        const rows = filteredLeads.map(l => {
            const nrCount = (l.nrCount && l.nrCount > 0) ? l.nrCount : '-';
            return [
                l.id,
                l.customerName,
                l.status,
                l.originalStatus || '',
                nrCount,
                l.leadScore,
                l.email,
                l.country,
                l.language,
                l.treatment,
                l.campaign,
                l.repName,
                l.createDate.toLocaleDateString(),
                l.updateDate.toLocaleDateString(),
                l.diffDays
            ].join('\t');
        });

        const text = [headers.join('\t'), ...rows].join('\n');

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            setExportMenuOpen(false);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleExportExcel = () => {
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
            alert('Excel library not loaded');
            return;
        }

        const exportData = filteredLeads.map(l => ({
            'ID': l.id,
            'Customer Name': l.customerName,
            'Status': l.status,
            'Original Status': l.originalStatus || '',
            'NR Count': (l.nrCount && l.nrCount > 0) ? l.nrCount : 0,
            'Lead Score': l.leadScore,
            'Email': l.email,
            'Country': l.country,
            'Language': l.language,
            'Treatment': l.treatment,
            'Campaign': l.campaign,
            'Rep': l.repName,
            'Created Date': l.createDate.toISOString().split('T')[0],
            'Last Update': l.updateDate.toISOString().split('T')[0],
            'Days Idle': l.diffDays,
            'Revenue': l.revenue
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

        // Construct descriptive filename
        // Clean title: replace non-alphanumeric with underscore, avoid double underscores
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `Esvita_List_${safeTitle}_${dateStr}.xlsx`;

        XLSX.writeFile(workbook, filename);
        setExportMenuOpen(false);
    };

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev => 
            prev.includes(status) 
                ? prev.filter(s => s !== status) 
                : [...prev, status]
        );
    };

    if (!isOpen) return null;

    // Colors for the chart
    const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ec4899', '#ef4444', '#eab308', '#6366f1'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                
                {/* Header Section */}
                <div className="flex flex-col p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{filteredLeads.length} leads</span>
                                <span className="text-slate-300 dark:text-slate-600">|</span> 
                                <span className="text-slate-500 dark:text-slate-400">Total in selection: {leads.length}</span>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative group">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#28BA9A]" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-[#28BA9A] dark:text-slate-200 w-48 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Rep Filter */}
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
                            <User size={14} className="text-slate-400"/>
                            <select 
                                className="bg-transparent text-sm focus:outline-none text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                                value={selectedRep}
                                onChange={(e) => setSelectedRep(e.target.value)}
                            >
                                <option value="All">All Reps</option>
                                {options.reps.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {/* Treatment Filter */}
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
                            <Activity size={14} className="text-slate-400"/>
                            <select 
                                className="bg-transparent text-sm focus:outline-none text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                                value={selectedTreatment}
                                onChange={(e) => setSelectedTreatment(e.target.value)}
                            >
                                <option value="All">All Treatments</option>
                                {options.treatments.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Status Multi-Select Filter */}
                        <div className="relative z-20" ref={statusDropdownRef}>
                            <button 
                                onClick={() => setStatusDropdownOpen(!isStatusDropdownOpen)}
                                className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isStatusDropdownOpen ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <Filter size={14} className="text-slate-400"/>
                                <span>{selectedStatuses.length === 0 ? 'All Statuses' : `${selectedStatuses.length} selected`}</span>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}/>
                            </button>
                            {/* Dropdown for Statuses */}
                            {isStatusDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2 animate-fade-in-up">
                                    <div className="flex justify-between items-center mb-2 px-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Select Statuses</span>
                                        {selectedStatuses.length > 0 && (
                                            <button 
                                                onClick={() => setSelectedStatuses([])}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                                        <div 
                                            className={`px-3 py-2 rounded text-xs cursor-pointer flex items-center gap-2 ${selectedStatuses.length === 0 ? 'bg-[#28BA9A]/10 text-[#28BA9A] font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                            onClick={() => setSelectedStatuses([])}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedStatuses.length === 0 ? 'bg-[#28BA9A] border-[#28BA9A]' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                                {selectedStatuses.length === 0 && <Check size={10} className="text-white"/>}
                                            </div>
                                            All Statuses
                                        </div>
                                        {options.statuses.map(s => (
                                            <div 
                                                key={s}
                                                className={`flex items-center gap-2 px-3 py-2 rounded text-xs cursor-pointer ${selectedStatuses.includes(s) ? 'bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                onClick={() => toggleStatus(s)}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedStatuses.includes(s) ? 'bg-[#28BA9A] border-[#28BA9A]' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                                    {selectedStatuses.includes(s) && <Check size={10} className="text-white"/>}
                                                </div>
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1"></div>

                        {/* View Mode Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 mr-2">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <List size={16} />
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('chart')}
                                className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${viewMode === 'chart' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <BarChart2 size={16} />
                                Analysis
                            </button>
                        </div>

                        {/* Export Menu */}
                        <div className="relative z-20" ref={exportMenuRef}>
                            <button 
                                onClick={() => setExportMenuOpen(!isExportMenuOpen)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isExportMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                                <Download size={16} />
                                Export
                                <ChevronDown size={14} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isExportMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 animate-fade-in-up">
                                    <button 
                                        onClick={handleCopyList}
                                        className="w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors"
                                    >
                                        {copied ? <Check size={16} className="text-green-500" /> : <Clipboard size={16} className="text-slate-400" />}
                                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                                    </button>
                                    <button 
                                        onClick={handleExportExcel}
                                        className="w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors"
                                    >
                                        <FileSpreadsheet size={16} className="text-green-600" />
                                        Export to Excel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Content Area */}
                {viewMode === 'list' ? (
                    <div className="overflow-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    {[
                                        { label: 'Customer', width: 'w-1/6' },
                                        { label: 'Original Status', width: 'w-1/6' },
                                        { label: 'NR #', width: 'w-16 text-center' },
                                        { label: 'Score', width: 'w-24' },
                                        { label: 'Details', width: 'w-1/6' },
                                        { label: 'Assigned To', width: 'w-1/6' },
                                        { label: 'Last Activity', width: 'w-32' },
                                    ].map((h, i) => (
                                        <th key={i} className={`p-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${h.width}`}>
                                            {h.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredLeads.length > 0 ? filteredLeads.map(lead => {
                                    // NR Calc Logic - STRICT: Only if status is NR
                                    let nrCountDisplay = '-';
                                    let isNr = false;
                                    const s = (lead.originalStatus || '').trim().toUpperCase();

                                    if (s.startsWith('NR')) {
                                        if (lead.nrCount && lead.nrCount > 0) {
                                            nrCountDisplay = String(lead.nrCount);
                                            isNr = true;
                                        } else {
                                            // fallback regex
                                            const match = lead.originalStatus.match(/\d+/);
                                            if(match) {
                                                 nrCountDisplay = match[0];
                                                 isNr = true;
                                            }
                                        }
                                    }

                                    return (
                                        <tr key={lead.id} className="bg-white dark:bg-slate-900 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{lead.customerName}</div>
                                                <div className="text-xs text-slate-400 font-mono mt-0.5">{lead.id}</div>
                                            </td>
                                            
                                            <td className="p-4">
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                                    {lead.originalStatus}
                                                </span>
                                            </td>

                                            <td className="p-4 text-center">
                                                <span className={`text-xs font-bold ${isNr ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    {nrCountDisplay}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <div className={`text-sm font-bold ${getScoreColor(lead.leadScore)}`}>
                                                    {lead.leadScore}/10
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                 <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${
                                                    lead.treatment === 'Dental' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 
                                                    lead.treatment === 'Hair' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}>
                                                    {lead.treatment}
                                                </span>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate w-32">
                                                    {lead.country}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                                                        {lead.repName.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{lead.repName}</span>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded w-fit ${getDiffColor(lead.diffDays)}`}>
                                                    <Clock size={12} />
                                                    {lead.diffDays}d ago
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={7} className="p-16 text-center text-slate-400">
                                            No leads found matching filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // CHART ANALYSIS VIEW
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 min-h-[500px]">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                                <BarChart2 size={20} className="text-[#28BA9A]" />
                                Status Distribution Analysis
                                <span className="ml-2 text-xs font-normal text-slate-400">({filteredLeads.length} leads selected)</span>
                            </h4>
                            <div style={{ height: Math.max(500, chartData.length * 40) }} className="w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={chartData} 
                                        layout="vertical" 
                                        margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} />
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            width={180} 
                                            tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} 
                                            axisLine={false} 
                                            tickLine={false} 
                                            interval={0}
                                        />
                                        <Tooltip 
                                            cursor={{fill: '#f1f5f9', opacity: 0.1}}
                                            contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)'}}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                            <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Helper functions for styling ---

const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
};

const getDiffColor = (diff: number) => {
    if (diff <= 3) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (diff <= 7) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    if (diff <= 14) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
};
