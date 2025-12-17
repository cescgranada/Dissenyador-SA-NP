import React from 'react';
import { EvaluationTool } from '../types';

interface Phase8TeacherToolsProps {
  tools: EvaluationTool[];
  onReset: () => void;
}

export const Phase8TeacherToolsView: React.FC<Phase8TeacherToolsProps> = ({ tools, onReset }) => {
  
  // --- GENERATORS PER EINA INDIVIDUAL ---

  const getLatexContent = (tool: EvaluationTool) => {
    // Basic escaping for LaTeX title/description to prevent compilation errors
    const safeTitle = tool.instrumentName.replace(/([#$%&_])/g, '\\$1');
    const safeDesc = tool.description.replace(/([#$%&_])/g, '\\$1');
    
    return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[catalan]{babel}
\\usepackage{geometry}
\\geometry{a4paper, margin=2.5cm}
\\usepackage{fancyvrb}

\\title{${safeTitle}}
\\date{}

\\begin{document}

\\maketitle

${tool.relatedActivity ? `\\noindent\\textbf{Activitat:} ${tool.relatedActivity}\\\\` : ''}
\\noindent\\textbf{Descripció:} ${safeDesc}

\\vspace{0.5cm}
\\hrule
\\vspace{0.5cm}

% El contingut generat es mostra tal qual per evitar errors de compilació amb caràcters especials
\\begin{verbatim}
${tool.content}
\\end{verbatim}

\\end{document}`;
  };

  const getMarkdownContent = (tool: EvaluationTool) => {
    return `# ${tool.instrumentName}

${tool.relatedActivity ? `**Activitat:** ${tool.relatedActivity}\n` : ''}
**Descripció:** ${tool.description}

---

${tool.content}
`;
  };

  const getColabContent = (tool: EvaluationTool) => {
    // Escape triple quotes in content to avoid Python syntax errors in the generated string
    const safeContent = tool.content.replace(/"""/g, '\\"\\"\\"');
    const safeDescription = tool.description.replace(/"""/g, '\\"\\"\\"');

    const pythonCode = `from IPython.display import display, Markdown

# Configuració de l'eina: ${tool.instrumentName}
title = "${tool.instrumentName}"
activity = "${tool.relatedActivity || ''}"
description = """${safeDescription}"""

# Contingut principal en Markdown
content = """
${safeContent}
"""

# Renderització a Colab
display(Markdown(f"# {title}"))
if activity:
    display(Markdown(f"**Activitat Relacionada:** {activity}"))
display(Markdown(f"**Descripció:** {description}"))
display(Markdown("---"))
display(Markdown(content))
`;

    const notebook = {
      "nbformat": 4,
      "nbformat_minor": 0,
      "metadata": {
        "colab": {
          "name": tool.instrumentName,
          "provenance": []
        },
        "kernelspec": {
          "name": "python3",
          "display_name": "Python 3"
        },
        "language_info": {
          "name": "python"
        }
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
        <div className="p-6 bg-gradient-to-r from-emerald-700 to-teal-700 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono border border-white/30">8</span>
            Eines d'Avaluació per al Docent
          </h2>
          <p className="mt-2 text-emerald-100 text-sm font-medium">Exporta els instruments d'avaluació en el format que necessitis.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {tools.map((tool, idx) => (
            <div key={idx} className="p-8 bg-white">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                 <div className="flex-1">
                   <div className="flex gap-2 mb-2">
                     <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase tracking-wide">
                       {tool.instrumentName}
                     </span>
                     {tool.relatedActivity && (
                       <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase tracking-wide">
                         {tool.relatedActivity}
                       </span>
                     )}
                   </div>
                   <h3 className="text-xl font-bold text-slate-900">{tool.description}</h3>
                 </div>

                 {/* ACTION BUTTONS PER TOOL */}
                 <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    <button 
                      onClick={() => downloadFile(getColabContent(tool), `eina_${idx}_colab.ipynb`, 'application/json')}
                      className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-bold border border-orange-200 transition shadow-sm"
                      title="Descarrega Notebook amb codi Python per a Google Colab"
                    >
                      <span>🐍</span> Python (Colab)
                    </button>
                    <button 
                      onClick={() => downloadFile(getLatexContent(tool), `eina_${idx}_overleaf.tex`, 'text/plain')}
                      className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold border border-green-200 transition shadow-sm"
                      title="Descarrega arxiu .tex per a Overleaf"
                    >
                      <span className="font-serif italic font-black">T</span> LaTeX (Overleaf)
                    </button>
                    <button 
                      onClick={() => downloadFile(getMarkdownContent(tool), `eina_${idx}_word.md`, 'text/markdown')}
                      className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 transition shadow-sm"
                      title="Descarrega Markdown per a Word/Docs"
                    >
                      <span>⬇</span> Markdown (Word)
                    </button>
                 </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 overflow-x-auto shadow-inner">
                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700">{tool.content}</pre>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
           <button onClick={onReset} className="text-slate-600 hover:text-slate-900 font-bold text-sm underline decoration-2 decoration-emerald-200 hover:decoration-emerald-500 transition-all">
              Tornar a començar una nova SA
           </button>
        </div>
      </div>
    </div>
  );
};