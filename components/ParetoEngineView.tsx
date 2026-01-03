import React, { useMemo, useState } from 'react';
import { Lead, MarketingSpendRecord } from '../types';
import { TEAMS } from '../services/mockData';
import { 
    TrendingUp, Globe, Megaphone, Users, 
    ArrowRight, AlertTriangle, CheckCircle, Brain, 
    DollarSign, Activity, AlertCircle, Briefcase, Layers, Image, Target,
    ArrowUp, ArrowDown, ArrowUpDown, Percent, Coins, Zap, BarChart2, MousePointerClick, Scale,
    Star, Flame, Filter, Trophy, PieChart, FileText, ChevronRight, X, Layout
} from 'lucide-react';
import { 
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, ReferenceLine, Cell, Area
} from 'recharts';

interface ParetoViewProps {
    leads: Lead[];
    marketingSpend: MarketingSpendRecord[];
    exchangeRate: number;
    onActionClick: (leads: Lead[], title: string) => void;
}

// --- CONSTANTS ---
const SUCCESS_SET = new Set(['operation done', 'ticket received', 'pre-payment received', 'pre/payment received']);
const OFFER_PLUS_SET = new Set(['offer sent', ...Array.from(SUCCESS_SET)]);

// --- TYPES ---
type Dimension = 'campaign' | 'adset' | 'ad' | 'country' | 'source' | 'rep' | 'team';

interface EntityStats {
    id: string;
    name: string;
    type: Dimension;
    volume: number; // Leads
    offers: number;
    revenue: number;
    spend: number;
    cpl: number; // Cost Per Lead
    conversion: number; // Offer Rate
    efficiency: number; // (Value Share / Volume Share)
    leads: Lead[];
    parent?: string; 
    cumulativePct: number; // For Pareto
    isParetoTop: boolean; // Is part of the 80% volume driver
}

interface OptimizationOpp {
    id: string;
    type: 'Intra-Adset' | 'Inter-Adset';
    title: string;
    sourceName: string;
    targetName: string;
    shiftAmount: number;
    projectedCplBefore: number;
    projectedCplAfter: number;
    projectedLeadLift: number;
    reason: string;
    sourceLeads: Lead[];
    targetLeads: Lead[];
}

export const ParetoEngineView: React.FC<ParetoViewProps> = ({ leads, marketingSpend, exchangeRate, onActionClick }) => {
    // State for Efficiency Ranking
    const [listFilter, setListFilter] = useState<'volume' | 'cpl' | 'efficiency' | 'conversion'>('volume');
    const [listSortDir, setListSortDir] = useState<'asc' | 'desc'>('desc');

    // State for Pareto Analysis
    const [paretoDimension, setParetoDimension] = useState<'campaign' | 'adset' | 'ad' | 'source' | 'rep'>('campaign');
    const [paretoMetric, setParetoMetric] = useState<'revenue' | 'acquisition'>('revenue');

    // State for Ad Set Details Modal
    const [selectedAdSet, setSelectedAdSet] = useState<string | null>(null);

    // --- 1. DATA PREPARATION FOR RANKING ---
    
    // Helper to get spend for specific marketing entities
    const getMarketingSpend = (name: string, type: 'campaign' | 'adset' | 'ad') => {
        let sum = 0;
        const normName = name.toLowerCase().trim();
        marketingSpend.forEach(r => {
            let match = false;
            if (type === 'campaign' && r.campaignName.toLowerCase().trim() === normName) match = true;
            if (type === 'adset' && r.adsetName.toLowerCase().trim() === normName) match = true;
            if (type === 'ad' && r.adName.toLowerCase().trim() === normName) match = true;
            if (match) sum += r.spendTRY;
        });
        return sum / (exchangeRate || 36);
    };

    // We use Adsets as the primary view for the Ranking Table
    const adsetStats = useMemo(() => {
        const groups: Record<string, EntityStats> = {};
        let totalVolume = 0;
        let totalOffers = 0;

        leads.forEach(l => {
            if (!l.campaign || l.campaign.toLowerCase().includes('unknown')) return;

            const key = l.adset || 'Unknown';
            
            if (!groups[key]) {
                groups[key] = {
                    id: key, name: key, type: 'adset', 
                    volume: 0, offers: 0, revenue: 0, spend: 0, cpl: 0, conversion: 0, efficiency: 0, 
                    leads: [], parent: l.campaign, cumulativePct: 0, isParetoTop: false
                };
            }

            const g = groups[key];
            g.volume++;
            g.leads.push(l);
            g.revenue += (l.revenue || 0);
            
            const s = (l.originalStatus || '').toLowerCase();
            if (OFFER_PLUS_SET.has(s)) g.offers++;

            totalVolume++;
            totalOffers++;
        });

        // Metrics
        let list = Object.values(groups).map(g => {
            g.spend = getMarketingSpend(g.name, 'adset');
            g.cpl = g.volume > 0 ? g.spend / g.volume : 0;
            g.conversion = g.volume > 0 ? g.offers / g.volume : 0;
            
            const volShare = totalVolume > 0 ? g.volume / totalVolume : 0;
            const offerShare = totalOffers > 0 ? g.offers / totalOffers : 0;
            g.efficiency = volShare > 0 ? offerShare / volShare : 0;

            return g;
        });

        return list;
    }, [leads, marketingSpend, exchangeRate]);

    const sortedAdsetList = useMemo(() => {
        return [...adsetStats].sort((a,b) => {
            let valA = 0;
            let valB = 0;
            if (listFilter === 'volume') { valA = a.volume; valB = b.volume; }
            else if (listFilter === 'cpl') { valA = a.cpl; valB = b.cpl; }
            else if (listFilter === 'efficiency') { valA = a.efficiency; valB = b.efficiency; }
            else if (listFilter === 'conversion') { valA = a.conversion; valB = b.conversion; }
            return listSortDir === 'asc' ? valA - valB : valB - valA;
        });
    }, [adsetStats, listFilter, listSortDir]);

    // --- 1.5 AD BREAKDOWN FOR MODAL ---
    const adBreakdown = useMemo(() => {
        if (!selectedAdSet) return [];
        
        // Filter leads for this adset
        const subset = leads.filter(l => l.adset === selectedAdSet);
        const groups: Record<string, EntityStats> = {};
        let setVolume = 0;
        let setOffers = 0;

        subset.forEach(l => {
            const key = l.ad || 'Unknown Ad';
            if(!groups[key]) {
                groups[key] = {
                    id: key, name: key, type: 'ad',
                    volume: 0, offers: 0, revenue: 0, spend: 0, cpl: 0, conversion: 0, efficiency: 0,
                    leads: [], parent: selectedAdSet, cumulativePct: 0, isParetoTop: false
                };
            }
            const g = groups[key];
            g.volume++;
            g.leads.push(l);
            if(OFFER_PLUS_SET.has((l.originalStatus||'').toLowerCase())) g.offers++;
            setVolume++;
            setOffers++;
        });

        return Object.values(groups).map(g => {
            g.spend = getMarketingSpend(g.name, 'ad');
            g.cpl = g.volume > 0 ? g.spend / g.volume : 0;
            g.conversion = g.volume > 0 ? g.offers / g.volume : 0;
            
            // Relative Efficiency within AdSet
            const volShare = setVolume > 0 ? g.volume / setVolume : 0;
            const offerShare = setOffers > 0 ? g.offers / setOffers : 0;
            g.efficiency = volShare > 0 ? offerShare / volShare : 0;
            
            return g;
        }).sort((a,b) => b.volume - a.volume);

    }, [selectedAdSet, leads, marketingSpend, exchangeRate]);


    // --- 2. PARETO CHART DATA ---
    const paretoData = useMemo(() => {
        const groups: Record<string, { name: string, value: number, count: number }> = {};
        let totalValue = 0;

        leads.forEach(l => {
            let key = '';
            if (paretoDimension === 'source') key = l.source;
            else if (paretoDimension === 'campaign') key = l.campaign;
            else if (paretoDimension === 'adset') key = l.adset || 'Unknown';
            else if (paretoDimension === 'ad') key = l.ad || 'Unknown';
            else if (paretoDimension === 'rep') key = l.repName;

            if (!key || key === 'Unknown' || key.includes('Unknown') || key === 'Unassigned') return;

            if (!groups[key]) groups[key] = { name: key, value: 0, count: 0 };
            
            let val = 0;
            if (paretoMetric === 'revenue') val = l.revenue;
            else if (paretoMetric === 'acquisition') {
                 if (OFFER_PLUS_SET.has((l.originalStatus||'').toLowerCase())) val = 1;
            }
            
            groups[key].value += val;
            groups[key].count++;
            totalValue += val;
        });

        const sorted = Object.values(groups).sort((a, b) => b.value - a.value);

        let running = 0;
        const dataWithFlags = sorted.map((item, index) => {
            running += item.value;
            const cumPct = totalValue > 0 ? (running / totalValue) * 100 : 0;
            return {
                ...item,
                cumPct,
                rank: index + 1,
                isPareto: false // will set below
            };
        });

        // Determine Pareto Cutoff
        const cutoffIndex = dataWithFlags.findIndex(d => d.cumPct >= 80);
        const actualCutoff = cutoffIndex === -1 ? dataWithFlags.length - 1 : cutoffIndex;

        dataWithFlags.forEach((item, index) => {
            item.isPareto = index <= actualCutoff;
        });

        const vitalFewCount = actualCutoff + 1;
        const vitalFewPct = dataWithFlags.length > 0 ? (vitalFewCount / dataWithFlags.length) * 100 : 0;

        return { data: dataWithFlags.slice(0, 30), totalEntities: dataWithFlags.length, vitalFewCount, vitalFewPct, totalValue }; 
    }, [leads, paretoDimension, paretoMetric]);

    // --- 3. DIAGNOSIS GENERATOR ---
    const diagnosis = useMemo(() => {
        if (adsetStats.length === 0) return [];
        const insights = [];
        
        // 1. Volume Anchor
        const anchor = [...adsetStats].sort((a,b) => b.volume - a.volume)[0];
        if (anchor) {
            insights.push({
                title: "Volume Anchor",
                entity: anchor.name,
                metric: `${anchor.volume} Leads`,
                desc: `Drives maximum volume. Efficiency: ${anchor.efficiency.toFixed(2)}x.`,
                icon: Layers,
                color: 'text-blue-500',
                bg: 'bg-blue-50 dark:bg-blue-900/20'
            });
        }

        // 2. Efficiency Star
        const star = adsetStats.filter(a => a.volume > 10).sort((a,b) => b.efficiency - a.efficiency)[0];
        if (star) {
            insights.push({
                title: "Efficiency Star",
                entity: star.name,
                metric: `${star.efficiency.toFixed(2)}x`,
                desc: `High value-to-volume ratio. Priority for scaling.`,
                icon: Star,
                color: 'text-yellow-500',
                bg: 'bg-yellow-50 dark:bg-yellow-900/20'
            });
        }

        // 3. Cash Burner (Only if CPL available)
        const burner = adsetStats.filter(a => a.spend > 100).sort((a,b) => b.cpl - a.cpl)[0];
        if (burner && burner.cpl > 0) {
            insights.push({
                title: "Cash Burner",
                entity: burner.name,
                metric: `€${burner.cpl.toFixed(0)} CPL`,
                desc: `Highest cost per lead. Needs optimization.`,
                icon: Flame,
                color: 'text-red-500',
                bg: 'bg-red-50 dark:bg-red-900/20'
            });
        }

        // 4. Conversion Bottleneck
        const bottleneck = adsetStats.filter(a => a.volume > 20).sort((a,b) => a.conversion - b.conversion)[0];
        if (bottleneck) {
            insights.push({
                title: "Conversion Bottleneck",
                entity: bottleneck.name,
                metric: `${(bottleneck.conversion*100).toFixed(1)}% Conv`,
                desc: `High volume but fails to convert to offers. Check lead quality.`,
                icon: Filter,
                color: 'text-orange-500',
                bg: 'bg-orange-50 dark:bg-orange-900/20'
            });
        }

        // 5. Hidden Gem
        const gem = adsetStats.filter(a => a.volume < (anchor?.volume * 0.5) && a.volume > 10 && a.efficiency > 1.2).sort((a,b) => b.efficiency - a.efficiency)[0];
        if (gem) {
            insights.push({
                title: "Hidden Gem",
                entity: gem.name,
                metric: `${gem.efficiency.toFixed(2)}x Eff`,
                desc: `Great performance on lower volume. Scale cautiously.`,
                icon: Zap,
                color: 'text-purple-500',
                bg: 'bg-purple-50 dark:bg-purple-900/20'
            });
        }

        return insights.slice(0, 5);
    }, [adsetStats]);

    // --- 4. OPTIMIZATION ENGINE ---
    const optimizations = useMemo(() => {
        const opps: OptimizationOpp[] = [];
        
        // Ad-level stats needed for Intra-Adset
        const adMap: Record<string, EntityStats> = {};
        leads.forEach(l => {
            if(!l.campaign || l.campaign.includes('Unknown')) return;
            const adKey = l.ad || 'Unknown';
            if(!adMap[adKey]) adMap[adKey] = { id: adKey, name: adKey, type: 'ad', volume: 0, offers: 0, revenue: 0, spend: 0, cpl: 0, conversion: 0, efficiency: 0, leads: [], parent: l.adset, cumulativePct:0, isParetoTop:false };
            adMap[adKey].volume++;
            adMap[adKey].leads.push(l);
        });
        Object.values(adMap).forEach(g => { g.spend = getMarketingSpend(g.name, 'ad'); g.cpl = g.volume > 0 ? g.spend/g.volume : 0; });

        // A. INTRA-ADSET
        const adsByAdset: Record<string, EntityStats[]> = {};
        Object.values(adMap).forEach(ad => {
            if(ad.parent && ad.parent !== 'Unknown') {
                if(!adsByAdset[ad.parent]) adsByAdset[ad.parent] = [];
                adsByAdset[ad.parent].push(ad);
            }
        });

        Object.entries(adsByAdset).forEach(([pName, ads]) => {
            const valid = ads.filter(a => a.volume >= 5 && a.spend > 20).sort((a,b) => a.cpl - b.cpl);
            if(valid.length < 2) return;
            const best = valid[0];
            const worst = valid[valid.length - 1];

            if (worst.cpl > best.cpl * 1.4) {
                const shift = worst.spend * 0.3;
                if (shift < 10) return;
                const leadsLost = shift / worst.cpl;
                const leadsGained = shift / best.cpl;
                const leadLift = leadsGained - leadsLost;
                const newAvgCpl = (best.spend + worst.spend) / (best.volume + worst.volume + leadLift);

                opps.push({
                    id: `intra-${pName}`, type: 'Intra-Adset', title: 'Creative Rotation',
                    sourceName: worst.name, targetName: best.name, shiftAmount: shift,
                    projectedCplBefore: (best.spend+worst.spend)/(best.volume+worst.volume),
                    projectedCplAfter: newAvgCpl, projectedLeadLift: leadLift,
                    reason: `High variance in ${pName}`,
                    sourceLeads: worst.leads,
                    targetLeads: best.leads
                });
            }
        });

        // B. INTER-ADSET
        const contextGroups: Record<string, EntityStats[]> = {};
        adsetStats.forEach(as => {
            if(as.leads.length === 0) return;
            const l = as.leads[0];
            const key = `${l.country}-${l.treatment}`;
            if(!contextGroups[key]) contextGroups[key] = [];
            contextGroups[key].push(as);
        });

        Object.entries(contextGroups).forEach(([ctx, sets]) => {
            const valid = sets.filter(s => s.volume >= 10 && s.spend > 100).sort((a,b) => a.cpl - b.cpl);
            if(valid.length < 2) return;
            const best = valid[0];
            const worst = valid[valid.length - 1];

            if (worst.cpl > best.cpl * 1.3) {
                const shift = worst.spend * 0.2;
                if (shift < 50) return;
                const leadsLost = shift / worst.cpl;
                const leadsGained = shift / best.cpl;
                const leadLift = leadsGained - leadsLost;
                const newAvgCpl = (best.spend + worst.spend) / (best.volume + worst.volume + leadLift);

                opps.push({
                    id: `inter-${ctx}`, type: 'Inter-Adset', title: 'Adset Scaling',
                    sourceName: worst.name, targetName: best.name, shiftAmount: shift,
                    projectedCplBefore: (best.spend+worst.spend)/(best.volume+worst.volume),
                    projectedCplAfter: newAvgCpl, projectedLeadLift: leadLift,
                    reason: `Optimize ${ctx}`,
                    sourceLeads: worst.leads,
                    targetLeads: best.leads
                });
            }
        });

        return opps.sort((a,b) => b.projectedLeadLift - a.projectedLeadLift).slice(0, 6);
    }, [adsetStats, leads, marketingSpend, exchangeRate]);

    const handleListSort = (key: 'volume' | 'cpl' | 'efficiency' | 'conversion') => {
        if (listFilter === key) {
            setListSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setListFilter(key);
            setListSortDir('desc');
        }
    };

    const SortIcon = ({ col }: { col: string }) => {
        if (listFilter !== col) return <ArrowUpDown size={12} className="opacity-30 ml-1 inline" />;
        return listSortDir === 'asc' ? <ArrowUp size={12} className="text-[#28BA9A] ml-1 inline" /> : <ArrowDown size={12} className="text-[#28BA9A] ml-1 inline" />;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24 relative">
            
            {/* AD SET DETAILS MODAL */}
            {selectedAdSet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Layers size={18} className="text-blue-500" />
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ad Set Details</h3>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl truncate" title={selectedAdSet}>
                                    {selectedAdSet}
                                </p>
                            </div>
                            <button onClick={() => setSelectedAdSet(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800/50 custom-scrollbar">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Ad Performance Breakdown</h4>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-500 border-b border-slate-100 dark:border-slate-700">
                                        <tr>
                                            <th className="p-3 pl-4">Ad Name</th>
                                            <th className="p-3 text-center">Vol</th>
                                            <th className="p-3 text-center text-indigo-600">Spend</th>
                                            <th className="p-3 text-center text-indigo-600">CPL</th>
                                            <th className="p-3 text-center">Eff. Ratio</th>
                                            <th className="p-3 text-center pr-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {adBreakdown.map((ad, i) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-3 pl-4 font-medium text-slate-700 dark:text-slate-300 max-w-[250px] truncate" title={ad.name}>
                                                    {ad.name}
                                                </td>
                                                <td className="p-3 text-center font-bold">{ad.volume}</td>
                                                <td className="p-3 text-center font-mono text-xs text-slate-500">
                                                    {ad.spend > 0 ? `€${ad.spend.toFixed(0)}` : '-'}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${ad.cpl > 50 ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {ad.cpl > 0 ? `€${ad.cpl.toFixed(0)}` : '-'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className={`text-xs font-black ${ad.efficiency > 1.1 ? 'text-emerald-500' : ad.efficiency < 0.9 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {ad.efficiency.toFixed(2)}x
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center pr-4">
                                                    <button 
                                                        onClick={() => onActionClick(ad.leads, `Details: ${ad.name}`)}
                                                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded transition-colors"
                                                        title="View Leads"
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {adBreakdown.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-400 italic">No ads found for this ad set.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[24px] text-white shadow-xl">
                        <Brain size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Insights <span className="text-slate-400 font-normal">v3.0</span></h1>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Pareto Logic & AI Optimization</p>
                    </div>
                </div>
            </div>

            {/* 1. STRATEGIC DIAGNOSIS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {diagnosis.map((d, i) => (
                    <div key={i} className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity ${d.color}`}>
                            <d.icon size={48} />
                        </div>
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                            <div className={`p-1.5 rounded-lg ${d.bg} ${d.color}`}>
                                <d.icon size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{d.title}</span>
                        </div>
                        <div className={`text-xl font-black mb-1 ${d.color}`}>{d.metric}</div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mb-1" title={d.entity}>{d.entity}</div>
                        <p className="text-[10px] text-slate-500 leading-tight">{d.desc}</p>
                    </div>
                ))}
            </div>

            {/* 2. PARETO IMPACT ANALYSIS (NEW VISUALS) */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden relative">
                {/* Background Element */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
                            <PieChart size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Pareto Impact Analysis</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">The Vital Few vs. The Trivial Many</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 items-center bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                        {/* Metric Toggle */}
                        <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-sm p-1">
                            <button
                                onClick={() => setParetoMetric('revenue')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                    paretoMetric === 'revenue' 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <DollarSign size={14} /> Revenue
                            </button>
                            <button
                                onClick={() => setParetoMetric('acquisition')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                    paretoMetric === 'acquisition' 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <FileText size={14} /> Acquisition
                            </button>
                        </div>

                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        {/* Dimension Toggle */}
                        <div className="flex gap-1 overflow-x-auto max-w-[400px] md:max-w-none custom-scrollbar pb-1">
                            {[
                                { id: 'campaign', label: 'Campaign' },
                                { id: 'adset', label: 'Ad Set' },
                                { id: 'ad', label: 'Ad' },
                                { id: 'source', label: 'Lead Source' },
                                { id: 'rep', label: 'Sales Rep' },
                            ].map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => setParetoDimension(d.id as any)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                                        paretoDimension === d.id 
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-600 shadow-sm' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 p-8 gap-8">
                    
                    {/* CHART AREA */}
                    <div className="lg:col-span-3 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={paretoData.data} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={paretoMetric === 'revenue' ? '#818cf8' : '#60a5fa'} stopOpacity={0.8}/>
                                        <stop offset="100%" stopColor={paretoMetric === 'revenue' ? '#6366f1' : '#3b82f6'} stopOpacity={1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} 
                                    interval={0} 
                                    angle={-20} 
                                    textAnchor="end" 
                                    height={60} 
                                    tickFormatter={(val) => val.length > 15 ? val.substring(0,12)+'...' : val}
                                />
                                <YAxis yAxisId="left" orientation="left" stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{fontSize: 10}} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                                    cursor={{fill: '#f1f5f9', opacity: 0.1}}
                                    formatter={(val: number, name: string, props: any) => [
                                        name === 'cumPct' ? `${val.toFixed(1)}%` : val.toLocaleString(),
                                        name === 'cumPct' ? 'Cumulative %' : (
                                            props.payload.isPareto ? `🔥 ${paretoMetric === 'revenue' ? 'Revenue' : 'Offers'} (Top 80%)` : `${paretoMetric === 'revenue' ? 'Revenue' : 'Offers'}`
                                        )
                                    ]}
                                />
                                <Bar 
                                    yAxisId="left" 
                                    dataKey="value" 
                                    barSize={30} 
                                    radius={[6, 6, 0, 0]} 
                                    animationDuration={1500}
                                >
                                    {paretoData.data.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.isPareto ? "url(#barGradient)" : "#cbd5e1"} 
                                            fillOpacity={entry.isPareto ? 1 : 0.6}
                                        />
                                    ))}
                                </Bar>
                                <Line 
                                    yAxisId="right" 
                                    type="monotone" 
                                    dataKey="cumPct" 
                                    stroke="#10b981" 
                                    strokeWidth={3} 
                                    dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} 
                                    activeDot={{r: 6}}
                                    animationDuration={2000}
                                />
                                <ReferenceLine 
                                    yAxisId="right" 
                                    y={80} 
                                    stroke="#ef4444" 
                                    strokeWidth={2}
                                    strokeDasharray="4 2" 
                                    label={{ value: '80% CUTOFF', fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'insideRight' }} 
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* VITAL FEW SUMMARY SIDEBAR */}
                    <div className="lg:col-span-1 flex flex-col justify-center gap-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
                            
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Concentration Ratio</h4>
                            
                            <div className="flex items-end gap-3 mb-2">
                                <span className="text-6xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{paretoData.vitalFewCount}</span>
                                <span className="text-sm font-bold text-slate-400 mb-2">/ {paretoData.totalEntities}</span>
                            </div>
                            
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-emerald-500 rounded-full" style={{width: `${paretoData.vitalFewPct}%`}}></div>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                <span className="text-emerald-500 font-bold">{paretoData.vitalFewPct.toFixed(1)}%</span> of your {paretoDimension}s are generating <span className="font-bold text-slate-800 dark:text-white">80%</span> of total {paretoMetric}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. SPLIT VIEW: RANKING & OPTIMIZATION */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                
                {/* LEFT: MINIMALISTIC RANKING LIST */}
                <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Scale size={20} className="text-blue-500" />
                            <h3 className="font-black text-slate-800 dark:text-slate-100 tracking-tight">Ad Set Efficiency Ranking</h3>
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                            Click name to see ads
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="p-4 pl-6 font-black">Adset Name</th>
                                    <th className="p-4 text-center cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleListSort('volume')}>
                                        Vol <SortIcon col="volume" />
                                    </th>
                                    <th className="p-4 text-center cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleListSort('cpl')}>
                                        CPL <SortIcon col="cpl" />
                                    </th>
                                    <th className="p-4 text-center cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleListSort('efficiency')}>
                                        Eff. Score <SortIcon col="efficiency" />
                                    </th>
                                    <th className="p-4 text-center pr-6 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => handleListSort('conversion')}>
                                        Conv. <SortIcon col="conversion" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {sortedAdsetList.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <button 
                                                onClick={() => setSelectedAdSet(item.name)}
                                                className="font-bold text-slate-700 dark:text-slate-200 max-w-[220px] truncate hover:text-blue-600 dark:hover:text-blue-400 text-left block flex items-center gap-2 group-hover:underline decoration-blue-500/30" 
                                                title={`Click to see ads in ${item.name}`}
                                            >
                                                <Layout size={12} className="text-slate-400 group-hover:text-blue-500"/>
                                                {item.name}
                                            </button>
                                            <div className="text-[10px] text-slate-400 pl-5">{item.parent || 'No Campaign'}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => onActionClick(item.leads, `Leads for ${item.name}`)}
                                                className="font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline decoration-dashed underline-offset-2"
                                            >
                                                {item.volume}
                                            </button>
                                        </td>
                                        <td className="p-4 text-center font-mono text-xs text-slate-500">
                                            {item.cpl > 0 ? `€${item.cpl.toFixed(0)}` : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`inline-flex items-center gap-1 font-black px-2 py-0.5 rounded text-xs ${
                                                item.efficiency > 1.2 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 
                                                item.efficiency < 0.8 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 
                                                'text-slate-400 bg-slate-100 dark:bg-slate-800'
                                            }`}>
                                                {item.efficiency.toFixed(2)}x
                                            </div>
                                        </td>
                                        <td className="p-4 text-center pr-6 font-bold text-blue-600 text-xs">
                                            {(item.conversion * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT: MINIMALISTIC CREATIVE ROTATION */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    
                    {/* Header Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-xl border border-slate-200/60 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 text-slate-800 dark:text-white">
                                <Zap className="text-yellow-500 dark:text-yellow-400" />
                                Creative Rotation
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
                                AI suggestions to balance budget between low and high performing creatives.
                            </p>
                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex justify-between items-end">
                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Potential Lift</div>
                                <div className="text-4xl font-black text-emerald-500 dark:text-emerald-400">
                                    +{optimizations.reduce((acc, o) => acc + o.projectedLeadLift, 0).toFixed(0)} <span className="text-sm font-bold text-emerald-600 dark:text-emerald-600">Leads</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Minimalistic Recommendations */}
                    <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                        {optimizations.map((opp) => (
                            <div key={opp.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{opp.type.split('-')[0]} Optimization</span>
                                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{opp.title}</h4>
                                    </div>
                                    <div className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                                        +{opp.projectedLeadLift.toFixed(1)} Leads
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[9px] font-bold text-red-400 uppercase mb-0.5">Decrease Spend</div>
                                        <button 
                                            onClick={() => onActionClick(opp.sourceLeads, `Underperforming: ${opp.sourceName}`)}
                                            className="font-medium text-slate-600 dark:text-slate-300 truncate hover:text-blue-500 hover:underline text-left block w-full" 
                                            title={opp.sourceName}
                                        >
                                            {opp.sourceName}
                                        </button>
                                    </div>
                                    <div className="text-slate-300">
                                        <ArrowRight size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <div className="text-[9px] font-bold text-emerald-500 uppercase mb-0.5">Increase Spend</div>
                                        <button 
                                            onClick={() => onActionClick(opp.targetLeads, `Top Performer: ${opp.targetName}`)}
                                            className="font-bold text-slate-700 dark:text-white truncate hover:text-blue-500 hover:underline block w-full text-right" 
                                            title={opp.targetName}
                                        >
                                            {opp.targetName}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
                                    <span>Reallocate: <span className="font-bold text-slate-600 dark:text-slate-300">€{opp.shiftAmount.toFixed(0)}</span></span>
                                    <span>Est CPL: <span className="line-through opacity-50 mr-1">€{opp.projectedCplBefore.toFixed(0)}</span> <span className="font-bold text-emerald-500">€{opp.projectedCplAfter.toFixed(0)}</span></span>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

        </div>
    );
};