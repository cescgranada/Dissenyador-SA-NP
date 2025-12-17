import React, { useState, useEffect } from 'react';
import { PhaseSequence, ActivityConfig } from '../types';

interface Phase6ConfigProps {
  sequence: PhaseSequence[];
  onNext: (configs: ActivityConfig[]) => void;
}

export const Phase6ConfigView: React.FC<Phase6ConfigProps> = ({ sequence, onNext }) => {
  const [configs, setConfigs] = useState<ActivityConfig[]>([]);

  // Initialize config state based on sequence
  useEffect(() => {
    const initialConfigs: ActivityConfig[] = [];
    let globalIndex = 0;
    
    sequence.forEach((phase, pIndex) => {
      phase.activities.forEach((act, aIndex) => {
        initialConfigs.push({
          activityIndex: globalIndex++,
          phaseIndex: pIndex,
          internalIndex: aIndex,
          title: act.title,
          isGroup: false,
          groupSize: 4,
          isEvaluable: false
        });
      });
    });
    setConfigs(initialConfigs);
  }, [sequence]);

  const updateConfig = (index: number, field: keyof ActivityConfig, value: any) => {
    setConfigs(prev => prev.map(c => c.activityIndex === index ? { ...c, [field]: value } : c));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono border border-white/30">5</span>
            Configuració de les Activitats
          </h2>
          <p className="mt-2 text-cyan-50 text-sm font-medium">Defineix l'agrupament i marca quines activitats seran avaluades.</p>
        </div>

        <div className="p-6 space-y-6 bg-slate-50">
          {configs.map((config) => (
            <div key={config.activityIndex} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-4 border-b border-slate-100 pb-2">
                {config.title}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Grouping */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Agrupament</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`grouping-${config.activityIndex}`}
                        checked={!config.isGroup}
                        onChange={() => updateConfig(config.activityIndex, 'isGroup', false)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Individual</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`grouping-${config.activityIndex}`}
                        checked={config.isGroup}
                        onChange={() => updateConfig(config.activityIndex, 'isGroup', true)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Grup</span>
                    </label>
                  </div>
                  
                  {config.isGroup && (
                    <div className="mt-3">
                      <label className="block text-xs text-slate-400 mb-1">Membres per grup</label>
                      <input 
                        type="number" 
                        min="2" max="10"
                        value={config.groupSize}
                        onChange={(e) => updateConfig(config.activityIndex, 'groupSize', parseInt(e.target.value) || 2)}
                        className="w-20 px-2 py-1 border rounded text-sm text-slate-700 border-slate-300 bg-[#FAFDFE] focus:border-cyan-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Evaluation */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={config.isEvaluable}
                      onChange={(e) => updateConfig(config.activityIndex, 'isEvaluable', e.target.checked)}
                      className="mt-1 w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-orange-900">Aquesta activitat serà avaluada?</span>
                      <span className="block text-xs text-orange-700 mt-1">Marca-ho per seleccionar instruments d'avaluació en el següent pas.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-white border-t border-slate-200">
           <button
             onClick={() => onNext(configs)}
             className="w-full py-3.5 px-6 rounded-lg font-bold text-white bg-cyan-600 hover:bg-cyan-700 hover:shadow-lg transform hover:-translate-y-0.5 border border-cyan-700 transition-all shadow-md text-lg"
           >
             Continuar a Instruments d'Avaluació
           </button>
        </div>
      </div>
    </div>
  );
};