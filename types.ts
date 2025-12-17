export type GradeLevel = '1r ESO' | '2n ESO' | '3r ESO' | '4t ESO';
export type SubjectArea = 'STEM' | 'Lingüístic' | 'Social i Artístic' | 'Transversal';

export interface Phase1Input {
  topic: string;
  product: string;
  area: SubjectArea;
  grade: GradeLevel;
  duration: number;
}

export interface Phase2Structure {
  generalObjective: string;
  specificCompetencies: string[];
  essentialKnowledge: string[];
  sdgs: string[];
  curriculumVectors: string[];
  abpCompetencies: string[];
  schoolAxes: string[];
}

export interface StrategicPhase {
  phaseName: string; 
  objectives: string[];
  description: string; 
  timeAllocation: string;
  numActivities: number;
  bloomLevel: string;
  duaStrategy: string;
}

export interface Phase3Strategy {
  phases: StrategicPhase[];
}

export interface Activity {
  title: string;
  description: string;
  bloomLevel: string;
  methodology: string;
  duration?: string;
}

export interface PhaseSequence {
  phaseName: string;
  phaseObjective: string;
  activities: Activity[];
}

export interface ActivityConfig {
  activityIndex: number; // Global index to track which activity this refers to
  phaseIndex: number;
  internalIndex: number;
  title: string;
  isGroup: boolean;
  groupSize: number;
  isEvaluable: boolean;
  selectedInstrument?: string; // The specific instrument chosen for this activity
}

export interface StudentWorksheet {
  activityTitle: string;
  context: string;
  objectives: string[];
  tasks: string[];
  deliveryFormat: string;
  scaffoldChecklist: string[]; // La bastida de seguiment
  isEvaluable: boolean;
}

export interface EvaluationTool {
  instrumentName: string;
  relatedActivity?: string;
  description: string;
  content: string; 
}

export interface LearningSituation {
  input: Phase1Input;
  structure?: Phase2Structure;
  strategy?: Phase3Strategy;
  sequence?: PhaseSequence[];
  activityConfigs?: ActivityConfig[]; // Configuration for worksheets/evaluation
  studentWorksheets?: StudentWorksheet[]; // Generated worksheets
  evaluationTools?: EvaluationTool[];
}

export const EVALUATION_INSTRUMENTS = [
  { id: 'kpsi', label: 'KPSI', type: 'Diagnòstic' },
  { id: 'diaris_aprenentatge', label: 'Diaris d\'aprenentatge', type: 'Diagnòstic' },
  { id: 'observacio', label: 'Observació d\'aula', type: 'Diagnòstic' },
  { id: 'tickets', label: 'Tickets d\'entrada/sortida', type: 'Diagnòstic' },
  { id: 'bases_orientacio', label: 'Bases d\'orientació', type: 'Regulació' },
  { id: 'diari_equip', label: 'Diari d\'equip', type: 'Regulació' },
  { id: 'autoavaluacio', label: 'Autoavaluació', type: 'Regulació' },
  { id: 'metacognicio', label: 'Escala de metacognició', type: 'Regulació' },
  { id: 'rubriques', label: 'Rúbrica', type: 'Producte' },
  { id: 'diana', label: 'Diana d\'avaluació', type: 'Producte' },
  { id: 'coavaluacio', label: 'Coavaluació', type: 'Producte' },
  { id: 'llista_control', label: 'Llista de control (Checklist)', type: 'Producte' },
  { id: 'feedback', label: 'Feedback entre iguals', type: 'Producte' },
  { id: 'portafolis', label: 'Portafolis digitals', type: 'Producte' },
  { id: 'none', label: 'Cap instrument', type: 'Altres' },
];

export const ALL_SDGS = [
  "ODS 1: Fi de la pobresa", "ODS 2: Fam zero", "ODS 3: Salut i benestar", "ODS 4: Educació de qualitat",
  "ODS 5: Igualtat de gènere", "ODS 6: Aigua neta i sanejament", "ODS 7: Energia assequible i no contaminant",
  "ODS 8: Treball decent i creixement econòmic", "ODS 9: Indústria, innovació i infraestructures",
  "ODS 10: Reducció de les desigualtats", "ODS 11: Ciutats i comunitats sostenibles",
  "ODS 12: Consum i producció responsables", "ODS 13: Acció climàtica", "ODS 14: Vida submarina",
  "ODS 15: Vida d'ecosistemes terrestres", "ODS 16: Pau, justícia i institucions sòlides",
  "ODS 17: Aliances per a assolir els objectius"
];

export const ALL_VECTORS = [
  "Aprenentatges competencials",
  "Perspectiva de gènere",
  "Universalitat del currículum",
  "Qualitat de l'educació lingüística",
  "Benestar emocional",
  "Ciutadania democràtica i consciència global"
];

export const ALL_ABP_COMPETENCIES = [
  "Pensament sistèmic",
  "Anticipació",
  "Valors i creences (Normativa)",
  "Estratègica",
  "Col·laboració",
  "Pensament crític",
  "Consciència d'un mateix",
  "Resolució de problemes integrada"
];

export const ALL_SCHOOL_AXES = [
  "Territori",
  "Feminisme",
  "Món sostenible",
  "ODS"
];