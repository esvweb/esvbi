import React, { useState, useMemo } from 'react';
import { Users, Briefcase, ArrowRight, X, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Lead } from '../types';
import { TEAMS } from '../services/mockData';

// --- TYPES ---

interface PerformanceData {
    id: string;
    name: string;
    team?: string; // Added Team field
    avatar?: string; // Optional, can use initials or mock image
    leads: number;
    interestRate: number;
    ticketSales: number;
    ticketTarget: number; // Mock target for progress bar
    revenue: number;
    revenueTarget: number; // Mock target for progress bar
}

interface PerformanceMonitorProps {
    leads: Lead[];
    userType: 'TEAM_LEADER' | 'MANAGER';
}

type ViewMode = 'Agents' | 'Teams';
type SortField = 'leads' | 'interestRate' | 'ticketSales' | 'revenue' | 'team' | 'name'; // Added team sort
type SortDirection = 'asc' | 'desc';

// --- HELPER FUNCTIONS ---

const formatCurrency = (value: number): string => {
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
    return `€${value.toFixed(0)}`;
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// --- MOCK TARGETS GENERATOR ---
const getTargets = (name: string, type: ViewMode) => {
    // Generate deterministic mock targets based on name length to keep it consistent but varied
    const seed = name.length;
    if (type === 'Agents') {
        return {
            ticket: 15 + (seed % 10), // Target between 15-25
            revenue: 100000 + (seed * 10000) // Target between 100k-200k
        };
    } else {
        return {
            ticket: 100 + (seed * 5), // Target 100-200
            revenue: 800000 + (seed * 50000) // Target 800k-1.5M
        };
    }
};

// --- COMPONENT ---

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ leads, userType }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('Agents');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month'); // Visual only for now

    // Sorting State
    const [sortField, setSortField] = useState<SortField>('ticketSales');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Team Filter State
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    // Helper: Map Rep to Team
    const repToTeam = useMemo(() => {
        const map: Record<string, string> = {};
        Object.entries(TEAMS).forEach(([teamName, members]) => {
            members.forEach(member => map[member] = teamName);
        });
        return map;
    }, []);

    const allTeamNames = useMemo(() => Object.keys(TEAMS), []);

    // Process Data
    const data = useMemo(() => {
        let processedData: PerformanceData[] = [];

        if (viewMode === 'Agents') {
            // Aggregate by Rep Name
            const repMap = new Map<string, PerformanceData>();

            leads.forEach(lead => {
                const rep = lead.repName || 'Unknown';
                if (!repMap.has(rep)) {
                    const targets = getTargets(rep, 'Agents');
                    repMap.set(rep, {
                        id: rep,
                        name: rep,
                        team: repToTeam[rep] || 'Unknown', // Assign Team
                        leads: 0,
                        interestRate: 0,
                        ticketSales: 0,
                        ticketTarget: targets.ticket,
                        revenue: 0,
                        revenueTarget: targets.revenue
                    });
                }

                const entry = repMap.get(rep)!;
                entry.leads++;

                // Interest Check (using simple logic matching ManagerOverview)
                // We don't store count directly in interface but need it for calc
                // Let's repurpose interestRate temporally or recalc at end

                // Simplified Logic to avoid complex re-implementation of isInterested/isSuccess
                // Assuming lead.status enum or originalStatus string
                const statusLower = lead.originalStatus.toLowerCase();
                const isSucc = ['operation done', 'ticket received', 'pre-payment received', 'pre/payment received'].some(s => statusLower.includes(s));

                if (isSucc) {
                    entry.ticketSales++;
                    entry.revenue += lead.revenue || 0;
                }
            });

            // Calculate Interest Rate (Need precise count)
            // Re-iterate to count interested correctly
            const interestCounts = new Map<string, number>();
            leads.forEach(lead => {
                const rep = lead.repName;
                const statusLower = lead.originalStatus.toLowerCase();
                // Match INTERESTED_STATUSES from ManagerOverview roughly
                const interestedKeywords = ['interested', 'waiting', 'evaluation', 'offer', 'planning', 'operation', 'ticket', 'payment'];
                const isInt = interestedKeywords.some(k => statusLower.includes(k)) && !statusLower.includes('not interest') && !statusLower.includes('lost');

                if (isInt) {
                    interestCounts.set(rep, (interestCounts.get(rep) || 0) + 1);
                }
            });

            processedData = Array.from(repMap.values()).map(d => ({
                ...d,
                interestRate: d.leads > 0 ? Math.round(((interestCounts.get(d.name) || 0) / d.leads) * 100) : 0
            }));

        } else {
            // Aggregate by Team
            processedData = allTeamNames.map(teamName => {
                const members = TEAMS[teamName] || [];
                const teamLeads = leads.filter(l => members.includes(l.repName));

                const targets = getTargets(teamName, 'Teams');

                let ticketSales = 0;
                let revenue = 0;
                let interestedCount = 0;

                teamLeads.forEach(lead => {
                    const statusLower = lead.originalStatus.toLowerCase();
                    const isSucc = ['operation done', 'ticket received', 'pre-payment received', 'pre/payment received'].some(s => statusLower.includes(s));

                    if (isSucc) {
                        ticketSales++;
                        revenue += (lead.revenue || 0);
                    }

                    const interestedKeywords = ['interested', 'waiting', 'evaluation', 'offer', 'planning', 'operation', 'ticket', 'payment'];
                    const isInt = interestedKeywords.some(k => statusLower.includes(k)) && !statusLower.includes('not interest') && !statusLower.includes('lost');
                    if (isInt) interestedCount++;
                });

                return {
                    id: teamName,
                    name: teamName,
                    leads: teamLeads.length,
                    interestRate: teamLeads.length > 0 ? Math.round((interestedCount / teamLeads.length) * 100) : 0,
                    ticketSales,
                    ticketTarget: targets.ticket,
                    revenue,
                    revenueTarget: targets.revenue
                };
            });
        }

        return processedData;
    }, [leads, viewMode, repToTeam, allTeamNames]);

    // Sorting & Filtering Helper
    const sortedData = useMemo(() => {
        let filtered = [...data];

        // Apply Team Filter (Only for Agents view and when filter is active)
        if (viewMode === 'Agents' && selectedTeams.length > 0) {
            filtered = filtered.filter(item => item.team && selectedTeams.includes(item.team));
        }

        return filtered.sort((a, b) => {
            // Handle undefined fields for safety
            const valA = a[sortField] ?? '';
            const valB = b[sortField] ?? '';

            if (sortField === 'team' || sortField === 'name') {
                // String comparison
                if (sortDirection === 'asc') return String(valA).localeCompare(String(valB));
                return String(valB).localeCompare(String(valA));
            }

            if (sortDirection === 'asc') return (valA as number) > (valB as number) ? 1 : -1;
            return (valA as number) < (valB as number) ? 1 : -1;
        });
    }, [data, sortField, sortDirection, selectedTeams, viewMode]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const toggleTeamFilter = (team: string) => {
        setSelectedTeams(prev => {
            // Validating user request: "show only that one", "don't keep old selected"
            // If we click the already selected one, we toggle it off (show all)
            if (prev.includes(team) && prev.length === 1) return [];
            return [team];
        });
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUp size={14} className="text-slate-900 dark:text-white" /> : <ArrowDown size={14} className="text-slate-900 dark:text-white" />;
    };

    const displayData = isModalOpen ? sortedData : sortedData.slice(0, 7);

    // --- RENDERERS ---

    const ProgressBar = ({ value, max, colorClass }: { value: number, max: number, colorClass: string }) => {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));
        return (
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClass} transition-all duration-500 rounded-full`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        );
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                        Performance Monitor
                    </h3>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* View Mode Toggle - Hidden for Team Leaders */}
                        {userType === 'MANAGER' && (
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('Agents')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'Agents'
                                        ? 'bg-white dark:bg-slate-800 text-teal-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    <Users size={14} />
                                    Agents
                                </button>
                                <button
                                    onClick={() => setViewMode('Teams')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'Teams'
                                        ? 'bg-white dark:bg-slate-800 text-teal-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    <Briefcase size={14} />
                                    Teams
                                </button>
                            </div>
                        )}

                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl ml-auto">
                            {(['today', 'week', 'month'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${period === p
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Header - Static with no sorting interaction for inline view */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-3 flex items-center gap-2">
                        {viewMode === 'Agents' ? 'AGENT' : 'TEAM'}
                    </div>
                    <div className="col-span-2 text-center">
                        LEADS
                    </div>
                    <div className="col-span-2 text-center">
                        INTEREST RATE
                    </div>
                    <div className="col-span-3 text-right">
                        TICKET SALES
                    </div>
                    <div className="col-span-2 text-right">
                        REVENUE
                    </div>
                </div>

                {/* Table Body */}
                <div className="space-y-2">
                    {displayData.map((item, idx) => (
                        <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors items-center group">
                            {/* Agent/Team Name */}
                            <div className="col-span-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-500 border-2 border-white dark:border-slate-800 shadow-sm relative shrink-0">
                                    {/* Online indicator mock */}
                                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${idx % 3 === 0 ? 'bg-emerald-500' : idx % 3 === 1 ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                                    {getInitials(item.name)}
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                            </div>

                            {/* Leads */}
                            <div className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-300">
                                {item.leads.toLocaleString()}
                            </div>

                            {/* Interest Rate */}
                            <div className="col-span-2 text-center font-black text-slate-800 dark:text-white">
                                {item.interestRate}%
                            </div>

                            {/* Ticket Sales */}
                            <div className="col-span-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-end items-end gap-1">
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(item.ticketSales * 500)}</span>
                                        <span className="text-xs font-bold text-slate-400">/ {formatCurrency(item.ticketTarget * 500)}</span>
                                    </div>
                                    <ProgressBar value={item.ticketSales * 500} max={item.ticketTarget * 500} colorClass="bg-emerald-500" />
                                </div>
                            </div>

                            {/* Revenue */}
                            <div className="col-span-2">
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-end items-end gap-1">
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(item.revenue)}</span>
                                        <span className="text-xs font-bold text-slate-400">/ {formatCurrency(item.revenueTarget)}</span>
                                    </div>
                                    <ProgressBar value={item.revenue} max={item.revenueTarget} colorClass="bg-emerald-500" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer - "Show More" functionality similar to Demographics */}
                {!isModalOpen && sortedData.length > 7 && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full mt-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                        View All {sortedData.length} {viewMode}
                        <ArrowRight size={14} />
                    </button>
                )}
            </div>

            {/* FULL LIST MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 z-10 gap-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Performance Monitor Breakdown</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        Detailed performance metrics for all {viewMode.toLowerCase()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            {/* TEAM FILTER (Only in Agents View and Manager Role) */}
                            {viewMode === 'Agents' && userType === 'MANAGER' && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                                        <Filter size={12} />
                                        Filter Teams:
                                    </div>
                                    <button
                                        onClick={() => setSelectedTeams([])}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${selectedTeams.length === 0
                                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {allTeamNames.map(team => (
                                        <button
                                            key={team}
                                            onClick={() => toggleTeamFilter(team)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${selectedTeams.includes(team)
                                                ? 'bg-indigo-500 text-white border-indigo-500'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                                                }`}
                                        >
                                            {team}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Header - Fixed Position outside scroll area */}
                        {/* Adjusted grid to 12 cols but with Team column for Agents view */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <div className={`${viewMode === 'Agents' ? 'col-span-3' : 'col-span-3'} cursor-pointer hover:text-slate-600 flex items-center gap-1`} onClick={() => handleSort('name')}>
                                {viewMode === 'Agents' ? 'AGENT' : 'TEAM'} <SortIcon field="name" />
                            </div>

                            {/* TEAM COLUMN (AGENTS ONLY) */}
                            {viewMode === 'Agents' && (
                                <div className="col-span-2 cursor-pointer hover:text-slate-600 flex items-center gap-1" onClick={() => handleSort('team')}>
                                    TEAM <SortIcon field="team" />
                                </div>
                            )}

                            <div className={`${viewMode === 'Agents' ? 'col-span-1' : 'col-span-2'} text-center cursor-pointer hover:text-slate-600 flex items-center justify-center gap-1`} onClick={() => handleSort('leads')}>
                                LEADS <SortIcon field="leads" />
                            </div>
                            <div className={`${viewMode === 'Agents' ? 'col-span-1' : 'col-span-2'} text-center cursor-pointer hover:text-slate-600 flex items-center justify-center gap-1`} onClick={() => handleSort('interestRate')}>
                                INT. <SortIcon field="interestRate" />
                            </div>
                            <div className="col-span-3 text-right cursor-pointer hover:text-slate-600 flex items-center justify-end gap-1" onClick={() => handleSort('ticketSales')}>
                                TICKET SALES <SortIcon field="ticketSales" />
                            </div>
                            <div className="col-span-2 text-right cursor-pointer hover:text-slate-600 flex items-center justify-end gap-1" onClick={() => handleSort('revenue')}>
                                REVENUE <SortIcon field="revenue" />
                            </div>
                        </div>

                        <div className="overflow-y-auto p-6 custom-scrollbar">
                            <div className="space-y-2">
                                {sortedData.map((item, idx) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors items-center border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                                        <div className={`${viewMode === 'Agents' ? 'col-span-3' : 'col-span-3'} flex items-center gap-3 overflow-hidden`}>
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                                                {getInitials(item.name)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                                        </div>

                                        {/* TEAM DATA (AGENTS ONLY) */}
                                        {viewMode === 'Agents' && (
                                            <div className="col-span-2 text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                                                {item.team}
                                            </div>
                                        )}

                                        <div className={`${viewMode === 'Agents' ? 'col-span-1' : 'col-span-2'} text-center font-bold text-slate-600 dark:text-slate-300`}>
                                            {item.leads.toLocaleString()}
                                        </div>
                                        <div className={`${viewMode === 'Agents' ? 'col-span-1' : 'col-span-2'} text-center font-black text-slate-800 dark:text-white`}>
                                            {item.interestRate}%
                                        </div>
                                        <div className="col-span-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-end items-end gap-1">
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(item.ticketSales * 500)}</span>
                                                    <span className="text-xs font-bold text-slate-400">/ {formatCurrency(item.ticketTarget * 500)}</span>
                                                </div>
                                                <ProgressBar value={item.ticketSales * 500} max={item.ticketTarget * 500} colorClass="bg-emerald-500" />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-end items-end gap-1">
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(item.revenue)}</span>
                                                    <span className="text-xs font-bold text-slate-400">/ {formatCurrency(item.revenueTarget)}</span>
                                                </div>
                                                <ProgressBar value={item.revenue} max={item.revenueTarget} colorClass="bg-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
