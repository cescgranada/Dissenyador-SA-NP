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

  const handleBloomChange = (phaseIndex: number, activityIndex: number, newValue: string) => {
    const newSequence = [...editableSequence];
    newSequence[phaseIndex].activities[activityIndex] = {
      ...newSequence[phaseIndex].activities[activityIndex],
      bloomLevel: newValue
    };
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
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-indigo-600 font-mono text-xl">{phaseIdx + 1}.</span> {phase.phaseName}
                  </h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 md:mt-0">
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase">Objectiu:</span>
                          <span className="text-sm text-slate-700 font-medium truncate max-w-xs" title={phase.phaseObjective}>
                          {phase.phaseObjective}
                          </span>
                      </div>
                      {phaseTargetBloom && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
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
                      <div key={actIdx} className="bg-slate-50 rounded-lg p-5 border border-slate-200 hover:border-indigo-300 transition shadow-sm">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                              <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                      <h4 className="font-bold text-slate-900 text-base">{act.title}</h4>
                                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-1 rounded border border-slate-200 ml-2">{act.duration}</span>
                                  </div>
                                  <p className="text-slate-700 text-sm mt-2 leading-relaxed">{act.description}</p>
                              </div>
                              
                              {/* Bloom Selector Column */}
                              <div className="w-full md:w-64 flex-shrink-0 bg-white p-3 rounded border border-slate-200 shadow-sm">
                                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Taxonomia de Bloom</label>
                                  <select 
                                      value={bloomInfo.value}
                                      onChange={(e) => handleBloomChange(phaseIdx, actIdx, e.target.value)}
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

                          <div className="flex flex-wrap gap-2 text-xs mt-2 border-t border-slate-200 pt-2">
                             <span className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-600 font-medium flex items-center gap-1">
                               🎨 <span>{act.methodology}</span>
                             </span>
                          </div>
                      </div>
                    );
                  })}
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
