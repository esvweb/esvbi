import React, { useState, useMemo, useEffect } from 'react';
import {
    Users, Globe, TrendingUp, DollarSign, Activity, Target,
    BarChart2, ChevronDown, ChevronUp, Download, Search,
    Filter, MoreHorizontal, Calendar, X, Languages, Flag
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
    LineChart, Line, PieChart, Pie, ComposedChart, Area, CartesianGrid
} from 'recharts';
import {
    AdPerformance, SalesByCountry, LanguageMetric, AgentPerformance,
    TeamData, MonthlyPerformance, Lead
} from '../types';
import {
    generateAdPerformance, generateGeographicData,
    generateTeamPerformance, generateMonthlyBreakdown
} from '../services/mockManagerData';

// --- SHARED COMPONENTS ---

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`glass-panel bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, color = 'blue' }: { children: React.ReactNode, color?: string }) => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        red: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[color] || colors.gray}`}>
            {children}
        </span>
    );
};

// --- WIDGETS ---

const MarketingIntelligence = ({ data }: { data: AdPerformance[] }) => {
    // Aggregating by source
    const aggregated = useMemo(() => {
        const groups: Record<string, AdPerformance> = {};
        data.forEach(item => {
            if (!groups[item.source]) {
                groups[item.source] = { ...item, spend: 0, revenue: 0, leads: 0, sales: 0 };
            }
            groups[item.source].spend += item.spend;
            groups[item.source].revenue += item.revenue;
            groups[item.source].leads += item.leads;
            groups[item.source].sales += item.sales;
        });
        return Object.values(groups);
    }, [data]);

    return (
        <Card className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-500" />
                    Marketing Intelligence
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                        <tr>
                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Source</th>
                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Spend</th>
                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">ROAS</th>
                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Conv.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {aggregated.map((row) => (
                            <tr key={row.source} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 pr-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                                            {row.source[0]}
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{row.source}</span>
                                    </div>
                                </td>
                                <td className="py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    ${(row.spend / 1000).toFixed(1)}k
                                </td>
                                <td className="py-3 text-right">
                                    <Badge color={row.revenue / row.spend > 3 ? 'green' : (row.revenue / row.spend > 1 ? 'blue' : 'red')}>
                                        {(row.revenue / (row.spend || 1)).toFixed(1)}x
                                    </Badge>
                                </td>
                                <td className="py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {((row.sales / (row.leads || 1)) * 100).toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const MarketingDetails = ({ data }: { data: AdPerformance[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter(item =>
            item.campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.source.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    return (
        <Card className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Target size={20} className="text-rose-500" />
                        Campaign Performance
                    </h3>
                </div>

                <div className="flex gap-2 items-center">
                    {isSearchOpen && (
                        <div className="animate-fade-in-left mr-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1 flex items-center">
                            <Search size={14} className="text-slate-400 mr-2" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Search campaigns..."
                                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 w-32"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onBlur={() => !searchTerm && setIsSearchOpen(false)}
                            />
                        </div>
                    )}
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2 rounded-full transition-colors ${isSearchOpen ? 'bg-indigo-100 text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                    >
                        <Search size={16} />
                    </button>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <Download size={16} className="text-slate-400" />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 shadow-sm z-10">
                        <tr>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase">Campaign</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase">Status</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase text-right">Spend</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase text-right">Leads</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase text-right">CPL</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase text-right">Sales</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase text-right">ROAS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredData.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 px-2 max-w-[200px]">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate" title={row.campaign}>
                                            {row.campaign.split('_').slice(0, 2).join(' ')}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{row.source}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-2">
                                    <div className={`w-2 h-2 rounded-full ${row.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300 mx-auto'}`} title={row.status}></div>
                                </td>
                                <td className="py-3 px-2 text-right text-xs font-mono text-slate-600 dark:text-slate-300">${row.spend}</td>
                                <td className="py-3 px-2 text-right text-xs font-bold text-slate-700 dark:text-slate-200">{row.leads}</td>
                                <td className="py-3 px-2 text-right text-xs font-mono text-slate-500">${(row.spend / (row.leads || 1)).toFixed(0)}</td>
                                <td className="py-3 px-2 text-right text-xs font-bold text-slate-700 dark:text-slate-200">{row.sales}</td>
                                <td className="py-3 px-2 text-right text-xs font-bold text-emerald-600">{(row.revenue / (row.spend || 1)).toFixed(1)}x</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const Demographics = ({ countryData, languageData }: { countryData: SalesByCountry[], languageData: LanguageMetric[] }) => {
    const [mode, setMode] = useState<'country' | 'language'>('country');

    return (
        <Card className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Globe size={20} className="text-indigo-500" />
                    Demographics
                </h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('country')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'country' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                        Country
                    </button>
                    <button
                        onClick={() => setMode('language')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'language' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                        Language
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                        <tr>
                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Name</th>
                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Leads</th>
                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Sales</th>
                            <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Conv.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {mode === 'country' ? countryData.map(c => (
                            <tr key={c.country} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={`https://flagcdn.com/w40/${c.flagCode}.png`} alt={c.country} className="w-6 h-4 object-cover rounded shadow-sm opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{c.country}</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">{c.leads}</td>
                                <td className="py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">{c.sales}</td>
                                <td className="py-4 text-right">
                                    <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full ml-auto overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${Math.min(100, (c.sales / (c.leads || 1)) * 500)}%` }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        )) : languageData.map(l => (
                            <tr key={l.language} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            {l.language.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{l.language}</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">{l.leads}</td>
                                <td className="py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">{l.sales}</td>
                                <td className="py-4 text-right">
                                    <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full ml-auto overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 rounded-full"
                                            style={{ width: `${Math.min(100, (l.sales / (l.leads || 1)) * 500)}%` }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const PerformanceMonitor = ({ agents, teams }: { agents: AgentPerformance[], teams: TeamData[] }) => {
    const [mode, setMode] = useState<'agents' | 'teams'>('agents');

    return (
        <Card className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity size={20} className="text-orange-500" />
                    Performance Monitor
                </h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('agents')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'agents' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-600' : 'text-slate-400'}`}
                    >
                        Agents
                    </button>
                    <button
                        onClick={() => setMode('teams')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'teams' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-600' : 'text-slate-400'}`}
                    >
                        Teams
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 shadow-sm z-10">
                        <tr>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase">Entity</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase text-center">Status</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase text-right">Leads</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase text-right">Target</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {mode === 'agents' ? agents.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                        <img src={a.avatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" alt={a.name} />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{a.name}</span>
                                            <span className="text-[10px] text-slate-400">Sales Rep</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${a.status === 'online' ? 'bg-emerald-500' : (a.status === 'busy' ? 'bg-amber-500' : 'bg-slate-300')}`} />
                                </td>
                                <td className="py-3 px-2 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">{a.leadsAssigned}</td>
                                <td className="py-3 px-2">
                                    <div className="w-24 ml-auto">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                            <span>{a.revenueActual}</span>
                                            <span>{a.revenueTarget}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${a.revenueActual >= a.revenueTarget ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                                style={{ width: `${Math.min(100, (a.revenueActual / a.revenueTarget) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )) : teams.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold text-xs">
                                            {t.name[0]}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-center">
                                    <span className="text-xs font-bold text-slate-400">Active</span>
                                </td>
                                <td className="py-3 px-2 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">{t.leadsAssigned}</td>
                                <td className="py-3 px-2">
                                    <div className="w-24 ml-auto">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                            <span>{t.ticketActual}</span>
                                            <span>{t.ticketTarget}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${t.ticketActual >= t.ticketTarget ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(100, (t.ticketActual / t.ticketTarget) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const LeadsBreakdownModal = ({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: MonthlyPerformance[] }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <BarChart2 size={28} className="text-teal-500" />
                            Monthly Leads Breakdown
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Deep dive into improved performance metrics over time.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 shadow-sm">
                            <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4">Period</th>
                                <th className="p-4">Type</th>
                                <th className="p-4 text-right">Total Leads</th>
                                <th className="p-4 text-right">Conv. Rate</th>
                                <th className="p-4 text-right">Interest Rate</th>
                                <th className="p-4 text-right">Ticket Amount</th>
                                <th className="p-4 text-right">Tickets</th>
                                <th className="p-4 text-right">Ad Spend</th>
                                <th className="p-4 text-right">CPT</th>
                                <th className="p-4 text-right">Avg Ticket</th>
                                <th className="p-4 text-right">ROAS</th>
                                <th className="p-4 text-center">IQS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {data.map((row, idx) => (
                                <tr key={`${row.month}-${row.operationType}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{row.month}</td>
                                    <td className="p-4">
                                        <Badge color={row.operationType === 'Dental' ? 'blue' : 'orange'}>{row.operationType}</Badge>
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-400">{row.totalLeads}</td>
                                    <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-200">
                                        {((row.sales / row.totalLeads) * 100).toFixed(1)}%
                                    </td>
                                    <td className="p-4 text-right text-slate-500">
                                        {((row.interestedLeads / row.totalLeads) * 100).toFixed(1)}%
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-emerald-600">
                                        ${(row.revenue / 1000).toFixed(1)}k
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300">{row.sales}</td>
                                    <td className="p-4 text-right font-mono text-slate-500">${row.adSpend}</td>
                                    <td className="p-4 text-right font-mono text-slate-500">${(row.adSpend / (row.sales || 1)).toFixed(0)}</td>
                                    <td className="p-4 text-right font-mono text-slate-500">${(row.revenue / (row.sales || 1)).toFixed(0)}</td>
                                    <td className="p-4 text-right font-bold text-purple-600">{(row.revenue / (row.adSpend || 1)).toFixed(2)}x</td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white shadow-md ${row.qualityScore >= 7 ? 'bg-emerald-500 shadow-emerald-500/30' :
                                            row.qualityScore >= 5 ? 'bg-yellow-500 shadow-yellow-500/30' : 'bg-red-500 shadow-red-500/30'
                                            }`}>
                                            {row.qualityScore}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- MAIN MANAGER OVERVIEW COMPONENT ---

export const ManagerOverview = ({ leads }: { leads: Lead[] }) => {
    // 1. EXECUTIVE METRICS CALCULATION
    const metrics = useMemo(() => {
        const total = leads.length || 1;
        const hairLeads = leads.filter(l => l.treatment === 'Hair');
        const dentalLeads = leads.filter(l => l.treatment === 'Dental');

        // Helper for Interest Rate
        const isInterested = (l: Lead) => ['interested', 'offer sent', 'waiting eval', 'success', 'ticket received', 'operation done', 'pre-payment received'].some(s => l.originalStatus.toLowerCase().includes(s) || (l.status as string) !== 'New');

        // Helper for Ticket Received
        const isTicket = (l: Lead) => ['ticket received', 'operation done', 'pre-payment received'].some(s => l.originalStatus.toLowerCase().includes(s));

        // METRIC 1: TOTAL LEADS
        const totalHair = hairLeads.length;
        const totalDental = dentalLeads.length;

        // METRIC 2: INTERESTED LEADS
        const interestedCount = leads.filter(isInterested).length;
        const interestedRate = ((interestedCount / total) * 100).toFixed(0);
        const hairInterest = hairLeads.filter(isInterested).length;
        const dentalInterest = dentalLeads.filter(isInterested).length;
        const hairInterestRate = totalHair > 0 ? ((hairInterest / totalHair) * 100).toFixed(1) : '0';
        const dentalInterestRate = totalDental > 0 ? ((dentalInterest / totalDental) * 100).toFixed(1) : '0';

        // METRIC 3: TICKET RECEIVED
        const ticketCount = leads.filter(isTicket).length;
        const hairTicket = hairLeads.filter(isTicket).length;
        const dentalTicket = dentalLeads.filter(isTicket).length;
        const hairTicketRate = totalHair > 0 ? ((hairTicket / totalHair) * 100).toFixed(1) : '0';
        const dentalTicketRate = totalDental > 0 ? ((dentalTicket / totalDental) * 100).toFixed(1) : '0';

        // METRIC 4: TOTAL REVENUE
        const revenue = leads.reduce((sum, l) => sum + (l.revenue || 0), 0);
        const hairRevenue = hairLeads.reduce((sum, l) => sum + (l.revenue || 0), 0);
        const dentalRevenue = dentalLeads.reduce((sum, l) => sum + (l.revenue || 0), 0);

        const formatCurrency = (val: number) => {
            if (val >= 1000000) return `€${(val / 1000000).toFixed(2)}M`;
            if (val >= 1000) return `€${(val / 1000).toFixed(1)}k`;
            return `€${val}`;
        };

        const avgTicket = ticketCount > 0 ? (revenue / ticketCount).toFixed(0) : '0';

        return {
            total,
            totalHair,
            totalDental,
            interestedRate,
            hairInterestRate,
            dentalInterestRate,
            ticketCount,
            hairTicket,
            dentalTicket,
            hairTicketRate,
            dentalTicketRate,
            revenue: formatCurrency(revenue),
            hairRevenue: formatCurrency(hairRevenue),
            dentalRevenue: formatCurrency(dentalRevenue),
            avgTicket
        };
    }, [leads]);

    // 2. CHART DATA CALCULATION (Weekly or Monthly Trend)
    const trendData = useMemo(() => {
        // Group by week (simplification for "Month" view)
        const weeks: Record<string, { revenue: number, tickets: number }> = {};
        const now = new Date();
        // Generate last 4 weeks keys
        for (let i = 3; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
            const weekKey = `Week ${4 - i}`;
            weeks[weekKey] = { revenue: 0, tickets: 0 };
        }

        leads.forEach(l => {
            if (l.revenue > 0) {
                // Distribute somewhat randomly for mock visual or calculate real week if dates allow
                // For now, using mock usage of 'diffDays' or random assignment to fill the last 4 weeks visual
                const weekNum = Math.floor(Math.random() * 4) + 1;
                const key = `Week ${weekNum}`;
                if (weeks[key]) {
                    weeks[key].revenue += l.revenue;
                    weeks[key].tickets += 1;
                }
            }
        });

        return Object.entries(weeks).map(([name, data]) => ({
            name,
            revenue: data.revenue,
            tickets: data.tickets * 1000 // Scale for dual axis visual effect
        }));
    }, [leads]);

    // State for Mock Data (Keeping existing widgets below)
    const [adData, setAdData] = useState<AdPerformance[]>([]);
    const [geoData, setGeoData] = useState<{ countryData: SalesByCountry[], languageData: LanguageMetric[] }>({ countryData: [], languageData: [] });
    const [teamData, setTeamData] = useState<{ agents: AgentPerformance[], teams: TeamData[] }>({ agents: [], teams: [] });
    const [monthlyData, setMonthlyData] = useState<MonthlyPerformance[]>([]);


    // Modal State
    const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);

    useEffect(() => {
        // Load initial mock data
        setAdData(generateAdPerformance());
        setGeoData(generateGeographicData());
        setTeamData(generateTeamPerformance());
        setMonthlyData(generateMonthlyBreakdown());
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* 1. EXECUTIVE DASHBOARD (Top 4 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* CARD 1: TOTAL LEADS */}
                <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users size={80} className="text-emerald-500" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <Users size={14} className="text-emerald-500" /> TOTAL LEADS
                            </p>
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white mt-1">{metrics.total.toLocaleString()}</h3>
                            <p className="text-emerald-500 text-xs font-bold mt-1 flex items-center">
                                <TrendingUp size={12} className="mr-1" /> 4% vs prev. month
                            </p>
                        </div>
                        <div className="flex gap-1">
                            {['Today', 'Week', 'Month'].map(t => (
                                <span key={t} className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer ${t === 'Month' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-300 hover:bg-slate-50'}`}>{t}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mt-6 mb-1">
                        <span>HAIR</span>
                        <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{metrics.totalHair.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-3 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '55%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        <span>DENTAL</span>
                        <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{metrics.totalDental.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                </Card>

                {/* CARD 2: INTERESTED LEADS */}
                <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target size={80} className="text-blue-500" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <Target size={14} className="text-blue-500" /> INTERESTED LEADS
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-4xl font-black text-slate-800 dark:text-white">{metrics.interestedRate}%</h3>
                                <span className="text-xs font-bold text-slate-400">Interest Rate</span>
                            </div>
                            <p className="text-emerald-500 text-xs font-bold mt-1 flex items-center">
                                <TrendingUp size={12} className="mr-1" /> 7% vs prev. month
                            </p>
                        </div>
                        <div className="flex gap-1">
                            {['Today', 'Week', 'Month'].map(t => (
                                <span key={t} className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer ${t === 'Month' ? 'bg-blue-100 text-blue-700' : 'text-slate-300 hover:bg-slate-50'}`}>{t}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mt-6 mb-1">
                        <span>HAIR</span>
                        <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{metrics.hairInterestRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-3 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.hairInterestRate}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        <span>DENTAL</span>
                        <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{metrics.dentalInterestRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${metrics.dentalInterestRate}%` }}></div>
                    </div>
                </Card>

                {/* CARD 3: TICKET RECEIVED */}
                <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity size={80} className="text-purple-500" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <Activity size={14} className="text-purple-500" /> TICKET RECEIVED
                            </p>
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white mt-1">{metrics.ticketCount.toLocaleString()}</h3>
                            <p className="text-emerald-500 text-xs font-bold mt-1 flex items-center">
                                <TrendingUp size={12} className="mr-1" /> 15% vs prev. month
                            </p>
                        </div>
                        <div className="flex gap-1">
                            {['Today', 'Week', 'Month'].map(t => (
                                <span key={t} className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer ${t === 'Month' ? 'bg-purple-100 text-purple-700' : 'text-slate-300 hover:bg-slate-50'}`}>{t}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mt-6 mb-1">
                        <span>HAIR</span>
                        <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{metrics.hairTicket.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-3 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        <span>DENTAL</span>
                        <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{metrics.dentalTicket.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                </Card>

                {/* CARD 4: TOTAL REVENUE */}
                <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={80} className="text-emerald-600" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <DollarSign size={14} className="text-emerald-600" /> TOTAL REVENUE
                            </p>
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white mt-1">{metrics.revenue}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-emerald-500 text-xs font-bold flex items-center">
                                    <TrendingUp size={12} className="mr-1" /> 5% vs prev. month
                                </p>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 rounded text-slate-500 font-bold">Avg Ticket: €{metrics.avgTicket}</span>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {['Today', 'Week', 'Month'].map(t => (
                                <span key={t} className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer ${t === 'Month' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-300 hover:bg-slate-50'}`}>{t}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mt-6 mb-1">
                        <span>HAIR</span>
                        <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{metrics.hairRevenue}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-3 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        <span>DENTAL</span>
                        <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{metrics.dentalRevenue}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                </Card>
            </div>

            {/* 2. PERFORMANCE TREND CHART */}
            <Card className="h-[350px] flex flex-col relative group">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            Performance Trend
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">Revenue (Left) vs Ticket Value (Right)</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {['Week', 'Month', 'Quarter', 'Half Year', 'Year'].map(t => (
                            <button key={t} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${t === 'Month' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `€${val / 1000}k`} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `€${val / 1000}k`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                formatter={(value: number, name: string) => [name === 'revenue' ? `€${value.toLocaleString()}` : value, name === 'revenue' ? 'Revenue' : 'Ticket Value']}
                            />
                            <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            <Area yAxisId="right" type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Top Row: Marketing Intelligence + Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[450px]">
                <div className="lg:col-span-1 h-full">
                    <MarketingIntelligence data={adData} />
                </div>
                <div className="lg:col-span-2 h-full">
                    <Demographics countryData={geoData.countryData} languageData={geoData.languageData} />
                </div>
            </div>

            {/* Middle Row: Campaign Details + Performance Monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MarketingDetails data={adData} />
                <PerformanceMonitor agents={teamData.agents} teams={teamData.teams} />
            </div>

            {/* Bottom Section: Call to Action for Deep Dive */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-10 blur-xl"></div>
                <Card className="relative flex flex-col md:flex-row items-center justify-between p-8 md:px-12">
                    <div className="mb-6 md:mb-0">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Monthly Leads Breakdown</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-lg">
                            Access the comprehensive month-over-month analysis tool. View detailed conversion metrics, revenue attribution, and lead quality scores.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsDrilldownOpen(true)}
                        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-slate-900 font-lg rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 hover:bg-slate-700 active:scale-95"
                    >
                        <span className="mr-2">Open Full Report</span>
                        <BarChart2 className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </Card>
            </div>

            {/* Modals */}
            <LeadsBreakdownModal
                isOpen={isDrilldownOpen}
                onClose={() => setIsDrilldownOpen(false)}
                data={monthlyData}
            />
        </div>
    );
};
