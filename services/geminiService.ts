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
  // INTENT DE RECUPERACIÓ ROBUSTA DE LA CLAU:
  // 1. process.env.API_KEY: Inserit pel 'define' de vite.config.ts (mètode clàssic).
  // 2. import.meta.env.VITE_API_KEY: Mètode natiu de Vite per a variables que comencen per VITE_.
  // 3. Fallback buit per evitar errors de 'undefined'.
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      "No s'ha trobat l'API KEY. \n\n" +
      "SOLUCIÓ RECOMANADA (Vercel):\n" +
      "1. Assegura't que has definit la variable 'VITE_API_KEY' a Vercel (Settings > Environment Variables).\n" +
      "2. IMPORTANT: Has de fer un PUSH a GitHub amb els últims canvis de codi perquè Vercel els apliqui.\n" +
      "3. Si ja ho has fet, prova de fer un 'Redeploy' sense fer servir la memòria cau."
    );
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
          scaffoldChecklist: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Llista de comprovació (bastida) i preguntes d'autoregulació." },
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
      Genera l'estructura curricular per a una SA inclusiva i rigorosa:
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
    Genera una ESTRATÈGIA didàctica (PLANIFICACIÓ) detallada per a la SA "${input.topic}".
    Objectiu Global: ${structure.generalObjective}
    Durada total: ${input.duration} hores.

    AVALUACIÓ CONTÍNUA:
    L'estratègia ha de preveure moments d'avaluació diagnòstica, formativa (regulació) i sumativa. No limitis l'avaluació al final.

    Divideix en 4 fases: Inicials (Diagnòstic/Motivació), Desenvolupament (Construcció del coneixement), Síntesi (Estructuració/Creació), Aplicació (Transferència/Producte).
    
    PER A CADA FASE:
    1. Objectius d'aprenentatge específics.
    2. Descripció de l'enfocament: Explica QUÈ es fa i COM es regula l'aprenentatge.
    3. Dedicació horària estimada i nombre aproximat d'activitats.
    4. Nivell de Bloom predominant.
    5. Referència DUA: Especifica com s'apliquen els principis de Representació, Acció/Expressió i Implicació en aquesta fase concreta.
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

    Genera activitats variades que fomentin l'avaluació contínua (autoavaluació, coavaluació, feedback docent) i que siguin inclusives (DUA).
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
    Genera les FITXES DE TREBALL PER A L'ALUMNAT amb un enfocament rigorós en DUA i Avaluació Contínua.

    CONTEXT I VALORS:
    - ODS: ${structure.sdgs.join(', ')}
    - Vectors: ${structure.curriculumVectors.join(', ')}
    
    DISSENY UNIVERSAL PER A L'APRENENTATGE (DUA):
    És IMPRESCINDIBLE oferir opcions explícites. No diguis "fes l'activitat", sinó "pots fer l'activitat d'aquesta manera A o d'aquesta manera B".
    - Representació: Ofereix alternatives visuals/auditives a la informació.
    - Acció i Expressió: Permet múltiples formats de resposta (escrit, oral, gràfic, vídeo).

    AVALUACIÓ FORMATIVA I AUTOREGULACIÓ:
    Les fitxes han d'ajudar l'alumne a aprendre a aprendre.

    Llista d'activitats: ${JSON.stringify(configs)}
    Detall: ${JSON.stringify(sequence)}

    Per a CADA activitat, genera una fitxa amb:
    1. Context motivador connectat amb ODS/Vectors.
    2. Objectius clars (Què aprendré?).
    3. Seqüència de tasques: Incorpora opcions DUA explícites dins els passos.
    4. Format de lliurament: Flexible segons DUA.
    5. Bastida de seguiment (Checklist): 
       - Inclou passos de verificació de la tasca.
       - INCLOU PREGUNTES DE METACOGNICIÓ (ex: "Què m'ha costat més?", "Com ho he resolt?").
    
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
      Actua com un expert en avaluació educativa (avaluació per competències).
      Genera les EINES D'AVALUACIÓ PER AL DOCENT.
      
      Enfocament: Avaluació formativa i formadora (al servei de l'aprenentatge), no només qualificadora.
      
      Llista d'activitats a avaluar i l'instrument sol·licitat:
      ${JSON.stringify(evaluationRequests)}

      Detall de les activitats (context):
      ${JSON.stringify(relevantWorksheets)}

      Genera l'eina d'avaluació específica sol·licitada per a cada activitat.
      Assegura't que els criteris d'avaluació són clars, graduats (en cas de rúbriques) i connectats amb els objectius.
      
      IMPORTANT: El camp 'content' ha de ser en format MARKDOWN net (taules, llistes de comprovació, etc.).
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