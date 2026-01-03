import React, { useMemo, useState, useEffect } from 'react';
import { Lead } from '../types';
import { 
    User, Users, Trophy, Target, AlertCircle, Clock, CheckCircle, 
    XCircle, ChevronRight, Activity, Globe, Megaphone, Phone, Mail, ArrowUpRight, Camera,
    Filter, Percent, FileText, Zap
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    CartesianGrid, Line, ComposedChart, Legend 
} from 'recharts';
import { calculateFunnelStats, NEGATIVE_LOST_SET, SUCCESS_SET, TEAMS } from '../services/mockData';
import { FunnelChart } from './FunnelChart';

interface RepPerformanceViewProps {
    leads: Lead[];
    targets: Record<string, any>; 
    onLeadClick: (leads: Lead[], title: string) => void;
}

type SortMode = 'sales' | 'acquisition' | 'qualification' | 'conversion';

const safeDiv = (num: number, den: number) => den > 0 ? (num / den) * 100 : 0;
const INTERESTED_STATUSES = new Set(["interested can't travel", "interested no details", "offer sent", "pre-payment received", "pre/payment received", "rejected by doctor", "ticket received", "waiting for evaluation", "waiting for photo", "waiting for ticket", "evaluation done", "operation done", "lost"].map(s => s.toLowerCase()));
const isInterestedLead = (status: string) => INTERESTED_STATUSES.has((status || '').toLowerCase().trim());

// Custom Tooltip Style for High Visibility in both Light/Dark modes
const customTooltipStyle = {
    backgroundColor: '#0f172a', // Slate 900
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#f8fafc', // Slate 50
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

export const RepPerformanceView: React.FC<RepPerformanceViewProps> = ({ leads, targets, onLeadClick }) => {
    const [sortMode, setSortMode] = useState<SortMode>('sales');
    
    // Copy Chart Logic
    const copyChart = async (elementId: string) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const html2canvas = (window as any).html2canvas;
        if (!html2canvas) {
            alert("Image export module not loaded yet. Please refresh.");
            return;
        }
    
        const btn = document.getElementById(`btn-copy-${elementId}`);
        const originalContent = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = `<span class='text-xs font-bold'>...</span>`;
    
        try {
            const isDark = document.documentElement.classList.contains('dark');
            const canvas = await html2canvas(element, {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                scale: 2,
                ignoreElements: (node: Element) => node.hasAttribute && node.hasAttribute('data-html2canvas-ignore')
            });
    
            canvas.toBlob(async (blob: Blob | null) => {
                if (blob) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    if (btn) {
                        btn.innerHTML = `<span class='text-xs font-bold text-green-500'>Copied!</span>`;
                        setTimeout(() => { if (btn) btn.innerHTML = originalContent; }, 2000);
                    }
                }
            });
        } catch (err) {
            console.error('Export failed', err);
            if (btn) btn.innerHTML = originalContent;
        }
    };

    // ... (Keep existing Data Logic unchanged) ...
    const { repList, companyStats } = useMemo(() => {
        const reps = Array.from(new Set(leads.map(l => l.repName))).filter(r => r && r !== 'Unassigned').sort();
        const globalFunnel = calculateFunnelStats(leads);
        const globalTotal = leads.length;
        const globalConversion = safeDiv(globalFunnel['Success'], globalFunnel['New']);
        const globalNrLeads = leads.filter(l => (l.originalStatus || '').toUpperCase().startsWith('NR'));
        const globalNrRate = safeDiv(globalNrLeads.length, globalTotal);
        const globalInterested = leads.filter(l => isInterestedLead(l.originalStatus || '')).length;
        const globalInterestRate = safeDiv(globalInterested, globalTotal);
        const globalCountryCounts: Record<string, number> = {};
        leads.forEach(l => { globalCountryCounts[l.country || 'Unknown'] = (globalCountryCounts[l.country || 'Unknown'] || 0) + 1; });

        const list = reps.map(name => {
            const repLeads = leads.filter(l => l.repName === name);
            const funnel = calculateFunnelStats(repLeads);
            const sales = funnel['Success'];
            const offers = funnel['OfferSent']; // Acquisition metric
            const total = repLeads.length;
            const conversion = safeDiv(sales, total);
            const interested = repLeads.filter(l => isInterestedLead(l.originalStatus || '')).length;
            const interestRate = safeDiv(interested, total);
            return { name, sales, conversion, total, interestRate, offers };
        });

        // Dynamic Sorting based on Filter
        list.sort((a, b) => {
            if (sortMode === 'sales') return b.sales - a.sales;
            if (sortMode === 'acquisition') return b.offers - a.offers;
            if (sortMode === 'qualification') return b.interestRate - a.interestRate;
            if (sortMode === 'conversion') return b.conversion - a.conversion;
            return b.sales - a.sales;
        });

        return { repList: list, companyStats: { funnel: globalFunnel, conversion: globalConversion, total: globalTotal, nrRate: globalNrRate, interestRate: globalInterestRate, countryCounts: globalCountryCounts }};
    }, [leads, sortMode]);

    const [selectedRepId, setSelectedRepId] = useState<string>(repList[0]?.name || '');

    useEffect(() => {
        if (!repList.find(r => r.name === selectedRepId) && repList.length > 0) {
            setSelectedRepId(repList[0].name);
        }
    }, [repList, selectedRepId]);

    const repData = useMemo(() => {
        if (!selectedRepId) return null;
        const myLeads = leads.filter(l => l.repName === selectedRepId);
        const funnel = calculateFunnelStats(myLeads);
        const interestedLeads = myLeads.filter(l => isInterestedLead(l.originalStatus || ''));
        const interestRate = safeDiv(interestedLeads.length, myLeads.length);
        const nrLeads = myLeads.filter(l => (l.originalStatus || '').toUpperCase().startsWith('NR'));
        const nrRate = safeDiv(nrLeads.length, myLeads.length);
        const activeLeads = myLeads.filter(l => {
            const s = (l.originalStatus || '').toLowerCase().trim();
            if (s === 'new lead' || s.startsWith('nr')) return false;
            if (SUCCESS_SET.has(s)) return false;
            if (NEGATIVE_LOST_SET.has(s)) return false;
            return true;
        });
        const staleLeads = activeLeads.filter(l => l.diffDays > 7);
        const evalStuck = myLeads.filter(l => (l.originalStatus || '').toLowerCase().includes('waiting for evaluation') && l.diffDays > 2);
        const wonLeads = myLeads.filter(l => SUCCESS_SET.has((l.originalStatus||'').toLowerCase()));
        const avgDaysToClose = wonLeads.length > 0 ? wonLeads.reduce((acc, l) => acc + l.diffDays, 0) / wonLeads.length : 0; 
        
        // --- TEAM STATS CALCULATION ---
        const currentTeamName = Object.keys(TEAMS).find(team => TEAMS[team].includes(selectedRepId));
        const teamMembers = currentTeamName ? TEAMS[currentTeamName] : [];
        const teamLeads = leads.filter(l => teamMembers.includes(l.repName));
        const teamFunnel = calculateFunnelStats(teamLeads);
        const teamTotal = teamLeads.length;

        const stages = ['New', 'Interested', 'WaitingEval', 'OfferSent', 'Success'];
        const chartData = stages.map(stage => {
            const repVal = funnel[stage] || 0;
            const teamVal = teamFunnel[stage] || 0;
            const compVal = companyStats.funnel[stage] || 0;
            return {
                stage: stage === 'WaitingEval' ? 'Eval' : stage === 'OfferSent' ? 'Offer' : stage,
                Rep: parseFloat(safeDiv(repVal, myLeads.length).toFixed(1)),
                Team: parseFloat(safeDiv(teamVal, teamTotal).toFixed(1)),
                Company: parseFloat(safeDiv(compVal, companyStats.total).toFixed(1)),
                repCount: repVal, teamCount: teamVal, compCount: compVal
            };
        });
        
        // --- NEW MARKET FOCUS LOGIC ---
        // 1. Calculate Rep's counts
        const repCountryCounts: Record<string, number> = {};
        myLeads.forEach(l => { repCountryCounts[l.country || 'Unknown'] = (repCountryCounts[l.country || 'Unknown'] || 0) + 1; });

        // 2. Calculate Team's counts
        const teamCountryCounts: Record<string, number> = {};
        teamLeads.forEach(l => { teamCountryCounts[l.country || 'Unknown'] = (teamCountryCounts[l.country || 'Unknown'] || 0) + 1; });

        // 3. Identify Top 7 GLOBAL Countries (Company Wide)
        const top7GlobalCountries = Object.entries(companyStats.countryCounts)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 7)
            .map(entry => entry[0]);

        // 4. Build Comparison Data (Rep % vs Team % vs Company %)
        const countryChartData = top7GlobalCountries.map(c => ({
             country: c,
             Rep: parseFloat(safeDiv(repCountryCounts[c] || 0, myLeads.length).toFixed(1)),
             Team: parseFloat(safeDiv(teamCountryCounts[c] || 0, teamTotal).toFixed(1)),
             Company: parseFloat(safeDiv(companyStats.countryCounts[c] || 0, companyStats.total).toFixed(1)),
             repCount: repCountryCounts[c] || 0, 
             teamCount: teamCountryCounts[c] || 0,
             compCount: companyStats.countryCounts[c] || 0
        }));

        const sourceGroups: Record<string, Lead[]> = {};
        myLeads.forEach(l => {
            const s = l.source || 'Unknown';
            if(!sourceGroups[s]) sourceGroups[s] = [];
            sourceGroups[s].push(l);
        });
        const sourceFunnels = Object.entries(sourceGroups).map(([source, sLeads]) => ({
                source, total: sLeads.length, funnel: calculateFunnelStats(sLeads), leads: sLeads
        })).sort((a, b) => b.total - a.total).slice(0, 6);
        
        return {
            leads: myLeads, funnel, nrRate, nrLeads, interestRate, interestedLeads, staleCount: staleLeads.length, staleLeads,
            activeCount: activeLeads.length, evalStuckCount: evalStuck.length, evalStuckLeads: evalStuck, avgDaysToClose, wonLeads,
            chartData, countryChartData, sourceFunnels, rank: repList.findIndex(r => r.name === selectedRepId) + 1,
            conversion: safeDiv(funnel['Success'], myLeads.length),
            teamName: currentTeamName
        };
    }, [selectedRepId, leads, repList, companyStats]);

    if (!repData) return <div className="p-8 text-center text-slate-400">No data available.</div>;
    const isNrRateBad = repData.nrRate > (companyStats.nrRate * 0.85);

    // Helpers for rendering sort buttons
    const SortButton = ({ mode, icon: Icon, label, colorClass }: { mode: SortMode, icon: any, label: string, colorClass: string }) => (
        <button
            onClick={() => setSortMode(mode)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all w-1/4 ${
                sortMode === mode 
                ? `bg-white dark:bg-slate-700 shadow-md ${colorClass} scale-105 ring-1 ring-slate-100 dark:ring-slate-600` 
                : 'text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title={`Sort by ${label}`}
        >
            <Icon size={16} className="mb-1" />
            <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in pb-12">
            
            {/* 1. LEFT SIDEBAR: FLOATING LIST */}
            <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0">
                <div className="glass-panel rounded-2xl p-4 shadow-lg shadow-slate-200/50 dark:shadow-none max-h-[calc(100vh-100px)] overflow-y-auto flex flex-col">
                    <div className="pb-4 border-b border-slate-200/50 dark:border-slate-700/50 mb-2">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
                            <Users size={18} className="text-blue-500"/>
                            Leaderboard
                        </h3>
                        {/* QUICK FILTERS */}
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                            <SortButton mode="sales" icon={Trophy} label="Sales" colorClass="text-[#28BA9A]" />
                            <SortButton mode="acquisition" icon={FileText} label="Acquis." colorClass="text-blue-500" />
                            <SortButton mode="qualification" icon={Zap} label="Qualif." colorClass="text-orange-500" />
                            <SortButton mode="conversion" icon={Percent} label="Conv." colorClass="text-purple-500" />
                        </div>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {repList.map((rep, idx) => (
                            <button
                                key={rep.name}
                                onClick={() => setSelectedRepId(rep.name)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                                    selectedRepId === rep.name 
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transform scale-105' 
                                    : 'hover:bg-white/50 dark:hover:bg-slate-800/50 border border-transparent text-slate-600 dark:text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        selectedRepId === rep.name ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="text-sm font-bold truncate">{rep.name}</div>
                                        <div className={`text-[10px] flex justify-between ${selectedRepId === rep.name ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {/* Dynamic Subtext based on Filter */}
                                            {sortMode === 'sales' && <span>{rep.sales} Sales • {rep.conversion.toFixed(1)}%</span>}
                                            {sortMode === 'acquisition' && <span>{rep.offers} Offers Sent</span>}
                                            {sortMode === 'qualification' && <span>{rep.interestRate.toFixed(1)}% Interest</span>}
                                            {sortMode === 'conversion' && <span>{rep.conversion.toFixed(1)}% Conversion</span>}
                                        </div>
                                    </div>
                                    {/* Optional Right Side Metric */}
                                    <div className={`text-xs font-bold ${selectedRepId === rep.name ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {sortMode === 'sales' && rep.sales}
                                        {sortMode === 'acquisition' && rep.offers}
                                        {sortMode === 'qualification' && rep.interestRate.toFixed(0) + '%'}
                                        {sortMode === 'conversion' && rep.conversion.toFixed(0) + '%'}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT */}
            <div className="flex-1 flex flex-col gap-8">
                
                {/* A. HEADER CARD */}
                <div className="glass-panel p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-600 shadow-lg">
                            <User size={40} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{selectedRepId}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-yellow-200 dark:border-yellow-700/50">
                                    <Trophy size={12}/> Rank #{repData.rank}
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                    {repData.teamName ? `Team ${repData.teamName}` : 'No Team'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-8 relative z-10">
                        <div className="text-center group cursor-pointer" onClick={() => onLeadClick(repData.wonLeads, 'Won')}>
                            <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1 group-hover:text-slate-600 dark:group-hover:text-slate-300">Sales</div>
                            <div className="text-4xl font-black text-[#28BA9A] dark:text-[#34d399] group-hover:scale-110 transition-transform">{repData.funnel.Success}</div>
                        </div>
                         <div className="text-center group cursor-pointer" onClick={() => onLeadClick(repData.interestedLeads, 'Interested')}>
                            <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1 group-hover:text-slate-600 dark:group-hover:text-slate-300">Interest</div>
                            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">{repData.interestRate.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>

                {/* B. CHARTS ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div id="chart-rep-dna" className="glass-panel p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none relative group">
                        <div className="flex justify-between items-center mb-6">
                             <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Activity size={18} className="text-indigo-500" /> Funnel DNA
                             </h3>
                             <button 
                                id="btn-copy-chart-rep-dna"
                                onClick={() => copyChart('chart-rep-dna')}
                                data-html2canvas-ignore
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Copy as Image"
                            >
                                <Camera size={20}/>
                            </button>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={repData.chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                    <defs>
                                        <linearGradient id="barGradientRepDNA" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} unit="%" />
                                    <Tooltip contentStyle={customTooltipStyle} itemStyle={{color: '#f8fafc'}} />
                                    <Legend wrapperStyle={{paddingTop: 10}}/>
                                    <Bar dataKey="Rep" fill="url(#barGradientRepDNA)" radius={[4, 4, 0, 0]} barSize={20} name={`${selectedRepId} %`} />
                                    <Line type="monotone" dataKey="Team" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" dot={{r: 3, fill: '#8b5cf6'}} name="Team Avg %" />
                                    <Line type="monotone" dataKey="Company" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} name="Company Avg %" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div id="chart-rep-market" className="glass-panel p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none relative group">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Globe size={18} className="text-blue-500" /> Market Focus (Top 7 Global)
                            </h3>
                            <button 
                                id="btn-copy-chart-rep-market"
                                onClick={() => copyChart('chart-rep-market')}
                                data-html2canvas-ignore
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Copy as Image"
                            >
                                <Camera size={20}/>
                            </button>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={repData.countryChartData} margin={{top: 10, right: 10, left: -20, bottom: 20}}>
                                    <defs>
                                        <linearGradient id="barGradientRepFocus" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
                                        </linearGradient>
                                        <linearGradient id="barGradientTeamFocus" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8}/>
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1}/>
                                        </linearGradient>
                                        <linearGradient id="barGradientCompFocus" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.5}/>
                                            <stop offset="100%" stopColor="#64748b" stopOpacity={0.8}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="country" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} interval={0} angle={-30} textAnchor="end" height={40}/>
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} unit="%" />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={customTooltipStyle} itemStyle={{color: '#f8fafc'}} />
                                    <Legend verticalAlign="top" height={36} iconType="circle"/>
                                    <Bar dataKey="Rep" fill="url(#barGradientRepFocus)" radius={[4, 4, 0, 0]} barSize={12} name="Rep Share %" />
                                    <Bar dataKey="Team" fill="url(#barGradientTeamFocus)" radius={[4, 4, 0, 0]} barSize={12} name="Team Share %" />
                                    <Bar dataKey="Company" fill="url(#barGradientCompFocus)" radius={[4, 4, 0, 0]} barSize={12} name="Company Share %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* C. SOURCE FUNNELS */}
                <div id="chart-rep-sources" className="glass-panel p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none relative group">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Megaphone size={18} className="text-orange-500" /> Top 6 Source Channels
                        </h3>
                        <button 
                            id="btn-copy-chart-rep-sources"
                            onClick={() => copyChart('chart-rep-sources')}
                            data-html2canvas-ignore
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy as Image"
                        >
                            <Camera size={20}/>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {repData.sourceFunnels.map((s) => (
                            <div key={s.source} className="border border-slate-100 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{s.source}</span>
                                    <span className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300 font-medium">{s.total}</span>
                                </div>
                                <FunnelChart data={s.funnel} compact={true} height="h-auto" onBarClick={() => onLeadClick(s.leads, `${selectedRepId} - ${s.source} Leads`)} />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};