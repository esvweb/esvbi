import React, { useState } from 'react';
import { Megaphone, ArrowRight, Facebook, Instagram, Smartphone, Search, Globe } from 'lucide-react';

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

// Mock Imports
import { DemographicsModal } from './DemographicsModal';

interface DemographicsData {
    id: string; // unique key (country name or language name)
    label: string;
    icon?: string; // flag for country
    leads: number;
    interest: number;
    ticketValue: number;
    revenue: number;
    convRate: number;
}

const mockCountries: DemographicsData[] = [
    { id: 'TR', label: 'Turkey', icon: '🇹🇷', leads: 2540, interest: 43, ticketValue: 1820000, revenue: 2600000, convRate: 20.4 },
    { id: 'DE', label: 'Germany', icon: '🇩🇪', leads: 1830, interest: 46, ticketValue: 892500, revenue: 1275000, convRate: 13.9 },
    { id: 'UK', label: 'United Kingdom', icon: '🇬🇧', leads: 1340, interest: 44, ticketValue: 735000, revenue: 1050000, convRate: 15.6 },
    { id: 'IT', label: 'Italy', icon: '🇮🇹', leads: 920, interest: 49, ticketValue: 525000, revenue: 750000, convRate: 16.3 },
    { id: 'ES', label: 'Spain', icon: '🇪🇸', leads: 560, interest: 58, ticketValue: 402500, revenue: 575000, convRate: 20.5 },
    { id: 'FR', label: 'France', icon: '🇫🇷', leads: 410, interest: 53, ticketValue: 280000, revenue: 400000, convRate: 19.5 },
    { id: 'US', label: 'USA', icon: '🇺🇸', leads: 380, interest: 50, ticketValue: 227500, revenue: 325000, convRate: 17.1 },
    { id: 'NL', label: 'Netherlands', icon: '🇳🇱', leads: 350, interest: 60, ticketValue: 297500, revenue: 425000, convRate: 24.2 },
    { id: 'CH', label: 'Switzerland', icon: '🇨🇭', leads: 290, interest: 48, ticketValue: 175000, revenue: 250000, convRate: 17.2 },
    { id: 'BE', label: 'Belgium', icon: '🇧🇪', leads: 275, interest: 49, ticketValue: 168000, revenue: 240000, convRate: 17.4 },
    { id: 'AT', label: 'Austria', icon: '🇦🇹', leads: 240, interest: 45, ticketValue: 133000, revenue: 190000, convRate: 15.8 },
    { id: 'SE', label: 'Sweden', icon: '🇸🇪', leads: 210, interest: 45, ticketValue: 112000, revenue: 160000, convRate: 15.2 },
];

const mockLanguages: DemographicsData[] = [
    { id: 'EN', label: 'English', leads: 3250, interest: 43, ticketValue: 1575000, revenue: 2250000, convRate: 13.8 },
    { id: 'TR', label: 'Turkish', leads: 2100, interest: 45, ticketValue: 1470000, revenue: 2100000, convRate: 20.0 },
    { id: 'DE', label: 'German', leads: 1200, interest: 50, ticketValue: 630000, revenue: 900000, convRate: 15.0 },
    { id: 'IT', label: 'Italian', leads: 850, interest: 49, ticketValue: 455000, revenue: 650000, convRate: 15.3 },
    { id: 'ES', label: 'Spanish', leads: 450, interest: 62, ticketValue: 315000, revenue: 450000, convRate: 20.0 },
    { id: 'FR', label: 'French', leads: 270, interest: 42, ticketValue: 157500, revenue: 225000, convRate: 16.7 },
];

import { MarketingCampaignModal } from './MarketingCampaignModal';

export const MarketingIntelligence = () => {
    const [filter, setFilter] = useState<'All' | 'Hair' | 'Dental'>('All');
    const [demoFilter, setDemoFilter] = useState<'Country' | 'Language'>('Country');
    const [demographicsTreatment, setDemographicsTreatment] = useState<'All' | 'Hair' | 'Dental'>('All'); // Separate state for demographics
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDemographicsModalOpen, setIsDemographicsModalOpen] = useState(false);

    // Apply scaling to simulate filtering
    const getFilteredData = (data: DemographicsData[], treatment: 'All' | 'Hair' | 'Dental') => {
        const scale = treatment === 'All' ? 1.0 : treatment === 'Hair' ? 0.6 : 0.4;
        return data.map(item => ({
            ...item,
            leads: Math.round(item.leads * scale),
            revenue: Math.round(item.revenue * scale),
            ticketValue: Math.round(item.ticketValue * scale),
            // Keep percentages roughly similar or adjust slightly for realism
            interest: item.interest + (treatment === 'Hair' ? 2 : -1),
            convRate: item.convRate + (treatment === 'Dental' ? 1.5 : -0.5)
        }));
    };

    const currentData = getFilteredData(demoFilter === 'Country' ? mockCountries : mockLanguages, demographicsTreatment);


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

            {/* DEMOGRAPHICS SECTION */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-fade-in mt-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h3
                        onClick={() => setIsDemographicsModalOpen(true)}
                        className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg text-orange-500">
                            <Globe size={20} />
                        </div>
                        Demographics
                    </h3>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mr-2">
                            {['Country', 'Language'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setDemoFilter(f as any)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${demoFilter === f
                                        ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                            {['All', 'Hair', 'Dental'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setDemographicsTreatment(f as any)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${demographicsTreatment === f
                                        ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsDemographicsModalOpen(true)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-colors ml-2"
                        >
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="col-span-3 pl-2">{demoFilter === 'Country' ? 'Country' : 'Language'}</div>
                    <div className="col-span-2 text-right">Leads</div>
                    <div className="col-span-2 text-right">Interest</div>
                    <div className="col-span-2 text-right">Ticket Value</div>
                    <div className="col-span-2 text-right">Revenue</div>
                    <div className="col-span-1 text-right">Conv.</div>
                </div>

                {/* Table Body */}
                <div className="space-y-1">
                    {currentData.slice(0, 5).map((row) => (
                        <div
                            key={row.id}
                            className="grid grid-cols-12 gap-4 items-center px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer rounded-lg group"
                        >
                            {/* Label (Country/Language) */}
                            <div className="col-span-3 flex items-center gap-3">
                                {row.icon && <span className="text-xl">{row.icon}</span>}
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                    {row.label}
                                </span>
                            </div>

                            {/* Leads */}
                            <div className="col-span-2 text-right font-bold text-slate-700 dark:text-slate-300 text-sm">
                                {row.leads}
                            </div>

                            {/* Interest */}
                            <div className="col-span-2 text-right font-bold text-slate-500 dark:text-slate-400 text-sm">
                                {row.interest.toFixed(0)}%
                            </div>

                            {/* Ticket Value */}
                            <div className="col-span-2 text-right font-bold text-slate-500 dark:text-slate-400 text-sm">
                                {window.innerWidth > 1400 ? `€${(row.ticketValue / 1000).toFixed(1)}k` : `€${(row.ticketValue / 1000).toFixed(0)}k`}
                            </div>

                            {/* Revenue */}
                            <div className="col-span-2 text-right font-black text-slate-800 dark:text-white text-sm">
                                €{(row.revenue / 1000).toFixed(1)}k
                            </div>

                            {/* Conv Rate */}
                            <div className="col-span-1 text-right font-bold text-emerald-500 text-sm">
                                {row.convRate.toFixed(1)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <DemographicsModal
                isOpen={isDemographicsModalOpen}
                onClose={() => setIsDemographicsModalOpen(false)}
                data={currentData}
                type={demoFilter}
                treatment={demographicsTreatment}
            />
        </>
    );
};

