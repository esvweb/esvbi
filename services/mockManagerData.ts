import {
    AdPerformance, SalesByCountry, LanguageMetric, AgentPerformance, TeamData, MonthlyPerformance
} from '../types';

export const generateAdPerformance = (): AdPerformance[] => {
    const sources = ['Google', 'Facebook', 'Instagram', 'TikTok', 'Bing'];
    const campaigns = ['Hair_Transplant_UK', 'Dental_Implants_US', 'Smile_Makeover_EU', 'General_Brand_Awareness'];
    const data: AdPerformance[] = [];

    for (let i = 0; i < 20; i++) {
        const src = sources[Math.floor(Math.random() * sources.length)];
        const cmp = campaigns[Math.floor(Math.random() * campaigns.length)];
        const spend = Math.floor(Math.random() * 5000) + 500;
        const leads = Math.floor(spend / (Math.random() * 20 + 10)); // CPL 10-30
        const sales = Math.floor(leads * (Math.random() * 0.1)); // 0-10% conv

        data.push({
            id: `ad-${i}`,
            source: src,
            campaign: `${cmp}_${src}_${i}`,
            status: Math.random() > 0.2 ? 'Active' : 'Paused',
            spend,
            revenue: sales * (Math.random() * 3000 + 2000), // Ticket 2000-5000
            leads,
            sales,
            interestedLeads: Math.floor(leads * (Math.random() * 0.4 + 0.1)) // 10-50% interest
        });
    }
    return data;
};

export const generateGeographicData = (): { countryData: SalesByCountry[], languageData: LanguageMetric[] } => {
    const countries = [
        { c: 'United Kingdom', f: 'gb' }, { c: 'USA', f: 'us' }, { c: 'Germany', f: 'de' },
        { c: 'France', f: 'fr' }, { c: 'Italy', f: 'it' }, { c: 'Spain', f: 'es' }
    ];

    const countryData = countries.map(ct => {
        const leads = Math.floor(Math.random() * 500) + 50;
        const sales = Math.floor(leads * 0.05);
        return {
            country: ct.c,
            flagCode: ct.f,
            leads,
            interestedLeads: Math.floor(leads * 0.3),
            sales,
            revenue: sales * 3500,
            avgTicket: 3500
        };
    });

    const languages = ['English', 'German', 'French', 'Italian', 'Spanish', 'Turkish'];
    const languageData = languages.map(l => {
        const leads = Math.floor(Math.random() * 600) + 40;
        const sales = Math.floor(leads * 0.04);
        return {
            language: l,
            leads,
            interestedLeads: Math.floor(leads * 0.35),
            sales,
            revenue: sales * 3200
        };
    });

    return { countryData, languageData };
};

export const generateTeamPerformance = (): { agents: AgentPerformance[], teams: TeamData[] } => {
    const agentsList = ['Sarah Connor', 'John Wick', 'Ellen Ripley', 'James Bond', 'Marty McFly', 'Tony Stark'];

    const agents = agentsList.map((name, idx) => ({
        id: `ag-${idx}`,
        name,
        avatar: `https://i.pravatar.cc/150?u=${name.replace(' ', '')}`,
        status: Math.random() > 0.3 ? 'online' : (Math.random() > 0.5 ? 'busy' : 'offline') as any,
        leadsAssigned: Math.floor(Math.random() * 100) + 20,
        interestedLeads: Math.floor(Math.random() * 30) + 5,
        ticketTarget: 10,
        ticketActual: Math.floor(Math.random() * 12),
        revenueTarget: 50000,
        revenueActual: Math.floor(Math.random() * 60000)
    }));

    const teams = [
        { name: 'Alpha Squad', id: 't1' },
        { name: 'Beta Team', id: 't2' },
        { name: 'Charlie Unit', id: 't3' }
    ].map(t => ({
        ...t,
        leadsAssigned: Math.floor(Math.random() * 300) + 100,
        interestedLeads: Math.floor(Math.random() * 100) + 20,
        ticketTarget: 30,
        ticketActual: Math.floor(Math.random() * 35),
        revenueTarget: 150000,
        revenueActual: Math.floor(Math.random() * 180000)
    }));

    return { agents, teams };
};

export const generateMonthlyBreakdown = (): MonthlyPerformance[] => {
    const months = ['Jan 2025', 'Dec 2024', 'Nov 2024', 'Oct 2024', 'Sep 2024', 'Aug 2024'];
    const data: MonthlyPerformance[] = [];

    months.forEach(m => {
        ['Hair', 'Dental'].forEach(op => {
            const leads = Math.floor(Math.random() * 200) + 100;
            const sales = Math.floor(leads * 0.08);
            data.push({
                month: m,
                operationType: op as any,
                totalLeads: leads,
                sales,
                interestedLeads: Math.floor(leads * 0.4),
                adSpend: Math.floor(Math.random() * 5000) + 3000,
                revenue: sales * 3000,
                qualityScore: Number((Math.random() * 5 + 4).toFixed(1)) // 4.0 - 9.0
            });
        });
    });
    return data;
};
