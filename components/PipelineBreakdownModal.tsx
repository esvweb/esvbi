import React, { useMemo } from 'react';
import { Lead } from '../types';
import { X, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, LabelList } from 'recharts';

interface PipelineBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    bucketName: string;
    leads: Lead[];
    onStatusSelect: (leads: Lead[], title: string) => void;
}

export const PipelineBreakdownModal: React.FC<PipelineBreakdownModalProps> = ({ 
    isOpen, onClose, bucketName, leads, onStatusSelect 
}) => {
    
    const data = useMemo(() => {
        const counts: Record<string, Lead[]> = {};
        leads.forEach(l => {
            let s = l.originalStatus || 'Unknown';
            // Enhance NR breakdown: if status is generic "NR" but has specific counter, use it
            if (s.trim().toUpperCase() === 'NR' && typeof l.nrCount === 'number') {
                s = `NR${l.nrCount}`;
            }

            if (!counts[s]) counts[s] = [];
            counts[s].push(l);
        });
        
        let items = Object.entries(counts)
            .map(([status, list]) => ({
                status,
                count: list.length,
                leads: list,
                label: `${list.length}`
            }));

        if (bucketName === 'Open') {
            // Specific sorting for Open bucket: New Lead -> NR -> NR0 -> NR1 -> ... -> NR5
            items.sort((a, b) => {
                const getPriority = (str: string) => {
                    const s = str.toLowerCase().trim();
                    if (s === 'new lead') return 0;
                    if (s === 'nr') return 1;
                    if (s === 'nr0') return 2;
                    if (s === 'nr1') return 3;
                    if (s === 'nr2') return 4;
                    if (s === 'nr3') return 5;
                    if (s === 'nr4') return 6;
                    if (s === 'nr5') return 7;
                    
                    // Fallback for higher NRs or anomalies in Open bucket
                    if (s.startsWith('nr')) {
                        const match = s.match(/\d+/);
                        return match ? 10 + parseInt(match[0]) : 99;
                    }
                    return 100;
                };
                
                const pA = getPriority(a.status);
                const pB = getPriority(b.status);
                
                if (pA !== pB) return pA - pB;
                
                // Secondary sort by count if priority is same (unlikely for exact matches)
                return b.count - a.count;
            });
        } else {
            // Default sort by count descending for other buckets
            items.sort((a, b) => b.count - a.count);
        }

        return items;
    }, [leads, bucketName]);

    if (!isOpen) return null;

    // Dynamic height based on number of items (min 300, max 600 or scalable)
    const chartHeight = Math.max(300, data.length * 40);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white z-10">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <BarChart2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{bucketName}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status Breakdown</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                     {data.length === 0 ? (
                         <div className="text-center text-slate-400 py-10">No leads in this bucket.</div>
                     ) : (
                         <div style={{ height: chartHeight }} className="w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    layout="vertical" 
                                    data={data} 
                                    margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="status" 
                                        type="category" 
                                        width={180} 
                                        tick={{fontSize: 11, fill: '#475569', fontWeight: 600}} 
                                        interval={0}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                                    />
                                    <Bar dataKey="count" barSize={24} radius={[0, 4, 4, 0]}>
                                        {data.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill="#6366f1" 
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    onStatusSelect(entry.leads, `${bucketName} > ${entry.status}`);
                                                }}
                                            />
                                        ))}
                                        <LabelList dataKey="label" position="right" style={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                     )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-400">
                    Click a bar to view detailed lead list
                </div>
            </div>
        </div>
    );
};