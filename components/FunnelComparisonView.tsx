import React, { useState, useMemo } from 'react';
import { Lead, FilterState } from '../types';
import { FunnelChart } from './FunnelChart';
import { filterLeads, calculateFunnelStats, INTERESTED_SET, WAITING_EVAL_SET, OFFER_SENT_SET, SUCCESS_SET, NEGATIVE_LOST_SET } from '../services/mockData';
import { Plus, X, Filter, Trash2, Copy, BarChart2, Calendar, ArrowRight, Camera } from 'lucide-react';

interface FunnelComparisonViewProps {
    allLeads: Lead[];
    globalFilters: FilterState;
    onActionClick?: (leads: Lead[], title: string) => void;
}

interface LocalFilter {
    reps: string[];
    languages: string[];
    countries: string[];
    sources: string[];
    dateRange: string; // 'global' | 'month' | 'last_month' | '6m' | 'all_time' | 'custom'
    customDateStart?: string;
    customDateEnd?: string;
}

interface ComparisonConfig {
    id: string;
    title: string;
    filters: LocalFilter;
}

export const FunnelComparisonView: React.FC<FunnelComparisonViewProps> = ({ allLeads, globalFilters, onActionClick }) => {
    const [comparisons, setComparisons] = useState<ComparisonConfig[]>([]);

    // --- CHART COPY LOGIC ---
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

    // --- DERIVED DATA ---
    
    // 1. Options for Dropdowns (Derived from all leads to show full possibilities)
    const options = useMemo(() => ({
        reps: Array.from(new Set(allLeads.map(l => l.repName))).sort(),
        countries: Array.from(new Set(allLeads.map(l => l.country))).sort(),
        languages: Array.from(new Set(allLeads.map(l => l.language))).sort(),
        sources: Array.from(new Set(allLeads.map(l => l.source))).sort(),
    }), [allLeads]);

    // 2. Global Funnel Data (Respects ALL Global Filters)
    const globalLeads = useMemo(() => filterLeads(allLeads, globalFilters), [allLeads, globalFilters]);
    const globalStats = useMemo(() => calculateFunnelStats(globalLeads), [globalLeads]);

    // --- ACTIONS ---

    const addComparison = () => {
        const newComp: ComparisonConfig = {
            id: Math.random().toString(36).substr(2, 9),
            title: `Comparison ${comparisons.length + 1}`,
            filters: {
                reps: [],
                languages: [],
                countries: [],
                sources: [],
                dateRange: 'global'
            }
        };
        setComparisons([...comparisons, newComp]);
    };

    const removeComparison = (id: string) => {
        setComparisons(comparisons.filter(c => c.id !== id));
    };

    const updateComparisonFilter = (id: string, key: keyof LocalFilter, value: any) => {
        setComparisons(comparisons.map(c => {
            if (c.id === id) {
                let newVal = value;
                
                // Array handling for multi-select fields (Reset to array if 'All' is selected for dropdowns)
                if (['reps', 'countries', 'languages', 'sources'].includes(key)) {
                     newVal = value === 'All' ? [] : [value];
                }
                
                // Auto-update title if it's generic and we are changing a main filter
                let newTitle = c.title;
                if (c.title.startsWith('Comparison') && ['reps', 'countries', 'languages', 'sources'].includes(key)) {
                    newTitle = value === 'All' ? `Comparison ${comparisons.indexOf(c) + 1}` : `${value} Funnel`;
                }

                return { 
                    ...c, 
                    title: newTitle,
                    filters: { ...c.filters, [key]: newVal } 
                };
            }
            return c;
        }));
    };

    // --- HELPER ---
    // Calculates leads for a comparison card
    const getComparisonLeads = (compFilters: LocalFilter) => {
        // Determine Time Range
        let dateRange = compFilters.dateRange;
        let start = compFilters.customDateStart;
        let end = compFilters.customDateEnd;

        // If 'global', fallback to whatever is in globalFilters
        if (dateRange === 'global') {
            dateRange = globalFilters.dateRange;
            start = globalFilters.customDateStart;
            end = globalFilters.customDateEnd;
        }

        // Construct a hybrid filter state
        const hybridFilters: FilterState = {
            dateRange: dateRange as any,
            customDateStart: start,
            customDateEnd: end,
            
            // Inherit Treatment context (rarely changes in side-by-side comparison unless specified, keeping simple)
            treatments: globalFilters.treatments, 
            teams: globalFilters.teams,

            // Override with Local (if empty, means All)
            reps: compFilters.reps,
            countries: compFilters.countries,
            languages: compFilters.languages,
            sources: compFilters.sources
        };
        return filterLeads(allLeads, hybridFilters);
    };

    const handleBarClick = (leads: Lead[], stage: string, compTitle: string) => {
        if (!onActionClick) return;
        
        let filtered: Lead[] = [];
        if (stage === 'New') filtered = leads;
        else if (stage === 'Interested') filtered = leads.filter(l => INTERESTED_SET.has((l.originalStatus||'').toLowerCase()));
        else if (stage === 'WaitingEval') filtered = leads.filter(l => WAITING_EVAL_SET.has((l.originalStatus||'').toLowerCase()));
        else if (stage === 'OfferSent') filtered = leads.filter(l => OFFER_SENT_SET.has((l.originalStatus||'').toLowerCase()));
        else if (stage === 'Success') filtered = leads.filter(l => SUCCESS_SET.has((l.originalStatus||'').toLowerCase()));
        else if (stage === 'Negative') filtered = leads.filter(l => NEGATIVE_LOST_SET.has((l.originalStatus||'').toLowerCase()));
        
        onActionClick(filtered, `${compTitle}: ${stage}`);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BarChart2 className="text-blue-600 dark:text-blue-400" />
                    Funnel Comparison Tool
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Analyze conversion rates across different segments. Click on bars to see the lead lists.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                
                {/* 1. GLOBAL FUNNEL CARD (Reference) */}
                <div id="chart-comp-main" className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border-2 border-blue-100 dark:border-blue-900 p-6 flex flex-col gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Main View</h2>
                            <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                                    {globalLeads.length} Leads
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Filter size={10} />
                                    Matches Top Bar
                                </span>
                            </div>
                        </div>
                        <button 
                            id="btn-copy-chart-comp-main"
                            onClick={() => copyChart('chart-comp-main')}
                            data-html2canvas-ignore
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy as Image"
                        >
                            <Camera size={18}/>
                        </button>
                    </div>

                    <div className="mt-2">
                        <FunnelChart 
                            data={globalStats} 
                            compact={true} 
                            onBarClick={(stage) => handleBarClick(globalLeads, stage, 'Main View')}
                        />
                    </div>
                </div>

                {/* 2. COMPARISON CARDS */}
                {comparisons.map((comp) => {
                    const compLeads = getComparisonLeads(comp.filters);
                    const compStats = calculateFunnelStats(compLeads);
                    const compId = `chart-comp-${comp.id}`;

                    return (
                        <div id={compId} key={comp.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4 animate-fade-in relative group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <input 
                                    className="font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#28BA9A] outline-none text-lg w-full mr-2"
                                    value={comp.title}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setComparisons(prev => prev.map(p => p.id === comp.id ? {...p, title: val} : p));
                                    }}
                                />
                                <div className="flex items-center gap-1">
                                    <button 
                                        id={`btn-copy-${compId}`}
                                        onClick={() => copyChart(compId)}
                                        data-html2canvas-ignore
                                        className="text-slate-300 hover:text-blue-600 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                        title="Copy as Image"
                                    >
                                        <Camera size={18} />
                                    </button>
                                    <button 
                                        onClick={() => removeComparison(comp.id)}
                                        data-html2canvas-ignore
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Time Filter Row */}
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex-wrap">
                                <Calendar size={14} className="text-slate-400" />
                                <select
                                    className="text-xs border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 font-medium text-slate-600 dark:text-slate-300 flex-1 min-w-[120px]"
                                    value={comp.filters.dateRange}
                                    onChange={(e) => updateComparisonFilter(comp.id, 'dateRange', e.target.value)}
                                >
                                    <option value="global">Match Global Date</option>
                                    <option value="month">This Month</option>
                                    <option value="last_month">Last Month</option>
                                    <option value="6m">Last 6 Months</option>
                                    <option value="all_time">All Data</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                                
                                {comp.filters.dateRange === 'custom' && (
                                    <div className="flex items-center gap-1 animate-fade-in w-full sm:w-auto mt-1 sm:mt-0">
                                         <input 
                                            type="date" 
                                            className="text-[10px] border dark:border-slate-700 rounded px-1 py-0.5 outline-blue-500 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-20"
                                            value={comp.filters.customDateStart || ''}
                                            onChange={(e) => updateComparisonFilter(comp.id, 'customDateStart', e.target.value)}
                                        />
                                        <ArrowRight size={10} className="text-slate-400"/>
                                        <input 
                                            type="date" 
                                            className="text-[10px] border dark:border-slate-700 rounded px-1 py-0.5 outline-blue-500 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-20"
                                            value={comp.filters.customDateEnd || ''}
                                            onChange={(e) => updateComparisonFilter(comp.id, 'customDateEnd', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Attributes Filter Grid */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                {/* Rep Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Sales Rep</label>
                                    <select 
                                        className="text-xs border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 text-slate-600 dark:text-slate-300"
                                        value={comp.filters.reps[0] || 'All'}
                                        onChange={(e) => updateComparisonFilter(comp.id, 'reps', e.target.value)}
                                    >
                                        <option value="All">All Reps</option>
                                        {options.reps.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>

                                {/* Country Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Country</label>
                                    <select 
                                        className="text-xs border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 text-slate-600 dark:text-slate-300"
                                        value={comp.filters.countries[0] || 'All'}
                                        onChange={(e) => updateComparisonFilter(comp.id, 'countries', e.target.value)}
                                    >
                                        <option value="All">All Countries</option>
                                        {options.countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Language Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Language</label>
                                    <select 
                                        className="text-xs border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 text-slate-600 dark:text-slate-300"
                                        value={comp.filters.languages[0] || 'All'}
                                        onChange={(e) => updateComparisonFilter(comp.id, 'languages', e.target.value)}
                                    >
                                        <option value="All">All Languages</option>
                                        {options.languages.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>

                                {/* Source Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Source</label>
                                    <select 
                                        className="text-xs border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 text-slate-600 dark:text-slate-300"
                                        value={comp.filters.sources[0] || 'All'}
                                        onChange={(e) => updateComparisonFilter(comp.id, 'sources', e.target.value)}
                                    >
                                        <option value="All">All Sources</option>
                                        {options.sources.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                    {compLeads.length} Leads
                                </span>
                            </div>

                            <FunnelChart 
                                data={compStats} 
                                compact={true} 
                                onBarClick={(stage) => handleBarClick(compLeads, stage, comp.title)}
                            />
                        </div>
                    );
                })}

                {/* ADD BUTTON CARD */}
                <button 
                    onClick={addComparison}
                    className="h-[400px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-[#28BA9A] hover:border-[#28BA9A] hover:bg-[#28BA9A]/5 dark:hover:bg-[#28BA9A]/10 transition-all group"
                >
                    <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-[#28BA9A]/20 transition-colors">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold">Add Comparison Funnel</span>
                </button>
            </div>
        </div>
    );
};