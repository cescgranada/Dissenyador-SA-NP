import React, { useState } from 'react';
import { Phase2Structure, ALL_SDGS, ALL_VECTORS, ALL_ABP_COMPETENCIES, ALL_SCHOOL_AXES } from '../types';

interface Phase2StructureProps {
  data: Phase2Structure;
  onNext: (updatedData: Phase2Structure) => void;
  onBack: () => void;
}

export const Phase2StructureView: React.FC<Phase2StructureProps> = ({ data, onNext, onBack }) => {
  const [editableData, setEditableData] = useState<Phase2Structure>(data);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper to toggle items in arrays
  const toggleItem = (listName: keyof Phase2Structure, item: string, maxLimit: number) => {
    setEditableData(prev => {
      const currentList = prev[listName] as string[];
      const exists = currentList.includes(item);

      if (exists) {
        // Remove item
        return { ...prev, [listName]: currentList.filter(i => i !== item) };
      } else {
        // Add item if limit not reached
        if (currentList.length < maxLimit) {
          return { ...prev, [listName]: [...currentList, item] };
        }
        return prev; // Ignore if limit reached
      }
    });
    setValidationError(null); // Clear error on interaction
  };

  const validateAndProceed = () => {
    if (editableData.sdgs.length === 0) {
      setValidationError("Has de seleccionar almenys 1 ODS.");
      return;
    }
    if (editableData.curriculumVectors.length === 0) {
      setValidationError("Has de seleccionar almenys 1 Vector del Currículum.");
      return;
    }
    onNext(editableData);
  };

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
    return `# Estructura Curricular

## Objectiu General
${editableData.generalObjective}

## Competències Específiques
${editableData.specificCompetencies.map(c => `- ${c}`).join('\n')}

## Sabers Essencials
${editableData.essentialKnowledge.map(k => `- ${k}`).join('\n')}

## ODS
${editableData.sdgs.join(', ')}

## Vectors del Currículum
${editableData.curriculumVectors.join(', ')}

## Competències ABPxODS
${editableData.abpCompetencies.join(', ')}

## Eixos Pedagògics
${editableData.schoolAxes.join(', ')}
`;
  };

  const getLatexContent = () => {
    const safeText = (t: string) => t.replace(/([#$%&_])/g, '\\$1');
    return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[catalan]{babel}
\\usepackage{geometry}
\\geometry{a4paper, margin=2.5cm}

\\title{Estructura Curricular}
\\date{}

\\begin{document}

\\maketitle

\\section*{Objectiu General}
${safeText(editableData.generalObjective)}

\\section*{Competències Específiques}
\\begin{itemize}
${editableData.specificCompetencies.map(c => `\\item ${safeText(c)}`).join('\n')}
\\end{itemize}

\\section*{Sabers Essencials}
\\begin{itemize}
${editableData.essentialKnowledge.map(k => `\\item ${safeText(k)}`).join('\n')}
\\end{itemize}

\\section*{Transversalitat}
\\textbf{ODS:} ${editableData.sdgs.map(safeText).join(', ')} \\\\
\\textbf{Vectors:} ${editableData.curriculumVectors.map(safeText).join(', ')} \\\\
\\textbf{ABPxODS:} ${editableData.abpCompetencies.map(safeText).join(', ')} \\\\
\\textbf{Eixos:} ${editableData.schoolAxes.map(safeText).join(', ')}

\\end{document}`;
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
        "colab": { "name": "Estructura Curricular", "provenance": [] },
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

  // Interactive Tag Group Renderer
  const renderInteractiveTagGroup = (
    title: string, 
    allItems: string[], 
    selectedItems: string[], 
    listName: keyof Phase2Structure,
    maxLimit: number,
    colorClass: string
  ) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full border ${selectedItems.length >= maxLimit ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {selectedItems.length} / {maxLimit} seleccionats
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {allItems.map((item, idx) => {
          const active = selectedItems.includes(item);
          const disabled = !active && selectedItems.length >= maxLimit;
          
          return (
            <button 
              key={idx} 
              onClick={() => toggleItem(listName, item, maxLimit)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 font-medium text-left
                ${active 
                  ? `${colorClass} border-transparent shadow-sm ring-1 ring-black/5` 
                  : disabled
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50 hover:text-slate-700 cursor-pointer shadow-sm hover:shadow'
                }`}
            >
              <div className="flex items-center gap-1.5">
                {active ? (
                   <span className="font-bold">✓</span>
                ) : (
                   <span className="w-3 h-3 rounded-full border border-slate-300"></span>
                )}
                {item}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header with downloads */}
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-emerald-200">2</span>
              Estructura Curricular
            </h2>
            <p className="text-slate-600 font-medium mt-1">Revisa i ajusta la proposta de la IA.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
             <button onClick={() => downloadFile(getColabContent(), 'estructura_colab.ipynb', 'application/json')} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-slate-700 transition shadow-sm flex items-center gap-1">
               🐍 Colab
             </button>
             <button onClick={() => downloadFile(getLatexContent(), 'estructura.tex', 'text/plain')} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-slate-700 transition shadow-sm flex items-center gap-1">
               T Overleaf
             </button>
             <button onClick={() => downloadFile(getMarkdownContent(), 'estructura.md', 'text/markdown')} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-slate-700 transition shadow-sm flex items-center gap-1">
               ⬇ Word
             </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2 opacity-90">Objectiu General</h3>
            <p className="text-xl text-slate-900 font-serif leading-relaxed">{editableData.generalObjective}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 border-b-2 border-slate-100 pb-2">Competències Específiques</h3>
                <ul className="space-y-3">
                  {editableData.specificCompetencies.map((comp, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 border border-emerald-200">C</span>
                      <span className="text-sm leading-snug font-medium">{comp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 border-b-2 border-slate-100 pb-2">Sabers Essencials</h3>
                <ul className="space-y-2">
                  {editableData.essentialKnowledge.map((know, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 text-sm p-2 hover:bg-slate-50 rounded transition-colors">
                      <span className="text-indigo-500 mt-1 font-bold">•</span>
                      <span>{know}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-8">
              {renderInteractiveTagGroup(
                "ODS (Selecciona 2 o 3)", 
                ALL_SDGS, 
                editableData.sdgs, 
                'sdgs',
                3,
                "bg-amber-100 text-amber-900 border-amber-300"
              )}
              {renderInteractiveTagGroup(
                "Vectors del Currículum (Max 2)", 
                ALL_VECTORS, 
                editableData.curriculumVectors,
                'curriculumVectors',
                2, 
                "bg-teal-100 text-teal-900 border-teal-300"
              )}
              {renderInteractiveTagGroup(
                "Competències ABPxODS (Max 2)", 
                ALL_ABP_COMPETENCIES, 
                editableData.abpCompetencies,
                'abpCompetencies',
                2, 
                "bg-indigo-100 text-indigo-900 border-indigo-300"
              )}
              {renderInteractiveTagGroup(
                "Eixos Pedagògics (Max 2)", 
                ALL_SCHOOL_AXES, 
                editableData.schoolAxes,
                'schoolAxes',
                2, 
                "bg-rose-100 text-rose-900 border-rose-300"
              )}
            </div>
          </div>
        </div>
        
        {validationError && (
          <div className="mx-8 mt-4 text-red-600 font-bold text-sm bg-red-50 p-3 rounded border border-red-200">
            ⚠️ {validationError}
          </div>
        )}

        <div className="p-8 mt-4 flex gap-4 border-t border-slate-100 pt-6">
          <button
            onClick={onBack}
            className="flex-1 py-3 px-6 rounded-lg font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-sm"
          >
            Enrere
          </button>
          <button
            onClick={validateAndProceed}
            className="flex-1 py-3 px-6 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            Validar i Continuar
          </button>
        </div>
      </div>
    </div>
  );
};