import React, { useState } from 'react';
import { PhaseSequence, Activity, Phase3Strategy } from '../types';

interface Phase5ActivitiesProps {
  sequence: PhaseSequence[];
  strategy?: Phase3Strategy;
  onNext: (updatedSequence: PhaseSequence[]) => void;
  isLoading: boolean;
}

const BLOOM_LEVELS = [
  { value: 'Recordar', label: 'Recordar', description: 'Recuperar dades o fets de la memòria.', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'Comprendre', label: 'Comprendre', description: 'Entendre el significat, traduir, interpolar.', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Aplicar', label: 'Aplicar', description: 'Utilitzar un concepte en una situació nova.', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'Analitzar', label: 'Analitzar', description: 'Separar conceptes en parts constituents.', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'Avaluar', label: 'Avaluar', description: 'Fer judicis de valor basats en criteris.', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'Crear', label: 'Crear', description: 'Construir una estructura nova o coherent.', color: 'bg-purple-50 text-purple-700 border-purple-200' }
];

const BLOOM_WEIGHTS: { [key: string]: number } = {
  'Recordar': 1,
  'Comprendre': 2,
  'Aplicar': 3,
  'Analitzar': 4,
  'Avaluar': 5,
  'Crear': 6
};

export const Phase5ActivitiesView: React.FC<Phase5ActivitiesProps> = ({ sequence, strategy, onNext, isLoading }) => {
  const [editableSequence, setEditableSequence] = useState<PhaseSequence[]>(sequence);

  // --- DOWNLOAD & VALIDATION HELPERS ---

  const handleDownload = (generator: () => string, filename: string, mimeType: string) => {
    try {
      const content = generator();
      if (!content) throw new Error("El contingut generat està buit.");

      // Validation
      if (mimeType === 'application/json') {
        try { JSON.parse(content); } catch { throw new Error("JSON invàlid."); }
      } else if (filename.endsWith('.tex')) {
         const open = (content.match(/\{/g) || []).length;
         const close = (content.match(/\}/g) || []).length;
         if (open !== close && !window.confirm(`Avís: Claus LaTeX desequilibrades ({${open}} vs {${close}}). Vols descarregar igualment?`)) return;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getMarkdownContent = () => {
    let md = `# Seqüència d'Activitats\n\n`;
    editableSequence.forEach((phase, idx) => {
      md += `## ${idx + 1}. ${phase.phaseName}\n`;
      md += `**Objectiu:** ${phase.phaseObjective}\n\n`;
      phase.activities.forEach(act => {
        md += `### ${act.title}\n`;
        md += `**Durada:** ${act.duration} | **Bloom:** ${act.bloomLevel} | **Metodologia:** ${act.methodology}\n\n`;
        md += `${act.description}\n\n`;
      });
      md += `---\n\n`;
    });
    return md;
  };

  const getLatexContent = () => {
    const safeText = (t: string) => t
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/([#$%&_{}])/g, '\\$1')
      .replace(/\^/g, '\\^{}')
      .replace(/~/g, '\\~{}');

    let tex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[catalan]{babel}
\\usepackage{geometry}
\\geometry{a4paper, margin=2.5cm}

\\title{Seqüència d'Activitats}
\\date{}

\\begin{document}

\\maketitle\n\n`;

    editableSequence.forEach((phase, idx) => {
      tex += `\\section*{${idx + 1}. ${safeText(phase.phaseName)}}\n`;
      tex += `\\textit{Objectiu: ${safeText(phase.phaseObjective)}}\n\n`;
      
      phase.activities.forEach(act => {
        tex += `\\subsection*{${safeText(act.title)}}\n`;
        tex += `\\textbf{Durada:} ${safeText(act.duration || '')} $\\cdot$ \\textbf{Bloom:} ${safeText(act.bloomLevel)} $\\cdot$ \\textbf{Mètode:} ${safeText(act.methodology)}\n\n`;
        tex += `${safeText(act.description)}\n\n`;
      });
    });

    tex += `\\end{document}`;
    return tex;
  };

  const getColabContent = () => {
    const md = getMarkdownContent();
    const safeMd = md.replace(/"""/g, '\\"\\"\\"');
    const pythonCode = `from IPython.display import display, Markdown

content = """
${safeMd}
"""
display(Markdown(content))
`;

    const notebook = {
      "nbformat": 4,
      "nbformat_minor": 0,
      "metadata": {
        "colab": { "name": "Activitats SA", "provenance": [] },
        "kernelspec": { "name": "python3", "display_name": "Python 3" },
        "language_info": { "name": "python" }
      },
      "cells": [
        {
          "cell_type": "code",
          "execution_count": null,
          "metadata": {},
          "outputs": [],
          "source": pythonCode.split('\n').map(line => line + '\n')
        }
      ]
    };
    return JSON.stringify(notebook, null, 2);
  };

  // --- EDIT HELPERS ---

  const handlePhaseUpdate = (phaseIndex: number, field: 'phaseName' | 'phaseObjective', value: string) => {
    const newSequence = [...editableSequence];
    newSequence[phaseIndex] = { ...newSequence[phaseIndex], [field]: value };
    setEditableSequence(newSequence);
  };

  const handleActivityUpdate = (phaseIndex: number, activityIndex: number, field: keyof Activity, value: string) => {
    const newSequence = [...editableSequence];
    const updatedActivity = { ...newSequence[phaseIndex].activities[activityIndex], [field]: value };
    newSequence[phaseIndex].activities[activityIndex] = updatedActivity;
    setEditableSequence(newSequence);
  };

  const handleAddActivity = (phaseIndex: number) => {
    const newSequence = [...editableSequence];
    newSequence[phaseIndex].activities.push({
      title: 'Nova Activitat',
      description: '',
      bloomLevel: 'Comprendre',
      methodology: '',
      duration: '30 min'
    });
    setEditableSequence(newSequence);
  };

  const handleRemoveActivity = (phaseIndex: number, activityIndex: number) => {
    if (window.confirm("Estàs segur de voler eliminar aquesta activitat?")) {
      const newSequence = [...editableSequence];
      newSequence[phaseIndex].activities.splice(activityIndex, 1);
      setEditableSequence(newSequence);
    }
  };

  const handleMoveActivity = (phaseIndex: number, activityIndex: number, direction: 'up' | 'down') => {
    const newSequence = [...editableSequence];
    const activities = newSequence[phaseIndex].activities;
    
    if (direction === 'up' && activityIndex > 0) {
      [activities[activityIndex], activities[activityIndex - 1]] = [activities[activityIndex - 1], activities[activityIndex]];
    } else if (direction === 'down' && activityIndex < activities.length - 1) {
      [activities[activityIndex], activities[activityIndex + 1]] = [activities[activityIndex + 1], activities[activityIndex]];
    }
    
    setEditableSequence(newSequence);
  };

  const getBloomDetails = (level: string) => {
    return BLOOM_LEVELS.find(b => b.value.toLowerCase() === level.toLowerCase()) || {
      value: level,
      label: level,
      description: 'Nivell personalitzat o no estàndard.',
      color: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  };

  const getBloomAlignment = (current: string, target?: string) => {
    if (!target) return null;
    const wCurrent = BLOOM_WEIGHTS[current] || 0;
    const wTarget = BLOOM_WEIGHTS[target] || 0;

    if (wCurrent === wTarget) return { text: "Alineat amb l'objectiu de fase", color: "text-green-700 bg-green-50 border-green-200" };
    if (wCurrent > wTarget) return { text: `Supera l'objectiu (${target})`, color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { text: `Bastida cap a l'objectiu (${target})`, color: "text-slate-600 bg-slate-100 border-slate-200" };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono border border-white/30">4</span>
              Seqüència d'Activitats
            </h2>
            <p className="mt-2 text-indigo-100 text-sm font-medium">Revisa i ajusta els nivells de Bloom per alinear-los amb els objectius.</p>
          </div>

          <div className="flex flex-wrap gap-2">
             <button onClick={() => handleDownload(() => getColabContent(), 'activitats_colab.ipynb', 'application/json')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold border border-white/30 transition flex items-center gap-1">
               🐍 Colab
             </button>
             <button onClick={() => handleDownload(() => getLatexContent(), 'activitats.tex', 'text/plain')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold border border-white/30 transition flex items-center gap-1">
               T Overleaf
             </button>
             <button onClick={() => handleDownload(() => getMarkdownContent(), 'activitats.md', 'text/markdown')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold border border-white/30 transition flex items-center gap-1">
               ⬇ Word
             </button>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {editableSequence.map((phase, phaseIdx) => {
            const phaseTargetBloom = strategy?.phases[phaseIdx]?.bloomLevel;

            return (
              <div key={phaseIdx} className="p-6 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-indigo-600 font-mono text-xl font-bold">{phaseIdx + 1}.</span>
                      <input
                        type="text"
                        value={phase.phaseName}
                        onChange={(e) => handlePhaseUpdate(phaseIdx, 'phaseName', e.target.value)}
                        className="font-bold text-slate-900 text-lg bg-[#FAFDFE] border border-indigo-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none w-full transition-colors placeholder-[#AAB4C8]"
                        placeholder="Nom de la fase"
                      />
                    </div>
                    <div className="flex items-start gap-2 pl-7">
                        <span className="text-xs font-bold text-slate-400 uppercase mt-1">Objectiu:</span>
                        <textarea
                          value={phase.phaseObjective}
                          onChange={(e) => handlePhaseUpdate(phaseIdx, 'phaseObjective', e.target.value)}
                          className="text-sm text-slate-700 font-medium bg-[#FAFDFE] border border-indigo-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none w-full transition-colors resize-none placeholder-[#AAB4C8]"
                          rows={2}
                          placeholder="Objectiu de la fase..."
                        />
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                      {phaseTargetBloom && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
                          Target Bloom: {phaseTargetBloom}
                        </span>
                      )}
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {phase.activities.map((act, actIdx) => {
                    const bloomInfo = getBloomDetails(act.bloomLevel);
                    const alignment = getBloomAlignment(act.bloomLevel, phaseTargetBloom);

                    return (
                      <div key={actIdx} className="bg-slate-50 rounded-lg p-5 border border-slate-200 hover:border-indigo-300 transition shadow-sm group relative">
                          
                          {/* Activity Controls Toolbar */}
                          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-md shadow-sm border border-slate-200 p-1 z-10">
                            <button 
                              onClick={() => handleMoveActivity(phaseIdx, actIdx, 'up')}
                              disabled={actIdx === 0}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Moure amunt"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                            </button>
                            <button 
                              onClick={() => handleMoveActivity(phaseIdx, actIdx, 'down')}
                              disabled={actIdx === phase.activities.length - 1}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Moure avall"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            <div className="w-px bg-slate-200 mx-1"></div>
                            <button 
                              onClick={() => handleRemoveActivity(phaseIdx, actIdx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Eliminar activitat"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>

                          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                              <div className="flex-1 w-full pr-24"> {/* Padding right to avoid overlap with controls */}
                                  <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                                      {/* Editable Title */}
                                      <input 
                                        type="text"
                                        value={act.title}
                                        onChange={(e) => handleActivityUpdate(phaseIdx, actIdx, 'title', e.target.value)}
                                        className="font-bold text-slate-900 text-base bg-[#FAFDFE] border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none w-full transition-colors placeholder-[#AAB4C8]"
                                        placeholder="Títol de l'activitat"
                                      />
                                      
                                      {/* Editable Duration */}
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                         <span className="text-xs text-slate-400 uppercase font-bold">Durada:</span>
                                         <input 
                                          type="text"
                                          value={act.duration || ''}
                                          onChange={(e) => handleActivityUpdate(phaseIdx, actIdx, 'duration', e.target.value)}
                                          className="text-xs font-bold text-slate-700 border border-slate-200 rounded px-2 py-1 w-20 focus:border-indigo-500 focus:outline-none text-center bg-[#FAFDFE] placeholder-[#AAB4C8]"
                                          placeholder="Ex: 30 min"
                                        />
                                      </div>
                                  </div>

                                  {/* Editable Description */}
                                  <textarea
                                    value={act.description}
                                    onChange={(e) => handleActivityUpdate(phaseIdx, actIdx, 'description', e.target.value)}
                                    className="w-full text-slate-700 text-sm mt-3 leading-relaxed bg-[#FAFDFE] border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-shadow placeholder-[#AAB4C8]"
                                    rows={3}
                                    placeholder="Descripció detallada de l'activitat..."
                                  />
                              </div>
                              
                              {/* Bloom Selector Column */}
                              <div className="w-full md:w-64 flex-shrink-0 bg-white p-3 rounded border border-slate-200 shadow-sm">
                                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Taxonomia de Bloom</label>
                                  <select 
                                      value={bloomInfo.value}
                                      onChange={(e) => handleActivityUpdate(phaseIdx, actIdx, 'bloomLevel', e.target.value)}
                                      className={`w-full text-sm font-bold rounded p-1.5 border outline-none focus:ring-2 focus:ring-indigo-200 ${bloomInfo.color}`}
                                  >
                                      {BLOOM_LEVELS.map(level => (
                                          <option key={level.value} value={level.value}>{level.label}</option>
                                      ))}
                                      {!BLOOM_LEVELS.some(b => b.value === bloomInfo.value) && (
                                          <option value={bloomInfo.value}>{bloomInfo.label}</option>
                                      )}
                                  </select>
                                  <p className="text-xs text-slate-500 mt-2 italic leading-tight">
                                      "{bloomInfo.description}"
                                  </p>
                                  {alignment && (
                                    <div className={`mt-3 text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 ${alignment.color}`}>
                                       {alignment.text.includes("Alineat") ? "✓" : "ℹ"} {alignment.text}
                                    </div>
                                  )}
                              </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs mt-2 border-t border-slate-200 pt-3 items-center">
                             <span className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-600 font-medium flex items-center gap-2 w-full md:w-auto">
                               🎨 
                               {/* Editable Methodology */}
                               <input 
                                type="text"
                                value={act.methodology}
                                onChange={(e) => handleActivityUpdate(phaseIdx, actIdx, 'methodology', e.target.value)}
                                className="bg-[#FAFDFE] border border-slate-200 rounded px-2 py-1 focus:outline-none w-full text-slate-700 font-medium placeholder-[#AAB4C8] text-xs focus:ring-1 focus:ring-indigo-200"
                                placeholder="Metodologia (ex: Gamificació)"
                               />
                             </span>
                             <span className="text-slate-400 text-[10px] italic ml-auto md:ml-2 hidden md:block">
                               Fes clic als textos per editar
                             </span>
                          </div>
                      </div>
                    );
                  })}
                  
                  {/* Add Activity Button */}
                  <button 
                    onClick={() => handleAddActivity(phaseIdx)}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center gap-2 font-medium text-sm group"
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center group-hover:bg-indigo-200 group-hover:text-indigo-700 transition">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    Afegir Nova Activitat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-200">
           <button
             onClick={() => onNext(editableSequence)}
             disabled={isLoading}
             className={`w-full py-3.5 px-6 rounded-lg font-bold text-white transition-all shadow-md text-lg flex justify-center items-center
               ${isLoading
                 ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                 : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5 border border-indigo-700'}`}
           >
             Configurar Activitats
           </button>
        </div>
      </div>
    </div>
  );
};
