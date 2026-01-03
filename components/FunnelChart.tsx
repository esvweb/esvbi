import React from 'react';

interface FunnelChartProps {
  data: Record<string, number>;
  title?: string;
  totalBase?: number; 
  height?: string;
  compact?: boolean;
  onBarClick?: (stage: string) => void;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ 
  data, 
  title, 
  height = "h-auto", 
  compact = false,
  onBarClick
}) => {
  
  const stages = [
    { key: 'New', label: 'New', from: 'from-blue-500', to: 'to-blue-400', shadow: 'shadow-blue-200 dark:shadow-none' },
    { key: 'Interested', label: '≥Interested', from: 'from-orange-500', to: 'to-orange-400', shadow: 'shadow-orange-200 dark:shadow-none' },
    { key: 'WaitingEval', label: '≥Waiting Eval', from: 'from-green-500', to: 'to-green-400', shadow: 'shadow-green-200 dark:shadow-none' },
    { key: 'OfferSent', label: '≥Offer Sent', from: 'from-rose-500', to: 'to-rose-400', shadow: 'shadow-rose-200 dark:shadow-none' },
    { key: 'Success', label: 'Success', from: 'from-purple-600', to: 'to-purple-500', shadow: 'shadow-purple-200 dark:shadow-none' },
  ];

  const negativeStage = { key: 'Negative', label: 'Negative/Lost', from: 'from-slate-400', to: 'to-slate-300', shadow: 'shadow-slate-200 dark:shadow-none' };

  const newCount = data['New'] || 0;
  const interestedCount = data['Interested'] || 0;
  const waitingCount = data['WaitingEval'] || 0;
  const offerCount = data['OfferSent'] || 0;
  const successCount = data['Success'] || 0;
  const negativeCount = data['Negative'] || 0;

  const maxVal = newCount > 0 ? newCount : 1;
  const getWidth = (val: number) => `${Math.max((val / maxVal) * 100, 1)}%`;

  const getLabel = (key: string, count: number) => {
      let pct = 0;
      if (key === 'New') pct = 100;
      else if (key === 'Interested') pct = newCount > 0 ? (count / newCount * 100) : 0;
      else if (key === 'WaitingEval') pct = interestedCount > 0 ? (count / interestedCount * 100) : 0;
      else if (key === 'OfferSent') pct = waitingCount > 0 ? (count / waitingCount * 100) : 0;
      else if (key === 'Success') pct = offerCount > 0 ? (count / offerCount * 100) : 0;
      else if (key === 'Negative') pct = newCount > 0 ? (count / newCount * 100) : 0;

      return `${pct.toFixed(1)}% (${count})`;
  };

  return (
    <div className={`flex flex-col w-full ${compact ? 'gap-3' : 'gap-5'} ${height}`}>
      {title && <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>}
      
      {/* 5 Core Stages */}
      <div className="flex flex-col gap-3">
        {stages.map((stage) => {
            const count = data[stage.key] || 0;
            return (
                <div key={stage.key} className="flex items-center gap-3 group">
                    {/* Label */}
                    <div className={`text-xs font-bold text-slate-500 dark:text-slate-400 text-right uppercase tracking-wider ${compact ? 'w-20' : 'w-28'}`}>
                        {stage.label}
                    </div>
                    
                    {/* Bar Container - "Track" effect */}
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full relative flex items-center shadow-inner dark:shadow-none overflow-visible">
                        <div 
                            className={`h-5 rounded-full bg-gradient-to-r ${stage.from} ${stage.to} relative shadow-lg ${stage.shadow} transition-all duration-700 ease-out cursor-pointer hover:brightness-110 hover:scale-[1.02]`}
                            style={{ width: getWidth(count) }}
                            onClick={() => onBarClick && onBarClick(stage.key)}
                        >
                            {/* Shine effect */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full"></div>
                        </div>
                        
                        {/* Floating Label */}
                        <div 
                            onClick={() => onBarClick && onBarClick(stage.key)}
                            className="ml-3 text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-10"
                        >
                            {getLabel(stage.key, count)}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Negative/Lost Bar */}
      <div className="mt-2 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-2">
         <div className="flex items-center gap-3 group">
            <div className={`text-xs font-bold text-slate-400 dark:text-slate-500 text-right uppercase tracking-wider ${compact ? 'w-20' : 'w-28'}`}>
                {negativeStage.label}
            </div>
            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full relative flex items-center shadow-inner dark:shadow-none overflow-visible">
                <div 
                    className={`h-5 rounded-full bg-gradient-to-r ${negativeStage.from} ${negativeStage.to} relative shadow-lg ${negativeStage.shadow} transition-all duration-700 ease-out cursor-pointer hover:brightness-110`}
                    style={{ width: getWidth(negativeCount) }}
                    onClick={() => onBarClick && onBarClick(negativeStage.key)}
                >
                     <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full"></div>
                </div>
                <div 
                    onClick={() => onBarClick && onBarClick(negativeStage.key)}
                    className="ml-3 text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors z-10"
                >
                    {getLabel(negativeStage.key, negativeCount)}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};