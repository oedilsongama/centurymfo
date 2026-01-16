
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { ChatMode } from "../types";

const specialistTools: FunctionDeclaration[] = [
  {
    name: "analyze_meeting_transcript",
    description: "Analisa a transcrição da reunião e extrai tarefas estratégicas para o CRM.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tasks: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT,
            properties: { 
              title: { type: Type.STRING }, 
              priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
              dueDate: { type: Type.STRING }
            }
          }
        }
      },
      required: ["tasks"]
    }
  },
  {
    name: "reconcile_client_holdings",
    description: "Consolida ativos de extratos/prints na planilha mestra.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        holdings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ticker: { type: Type.STRING },
              class: { type: Type.STRING },
              value: { type: Type.NUMBER },
              platform: { type: Type.STRING }
            }
          }
        }
      },
      required: ["holdings"]
    }
  },
  {
    name: "run_gap_analysis",
    description: "Calcula o gap entre a carteira atual e a recomendada AUVP.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        risk_profile: { type: Type.STRING, enum: ["Conservador", "Moderado", "Arrojado"] }
      },
      required: ["risk_profile"]
    }
  }
];

export const sendMessageToGemini = async (message: string, mode: ChatMode = 'CONSULTANCY') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = mode === 'SEARCH' ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
  
  const config = {
    systemInstruction: `Você é o "Century Sovereign Brain".
    Especialista em Multi Family Office e Protocolo AUVP.
    Sua missão é orquestrar o fluxo: Reunião -> Dados -> Análise -> Relatório.
    
    DIRETRIZES:
    - Sempre utilize as ferramentas (tools) para atualizar o dashboard quando identificar dados financeiros ou tarefas.
    - O tom deve ser ultra-profissional, estilo private banking suíço, mas com agilidade Apple.
    - Se o usuário falar sobre ativos ou extratos, use reconcile_client_holdings.
    - Se o usuário falar sobre reuniões ou pendências, use analyze_meeting_transcript.`,
    tools: [{ functionDeclarations: specialistTools }]
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: message,
      config: config,
    });

    const actions: any[] = [];
    if (response.functionCalls) {
      response.functionCalls.forEach(call => {
        actions.push({
          agentId: call.name.split('_')[0],
          agentName: call.name.replace(/_/g, ' ').toUpperCase(),
          tool: call.name,
          params: call.args,
          status: 'completed',
          timestamp: new Date()
        });
      });
    }

    return { text: response.text || "Comando processado com sucesso pelo Motor Century.", actions };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
