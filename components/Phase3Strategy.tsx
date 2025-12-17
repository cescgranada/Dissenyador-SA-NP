import React from 'react';
import { Phase3Strategy } from '../types';

interface Phase3StrategyProps {
  strategy: Phase3Strategy;
  onNext: () => void;
  onBack: () => void;
}

export const Phase3StrategyView: React.FC<Phase3StrategyProps> = ({ strategy, onNext, onBack }) => {

  // --- DOWNLOAD HELPERS ---

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMarkdownContent = () => {
    let md = `# Estratègia i Planificació\n\n`;
    strategy.phases.forEach((phase, idx) => {
       md += `## Fase ${idx + 1}: ${phase.phaseName}\n`;
       md += `**Temps:** ${phase.timeAllocation} | **Activitats:** ~${phase.numActivities}\n\n`;
       md += `### Objectius\n${phase.objectives.map(o => `- ${o}`).join('\n')}\n\n`;
       md += `### Descripció\n${phase.description}\n\n`;
       md += `**Bloom:** ${phase.bloomLevel}\n`;
       md += `**DUA:** ${phase.duaStrategy}\n\n`;
       md += `---\n\n`;
    });
    return md;
  };

  const getLatexContent = () => {
    const safeText = (t: string) => t.replace(/([#$%&_])/g, '\\$1');
    let tex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[catalan]{babel}
\\usepackage{geometry}
\\geometry{a4paper, margin=2.5cm}

\\title{Estratègia i Planificació}
\\date{}

\\begin{document}

\\maketitle\n\n`;

    strategy.phases.forEach((phase, idx) => {
       tex += `\\section*{Fase ${idx + 1}: ${safeText(phase.phaseName)}}\n`;
       tex += `\\textbf{Temps:} ${safeText(phase.timeAllocation)} | \\textbf{Activitats:} ${phase.numActivities}\n\n`;
       
       tex += `\\subsection*{Objectius}\n\\begin{itemize}\n`;
       phase.objectives.forEach(o => { tex += `\\item ${safeText(o)}\n`; });
       tex += `\\end{itemize}\n\n`;
       
       tex += `\\subsection*{Descripció}\n${safeText(phase.description)}\n\n`;
       tex += `\\noindent\\textbf{Bloom:} ${safeText(phase.bloomLevel)} \\\\\n`;
       tex += `\\noindent\\textbf{DUA:} ${safeText(phase.duaStrategy)}\n\n`;
       tex += `\\hrule\\vspace{0.5cm}\n\n`;
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
        "colab": { "name": "Estrategia SA", "provenance": [] },
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-purple-700 to-pink-700 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono border border-white/30">3</span>
              Estratègia i Planificació
            </h2>
            <p className="mt-2 text-purple-100 text-sm font-medium">Full de ruta metodològic.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
             <button onClick={() => downloadFile(getColabContent(), 'estrategia_colab.ipynb', 'application/json')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold border border-white/30 transition flex items-center gap-1">
               🐍 Colab
             </button>
             <button onClick={() => downloadFile(getLatexContent(), 'estrategia.tex', 'text/plain')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold border border-white/30 transition flex items-center gap-1">
               T Overleaf
             </button>
             <button onClick={() => downloadFile(getMarkdownContent(), 'estrategia.md', 'text/markdown')} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold border border-white/30 transition flex items-center gap-1">
               ⬇ Word
             </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {strategy.phases.map((phase, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                  {phase.phaseName}
                </h3>
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">{phase.timeAllocation}</span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-md">{phase.numActivities} activitats est.</span>
                </div>
              </div>
              
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Objectius de Fase</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {phase.objectives.map((obj, i) => (
                      <li key={i} className="text-sm text-slate-700">{obj}</li>
                    ))}
                  </ul>
                  
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">Descripció Metodològica</h4>
                  <p className="text-sm text-slate-600 italic border-l-4 border-purple-300 pl-3 bg-purple-50 py-2 rounded-r">
                    "{phase.description}"
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nivell de Bloom</h4>
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
                      {phase.bloomLevel}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estratègia DUA</h4>
                    <div className="text-sm text-slate-700 bg-green-50 p-3 rounded border border-green-100">
                      {phase.duaStrategy}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-4">
          <button onClick={onBack} className="flex-1 py-3 px-6 rounded-lg font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition">
            Enrere
          </button>
          <button onClick={onNext} className="flex-1 py-3 px-6 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 border border-purple-700 shadow-md transition">
            Validar i Seleccionar Avaluació
          </button>
        </div>
      </div>
    </div>
  );
};