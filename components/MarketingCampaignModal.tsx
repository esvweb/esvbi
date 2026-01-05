import React, { useState } from 'react';
import { X, Search, TrendingUp, DollarSign, Target, Users } from 'lucide-react';

interface MarketingCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Campaign {
    id: string;
    name: string;
    platform: 'Facebook' | 'Instagram';
    status: 'ACTIVE' | 'PAUSED' | 'ENDED';
    spend: number;
    leads: number;
    cpl: number;
    interest: number;
    sales: number;
    revenue: number;
    roas: number;
}

const mockCampaigns: Campaign[] = [
    {
        id: '1',
        name: 'Summer Hair Transplant Promo',
        platform: 'Facebook',
        status: 'ACTIVE',
        spend: 12500,
        leads: 850,
        cpl: 14.7,
        interest: 48,
        sales: 45,
        revenue: 95000,
        roas: 7.6
    },
    {
        id: '2',
        name: 'Lookalike - Germany',
        platform: 'Facebook',
        status: 'ACTIVE',
        spend: 8200,
        leads: 420,
        cpl: 19.5,
        interest: 43,
        sales: 22,
        revenue: 45000,
        roas: 5.5
    },
    {
        id: '3',
        name: 'Retargeting - Site Visitors',
        platform: 'Facebook',
        status: 'ACTIVE',
        spend: 5400,
        leads: 310,
        cpl: 17.4,
        interest: 52,
        sales: 18,
        revenue: 38000,
        roas: 7.0
    },
    {
        id: '4',
        name: 'UK General Awareness',
        platform: 'Facebook',
        status: 'PAUSED',
        spend: 14000,
        leads: 600,
        cpl: 23.3,
        interest: 25,
        sales: 8,
        revenue: 22000,
        roas: 1.6
    },
    {
        id: '5',
        name: 'Influencer Reels - Aesthetic',
        platform: 'Instagram',
        status: 'ACTIVE',
        spend: 15000,
        leads: 700,
        cpl: 21.4,
        interest: 64,
        sales: 40,
        revenue: 85000,
        roas: 5.7
    },
    {
        id: '6',
        name: 'Before/After Carousel',
        platform: 'Instagram',
        status: 'ACTIVE',
        spend: 11000,
        leads: 520,
        cpl: 21.2,
        interest: 56,
        sales: 28,
        revenue: 62000,
        roas: 5.6
    },
    {
        id: '7',
        name: 'Story Ads - Flash Sale',
        platform: 'Instagram',
        status: 'ENDED',
        spend: 6000,
        leads: 350,
        cpl: 17.1,
        interest: 34,
        sales: 9,
        revenue: 18000,
        roas: 3.0
    }
];

export const MarketingCampaignModal: React.FC<MarketingCampaignModalProps> = ({ isOpen, onClose }) => {
    const [filter, setFilter] = useState<'All' | 'Hair' | 'Dental'>('All');

    if (!isOpen) return null;

    const formatCurrency = (val: number) => `€${val.toLocaleString('de-DE')}`;
    const formatStatus = (status: string) => {
        const styles = {
            ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            ENDED: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles[status as keyof typeof styles]}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Campaign Performance</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Breakdown by campaign, spending, and conversion metrics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                            {['All', 'Hair', 'Dental'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f
                                            ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    {[
                        { label: 'TOTAL AD SPEND', value: '€135k', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-100' },
                        { label: 'AVG COST PER LEAD', value: '€22.8', icon: Target, color: 'text-blue-500', bg: 'bg-blue-100' },
                        { label: 'INTERESTED LEAD RATE', value: '43%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-100' },
                        { label: 'GLOBAL ROAS', value: '5.0x', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100' }
                    ].map((metric, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm">
                            <div className={`w-10 h-10 rounded-lg ${metric.bg} dark:bg-opacity-20 flex items-center justify-center ${metric.color}`}>
                                <metric.icon size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{metric.label}</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white">{metric.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-6">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider pb-4 pl-4">Campaign</th>
                                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider pb-4">Status</th>
                                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider pb-4">Spend</th>
                                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider pb-4">Leads</th>
                                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider pb-4">CPL</th>
                                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider pb-4">Interest</th>
                                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider pb-4">Sales</th>
                                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider pb-4">Revenue</th>
                                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider pb-4 pr-4">ROAS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {mockCampaigns.map((camp) => (
                                <tr key={camp.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="py-4 pl-4">
                                        <p className="font-bold text-slate-800 dark:text-white">{camp.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{camp.platform}</p>
                                    </td>
                                    <td className="py-4">
                                        {formatStatus(camp.status)}
                                    </td>
                                    <td className="py-4 text-right font-medium text-slate-600 dark:text-slate-300">{formatCurrency(camp.spend)}</td>
                                    <td className="py-4 text-right font-bold text-slate-800 dark:text-white">{camp.leads}</td>
                                    <td className="py-4 text-right font-medium text-slate-600 dark:text-slate-300">€{camp.cpl}</td>
                                    <td className="py-4 text-right font-bold text-slate-800 dark:text-white">{camp.interest}%</td>
                                    <td className="py-4 text-right font-medium text-slate-600 dark:text-slate-300">{camp.sales}</td>
                                    <td className="py-4 text-right font-black text-slate-800 dark:text-white">{formatCurrency(camp.revenue)}</td>
                                    <td className={`py-4 pr-4 text-right font-bold ${camp.roas >= 5 ? 'text-emerald-500' : camp.roas >= 2 ? 'text-blue-500' : 'text-slate-400'}`}>
                                        {camp.roas.toFixed(1)}x
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
