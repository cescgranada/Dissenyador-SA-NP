import React from 'react';
import { StudentWorksheet } from '../types';

interface Phase7WorksheetsProps {
  worksheets: StudentWorksheet[];
  onGenerateTools: () => void;
  isLoading: boolean;
}

export const Phase7WorksheetsView: React.FC<Phase7WorksheetsProps> = ({ worksheets, onGenerateTools, isLoading }) => {
  
  // --- HELPERS FOR SINGLE WORKSHEET ---

  const getMarkdownSingle = (sheet: StudentWorksheet) => {
    let md = `# ${sheet.activityTitle}\n\n`;
    md += `**Context:** ${sheet.context}\n\n`;
    md += `**Objectius:**\n${sheet.objectives.map(o => `- ${o}`).join('\n')}\n\n`;
    md += `**Tasques:**\n${sheet.tasks.map((t, i) => `${i+1}. ${t}`).join('\n')}\n\n`;
    md += `**Lliurament:** ${sheet.deliveryFormat}\n\n`;
    md += `**Checklist:**\n${sheet.scaffoldChecklist.map(c => `- [ ] ${c}`).join('\n')}\n\n`;
    return md;
  };

  const getLatexSingle = (sheet: StudentWorksheet) => {
    const safeText = (t: string) => t.replace(/([#$%&_])/g, '\\$1');
    let tex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[catalan]{babel}
\\usepackage{geometry}
\\geometry{a4paper, margin=2.5cm}
\\usepackage{amssymb} 

\\title{${safeText(sheet.activityTitle)}}
\\date{}

\\begin{document}

\\maketitle

\\textbf{Context:} ${safeText(sheet.context)}\n\n`;

    tex += `\\section*{Objectius}\n\\begin{itemize}\n${sheet.objectives.map(o => `\\item ${safeText(o)}`).join('\n')}\n\\end{itemize}\n\n`;
    tex += `\\section*{Tasques}\n\\begin{enumerate}\n${sheet.tasks.map(t => `\\item ${safeText(t)}`).join('\n')}\n\\end{enumerate}\n\n`;
    tex += `\\textbf{Lliurament:} ${safeText(sheet.deliveryFormat)}\n\n`;
    tex += `\\section*{Llista de comprovació}\n\\begin{itemize}\n${sheet.scaffoldChecklist.map(c => `\\item[$\\square$] ${safeText(c)}`).join('\n')}\n\\end{itemize}\n\n`;
    tex += `\\end{document}`;
    return tex;
  };

  const getColabSingle = (sheet: StudentWorksheet) => {
    const md = getMarkdownSingle(sheet);
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
        "colab": { "name": sheet.activityTitle, "provenance": [] },
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

  // --- DOWNLOAD HELPER ---

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-sky-600 to-blue-500 text-white flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono border border-white/30">7</span>
              Fitxes per a l'Alumnat
            </h2>
            <p className="mt-2 text-sky-100 text-sm font-medium">Material llest per entregar als estudiants.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {worksheets.map((sheet, idx) => (
            <div key={idx} className="p-8 bg-white print:p-0">
              <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
                 <div>
                   <h3 className="text-xl font-bold text-slate-900">{sheet.activityTitle}</h3>
                   <div className="flex gap-2 mt-2">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wide">
                         {sheet.deliveryFormat}
                      </span>
                      {sheet.isEvaluable && (
                         <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-wide border border-orange-200">
                           Avaluable
                         </span>
                      )}
                   </div>
                 </div>

                 {/* INDIVIDUAL DOWNLOAD BUTTONS PER WORKSHEET */}
                 <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => downloadFile(getColabSingle(sheet), `fitxa_${idx}_colab.ipynb`, 'application/json')}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold border border-blue-200 transition flex items-center gap-1"
                    >
                      🐍 Colab
                    </button>
                    <button 
                      onClick={() => downloadFile(getLatexSingle(sheet), `fitxa_${idx}.tex`, 'text/plain')}
                      className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold border border-green-200 transition flex items-center gap-1"
                    >
                      T Overleaf
                    </button>
                    <button 
                      onClick={() => downloadFile(getMarkdownSingle(sheet), `fitxa_${idx}.md`, 'text/markdown')}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-bold border border-slate-300 transition flex items-center gap-1"
                    >
                      ⬇ Word
                    </button>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Context and Tasks */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                       Contextualització
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{sheet.context}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">Objectius</h4>
                    <ul className="list-disc list-inside space-y-1">
                       {sheet.objectives.map((obj, i) => (
                         <li key={i} className="text-sm text-slate-600">{obj}</li>
                       ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <h4 className="font-bold text-slate-800 mb-3 uppercase text-xs tracking-wider">Passos a seguir</h4>
                     <ol className="space-y-3">
                       {sheet.tasks.map((task, i) => (
                         <li key={i} className="flex gap-3 text-sm text-slate-700">
                           <span className="font-bold text-sky-600">{i + 1}.</span>
                           <span>{task}</span>
                         </li>
                       ))}
                     </ol>
                  </div>
                </div>

                {/* Right: Scaffold / Bastida */}
                <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 shadow-sm">
                   <h4 className="font-bold text-yellow-900 mb-4 flex items-center gap-2">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     Bastida de Seguiment
                   </h4>
                   <p className="text-xs text-yellow-700 mb-4">Comprova que has completat tots els requisits:</p>
                   <ul className="space-y-3">
                     {sheet.scaffoldChecklist.map((item, i) => (
                       <li key={i} className="flex items-start gap-3 p-2 bg-white rounded border border-yellow-100">
                         <div className="w-5 h-5 rounded border-2 border-slate-300 mt-0.5"></div>
                         <span className="text-sm text-slate-700 font-medium">{item}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
           <button
             onClick={onGenerateTools}
             disabled={isLoading}
             className={`w-full py-3.5 px-6 rounded-lg font-bold text-white transition-all shadow-md text-lg flex justify-center items-center
               ${isLoading
                 ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                 : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transform hover:-translate-y-0.5 border border-emerald-700'}`}
           >
             {isLoading ? (
               <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Generant Eines d'Avaluació Docent...
               </>
             ) : (
               `Generar Eines d'Avaluació per al Docent`
             )}
           </button>
        </div>
      </div>
    </div>
  );
};