import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from './components/Header';
import { FilterState, Lead, FunnelStage, RepTargetData, MarketingSpendRecord, Patient } from './types';
import { ManagerOverview } from './components/ManagerOverview';
import {
    generateData, generateMMSData, filterLeads, calculateFunnelStats,
    INTERESTED_SET, WAITING_EVAL_SET, OFFER_SENT_SET, SUCCESS_SET, NEGATIVE_LOST_SET,
    getPipelineBucket, PipelineBucket, TEAMS
} from './services/mockData';
import { FilterBar } from './components/FilterBar';
import { FunnelChart } from './components/FunnelChart';
import { LeadListModal } from './components/LeadListModal';
import { FunnelComparisonView } from './components/FunnelComparisonView';
import { RepPerformanceView } from './components/RepPerformanceView';
import { DiagnosisView } from './components/DiagnosisView';
import { PipelineView } from './components/PipelineView';
import { DataManagementView } from './components/DataManagementView';
import { ParetoEngineView } from './components/ParetoEngineView';
import { RepSplitterView } from './components/RepSplitterView';
import { MarketingFunnelView } from './components/MarketingFunnelView';
import { PatientOpsView } from './components/PatientOpsView';
import { CloudTalkView } from './components/CloudTalkView';
import { PipelineBreakdownModal } from './components/PipelineBreakdownModal';
import { Login } from './components/Login';
import {
    LayoutDashboard, BarChart2, TrendingUp, Filter,
    Users, Database, Activity, Brain, LayoutList, PieChart as PieIcon,
    Zap, ArrowUpRight, BarChart3, CheckSquare, Sun, Moon, Calendar, Grid, MapPin, Calculator, Clock, Camera,
    Percent, Scissors, Megaphone, AlertTriangle, CheckCircle, BarChart as BarChartIcon, Globe, Plane, Phone, Briefcase
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Pie, PieChart, Legend, Cell, ComposedChart, Area, AreaChart,
    LabelList
} from 'recharts';

// --- OVERVIEW COMPONENT RE-DESIGNED ---
const Overview = ({
    leads,
    allLeads,
    patients,
    onMetricClick,
    onPipelineBucketClick,
    manualTotalRevenue,
    repTargets,
    isDarkMode,
    userType
}: {
    leads: Lead[],
    allLeads: Lead[],
    patients: Patient[],
    onMetricClick: (leads: Lead[], title: string) => void,
    onPipelineBucketClick: (title: string, leads: Lead[]) => void,
    manualTotalRevenue: number,
    repTargets: Record<string, RepTargetData>,
    isDarkMode: boolean,
    userType: 'TEAM_LEADER' | 'MANAGER'
}) => {
    // --- CHART COPY HANDLER ---
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

    const funnelData = useMemo(() => calculateFunnelStats(leads), [leads]);
    const newLeads = funnelData['New'] || 0;
    const success = funnelData['Success'] || 0;
    const closingRate = newLeads > 0 ? ((success / newLeads) * 100).toFixed(1) : '0';

    const treatmentData = useMemo(() => {
        const counts = { Dental: 0, Hair: 0, Other: 0 };
        let total = 0;
        leads.forEach(l => {
            if (l.treatment in counts) {
                counts[l.treatment as keyof typeof counts]++;
                total++;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
            pct: total > 0 ? ((value / total) * 100).toFixed(1) : '0'
        }));
    }, [leads]);

    // ... NEW ANALYTICS DATA PREPARATION ...

    // 1. Pipeline Health
    const pipelineHealthData = useMemo(() => {
        const buckets: Record<string, Lead[]> = { 'Open': [], 'Active': [], 'Closed – Success': [], 'Negative/Lost': [] };
        leads.forEach(l => {
            const s = (l.originalStatus || '').toLowerCase().trim();
            let b: keyof typeof buckets = 'Active';

            if (s === 'new lead' || s.startsWith('nr')) b = 'Open';
            else if (['operation done', 'ticket received', 'pre-payment received', 'pre/payment received'].includes(s)) b = 'Closed – Success';
            else if (['not interest / junk', 'high price', 'wrong number', 'block', 'other languages', 'night shift', 'rejected by doctor', "interested can't travel"].includes(s)) b = 'Negative/Lost';
            else b = 'Active';

            buckets[b].push(l);
        });
        const total = leads.length || 1;
        return [
            { name: 'Open', count: buckets['Open'].length, pct: (buckets['Open'].length / total) * 100, color: ['#60a5fa', '#2563eb'], leads: buckets['Open'] },
            { name: 'Active', count: buckets['Active'].length, pct: (buckets['Active'].length / total) * 100, color: ['#fb923c', '#ea580c'], leads: buckets['Active'] },
            { name: 'Closed – Success', count: buckets['Closed – Success'].length, pct: (buckets['Closed – Success'].length / total) * 100, color: ['#c084fc', '#7e22ce'], leads: buckets['Closed – Success'] },
            { name: 'Negative/Lost', count: buckets['Negative/Lost'].length, pct: (buckets['Negative/Lost'].length / total) * 100, color: ['#94a3b8', '#475569'], leads: buckets['Negative/Lost'] }
        ];
    }, [leads]);

    const top5Countries = useMemo(() => {
        const counts: Record<string, number> = {};
        leads.forEach(l => {
            const c = l.country || 'Unknown';
            counts[c] = (counts[c] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);
    }, [leads]);

    const trafficMatrix = useMemo(() => {
        const map: Record<string, Record<number, number>> = {};
        let max = 0;
        top5Countries.forEach(c => {
            map[c] = {};
            for (let i = 0; i < 24; i++) map[c][i] = 0;
        });
        leads.forEach(l => {
            if (top5Countries.includes(l.country)) {
                const h = new Date(l.createDate).getHours();
                map[l.country][h]++;
                if (map[l.country][h] > max) max = map[l.country][h];
            }
        });
        return { map, max };
    }, [leads, top5Countries]);

    const qualityHeatmap = useMemo(() => {
        const dayMap: Record<string, Record<string, { sum: number, count: number }>> = {};
        const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const jsToOrderIndex: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };

        days.forEach(d => {
            dayMap[d] = {};
            [...top5Countries, 'Day Average'].forEach(c => dayMap[d][c] = { sum: 0, count: 0 });
        });

        const countryAvg: Record<string, { sum: number, count: number }> = {};
        top5Countries.forEach(c => countryAvg[c] = { sum: 0, count: 0 });

        leads.forEach(l => {
            const c = l.country || 'Unknown';
            if (!top5Countries.includes(c)) return;

            const jsDay = new Date(l.createDate).getDay();
            const dayName = days[jsToOrderIndex[jsDay]];

            if (dayMap[dayName]) {
                dayMap[dayName][c].sum += l.leadScore;
                dayMap[dayName][c].count++;
                dayMap[dayName]['Day Average'].sum += l.leadScore;
                dayMap[dayName]['Day Average'].count++;
            }

            if (!countryAvg[c]) countryAvg[c] = { sum: 0, count: 0 };
            countryAvg[c].sum += l.leadScore;
            countryAvg[c].count++;
        });
        return { dayMap, days, countryAvg };
    }, [leads, top5Countries]);

    const momentumData = useMemo(() => {
        const dailyMap = new Map<string, { sum: number, count: number, date: Date }>();
        leads.forEach(l => {
            if (!l.createDate) return;
            const dayStr = new Date(l.createDate).toISOString().split('T')[0];
            if (!dailyMap.has(dayStr)) dailyMap.set(dayStr, { sum: 0, count: 0, date: new Date(l.createDate) });
            const entry = dailyMap.get(dayStr)!;
            entry.sum += l.leadScore;
            entry.count += 1;
        });
        const sortedDays = Array.from(dailyMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

        return sortedDays.map((d, index) => {
            const dailyAvg = d.count > 0 ? d.sum / d.count : 0;
            let start = Math.max(0, index - 6);
            let subset = sortedDays.slice(start, index + 1);
            let maSum = subset.reduce((acc, curr) => acc + (curr.count > 0 ? curr.sum / curr.count : 0), 0);
            let ma = maSum / subset.length;
            return {
                date: d.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                rawDate: d.date,
                dailyScore: Number(dailyAvg.toFixed(1)),
                ma7: Number(ma.toFixed(1)),
                count: d.count
            };
        });
    }, [leads]);

    const getScoreColor = (score: number) => {
        if (score < 1) return 'bg-red-500 text-white';
        if (score < 2) return 'bg-orange-500 text-white';
        if (score < 3) return 'bg-yellow-400 text-slate-900';
        if (score <= 5) return 'bg-emerald-500 text-white';
        return 'bg-purple-600 text-white';
    };

    const tooltipStyle = {
        borderRadius: '12px',
        border: 'none',
        boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
        backgroundColor: isDarkMode ? '#1e293b' : 'rgba(255,255,255,0.95)',
        color: isDarkMode ? '#f8fafc' : '#0f172a'
    };

    const TiltCard = ({ title, val, sub, color, icon: Icon, onClick }: any) => (
        <div className="group perspective-1000 cursor-pointer" onClick={onClick}>
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden transition-all duration-500 transform hover:rotate-x-2 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 card-3d-hover bg-white/60 dark:bg-slate-800/60 dark:border-white/5">
                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-125 duration-500 ${color}`}>
                    <Icon size={80} />
                </div>
                <div className="relative z-10">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                    <h3 className={`text-4xl font-black tracking-tight ${color}`}>{val}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 font-medium flex items-center gap-1">
                        <ArrowUpRight size={12} /> {sub}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-12">



            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TiltCard title="Opportunities" val={newLeads} sub="Leads in pipeline" color="text-blue-600 dark:text-blue-400" icon={Zap} onClick={() => onMetricClick(leads, 'All Opportunities')} />
                <TiltCard title="Closed Success" val={success} sub="Operations Booked" color="text-purple-600 dark:text-purple-400" icon={Activity} onClick={() => onMetricClick(leads.filter(l => SUCCESS_SET.has((l.originalStatus || '').toLowerCase())), 'Closed Success')} />
                <TiltCard title="Conversion Rate" val={`${closingRate}%`} sub="Global Average" color="text-emerald-500 dark:text-emerald-400" icon={TrendingUp} onClick={() => onMetricClick(leads.filter(l => SUCCESS_SET.has((l.originalStatus || '').toLowerCase())), 'Converted Leads')} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div id="chart-conversion-funnel" className="lg:col-span-2 glass-panel p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none relative group">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><BarChart2 size={24} className="text-blue-500" />Conversion Funnel</h2>
                        <button id="btn-copy-chart-conversion-funnel" onClick={() => copyChart('chart-conversion-funnel')} data-html2canvas-ignore className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Copy as Image"><Camera size={20} /></button>
                    </div>
                    <FunnelChart data={funnelData} height="h-auto" onBarClick={(stage) => {
                        let filtered: Lead[] = [];
                        if (stage === 'New') filtered = leads;
                        else if (stage === 'Interested') filtered = leads.filter(l => INTERESTED_SET.has((l.originalStatus || '').toLowerCase()));
                        else if (stage === 'WaitingEval') filtered = leads.filter(l => WAITING_EVAL_SET.has((l.originalStatus || '').toLowerCase()));
                        else if (stage === 'OfferSent') filtered = leads.filter(l => OFFER_SENT_SET.has((l.originalStatus || '').toLowerCase()));
                        else if (stage === 'Success') filtered = leads.filter(l => SUCCESS_SET.has((l.originalStatus || '').toLowerCase()));
                        else if (stage === 'Negative') filtered = leads.filter(l => NEGATIVE_LOST_SET.has((l.originalStatus || '').toLowerCase()));
                        onMetricClick(filtered, `Funnel Stage: ${stage}`);
                    }} />
                </div>
                <div id="chart-treatment-split" className="glass-panel p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col h-[450px] relative group">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><PieIcon size={24} className="text-orange-500" />Treatment Split</h3>
                        <button id="btn-copy-chart-treatment-split" onClick={() => copyChart('chart-treatment-split')} data-html2canvas-ignore className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Copy as Image"><Camera size={20} /></button>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={treatmentData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={6} dataKey="value" onClick={(data) => {
                                    const filtered = leads.filter(l => l.treatment === data.name);
                                    onMetricClick(filtered, `Treatment: ${data.name}`);
                                }} className="cursor-pointer outline-none">
                                    {treatmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#3b82f6', '#f97316', '#22c55e'][index % 3]} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-3xl font-black text-slate-700 dark:text-slate-200">{leads.length}</span>
                            <span className="text-xs text-slate-400 font-bold uppercase">Total Leads</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- NEW SECTIONS BELOW FUNNEL --- */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* 1. PIPELINE HEALTH CHECK */}
                <div id="chart-pipeline-health" className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-xl relative group">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BarChart2 size={20} className="text-blue-500" />
                            Pipeline Health Check
                        </h3>
                        <button id="btn-copy-chart-pipeline-health" onClick={() => copyChart('chart-pipeline-health')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Copy as Image"><Camera size={18} /></button>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipelineHealthData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    {pipelineHealthData.map((entry, index) => (
                                        <linearGradient id={`grad-health-${index}`} x1="0" y1="0" x2="0" y2="1" key={index}>
                                            <stop offset="0%" stopColor={entry.color[0]} stopOpacity={0.9} />
                                            <stop offset="100%" stopColor={entry.color[1]} stopOpacity={1} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
                                <Bar dataKey="pct" radius={[8, 8, 0, 0]} animationDuration={1000} onClick={(data) => {
                                    onMetricClick(data.leads, `Pipeline Bucket: ${data.name}`);
                                }} className="cursor-pointer">
                                    {pipelineHealthData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`url(#grad-health-${index})`} />
                                    ))}
                                    <LabelList dataKey="pct" position="top" formatter={(val: number) => `${val.toFixed(1)}%`} style={{ fill: '#64748b', fontWeight: 'bold', fontSize: 12 }} />
                                    <LabelList dataKey="count" position="insideTop" style={{ fill: '#fff', fontWeight: 'bold', fontSize: 14 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. LEAD QUALITY MOMENTUM */}
                <div id="chart-quality-momentum" className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-xl relative group">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-500" />
                            Lead Quality Momentum (7-Day Trend)
                        </h3>
                        <button id="btn-copy-chart-quality-momentum" onClick={() => copyChart('chart-quality-momentum')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Copy as Image"><Camera size={18} /></button>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={momentumData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={30} />
                                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#64748b' }} labelStyle={{ fontWeight: 'bold', color: '#334155' }} />
                                <Bar
                                    dataKey="dailyScore"
                                    name="Daily Avg"
                                    fill="#cbd5e1"
                                    barSize={12}
                                    radius={[4, 4, 0, 0]}
                                    cursor="pointer"
                                    onClick={(data) => {
                                        const dayLeads = leads.filter(l => new Date(l.createDate).toDateString() === data.rawDate.toDateString());
                                        onMetricClick(dayLeads, `Lead Quality: ${data.date}`);
                                    }}
                                />
                                <Line type="monotone" dataKey="ma7" name="7-Day MA" stroke="#28BA9A" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#fff', stroke: '#28BA9A' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. PEAK TRAFFIC ANALYSIS */}
                <div id="chart-peak-traffic" className="xl:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-xl relative group overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Zap size={20} className="text-indigo-500" />
                            Peak Traffic Analysis (Hourly Heatmap)
                        </h3>
                        <button id="btn-copy-chart-peak-traffic" onClick={() => copyChart('chart-peak-traffic')} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Copy as Image"><Camera size={18} /></button>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Header Row */}
                            <div className="grid grid-cols-[120px_repeat(24,1fr)] gap-1 mb-2">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Country</div>
                                {Array.from({ length: 24 }, (_, i) => (
                                    <div key={i} className="text-[10px] text-center text-slate-400 font-mono">{i}</div>
                                ))}
                            </div>
                            {/* Rows */}
                            {top5Countries.map(country => (
                                <div key={country} className="grid grid-cols-[120px_repeat(24,1fr)] gap-1 mb-2 items-center">
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate pr-2" title={country}>{country}</div>
                                    {Array.from({ length: 24 }, (_, h) => {
                                        const val = trafficMatrix.map[country][h];
                                        const ratio = trafficMatrix.max > 0 ? val / trafficMatrix.max : 0;
                                        let bgClass = 'bg-slate-100 dark:bg-slate-800';
                                        if (val > 0) {
                                            if (ratio > 0.8) bgClass = 'bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-500/50';
                                            else if (ratio > 0.4) bgClass = 'bg-indigo-400 dark:bg-indigo-600/80';
                                            else bgClass = 'bg-indigo-200 dark:bg-indigo-900/50';
                                        }
                                        return (
                                            <div
                                                key={h}
                                                className={`h-8 rounded-md transition-all hover:scale-110 flex items-center justify-center text-[9px] font-bold cursor-pointer ${bgClass} ${val > 0 ? 'text-white' : 'text-transparent'}`}
                                                title={`${val} leads at ${h}:00`}
                                                onClick={() => {
                                                    if (val > 0) {
                                                        const cellLeads = leads.filter(l => l.country === country && new Date(l.createDate).getHours() === h);
                                                        onMetricClick(cellLeads, `Traffic: ${country} @ ${h}:00`);
                                                    }
                                                }}
                                            >
                                                {val > 0 ? val : ''}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. LEAD QUALITY HEATMAP */}
                <div id="chart-quality-heatmap" className="xl:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-xl relative group overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Globe size={20} className="text-purple-500" />
                            Lead Quality Heatmap (Day x Country)
                        </h3>
                        <button id="btn-copy-chart-quality-heatmap" onClick={() => copyChart('chart-quality-heatmap')} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Copy as Image"><Camera size={18} /></button>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                            {/* Header */}
                            <div className={`grid gap-2 mb-2 items-center`} style={{ gridTemplateColumns: `100px repeat(${top5Countries.length + 1}, 1fr)` }}>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day</div>
                                {top5Countries.map(c => (
                                    <div key={c} className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center truncate">{c}</div>
                                ))}
                                <div className="text-xs font-black text-slate-800 dark:text-white text-center">Avg</div>
                            </div>
                            {/* Rows */}
                            {qualityHeatmap.days.map(day => (
                                <div key={day} className="grid gap-2 mb-2 items-center" style={{ gridTemplateColumns: `100px repeat(${top5Countries.length + 1}, 1fr)` }}>
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{day}</div>
                                    {top5Countries.map(c => {
                                        const cell = qualityHeatmap.dayMap[day][c];
                                        const avg = cell.count > 0 ? cell.sum / cell.count : 0;
                                        return (
                                            <div
                                                key={c}
                                                className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm transition-transform hover:scale-105 cursor-pointer ${getScoreColor(avg)}`}
                                                onClick={() => {
                                                    if (cell.count > 0) {
                                                        const cellLeads = leads.filter(l => l.country === c && new Date(l.createDate).toLocaleDateString('en-US', { weekday: 'long' }) === day);
                                                        onMetricClick(cellLeads, `Quality: ${c} on ${day}s`);
                                                    }
                                                }}
                                            >
                                                {avg > 0 ? avg.toFixed(1) : '-'}
                                            </div>
                                        );
                                    })}
                                    {/* Day Average */}
                                    <div
                                        className={`h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-md border-2 border-slate-100 dark:border-slate-700 cursor-pointer ${getScoreColor(
                                            qualityHeatmap.dayMap[day]['Day Average'].count > 0
                                                ? qualityHeatmap.dayMap[day]['Day Average'].sum / qualityHeatmap.dayMap[day]['Day Average'].count
                                                : 0
                                        )}`}
                                        onClick={() => {
                                            if (qualityHeatmap.dayMap[day]['Day Average'].count > 0) {
                                                const dayLeads = leads.filter(l => top5Countries.includes(l.country) && new Date(l.createDate).toLocaleDateString('en-US', { weekday: 'long' }) === day);
                                                onMetricClick(dayLeads, `Quality Avg: All Top Countries on ${day}s`);
                                            }
                                        }}
                                    >
                                        {(qualityHeatmap.dayMap[day]['Day Average'].count > 0
                                            ? qualityHeatmap.dayMap[day]['Day Average'].sum / qualityHeatmap.dayMap[day]['Day Average'].count
                                            : 0).toFixed(1)}
                                    </div>
                                </div>
                            ))}
                            {/* Country Averages Row */}
                            <div className="grid gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 items-center" style={{ gridTemplateColumns: `100px repeat(${top5Countries.length + 1}, 1fr)` }}>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Country Avg</div>
                                {top5Countries.map(c => {
                                    const avg = qualityHeatmap.countryAvg[c].count > 0 ? qualityHeatmap.countryAvg[c].sum / qualityHeatmap.countryAvg[c].count : 0;
                                    return (
                                        <div
                                            key={c}
                                            className="text-center text-sm font-black text-slate-700 dark:text-slate-200 cursor-pointer hover:text-blue-500 transition-colors"
                                            onClick={() => {
                                                if (qualityHeatmap.countryAvg[c].count > 0) {
                                                    const countryLeads = leads.filter(l => l.country === c);
                                                    onMetricClick(countryLeads, `Quality Avg: ${c} (Total)`);
                                                }
                                            }}
                                        >
                                            {avg.toFixed(1)}
                                        </div>
                                    )
                                })}
                                <div className="text-center text-xs text-slate-400">-</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

const App = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [marketingSpend, setMarketingSpend] = useState<MarketingSpendRecord[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [exchangeRate, setExchangeRate] = useState<number>(36);

    const [filters, setFilters] = useState<FilterState>({
        dateRange: 'month',
        treatments: [],
        countries: [],
        reps: [],
        languages: [],
        sources: [],
        teams: []
    });
    const [view, setView] = useState<'managerial' | 'overview' | 'comparison' | 'reps' | 'diagnosis' | 'pipeline' | 'data' | 'pareto' | 'splitter' | 'marketing' | 'patient_ops' | 'cloudtalk'>('managerial');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLeads, setModalLeads] = useState<Lead[]>([]);
    const [modalPatients, setModalPatients] = useState<Patient[]>([]);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMode, setModalMode] = useState<'default' | 'ticket' | 'revenue'>('default');

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
                ? 'dark' : 'light';
        }
        return 'light';
    });

    const [userType, setUserType] = useState<'TEAM_LEADER' | 'MANAGER'>('TEAM_LEADER');

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('isAuthenticated') === 'true';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const [repTargets, setRepTargets] = useState<Record<string, RepTargetData>>({});
    const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
    const [pipelineBucketName, setPipelineBucketName] = useState('');
    const [pipelineLeads, setPipelineLeads] = useState<Lead[]>([]);

    useEffect(() => {
        const data = generateData(1500);
        setLeads(data);
        const mmsData = generateMMSData(200);
        setPatients(mmsData);
    }, []);

    const filteredLeads = useMemo(() => filterLeads(leads, filters), [leads, filters]);

    const handleMetricClick = (leadsData: Lead[], title: string, mode: 'default' | 'ticket' | 'revenue' = 'default') => {
        setModalLeads(leadsData);
        setModalPatients(patients); // Pass current patients to modal context
        setModalTitle(title);
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const handlePipelineBucketClick = (bucket: string, leadsData: Lead[]) => {
        setPipelineBucketName(bucket);
        setPipelineLeads(leadsData);
        setIsPipelineModalOpen(true);
    };

    const handleStatusSelect = (leadsData: Lead[], title: string) => {
        setIsPipelineModalOpen(false);
        handleMetricClick(leadsData, title);
    };

    const filterOptions = useMemo(() => ({
        reps: Array.from(new Set(leads.map(l => l.repName))).sort(),
        countries: Array.from(new Set(leads.map(l => l.country))).sort(),
        languages: Array.from(new Set(leads.map(l => l.language))).sort(),
        sources: Array.from(new Set(leads.map(l => l.source))).sort(),
        treatments: Array.from(new Set(leads.map(l => l.treatment))).sort(),
        teams: Object.keys(TEAMS)
    }), [leads]);

    if (!isAuthenticated) {
        return <Login onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-[#28BA9A]/30">
            <div className="max-w-[1600px] mx-auto p-4 md:p-6">
                <Header
                    userType={userType}
                    onUserTypeChange={setUserType}
                    theme={theme}
                    toggleTheme={toggleTheme}
                >
                    <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar gap-1">
                        {[
                            { id: 'managerial', label: 'Managerial', icon: Briefcase },
                            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                            { id: 'marketing', label: 'Marketing', icon: Megaphone },
                            { id: 'comparison', label: 'Funnel Compare', icon: BarChart2 },
                            { id: 'reps', label: 'Scorecard', icon: Users },
                            { id: 'diagnosis', label: 'Diagnosis', icon: Brain },
                            { id: 'pareto', label: 'Insights', icon: Percent },
                            { id: 'pipeline', label: 'Pipeline Matrix', icon: LayoutList },
                            { id: 'patient_ops', label: 'Patient Ops', icon: Plane },
                            { id: 'cloudtalk', label: 'CloudTalk', icon: Phone },
                            { id: 'splitter', label: 'Rep Splitter', icon: Scissors },
                            { id: 'data', label: 'Data', icon: Database },
                        ].map(v => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id as any)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${view === v.id
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <v.icon size={16} />
                                {v.label}
                            </button>
                        ))}
                    </div>
                </Header>

                {view !== 'data' && view !== 'splitter' && view !== 'marketing' && view !== 'patient_ops' && view !== 'cloudtalk' && (
                    <FilterBar
                        filters={filters}
                        setFilters={setFilters}
                        options={filterOptions}
                    />
                )}

                <main>
                    {view === 'managerial' && (
                        <div className="animate-fade-in-up">
                            <ManagerOverview
                                leads={userType === 'MANAGER' ? filteredLeads : filteredLeads.filter(l => TEAMS['Alex Traon'].includes(l.repName))}
                                patients={patients}
                                onLeadListOpen={handleMetricClick}
                                userType={userType}
                            />
                        </div>
                    )}
                    {view === 'overview' && (
                        <Overview
                            leads={filteredLeads}
                            allLeads={leads}
                            patients={patients}
                            onMetricClick={handleMetricClick}
                            onPipelineBucketClick={handlePipelineBucketClick}
                            manualTotalRevenue={0}
                            repTargets={repTargets}
                            isDarkMode={theme === 'dark'}
                            userType={userType}
                        />
                    )}
                    {view === 'marketing' && (
                        <MarketingFunnelView
                            leads={leads}
                            globalFilters={filters}
                            marketingSpend={marketingSpend}
                            exchangeRate={exchangeRate}
                        />
                    )}
                    {view === 'comparison' && (
                        <FunnelComparisonView
                            allLeads={leads}
                            globalFilters={filters}
                            onActionClick={handleMetricClick}
                        />
                    )}
                    {view === 'reps' && (
                        <RepPerformanceView
                            leads={filteredLeads}
                            targets={repTargets}
                            onLeadClick={handleMetricClick}
                        />
                    )}
                    {view === 'diagnosis' && (
                        <DiagnosisView
                            leads={filteredLeads}
                            onActionClick={handleMetricClick}
                        />
                    )}
                    {view === 'pareto' && (
                        <ParetoEngineView
                            leads={filteredLeads}
                            onActionClick={handleMetricClick}
                            marketingSpend={marketingSpend}
                            exchangeRate={exchangeRate}
                        />
                    )}
                    {view === 'pipeline' && (
                        <PipelineView
                            leads={filteredLeads}
                            onActionClick={handleMetricClick}
                        />
                    )}
                    {view === 'patient_ops' && (
                        <PatientOpsView
                            patients={patients}
                            leads={leads}
                        />
                    )}
                    {view === 'cloudtalk' && (
                        <CloudTalkView />
                    )}
                    {view === 'splitter' && (
                        <RepSplitterView />
                    )}
                    {view === 'data' && (
                        <DataManagementView
                            onDataUpdate={setLeads}
                            onSpendUpdate={setMarketingSpend}
                            onExchangeRateUpdate={setExchangeRate}
                            onMmsUpdate={setPatients}
                            currentCount={leads.length}
                            currentSpendCount={marketingSpend.length}
                            currentMmsCount={patients.length}
                            exchangeRate={exchangeRate}
                        />
                    )}
                </main>
            </div>

            <LeadListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                leads={modalLeads}
                patients={modalPatients}
                title={modalTitle}
                mode={modalMode}
            />

            <PipelineBreakdownModal
                isOpen={isPipelineModalOpen}
                onClose={() => setIsPipelineModalOpen(false)}
                bucketName={pipelineBucketName}
                leads={pipelineLeads}
                onStatusSelect={handleStatusSelect}
            />
        </div>
    );
};

export default App;