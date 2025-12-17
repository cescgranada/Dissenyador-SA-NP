import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Phase1Input, Phase2Structure, Phase3Strategy, PhaseSequence, EvaluationTool, ActivityConfig, StudentWorksheet, ALL_SDGS, ALL_VECTORS, ALL_ABP_COMPETENCIES, ALL_SCHOOL_AXES } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";

// --- SAFETY SETTINGS ---
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Helper to get the AI client lazily.
const getAiClient = () => {
  // Busquem la clau a process.env (injectada per Vite) o import.meta.env (natiu de Vite)
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      "No s'ha trobat l'API KEY. \n\n" +
      "PAS DE SEGURETAT FINAL A VERCEL:\n" +
      "1. Assegura't que has creat 'VITE_API_KEY' a Settings > Environment Variables.\n" +
      "2. IMPORTANTÍSSIM: Un cop creada la variable, has d'anar a la pestanya 'Deployments', fer clic als tres punts de l'últim intent i triar 'REDEPLOY' (sense memòria cau si és possible). Les claus noves NO s'apliquen a webs que ja estan publicades fins que no es tornen a 'construir'."
    );
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

// Helper to robustly clean JSON string from markdown or extra text
const cleanJson = (text: string) => {
  if (!text) return "{}";
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// --- SCHEMAS ---
const phase2Schema: Schema = {
  type: Type.OBJECT,
  properties: {
    generalObjective: { type: Type.STRING },
    specificCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
    essentialKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
    sdgs: { type: Type.ARRAY, items: { type: Type.STRING } },
    curriculumVectors: { type: Type.ARRAY, items: { type: Type.STRING } },
    abpCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
    schoolAxes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["generalObjective", "specificCompetencies", "essentialKnowledge", "sdgs", "curriculumVectors", "abpCompetencies", "schoolAxes"],
};

const phase3StrategySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phaseName: { type: Type.STRING },
          objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          description: { type: Type.STRING },
          timeAllocation: { type: Type.STRING },
          numActivities: { type: Type.NUMBER },
          bloomLevel: { type: Type.STRING },
          duaStrategy: { type: Type.STRING }
        },
        required: ["phaseName", "objectives", "description", "timeAllocation", "numActivities", "bloomLevel", "duaStrategy"]
      }
    }
  },
  required: ["phases"]
};

const phaseSequenceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sequence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phaseName: { type: Type.STRING },
          phaseObjective: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                bloomLevel: { type: Type.STRING },
                methodology: { type: Type.STRING },
                duration: { type: Type.STRING }
              },
              required: ["title", "description", "bloomLevel", "methodology"]
            }
          }
        },
        required: ["phaseName", "phaseObjective", "activities"]
      }
    }
  },
  required: ["sequence"]
};

const studentWorksheetsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    worksheets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          activityTitle: { type: Type.STRING },
          context: { type: Type.STRING },
          objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          deliveryFormat: { type: Type.STRING },
          scaffoldChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          isEvaluable: { type: Type.BOOLEAN }
        },
        required: ["activityTitle", "context", "objectives", "tasks", "deliveryFormat", "scaffoldChecklist"]
      }
    }
  },
  required: ["worksheets"]
};

const evaluationToolsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tools: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          instrumentName: { type: Type.STRING },
          relatedActivity: { type: Type.STRING },
          description: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["instrumentName", "description", "content"]
      }
    }
  },
  required: ["tools"]
};

// --- FUNCTIONS ---

export const generateStructure = async (input: Phase1Input): Promise<Phase2Structure> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera estructura curricular per: ${input.topic}. Producte: ${input.product}. Curs: ${input.grade}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: phase2Schema,
      safetySettings,
    },
  });
  return JSON.parse(cleanJson(response.text));
};

export const generateStrategy = async (input: Phase1Input, structure: Phase2Structure): Promise<Phase3Strategy> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera estratègia didàctica per: ${input.topic}. Objectiu: ${structure.generalObjective}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: phase3StrategySchema,
      safetySettings,
    },
  });
  return JSON.parse(cleanJson(response.text));
};

export const generateSequence = async (input: Phase1Input, structure: Phase2Structure, strategy: Phase3Strategy): Promise<PhaseSequence[]> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera seqüència d'activitats per: ${input.topic}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: phaseSequenceSchema,
      safetySettings,
    },
  });
  const data = JSON.parse(cleanJson(response.text));
  return data.sequence;
};

export const generateStudentWorksheets = async (sequence: PhaseSequence[], configs: ActivityConfig[], structure: Phase2Structure): Promise<StudentWorksheet[]> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera fitxes de treball DUA per les activitats.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: studentWorksheetsSchema,
      safetySettings,
    },
  });
  const data = JSON.parse(cleanJson(response.text));
  return data.worksheets;
};

export const generateTools = async (worksheets: StudentWorksheet[], configs: ActivityConfig[]): Promise<EvaluationTool[]> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera instruments d'avaluació docent.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: evaluationToolsSchema,
      safetySettings,
    },
  });
  const data = JSON.parse(cleanJson(response.text));
  return data.tools;
};