import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import { 
    Calendar, ChevronLeft, LayoutList, User, Filter, ArrowRight, Globe, Percent,
    ArrowUpDown, ArrowUp, ArrowDown, Activity, Zap, Target, TrendingUp, Clock
} from 'lucide-react';
import { NEGATIVE_LOST_SET, SUCCESS_SET, INTERESTED_SET, WAITING_EVAL_SET, OFFER_SENT_SET } from '../services/mockData';

interface PipelineViewProps {
    leads: Lead[];
    onActionClick: (leads: Lead[], title: string) => void;
}

// Helpers
const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const formatMonthLabel = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

// INTERESET RATE DEFINITION
const INTERESTED_STATUSES = new Set([
    "interested can't travel",
    "interested no details",
    "offer sent",
    "pre-payment received",
    "pre/payment received",
    "rejected by doctor",
    "ticket received",
    "waiting for evaluation",
    "waiting for photo",
    "waiting for ticket",
    "evaluation done",
    "operation done"
].map(s => s.toLowerCase()));

const isInterestedLead = (status: string) => {
    return INTERESTED_STATUSES.has((status || '').toLowerCase().trim());
};

export const PipelineView: React.FC<PipelineViewProps> = ({ leads, onActionClick }) => {
    const [repViewMode, setRepViewMode] = useState<'monthly' | 'daily'>('monthly');
    const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
    
    // Sorting states
    const [statusSort, setStatusSort] = useState<{key: 'status' | 'total', direction: 'asc' | 'desc'}>({ key: 'status', direction: 'asc' });
    const [repSort, setRepSort] = useState<{key: 'rep' | 'total' | 'interest', direction: 'asc' | 'desc'}>({ key: 'total', direction: 'desc' });
    const [countrySort, setCountrySort] = useState<{key: 'country' | 'total' | 'interest', direction: 'asc' | 'desc'}>({ key: 'total', direction: 'desc' });
    const [effSort, setEffSort] = useState<{key: 'rep' | 'activeTotal' | 'dailyAvg' | 'avgScore', direction: 'asc' | 'desc'}>({ key: 'activeTotal', direction: 'desc' });

    const [minCountryLeads, setMinCountryLeads] = useState<number>(0);

    // 1. PREPARE TIME AXIS (MONTHS)
    const months = useMemo(() => {
        const uniqueMonths = new Set<string>();
        leads.forEach(l => {
            if (l.createDate) uniqueMonths.add(getMonthKey(new Date(l.createDate)));
        });
        return Array.from(uniqueMonths).sort();
    }, [leads]);

    const currentMonthKey = useMemo(() => getMonthKey(new Date()), []);

    // 2. SELLER EFFICIENCY DATA (NON-NEGATIVE)
    const efficiencyData = useMemo(() => {
        // Only non-negative leads
        const activeIntake = leads.filter(l => !NEGATIVE_LOST_SET.has((l.originalStatus || '').toLowerCase().trim()));
        
        // Group by Rep
        const repGroups: Record<string, { leads: Lead[], totalScore: number, buckets: Record<string, number> }> = {};
        activeIntake.forEach(l => {
            const r = l.repName || 'Unassigned';
            if (!repGroups[r]) {
                repGroups[r] = { leads: [], totalScore: 0, buckets: { 'New': 0, 'NR': 0, 'Interested': 0, 'Eval': 0, 'Offer': 0, 'Success': 0 } };
            }
            repGroups[r].leads.push(l);
            repGroups[r].totalScore += (l.leadScore || 0);
            
            const s = (l.originalStatus || '').toLowerCase().trim();
            if (s === 'new lead') repGroups[r].buckets['New']++;
            else if (s.startsWith('nr')) repGroups[r].buckets['NR']++;
            else if (SUCCESS_SET.has(s)) repGroups[r].buckets['Success']++;
            else if (OFFER_SENT_SET.has(s)) repGroups[r].buckets['Offer']++;
            else if (WAITING_EVAL_SET.has(s)) repGroups[r].buckets['Eval']++;
            else if (INTERESTED_SET.has(s)) repGroups[r].buckets['Interested']++;
        });

        // Calculate Days in Period for Average
        // We look at the date range of the leads provided
        let daysInPeriod = 1;
        if (leads.length > 0) {
            const dates = leads.map(l => new Date(l.createDate).getTime());
            const min = Math.min(...dates);
            const max = Math.max(...dates);
            const diff = Math.ceil((max - min) / (1000 * 60 * 60 * 24));
            
            // If it's this month, we might want to use the day of the month instead of the range
            const now = new Date();
            const filteredToThisMonth = leads.every(l => getMonthKey(new Date(l.createDate)) === getMonthKey(now));
            
            if (filteredToThisMonth) {
                daysInPeriod = now.getDate();
            } else {
                daysInPeriod = Math.max(1, diff);
            }
        }

        const list = Object.entries(repGroups).map(([name, data]) => ({
            name,
            leads: data.leads,
            activeTotal: data.leads.length,
            dailyAvg: data.leads.length / daysInPeriod,
            avgScore: data.leads.length > 0 ? data.totalScore / data.leads.length : 0,
            buckets: data.buckets
        }));

        // Sort
        list.sort((a, b) => {
            let res = 0;
            if (effSort.key === 'activeTotal') res = a.activeTotal - b.activeTotal;
            else if (effSort.key === 'dailyAvg') res = a.dailyAvg - b.dailyAvg;
            else if (effSort.key === 'avgScore') res = a.avgScore - b.avgScore;
            else res = a.name.localeCompare(b.name);
            return effSort.direction === 'asc' ? res : -res;
        });

        return { list, daysInPeriod };
    }, [leads, effSort]);

    // 3. PREPARE DATA FOR STATUS TABLE
    const statusData = useMemo(() => {
        const rows: Record<string, Record<string, Lead[]>> = {};
        const statuses = new Set<string>();

        leads.forEach(l => {
            const status = l.originalStatus || 'Unknown';
            statuses.add(status);
            const mKey = getMonthKey(new Date(l.createDate));
            if (!rows[status]) rows[status] = {};
            if (!rows[status][mKey]) rows[status][mKey] = [];
            rows[status][mKey].push(l);
        });

        const sortedStatuses = Array.from(statuses).sort((a, b) => {
            const totalA = Object.values(rows[a]).reduce((sum, list) => sum + list.length, 0);
            const totalB = Object.values(rows[b]).reduce((sum, list) => sum + list.length, 0);
            if (statusSort.key === 'total') return statusSort.direction === 'asc' ? totalA - totalB : totalB - totalA;
            return statusSort.direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });

        return { rows, sortedStatuses };
    }, [leads, statusSort]);

    // 4. PREPARE DATA FOR REP TABLE (MONTHLY)
    const repMonthlyData = useMemo(() => {
        const rows: Record<string, Record<string, Lead[]>> = {};
        const repTotals: Record<string, { total: number, interested: number }> = {};
        const reps = new Set<string>();

        leads.forEach(l => {
            const rep = l.repName || 'Unassigned';
            reps.add(rep);
            const mKey = getMonthKey(new Date(l.createDate));
            if (!rows[rep]) rows[rep] = {};
            if (!rows[rep][mKey]) rows[rep][mKey] = [];
            rows[rep][mKey].push(l);
            if (!repTotals[rep]) repTotals[rep] = { total: 0, interested: 0 };
            repTotals[rep].total++;
            if (isInterestedLead(l.originalStatus || '')) repTotals[rep].interested++;
        });

        const sortedReps = Array.from(reps).sort((a, b) => {
            const totalA = repTotals[a]?.total || 0;
            const totalB = repTotals[b]?.total || 0;
            const intA = totalA > 0 ? (repTotals[a].interested / totalA) : 0;
            const intB = totalB > 0 ? (repTotals[b].interested / totalB) : 0;
            let res = 0;
            if (repSort.key === 'total') res = totalA - totalB;
            else if (repSort.key === 'interest') res = intA - intB;
            else res = a.localeCompare(b);
            return repSort.direction === 'asc' ? res : -res;
        });

        return { rows, sortedReps, repTotals };
    }, [leads, repSort]);

    // 5. PREPARE DATA FOR REP TABLE (DAILY)
    const repDailyData = useMemo(() => {
        if (repViewMode !== 'daily' || !selectedMonthKey) return null;
        const [year, month] = selectedMonthKey.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const rows: Record<string, Record<number, Lead[]>> = {};
        const reps = new Set<string>();
        const monthLeads = leads.filter(l => getMonthKey(new Date(l.createDate)) === selectedMonthKey);
        monthLeads.forEach(l => {
            const rep = l.repName || 'Unassigned';
            reps.add(rep);
            const day = new Date(l.createDate).getDate();
            if (!rows[rep]) rows[rep] = {};
            if (!rows[rep][day]) rows[rep][day] = [];
            rows[rep][day].push(l);
        });
        const sortedReps = Array.from(reps).sort((a, b) => {
            const totalA = Object.values(rows[a]).reduce((sum, list) => sum + list.length, 0);
            const totalB = Object.values(rows[b]).reduce((sum, list) => sum + list.length, 0);
            let res = 0;
            if (repSort.key === 'total') res = totalA - totalB;
            else res = a.localeCompare(b);
            return repSort.direction === 'asc' ? res : -res;
        });
        return { rows, sortedReps, days };
    }, [leads, repViewMode, selectedMonthKey, repSort]);

    // 6. COUNTRY DATA
    const countryData = useMemo(() => {
        const rows: Record<string, Record<string, Lead[]>> = {};
        const countryTotals: Record<string, { total: number, interested: number }> = {};
        const countries = new Set<string>();
        leads.forEach(l => {
            const country = l.country || 'Unknown';
            countries.add(country);
            const mKey = getMonthKey(new Date(l.createDate));
            if (!rows[country]) rows[country] = {};
            if (!rows[country][mKey]) rows[country][mKey] = [];
            rows[country][mKey].push(l);
            if (!countryTotals[country]) countryTotals[country] = { total: 0, interested: 0 };
            countryTotals[country].total++;
            if (isInterestedLead(l.originalStatus || '')) countryTotals[country].interested++;
        });
        let filteredCountriesList = Array.from(countries).filter(c => (countryTotals[c]?.total || 0) >= minCountryLeads);
        const sortedCountries = filteredCountriesList.sort((a, b) => {
             const countA = Object.values(rows[a]).reduce((sum, list) => sum + list.length, 0);
             const countB = Object.values(rows[b]).reduce((sum, list) => sum + list.length, 0);
             const interestA = countryTotals[a]?.total > 0 ? (countryTotals[a].interested / countryTotals[a].total) : 0;
             const interestB = countryTotals[b]?.total > 0 ? (countryTotals[b].interested / countryTotals[b].total) : 0;
             let comparison = 0;
             if (countrySort.key === 'total') comparison = countA - countB;
             else if (countrySort.key === 'interest') comparison = interestA - interestB;
             else comparison = a.localeCompare(b);
             return countrySort.direction === 'asc' ? comparison : -comparison;
        });
        const visibleGrandTotal = sortedCountries.reduce((sum, c) => sum + (countryTotals[c]?.total || 0), 0);
        return { rows, sortedCountries, grandTotal: visibleGrandTotal, countryTotals };
    }, [leads, countrySort, minCountryLeads]);

    // --- HANDLERS ---
    const handleCellClick = (leadsInCell: Lead[], title: string) => {
        if (leadsInCell && leadsInCell.length > 0) onActionClick(leadsInCell, title);
    };

    // Fix: Added handleMonthHeaderClick to resolve reference error
    const handleMonthHeaderClick = (m: string) => {
        setSelectedMonthKey(m);
        setRepViewMode('daily');
    };

    const handleSort = (sort: any, setSort: any, key: string) => {
        setSort((prev: any) => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getSortIcon = (currentSort: { key: string, direction: string }, key: string) => {
        if (currentSort.key !== key) return <ArrowUpDown size={12} className="text-slate-300 dark:text-slate-600 opacity-50" />;
        return currentSort.direction === 'asc' ? <ArrowUp size={12} className="text-[#28BA9A]" /> : <ArrowDown size={12} className="text-[#28BA9A]" />;
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <LayoutList className="text-[#28BA9A]" size={32} />
                        Pipeline Matrix
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
                        Comprehensive cross-section of lead distribution, rep intake, and geographical performance.
                    </p>
                </div>
            </div>

            {/* --- NEW SECTION: SELLER EFFICIENCY (ACTIVE INTAKE) --- */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#28BA9A]/10 text-[#28BA9A] rounded-xl">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-slate-100 tracking-tight">Seller Efficiency (Active Intake)</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Excludes Negatives • MTD Daily Avg</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">Period: {efficiencyData.daysInPeriod} Days</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 pl-8 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort(effSort, setEffSort, 'rep')}>
                                    <div className="flex items-center gap-2">Representative {getSortIcon(effSort, 'rep')}</div>
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort(effSort, setEffSort, 'activeTotal')}>
                                    <div className="flex items-center justify-center gap-2">Total Active {getSortIcon(effSort, 'activeTotal')}</div>
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort(effSort, setEffSort, 'dailyAvg')}>
                                    <div className="flex items-center justify-center gap-2">Daily Avg {getSortIcon(effSort, 'dailyAvg')}</div>
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onClick={() => handleSort(effSort, setEffSort, 'avgScore')}>
                                    <div className="flex items-center justify-center gap-2">Avg Score {getSortIcon(effSort, 'avgScore')}</div>
                                </th>
                                <th className="p-4 text-center">New</th>
                                <th className="p-4 text-center">NR</th>
                                <th className="p-4 text-center">Interested</th>
                                <th className="p-4 text-center">Eval</th>
                                <th className="p-4 text-center">Offer</th>
                                <th className="p-4 text-center pr-8">Success</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {efficiencyData.list.map((rep) => (
                                <tr key={rep.name} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                    <td className="p-4 pl-8 font-black text-slate-700 dark:text-slate-200">{rep.name}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleCellClick(rep.leads, `${rep.name} - All Active Intake`)}
                                            className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                        >
                                            {rep.activeTotal}
                                        </button>
                                    </td>
                                    <td className="p-4 text-center font-mono font-bold text-[#28BA9A] bg-emerald-50/30 dark:bg-emerald-900/10">
                                        {rep.dailyAvg.toFixed(1)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            rep.avgScore >= 7 ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            rep.avgScore >= 4 ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {rep.avgScore.toFixed(1)}
                                        </span>
                                    </td>
                                    {['New', 'NR', 'Interested', 'Eval', 'Offer', 'Success'].map(bucket => (
                                        <td key={bucket} className="p-4 text-center font-bold text-slate-500 dark:text-slate-400">
                                            {rep.buckets[bucket] || <span className="text-slate-200 dark:text-slate-800 font-normal">0</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABLE 1: STATUS BY MONTH */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
                        <Filter size={20} className="text-blue-500" />
                        Volume Matrix by Status
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 pl-8 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-100 dark:border-slate-700 min-w-[220px] cursor-pointer" onClick={() => handleSort(statusSort, setStatusSort, 'status')}>
                                    <div className="flex items-center gap-2">Original CRM Status {getSortIcon(statusSort, 'status')}</div>
                                </th>
                                {months.map(m => (
                                    <th key={m} className="p-4 text-center min-w-[100px]">{formatMonthLabel(new Date(m + '-01'))}</th>
                                ))}
                                <th className="p-4 text-center font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 cursor-pointer pr-8" onClick={() => handleSort(statusSort, setStatusSort, 'total')}>
                                    <div className="flex items-center justify-center gap-2">Grand Total {getSortIcon(statusSort, 'total')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {statusData.sortedStatuses.map(status => {
                                let rowTotal = 0;
                                return (
                                    <tr key={status} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 pl-8 font-bold text-slate-700 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800 truncate" title={status}>
                                            {status}
                                        </td>
                                        {months.map(m => {
                                            const cellLeads = statusData.rows[status]?.[m] || [];
                                            const count = cellLeads.length;
                                            rowTotal += count;
                                            return (
                                                <td key={m} className="p-3 text-center">
                                                    {count > 0 ? (
                                                        <button 
                                                            onClick={() => handleCellClick(cellLeads, `${status} in ${formatMonthLabel(new Date(m + '-01'))}`)}
                                                            className="w-full py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            {count}
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-200 dark:text-slate-800">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="p-4 text-center font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 border-l border-slate-100 dark:border-slate-800 pr-8">
                                            {rowTotal}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-slate-100">
                                <td className="p-4 pl-8 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-700">Monthly Intake</td>
                                {months.map(m => {
                                    const colTotal = statusData.sortedStatuses.reduce((sum, status) => sum + (statusData.rows[status]?.[m]?.length || 0), 0);
                                    return <td key={m} className="p-4 text-center">{colTotal}</td>
                                })}
                                <td className="p-4 text-center border-l border-slate-200 dark:border-slate-700 pr-8">
                                    {statusData.sortedStatuses.reduce((acc, status) => acc + months.reduce((mAcc, m) => mAcc + (statusData.rows[status]?.[m]?.length || 0), 0), 0)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* TABLE 2: REPS BY MONTH */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden relative">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center sticky top-0 z-20 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-xl">
                            <User size={20} />
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            Lead Distribution by Representative 
                            {repViewMode === 'daily' && <span className="text-[#28BA9A] ml-2 font-normal">— Daily Analysis ({formatMonthLabel(new Date(selectedMonthKey + '-01'))})</span>}
                        </h3>
                    </div>
                    {repViewMode === 'daily' && (
                        <button 
                            onClick={() => setRepViewMode('monthly')}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-500 hover:text-[#28BA9A] transition-all flex items-center gap-2 shadow-sm"
                        >
                            <ChevronLeft size={16} /> Monthly Matrix
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    {repViewMode === 'monthly' ? (
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-4 pl-8 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-100 dark:border-slate-700 min-w-[220px] cursor-pointer" onClick={() => handleSort(repSort, setRepSort, 'rep')}>
                                        <div className="flex items-center gap-2">Representative {getSortIcon(repSort, 'rep')}</div>
                                    </th>
                                    {months.map(m => (
                                        <th key={m} className={`p-4 text-center min-w-[100px] ${m === currentMonthKey ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                                            {m === currentMonthKey ? (
                                                <button onClick={() => handleMonthHeaderClick(m)} className="font-black text-blue-600 hover:scale-110 transition-transform flex items-center justify-center gap-1 mx-auto underline decoration-2 underline-offset-4">
                                                    {formatMonthLabel(new Date(m + '-01'))}
                                                </button>
                                            ) : (
                                                formatMonthLabel(new Date(m + '-01'))
                                            )}
                                        </th>
                                    ))}
                                    <th className="p-4 text-center font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 cursor-pointer" onClick={() => handleSort(repSort, setRepSort, 'total')}>
                                        <div className="flex items-center justify-center gap-2">Volume {getSortIcon(repSort, 'total')}</div>
                                    </th>
                                    <th className="p-4 text-center font-black text-[#28BA9A] bg-slate-100 dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 cursor-pointer pr-8" onClick={() => handleSort(repSort, setRepSort, 'interest')}>
                                        <div className="flex items-center justify-center gap-2">Interest % {getSortIcon(repSort, 'interest')}</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {repMonthlyData.sortedReps.map(rep => {
                                    let rowTotal = 0;
                                    const totals = repMonthlyData.repTotals[rep] || { total: 0, interested: 0 };
                                    const interestRate = totals.total > 0 ? (totals.interested / totals.total) * 100 : 0;
                                    return (
                                        <tr key={rep} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-4 pl-8 font-bold text-slate-700 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">{rep}</td>
                                            {months.map(m => {
                                                const cellLeads = repMonthlyData.rows[rep]?.[m] || [];
                                                const count = cellLeads.length;
                                                rowTotal += count;
                                                return (
                                                    <td key={m} className={`p-3 text-center ${m === currentMonthKey ? 'bg-blue-50/10 dark:bg-blue-900/10' : ''}`}>
                                                        {count > 0 ? (
                                                            <button 
                                                                onClick={() => handleCellClick(cellLeads, `${rep} in ${formatMonthLabel(new Date(m + '-01'))}`)}
                                                                className={`w-full py-1.5 rounded-xl font-black transition-all shadow-sm ${m === currentMonthKey ? 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-white dark:hover:text-black'}`}
                                                            >
                                                                {count}
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-200 dark:text-slate-800">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-4 text-center font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/50 border-l border-slate-100 dark:border-slate-800">{rowTotal}</td>
                                            <td className="p-4 text-center font-black text-[#28BA9A] bg-slate-50 dark:bg-slate-800/50 border-l border-slate-100 dark:border-slate-800 pr-8">{interestRate.toFixed(1)}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        // DAILY VIEW
                        <table className="w-full text-left text-sm border-collapse animate-fade-in">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-4 pl-8 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-100 dark:border-slate-700 min-w-[200px]" onClick={() => handleSort(repSort, setRepSort, 'rep')}>Representative</th>
                                    {repDailyData?.days.map(day => <th key={day} className="p-2 text-center text-[9px] min-w-[32px]">{day}</th>)}
                                    <th className="p-4 text-center font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 pr-8" onClick={() => handleSort(repSort, setRepSort, 'total')}>Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {repDailyData?.sortedReps.map(rep => {
                                    let rowTotal = 0;
                                    return (
                                        <tr key={rep} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-3 pl-8 font-bold text-slate-700 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">{rep}</td>
                                            {repDailyData.days.map(day => {
                                                const cellLeads = repDailyData.rows[rep]?.[day] || [];
                                                const count = cellLeads.length;
                                                rowTotal += count;
                                                return (
                                                    <td key={day} className="p-1 text-center">
                                                        {count > 0 ? (
                                                            <button onClick={() => handleCellClick(cellLeads, `${rep} - ${day}`)} className="w-6 h-6 rounded-lg bg-[#28BA9A]/10 text-[#28BA9A] text-[10px] font-black hover:bg-[#28BA9A] hover:text-white transition-all flex items-center justify-center mx-auto">{count}</button>
                                                        ) : (
                                                            <span className="text-slate-200 dark:text-slate-800 text-[10px]">•</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-4 text-center font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/50 border-l border-slate-100 dark:border-slate-800 pr-8">{rowTotal}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* TABLE 3: COUNTRY DISTRIBUTION */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tight">
                        <Globe size={20} className="text-emerald-500" />
                        Geographical Market Split
                    </h3>
                    <div className="flex items-center gap-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Leads:</label>
                        <input 
                            type="number" 
                            min="0"
                            className="w-20 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#28BA9A]/20 transition-all outline-none"
                            value={minCountryLeads}
                            onChange={(e) => setMinCountryLeads(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 pl-8 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-100 dark:border-slate-700 min-w-[220px] cursor-pointer" onClick={() => handleSort(countrySort, setCountrySort, 'country')}>Market / Country</th>
                                {months.map(m => (
                                    <th key={m} className="p-4 text-center min-w-[100px]">{formatMonthLabel(new Date(m + '-01'))}</th>
                                ))}
                                <th className="p-4 text-center font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 cursor-pointer" onClick={() => handleSort(countrySort, setCountrySort, 'total')}>Market Share</th>
                                <th className="p-4 text-center font-black text-[#28BA9A] bg-slate-100 dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 cursor-pointer pr-8" onClick={() => handleSort(countrySort, setCountrySort, 'interest')}>Intent %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {countryData.sortedCountries.map(country => {
                                let rowTotal = 0;
                                const monthlyCounts = months.map(m => {
                                    const count = countryData.rows[country]?.[m]?.length || 0;
                                    rowTotal += count;
                                    return count;
                                });
                                const pct = countryData.grandTotal > 0 ? (rowTotal / countryData.grandTotal) * 100 : 0;
                                const totals = countryData.countryTotals[country] || { total: 0, interested: 0 };
                                const interestRate = totals.total > 0 ? (totals.interested / totals.total) * 100 : 0;
                                return (
                                    <tr key={country} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4 pl-8 font-bold text-slate-700 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">{country}</td>
                                        {monthlyCounts.map((count, idx) => (
                                            <td key={idx} className="p-3 text-center">
                                                {count > 0 ? (
                                                    <button onClick={() => handleCellClick(countryData.rows[country]?.[months[idx]] || [], `${country} in ${months[idx]}`)} className="w-full py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-[#28BA9A] font-black hover:bg-[#28BA9A] hover:text-white transition-all shadow-sm">{count}</button>
                                                ) : (
                                                    <span className="text-slate-200 dark:text-slate-800">-</span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="p-4 text-center font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/50 border-l border-slate-100 dark:border-slate-800">
                                            <div className="flex flex-col items-center">
                                                <span>{rowTotal}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{pct.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-black text-[#28BA9A] bg-slate-50 dark:bg-slate-800/50 border-l border-slate-100 dark:border-slate-800 pr-8">{interestRate.toFixed(1)}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};