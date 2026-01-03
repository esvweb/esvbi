import React from 'react';
import { FilterState } from '../types';
import { Calendar, Users, Globe, Activity, MessageCircle, Megaphone, ArrowRight, FilterX, Briefcase } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  options: {
      reps: string[];
      countries: string[];
      languages: string[];
      sources: string[];
      treatments: string[];
      teams: string[];
  }
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, options }) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof FilterState, item: string) => {
    const current = filters[key] as string[];
    const next = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateFilter(key, next);
  };

  return (
    <div className="sticky top-4 z-30 px-4 mb-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="glass-panel dark:glass-panel rounded-2xl p-2 flex flex-wrap items-center gap-3 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
          
          {/* Date Range - Pill Style */}
          <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700">
            {['month', 'last_month', '6m', 'all_time', 'custom'].map((r) => (
              <button
                key={r}
                onClick={() => updateFilter('dateRange', r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                  filters.dateRange === r 
                    ? 'bg-white dark:bg-slate-700 text-[#28BA9A] shadow-md shadow-emerald-100 dark:shadow-none scale-105' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                {r === 'month' ? 'This Month' : r === 'last_month' ? 'Last Month' : r === '6m' ? '6 Months' : r === 'all_time' ? 'All' : 'Custom'}
              </button>
            ))}
          </div>
          
          {filters.dateRange === 'custom' && (
            <div className="flex items-center gap-2 animate-fade-in bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <input 
                    type="date" 
                    className="text-xs border-none rounded px-2 py-1 outline-none text-slate-600 dark:text-slate-300 bg-transparent font-medium dark:color-scheme-dark"
                    value={filters.customDateStart || ''}
                    onChange={(e) => updateFilter('customDateStart', e.target.value)}
                />
                <ArrowRight size={12} className="text-slate-300 dark:text-slate-600"/>
                <input 
                    type="date" 
                    className="text-xs border-none rounded px-2 py-1 outline-none text-slate-600 dark:text-slate-300 bg-transparent font-medium dark:color-scheme-dark"
                    value={filters.customDateEnd || ''}
                    onChange={(e) => updateFilter('customDateEnd', e.target.value)}
                />
            </div>
          )}

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

          {/* Treatment Filter */}
          <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700">
                  {['Dental', 'Hair', 'Other'].map(t => (
                      <button
                          key={t}
                          onClick={() => toggleArrayItem('treatments', t)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              filters.treatments.includes(t)
                              ? 'bg-white dark:bg-slate-700 text-[#28BA9A] shadow-sm ring-1 ring-[#28BA9A]/10'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                          }`}
                      >
                          {t}
                      </button>
                  ))}
              </div>
          </div>

          <div className="flex-1"></div>

          {/* Dropdowns */}
          <div className="flex items-center gap-2">
              {/* Team Filter */}
              <div className="relative group">
                   <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                      <Briefcase size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-[#28BA9A] transition-colors" />
                   </div>
                   <select 
                      className={`appearance-none pl-8 pr-8 py-2 text-xs font-bold border rounded-xl focus:outline-none transition-all cursor-pointer shadow-sm ${
                          filters.teams.length > 0 
                          ? 'border-[#28BA9A] text-[#28BA9A] ring-2 ring-[#28BA9A]/10 bg-white dark:bg-slate-800' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      onChange={(e) => {
                          if(e.target.value === 'All') updateFilter('teams', []);
                          else updateFilter('teams', [e.target.value]);
                      }}
                      value={filters.teams[0] || 'All'}
                  >
                      <option value="All">All Teams</option>
                      {options.teams.map((o: string) => (
                          <option key={o} value={o}>{o}</option>
                      ))}
                  </select>
              </div>

              {[
                  { icon: MessageCircle, val: filters.languages, key: 'languages', label: 'Language', opts: options.languages },
                  { icon: Megaphone, val: filters.sources, key: 'sources', label: 'Source', opts: options.sources },
                  { icon: Globe, val: filters.countries, key: 'countries', label: 'Country', opts: options.countries },
                  { icon: Users, val: filters.reps, key: 'reps', label: 'Rep', opts: options.reps },
              ].map((item: any) => (
                  <div key={item.key} className="relative group">
                       <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                          <item.icon size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-[#28BA9A] transition-colors" />
                       </div>
                       <select 
                          className={`appearance-none pl-8 pr-8 py-2 text-xs font-bold border rounded-xl focus:outline-none transition-all cursor-pointer shadow-sm ${
                              item.val.length > 0 
                              ? 'border-[#28BA9A] text-[#28BA9A] ring-2 ring-[#28BA9A]/10 bg-white dark:bg-slate-800' 
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                          onChange={(e) => {
                              if(e.target.value === 'All') updateFilter(item.key, []);
                              else updateFilter(item.key, [e.target.value]);
                          }}
                          value={item.val[0] || 'All'}
                      >
                          <option value="All">All {item.label}s</option>
                          {item.opts.map((o: string) => (
                              <option key={o} value={o}>{o}</option>
                          ))}
                      </select>
                  </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};