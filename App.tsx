import React, { useState } from 'react';
import { Phase1Input, Phase2Structure, LearningSituation, ActivityConfig, PhaseSequence } from './types';
import { generateStructure, generateStrategy, generateSequence, generateStudentWorksheets, generateTools } from './services/geminiService';
import { Phase1Form } from './components/Phase1Form';
import { Phase2StructureView } from './components/Phase2Structure';
import { Phase3StrategyView } from './components/Phase3Strategy';
import { Phase5ActivitiesView } from './components/Phase5Activities'; // Reused as Phase 4
import { Phase6ConfigView } from './components/Phase6Config'; // Reused as Phase 5
import { Phase6InstrumentsView } from './components/Phase6Instruments'; // New Phase 6
import { Phase7WorksheetsView } from './components/Phase7Worksheets';
import { Phase8TeacherToolsView } from './components/Phase8TeacherTools';

const App: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saData, setSaData] = useState<LearningSituation>({
    input: { topic: '', product: '', area: 'STEM', grade: '1r ESO', duration: 12 }
  });
  const [error, setError] = useState<string | null>(null);

  // Phase 1 -> 2
  const handlePhase1Submit = async (input: Phase1Input) => {
    setIsLoading(true);
    setError(null);
    try {
      const structure = await generateStructure(input);
      setSaData({ input, structure });
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error desconegut generant l'estructura.");
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 2 -> 3
  const handlePhase2Confirm = async (updatedStructure: Phase2Structure) => {
    setSaData(prev => ({ ...prev, structure: updatedStructure }));
    setIsLoading(true);
    setError(null);
    try {
      const strategy = await generateStrategy(saData.input, updatedStructure);
      setSaData(prev => ({ ...prev, strategy }));
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error generant l'estratègia.");
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 3 -> 4 (Generate Activities)
  const handleStrategyConfirm = async () => {
    if (!saData.structure || !saData.strategy) return;
    setIsLoading(true);
    setError(null);
    try {
      // Step 4 is now Generating Activities based on Strategy (without instruments yet)
      const sequence = await generateSequence(saData.input, saData.structure, saData.strategy);
      setSaData(prev => ({ ...prev, sequence }));
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error generant la seqüència d'activitats.");
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 4 -> 5 (Go to Config)
  const handleActivitiesConfirm = (updatedSequence: PhaseSequence[]) => {
    setSaData(prev => ({ ...prev, sequence: updatedSequence }));
    setStep(5);
  };

  // Phase 5 -> 6 (Go to Instruments)
  const handleConfigConfirm = (configs: ActivityConfig[]) => {
    setSaData(prev => ({ ...prev, activityConfigs: configs }));
    setStep(6);
  };

  // Phase 6 -> 7 (Generate Worksheets)
  const handleInstrumentsConfirm = async (updatedConfigs: ActivityConfig[]) => {
    if (!saData.sequence || !saData.structure) return;
    setSaData(prev => ({ ...prev, activityConfigs: updatedConfigs }));
    setIsLoading(true);
    setError(null);
    try {
      // Pass structure to ensure DUA, SDGs, etc. are integrated
      const worksheets = await generateStudentWorksheets(saData.sequence, updatedConfigs, saData.structure);
      setSaData(prev => ({ ...prev, studentWorksheets: worksheets }));
      setStep(7);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error generant les fitxes de l'alumnat.");
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 7 -> 8 (Generate Teacher Tools)
  const handleGenerateTools = async () => {
    if (!saData.studentWorksheets || !saData.activityConfigs) return;
    setIsLoading(true);
    setError(null);
    try {
      const tools = await generateTools(saData.studentWorksheets, saData.activityConfigs);
      setSaData(prev => ({ ...prev, evaluationTools: tools }));
      setStep(8);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error generant les eines d'avaluació.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSaData({ input: { topic: '', product: '', area: 'STEM', grade: '1r ESO', duration: 12 } });
    setError(null);
  };

  const getStepName = (s: number) => {
    switch(s) {
      case 1: return "Context";
      case 2: return "Estructura";
      case 3: return "Estratègia";
      case 4: return "Activitats";
      case 5: return "Config";
      case 6: return "Instruments";
      case 7: return "Fitxes";
      case 8: return "Eines";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* Logo Section - Replaces the generic icon */}
             <div className="h-12 w-12 flex items-center justify-center">
               <img 
                 src="/logo.png" 
                 alt="Logo Nou Patufet" 
                 className="max-h-full max-w-full object-contain"
                 onError={(e) => {
                   // Fallback if image is missing
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.parentElement!.innerHTML = `<div class="bg-indigo-600 text-white p-2 rounded-lg"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg></div>`;
                 }}
               />
             </div>
             <div>
               <h1 className="text-xl font-bold text-slate-900 leading-tight">Dissenyador SA</h1>
               <p className="text-xs text-slate-500">Assistent Pedagògic amb IA</p>
             </div>
          </div>
          
          <div className="hidden xl:flex items-center gap-2 text-[10px] font-medium text-slate-400">
             {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
               <React.Fragment key={num}>
                 <span className={`${step >= num ? 'text-indigo-600 font-bold' : ''}`}>{getStepName(num)}</span>
                 {num < 8 && <span className="text-slate-200">/</span>}
               </React.Fragment>
             ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
            <p className="font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Error
            </p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {step === 1 && <Phase1Form onNext={handlePhase1Submit} isLoading={isLoading} />}
        
        {step === 2 && saData.structure && (
          <Phase2StructureView data={saData.structure} onNext={handlePhase2Confirm} onBack={() => setStep(1)} />
        )}

        {step === 3 && saData.strategy && (
          <Phase3StrategyView strategy={saData.strategy} onNext={handleStrategyConfirm} onBack={() => setStep(2)} />
        )}

        {step === 4 && saData.sequence && (
          <Phase5ActivitiesView sequence={saData.sequence} strategy={saData.strategy} onNext={handleActivitiesConfirm} isLoading={isLoading} />
        )}

        {step === 5 && saData.sequence && (
          <Phase6ConfigView sequence={saData.sequence} onNext={handleConfigConfirm} />
        )}

        {step === 6 && saData.activityConfigs && (
          <Phase6InstrumentsView configs={saData.activityConfigs} onGenerateWorksheets={handleInstrumentsConfirm} isLoading={isLoading} />
        )}

        {step === 7 && saData.studentWorksheets && (
          <Phase7WorksheetsView worksheets={saData.studentWorksheets} onGenerateTools={handleGenerateTools} isLoading={isLoading} />
        )}

        {step === 8 && saData.evaluationTools && (
          <Phase8TeacherToolsView tools={saData.evaluationTools} onReset={handleReset} />
        )}

      </main>

       <footer className="text-center text-slate-400 text-sm py-6">
          <p>Creat amb Tecnologia Gemini • Disseny Universal per a l'Aprenentatge</p>
       </footer>
    </div>
  );
};

export default App;