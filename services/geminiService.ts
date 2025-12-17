import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Phase1Input, Phase2Structure, Phase3Strategy, PhaseSequence, EvaluationTool, ActivityConfig, StudentWorksheet, ALL_SDGS, ALL_VECTORS, ALL_ABP_COMPETENCIES, ALL_SCHOOL_AXES } from "../types";

const MODEL_NAME = "gemini-2.5-flash";

// --- SAFETY SETTINGS ---
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Helper to get the AI client lazily.
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("No s'ha trobat l'API KEY. Comprova la configuració a Vercel (Settings > Environment Variables > API_KEY) i assegura't que has fet un 'Redeploy' després d'afegir-la.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

// Helper to robustly clean JSON string from markdown or extra text
const cleanJson = (text: string) => {
  if (!text) return "{}";
  // Find the first '{' and the last '}' to extract the JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  
  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  
  // Fallback: simple cleanup if braces aren't found (unlikely for valid objects)
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
          description: { type: Type.STRING, description: "Descripció estratègica general sense mencionar activitats específiques." },
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
          context: { type: Type.STRING, description: "Breu explicació del context per a l'alumne, integrant els valors (ODS, Vectors)." },
          objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Seqüència de tasques pas a pas, incorporant opcions DUA." },
          deliveryFormat: { type: Type.STRING },
          scaffoldChecklist: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Llista de comprovació (bastida) per al seguiment." },
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
          content: { type: Type.STRING, description: "Contingut en format Markdown (taules, llistes, etc.) llest per imprimir." }
        },
        required: ["instrumentName", "description", "content"]
      }
    }
  },
  required: ["tools"]
};

// --- FUNCTIONS ---

export const generateStructure = async (input: Phase1Input): Promise<Phase2Structure> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Actua com un expert docent i dissenyador curricular a Catalunya.
      Genera l'estructura curricular per a una SA:
      - Tema: ${input.topic}
      - Producte: ${input.product}
      - Àmbit: ${input.area}
      - Curs: ${input.grade}
      
      1. Currículum: Competències Específiques i Sabers Essencials (Decret 175/2022).
      2. ODS: Tria'n 2 o 3 de: ${JSON.stringify(ALL_SDGS)}.
      3. Vectors: Tria'n 1 o 2 de: ${JSON.stringify(ALL_VECTORS)}.
      4. ABPxODS: Tria'n 2 de: ${JSON.stringify(ALL_ABP_COMPETENCIES)}.
      5. Eixos Escola: Tria'n 1 o 2 de: ${JSON.stringify(ALL_SCHOOL_AXES)}.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: phase2Schema,
        safetySettings: safetySettings,
      },
    });

    if (!response.text) throw new Error("La resposta del model està buida (bloqueig de seguretat o error de xarxa).");
    
    try {
      return JSON.parse(cleanJson(response.text)) as Phase2Structure;
    } catch (e) {
      console.error("JSON Error:", response.text);
      throw new Error("No s'ha pogut llegir el format de la resposta de la IA.");
    }
  } catch (error) {
    console.error("API Error:", error);
    throw error; // Re-throw to be caught by App.tsx
  }
};

export const generateStrategy = async (input: Phase1Input, structure: Phase2Structure): Promise<Phase3Strategy> => {
  const ai = getAiClient();
  const prompt = `
    Genera una ESTRATÈGIA didàctica (PLANIFICACIÓ) per a la SA "${input.topic}".
    Objectiu Global: ${structure.generalObjective}
    Durada total: ${input.duration} hores.

    Divideix en 4 fases: Inicials, Desenvolupament, Síntesi, Aplicació.
    
    PER A CADA FASE:
    1. Objectius d'aprenentatge específics de la fase.
    2. Descripció de l'enfocament: Explica QUÈ es vol aconseguir i COM s'enfocarà metodològicament (Ex: "S'utilitzaran rutines de pensament per..."). 
       IMPORTANT: NO PROPOSIS ACTIVITATS CONCRETES ENCARA. Parla d'estratègies.
    3. Dedicació horària estimada i nombre aproximat d'activitats.
    4. Nivell de Bloom predominant.
    5. Referència DUA (Pautes i principis aplicats).
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: phase3StrategySchema,
      safetySettings: safetySettings,
    },
  });

  if (!response.text) throw new Error("Text buit rebut del model.");
  return JSON.parse(cleanJson(response.text)) as Phase3Strategy;
};

export const generateSequence = async (input: Phase1Input, structure: Phase2Structure, strategy: Phase3Strategy): Promise<PhaseSequence[]> => {
  const ai = getAiClient();
  const prompt = `
    Ara, basant-te en l'estratègia definida, crea la SEQÜÈNCIA D'ACTIVITATS CONCRETES.
    
    Context:
    - Tema: ${input.topic}
    - Objectiu: ${structure.generalObjective}
    - Estratègia prèvia: ${JSON.stringify(strategy)}

    Genera les activitats específiques per a les 4 fases. 
    Sigues creatiu i concreta les tasques.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: phaseSequenceSchema,
      safetySettings: safetySettings,
    },
  });

  if (!response.text) throw new Error("Text buit rebut del model.");
  const data = JSON.parse(cleanJson(response.text)) as { sequence: PhaseSequence[] };
  return data.sequence;
};

export const generateStudentWorksheets = async (sequence: PhaseSequence[], configs: ActivityConfig[], structure: Phase2Structure): Promise<StudentWorksheet[]> => {
  const ai = getAiClient();
  const prompt = `
    Genera les FITXES DE TREBALL PER A L'ALUMNAT.

    ELEMENTS ESTRUCTURALS QUE HAN DE QUEDAR REFLECTITS A LES FITXES:
    Aquestes fitxes han de demostrar que s'està treballant:
    - ODS: ${structure.sdgs.join(', ')}
    - Vectors del currículum: ${structure.curriculumVectors.join(', ')}
    - Competències ABPxODS: ${structure.abpCompetencies.join(', ')}
    - Eixos de l'escola: ${structure.schoolAxes.join(', ')}
    
    PRINCIPIS DUA (Disseny Universal per a l'Aprenentatge):
    És IMPRESCINDIBLE que les tasques i instruccions siguin inclusives. 
    - Ofereix múltiples formes de representació (ex: "llegeix el text o mira el vídeo", "consulta el gràfic").
    - Ofereix opcions d'acció i expressió (ex: "pots entregar un pòster, un podcast o una redacció").
    - Fomenta el compromís (connecta amb interessos reals).

    Llista d'activitats i configuració:
    ${JSON.stringify(configs)}

    Detall de les activitats de la seqüència:
    ${JSON.stringify(sequence)}

    Per a CADA activitat, genera una fitxa amb:
    1. Explicació del context: Breu introducció per a l'alumne que connecti l'activitat amb els ODS, vectors o eixos esmentats.
    2. Objectius de l'activitat: Clars i en llenguatge proper a l'alumne.
    3. Seqüència de tasques a realitzar: Pas a pas. IMPORTANT: Incorpora opcions DUA explícites dins els passos (ex: "Pas 2: Informa't sobre el tema (pots triar entre llegir l'article A o veure el vídeo B)").
    4. Format de lliurament: Especifica el format, recordant oferir flexibilitat (DUA) si el tipus d'activitat ho permet, i tenint en compte si és grup o individual.
    5. Bastida de seguiment (Checklist): Llista de comprovació perquè l'alumne s'autoreguli.
    
    IMPORTANT: Marca 'isEvaluable' com a true si la configuració ho indicava.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: studentWorksheetsSchema,
      safetySettings: safetySettings,
    },
  });

  if (!response.text) throw new Error("Text buit rebut del model.");
  const data = JSON.parse(cleanJson(response.text)) as { worksheets: StudentWorksheet[] };
  return data.worksheets;
};

export const generateTools = async (worksheets: StudentWorksheet[], configs: ActivityConfig[]): Promise<EvaluationTool[]> => {
  try {
    const ai = getAiClient();
    // Find evaluable configs, ignoring those explicitly marked as "Cap instrument"
    const evaluableConfigs = configs.filter(c => c.isEvaluable && c.selectedInstrument !== 'Cap instrument');
    
    if (evaluableConfigs.length === 0) {
      return [{ 
        instrumentName: "Avís", 
        description: "No s'han seleccionat activitats per avaluar o s'ha indicat 'Cap instrument' per a totes.", 
        content: "Si us plau, torna enrere i marca alguna activitat com a avaluable i selecciona un instrument si vols generar eines." 
      }];
    }

    // Create a clean list for the prompt matching activity title to selected instrument
    const evaluationRequests = evaluableConfigs.map(c => ({
      activityTitle: c.title,
      selectedInstrument: c.selectedInstrument || "Rúbrica general"
    }));

    // Filter worksheets that correspond to evaluable activities to save context tokens
    const relevantWorksheets = worksheets.filter(w => 
      evaluableConfigs.some(ec => ec.title === w.activityTitle)
    );

    const prompt = `
      Actua com un expert en avaluació educativa.
      Genera les EINES D'AVALUACIÓ PER AL DOCENT.
      
      Llista d'activitats a avaluar i l'instrument sol·licitat:
      ${JSON.stringify(evaluationRequests)}

      Detall de les activitats (context):
      ${JSON.stringify(relevantWorksheets)}

      Genera l'eina d'avaluació específica sol·licitada per a cada activitat.
      
      IMPORTANT: El camp 'content' ha de ser en format MARKDOWN net (taules, llistes de comprovació, etc.).
      Assegura't que el format JSON és vàlid i que les cadenes de text (com el markdown dins de 'content') estan ben escapades.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationToolsSchema,
        safetySettings: safetySettings,
      },
    });

    if (!response.text) {
        throw new Error("No s'ha rebut resposta del model.");
    }

    const data = JSON.parse(cleanJson(response.text)) as { tools: EvaluationTool[] };
    return data.tools;
  } catch (error) {
    console.error("Error generating evaluation tools:", error);
    // Return a fallback tool with error details instead of crashing
    return [{
        instrumentName: "Error de Generació",
        description: "Hi ha hagut un problema generant les eines automàticament.",
        content: `Detalls de l'error: ${error instanceof Error ? error.message : String(error)}\n\nSi us plau, torna-ho a provar.`
    }];
  }
};