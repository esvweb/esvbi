
import { Lead, FunnelStage, FilterState, Patient } from '../types';

// --- TEAM STRUCTURE ---
export const TEAMS: Record<string, string[]> = {
    'Alex Traon': ['Alex Traon', 'Dina Brusca', 'Angie Moreau', 'Luna Maidi'],
    'Enzo Hamadouche': ['Enzo Hamadouche', 'Nadia Belova', 'Olivia Campbell', 'Emma Harris', 'Oliver Sahar', 'Josh Foster', 'Nadine Crose', 'Anastasia Wells', 'Mirella Spencer', 'Liam Grant'],
    'Giovanni Severini': ['Giovanni Severini', 'Roberto Arslan'],
    'Mazen Hourania': ['Mazen Hourania', 'Chris Taylor', 'Maria Hayes', 'Laura Hansen', 'Hali Quinn', 'Jessica Weber', 'David Jones', 'Jane Carter', 'Kate Adams'],
    'John Michelle': ['John Michelle', 'Leo Stone', 'Jim Hopper', 'Emily Mitchell'],
    'Robert Wood': ['Robert Wood', 'Ekaterina Valkova', 'Cole Whitman', 'Bobby Thomson', 'Lisa Shaw', 'Nikolay Mironov', 'Alisa Smirnova', 'Alexandra Petrova'],
    'Selman Esen': ['Selman Esen', 'Parisa Balaei']
};

export const ALL_REPS = Object.values(TEAMS).flat();

const COUNTRIES = ['UK', 'USA', 'Germany', 'France', 'Australia', 'Canada'];
const LANGUAGES = ['English', 'German', 'French', 'Spanish', 'Italian'];
const TREATMENTS = ['Dental', 'Hair', 'Other'] as const;
const SOURCES = ['Google Ads', 'Facebook', 'Instagram', 'Referral', 'Organic'];

// Mock Marketing Structure
const CAMPAIGNS_STRUCT = [
    { name: 'EU_Hair_Conversion_Q3', adsets: ['DE_Lookalike_1%', 'FR_Interest_Baldness', 'UK_Broad_Male'], ads: ['Video_Testimonial_John', 'Static_BeforeAfter_1', 'Carousel_Clinic_Tour'] },
    { name: 'US_Dental_Leads_AlwaysOn', adsets: ['US_States_High_Income', 'US_Retargeting_Web_30d'], ads: ['Offer_Free_Consult', 'Video_Doctor_Intro', 'Static_Smile_Grid'] },
    { name: 'Global_Brand_Awareness', adsets: ['Worldwide_Top_Cities'], ads: ['Brand_Story_Video_Long'] },
    { name: 'UK_Hair_Promo_October', adsets: ['UK_Lookalike_Customers', 'UK_Interest_HairTransplant'], ads: ['Promo_Discount_Urgency', 'Static_Result_Closeup'] }
];

const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Emma', 'Robert', 'Olivia', 'William', 'Ava', 'Joseph', 'Isabella', 'Thomas', 'Sophia', 'Charles', 'Mia', 'Daniel', 'Charlotte'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// --- EXPORTED STATUS SETS FOR APP LOGIC ---
export const STATUS_OPEN = ['New Lead', 'NR', 'NR0', 'NR1', 'NR2', 'NR3', 'NR4', 'NR5'];
export const STATUS_CLOSED_SUCCESS = ['Operation Done', 'Ticket Received', 'Pre-Payment Received', 'Pre/Payment Received'];

// REMOVED 'Lost' from LOST set
export const STATUS_LOST = ['Not Interest / Junk', 'High Price', 'Wrong Number', 'Block', 'Other Languages', 'Night Shift', 'Rejected by Doctor', "Interested Can't Travel"];

// ADDED 'Lost' to ACTIVE set
export const STATUS_ACTIVE = ['Lost', 'Interested No Details', 'Waiting For Photo', 'Waiting For Evaluation', 'Waiting For Ticket', 'Evaluation Done', 'Offer Sent', 'Planning'];

// Funnel Sets (Lowercased for matching)
export const INTERESTED_SET = new Set([
    "Lost", "Interested No Details", "Offer Sent", 
    "Pre-Payment Received", "Pre/Payment Received", 
    "Ticket Received", "Waiting For Evaluation", "Waiting For Photo", 
    "Waiting For Ticket", "Evaluation Done", "Operation Done", "Planning"
].map(s => s.toLowerCase()));

export const WAITING_EVAL_SET = new Set([
    "Waiting For Evaluation", "Evaluation Done", "Offer Sent", 
    "Pre-Payment Received", "Pre/Payment Received", "Ticket Received", 
    "Operation Done", "Planning"
].map(s => s.toLowerCase()));

export const OFFER_SENT_SET = new Set([
    "Offer Sent", "Pre-Payment Received", "Pre/Payment Received", 
    "Ticket Received", "Operation Done", "Planning"
].map(s => s.toLowerCase()));

export const SUCCESS_SET = new Set([
    "Operation Done", "Ticket Received", 
    "Pre-Payment Received", "Pre/Payment Received"
].map(s => s.toLowerCase()));

// REMOVED 'lost' from NEGATIVE_LOST_SET
export const NEGATIVE_LOST_SET = new Set([
    "Not Interest / Junk", "High Price", "Wrong Number", 
    "Block", "Other Languages", "Night Shift", "Rejected by Doctor",
    "Interested Can't Travel"
].map(s => s.toLowerCase()));

// --- STRICT PIPELINE HEALTH LOGIC ---
export type PipelineBucket = 'Open' | 'Active' | 'Closed – Success' | 'Negative/Lost';

export const getPipelineBucket = (status: string): PipelineBucket => {
    const s = (status || '').trim();
    const sLower = s.toLowerCase();
    const sUpper = s.toUpperCase();

    // 1. OPEN (Strict: New Lead OR Starts with NR)
    if (sLower === 'new lead' || sUpper.startsWith('NR')) {
        return 'Open';
    }

    // 2. CLOSED - SUCCESS
    const strictSuccess = new Set([
        "operation done", "ticket received", 
        "pre-payment received", "pre/payment received"
    ]);
    if (strictSuccess.has(sLower)) return 'Closed – Success';

    // 3. NEGATIVE/LOST - Removed 'lost'
    const strictNegative = new Set([
        "not interest / junk", "high price", "wrong number", 
        "block", "other languages", "night shift", "rejected by doctor",
        "interested can't travel"
    ]);
    if (strictNegative.has(sLower)) return 'Negative/Lost';

    // 4. ACTIVE (Fallback for everything else, including 'Lost' now)
    return 'Active';
};

export const generateData = (count: number = 1500): Lead[] => {
  const leads: Lead[] = [];
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(now.getMonth() - 6); // Extended for 6m data

  for (let i = 0; i < count; i++) {
    const createDate = getRandomDate(threeMonthsAgo, now);
    const updateDate = new Date(createDate.getTime() + Math.random() * (1000 * 60 * 60 * 24 * 30)); 
    // Ensure updateDate is not in the future for logic consistency
    const safeUpdateDate = updateDate > now ? now : updateDate;
    
    // Weighted Status Generation to simulate a funnel
    const rand = Math.random();
    let status = FunnelStage.New;
    let originalStatus = 'New Lead';

    if (rand > 0.3) {
        status = FunnelStage.Interested; // Maps to Active generally
    }
    if (rand > 0.6) {
        status = FunnelStage.WaitingEval; // Maps to Active
    }
    if (rand > 0.8) {
        status = FunnelStage.OfferSent; // Maps to Active
    }
    if (rand > 0.92) {
        status = FunnelStage.Success; // Maps to Closed-Success
    }

    // Assign specific string status based on the high level funnel stage
    if (status === FunnelStage.New) {
        // Mix of Open and Lost
        if (Math.random() > 0.7) {
             originalStatus = STATUS_LOST[Math.floor(Math.random() * STATUS_LOST.length)];
        } else {
             originalStatus = STATUS_OPEN[Math.floor(Math.random() * STATUS_OPEN.length)];
        }
    } else if (status === FunnelStage.Success) {
        originalStatus = STATUS_CLOSED_SUCCESS[Math.floor(Math.random() * STATUS_CLOSED_SUCCESS.length)];
    } else {
        if (Math.random() > 0.85) {
             // Some active leads might be 'Lost' (now treated as active/interested)
             if (Math.random() > 0.5) originalStatus = 'Lost';
             else originalStatus = STATUS_LOST[Math.floor(Math.random() * STATUS_LOST.length)];
        } else {
             originalStatus = STATUS_ACTIVE[Math.floor(Math.random() * STATUS_ACTIVE.length)];
        }
    }

    // Determine NR Count for Mock Data
    let nrCount = 0;
    if (originalStatus.toUpperCase().startsWith('NR')) {
        const match = originalStatus.match(/\d+/);
        nrCount = match ? parseInt(match[0], 10) : 1;
    }

    // Correlations: Higher lead score = higher chance of success
    let score = Math.floor(Math.random() * 11);
    
    // Specific Scoring Adjustments
    if (originalStatus.toLowerCase() === 'lost') {
        score = 4;
    } else if (status === FunnelStage.Success) {
        score = Math.min(10, score + 2); // Boost score for successes
    }

    // Calculate Days since Last Update (Last Activity)
    const diffTime = Math.abs(now.getTime() - safeUpdateDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Revenue simulation
    const revenue = status === FunnelStage.Success ? Math.floor(Math.random() * 5000) + 2000 : 0;

    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    // Marketing Attribution
    const campaignObj = CAMPAIGNS_STRUCT[Math.floor(Math.random() * CAMPAIGNS_STRUCT.length)];
    const adset = campaignObj.adsets[Math.floor(Math.random() * campaignObj.adsets.length)];
    const ad = campaignObj.ads[Math.floor(Math.random() * campaignObj.ads.length)];

    leads.push({
      id: `LD-${10000 + i}`,
      customerName: `${firstName} ${lastName}`,
      email,
      createDate,
      updateDate: safeUpdateDate,
      repName: ALL_REPS[Math.floor(Math.random() * ALL_REPS.length)],
      country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
      language: LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)],
      treatment: TREATMENTS[Math.floor(Math.random() * TREATMENTS.length)],
      status,
      originalStatus,
      nrCount,
      leadScore: score,
      diffDays: diffDays, 
      revenue,
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      campaign: campaignObj.name,
      adset: adset,
      ad: ad
    });
  }
  return leads.sort((a, b) => b.createDate.getTime() - a.createDate.getTime());
};

// --- MMS MOCK DATA GENERATION ---
export const generateMMSData = (count: number = 200): Patient[] => {
    const patients: Patient[] = [];
    const now = new Date();
    
    const DOCTORS = ['Dr. Smith', 'Dr. Oz', 'Dr. House', 'Dr. Strange'];
    const CENTERS = ['Istanbul Clinic A', 'Antalya Med Resort', 'Izmir Hair Center'];
    const PROCEDURES = ['FUE Hair Transplant', 'Zirconia Crown', 'Gastric Sleeve'];

    for(let i=0; i<count; i++) {
        // Arrival date scatter around now (-30 days to +60 days)
        const arrivalDate = new Date(now.getTime() + (Math.random() * 90 - 30) * 24 * 60 * 60 * 1000); 
        const opDate = new Date(arrivalDate.getTime() + 24*60*60*1000); 
        const leaveDate = new Date(arrivalDate.getTime() + 5*24*60*60*1000);
        
        const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        
        // Status logic
        let rawStatus = 'Planned';
        let outcome: 'Completed' | 'Cancelled' | 'Postponed' | 'Planned' = 'Planned';
        
        const rand = Math.random();
        
        // Past dates usually completed or cancelled
        if (arrivalDate < now) {
            if (rand > 0.1) { rawStatus = 'Completed'; outcome = 'Completed'; }
            else if (rand > 0.05) { rawStatus = 'Cancelled'; outcome = 'Cancelled'; }
            else { rawStatus = 'Postponed'; outcome = 'Postponed'; }
        } else {
            // Future dates usually planned
            if (rand > 0.95) { rawStatus = 'Cancelled'; outcome = 'Cancelled'; }
            else if (rand > 0.9) { rawStatus = 'Postponed'; outcome = 'Postponed'; }
        }

        const expected = Math.floor(Math.random() * 4000) + 2000;
        const currency = Math.random() > 0.2 ? 'Euro' : (Math.random() > 0.5 ? 'Pound' : 'USD');
        
        // Financials
        const isEur = currency === 'Euro';
        const expectedEur = isEur ? expected : undefined;
        
        let actual = 0;
        let actualEur: number | undefined = undefined;
        
        if (outcome === 'Completed' || (outcome === 'Planned' && Math.random() > 0.7)) {
            actual = expected + (Math.random() > 0.8 ? 500 : 0); // Occasional upsale
            if (isEur) actualEur = actual;
        }

        // Random Rep Assignment for Filters
        const repName = ALL_REPS[Math.floor(Math.random() * ALL_REPS.length)];

        // Generate a random CRM ID that corresponds to a likely lead ID from generateData
        // generateData produces LD-10000 to LD-11499 (for 1500 count).
        // Let's pick random ID in that range.
        const crmId = `LD-${10000 + Math.floor(Math.random() * 1000)}`;

        patients.push({
            mmsId: `MMS-${5000+i}`,
            crmId: crmId, // Add Linked ID
            ticketDate: new Date(arrivalDate.getTime() - 14*24*60*60*1000),
            patientName: `${firstName} ${lastName}`,
            patientCountry: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
            patientPhone: `+1555${Math.floor(Math.random()*10000)}`,
            patientEmail: 'user@example.com',
            category: TREATMENTS[Math.floor(Math.random() * TREATMENTS.length)],
            opType: 'Operation',
            opTechnique: PROCEDURES[Math.floor(Math.random() * PROCEDURES.length)],
            operationCenter: CENTERS[Math.floor(Math.random() * CENTERS.length)],
            doctor: DOCTORS[Math.floor(Math.random() * DOCTORS.length)],
            repName: repName, 
            status: rawStatus,
            conversionOutcome: outcome,
            arrivalAnchorDate: arrivalDate,
            operationDate: opDate,
            hotelEnterDate: arrivalDate,
            hotelLeaveDate: leaveDate,
            airportPickupDate: arrivalDate,
            expectedTotalRaw: expected,
            expectedCurrency: currency,
            expectedTotalEur: expectedEur,
            actualCollectedRaw: actual,
            actualReceivedEur: actualEur,
            upsaleEur: (actualEur && expectedEur && actualEur > expectedEur) ? actualEur - expectedEur : 0,
            notes: 'Mock data generated.',
            raw: {}
        });
    }
    return patients.sort((a,b) => b.arrivalAnchorDate.getTime() - a.arrivalAnchorDate.getTime());
};

export const filterLeads = (leads: Lead[], filters: FilterState): Lead[] => {
    const now = new Date();
    
    // Initialize cutoffs as null (meaning no filter applied)
    let startCutoff: Date | null = null;
    let endCutoff: Date | null = null;

    if (filters.dateRange === 'custom') {
        // Robust manual parsing to avoid timezone issues with input type="date"
        if (filters.customDateStart) {
            const parts = filters.customDateStart.split('-').map(Number);
            // new Date(year, monthIndex, day) -> Local Time 00:00:00
            if (parts.length === 3) {
                startCutoff = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
            }
        }
        if (filters.customDateEnd) {
             const parts = filters.customDateEnd.split('-').map(Number);
             // new Date(year, monthIndex, day) -> Local Time 23:59:59
             if (parts.length === 3) {
                endCutoff = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
             }
        }
    } else {
        // Preset Ranges
        if (filters.dateRange === 'month') {
            // First day of current month 00:00
            startCutoff = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            // Last day of current month 23:59
            endCutoff = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (filters.dateRange === 'last_month') {
            // First day of previous month
            startCutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            // Last day of previous month
            endCutoff = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (filters.dateRange === '6m') {
            // 6 months ago to end of today
            startCutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0, 0);
            endCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
    }

    return leads.filter(l => {
        // Ensure date object
        const leadDate = new Date(l.createDate);
        if (isNaN(leadDate.getTime())) return false;

        if (startCutoff && leadDate < startCutoff) return false;
        if (endCutoff && leadDate > endCutoff) return false;

        // Team Filter Logic (NEW)
        if (filters.teams && filters.teams.length > 0) {
            const allowedReps = new Set<string>();
            filters.teams.forEach(teamName => {
                const members = TEAMS[teamName] || [];
                members.forEach(m => allowedReps.add(m));
            });
            // If lead's rep is not in the allowed list for the selected teams, exclude it
            if (!allowedReps.has(l.repName)) return false;
        }

        if (filters.treatments.length > 0 && !filters.treatments.includes(l.treatment)) return false;
        if (filters.countries.length > 0 && !filters.countries.includes(l.country)) return false;
        if (filters.reps.length > 0 && !filters.reps.includes(l.repName)) return false;
        if (filters.languages?.length > 0 && !filters.languages.includes(l.language)) return false;
        if (filters.sources?.length > 0 && !filters.sources.includes(l.source)) return false;
        
        // NEW Marketing Filters
        if (filters.campaigns && filters.campaigns.length > 0 && !filters.campaigns.includes(l.campaign)) return false;
        if (filters.adsets && filters.adsets.length > 0 && !filters.adsets.includes(l.adset || '')) return false;
        if (filters.ads && filters.ads.length > 0 && !filters.ads.includes(l.ad || '')) return false;

        return true;
    });
};

export const calculateFunnelStats = (leads: Lead[]) => {
    // Initialize counts
    const counts: Record<string, number> = {
        'New': 0,
        'Interested': 0,
        'WaitingEval': 0,
        'OfferSent': 0,
        'Success': 0,
        'Negative': 0
    };

    leads.forEach(l => {
        const s = (l.originalStatus || '').trim().toLowerCase();

        // 1. NEW - Count of ALL leads in scope
        counts['New']++;

        // 2. ≥INTERESTED
        if (INTERESTED_SET.has(s)) {
            counts['Interested']++;
        }

        // 3. ≥WAITING EVAL
        if (WAITING_EVAL_SET.has(s)) {
            counts['WaitingEval']++;
        }

        // 4. ≥OFFER SENT
        if (OFFER_SENT_SET.has(s)) {
            counts['OfferSent']++;
        }

        // 5. SUCCESS
        if (SUCCESS_SET.has(s)) {
            counts['Success']++;
        }

        // 6. NEGATIVE/LOST - Outcome branch
        if (NEGATIVE_LOST_SET.has(s)) {
            counts['Negative']++;
        }
    });

    return counts;
};
