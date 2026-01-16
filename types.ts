
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; uri: string }>;
  actions?: Array<AgentAction>;
}

export interface AgentAction {
  agentId: string;
  agentName: string;
  tool: string;
  params: any;
  status: 'executing' | 'completed' | 'error';
  timestamp: Date;
}

export interface FactHolding {
  id: string;
  ticker: string;
  class: 'Renda Fixa' | 'Ações Brasil' | 'FIIs' | 'Internacional' | 'Cripto' | 'Caixa';
  quantity: number;
  currentValue: number;
  platform: string;
}

export interface FactTask {
  id: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'DONE';
  source: string;
  dueDate: string;
}

export interface StarSchemaState {
  clientName: string;
  role: string;
  revenue: number;
  profile: 'Conservador' | 'Moderado' | 'Arrojado';
  holdings: FactHolding[];
  tasks: FactTask[];
  gapAnalysis: Array<{ class: string; current: number; target: number; delta: number }>;
  documents: Array<{ id: string; name: string; type: string; status: 'VALIDATED' | 'PENDING' }>;
  transcript?: string;
  checklist: {
    transcriptAttached: boolean;
    tasksSynced: boolean;
    docsValidated: boolean;
    riskDefined: boolean;
    gapCalculated: boolean;
    previewReviewed: boolean;
  };
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  icon: any;
  color: string;
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export type ChatMode = 'CONSULTANCY' | 'THINKING' | 'WORKSPACE' | 'SEARCH';
