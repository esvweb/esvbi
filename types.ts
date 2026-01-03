
export enum FunnelStage {
  New = 'New',
  Interested = 'Interested',
  WaitingEval = 'Waiting Eval',
  OfferSent = 'Offer Sent',
  Success = 'Success'
}

export const STAGE_COLORS = {
  [FunnelStage.New]: 'bg-blue-500 text-blue-500',
  [FunnelStage.Interested]: 'bg-orange-500 text-orange-500',
  [FunnelStage.WaitingEval]: 'bg-green-500 text-green-500',
  [FunnelStage.OfferSent]: 'bg-rose-500 text-rose-500',
  [FunnelStage.Success]: 'bg-purple-600 text-purple-600',
};

export const STAGE_COLORS_HEX = {
  [FunnelStage.New]: '#3b82f6',
  [FunnelStage.Interested]: '#f97316',
  [FunnelStage.WaitingEval]: '#22c55e',
  [FunnelStage.OfferSent]: '#f43f5e',
  [FunnelStage.Success]: '#9333ea',
};

export interface Lead {
  id: string;
  customerName: string;
  email: string;
  createDate: Date;
  updateDate: Date;
  repName: string;
  country: string;
  language: string;
  treatment: 'Dental' | 'Hair' | 'Other';
  status: FunnelStage;
  originalStatus: string; // The raw status from CRM
  nrCount?: number; // Granular NR counter from CRM
  leadScore: number; // 0-10
  diffDays: number; // Days since last update
  revenue: number;
  source: string;
  campaign: string;
  // New Marketing Fields
  adset?: string;
  ad?: string;
}

// --- NEW MMS PATIENT INTERFACE (STRICT SPEC) ---
export interface Patient {
  mmsId: string; // Lead ID from MMS
  crmId?: string; // New: CRM ID for linking
  ticketDate: Date; // Date of Receiving Ticket

  // Patient Fields
  patientName: string;
  patientCountry: string;
  patientPhone: string;
  patientEmail: string;

  // Treatment Fields
  category: string;
  opType: string;
  opTechnique: string;
  operationCenter: string;
  doctor: string;
  repName?: string; // Added for Filtering

  // Status
  status: string; // Raw Status
  conversionOutcome: 'Completed' | 'Cancelled' | 'Postponed' | 'Planned'; // Normalized

  // Operational Dates
  arrivalAnchorDate: Date; // Priority Date
  operationDate?: Date;
  hotelEnterDate?: Date;
  hotelLeaveDate?: Date;
  airportPickupDate?: Date;

  // Financials
  expectedTotalRaw: number;
  expectedCurrency: string; // "Euro", "Pound", "USD"
  expectedTotalEur?: number; // Only if currency is Euro

  actualCollectedRaw: number; // Placeholder 1
  actualReceivedEur?: number; // Only if currency is Euro

  upsaleEur?: number; // Calculated if Euro

  notes: string;

  // Raw Data for drilldown
  raw: Record<string, any>;
}

export interface MarketingSpendRecord {
  campaignName: string;
  adsetName: string;
  adName: string;
  date: Date;
  spendTRY: number;
  impressions: number;
  results: number;
}

export interface FilterState {
  dateRange: 'month' | 'last_month' | '6m' | 'all_time' | 'custom';
  customDateStart?: string; // ISO date string YYYY-MM-DD
  customDateEnd?: string;   // ISO date string YYYY-MM-DD
  treatments: string[];
  countries: string[];
  reps: string[];
  languages: string[];
  sources: string[];
  teams: string[];
  // Marketing filters
  campaigns?: string[];
  adsets?: string[];
  ads?: string[];
  // MMS filters (Additive)
  mmsStatus?: string[];
  mmsDoctor?: string[];
  mmsCenter?: string[];
}

export interface FunnelMetrics {
  stage: FunnelStage;
  count: number;
  conversionRate: number; // Conversion from previous stage
}

export interface RepTargetData {
  ticketTarget: number;
  actualTickets: number;
  revenueTarget: number;
  actualRevenue: number;
}

// --- MANAGER DASHBOARD TYPES ---

export interface AdPerformance {
  id: string;
  source: string; // Google, Facebook, etc.
  campaign: string;
  status: 'Active' | 'Paused';
  spend: number;
  revenue: number;
  leads: number;
  sales: number;
  interestedLeads: number; // For interest rate
}

export interface SalesByCountry {
  country: string;
  flagCode: string; // e.g., 'us', 'gb'
  leads: number;
  interestedLeads: number;
  sales: number;
  revenue: number;
  avgTicket: number;
}

export interface LanguageMetric {
  language: string;
  leads: number;
  interestedLeads: number;
  sales: number;
  revenue: number;
}

export interface AgentPerformance {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'busy' | 'offline';
  leadsAssigned: number;
  interestedLeads: number;
  ticketTarget: number;
  ticketActual: number;
  revenueTarget: number;
  revenueActual: number;
}

export interface TeamData {
  id: string;
  name: string;
  leadsAssigned: number;
  interestedLeads: number;
  ticketTarget: number;
  ticketActual: number;
  revenueTarget: number;
  revenueActual: number;
}

export interface MonthlyPerformance {
  month: string; // "Jan 2024"
  operationType: 'Hair' | 'Dental';
  totalLeads: number;
  sales: number; // ticket count
  interestedLeads: number;
  adSpend: number;
  revenue: number;
  qualityScore: number; // 1-10 (IQS)
}
