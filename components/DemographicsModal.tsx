import React, { useState, useMemo } from 'react';
import { X, ArrowUpDown, ArrowUp, ArrowDown, Globe } from 'lucide-react';

interface DemographicsData {
    id: string;
    label: string;
    icon?: string;
    leads: number;
    interest: number;
    ticketValue: number;
    revenue: number;
    convRate: number;
}

interface DemographicsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: DemographicsData[];
    type: 'Country' | 'Language';
    treatment: 'All' | 'Hair' | 'Dental';
}

type SortField = 'label' | 'leads' | 'interest' | 'ticketValue' | 'revenue' | 'convRate';
type SortDirection = 'asc' | 'desc';

export const DemographicsModal: React.FC<DemographicsModalProps> = ({
    isOpen,
    onClose,
    data,
    type,
    treatment
}) => {
    const [sortField, setSortField] = useState<SortField>('revenue');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const multiplier = sortDirection === 'asc' ? 1 : -1;
            if (sortField === 'label') {
                return multiplier * a.label.localeCompare(b.label);
            }
            return multiplier * (a[sortField] - b[sortField]);
        });
    }, [data, sortField, sortDirection]);

    if (!isOpen) return null;

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown size={12} className="opacity-40" />;
        return sortDirection === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />;
    };

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
        return `€${(val / 1000).toFixed(1)}k`;
    };

    // Helper to format full numbers nicely like the screenshot (e.g., €1.820.000)
    const formatFullCurrency = (val: number) => {
        return `€${val.toLocaleString('de-DE')}`;
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-xl text-orange-500">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Demographics Breakdown</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Analysis by {type} • {treatment}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div
                        className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none"
                        onClick={() => handleSort('label')}
                    >
                        {type.toUpperCase()} {renderSortIcon('label')}
                    </div>
                    <div
                        className="col-span-2 text-right flex items-center justify-end gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none"
                        onClick={() => handleSort('leads')}
                    >
                        LEADS {renderSortIcon('leads')}
                    </div>
                    <div
                        className="col-span-2 text-right flex items-center justify-end gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none"
                        onClick={() => handleSort('interest')}
                    >
                        INTEREST % {renderSortIcon('interest')}
                    </div>
                    <div
                        className="col-span-2 text-right flex items-center justify-end gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none"
                        onClick={() => handleSort('ticketValue')}
                    >
                        TICKET AMOUNT {renderSortIcon('ticketValue')}
                    </div>
                    <div
                        className="col-span-2 text-right flex items-center justify-end gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none"
                        onClick={() => handleSort('revenue')}
                    >
                        REVENUE {renderSortIcon('revenue')}
                    </div>
                    <div
                        className="col-span-1 text-right flex items-center justify-end gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none"
                        onClick={() => handleSort('convRate')}
                    >
                        CONV. RATE {renderSortIcon('convRate')}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-4 custom-scrollbar bg-white dark:bg-slate-900">
                    <div className="space-y-1">
                        {sortedData.map((row) => (
                            <div
                                key={row.id}
                                className="grid grid-cols-12 gap-4 items-center px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                            >
                                {/* Country/Lang */}
                                <div className="col-span-3 flex items-center gap-3">
                                    {row.icon && <span className="text-xl shadow-sm rounded-sm overflow-hidden">{row.icon}</span>}
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                        {row.label}
                                    </span>
                                </div>

                                {/* Leads */}
                                <div className="col-span-2 text-right font-bold text-slate-700 dark:text-slate-300 text-sm">
                                    {row.leads}
                                </div>

                                {/* Interest */}
                                <div className="col-span-2 text-right font-bold text-slate-600 dark:text-slate-400 text-sm">
                                    {row.interest.toFixed(0)}%
                                </div>

                                {/* Ticket Value */}
                                <div className="col-span-2 text-right font-medium text-slate-500 dark:text-slate-400 text-sm tabular-nums">
                                    {formatFullCurrency(row.ticketValue)}
                                </div>

                                {/* Revenue */}
                                <div className="col-span-2 text-right font-black text-slate-800 dark:text-white text-base tabular-nums">
                                    {row.ticketValue > 1000000 ? formatCurrency(row.revenue) : formatFullCurrency(row.revenue)}
                                    {/* Using compact for very large to avoid wrapping, but mostly full */}
                                </div>

                                {/* Conv Rate */}
                                <div className={`col-span-1 text-right font-bold text-sm ${row.convRate >= 20 ? 'text-emerald-500' : row.convRate >= 15 ? 'text-blue-500' : 'text-slate-500'}`}>
                                    {row.convRate.toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
                    Showing {sortedData.length} records • Sorted by {sortField === 'ticketValue' ? 'Ticket Amount' : sortField.charAt(0).toUpperCase() + sortField.slice(1)} {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                </div>
            </div>
        </div>
    );
};
