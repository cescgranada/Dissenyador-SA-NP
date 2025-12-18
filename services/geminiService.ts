import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Phase1Input, Phase2Structure, Phase3Strategy, PhaseSequence, EvaluationTool, ActivityConfig, StudentWorksheet } from "../types";

// Utilitzem gemini-3-pro-preview per a tasques complexes de disseny pedagògic
const MODEL_NAME = "gemini-3-pro-preview";

// --- CONFIGURACIÓ DE SEGURETAT ---
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Funció per netejar el JSON que retorna la IA
const cleanJson = (text: string | undefined) => {
  if (!text) return "{}";
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.substring(start, end + 1);
  }
  return trimmed.replace(/```json/g, '').replace(/```/g, '').trim();
};

// --- CLIENT HELPER ---
const getClient = () => {
  const apiKey = process.env.API_KEY;
  
  // Comprovació estricta: si és undefined, buit, o si la substitució de Vite ha fallat i encara val literalment "API_KEY"
  if (!apiKey || apiKey.trim() === '' || apiKey.includes("API_KEY_MISSING")) {
    throw new Error(
      "CRITIC: No s'ha trobat la clau API. \n\n" +
      "SI ESTÀS A VERCEL:\n" +
      "1. Ves a Settings > Environment Variables.\n" +
      "2. Assegura't que tens una variable 'VITE_API_KEY' amb la clau.\n" +
      "3. IMPORTANT: Ves a Deployments i fes 'Redeploy' (no només refrescar) perquè els canvis tinguin efecte."
    );
  }
  return new GoogleGenAI({ apiKey });
};

// --- ESQUEMES DE RESPOSTA ---
const phase2Schema = {
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

const phase3StrategySchema = {
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

const phaseSequenceSchema = {
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

const studentWorksheetsSchema = {
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

const evaluationToolsSchema = {
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

// --- FUNCIONS DE GENERACIÓ ---

export const generateStructure = async (input: Phase1Input): Promise<Phase2Structure> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera estructura curricular per: ${input.topic}. Producte: ${input.product}. Curs: ${input.grade}. Basat en Decret 175/2022 de la Generalitat de Catalunya.`,
    safetySettings,
    config: {
      responseMimeType: "application/json",
      responseSchema: phase2Schema,
    },
  });
  return JSON.parse(cleanJson(response.text));
};

export const generateStrategy = async (input: Phase1Input, structure: Phase2Structure): Promise<Phase3Strategy> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera estratègia didàctica DUA per: ${input.topic}. Objectiu: ${structure.generalObjective}.`,
    safetySettings,
    config: {
      responseMimeType: "application/json",
      responseSchema: phase3StrategySchema,
    },
  });
  return JSON.parse(cleanJson(response.text));
};

export const generateSequence = async (input: Phase1Input, structure: Phase2Structure, strategy: Phase3Strategy): Promise<PhaseSequence[]> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera seqüència d'activitats per: ${input.topic}. Alineades amb Bloom i DUA.`,
    safetySettings,
    config: {
      responseMimeType: "application/json",
      responseSchema: phaseSequenceSchema,
    },
  });
  const data = JSON.parse(cleanJson(response.text));
  return data.sequence;
};

export const generateStudentWorksheets = async (sequence: PhaseSequence[], configs: ActivityConfig[], structure: Phase2Structure): Promise<StudentWorksheet[]> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera fitxes de treball DUA per l'alumnat amb bastides de seguiment i metacognició.`,
    safetySettings,
    config: {
      responseMimeType: "application/json",
      responseSchema: studentWorksheetsSchema,
    },
  });
  const data = JSON.parse(cleanJson(response.text));
  return data.worksheets;
};

export const generateTools = async (worksheets: StudentWorksheet[], configs: ActivityConfig[]): Promise<EvaluationTool[]> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera rúbriques o llistes de control detallades en format Markdown.`,
    safetySettings,
    config: {
      responseMimeType: "application/json",
      responseSchema: evaluationToolsSchema,
    },
  });
  const data = JSON.parse(cleanJson(response.text));
  return data.tools;
};