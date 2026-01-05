import React, { useState, useMemo } from 'react';
import {
    Users, Target, Activity, DollarSign, TrendingUp, TrendingDown,
    ArrowUp, ArrowDown
} from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { Lead, Patient } from '../types';

// --- TYPES ---

type Period = 'today' | 'week' | 'month';
type TrendPeriod = 'week' | 'month' | 'quarter' | 'halfyear' | 'year';

interface TrendData {
    name: string;
    revenue: number;
    tickets: number;
    leads: Lead[];
}

interface ManagerOverviewProps {
    leads: Lead[];
    patients?: Patient[];
    onLeadListOpen: (leads: Lead[], title: string) => void;
}

// --- CONSTANTS ---

const INTERESTED_STATUSES = [
    'interested no details', 'waiting for photo',
    'waiting for evaluation', 'waiting for ticket',
    'evaluation done', 'offer sent', 'planning',
    'operation done', 'ticket received',
    'pre-payment received', 'pre/payment received', 'lost'
];

const SUCCESS_STATUSES = [
    'operation done', 'ticket received',
    'pre-payment received', 'pre/payment received'
];

// --- HELPER FUNCTIONS ---

const filterByPeriod = (data: Lead[], period: Period): Lead[] => {
    const now = new Date();
    return data.filter(lead => {
        const createDate = new Date(lead.createDate);
        if (period === 'today') {
            return createDate.toDateString() === now.toDateString();
        }
        if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createDate >= weekAgo && createDate <= now;
        }
        if (period === 'month') {
            return createDate.getMonth() === now.getMonth() &&
                createDate.getFullYear() === now.getFullYear();
        }
        return true;
    });
};

const getPreviousPeriod = (data: Lead[], period: Period): Lead[] => {
    const now = new Date();
    return data.filter(lead => {
        const createDate = new Date(lead.createDate);
        if (period === 'today') {
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            return createDate.toDateString() === yesterday.toDateString();
        }
        if (period === 'week') {
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createDate >= twoWeeksAgo && createDate < oneWeekAgo;
        }
        if (period === 'month') {
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            return createDate.getMonth() === lastMonth &&
                createDate.getFullYear() === lastMonthYear;
        }
        return false;
    });
};

const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(1)}k`;
    return `€${value.toFixed(0)}`;
};

const isInterested = (lead: Lead): boolean => {
    return INTERESTED_STATUSES.some(s => lead.originalStatus.toLowerCase().includes(s));
};

const isSuccess = (lead: Lead): boolean => {
    return SUCCESS_STATUSES.some(s => lead.originalStatus.toLowerCase().includes(s));
};

// --- COMPONENTS ---

const PeriodToggle = ({ period, setPeriod }: { period: Period, setPeriod: (p: Period) => void }) => (
    <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
        {(['today', 'week', 'month'] as Period[]).map(p => (
            <button
                key={p}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${period === p
                    ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                onClick={() => setPeriod(p)}
            >
                {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
        ))}
    </div>
);

const TreatmentBreakdown = ({
    label,
    count,
    percentage,
    change,
    color
}: {
    label: string,
    count: number,
    percentage: number,
    change: number,
    color: 'emerald' | 'blue'
}) => {
    const colorClasses = {
        emerald: {
            bg: 'bg-emerald-500',
            text: 'text-emerald-600',
            bgLight: 'bg-emerald-50 dark:bg-emerald-900/30'
        },
        blue: {
            bg: 'bg-blue-500',
            text: 'text-blue-600',
            bgLight: 'bg-blue-50 dark:bg-blue-900/30'
        }
    };

    const colors = colorClasses[color];

    return (
        <div className="mb-3 last:mb-0">
            <div className="flex items-center gap-3 mb-1.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-16">{label}</span>
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                </div>
                <span className={`text-xs font-semibold ${colors.text} ${colors.bgLight} px-2 py-0.5 rounded min-w-[60px] text-right`}>
                    {count.toLocaleString()}
                </span>
                <span className={`text-xs font-medium min-w-[50px] text-right ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                </span>
            </div>
        </div>
    );
};

const MetricCard = ({
    icon: Icon,
    title,
    value,
    change,
    period,
    setPeriod,
    hairCount,
    hairPercentage,
    hairChange,
    dentalCount,
    dentalPercentage,
    dentalChange,
    onClick,
    accentColor,
    subtitle
}: {
    icon: any,
    title: string,
    value: string | number,
    change: number,
    period: Period,
    setPeriod: (p: Period) => void,
    hairCount: number,
    hairPercentage: number,
    hairChange: number,
    dentalCount: number,
    dentalPercentage: number,
    dentalChange: number,
    onClick: () => void,
    accentColor: string,
    subtitle?: string
}) => (
    <div
        onClick={onClick}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 cursor-pointer hover:shadow-md transition-all duration-300 group"
    >
        <div className={`border-l-4 ${accentColor} pl-4`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                        <Icon size={14} className={accentColor.replace('border-', 'text-')} />
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-slate-800 dark:text-white">{value}</h3>
                        {subtitle && <span className="text-xs font-bold text-slate-400">{subtitle}</span>}
                    </div>
                    <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {Math.abs(change).toFixed(1)}% vs prev. period
                    </p>
                </div>
                <PeriodToggle period={period} setPeriod={setPeriod} />
            </div>

            {/* Treatment Breakdown */}
            <div className="mt-6">
                <TreatmentBreakdown
                    label="HAIR"
                    count={hairCount}
                    percentage={hairPercentage}
                    change={hairChange}
                    color="emerald"
                />
                <TreatmentBreakdown
                    label="DENTAL"
                    count={dentalCount}
                    percentage={dentalPercentage}
                    change={dentalChange}
                    color="blue"
                />
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="font-semibold text-slate-800 dark:text-white mb-2">{label}</p>
            {payload[0] && (
                <p className="text-emerald-600 font-medium text-sm">
                    Revenue: {formatCurrency(payload[0].value)}
                </p>
            )}
            {payload[1] && (
                <p className="text-blue-600 font-medium text-sm">
                    Tickets: {payload[1].value}
                </p>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

export const ManagerOverview: React.FC<ManagerOverviewProps> = ({ leads, patients, onLeadListOpen }) => {
    // State for each card's period
    const [totalLeadsPeriod, setTotalLeadsPeriod] = useState<Period>('month');
    const [interestedPeriod, setInterestedPeriod] = useState<Period>('month');
    const [ticketPeriod, setTicketPeriod] = useState<Period>('month');
    const [revenuePeriod, setRevenuePeriod] = useState<Period>('month');
    const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('month');

    // METRIC 1: TOTAL LEADS
    const totalLeadsMetrics = useMemo(() => {
        const currentLeads = filterByPeriod(leads, totalLeadsPeriod);
        const previousLeads = getPreviousPeriod(leads, totalLeadsPeriod);

        const total = currentLeads.length;
        const prevTotal = previousLeads.length;
        const change = calculateChange(total, prevTotal);

        const hairLeads = currentLeads.filter(l => l.treatment === 'Hair');
        const dentalLeads = currentLeads.filter(l => l.treatment === 'Dental');

        const prevHairLeads = previousLeads.filter(l => l.treatment === 'Hair');
        const prevDentalLeads = previousLeads.filter(l => l.treatment === 'Dental');

        const hairCount = hairLeads.length;
        const dentalCount = dentalLeads.length;
        const hairPercentage = total > 0 ? (hairCount / total) * 100 : 0;
        const dentalPercentage = total > 0 ? (dentalCount / total) * 100 : 0;

        const hairChange = calculateChange(hairCount, prevHairLeads.length);
        const dentalChange = calculateChange(dentalCount, prevDentalLeads.length);

        return {
            total,
            change,
            hairCount,
            hairPercentage,
            hairChange,
            dentalCount,
            dentalPercentage,
            dentalChange,
            leads: currentLeads
        };
    }, [leads, totalLeadsPeriod]);

    // METRIC 2: INTERESTED LEADS
    const interestedMetrics = useMemo(() => {
        const currentLeads = filterByPeriod(leads, interestedPeriod);
        const previousLeads = getPreviousPeriod(leads, interestedPeriod);

        const interestedLeads = currentLeads.filter(isInterested);
        const prevInterestedLeads = previousLeads.filter(isInterested);

        const total = currentLeads.length || 1;
        const prevTotal = previousLeads.length || 1;

        const interestRate = (interestedLeads.length / total) * 100;
        const prevInterestRate = (prevInterestedLeads.length / prevTotal) * 100;
        const change = interestRate - prevInterestRate;

        const hairLeads = currentLeads.filter(l => l.treatment === 'Hair');
        const dentalLeads = currentLeads.filter(l => l.treatment === 'Dental');

        const hairInterested = hairLeads.filter(isInterested).length;
        const dentalInterested = dentalLeads.filter(isInterested).length;

        const hairRate = hairLeads.length > 0 ? (hairInterested / hairLeads.length) * 100 : 0;
        const dentalRate = dentalLeads.length > 0 ? (dentalInterested / dentalLeads.length) * 100 : 0;

        const prevHairLeads = previousLeads.filter(l => l.treatment === 'Hair');
        const prevDentalLeads = previousLeads.filter(l => l.treatment === 'Dental');

        const prevHairInterested = prevHairLeads.filter(isInterested).length;
        const prevDentalInterested = prevDentalLeads.filter(isInterested).length;

        const prevHairRate = prevHairLeads.length > 0 ? (prevHairInterested / prevHairLeads.length) * 100 : 0;
        const prevDentalRate = prevDentalLeads.length > 0 ? (prevDentalInterested / prevDentalLeads.length) * 100 : 0;

        const hairChange = hairRate - prevHairRate;
        const dentalChange = dentalRate - prevDentalRate;

        return {
            interestRate: interestRate.toFixed(0),
            change,
            hairCount: hairInterested,
            hairPercentage: hairRate,
            hairChange,
            dentalCount: dentalInterested,
            dentalPercentage: dentalRate,
            dentalChange,
            leads: interestedLeads
        };
    }, [leads, interestedPeriod]);

    // METRIC 3: TICKET RECEIVED
    const ticketMetrics = useMemo(() => {
        const currentLeads = filterByPeriod(leads, ticketPeriod);
        const previousLeads = getPreviousPeriod(leads, ticketPeriod);

        const ticketLeads = currentLeads.filter(isSuccess);
        const prevTicketLeads = previousLeads.filter(isSuccess);

        const total = ticketLeads.length;
        const prevTotal = prevTicketLeads.length;
        const change = calculateChange(total, prevTotal);

        const hairTickets = ticketLeads.filter(l => l.treatment === 'Hair');
        const dentalTickets = ticketLeads.filter(l => l.treatment === 'Dental');

        const prevHairTickets = prevTicketLeads.filter(l => l.treatment === 'Hair');
        const prevDentalTickets = prevTicketLeads.filter(l => l.treatment === 'Dental');

        const hairCount = hairTickets.length;
        const dentalCount = dentalTickets.length;
        const hairPercentage = total > 0 ? (hairCount / total) * 100 : 0;
        const dentalPercentage = total > 0 ? (dentalCount / total) * 100 : 0;

        const hairChange = calculateChange(hairCount, prevHairTickets.length);
        const dentalChange = calculateChange(dentalCount, prevDentalTickets.length);

        return {
            total,
            change,
            hairCount,
            hairPercentage,
            hairChange,
            dentalCount,
            dentalPercentage,
            dentalChange,
            leads: ticketLeads
        };
    }, [leads, ticketPeriod]);

    // METRIC 4: TOTAL REVENUE
    const revenueMetrics = useMemo(() => {
        const currentLeads = filterByPeriod(leads, revenuePeriod);
        const previousLeads = getPreviousPeriod(leads, revenuePeriod);

        const revenue = currentLeads.reduce((sum, l) => sum + (l.revenue || 0), 0);
        const prevRevenue = previousLeads.reduce((sum, l) => sum + (l.revenue || 0), 0);
        const change = calculateChange(revenue, prevRevenue);

        const hairRevenue = currentLeads.filter(l => l.treatment === 'Hair').reduce((sum, l) => sum + (l.revenue || 0), 0);
        const dentalRevenue = currentLeads.filter(l => l.treatment === 'Dental').reduce((sum, l) => sum + (l.revenue || 0), 0);

        const prevHairRevenue = previousLeads.filter(l => l.treatment === 'Hair').reduce((sum, l) => sum + (l.revenue || 0), 0);
        const prevDentalRevenue = previousLeads.filter(l => l.treatment === 'Dental').reduce((sum, l) => sum + (l.revenue || 0), 0);

        const hairPercentage = revenue > 0 ? (hairRevenue / revenue) * 100 : 0;
        const dentalPercentage = revenue > 0 ? (dentalRevenue / revenue) * 100 : 0;

        const hairChange = calculateChange(hairRevenue, prevHairRevenue);
        const dentalChange = calculateChange(dentalRevenue, prevDentalRevenue);

        const ticketCount = currentLeads.filter(isSuccess).length;
        const avgTicket = ticketCount > 0 ? revenue / ticketCount : 0;

        return {
            revenue: formatCurrency(revenue),
            change,
            hairCount: hairRevenue,
            hairPercentage,
            hairChange,
            dentalCount: dentalRevenue,
            dentalPercentage,
            dentalChange,
            avgTicket: avgTicket.toFixed(0),
            leads: currentLeads.filter(l => l.revenue > 0)
        };
    }, [leads, revenuePeriod]);

    // PERFORMANCE TREND DATA
    const trendData = useMemo(() => {
        const calculateWeeklyData = (weeksCount: number): TrendData[] => {
            const weeks: TrendData[] = [];
            const now = new Date();

            for (let i = weeksCount - 1; i >= 0; i--) {
                const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
                const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

                const weekLeads = leads.filter(lead => {
                    const date = new Date(lead.createDate);
                    return date >= weekStart && date < weekEnd;
                });

                const revenue = weekLeads.reduce((sum, l) => sum + (l.revenue || 0), 0);
                const tickets = weekLeads.filter(isSuccess).length;

                weeks.push({
                    name: `Week ${weeksCount - i}`,
                    revenue,
                    tickets,
                    leads: weekLeads
                });
            }

            return weeks;
        };

        const calculateMonthlyData = (monthsCount: number): TrendData[] => {
            const months: TrendData[] = [];
            const now = new Date();

            for (let i = monthsCount - 1; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

                const monthLeads = leads.filter(lead => {
                    const date = new Date(lead.createDate);
                    return date >= monthStart && date <= monthEnd;
                });

                const revenue = monthLeads.reduce((sum, l) => sum + (l.revenue || 0), 0);
                const tickets = monthLeads.filter(isSuccess).length;

                const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });

                months.push({
                    name: monthName,
                    revenue,
                    tickets,
                    leads: monthLeads
                });
            }

            return months;
        };

        if (trendPeriod === 'week') return calculateWeeklyData(4);
        if (trendPeriod === 'month') return calculateMonthlyData(4);
        if (trendPeriod === 'quarter') return calculateMonthlyData(3);
        if (trendPeriod === 'halfyear') return calculateMonthlyData(6);
        if (trendPeriod === 'year') return calculateMonthlyData(12);

        return calculateMonthlyData(4);
    }, [leads, trendPeriod]);

    const handlePointClick = (data: any) => {
        if (data && data.payload) {
            const pointData = trendData.find(d => d.name === data.payload.name);
            if (pointData) {
                onLeadListOpen(pointData.leads, `${data.payload.name} Details`);
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* EXECUTIVE DASHBOARD - 4 METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* CARD 1: TOTAL LEADS */}
                <MetricCard
                    icon={Users}
                    title="TOTAL LEADS"
                    value={totalLeadsMetrics.total.toLocaleString()}
                    change={totalLeadsMetrics.change}
                    period={totalLeadsPeriod}
                    setPeriod={setTotalLeadsPeriod}
                    hairCount={totalLeadsMetrics.hairCount}
                    hairPercentage={totalLeadsMetrics.hairPercentage}
                    hairChange={totalLeadsMetrics.hairChange}
                    dentalCount={totalLeadsMetrics.dentalCount}
                    dentalPercentage={totalLeadsMetrics.dentalPercentage}
                    dentalChange={totalLeadsMetrics.dentalChange}
                    onClick={() => onLeadListOpen(totalLeadsMetrics.leads, `Total Leads - ${totalLeadsPeriod.charAt(0).toUpperCase() + totalLeadsPeriod.slice(1)}`)}
                    accentColor="border-emerald-500"
                />

                {/* CARD 2: INTERESTED LEADS */}
                <MetricCard
                    icon={Target}
                    title="INTERESTED LEADS"
                    value={`${interestedMetrics.interestRate}%`}
                    subtitle="Interest Rate"
                    change={interestedMetrics.change}
                    period={interestedPeriod}
                    setPeriod={setInterestedPeriod}
                    hairCount={interestedMetrics.hairCount}
                    hairPercentage={interestedMetrics.hairPercentage}
                    hairChange={interestedMetrics.hairChange}
                    dentalCount={interestedMetrics.dentalCount}
                    dentalPercentage={interestedMetrics.dentalPercentage}
                    dentalChange={interestedMetrics.dentalChange}
                    onClick={() => onLeadListOpen(interestedMetrics.leads, `Interested Leads - ${interestedPeriod.charAt(0).toUpperCase() + interestedPeriod.slice(1)}`)}
                    accentColor="border-blue-500"
                />

                {/* CARD 3: TICKET RECEIVED */}
                <MetricCard
                    icon={Activity}
                    title="TICKET RECEIVED"
                    value={ticketMetrics.total.toLocaleString()}
                    change={ticketMetrics.change}
                    period={ticketPeriod}
                    setPeriod={setTicketPeriod}
                    hairCount={ticketMetrics.hairCount}
                    hairPercentage={ticketMetrics.hairPercentage}
                    hairChange={ticketMetrics.hairChange}
                    dentalCount={ticketMetrics.dentalCount}
                    dentalPercentage={ticketMetrics.dentalPercentage}
                    dentalChange={ticketMetrics.dentalChange}
                    onClick={() => onLeadListOpen(ticketMetrics.leads, `Ticket Received - ${ticketPeriod.charAt(0).toUpperCase() + ticketPeriod.slice(1)}`)}
                    accentColor="border-purple-500"
                />

                {/* CARD 4: TOTAL REVENUE */}
                <MetricCard
                    icon={DollarSign}
                    title="TOTAL REVENUE"
                    value={revenueMetrics.revenue}
                    change={revenueMetrics.change}
                    period={revenuePeriod}
                    setPeriod={setRevenuePeriod}
                    hairCount={revenueMetrics.hairCount}
                    hairPercentage={revenueMetrics.hairPercentage}
                    hairChange={revenueMetrics.hairChange}
                    dentalCount={revenueMetrics.dentalCount}
                    dentalPercentage={revenueMetrics.dentalPercentage}
                    dentalChange={revenueMetrics.dentalChange}
                    onClick={() => onLeadListOpen(revenueMetrics.leads, `Revenue Leads - ${revenuePeriod.charAt(0).toUpperCase() + revenuePeriod.slice(1)}`)}
                    accentColor="border-emerald-600"
                    subtitle={`Avg: €${revenueMetrics.avgTicket}`}
                />
            </div>

            {/* PERFORMANCE TREND CHART */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-500" />
                            Performance Trend
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Revenue & Tickets Over Time</p>
                    </div>
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        {(['week', 'month', 'quarter', 'halfyear', 'year'] as TrendPeriod[]).map(p => (
                            <button
                                key={p}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${trendPeriod === p
                                    ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                onClick={() => setTrendPeriod(p)}
                            >
                                {p === 'halfyear' ? 'Half Year' : p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#10b981', fontWeight: 600 }}
                                tickFormatter={(value) => formatCurrency(value)}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#3b82f6', fontWeight: 600 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="line"
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                                activeDot={{
                                    r: 7,
                                    fill: '#10b981',
                                    stroke: '#fff',
                                    strokeWidth: 2,
                                    onClick: handlePointClick,
                                    cursor: 'pointer'
                                }}
                                name="Revenue (€)"
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="tickets"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                activeDot={{
                                    r: 7,
                                    fill: '#3b82f6',
                                    stroke: '#fff',
                                    strokeWidth: 2,
                                    onClick: handlePointClick,
                                    cursor: 'pointer'
                                }}
                                name="Tickets"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
