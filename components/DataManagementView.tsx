
import React, { useState, useRef } from 'react';
import { Lead, FunnelStage, MarketingSpendRecord, Patient } from '../types';
import { Upload, FileSpreadsheet, RefreshCw, CheckCircle, AlertCircle, FileText, Table, Link, Check, Download, AlertTriangle, DollarSign, CalendarCheck } from 'lucide-react';
import { generateData, generateMMSData } from '../services/mockData';

interface DataManagementViewProps {
  onDataUpdate: (data: Lead[]) => void;
  onSpendUpdate: (data: MarketingSpendRecord[]) => void;
  onExchangeRateUpdate: (rate: number) => void;
  onMmsUpdate?: (data: Patient[]) => void; // New Prop
  currentCount: number;
  currentSpendCount: number;
  currentMmsCount?: number;
  exchangeRate: number;
}

// --- LOGIC HELPERS ---

// Map raw status to FunnelStage based on the prompt's grouping
const mapStatusToStage = (status: string): FunnelStage => {
    const s = (status || '').toLowerCase().trim();
    
    // Success: 'operation done', 'ticket received', 'pre-payment received', 'pre/payment received'
    if (['operation done', 'ticket received', 'pre-payment received', 'pre/payment received'].includes(s)) {
        return FunnelStage.Success;
    }
    // Offer Sent: 'offer sent'
    if (s === 'offer sent') return FunnelStage.OfferSent;
    
    // Waiting Eval: 'waiting for evaluation', 'evaluation done'
    if (s === 'waiting for evaluation' || s === 'evaluation done') return FunnelStage.WaitingEval;

    // Interested: 'interested no details', 'waiting for photo', 'waiting for ticket', 'planning', 'lost'
    if (['interested no details', 'waiting for photo', 'waiting for ticket', 'planning', 'lost'].includes(s)) {
        return FunnelStage.Interested;
    }

    return FunnelStage.New;
};

// 0-10 Score Mapping
const getScoreFromStatus = (status: string): number => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'operation done') return 10;
    if (['ticket received', 'pre-payment received', 'pre/payment received'].includes(s)) return 9;
    if (s === 'waiting for ticket') return 8;
    if (s === 'offer sent') return 7;
    if (s === 'evaluation done') return 6.5;
    if (s === 'waiting for evaluation') return 6;
    if (s === 'waiting for photo') return 5;
    if (s === 'interested no details') return 4;
    if (s === 'lost') return 4; // Updated score for Lost status
    if (s === 'block') return 3;
    if (['high price', 'rejected by doctor', "interested can't travel"].includes(s)) return 2;
    if (s.startsWith('nr')) return 1;
    // 0 for new lead, night shift, etc.
    return 0;
};

// Treatment Classifier
const getTreatmentFromChoice = (choice: string): 'Dental' | 'Hair' | 'Other' => {
    const c = (choice || '').toLowerCase();
    if (c.includes('dental') || c.includes('zircon') || c.includes('crown')) return 'Dental';
    if (c.includes('hair') || c.includes('fue') || c.includes('dhi')) return 'Hair';
    return 'Other';
};

// Date Parser (Handles Excel Serial or String)
const parseExcelDate = (val: any): Date | null => {
    if (!val) return null;
    if (typeof val === 'number') {
        // Excel serial date to JS Date
        return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    // Handle dd.mm.yyyy format common in some regions
    if (typeof val === 'string' && /^\d{2}\.\d{2}\.\d{4}/.test(val)) {
        const [d, m, y] = val.split('.').map(Number);
        return new Date(y, m - 1, d);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
};

export const DataManagementView: React.FC<DataManagementViewProps> = ({ 
    onDataUpdate, 
    onSpendUpdate,
    onExchangeRateUpdate,
    onMmsUpdate,
    currentCount, 
    currentSpendCount,
    currentMmsCount = 0,
    exchangeRate
}) => {
    const [activeSection, setActiveSection] = useState<'leads' | 'spend' | 'mms'>('leads');
    const [activeTab, setActiveTab] = useState<'file' | 'sheet'>('file');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStats, setUploadStats] = useState<{added: number, errors: number} | null>(null);
    const [missingCols, setMissingCols] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- LEADS PARSING ---
    const transformAndLoadData = (json: any[]) => {
        const now = new Date();
        const newLeads: Lead[] = json.map((row: any, index: number) => {
            const normRow: Record<string, any> = {};
            Object.keys(row).forEach(key => {
                normRow[key.toLowerCase().trim()] = row[key];
            });

            const id = normRow['id'] || `IMP-${Date.now()}-${index}`;
            const customerName = normRow['customer_name'] || 'Unknown';
            const email = normRow['customer_email'] || `user${index}@example.com`;
            const repName = normRow['assign_employee'] || 'Unassigned';
            const country = normRow['customer_country'] || 'Unknown';
            const language = normRow['customer_languages'] || 'English';
            const source = normRow['lead_source'] || 'Upload';
            const campaign = normRow['campaign_name'] || 'Unknown Campaign';
            const adset = normRow['adset_name'] || 'Unknown Adset';
            const ad = normRow['ad_name'] || 'Unknown Ad';
            const originalStatus = normRow['customer_statu'] || normRow['customer_status'] || 'New Lead';
            const status = mapStatusToStage(originalStatus);
            const leadScore = getScoreFromStatus(originalStatus);
            
            let nrCount = 0;
            const rawNr = normRow['nr_counter'];
            if (rawNr) {
                nrCount = parseInt(rawNr, 10) || 0;
            }

            let createDate = parseExcelDate(normRow['created_date']) || new Date();
            let updateDate = parseExcelDate(normRow['activities_date']) || createDate;
            const diffTime = Math.abs(now.getTime() - updateDate.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const treatmentRaw = normRow['custom_operation_choice'] || '';
            const treatment = getTreatmentFromChoice(treatmentRaw);

            return {
               id, customerName, email, createDate, updateDate, repName, country, language,
               treatment, status, originalStatus, nrCount, leadScore, diffDays,
               revenue: status === FunnelStage.Success ? 3500 : 0, 
               source, campaign, adset, ad
            };
        });
        
        onDataUpdate(newLeads);
        setUploadStats({ added: newLeads.length, errors: 0 });
    };

    // --- SPEND PARSING ---
    const transformAndLoadSpend = (json: any[]) => {
        const newRecords: MarketingSpendRecord[] = json.map((row: any) => {
            const normRow: Record<string, any> = {};
            Object.keys(row).forEach(key => {
                normRow[key.toLowerCase().trim()] = row[key];
            });

            const campaignName = normRow['campaign name'] || normRow['campaign_name'] || 'Unknown';
            const adsetName = normRow['ad set name'] || normRow['adset_name'] || 'Unknown';
            const adName = normRow['ad name'] || normRow['ad_name'] || 'Unknown';
            const date = parseExcelDate(normRow['day']) || new Date();
            
            const spendRaw = normRow['amount spent (try)'] || normRow['amount spent'] || 0;
            const spendTRY = typeof spendRaw === 'number' ? spendRaw : parseFloat(String(spendRaw).replace(/,/g, '')) || 0;
            
            const impressions = parseInt(normRow['impressions'] || '0');
            const results = parseInt(normRow['results'] || '0');

            return {
                campaignName,
                adsetName,
                adName,
                date,
                spendTRY,
                impressions,
                results
            };
        });

        onSpendUpdate(newRecords);
        setUploadStats({ added: newRecords.length, errors: 0 });
    };

    // --- MMS PARSING (NEW) ---
    const transformAndLoadMMS = (json: any[]) => {
        setMissingCols([]);
        // Required columns (Lowercase)
        const requiredCols = [
            'lead id', 'date of receiving ticket', 'name of the patient', 
            'category', 'status', 'total expected payment', 'currency of expected payment', 
            'operation center', 'operation date'
        ];
        
        // Check first row keys
        if (json.length > 0) {
            const keys = Object.keys(json[0]).map(k => k.toLowerCase().trim());
            const missing = requiredCols.filter(c => !keys.includes(c));
            if (missing.length > 0) {
                setMissingCols(missing);
                return;
            }
        }

        const patients: Patient[] = json.map((row: any) => {
            const normRow: Record<string, any> = {};
            Object.keys(row).forEach(key => {
                normRow[key.toLowerCase().trim()] = row[key];
            });

            // Fields mapping
            const mmsId = String(normRow['lead id'] || '');
            const crmId = String(normRow['crm id'] || ''); // New CRM ID Mapping
            
            const ticketDate = parseExcelDate(normRow['date of receiving ticket']) || new Date();
            
            const patientName = normRow['name of the patient'] || 'Unknown';
            const category = normRow['category'] || 'Other';
            const status = normRow['status'] || 'Planned';
            
            const opCenter = normRow['operation center'] || 'Unknown';
            const opDate = parseExcelDate(normRow['operation date']);
            const hotelDate = parseExcelDate(normRow['hotel enter date']);
            const leaveDate = parseExcelDate(normRow['hotel leave date']);
            const pickupDate = parseExcelDate(normRow['airport pickup date']);
            
            // Priority: Pickup > Hotel > Op > Ticket
            let arrivalAnchorDate = pickupDate || hotelDate || opDate || ticketDate;

            // Financials
            const expectedRaw = parseFloat(String(normRow['total expected payment'] || 0).replace(/[^0-9.-]+/g,"")) || 0;
            const currency = normRow['currency of expected payment'] || '';
            const isEuro = currency.toLowerCase().includes('euro') || currency === '€';
            
            const expectedEur = isEuro ? expectedRaw : undefined;
            
            // Placeholder 1 is Actual
            const actualRaw = parseFloat(String(normRow['placeholder 1'] || 0).replace(/[^0-9.-]+/g,"")) || 0;
            const actualEur = (isEuro && actualRaw) ? actualRaw : undefined;
            
            const upsale = (actualEur && expectedEur && actualEur > expectedEur) ? actualEur - expectedEur : 0;

            // Outcome Logic
            let outcome: 'Completed' | 'Cancelled' | 'Postponed' | 'Planned' = 'Planned';
            const sLower = status.toLowerCase();
            if (sLower.includes('completed')) outcome = 'Completed';
            else if (sLower.includes('cancel')) outcome = 'Cancelled';
            else if (sLower.includes('postpone')) outcome = 'Postponed';

            return {
                mmsId,
                crmId,
                ticketDate,
                patientName,
                patientCountry: normRow['country of patient'] || 'Unknown',
                patientPhone: String(normRow['phone number of patient'] || ''),
                patientEmail: normRow['placeholder 3'] || '',
                category,
                opType: normRow['type of operation'] || '',
                opTechnique: normRow['operation techniques'] || '',
                operationCenter: opCenter,
                doctor: normRow['doctor name'] || 'Unknown',
                status,
                conversionOutcome: outcome,
                arrivalAnchorDate,
                operationDate: opDate || undefined,
                hotelEnterDate: hotelDate || undefined,
                hotelLeaveDate: leaveDate || undefined,
                airportPickupDate: pickupDate || undefined,
                expectedTotalRaw: expectedRaw,
                expectedCurrency: currency,
                expectedTotalEur: expectedEur,
                actualCollectedRaw: actualRaw,
                actualReceivedEur: actualEur,
                upsaleEur: upsale,
                notes: normRow['details / notes'] || normRow['notes'] || '',
                raw: row
            };
        });

        if (onMmsUpdate) onMmsUpdate(patients);
        setUploadStats({ added: patients.length, errors: 0 });
    };

    const parseWorkbookData = (data: any, type: 'binary' | 'string') => {
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
            alert("Excel parser not loaded. Please refresh the page.");
            return;
        }
        try {
            const workbook = XLSX.read(data, { type });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            
            if (activeSection === 'leads') {
                transformAndLoadData(json);
            } else if (activeSection === 'spend') {
                transformAndLoadSpend(json);
            } else if (activeSection === 'mms') {
                transformAndLoadMMS(json);
            }
        } catch (error) {
            console.error("Parse error", error);
            alert("Error parsing file. Please check format.");
        }
    };

    // --- COMMON HANDLERS ---

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                parseWorkbookData(e.target.result, 'binary');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleReset = () => {
        if (activeSection === 'leads') {
            const data = generateData(1500);
            onDataUpdate(data);
        } else if (activeSection === 'spend') {
            onSpendUpdate([]);
        } else if (activeSection === 'mms' && onMmsUpdate) {
            const mmsData = generateMMSData(200);
            onMmsUpdate(mmsData);
        }
        setUploadStats(null);
        setMissingCols([]);
    };

    const referenceColumnsLeads = [
        { col: 'customer_statu', req: 'Required', desc: 'Patient status (e.g. "Offer Sent")' },
        { col: 'assign_employee', req: 'Required', desc: 'Sales Rep Name' },
        { col: 'created_date', req: 'Required', desc: 'Creation Date' },
        { col: 'campaign_name', req: 'Required', desc: 'Campaign Name (Matches Spend File)' },
        { col: 'adset_name', req: 'Required', desc: 'Ad Set Name' },
        { col: 'ad_name', req: 'Required', desc: 'Ad Name' },
    ];

    const referenceColumnsSpend = [
        { col: 'Campaign name', req: 'Required', desc: 'Must match CRM Data' },
        { col: 'Ad Set Name', req: 'Required', desc: 'Must match CRM Data' },
        { col: 'Ad name', req: 'Required', desc: 'Must match CRM Data' },
        { col: 'Day', req: 'Required', desc: 'Date of spend' },
        { col: 'Amount spent (TRY)', req: 'Required', desc: 'Cost in Lira' },
        { col: 'Results', req: 'Optional', desc: 'Platform conversions' },
    ];

    const referenceColumnsMMS = [
        { col: 'Lead ID', req: 'Required', desc: 'MMS ID' },
        { col: 'CRM ID', req: 'Optional', desc: 'CRM Link ID' },
        { col: 'Date of Receiving Ticket', req: 'Required', desc: 'Conversion Date' },
        { col: 'Name of the Patient', req: 'Required', desc: 'Patient Name' },
        { col: 'Category', req: 'Required', desc: 'Treatment Category' },
        { col: 'Status', req: 'Required', desc: 'Current Status' },
        { col: 'Total Expected Payment', req: 'Required', desc: 'Revenue Projection' },
        { col: 'Currency of Expected Payment', req: 'Required', desc: 'Euro/USD/Pound' },
        { col: 'Operation Center', req: 'Required', desc: 'Clinic Location' },
        { col: 'Operation Date', req: 'Required', desc: 'Procedure Date' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <FileSpreadsheet className="text-[#28BA9A]" />
                        Data Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Manage your multi-source database (CRM Leads, Meta Data, and MMS Reports).
                    </p>
                </div>
                
                {/* GLOBAL METRICS */}
                <div className="flex gap-6 text-right">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">CRM Database</p>
                        <p className="text-2xl font-black text-slate-700 dark:text-slate-200">{currentCount.toLocaleString()} Leads</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Meta Data</p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{currentSpendCount.toLocaleString()} Rows</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">MMS Patients</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{currentMmsCount.toLocaleString()} Rows</p>
                    </div>
                </div>
            </div>

            {/* UPLOAD TYPE TOGGLE */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                <button 
                    onClick={() => { setActiveSection('leads'); setUploadStats(null); setMissingCols([]); }}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === 'leads' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    1. Upload CRM Data
                </button>
                <button 
                    onClick={() => { setActiveSection('spend'); setUploadStats(null); setMissingCols([]); }}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === 'spend' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    2. Upload Meta Data
                </button>
                <button 
                    onClick={() => { setActiveSection('mms'); setUploadStats(null); setMissingCols([]); }}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === 'mms' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    3. Upload MMS Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Interaction Area */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Tabs (File vs Sheet) */}
                    <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => setActiveTab('file')}
                            className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 ${
                                activeTab === 'file' 
                                ? 'text-[#28BA9A] border-b-2 border-[#28BA9A]' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Upload size={16}/> File Upload ({activeSection === 'leads' ? 'CRM' : activeSection === 'spend' ? 'Meta' : 'MMS'})
                        </button>
                    </div>

                    {/* Content */}
                    <div className="min-h-[300px]">
                        {activeTab === 'file' ? (
                            <div 
                                className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all ${
                                    isDragging 
                                    ? 'border-[#28BA9A] bg-[#28BA9A]/5' 
                                    : 'border-slate-300 dark:border-slate-700 hover:border-[#28BA9A] dark:hover:border-[#28BA9A] bg-slate-50 dark:bg-slate-900'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                    {activeSection === 'leads' ? <FileText size={32} className="text-[#28BA9A]" /> : activeSection === 'spend' ? <DollarSign size={32} className="text-indigo-500" /> : <CalendarCheck size={32} className="text-emerald-500"/>}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                                    Drag & Drop your {activeSection === 'leads' ? 'CRM Data' : activeSection === 'spend' ? 'Meta Data' : 'MMS Database'} Excel file
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md">
                                    Supports .xlsx, .xls, .csv. Ensure column headers match the requirements.
                                </p>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileSelect}
                                />
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`px-6 py-3 text-white rounded-xl font-bold transition-all shadow-lg ${activeSection === 'leads' ? 'bg-[#28BA9A] hover:bg-emerald-600 shadow-emerald-200' : activeSection === 'spend' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                                    >
                                        Browse Files
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Missing Columns Error */}
                    {missingCols.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-6 rounded-2xl flex flex-col gap-2 animate-fade-in">
                            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 font-bold">
                                <AlertTriangle size={24} />
                                <h4>Validation Failed: Missing Columns</h4>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                The file could not be processed because the following required columns were not found:
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {missingCols.map(col => (
                                    <span key={col} className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded font-mono">
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status Feedback */}
                    {uploadStats && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-6 rounded-2xl flex items-center gap-4 animate-fade-in">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-600 dark:text-green-300">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-800 dark:text-green-200">Import Successful</h4>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Added {uploadStats.added} rows to the {activeSection} database. 
                                </p>
                            </div>
                            <button 
                                onClick={handleReset}
                                className="ml-auto px-4 py-2 bg-white dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-red-500"
                            >
                                Reset {activeSection}
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Settings for Spend */}
                    {activeSection === 'spend' && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                            <h4 className="font-bold text-indigo-800 dark:text-indigo-200 mb-4 flex items-center gap-2">
                                <DollarSign size={18} />
                                Currency Settings
                            </h4>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase">Exchange Rate (EUR to TRY)</label>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-indigo-200 dark:border-indigo-700">
                                    <span className="text-sm font-bold text-slate-500">1 € = </span>
                                    <input 
                                        type="number" 
                                        className="flex-1 bg-transparent outline-none font-bold text-slate-800 dark:text-white"
                                        value={exchangeRate}
                                        onChange={(e) => onExchangeRateUpdate(parseFloat(e.target.value) || 0)}
                                    />
                                    <span className="text-sm font-bold text-slate-500">TRY</span>
                                </div>
                                <p className="text-[10px] text-indigo-500 mt-1">Always use the monthly average exchange rate between TRY and €.</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Table size={18} className="text-blue-500" />
                            Required Columns ({activeSection === 'leads' ? 'CRM Data' : activeSection === 'spend' ? 'Meta Data' : 'MMS Data'})
                        </h4>
                        <div className="space-y-3">
                            {(activeSection === 'leads' ? referenceColumnsLeads : activeSection === 'spend' ? referenceColumnsSpend : referenceColumnsMMS).map((c, i) => (
                                <div key={i} className="flex justify-between items-start text-sm pb-2 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                                    <div>
                                        <div className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 rounded w-fit text-xs mb-0.5">
                                            {c.col}
                                        </div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500">{c.desc}</div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                        c.req === 'Required' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300' : 
                                        'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {c.req}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
