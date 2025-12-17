import React, { useState } from 'react';
import { ActivityConfig, EVALUATION_INSTRUMENTS } from '../types';

interface Phase6InstrumentsProps {
  configs: ActivityConfig[];
  onGenerateWorksheets: (updatedConfigs: ActivityConfig[]) => void;
  isLoading: boolean;
}

export const Phase6InstrumentsView: React.FC<Phase6InstrumentsProps> = ({ configs, onGenerateWorksheets, isLoading }) => {
  const [updatedConfigs, setUpdatedConfigs] = useState<ActivityConfig[]>(configs);
  
  // Filter only evaluable configs for display, but we keep all in state
  const evaluableConfigs = updatedConfigs.filter(c => c.isEvaluable);

  const handleInstrumentChange = (activityIndex: number, instrumentLabel: string) => {
    setUpdatedConfigs(prev => 
      prev.map(c => c.activityIndex === activityIndex ? { ...c, selectedInstrument: instrumentLabel } : c)
    );
  };

  const isComplete = evaluableConfigs.every(c => c.selectedInstrument);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono border border-white/30">6</span>
            Selecció d'Instruments
          </h2>
          <p className="mt-2 text-orange-50 text-sm font-medium">Tria l'instrument d'avaluació més adequat per a cada activitat marcada.</p>
        </div>

        <div className="p-6 space-y-6 bg-slate-50">
          {evaluableConfigs.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg border border-dashed border-slate-300 text-slate-500">
              No has marcat cap activitat com a avaluable en el pas anterior. 
              Pots continuar, però no es generaran eines d'avaluació específiques.
            </div>
          ) : (
            evaluableConfigs.map((config) => (
              <div key={config.activityIndex} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition hover:shadow-md">
                <h3 className="font-bold text-slate-800 text-lg mb-3">
                  {config.title}
                </h3>
                
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Instrument d'Avaluació</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {EVALUATION_INSTRUMENTS.map((inst) => {
                    const isNone = inst.id === 'none';
                    const isSelected = config.selectedInstrument === inst.label;
                    
                    let buttonClass = `text-left px-3 py-2 rounded-lg border text-sm transition-all `;
                    
                    if (isSelected) {
                        if (isNone) {
                            buttonClass += 'bg-slate-200 border-slate-400 text-slate-800 font-bold ring-1 ring-slate-400';
                        } else {
                            buttonClass += 'bg-orange-50 border-orange-500 text-orange-900 font-bold ring-1 ring-orange-500';
                        }
                    } else {
                         buttonClass += 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300';
                    }

                    return (
                        <button
                          key={inst.id}
                          onClick={() => handleInstrumentChange(config.activityIndex, inst.label)}
                          className={buttonClass}
                        >
                          {inst.label}
                        </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-200">
           <button
             onClick={() => onGenerateWorksheets(updatedConfigs)}
             disabled={isLoading || (evaluableConfigs.length > 0 && !isComplete)}
             className={`w-full py-3.5 px-6 rounded-lg font-bold text-white transition-all shadow-md text-lg flex justify-center items-center
               ${isLoading || (evaluableConfigs.length > 0 && !isComplete)
                 ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                 : 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg transform hover:-translate-y-0.5 border border-orange-700'}`}
           >
             {isLoading ? (
               <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Generant Fitxes de l'Alumnat...
               </>
             ) : (
               `Generar Fitxes`
             )}
           </button>
           {evaluableConfigs.length > 0 && !isComplete && (
             <p className="text-center text-xs text-red-500 mt-2 font-medium">Selecciona un instrument per a cada activitat abans de continuar.</p>
           )}
        </div>
      </div>
    </div>
  );
};