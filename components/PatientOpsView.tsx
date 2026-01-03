
import React, { useState, useMemo } from 'react';
import { Patient, Lead } from '../types';
import { TEAMS } from '../services/mockData';
import { Calendar, User, MapPin, Search, Plane, Clock, Filter, CheckCircle, X, ChevronRight, Euro, TrendingUp, Users, Briefcase, Globe, Activity, ArrowRight, Link, Layers, Megaphone, Tag, MessageCircle } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine 
} from 'recharts';

interface PatientOpsViewProps {
    patients: Patient[];
    leads: Lead[];
}

// Simple detail row component for the modal
const InfoBlock = ({ label, value, icon: Icon }: { label: string, value: string | number, icon?: any }) => (
    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
            {Icon && <Icon size={12}/>}
            {label}
        </div>
        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate" title={String(value)}>
            {value || '-'}
        </div>
    </div>
);

export const PatientOpsView: React.FC<PatientOpsViewProps> = ({ patients, leads }) => {
    // --- STATE FOR FILTERS ---
    
    // Time Filters
    const [dateRange, setDateRange] = useState<'month' | 'next_month' | 'last_12m' | 'next_12m' | 'custom' | 'all'>('month');
    const [customStart, setCustomStart] = useState<string>('');
    const [customEnd, setCustomEnd] = useState<string>('');

    // Attribute Filters
    const [selectedTeam, setSelectedTeam] = useState<string>('All');
    const [selectedRep, setSelectedRep] = useState<string>('All');
    const [selectedCountry, setSelectedCountry] = useState<string>('All');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [outcomeFilter, setOutcomeFilter] = useState<string>('All');

    // UI State
    const [showCompletedFirst, setShowCompletedFirst] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    
    // NEW: Selected CRM Lead for Detail Modal
    const [selectedCrmLead, setSelectedCrmLead] = useState<Lead | null>(null);

    // --- DERIVED OPTIONS ---
    const options = useMemo(() => {
        const reps = Array.from(new Set(patients.map(p => p.repName || 'Unassigned'))).sort();
        const countries = Array.from(new Set(patients.map(p => p.patientCountry))).sort();
        const categories = Array.from(new Set(patients.map(p => p.category))).sort();
        const teams = Object.keys(TEAMS).sort();
        return { reps, countries, categories, teams };
    }, [patients]);

    // --- FILTER LOGIC ---
    
    const filteredPatients = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Clear time
        
        let startCutoff: Date | null = null;
        let endCutoff: Date | null = null;

        // 1. DATE LOGIC
        if (dateRange === 'month') {
            startCutoff = new Date(now.getFullYear(), now.getMonth(), 1);
            endCutoff = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        } else if (dateRange === 'next_month') {
            startCutoff = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            endCutoff = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
        } else if (dateRange === 'last_12m') {
            startCutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            endCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        } else if (dateRange === 'next_12m') {
            startCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endCutoff = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), 23, 59, 59);
        } else if (dateRange === 'custom') {
            if (customStart) startCutoff = new Date(customStart);
            if (customEnd) endCutoff = new Date(customEnd);
            // Adjust custom end to end of day
            if (endCutoff) endCutoff.setHours(23, 59, 59, 999);
        }

        return patients.filter(p => {
            // Date Filter
            if (startCutoff && p.arrivalAnchorDate < startCutoff) return false;
            if (endCutoff && p.arrivalAnchorDate > endCutoff) return false;

            // Outcome Filter
            if (outcomeFilter !== 'All' && p.conversionOutcome !== outcomeFilter) return false;

            // Attribute Filters
            if (selectedCountry !== 'All' && p.patientCountry !== selectedCountry) return false;
            if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
            if (selectedRep !== 'All' && p.repName !== selectedRep) return false;

            // Team Filter
            if (selectedTeam !== 'All') {
                const teamMembers = TEAMS[selectedTeam] || [];
                if (!teamMembers.includes(p.repName || '')) return false;
            }

            // Search (Includes CRM ID search now)
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = 
                    p.patientName.toLowerCase().includes(q) || 
                    p.mmsId.toLowerCase().includes(q) ||
                    (p.crmId || '').toLowerCase().includes(q) ||
                    p.patientEmail.toLowerCase().includes(q) ||
                    p.patientPhone.includes(q);
                if (!match) return false;
            }

            return true;
        });
    }, [patients, dateRange, customStart, customEnd, outcomeFilter, selectedCountry, selectedCategory, selectedRep, selectedTeam, searchQuery]);

    // 2. Sort Logic
    const sortedPatients = useMemo(() => {
        return [...filteredPatients].sort((a, b) => {
            if (showCompletedFirst) {
                const aDone = a.conversionOutcome === 'Completed' ? 1 : 0;
                const bDone = b.conversionOutcome === 'Completed' ? 1 : 0;
                if (aDone !== bDone) return bDone - aDone; 
            }
            return a.arrivalAnchorDate.getTime() - b.arrivalAnchorDate.getTime();
        });
    }, [filteredPatients, showCompletedFirst]);

    // 3. Revenue Chart Data (Euro Only, Grouped Bars)
    // Three distinct bars: Expected, Paid, Remaining
    const revenueData = useMemo(() => {
        const monthlyGroups = new Map<string, { totalExpected: number, totalActual: number, date: Date }>();
        
        filteredPatients.forEach(p => {
            if (p.expectedCurrency !== 'Euro') return;
            if (p.conversionOutcome === 'Cancelled') return;

            const key = `${p.arrivalAnchorDate.getFullYear()}-${String(p.arrivalAnchorDate.getMonth()+1).padStart(2,'0')}`;
            if (!monthlyGroups.has(key)) {
                // Set date to 1st of month for sorting
                monthlyGroups.set(key, { totalExpected: 0, totalActual: 0, date: new Date(p.arrivalAnchorDate.getFullYear(), p.arrivalAnchorDate.getMonth(), 1) });
            }
            
            const entry = monthlyGroups.get(key)!;
            
            // Add Financials
            const exp = p.expectedTotalEur || 0;
            const act = p.actualReceivedEur || 0;
            
            entry.totalExpected += exp;
            entry.totalActual += act;
        });

        return Array.from(monthlyGroups.values())
            .sort((a,b) => a.date.getTime() - b.date.getTime())
            .map(d => {
                const remaining = Math.max(0, d.totalExpected - d.totalActual);
                return {
                    month: d.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                    Expected: d.totalExpected,
                    Paid: d.totalActual,
                    Remaining: remaining
                };
            });

    }, [filteredPatients]);

    // KPI Calculations (Euro Only, based on Filtered Data)
    const kpis = useMemo(() => {
        let totalExpected = 0;
        let totalActual = 0;
        let count = 0;

        filteredPatients.forEach(p => {
            if (p.expectedCurrency === 'Euro') {
                totalExpected += (p.expectedTotalEur || 0);
                totalActual += (p.actualReceivedEur || 0);
                count++;
            }
        });

        return { totalExpected, totalActual, count };
    }, [filteredPatients]);

    if (patients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                    <Plane size={48} className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">No MMS Data Loaded</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                    Please go to the Data page and upload the "MMS Report" Excel file to unlock Patient Operations and Revenue Projections.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-24 relative">
            
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Plane className="text-blue-500" />
                            Patient Ops (MMS)
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Arrival planning and financial tracking.</p>
                    </div>
                </div>

                {/* --- FILTERS BAR --- */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                    
                    {/* Row 1: Date Range */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 mr-4">
                            <Calendar size={16} className="text-slate-400"/>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Timeframe:</span>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {[
                                { id: 'month', label: 'This Month' },
                                { id: 'next_month', label: 'Next Month' },
                                { id: 'last_12m', label: 'Last 12m' },
                                { id: 'next_12m', label: 'Next 12m' },
                                { id: 'all', label: 'All Time' },
                                { id: 'custom', label: 'Custom' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setDateRange(opt.id as any)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        dateRange === opt.id 
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        
                        {dateRange === 'custom' && (
                            <div className="flex items-center gap-2 animate-fade-in bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-200" />
                                <ArrowRight size={12} className="text-slate-400"/>
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-200" />
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                    {/* Row 2: Attribute Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 mr-2">
                            <Filter size={16} className="text-slate-400"/>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filters:</span>
                        </div>

                        {/* Team Dropdown */}
                        <div className="relative group">
                            <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className={`pl-9 pr-8 py-2 text-xs font-bold rounded-xl border appearance-none outline-none cursor-pointer transition-all shadow-sm ${
                                    selectedTeam !== 'All' 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                }`}
                            >
                                <option value="All">All Teams</option>
                                {options.teams.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Rep Dropdown */}
                        <div className="relative group">
                            <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                            <select
                                value={selectedRep}
                                onChange={(e) => setSelectedRep(e.target.value)}
                                className={`pl-9 pr-8 py-2 text-xs font-bold rounded-xl border appearance-none outline-none cursor-pointer transition-all shadow-sm ${
                                    selectedRep !== 'All' 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                }`}
                            >
                                <option value="All">All Reps</option>
                                {options.reps.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {/* Country Dropdown */}
                        <div className="relative group">
                            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                            <select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                className={`pl-9 pr-8 py-2 text-xs font-bold rounded-xl border appearance-none outline-none cursor-pointer transition-all shadow-sm ${
                                    selectedCountry !== 'All' 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                }`}
                            >
                                <option value="All">All Countries</option>
                                {options.countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Category Dropdown */}
                        <div className="relative group">
                            <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className={`pl-9 pr-8 py-2 text-xs font-bold rounded-xl border appearance-none outline-none cursor-pointer transition-all shadow-sm ${
                                    selectedCategory !== 'All' 
                                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                }`}
                            >
                                <option value="All">All Categories</option>
                                {options.categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION B: REVENUE PROJECTION (GROUPED BARS) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* KPI Cards */}
                <div className="space-y-4 lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Filtered Paid (Actual)</div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Euro size={20} strokeWidth={3}/> {kpis.totalActual.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Based on current filters</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Filtered Total Expected</div>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Euro size={20} strokeWidth={3}/> {kpis.totalExpected.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">From {kpis.count} patients</div>
                    </div>
                </div>

                {/* Chart */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <TrendingUp size={20} className="text-blue-500" />
                            Revenue Projection (3-Bar View)
                        </h3>
                        <div className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            Values in Euro (€) Only
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number, name: string) => [`€${value.toLocaleString()}`, name]}
                                />
                                <Legend />
                                {/* 3 Separate Bars, no stackId */}
                                <Bar dataKey="Expected" name="Total Expected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Paid" name="Paid (Actual)" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Remaining" name="Remaining" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SECTION A: PATIENT LIST */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Table Controls */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Patient List</h3>
                        <span className="text-xs font-medium text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{filteredPatients.length}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search (Name, ID, CRM ID...)" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 w-64"
                            />
                        </div>

                        <select 
                            value={outcomeFilter} 
                            onChange={(e) => setOutcomeFilter(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold py-2 px-3 outline-none text-slate-600 dark:text-slate-300"
                        >
                            <option value="All">All Outcomes</option>
                            <option value="Completed">Completed</option>
                            <option value="Planned">Planned</option>
                            <option value="Postponed">Postponed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>

                        <button 
                            onClick={() => setShowCompletedFirst(!showCompletedFirst)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${showCompletedFirst ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                        >
                            {showCompletedFirst && <CheckCircle size={12}/>}
                            Show Completed First
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 pl-6">Arrival Date</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">IDs</th>
                                <th className="p-4">Rep / Team</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Expected</th>
                                <th className="p-4 text-right">Paid</th>
                                <th className="p-4 text-right">Upsale</th>
                                <th className="p-4">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedPatients.map((p) => (
                                <tr 
                                    key={p.mmsId} 
                                    onClick={() => setSelectedPatient(p)}
                                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group"
                                >
                                    <td className="p-4 pl-6 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                        {p.arrivalAnchorDate.toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{p.patientName}</div>
                                        <div className="text-xs text-slate-400">{p.patientCountry}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            {p.crmId && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Stop opening MMS drawer
                                                        // Robust ID matching
                                                        const targetId = String(p.crmId).trim().toLowerCase();
                                                        const matchedLead = leads.find(l => String(l.id).trim().toLowerCase() === targetId);
                                                        
                                                        if (matchedLead) {
                                                            setSelectedCrmLead(matchedLead);
                                                        } else {
                                                            alert(`CRM Lead "${p.crmId}" not found in current CRM database.`);
                                                        }
                                                    }}
                                                    className="text-[10px] font-mono bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded w-fit flex items-center gap-1 transition-colors z-20 relative"
                                                >
                                                    <Link size={8}/> {p.crmId}
                                                </button>
                                            )}
                                            <span className="text-[10px] font-mono text-slate-400">{p.mmsId}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{p.repName || '-'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-xs font-bold">{p.category}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            p.conversionOutcome === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                            p.conversionOutcome === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                            p.conversionOutcome === 'Postponed' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        }`}>
                                            {p.conversionOutcome}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-300">
                                        {p.expectedTotalEur ? `€${p.expectedTotalEur.toLocaleString()}` : <span className="text-xs text-slate-400">{p.expectedTotalRaw.toLocaleString()} {p.expectedCurrency}</span>}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        {p.actualReceivedEur ? `€${p.actualReceivedEur.toLocaleString()}` : (p.actualCollectedRaw > 0 ? p.actualCollectedRaw : '-')}
                                    </td>
                                    <td className="p-4 text-right font-mono text-purple-600 dark:text-purple-400 font-bold">
                                        {p.upsaleEur && p.upsaleEur > 0 ? `+€${p.upsaleEur.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={p.notes}>
                                        {p.notes || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DRAWER FOR PATIENT DETAILS */}
            {selectedPatient && (
                <div className="fixed inset-y-0 right-0 w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-50 border-l border-slate-200 dark:border-slate-700 animate-slide-in-right overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedPatient.patientName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                {selectedPatient.crmId && <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">CRM: {selectedPatient.crmId}</span>}
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{selectedPatient.mmsId}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedPatient(null)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X size={20} className="text-slate-400"/>
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                selectedPatient.conversionOutcome === 'Completed' ? 'bg-green-100 text-green-700' :
                                selectedPatient.conversionOutcome === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                                {selectedPatient.conversionOutcome}
                            </span>
                            <span className="text-xs font-bold text-slate-400">{selectedPatient.patientCountry}</span>
                        </div>

                        {/* Dates Section */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline</h4>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Ticket Received</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{selectedPatient.ticketDate.toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Arrival</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{selectedPatient.arrivalAnchorDate.toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Operation</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{selectedPatient.operationDate ? selectedPatient.operationDate.toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Departure</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{selectedPatient.hotelLeaveDate ? selectedPatient.hotelLeaveDate.toLocaleDateString() : '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Financials Section */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Financials</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <div className="text-xs text-blue-500 font-bold uppercase mb-1">Expected</div>
                                    <div className="text-lg font-black text-blue-700 dark:text-blue-300">
                                        {selectedPatient.expectedTotalRaw.toLocaleString()} <span className="text-xs font-normal">{selectedPatient.expectedCurrency}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                    <div className="text-xs text-emerald-500 font-bold uppercase mb-1">Collected</div>
                                    <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                                        {selectedPatient.actualCollectedRaw.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operational Details */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logistics</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex gap-3 items-center p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
                                    <MapPin size={16} className="text-slate-400"/>
                                    <div>
                                        <div className="text-xs text-slate-400">Clinic</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{selectedPatient.operationCenter}</div>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
                                    <User size={16} className="text-slate-400"/>
                                    <div>
                                        <div className="text-xs text-slate-400">Doctor</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{selectedPatient.doctor}</div>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
                                    <Briefcase size={16} className="text-slate-400"/>
                                    <div>
                                        <div className="text-xs text-slate-400">Rep</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{selectedPatient.repName || 'Unassigned'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</h4>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 italic">
                                {selectedPatient.notes || "No notes available."}
                            </div>
                        </div>

                        {/* Contact Info (if available) */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-slate-400 mb-1">Contact</div>
                            <div className="text-sm font-bold text-slate-800 dark:text-white">{selectedPatient.patientPhone}</div>
                            <div className="text-sm text-slate-500">{selectedPatient.patientEmail}</div>
                        </div>

                    </div>
                </div>
            )}

            {/* MODAL FOR CRM LEAD DETAILS */}
            {selectedCrmLead && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">CRM Lead Details</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">{selectedCrmLead.id}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedCrmLead(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X size={24} className="text-slate-400"/>
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar space-y-6">
                            
                            {/* Personal Info */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">{selectedCrmLead.customerName}</h4>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        <span>{selectedCrmLead.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Marketing Attribution */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Megaphone size={14} /> Marketing Attribution
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoBlock label="Source" value={selectedCrmLead.source} icon={Layers} />
                                    <InfoBlock label="Campaign" value={selectedCrmLead.campaign} icon={Megaphone} />
                                    <InfoBlock label="Ad Set" value={selectedCrmLead.adset || '-'} icon={Layers} />
                                    <InfoBlock label="Ad Creative" value={selectedCrmLead.ad || '-'} icon={Tag} />
                                </div>
                            </div>

                            {/* Context & Status */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Activity size={14} /> Lead Context
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <InfoBlock label="Language" value={selectedCrmLead.language} icon={MessageCircle} />
                                    <InfoBlock label="Country" value={selectedCrmLead.country} icon={Globe} />
                                    <InfoBlock label="Created Date" value={selectedCrmLead.createDate.toLocaleDateString()} icon={Calendar} />
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 mt-4">
                                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">Current Status</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{selectedCrmLead.originalStatus}</div>
                                    </div>
                                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">Lead Score</div>
                                        <div className={`font-bold text-lg ${
                                            selectedCrmLead.leadScore >= 8 ? 'text-green-600' : selectedCrmLead.leadScore >= 5 ? 'text-yellow-600' : 'text-red-500'
                                        }`}>
                                            {selectedCrmLead.leadScore}/10
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
