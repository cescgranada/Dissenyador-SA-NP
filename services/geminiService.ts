import { GoogleGenAI, Type } from "@google/genai";
import { Phase1Input, Phase2Structure, Phase3Strategy, PhaseSequence, EvaluationTool, ActivityConfig, StudentWorksheet } from "../types";

// Utilitzem el model recomanat per a tasques complexes de raonament
const MODEL_NAME = "gemini-3-pro-preview";

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera estructura curricular per: ${input.topic}. Producte: ${input.product}. Curs: ${input.grade}. Basat en Decret 175/2022 de la Generalitat de Catalunya.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: phase2Schema,
    },
  });
  
  if (!response.text) throw new Error("Resposta de la IA buida.");
  return JSON.parse(response.text.trim());
};

export const generateStrategy = async (input: Phase1Input, structure: Phase2Structure): Promise<Phase3Strategy> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera estratègia didàctica DUA per: ${input.topic}. Objectiu: ${structure.generalObjective}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: phase3StrategySchema,
    },
  });
  
  if (!response.text) throw new Error("Resposta de la IA buida.");
  return JSON.parse(response.text.trim());
};

export const generateSequence = async (input: Phase1Input, structure: Phase2Structure, strategy: Phase3Strategy): Promise<PhaseSequence[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera seqüència d'activitats per: ${input.topic}. Alineades amb Bloom i DUA.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: phaseSequenceSchema,
    },
  });
  
  if (!response.text) throw new Error("Resposta de la IA buida.");
  const data = JSON.parse(response.text.trim());
  return data.sequence;
};

export const generateStudentWorksheets = async (sequence: PhaseSequence[], configs: ActivityConfig[], structure: Phase2Structure): Promise<StudentWorksheet[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera fitxes de treball DUA per l'alumnat amb bastides de seguiment i metacognició basades en la seqüència d'activitats proporcionada.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: studentWorksheetsSchema,
    },
  });
  
  if (!response.text) throw new Error("Resposta de la IA buida.");
  const data = JSON.parse(response.text.trim());
  return data.worksheets;
};

export const generateTools = async (worksheets: StudentWorksheet[], configs: ActivityConfig[]): Promise<EvaluationTool[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Genera rúbriques o llistes de control detallades en format Markdown per a les activitats seleccionades.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: evaluationToolsSchema,
    },
  });
  
  if (!response.text) throw new Error("Resposta de la IA buida.");
  const data = JSON.parse(response.text.trim());
  return data.tools;
};