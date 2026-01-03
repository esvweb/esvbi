import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import { 
    Brain, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, 
    Activity, ArrowRight, User, Users, BarChart2,
    Target, Clock, ListChecks, Database, MousePointerClick, HelpCircle, UserPlus, AlertOctagon,
    ArrowUpRight, Percent, RefreshCw, Info, Timer
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis, ReferenceLine, ReferenceArea, Cell, Label, AreaChart, Area
} from 'recharts';

interface DiagnosisProps {
    leads: Lead[];
    onActionClick: (leads: Lead[], title: string) => void;
}

type ColorStatus = 'Green' | 'Orange' | 'Red';

interface KPIData {
    val: number;
    total: number;
    pct: number;
    deduction: number; // New field for transparency
    status: ColorStatus;
}

interface ScopeHealth {
    kpi1: KPIData; 
    kpi2: KPIData; 
    kpi3: KPIData; 
    kpi4: KPIData; 
    kpi5: KPIData; 
    overallColor: ColorStatus;
    score: number;
}

// --- CONSTANTS & SETS ---
const EXCLUDED_REPS = ['Enzo Hamadouche', 'Liz Weller'];
const MAX_RECOMMENDED_PER_REP = 300; 

const CLOSED_SUCCESS_SET = new Set(['operation done', 'ticket received', 'pre-payment received', 'pre/payment received']);
const NEGATIVE_LOST_SET = new Set(['lost', 'not interest / junk', 'high price', 'wrong number', 'block', 'other languages', 'night shift', 'rejected by doctor', "interested can't travel"]);

const getBucket = (originalStatus: string): 'Open' | 'Success' | 'Negative' | 'Active' => {
    const s = (originalStatus || '').trim().toLowerCase();
    if (s === 'new lead' || s.startsWith('nr')) return 'Open';
    if (CLOSED_SUCCESS_SET.has(s)) return 'Success';
    if (NEGATIVE_LOST_SET.has(s)) return 'Negative';
    return 'Active';
};

// --- NEW "FAIR" CALCULATION ENGINE ---
const calculateHealth = (scopeLeads: Lead[]): ScopeHealth => {
    const now = new Date();

    // Helper: Determine visual color based on the individual KPI bucket health
    const getStatus = (pct: number, redThreshold: number, orangeThreshold: number): ColorStatus => {
        if (pct > redThreshold) return 'Red';
        if (pct > orangeThreshold) return 'Orange';
        return 'Green';
    };

    // --- 1. VELOCITY (New Leads) - Weight: 30pts ---
    const newLeads = scopeLeads.filter(l => (l.originalStatus||'').toLowerCase() === 'new lead');
    const newOverdue = newLeads.filter(l => l.diffDays >= 1); // 24h rule
    const kpi1Pct = newLeads.length > 0 ? (newOverdue.length / newLeads.length) : 0;
    const kpi1Deduction = kpi1Pct * 30; // Max 30 pts lost
    const kpi1Color = getStatus(kpi1Pct * 100, 25, 10);

    // --- 2. DISCIPLINE (NR Leads) - Weight: 15pts ---
    const nrLeads = scopeLeads.filter(l => (l.originalStatus||'').toLowerCase().startsWith('nr'));
    const nrOverdue = nrLeads.filter(l => {
        const s = (l.originalStatus || '').toLowerCase().trim();
        const isNr5String = /^nr[\s-_]?5$/.test(s);
        const isNr5Prop = l.nrCount === 5;
        if (isNr5String || isNr5Prop) return false; // NR5 is graveyard, doesn't count against discipline
        return l.diffDays > 7;
    });
    const kpi2Pct = nrLeads.length > 0 ? (nrOverdue.length / nrLeads.length) : 0;
    const kpi2Deduction = kpi2Pct * 15; // Max 15 pts lost
    const kpi2Color = getStatus(kpi2Pct * 100, 30, 15);

    // --- 3. PROCESS (Evaluation) - Weight: 20pts ---
    const evalStatuses = new Set(['waiting for evaluation', 'evaluation done']);
    const evalLeads = scopeLeads.filter(l => evalStatuses.has((l.originalStatus||'').toLowerCase()));
    const evalStuck = evalLeads.filter(l => l.diffDays > 1);
    const kpi3Pct = evalLeads.length > 0 ? (evalStuck.length / evalLeads.length) : 0;
    const kpi3Deduction = kpi3Pct * 20; // Max 20 pts lost
    const kpi3Color = getStatus(kpi3Pct * 100, 20, 10);

    // --- 4. CLOSING (Offers) - Weight: 20pts ---
    const offerLeads = scopeLeads.filter(l => (l.originalStatus||'').toLowerCase() === 'offer sent');
    const offerOverdue = offerLeads.filter(l => {
        const ageTime = Math.abs(now.getTime() - new Date(l.createDate).getTime());
        const ageDays = Math.ceil(ageTime / (1000 * 60 * 60 * 24));
        // Dynamic threshold logic kept from original
        let threshold = 30; 
        if (ageDays < 14) threshold = 7;
        else if (ageDays < 30) threshold = 10;
        else if (ageDays < 60) threshold = 20;
        return l.diffDays > threshold;
    });
    const kpi4Pct = offerLeads.length > 0 ? (offerOverdue.length / offerLeads.length) : 0;
    const kpi4Deduction = kpi4Pct * 20; // Max 20 pts lost
    const kpi4Color = getStatus(kpi4Pct * 100, 35, 15);

    // --- 5. HYGIENE (Active Stale) - Weight: 15pts ---
    const activeBucketLeads = scopeLeads.filter(l => {
        const bucket = getBucket(l.originalStatus);
        const s = (l.originalStatus || '').toLowerCase().trim();
        return bucket === 'Active' && s !== 'offer sent';
    });
    const activeStale = activeBucketLeads.filter(l => l.diffDays > 7);
    const kpi5Pct = activeBucketLeads.length > 0 ? (activeStale.length / activeBucketLeads.length) : 0;
    const kpi5Deduction = kpi5Pct * 15; // Max 15 pts lost
    const kpi5Color = getStatus(kpi5Pct * 100, 40, 20);

    // --- FINAL SCORE CALCULATION ---
    // Start at 100, deduct based on failure rate
    const totalDeduction = kpi1Deduction + kpi2Deduction + kpi3Deduction + kpi4Deduction + kpi5Deduction;
    const finalScore = Math.max(0, Math.round(100 - totalDeduction));

    let overall: ColorStatus = 'Green';
    if (finalScore < 60) overall = 'Red';
    else if (finalScore < 85) overall = 'Orange';

    return {
        kpi1: { val: newOverdue.length, total: newLeads.length, pct: kpi1Pct * 100, deduction: kpi1Deduction, status: kpi1Color },
        kpi2: { val: nrOverdue.length, total: nrLeads.length, pct: kpi2Pct * 100, deduction: kpi2Deduction, status: kpi2Color },
        kpi3: { val: evalStuck.length, total: evalLeads.length, pct: kpi3Pct * 100, deduction: kpi3Deduction, status: kpi3Color },
        kpi4: { val: offerOverdue.length, total: offerLeads.length, pct: kpi4Pct * 100, deduction: kpi4Deduction, status: kpi4Color },
        kpi5: { val: activeStale.length, total: activeBucketLeads.length, pct: kpi5Pct * 100, deduction: kpi5Deduction, status: kpi5Color },
        overallColor: overall,
        score: finalScore
    };
};

const calculateClosingRate = (leads: Lead[]) => {
    const CLOSING_EXCLUDED_SET = new Set(['not interest / junk', 'rejected by doctor', "interested can't travel"]);
    let success = 0;
    let eligible = 0;
    leads.forEach(l => {
        const s = (l.originalStatus || '').trim().toLowerCase();
        if (CLOSING_EXCLUDED_SET.has(s)) return;
        eligible++;
        if (CLOSED_SUCCESS_SET.has(s)) success++;
    });
    return eligible > 0 ? (success / eligible) * 100 : 0;
};

export const DiagnosisView: React.FC<DiagnosisProps> = ({ leads, onActionClick }) => {
    const [expandedAction, setExpandedAction] = useState<string | null>(null);

    const relevantLeads = useMemo(() => {
        return leads.filter(l => !EXCLUDED_REPS.includes(l.repName));
    }, [leads]);

    const activeReps = useMemo(() => {
        return Array.from(new Set(relevantLeads.map(l => l.repName))).sort();
    }, [relevantLeads]);

    // 1. Calculate Aggregate Health (For "Volume of Issues" cards)
    const aggregateHealth = useMemo(() => calculateHealth(relevantLeads), [relevantLeads]);
    
    // 2. Calculate Individual Rep Scores
    const repSnapshot = useMemo(() => {
        return activeReps.map(repName => {
            const repLeads = relevantLeads.filter(l => l.repName === repName);
            const health = calculateHealth(repLeads);
            const closingRate = calculateClosingRate(repLeads);
            const activeLeads = repLeads.filter(l => getBucket(l.originalStatus) === 'Active');
            const avgDiff = activeLeads.length > 0 
                ? activeLeads.reduce((sum, l) => sum + l.diffDays, 0) / activeLeads.length 
                : 0;
            return {
                name: repName,
                healthScore: health.score,
                healthColor: health.overallColor,
                closingRate,
                activeCount: activeLeads.length,
                avgDiff,
                rawHealth: health 
            };
        }).sort((a, b) => b.healthScore - a.healthScore);
    }, [activeReps, relevantLeads]);

    // 3. Calculate "Fair" Team Score (Average of Rep Scores)
    const teamAverageScore = useMemo(() => {
        if (repSnapshot.length === 0) return 0;
        const sum = repSnapshot.reduce((acc, rep) => acc + rep.healthScore, 0);
        return Math.round(sum / repSnapshot.length);
    }, [repSnapshot]);

    const teamAverageColor: ColorStatus = teamAverageScore < 60 ? 'Red' : teamAverageScore < 85 ? 'Orange' : 'Green';

    // 4. Interested Leads Sequence Check Calculation
    const sequenceChecks = useMemo(() => {
        const rules = [
            { id: 'new', title: 'New Lead Stagnation', status: 'new lead', days: 1, desc: 'Untouched > 24h' },
            { id: 'photo', title: 'Waiting for Photo', status: 'waiting for photo', days: 7, desc: 'No reply > 7d' },
            { id: 'interest_ghost', title: 'Interested No Details', status: 'interested no details', days: 7, desc: 'Ghosted > 7d' },
            { id: 'eval_done', title: 'Evaluation Done', status: 'evaluation done', days: 2, desc: 'No Offer sent > 48h' },
            { id: 'wait_eval', title: 'Waiting Evaluation', status: 'waiting for evaluation', days: 1, desc: 'Medical Team delay > 24h' },
            { id: 'wait_ticket', title: 'Waiting Ticket', status: 'waiting for ticket', days: 30, desc: 'Commitment Stalled > 30d' },
        ];

        return rules.map(r => {
            const matches = relevantLeads.filter(l => 
                (l.originalStatus || '').toLowerCase().trim() === r.status &&
                l.diffDays > r.days
            );
            return { ...r, count: matches.length, leads: matches };
        });
    }, [relevantLeads]);

    // Treatment Specific Health (Kept as aggregate for now to identify systemic issues)
    const dentalHealth = useMemo(() => calculateHealth(relevantLeads.filter(l => l.treatment === 'Dental')), [relevantLeads]);
    const hairHealth = useMemo(() => calculateHealth(relevantLeads.filter(l => l.treatment === 'Hair')), [relevantLeads]);
    const otherHealth = useMemo(() => calculateHealth(relevantLeads.filter(l => l.treatment === 'Other')), [relevantLeads]);

    const reassignmentData = useMemo(() => {
        const pool = leads.filter(l => {
            const s = (l.originalStatus || '').toLowerCase().trim();
            const isNr5String = /^nr[\s-_]?5$/.test(s);
            const isNrProp = s.startsWith('nr') && l.nrCount === 5;
            return (isNr5String || isNrProp) && l.diffDays > 30;
        });
        const overdue = pool.filter(l => l.diffDays > 35);
        const byRep: Record<string, number> = {};
        pool.forEach(l => { byRep[l.repName] = (byRep[l.repName] || 0) + 1; });
        return { pool, overdue, byRep };
    }, [leads]);

    const getIndicator = (color: ColorStatus) => {
        switch (color) {
            case 'Red': return <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />;
            case 'Orange': return <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.6)]" />;
            case 'Green': return <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />;
        }
    };
    
    const getKpiBadLeads = (scopeLeads: Lead[], kpiId: number) => {
        const now = new Date();
        switch(kpiId) {
            case 1: return scopeLeads.filter(l => (l.originalStatus||'').toLowerCase() === 'new lead' && l.diffDays >= 1);
            case 2: return scopeLeads.filter(l => {
                    const s = (l.originalStatus||'').toLowerCase().trim();
                    if (!s.startsWith('nr')) return false;
                    const isNr5String = /^nr[\s-_]?5$/.test(s);
                    const isNr5Prop = l.nrCount === 5;
                    if (isNr5String || isNr5Prop) return false;
                    return l.diffDays > 7;
                });
            case 3: 
                const evalStatuses = new Set(['waiting for evaluation', 'evaluation done']);
                return scopeLeads.filter(l => evalStatuses.has((l.originalStatus||'').toLowerCase()) && l.diffDays > 1);
            case 4: 
                return scopeLeads.filter(l => {
                    if ((l.originalStatus||'').toLowerCase() !== 'offer sent') return false;
                    const ageTime = Math.abs(now.getTime() - new Date(l.createDate).getTime());
                    const ageDays = Math.ceil(ageTime / (1000 * 60 * 60 * 24));
                    let threshold = 30;
                    if (ageDays < 14) threshold = 7;
                    else if (ageDays < 30) threshold = 10;
                    else if (ageDays < 60) threshold = 20;
                    return l.diffDays > threshold;
                });
            case 5: 
                return scopeLeads.filter(l => {
                    const s = (l.originalStatus || '').toLowerCase().trim();
                    return getBucket(l.originalStatus) === 'Active' && s !== 'offer sent' && l.diffDays > 7;
                });
            default: return [];
        }
    };

    const handleKpiClick = (kpiId: number, name: string) => {
        const badLeads = getKpiBadLeads(relevantLeads, kpiId);
        onActionClick(badLeads, `Diagnosis: ${name} Issue`);
    };

    const handleQuickAction = (type: string) => {
        const now = new Date();
        let filtered: Lead[] = [];
        if (type === 'New Lead rule broken') {
            filtered = relevantLeads.filter(l => (l.originalStatus||'').toLowerCase() === 'new lead' && l.diffDays >= 1);
        } else if (type === 'NR > 7 days') {
            filtered = relevantLeads.filter(l => {
                const s = (l.originalStatus||'').toLowerCase().trim();
                if (!s.startsWith('nr')) return false;
                const isNr5String = /^nr[\s-_]?5$/.test(s);
                const isNr5Prop = l.nrCount === 5;
                if (isNr5String || isNr5Prop) return false;
                return l.diffDays > 7;
            });
        } else if (type === 'Stuck in evaluation') {
             filtered = relevantLeads.filter(l => ['waiting for evaluation', 'evaluation done'].includes((l.originalStatus||'').toLowerCase()) && l.diffDays > 1);
        } else if (type === 'Offers without follow-up') {
             filtered = relevantLeads.filter(l => {
                if ((l.originalStatus||'').toLowerCase() !== 'offer sent') return false;
                const ageTime = Math.abs(now.getTime() - new Date(l.createDate).getTime());
                const ageDays = Math.ceil(ageTime / (1000 * 60 * 60 * 24));
                let threshold = 30;
                if (ageDays < 14) threshold = 7;
                else if (ageDays < 30) threshold = 10;
                else if (ageDays < 60) threshold = 20;
                return l.diffDays > threshold;
            });
        } else if (type === 'Stale Active leads') {
             filtered = relevantLeads.filter(l => {
                 const s = (l.originalStatus || '').toLowerCase().trim();
                 return getBucket(l.originalStatus) === 'Active' && s !== 'offer sent' && l.diffDays > 7;
             });
        }
        onActionClick(filtered, type);
    };

    const handleTreatmentHealthClick = (health: ScopeHealth, name: string) => {
        const filtered = relevantLeads.filter(l => l.treatment === name);
        onActionClick(filtered, `Treatment Analysis: ${name}`);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            
            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-[#28BA9A] to-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200 dark:shadow-none">
                        <Brain size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Diagnosis Engine</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Weighted scoring (100pt base) averaging individual rep performance.</p>
                    </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm">
                    Analyzed: {relevantLeads.length} Leads
                </div>
            </div>

            {/* 2. HUD DASHBOARD */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* 2a. GLOBAL HEALTH HUD */}
                <div className={`xl:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden card-3d-hover transition-colors ${
                    teamAverageColor === 'Green' ? 'border-l-8 border-l-green-500 dark:border-l-green-600' : 
                    teamAverageColor === 'Orange' ? 'border-l-8 border-l-orange-400 dark:border-l-orange-500' : 
                    'border-l-8 border-l-red-500 dark:border-l-red-600'
                }`}>
                    <div className={`absolute -right-20 -top-20 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${
                        teamAverageColor === 'Green' ? 'bg-green-400 dark:bg-green-500/30' : 
                        teamAverageColor === 'Orange' ? 'bg-orange-400 dark:bg-orange-500/30' : 
                        'bg-red-500 dark:bg-red-500/30'
                    }`}></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <span className={`text-5xl font-black tracking-tighter drop-shadow-sm ${
                                    teamAverageColor === 'Green' ? 'text-green-600 dark:text-green-400' : 
                                    teamAverageColor === 'Orange' ? 'text-orange-500 dark:text-orange-400' : 
                                    'text-red-600 dark:text-red-400'
                                }`}>
                                    {teamAverageScore}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Team Health Score</span>
                                    <span className={`text-lg font-bold ${
                                        teamAverageColor === 'Green' ? 'text-green-600 dark:text-green-400' : 
                                        teamAverageColor === 'Orange' ? 'text-orange-500 dark:text-orange-400' : 
                                        'text-red-600 dark:text-red-400'
                                    }`}>
                                        {teamAverageColor.toUpperCase()} STATE
                                    </span>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium max-w-sm flex items-center gap-1">
                                <Info size={12}/> Average of individual rep scores. (Aggregate Score: {aggregateHealth.score})
                            </div>
                        </div>
                        
                        <div className="hidden md:block text-right">
                             <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Saturation</div>
                             <div className="text-2xl font-black text-slate-700 dark:text-slate-200">
                                 {((aggregateHealth.kpi5.total / (activeReps.length * MAX_RECOMMENDED_PER_REP)) * 100).toFixed(0)}%
                             </div>
                             <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 ml-auto overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full bg-slate-800 dark:bg-slate-400`}
                                    style={{width: `${Math.min((aggregateHealth.kpi5.total / (activeReps.length * MAX_RECOMMENDED_PER_REP)) * 100, 100)}%`}}
                                 ></div>
                             </div>
                        </div>
                    </div>

                    {/* 3D KPI BUTTONS - AGGREGATE VIEW */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
                        {[
                            { l: 'New Velocity', k: aggregateHealth.kpi1, id: 1, w: '30%' },
                            { l: 'NR Discipline', k: aggregateHealth.kpi2, id: 2, w: '15%' },
                            { l: 'Eval Process', k: aggregateHealth.kpi3, id: 3, w: '20%' },
                            { l: 'Offer Closing', k: aggregateHealth.kpi4, id: 4, w: '20%' },
                            { l: 'Active Hygiene', k: aggregateHealth.kpi5, id: 5, w: '15%' },
                        ].map((item, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleKpiClick(item.id, item.l)}
                                className="relative bg-white/60 dark:bg-slate-800 backdrop-blur rounded-2xl p-4 border border-white/50 dark:border-white/10 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl group text-left"
                            >
                                <div className="absolute top-2 right-2">
                                    {getIndicator(item.k.status)}
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">{item.l}</div>
                                <div className="text-2xl font-black text-slate-700 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {item.k.pct.toFixed(0)}%
                                </div>
                                <div className="text-[9px] text-slate-400 mt-1">
                                    Impact: {item.w}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2b. CHECKLIST CARD */}
                <div className="glass-panel rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none"></div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4 relative z-10">
                        <ListChecks size={20} className="text-blue-600 dark:text-blue-400"/>
                        Priority Actions
                    </h3>
                    <div className="space-y-3 relative z-10">
                        {aggregateHealth.kpi1.status === 'Red' && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl flex gap-3 items-start">
                                <AlertTriangle size={16} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0"/>
                                <span className="text-xs font-bold text-red-700 dark:text-red-200">Clear {aggregateHealth.kpi1.val} New Leads (Diff ≥ 1)</span>
                            </div>
                        )}
                        {aggregateHealth.kpi3.status === 'Red' && (
                             <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl flex gap-3 items-start">
                                <AlertTriangle size={16} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0"/>
                                <span className="text-xs font-bold text-red-700 dark:text-red-200">Unblock {aggregateHealth.kpi3.val} Evaluations</span>
                            </div>
                        )}
                        {aggregateHealth.kpi5.status === 'Red' && (
                             <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3 rounded-xl flex gap-3 items-start">
                                <AlertTriangle size={16} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0"/>
                                <span className="text-xs font-bold text-red-700 dark:text-red-200">Purge {aggregateHealth.kpi5.val} Stale Leads</span>
                            </div>
                        )}
                        {aggregateHealth.score > 80 && (
                            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm italic">
                                Everything looks good! Keep it up.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. INTERESTED LEADS SEQUENCE CHECK (NEW MODULE) */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Timer size={20} className="text-indigo-500" />
                    Interested Leads Sequence Check (TTL Monitor)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sequenceChecks.map((check, idx) => (
                        <button
                            key={idx}
                            onClick={() => onActionClick(check.leads, `Sequence Check: ${check.title}`)}
                            disabled={check.count === 0}
                            className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col gap-4 text-left group relative overflow-hidden ${
                                check.count > 0 
                                ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 hover:shadow-lg hover:border-orange-300' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 opacity-80'
                            }`}
                        >
                            <div className="flex justify-between items-start z-10 relative">
                                <div>
                                    <h4 className={`font-bold text-sm ${check.count > 0 ? 'text-orange-900 dark:text-orange-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {check.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{check.desc}</p>
                                </div>
                                <div className={`p-2 rounded-full ${check.count > 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-800 text-green-500'}`}>
                                    {check.count > 0 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                </div>
                            </div>
                            
                            <div className="z-10 relative">
                                {check.count > 0 ? (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-slate-800 dark:text-white">{check.count}</span>
                                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Stagnant</span>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1">
                                            All Clear
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Decorative BG element */}
                            {check.count > 0 && (
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. RULE BREACH COUNTERS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { l: 'New Lead rule broken', c: aggregateHealth.kpi1.val, s: aggregateHealth.kpi1.status },
                    { l: 'NR > 7 days', c: aggregateHealth.kpi2.val, s: aggregateHealth.kpi2.status },
                    { l: 'Stuck in evaluation', c: aggregateHealth.kpi3.val, s: aggregateHealth.kpi3.status },
                    { l: 'Offers without follow-up', c: aggregateHealth.kpi4.val, s: aggregateHealth.kpi4.status },
                    { l: 'Stale Active leads', c: aggregateHealth.kpi5.val, s: aggregateHealth.kpi5.status },
                ].map((item, i) => (
                    <button 
                        key={i}
                        onClick={() => handleQuickAction(item.l)}
                        className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg text-left ${
                            item.s === 'Red' ? 'bg-red-50/50 border-red-200 text-red-900 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-200' :
                            item.s === 'Orange' ? 'bg-orange-50/50 border-orange-200 text-orange-900 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-200' :
                            'bg-white/80 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}
                    >
                        <div className="text-[10px] font-bold uppercase opacity-60 mb-2">{item.l}</div>
                        <div className="text-3xl font-black">{item.c}</div>
                    </button>
                ))}
            </div>

            {/* 5. TREATMENT HEALTH SPLIT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { name: 'Dental', health: dentalHealth, icon: '🦷' },
                    { name: 'Hair', health: hairHealth, icon: '✂️' },
                    { name: 'Other', health: otherHealth, icon: '✨' }
                ].map((t) => (
                    <button
                        key={t.name}
                        onClick={() => handleTreatmentHealthClick(t.health, t.name)}
                        className={`glass-panel p-6 rounded-2xl border-t-4 shadow-lg hover:-translate-y-1 transition-all text-left group ${
                            t.health.overallColor === 'Green' ? 'border-t-green-500' :
                            t.health.overallColor === 'Orange' ? 'border-t-orange-500' : 'border-t-red-500'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{t.icon}</span>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.name}</h3>
                            </div>
                            {getIndicator(t.health.overallColor)}
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                             <span className={`text-4xl font-black ${
                                t.health.overallColor === 'Green' ? 'text-green-600 dark:text-green-400' : 
                                t.health.overallColor === 'Orange' ? 'text-orange-500 dark:text-orange-400' : 
                                'text-red-600 dark:text-red-400'
                            }`}>
                                {t.health.score}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">/ 100</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t.health.overallColor === 'Red' ? 'Requires immediate attention' : t.health.overallColor === 'Orange' ? 'Monitor closely' : 'Healthy performance'}
                        </p>
                    </button>
                ))}
            </div>

            {/* 6. REP SNAPSHOT TABLE */}
            <div className="glass-panel rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Users size={18} className="text-slate-500 dark:text-slate-400"/>
                        Rep Performance Matrix
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-xs uppercase text-slate-500 dark:text-slate-300 border-b border-slate-200/50 dark:border-slate-700">
                            <tr>
                                <th className="p-4 pl-6">Rep Name</th>
                                <th className="p-4 text-center">Health Score</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Closing Rate</th>
                                <th className="p-4 text-center">Active Leads</th>
                                <th className="p-4 text-center">Avg Inactive</th>
                                <th className="p-4 pr-6 w-1/3">Capacity ({MAX_RECOMMENDED_PER_REP})</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {repSnapshot.map(rep => {
                                const saturation = (rep.activeCount / MAX_RECOMMENDED_PER_REP) * 100;
                                return (
                                    <tr key={rep.name} className="hover:bg-blue-50/30 dark:hover:bg-blue-500/10 transition-colors group">
                                        <td className="p-4 pl-6 font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{rep.name}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg font-bold shadow-sm border ${
                                                rep.healthColor === 'Green' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30' :
                                                rep.healthColor === 'Orange' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30' :
                                                'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30'
                                            }`}>
                                                {rep.healthScore}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">
                                                {getIndicator(rep.healthColor)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                                            {rep.closingRate.toFixed(1)}%
                                        </td>
                                        <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">{rep.activeCount}</td>
                                        <td className="p-4 text-center">
                                            <span className={`font-bold ${rep.avgDiff > 7 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {rep.avgDiff.toFixed(1)}d
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className={`h-full rounded-full shadow-sm ${saturation > 100 ? 'bg-red-500' : saturation > 80 ? 'bg-orange-400' : 'bg-green-500'}`}
                                                        style={{width: `${Math.min(saturation, 100)}%`}}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-8">{saturation.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 7. ADMIN RE-ASSIGNMENT POOL */}
            <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <UserPlus size={24} />
                             </div>
                             <h3 className="text-xl font-bold text-white">Re-assignment Pool (Admin)</h3>
                        </div>
                        <p className="text-slate-400 text-sm max-w-xl">
                            Leads identified as "Ghosted" (NR5 status) that have been inactive for more than 30 days. 
                            These should be recycled to new agents or retargeting campaigns.
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                             <div className="text-xs font-bold text-slate-500 uppercase mb-1">Recyclable Leads</div>
                             <div className="text-4xl font-black text-white">{reassignmentData.pool.length}</div>
                        </div>
                        <button 
                            onClick={() => onActionClick(reassignmentData.pool, 'Re-assignment Pool (NR5 > 30d)')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/50 transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={18} />
                            View / Export List
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};