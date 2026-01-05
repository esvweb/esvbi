import React, { useState } from 'react';
import { Megaphone, ArrowRight, Facebook, Instagram, Smartphone, Search } from 'lucide-react';

interface MarketingChannel {
    id: string;
    source: string;
    icon: any;
    iconColor: string;
    iconBg: string; // Tailwind class
    adSpend: number;
    revenue: number;
    roas: number;
    convRate: number;
}

const mockChannels: MarketingChannel[] = [
    {
        id: '1',
        source: 'Facebook',
        icon: Facebook,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-500', // Using solid bg with white icon for better match
        adSpend: 40100,
        revenue: 200000,
        roas: 5.0,
        convRate: 4.3
    },
    {
        id: '2',
        source: 'Instagram',
        icon: Instagram,
        iconColor: 'text-pink-600',
        iconBg: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500',
        adSpend: 32000,
        revenue: 165000,
        roas: 5.2,
        convRate: 4.9
    },
    {
        id: '3',
        source: 'Google Ads',
        icon: Search,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-400',
        adSpend: 48000,
        revenue: 260000,
        roas: 5.4,
        convRate: 9.8
    },
    {
        id: '4',
        source: 'TikTok',
        icon: Smartphone, // Using Smartphone as a proxy for TikTok icon which might not be in standard Lucide set or looks different.
        iconColor: 'text-black',
        iconBg: 'bg-black',
        adSpend: 15000,
        revenue: 50000,
        roas: 3.3,
        convRate: 2.1
    }
];

import { MarketingCampaignModal } from './MarketingCampaignModal';

export const MarketingIntelligence = () => {
    const [filter, setFilter] = useState<'All' | 'Hair' | 'Dental'>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);


    const formatCurrency = (val: number) => {
        return `€${val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/,/g, '.')}`;
    };

    // Note: The screenshot shows e.g. €40.100. The standard toLocaleString might use dots or commas depending on locale.
    // user requested specific format matching typical EU/TR formatting where dot is thousands separator.
    // Let's stick to a simple formatter to match the look: e.g. 40.100
    const formatNumber = (val: number) => {
        return `€${val.toLocaleString('de-DE')}`; // de-DE uses dots for thousands
    };

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-fade-in cursor-pointer hover:shadow-md transition-shadow"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-500">
                            <Megaphone size={20} />
                        </div>
                        Marketing Intelligence
                    </h3>

                    <div className="flex items-center gap-2">
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
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <div className="col-span-4 pl-2">Source</div>
                    <div className="col-span-2 text-right">Ad Spend</div>
                    <div className="col-span-2 text-right">Revenue</div>
                    <div className="col-span-2 text-right">ROAS</div>
                    <div className="col-span-2 text-right">Conv. Rate</div>
                </div>

                {/* Table Body */}
                <div className="space-y-3">
                    {mockChannels.map((channel) => (
                        <div
                            key={channel.id}
                            className="grid grid-cols-12 gap-4 items-center px-4 py-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                        >
                            {/* Source */}
                            <div className="col-span-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${channel.iconBg} flex items-center justify-center shadow-sm text-white`}>
                                    <channel.icon size={20} className={channel.source === 'Facebook' ? 'fill-current' : ''} />
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {channel.source}
                                </span>
                            </div>

                            {/* Ad Spend */}
                            <div className="col-span-2 text-right font-bold text-slate-500 dark:text-slate-400">
                                {formatNumber(channel.adSpend)}
                            </div>

                            {/* Revenue */}
                            <div className="col-span-2 text-right font-black text-slate-800 dark:text-white text-lg">
                                {formatNumber(channel.revenue)}
                            </div>

                            {/* ROAS */}
                            <div className="col-span-2 text-right font-bold text-emerald-500 text-lg">
                                {channel.roas.toFixed(1)}x
                            </div>

                            {/* Conv Rate */}
                            <div className="col-span-2 text-right font-bold text-slate-600 dark:text-slate-400">
                                {channel.convRate.toFixed(1)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <MarketingCampaignModal isOpen={isModalOpen} onClose={(e) => { e?.stopPropagation(); setIsModalOpen(false); }} />
        </>
    );
};
