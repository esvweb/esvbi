
import React, { useState, useMemo } from 'react';
import { Lead, FilterState, MarketingSpendRecord } from '../types';
import { 
    Megaphone, Filter, ChevronRight, BarChart2, AlertCircle, X, 
    Layers, ArrowRight, Calendar, List, Globe, MessageCircle, Activity, User,
    TrendingUp, ThumbsDown, CheckCircle, Flame, Star, Zap, Award, AlertTriangle,
    ArrowUpDown, ArrowUp, ArrowDown, TrendingDown, Search, Brain, DollarSign, Percent
} from 'lucide-react';
import { filterLeads, INTERESTED_SET, WAITING_EVAL_SET, OFFER_SENT_SET, SUCCESS_SET, NEGATIVE_LOST_SET } from '../services/mockData';

interface MarketingFunnelViewProps {
    leads: Lead[];
    globalFilters: FilterState;
    marketingSpend: MarketingSpendRecord[];
    exchangeRate: number;
}

// --- CONSTANTS & TYPES ---

interface FunnelStats {
    newLeads: number;
    interested: number;
    waitingEval: number;
    offer: number;
    success: number;
    negative: number;
    negativeBreakdown: Record<string, number>;
    leadScoreAvg: number;
    spendEUR: number; 
    cplEUR: number;   
    leads: Lead[];
}

interface NodeData {
    name: string;
    stats: FunnelStats;
    children?: NodeData[];
}

interface MajorInsight {
    type: 'positive' | 'negative';
    category: 'Efficiency' | 'Quality' | 'Conversion' | 'Volume';
    title: string;
    description: string;
    metric: string;
    metricLabel: string;
    node: NodeData;
}

// --- LOGIC HELPERS ---

const formatPct = (num: number, den: number) => den > 0 ? ((num / den) * 100).toFixed(1) + '%' : '0%';
const formatCurrency = (val: number) => `€${val.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
const formatCPL = (val: number) => `€${val.toFixed(2)}`;

// Helper to filter spend records based on date and name matching
const getSpendForContext = (
    allSpend: MarketingSpendRecord[], 
    filters: FilterState, 
    context: { campaign?: string, adset?: string, ad?: string },
    exchangeRate: number
): number => {
    // 1. Date Filter Logic (Replicated from filterLeads logic for consistency)
    const now = new Date();
    let startCutoff: Date | null = null;
    let endCutoff: Date | null = null;

    if (filters.dateRange === 'custom') {
        if (filters.customDateStart) {
            const parts = filters.customDateStart.split('-').map(Number);
            if (parts.length === 3) startCutoff = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
        }
        if (filters.customDateEnd) {
             const parts = filters.customDateEnd.split('-').map(Number);
             if (parts.length === 3) endCutoff = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
        }
    } else {
        if (filters.dateRange === 'month') {
            startCutoff = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            endCutoff = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (filters.dateRange === 'last_month') {
            startCutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            endCutoff = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (filters.dateRange === '6m') {
            startCutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0, 0);
            endCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
    }

    // 2. Filter & Sum
    let totalTRY = 0;
    allSpend.forEach(record => {
        // Date Check
        if (startCutoff && record.date < startCutoff) return;
        if (endCutoff && record.date > endCutoff) return;

        // Context Match (Case insensitive)
        if (context.campaign && record.campaignName.toLowerCase().trim() !== context.campaign.toLowerCase().trim()) return;
        if (context.adset && record.adsetName.toLowerCase().trim() !== context.adset.toLowerCase().trim()) return;
        if (context.ad && record.adName.toLowerCase().trim() !== context.ad.toLowerCase().trim()) return;

        totalTRY += record.spendTRY;
    });

    return totalTRY / (exchangeRate || 36); // Default 36 if 0
};

const calculateMarketingFunnel = (leads: Lead[], spendEUR: number): FunnelStats => {
    let newLeads = 0;
    let interested = 0;
    let waitingEval = 0;
    let offer = 0;
    let success = 0;
    let negative = 0;
    let scoreSum = 0;
    const negativeBreakdown: Record<string, number> = {};

    leads.forEach(l => {
        const s = (l.originalStatus || '').toLowerCase().trim();
        newLeads++;
        
        if (INTERESTED_SET.has(s) || WAITING_EVAL_SET.has(s) || OFFER_SENT_SET.has(s) || SUCCESS_SET.has(s)) interested++;
        if (WAITING_EVAL_SET.has(s) || OFFER_SENT_SET.has(s) || SUCCESS_SET.has(s)) waitingEval++;
        if (OFFER_SENT_SET.has(s) || SUCCESS_SET.has(s)) offer++;
        if (SUCCESS_SET.has(s)) success++;
        
        if (NEGATIVE_LOST_SET.has(s)) {
            negative++;
            negativeBreakdown[l.originalStatus || 'Unknown'] = (negativeBreakdown[l.originalStatus || 'Unknown'] || 0) + 1;
        }

        if (typeof l.leadScore === 'number') scoreSum += l.leadScore;
    });

    return {
        newLeads, interested, waitingEval, offer, success, negative,
        negativeBreakdown,
        leadScoreAvg: newLeads > 0 ? scoreSum / newLeads : 0,
        spendEUR,
        cplEUR: newLeads > 0 ? spendEUR / newLeads : 0,
        leads
    };
};

const FunnelBar3D = ({ label, value, total, colorClass, widthPct, compact = false }: any) => {
    const pctLabel = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
    return (
        <div className="flex items-center gap-3 mb-2 last:mb-0 group">
            <div className={`font-bold text-slate-500 dark:text-slate-400 text-right uppercase tracking-wider shrink-0 ${compact ? 'text-[10px] w-16' : 'text-xs w-24'}`}>{label}</div>
            <div className={`flex-1 ${compact ? 'h-3' : 'h-4'} bg-slate-100 dark:bg-slate-700/50 rounded-full relative shadow-inner overflow-visible`}>
                <div className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-b ${colorClass} shadow-lg shadow-slate-300/50 dark:shadow-none transition-all duration-700 ease-out`} style={{ width: `${Math.max(widthPct, 2)}%` }}>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-t-full"></div>
                </div>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 w-20 text-right tabular-nums shrink-0"><span className="mr-1">{pctLabel}</span><span className="text-[10px] text-slate-400 font-normal">({value})</span></div>
        </div>
    );
};

const MarketingFunnelChart = ({ stats, compact = false }: { stats: FunnelStats, compact?: boolean }) => {
    const maxVal = stats.newLeads > 0 ? stats.newLeads : 1;
    const getW = (val: number) => (val / maxVal) * 100;
    return (
        <div className="w-full flex flex-col gap-1">
            <div className="flex flex-col gap-1 w-full">
                <FunnelBar3D label="New" value={stats.newLeads} total={stats.newLeads} colorClass="from-blue-400 to-blue-600" widthPct={getW(stats.newLeads)} compact={compact} />
                <FunnelBar3D label="≥Interested" value={stats.interested} total={stats.newLeads} colorClass="from-orange-400 to-orange-600" widthPct={getW(stats.interested)} compact={compact} />
                <FunnelBar3D label="≥Wait Eval" value={stats.waitingEval} total={stats.newLeads} colorClass="from-green-400 to-green-600" widthPct={getW(stats.waitingEval)} compact={compact} />
                <FunnelBar3D label="≥Offer Sent" value={stats.offer} total={stats.newLeads} colorClass="from-rose-400 to-rose-600" widthPct={getW(stats.offer)} compact={compact} />
                <FunnelBar3D label="Success" value={stats.success} total={stats.newLeads} colorClass="from-purple-500 to-purple-700" widthPct={getW(stats.success)} compact={compact} />
            </div>
            <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>
            <FunnelBar3D label="Negative" value={stats.negative} total={stats.newLeads} colorClass="from-slate-400 to-slate-600" widthPct={getW(stats.negative)} compact={compact} />
        </div>
    );
};

const Tag = ({ condition, color, text }: { condition: boolean, color: string, text: string }) => {
    if (!condition) return null;
    return <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${color}`}>{text}</span>;
};

const DetailModal = ({ title, onClose, children, zIndex }: any) => (
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`} style={{ zIndex }}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Layers size={20} className="text-blue-500" />
                    {title}
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={24} className="text-slate-400" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                {children}
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

export const MarketingFunnelView: React.FC<MarketingFunnelViewProps> = ({ leads, globalFilters, marketingSpend, exchangeRate }) => {
    
    // --- Local Filter State ---
    const [dateRange, setDateRange] = useState<string>('month');
    const [customStart, setCustomStart] = useState<string>('');
    const [customEnd, setCustomEnd] = useState<string>('');
    
    const [filterCountry, setFilterCountry] = useState<string>('All');
    const [filterLanguage, setFilterLanguage] = useState<string>('All');
    const [filterTreatment, setFilterTreatment] = useState<string>('All');
    const [filterSource, setFilterSource] = useState<string>('All');
    const [filterRep, setFilterRep] = useState<string>('All');

    const [campaigns, setCampaigns] = useState<string[]>([]);
    const [adsets, setAdsets] = useState<string[]>([]);
    const [ads, setAds] = useState<string[]>([]);

    const [highlightMode, setHighlightMode] = useState<'all' | 'high_vol' | 'high_offer' | 'high_interest' | 'high_neg' | 'high_score' | 'best_roi'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'newLeads', direction: 'desc' });
    const [modalStack, setModalStack] = useState<Array<{ type: 'campaign'|'adset'|'ad', id: string, data: NodeData }>>([]);

    // --- SORTING HELPERS ---
    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={14} className="inline ml-1 text-slate-300 opacity-50" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp size={14} className="inline ml-1 text-blue-500" /> 
            : <ArrowDown size={14} className="inline ml-1 text-blue-500" />;
    };

    // --- 1. FILTER LOGIC ---
    
    // Create a local filter object for spend calculation re-use
    const localFilterState: FilterState = useMemo(() => ({
        dateRange: dateRange as any,
        customDateStart: customStart,
        customDateEnd: customEnd,
        treatments: [], countries: [], reps: [], languages: [], sources: [], teams: [] // Irrelevant for spend usually
    }), [dateRange, customStart, customEnd]);

    // BASE LEADS: Filtered by Date & Attributes, BUT NOT Campaign/Adset/Ad yet
    // This allows us to populate the Campaign dropdown with only relevant campaigns for the selected period
    const baseLeads = useMemo(() => {
        const baseFilter: FilterState = {
            ...localFilterState,
            treatments: filterTreatment === 'All' ? [] : [filterTreatment],
            countries: filterCountry === 'All' ? [] : [filterCountry],
            languages: filterLanguage === 'All' ? [] : [filterLanguage],
            sources: filterSource === 'All' ? [] : [filterSource],
            reps: filterRep === 'All' ? [] : [filterRep],
            campaigns: [], adsets: [], ads: []
        };
        const filtered = filterLeads(leads, baseFilter);
        // We only care about leads with marketing attribution for this view
        return filtered.filter(l => l.campaign && l.campaign !== 'Unknown Campaign' && l.campaign !== 'Unknown');
    }, [leads, localFilterState, filterTreatment, filterCountry, filterLanguage, filterSource, filterRep]);

    // DERIVED OPTIONS: Based on baseLeads (Time-aware)
    const options = useMemo(() => {
        // Campaigns visible in the current time/attribute selection
        const campOptions = Array.from(new Set(baseLeads.map(l => l.campaign || 'Unknown'))).sort();
        
        // Adsets depend on selected Campaign (if any)
        const filteredByCamp = campaigns.length > 0 
            ? baseLeads.filter(l => campaigns.includes(l.campaign || '')) 
            : baseLeads;
        const adsetOptions = Array.from(new Set(filteredByCamp.map(l => l.adset || 'Unknown'))).sort();

        // Ads depend on selected Adset (if any)
        const filteredByAdset = adsets.length > 0 
            ? filteredByCamp.filter(l => adsets.includes(l.adset || '')) 
            : filteredByCamp;
        const adOptions = Array.from(new Set(filteredByAdset.map(l => l.ad || 'Unknown'))).sort();

        // Attribute Dropdowns (can come from raw leads or baseLeads depending on pref, baseLeads makes them adaptive)
        const allCountries = Array.from(new Set(leads.map(l => l.country))).sort();
        const allLanguages = Array.from(new Set(leads.map(l => l.language))).sort();
        const allTreatments = Array.from(new Set(leads.map(l => l.treatment))).sort();
        const allSources = Array.from(new Set(leads.map(l => l.source))).sort();
        const allReps = Array.from(new Set(leads.map(l => l.repName))).sort();

        return { 
            campaigns: campOptions, adsets: adsetOptions, ads: adOptions,
            allCountries, allLanguages, allTreatments, allSources, allReps
        };
    }, [baseLeads, campaigns, adsets, leads]);

    // FINAL LEADS: baseLeads + Marketing Filters
    const filteredLeads = useMemo(() => {
        return baseLeads.filter(l => {
            if (campaigns.length > 0 && !campaigns.includes(l.campaign || '')) return false;
            if (adsets.length > 0 && !adsets.includes(l.adset || '')) return false;
            if (ads.length > 0 && !ads.includes(l.ad || '')) return false;
            return true;
        });
    }, [baseLeads, campaigns, adsets, ads]);

    const hasMarketingCols = useMemo(() => {
        return leads.some(l => l.campaign && l.campaign !== 'Unknown Campaign');
    }, [leads]);

    // --- 2. DATA AGGREGATION & SPEND MERGING ---

    const campaignNodes = useMemo(() => {
        const groups: Record<string, Lead[]> = {};
        filteredLeads.forEach(l => {
            const c = l.campaign || 'Unknown';
            if (!groups[c]) groups[c] = [];
            groups[c].push(l);
        });

        return Object.entries(groups).map(([name, groupLeads]) => {
            const campSpend = getSpendForContext(marketingSpend, localFilterState, { campaign: name }, exchangeRate);
            
            return {
                name,
                stats: calculateMarketingFunnel(groupLeads, campSpend),
                children: Object.entries(groupLeads.reduce((acc, l) => {
                    const as = l.adset || 'Unknown';
                    if (!acc[as]) acc[as] = [];
                    acc[as].push(l);
                    return acc;
                }, {} as Record<string, Lead[]>))
                .filter(([adsetName]) => adsetName !== 'Unknown' && adsetName !== 'Unknown Adset')
                .map(([adsetName, adsetLeads]) => {
                    const adsetSpend = getSpendForContext(marketingSpend, localFilterState, { campaign: name, adset: adsetName }, exchangeRate);
                    return {
                        name: adsetName,
                        stats: calculateMarketingFunnel(adsetLeads, adsetSpend),
                        children: Object.entries(adsetLeads.reduce((acc, l) => {
                            const ad = l.ad || 'Unknown';
                            if (!acc[ad]) acc[ad] = [];
                            acc[ad].push(l);
                            return acc;
                        }, {} as Record<string, Lead[]>))
                        .filter(([adName]) => adName !== 'Unknown' && adName !== 'Unknown Ad')
                        .map(([adName, adLeads]) => {
                            const adSpend = getSpendForContext(marketingSpend, localFilterState, { campaign: name, adset: adsetName, ad: adName }, exchangeRate);
                            return {
                                name: adName,
                                stats: calculateMarketingFunnel(adLeads, adSpend)
                            };
                        })
                    };
                })
            };
        });
    }, [filteredLeads, marketingSpend, localFilterState, exchangeRate]);

    const sortedCampaignNodes = useMemo(() => {
        const sorted = [...campaignNodes];
        sorted.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch(sortConfig.key) {
                case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
                case 'newLeads': valA = a.stats.newLeads; valB = b.stats.newLeads; break;
                case 'score': valA = a.stats.leadScoreAvg; valB = b.stats.leadScoreAvg; break;
                case 'spend': valA = a.stats.spendEUR; valB = b.stats.spendEUR; break;
                case 'cpl': valA = a.stats.cplEUR; valB = b.stats.cplEUR; break;
                case 'interested': valA = a.stats.interested; valB = b.stats.interested; break;
                case 'waitingEval': valA = a.stats.waitingEval; valB = b.stats.waitingEval; break;
                case 'offer': valA = a.stats.offer; valB = b.stats.offer; break;
                case 'success': valA = a.stats.success; valB = b.stats.success; break;
                case 'negative': valA = a.stats.negative; valB = b.stats.negative; break;
                default: return 0;
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [campaignNodes, sortConfig]);

    // --- 3. INSIGHTS LOGIC (UPDATED) ---
    
    // 1. Calculate Baselines (Global, Country, Treatment)
    const baselines = useMemo(() => {
        if (baseLeads.length === 0) return null;

        // Helper to compute stats for a subset of leads
        const computeStats = (subset: Lead[]) => {
            if(subset.length === 0) return { offerRate: 0, avgScore: 0, negRate: 0 };
            let offerCount = 0;
            let scoreSum = 0;
            let negCount = 0;
            subset.forEach(l => {
                const s = (l.originalStatus||'').toLowerCase();
                if(OFFER_SENT_SET.has(s) || SUCCESS_SET.has(s)) offerCount++;
                if(NEGATIVE_LOST_SET.has(s)) negCount++;
                scoreSum += (l.leadScore || 0);
            });
            return {
                offerRate: offerCount / subset.length,
                avgScore: scoreSum / subset.length,
                negRate: negCount / subset.length
            };
        };

        // Global Financial CPL (Uses filtered spend / filtered leads)
        const totalSpend = getSpendForContext(marketingSpend, localFilterState, {}, exchangeRate);
        const globalCPL = filteredLeads.length > 0 ? totalSpend / filteredLeads.length : 0;

        const global = { ...computeStats(baseLeads), cpl: globalCPL };

        // By Country
        const byCountry: Record<string, ReturnType<typeof computeStats>> = {};
        options.allCountries.forEach(c => {
            byCountry[c] = computeStats(baseLeads.filter(l => l.country === c));
        });

        // By Treatment
        const byTreatment: Record<string, ReturnType<typeof computeStats>> = {};
        options.allTreatments.forEach(t => {
            byTreatment[t] = computeStats(baseLeads.filter(l => l.treatment === t));
        });

        return { global, byCountry, byTreatment };
    }, [baseLeads, filteredLeads, marketingSpend, localFilterState, exchangeRate, options]);

    // 2. Generate Insights based on Baselines
    const majorInsights = useMemo(() => {
        if (!baselines || campaignNodes.length === 0) return [];
        
        const insights: MajorInsight[] = [];

        campaignNodes.forEach(node => {
            if (node.stats.newLeads < 15) return; // Min volume for statistical significance

            // Determine dominant country/treatment for this node to use correct baseline
            const getDominant = (key: keyof Lead) => {
                const counts: Record<string, number> = {};
                node.stats.leads.forEach(l => {
                    const v = String(l[key] || 'Unknown');
                    counts[v] = (counts[v] || 0) + 1;
                });
                return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'Unknown');
            };

            const domCountry = getDominant('country');
            const domTreatment = getDominant('treatment');

            const countryBase = baselines.byCountry[domCountry] || baselines.global;
            const treatBase = baselines.byTreatment[domTreatment] || baselines.global;
            const globalBase = baselines.global;

            const n = node.stats;
            const offerRate = n.offer / n.newLeads;
            const negRate = n.negative / n.newLeads;

            // --- DEVIATION CALCULATIONS ---
            
            // 1. CPL vs Global (Financials usually best compared globally or we'd need granular spend)
            const cplDiff = globalBase.cpl > 0 ? (n.cplEUR - globalBase.cpl) / globalBase.cpl : 0;
            
            // 2. Offer Rate vs Country Baseline (Contextual Performance)
            const offerDiffCountry = countryBase.offerRate > 0 ? (offerRate - countryBase.offerRate) / countryBase.offerRate : 0;
            
            // 3. Score vs Treatment Baseline (Quality Context)
            const scoreDiffTreat = treatBase.avgScore > 0 ? (n.leadScoreAvg - treatBase.avgScore) / treatBase.avgScore : 0;

            // --- POSITIVE INSIGHTS (GREEN) ---

            // Efficiency Star: Low CPL + High Score (vs Treatment)
            if (cplDiff < -0.2 && scoreDiffTreat > 0.1) {
                insights.push({
                    type: 'positive',
                    category: 'Efficiency',
                    title: 'Efficient Quality',
                    description: `CPL is ${Math.abs(Math.round(cplDiff*100))}% lower than avg, with better quality than typical ${domTreatment} leads.`,
                    metric: formatCPL(n.cplEUR),
                    metricLabel: 'Low CPL',
                    node
                });
            }

            // High Conversion: Offer Rate > 30% above Country Baseline
            else if (offerDiffCountry > 0.3) {
                insights.push({
                    type: 'positive',
                    category: 'Conversion',
                    title: `Top ${domCountry} Performer`,
                    description: `Conversion to Offer is ${(offerDiffCountry*100).toFixed(0)}% higher than the ${domCountry} average.`,
                    metric: `${(offerRate*100).toFixed(1)}%`,
                    metricLabel: 'Offer Rate',
                    node
                });
            }

            // --- NEGATIVE INSIGHTS (ORANGE) ---

            // Cost Spike: CPL > 50% above Global
            else if (cplDiff > 0.5) {
                insights.push({
                    type: 'negative',
                    category: 'Efficiency',
                    title: 'Cost Anomaly',
                    description: `CPL is drastically higher than the global average of ${formatCPL(globalBase.cpl)}.`,
                    metric: `+${(cplDiff*100).toFixed(0)}%`,
                    metricLabel: 'Overspend',
                    node
                });
            }

            // Quality Drop: Score > 20% below Treatment Avg
            else if (scoreDiffTreat < -0.2) {
                insights.push({
                    type: 'negative',
                    category: 'Quality',
                    title: `Low Quality ${domTreatment}`,
                    description: `Lead score is significantly lower than the ${domTreatment} baseline.`,
                    metric: n.leadScoreAvg.toFixed(1),
                    metricLabel: 'Avg Score',
                    node
                });
            }

            // High Burn: Negative Rate > 20% above Global
            else if (negRate > (globalBase.negRate * 1.3)) {
                 insights.push({
                    type: 'negative',
                    category: 'Quality',
                    title: 'High Burn Rate',
                    description: `High volume of immediate rejections/junk compared to average.`,
                    metric: `${(negRate*100).toFixed(0)}%`,
                    metricLabel: 'Neg. Rate',
                    node
                });
            }
        });

        // Prioritize: Negative > Positive to highlight risks first, but mixed is good
        return insights.sort((a, b) => {
            // Sort by absolute impact/magnitude could be complex, simple priority:
            // Negative (Risk) first? Or mix? Let's do Negative first as "Alerts"
            if (a.type !== b.type) return a.type === 'negative' ? -1 : 1;
            return 0; 
        }).slice(0, 4);

    }, [campaignNodes, baselines]);

    // Top 3 lists
    const quickLists = useMemo(() => {
        if (campaignNodes.length === 0) return null;
        const significantNodes = campaignNodes.filter(n => n.stats.newLeads >= 5);
        const rateNodes = significantNodes.length > 0 ? significantNodes : campaignNodes;

        return {
            topVol: [...campaignNodes].sort((a,b) => b.stats.newLeads - a.stats.newLeads).slice(0, 3),
            topOffer: [...rateNodes].sort((a,b) => ((b.stats.offer/b.stats.newLeads) as number) - ((a.stats.offer/a.stats.newLeads) as number)).slice(0, 3),
            topInterest: [...rateNodes].sort((a,b) => ((b.stats.interested/b.stats.newLeads) as number) - ((a.stats.interested/a.stats.newLeads) as number)).slice(0, 3),
            highNeg: [...rateNodes].sort((a,b) => ((b.stats.negative/b.stats.newLeads) as number) - ((a.stats.negative/a.stats.newLeads) as number)).slice(0, 3),
            topScore: [...rateNodes].sort((a,b) => b.stats.leadScoreAvg - a.stats.leadScoreAvg).slice(0, 3),
            // Best ROI: Ratio Volume/CPL. Sort Descending. 
            // Handle CPL = 0 by treating it as infinity (or very high ratio), but exclude extremely low volume to avoid skewed data.
            bestRoi: [...significantNodes].sort((a,b) => {
                const ratioA = a.stats.cplEUR > 0 ? a.stats.newLeads / a.stats.cplEUR : 0;
                const ratioB = b.stats.cplEUR > 0 ? b.stats.newLeads / b.stats.cplEUR : 0;
                return ratioB - ratioA;
            }).slice(0, 3)
        };
    }, [campaignNodes]);

    const displayedNodes = useMemo(() => {
        if (!quickLists) return sortedCampaignNodes;
        switch (highlightMode) {
            case 'high_vol': return quickLists.topVol;
            case 'high_offer': return quickLists.topOffer;
            case 'high_interest': return quickLists.topInterest;
            case 'high_neg': return quickLists.highNeg;
            case 'high_score': return quickLists.topScore;
            case 'best_roi': return quickLists.bestRoi;
            default: return sortedCampaignNodes;
        }
    }, [sortedCampaignNodes, highlightMode, quickLists]);

    const openModal = (type: 'campaign'|'adset'|'ad', id: string, data: NodeData) => {
        setModalStack(prev => [...prev, { type, id, data }]);
    };

    const closeModal = () => {
        setModalStack(prev => prev.slice(0, -1));
    };

    if (!hasMarketingCols) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <AlertCircle size={64} className="text-orange-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Missing Attribution Columns</h2>
                <p className="text-slate-500 max-w-md mt-2">
                    Your data source is missing <code>campaign_name</code>, <code>adset_name</code>, or <code>ad_name</code> columns.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
                        <Megaphone size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Marketing Funnel Explorer</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deep-dive campaign analysis with financial integration.</p>
                    </div>
                </div>
            </div>

            {/* EXTENSIVE FILTER BAR - FULLY RESTORED */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4">
                
                {/* Row 1: Time & Core Attributes */}
                <div className="flex flex-wrap gap-3 items-center">
                    
                    {/* Date Picker */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Calendar size={16} className="text-slate-400 ml-2" />
                        <select 
                            className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none p-2 min-w-[100px] cursor-pointer dark:bg-slate-800"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="month" className="bg-white dark:bg-slate-800">This Month</option>
                            <option value="last_month" className="bg-white dark:bg-slate-800">Last Month</option>
                            <option value="custom" className="bg-white dark:bg-slate-800">Custom Date</option>
                            <option value="6m" className="bg-white dark:bg-slate-800">Last 6 Months</option>
                            <option value="all_time" className="bg-white dark:bg-slate-800">All Time</option>
                        </select>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in shadow-sm">
                            <input 
                                type="date" 
                                value={customStart} 
                                onChange={(e) => setCustomStart(e.target.value)} 
                                className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-200 font-medium dark:color-scheme-dark" 
                            />
                            <ArrowRight size={12} className="text-slate-400" />
                            <input 
                                type="date" 
                                value={customEnd} 
                                onChange={(e) => setCustomEnd(e.target.value)} 
                                className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-200 font-medium dark:color-scheme-dark" 
                            />
                        </div>
                    )}

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>

                    {/* Attribute Dropdowns */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { icon: Globe, val: filterCountry, set: setFilterCountry, opts: options.allCountries, label: 'Country' },
                            { icon: MessageCircle, val: filterLanguage, set: setFilterLanguage, opts: options.allLanguages, label: 'Language' },
                            { icon: Activity, val: filterTreatment, set: setFilterTreatment, opts: options.allTreatments, label: 'Treatment' },
                            { icon: Layers, val: filterSource, set: setFilterSource, opts: options.allSources, label: 'Source' },
                            { icon: User, val: filterRep, set: setFilterRep, opts: options.allReps, label: 'Rep' },
                        ].map((f, i) => (
                            <div key={i} className="relative group">
                                <f.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                <select
                                    value={f.val}
                                    onChange={(e) => f.set(e.target.value)}
                                    className={`pl-9 pr-8 py-2 text-xs font-bold rounded-xl border appearance-none outline-none cursor-pointer transition-all shadow-sm ${
                                        f.val !== 'All' 
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <option value="All" className="bg-white dark:bg-slate-800">All {f.label}s</option>
                                    {f.opts.map(o => <option key={o} value={o} className="bg-white dark:bg-slate-800">{o}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 2: Marketing Hierarchy (Cascading) */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Filter size={12} /> Marketing Hierarchy
                    </span>
                    
                    {/* Campaign */}
                    <select 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 pl-3 outline-none font-bold min-w-[180px] text-slate-700 dark:text-slate-200 shadow-sm"
                        value={campaigns[0] || ''}
                        onChange={(e) => setCampaigns(e.target.value ? [e.target.value] : [])}
                    >
                        <option value="" className="bg-white dark:bg-slate-800">All Campaigns ({options.campaigns.length})</option>
                        {options.campaigns.map(c => <option key={c} value={c} className="bg-white dark:bg-slate-800">{c}</option>)}
                    </select>

                    <ChevronRight size={14} className="text-slate-300" />

                    {/* Adset */}
                    <select 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 pl-3 outline-none font-medium min-w-[180px] disabled:opacity-50 text-slate-700 dark:text-slate-200 shadow-sm"
                        value={adsets[0] || ''}
                        onChange={(e) => setAdsets(e.target.value ? [e.target.value] : [])}
                        disabled={campaigns.length === 0}
                    >
                        <option value="" className="bg-white dark:bg-slate-800">{campaigns.length === 0 ? 'Select Campaign First' : `All Adsets (${options.adsets.length})`}</option>
                        {options.adsets.map(a => <option key={a} value={a} className="bg-white dark:bg-slate-800">{a}</option>)}
                    </select>

                    <ChevronRight size={14} className="text-slate-300" />

                    {/* Ad */}
                    <select 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs p-2 pl-3 outline-none font-medium min-w-[180px] disabled:opacity-50 text-slate-700 dark:text-slate-200 shadow-sm"
                        value={ads[0] || ''}
                        onChange={(e) => setAds(e.target.value ? [e.target.value] : [])}
                        disabled={adsets.length === 0}
                    >
                        <option value="" className="bg-white dark:bg-slate-800">{adsets.length === 0 ? 'Select Adset First' : `All Ads (${options.ads.length})`}</option>
                        {options.ads.map(a => <option key={a} value={a} className="bg-white dark:bg-slate-800">{a}</option>)}
                    </select>
                </div>
            </div>

            {/* QUICK HIGHLIGHTS (BUTTONS) */}
            <div className="flex flex-wrap gap-3 items-center">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mr-2">
                    <Zap size={14} className="text-yellow-500"/> Quick Focus (Top 3)
                </span>
                
                <button 
                    onClick={() => setHighlightMode('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        highlightMode === 'all' 
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                >
                    Show All
                </button>

                <button 
                    onClick={() => setHighlightMode('best_roi')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        highlightMode === 'best_roi'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-indigo-600 hover:border-indigo-200'
                    }`}
                >
                    <Percent size={14} /> Best ROI (Vol/Cost)
                </button>

                <button 
                    onClick={() => setHighlightMode('high_vol')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        highlightMode === 'high_vol'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-blue-600 hover:border-blue-200'
                    }`}
                >
                    <Activity size={14} /> Top Lead Gen
                </button>

                <button 
                    onClick={() => setHighlightMode('high_offer')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        highlightMode === 'high_offer'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200 dark:shadow-none'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-emerald-600 hover:border-emerald-200'
                    }`}
                >
                    <Star size={14} /> Top Offer Rate
                </button>

                <button 
                    onClick={() => setHighlightMode('high_neg')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        highlightMode === 'high_neg'
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-red-500 hover:border-red-200'
                    }`}
                >
                    <ThumbsDown size={14} /> Top Negative
                </button>
            </div>

            {/* SECTION 2: CAMPAIGN COMPARISON */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                <div className="xl:col-span-3">
                    {displayedNodes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedNodes.slice(0, 6).map((node, idx) => (
                                <div key={idx} className="glass-panel p-6 rounded-3xl relative group hover:shadow-2xl transition-all duration-300 border-t-4 border-t-blue-500/20">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-black text-slate-800 dark:text-white truncate cursor-pointer hover:text-blue-600 transition-colors w-2/3" onClick={() => openModal('campaign', node.name, node)} title={node.name}>{node.name}</h3>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">{node.stats.newLeads} Leads</div>
                                            {node.stats.cplEUR > 0 && (
                                                <div className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded shadow-sm border border-indigo-200 dark:border-indigo-700">
                                                    CPL: {formatCPL(node.stats.cplEUR)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <MarketingFunnelChart stats={node.stats} compact={true} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <h3 className="text-lg font-bold">No campaigns match your filters</h3>
                        </div>
                    )}
                </div>

                <div className="xl:col-span-1 space-y-4">
                    <div className="glass-panel p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-100/50 dark:shadow-none bg-gradient-to-b from-white to-indigo-50/30 dark:from-slate-900 dark:to-slate-900">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Brain size={18} className="text-indigo-500" />
                            Major Insights
                        </h3>
                        <div className="space-y-4">
                            {majorInsights.length > 0 ? majorInsights.map((insight, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden group ${
                                        insight.type === 'positive' 
                                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' 
                                        : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800'
                                    }`} 
                                    onClick={() => openModal('campaign', insight.node.name, insight.node)}
                                >
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            {insight.type === 'positive' ? (
                                                <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                                            ) : (
                                                <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400" />
                                            )}
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                                                insight.type === 'positive' ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'
                                            }`}>
                                                {insight.category}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className={`font-bold text-sm mb-1 ${
                                        insight.type === 'positive' ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'
                                    }`}>
                                        {insight.title}
                                    </h4>
                                    <div className="text-xs text-slate-600 dark:text-slate-300 mb-1 font-medium">{insight.node.name}</div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">{insight.description}</p>
                                    <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{insight.metricLabel}</span>
                                        <span className={`text-lg font-black ${
                                            insight.type === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                                        }`}>
                                            {insight.metric}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    No significant anomalies detected in current selection.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 1: CAMPAIGN LEADERBOARD */}
            <div className="glass-panel rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <List size={20} className="text-slate-400" />
                        Campaign Performance Board
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4 pl-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('name')}>Campaign Name <SortIcon column="name"/></th>
                                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('newLeads')}>New Leads <SortIcon column="newLeads"/></th>
                                {/* FINANCIAL COLS */}
                                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400" onClick={() => handleSort('spend')}>Spend <SortIcon column="spend"/></th>
                                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400" onClick={() => handleSort('cpl')}>CPL <SortIcon column="cpl"/></th>
                                
                                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('score')}>Score <SortIcon column="score"/></th>
                                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('interested')}>≥Interested <SortIcon column="interested"/></th>
                                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('offer')}>≥Offer <SortIcon column="offer"/></th>
                                <th className="p-4 text-center text-purple-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('success')}>Success <SortIcon column="success"/></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedCampaignNodes.map((node) => (
                                <tr key={node.name} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                    <td className="p-4 pl-6 font-bold text-slate-700 dark:text-slate-200 max-w-[200px] truncate" title={node.name}>
                                        <button onClick={() => openModal('campaign', node.name, node)} className="hover:underline hover:text-blue-600">{node.name}</button>
                                    </td>
                                    <td className="p-4 text-center font-bold">{node.stats.newLeads}</td>
                                    <td className="p-4 text-center font-mono text-xs text-slate-500">{node.stats.spendEUR > 0 ? formatCurrency(node.stats.spendEUR) : '-'}</td>
                                    <td className="p-4 text-center">
                                        <div className={`font-mono font-bold text-xs px-2 py-1 rounded ${node.stats.cplEUR > 50 ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {node.stats.cplEUR > 0 ? formatCPL(node.stats.cplEUR) : '-'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-xs font-bold">{node.stats.leadScoreAvg.toFixed(1)}</td>
                                    <td className="p-4 text-center text-xs">{formatPct(node.stats.interested, node.stats.newLeads)}</td>
                                    <td className="p-4 text-center text-xs font-bold text-slate-700 dark:text-slate-300">{formatPct(node.stats.offer, node.stats.newLeads)}</td>
                                    <td className="p-4 text-center font-bold text-purple-600">{node.stats.success}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL --- */}
            {modalStack.map((modal, index) => (
                <DetailModal key={modal.id} title={`${modal.type.toUpperCase()}: ${modal.id}`} onClose={closeModal} zIndex={50 + index * 10}>
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><BarChart2 size={18} /> Performance Funnel</h4>
                                <MarketingFunnelChart stats={modal.data.stats} />
                            </div>
                            <div className="w-full md:w-72 space-y-4">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Financials</div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-slate-500">Spend</span>
                                        <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(modal.data.stats.spendEUR)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500">CPL</span>
                                        <span className={`font-bold ${modal.data.stats.cplEUR > 50 ? 'text-red-500' : 'text-emerald-500'}`}>{formatCPL(modal.data.stats.cplEUR)}</span>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Quality</div>
                                    <div className="font-bold text-slate-700 dark:text-slate-200 text-2xl">{modal.data.stats.leadScoreAvg.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 10</span></div>
                                </div>
                            </div>
                        </div>
                        {/* Children Table with Financials */}
                        {modal.data.children && modal.data.children.length > 0 && (
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><List size={18} /> Breakdown</h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase font-bold text-slate-500">
                                            <tr>
                                                <th className="p-3 pl-4">Name</th>
                                                <th className="p-3 text-center">Vol</th>
                                                <th className="p-3 text-center text-indigo-600">Spend</th>
                                                <th className="p-3 text-center text-indigo-600">CPL</th>
                                                <th className="p-3 text-center">Offer</th>
                                                <th className="p-3 text-center text-purple-600">Success</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {[...modal.data.children].sort((a,b) => (b.stats.newLeads as number) - (a.stats.newLeads as number)).map(child => (
                                                <tr key={child.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => openModal(modal.type === 'campaign' ? 'adset' : 'ad', child.name, child)}>
                                                    <td className="p-3 pl-4 font-bold text-blue-600">{child.name}</td>
                                                    <td className="p-3 text-center font-bold">{child.stats.newLeads}</td>
                                                    <td className="p-3 text-center text-xs text-slate-500">{child.stats.spendEUR > 0 ? formatCurrency(child.stats.spendEUR) : '-'}</td>
                                                    <td className="p-3 text-center text-xs font-bold text-slate-700 dark:text-slate-300">{child.stats.cplEUR > 0 ? formatCPL(child.stats.cplEUR) : '-'}</td>
                                                    <td className="p-3 text-center">{formatPct(child.stats.offer, child.stats.newLeads)}</td>
                                                    <td className="p-3 text-center font-bold text-purple-600">{child.stats.success}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </DetailModal>
            ))}
        </div>
    );
};
