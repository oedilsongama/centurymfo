
import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, FileText, TrendingUp, Target, Calendar, Clock, 
  LayoutDashboard, UserCircle, MessageSquare, ClipboardList, 
  FileSearch, BarChart3, PieChart as PieChartIcon, Settings, 
  ChevronDown, Search, Plus, Bell, HelpCircle, MoreHorizontal,
  ArrowUpRight, ShieldCheck, Download, X, Mic, MicOff, Send, Paperclip, 
  Cpu, Layers, Binary, CheckCircle2, Wallet, FolderOpen, User,
  FileSpreadsheet, ExternalLink, Activity, CheckCircle
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Message, ChatMode, AgentAction, StarSchemaState, FactHolding, FactTask } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { LiveBrainSession } from './services/liveAudioService';

const ALLOCATION_DATA = [
  { name: 'Renda Fixa', value: 40, color: '#3b82f6' },
  { name: 'Ações Brasil', value: 25, color: '#eab308' },
  { name: 'FIIs', value: 15, color: '#10b981' },
  { name: 'Internacional', value: 15, color: '#8b5cf6' },
  { name: 'Caixa', value: 5, color: '#6b7280' },
];

const RECENT_CLIENTS = [
  { id: 1, name: 'Pedro Henrique Lima', role: 'Empresário', profile: 'Moderado', wealth: 'R$ 540.000/ano', progress: 50, tasks: '1 pendente' },
  { id: 2, name: 'Maria Carolina Santos', role: 'Médica', profile: 'Arrojado', wealth: 'R$ 780.000/ano', progress: 10, tasks: '1 pendente' },
  { id: 3, name: 'João Roberto Ferreira', role: 'Aposentado', profile: 'Conservador', wealth: 'R$ 300.000/ano', progress: 100, tasks: 'Tudo em dia' },
];

const WORKFLOW_STEPS = [
  { id: 'admin', icon: Calendar, label: 'Reunião', count: 12, done: true },
  { id: 'tasks', icon: ClipboardList, label: 'Tarefas', count: 8, done: true },
  { id: 'docs', icon: FolderOpen, label: 'Documentos', count: 5, active: true },
  { id: 'sheet', icon: FileSpreadsheet, label: 'Planilha', count: 0 },
  { id: 'profile', icon: Target, label: 'Perfil', count: 0 },
  { id: 'wallet', icon: PieChartIcon, label: 'Carteira', count: 0 },
  { id: 'gap', icon: BarChart3, label: 'Gap', count: 0 },
  { id: 'report', icon: FileText, label: 'Relatório', count: 0 },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [isBrainOpen, setIsBrainOpen] = useState(false);

  // Sovereign Schema State - Source of Truth
  const [schema, setSchema] = useState<StarSchemaState>({
    clientName: 'Pedro Henrique Lima',
    role: 'Empresário',
    revenue: 540000,
    profile: 'Moderado',
    holdings: [
      { id: 'h1', ticker: 'MXRF11', class: 'FIIs', quantity: 100, currentValue: 1050, platform: 'XP' },
      { id: 'h2', ticker: 'ITUB4', class: 'Ações Brasil', quantity: 50, currentValue: 1750, platform: 'BTG' },
    ],
    tasks: [
      { id: 't1', title: 'Analisar perfil de risco', priority: 'HIGH', status: 'PENDING', source: 'Pedro', dueDate: '25 Jan' },
      { id: 't2', title: 'Preparar relatório de proposta', priority: 'MEDIUM', status: 'PENDING', source: 'Maria', dueDate: '28 Fev' },
    ],
    gapAnalysis: [
      { class: 'Renda Fixa', current: 50, target: 40, delta: 10 },
      { class: 'Ações Brasil', current: 15, target: 25, delta: -10 },
    ],
    documents: [
      { id: 'd1', name: 'Extrato_XP_Dez.pdf', type: 'Extrato', status: 'VALIDATED' },
      { id: 'd2', name: 'Print_BTG_Ativos.png', type: 'Print', status: 'PENDING' },
    ],
    checklist: {
      transcriptAttached: true,
      tasksSynced: true,
      docsValidated: false,
      riskDefined: true,
      gapCalculated: true,
      previewReviewed: false
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<LiveBrainSession | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleToolAction = (action: AgentAction) => {
    switch (action.tool) {
      case 'analyze_meeting_transcript':
        const newTasks = action.params.tasks.map((t: any) => ({
          id: Math.random().toString(),
          title: t.title,
          priority: t.priority,
          status: 'PENDING',
          source: 'Century AI',
          dueDate: t.dueDate || 'A definir'
        }));
        setSchema(prev => ({ ...prev, tasks: [...prev.tasks, ...newTasks], checklist: { ...prev.checklist, tasksSynced: true } }));
        break;
      case 'reconcile_client_holdings':
        const newHoldings = action.params.holdings.map((h: any) => ({
          id: Math.random().toString(),
          ticker: h.ticker,
          class: h.class,
          currentValue: h.value,
          platform: h.platform,
          quantity: 1
        }));
        setSchema(prev => ({ ...prev, holdings: [...prev.holdings, ...newHoldings], checklist: { ...prev.checklist, docsValidated: true } }));
        break;
      case 'run_gap_analysis':
        setSchema(prev => ({ ...prev, checklist: { ...prev.checklist, gapCalculated: true } }));
        setActiveTab('Gap Analysis');
        break;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsBrainOpen(true);

    try {
      const result = await sendMessageToGemini(input, 'CONSULTANCY');
      if (result.actions) result.actions.forEach(handleToolAction);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        actions: result.actions
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "O motor cerebral Century encontrou uma interferência. Reconectando...", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLive = async () => {
    if (isLiveActive) {
      await liveSessionRef.current?.stop();
      liveSessionRef.current = null;
      setIsLiveActive(false);
    } else {
      setIsLiveActive(true);
      setIsBrainOpen(true);
      const session = new LiveBrainSession((text, isUser) => {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && ((isUser && lastMsg.role === 'user') || (!isUser && lastMsg.role === 'assistant'))) {
            const updated = [...prev];
            updated[updated.length - 1] = { ...lastMsg, content: lastMsg.content + text };
            return updated;
          } else {
            return [...prev, { id: Date.now().toString(), role: isUser ? 'user' : 'assistant', content: text, timestamp: new Date() }];
          }
        });
      });
      await session.start();
      liveSessionRef.current = session;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Clientes', value: '47', change: '+12%', icon: Users },
          { label: 'AUM Total', value: 'R$ 45.8M', change: '+8.5%', icon: TrendingUp },
          { label: 'Relatórios Gerados', value: '23', change: '+23%', icon: FileText },
          { label: 'Taxa de Conversão', value: '78.5%', change: '+5.2%', icon: Target },
        ].map((m, i) => (
          <div key={i} className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex justify-between items-start group hover:border-accent/20 transition-all">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="bg-white/5 p-3 rounded-2xl text-muted"><m.icon size={22} /></div>
                 <span className="text-xs text-green-500 font-black tracking-tight">{m.change}</span>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black tracking-tighter">{m.value}</p>
                <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-60">{m.label}</p>
              </div>
            </div>
            <div className="w-16 h-10 opacity-10 group-hover:opacity-30 transition-opacity">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[{v: 10}, {v: 15}, {v: 8}, {v: 20}]}>
                   <Bar dataKey="v" fill="#eab308" radius={2} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Section */}
      <div className="bg-[#111] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="px-10 py-6 flex justify-between items-center bg-white/[0.02]">
           <div>
             <h3 className="font-black text-lg">Fluxo de Trabalho</h3>
             <p className="text-[11px] text-muted font-bold uppercase tracking-widest opacity-40">Visão geral do processo de consultoria</p>
           </div>
           <button className="text-xs text-accent font-black flex items-center gap-2 hover:underline">Ver detalhes <ArrowUpRight size={14} /></button>
        </div>
        <div className="p-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 border-t border-white/5">
           {WORKFLOW_STEPS.map((step, i) => (
             <div key={i} className={`flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all duration-500 cursor-pointer ${step.active ? 'bg-accent/10 border-accent/40 shadow-lg shadow-accent/5' : 'border-white/5 bg-white/2 hover:border-white/10'}`}>
                <div className={`relative ${step.done ? 'text-green-500' : 'text-muted'}`}>
                  <step.icon size={28} />
                  {step.count > 0 && <span className="absolute -top-2 -right-2 bg-accent text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111]">{step.count}</span>}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{step.label}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Recent Clients */}
        <div className="col-span-12 xl:col-span-8 bg-[#111] rounded-[3rem] border border-white/5 shadow-premium overflow-hidden">
          <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-black text-xl tracking-tight">Clientes Recentes</h3>
            <button className="text-xs text-muted font-black uppercase tracking-widest hover:text-white transition-colors">Ver todos ↗</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-[10px] text-muted font-black uppercase tracking-[0.3em] text-left">
                <tr>
                  <th className="px-10 py-6">Cliente</th>
                  <th className="px-6 py-6">Perfil</th>
                  <th className="px-6 py-6">Patrimônio</th>
                  <th className="px-6 py-6">Progresso</th>
                  <th className="px-6 py-6">Tarefas</th>
                  <th className="px-10 py-6"></th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium">
                {RECENT_CLIENTS.map(client => (
                  <tr key={client.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-7 flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-accent font-black text-sm uppercase">
                         {client.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-black text-white text-[15px]">{client.name}</p>
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-50">{client.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-7">
                      <span className={`px-4 py-1.5 rounded-full border ${client.profile === 'Arrojado' ? 'border-red-500/20 bg-red-500/5 text-red-400' : 'border-accent/20 bg-accent/5 text-accent'} text-[9px] font-black uppercase tracking-widest`}>
                        {client.profile}
                      </span>
                    </td>
                    <td className="px-6 py-7 font-black text-gray-300 tracking-tight">{client.wealth}</td>
                    <td className="px-6 py-7">
                       <div className="w-28 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{width: `${client.progress}%`}}></div>
                       </div>
                    </td>
                    <td className="px-6 py-7">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${client.tasks.includes('pendente') ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                        {client.tasks}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-muted text-right"><MoreHorizontal size={20} className="cursor-pointer hover:text-white" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action List & Pie Chart */}
        <div className="col-span-12 xl:col-span-4 space-y-8">
           <div className="bg-[#111] rounded-[3rem] border border-white/5 p-8 shadow-premium">
             <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <h3 className="font-black text-lg tracking-tight">Tarefas Pendentes</h3>
                <button className="text-xs text-muted hover:text-white font-black uppercase tracking-widest">Ver todas ↗</button>
             </div>
             <div className="space-y-8">
                {schema.tasks.map(task => (
                  <div key={task.id} className="flex gap-5 group cursor-pointer animate-in slide-in-from-right duration-500">
                    <div className="mt-1 w-5 h-5 rounded-lg border-2 border-white/10 group-hover:border-accent transition-colors flex items-center justify-center">
                       {task.status === 'DONE' && <CheckCircle2 size={12} className="text-accent" />}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-[13px] tracking-tight">{task.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${task.priority === 'HIGH' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                           {task.priority === 'HIGH' ? 'alta' : 'media'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted font-bold opacity-60">Consultor deve finalizar a etapa conforme diretrizes Century.</p>
                      <div className="flex items-center gap-4 text-[9px] text-muted font-black tracking-widest pt-1">
                         <span className="flex items-center gap-2 uppercase opacity-40"><UserCircle size={12} /> {task.source}</span>
                         <span className="flex items-center gap-2 uppercase opacity-40"><Clock size={12} /> {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
           </div>

           <div className="bg-[#111] rounded-[3rem] border border-white/5 p-8 shadow-premium relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
             <h3 className="font-black text-lg tracking-tight mb-2">Alocação Média</h3>
             <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-40 mb-8">Distribuição agregada da carteira</p>
             <div className="h-64 relative mb-6">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={ALLOCATION_DATA} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                       {ALLOCATION_DATA.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '16px' }} />
                   </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-3xl font-black">78.5%</p>
                   <p className="text-[8px] text-muted font-black uppercase">Consolidado</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                {ALLOCATION_DATA.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] text-muted font-black tracking-widest hover:text-white transition-colors">
                    <div className="w-2.5 h-2.5 rounded-md" style={{backgroundColor: item.color}}></div>
                    {item.name}
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] text-gray-100 font-sans selection:bg-accent/30 overflow-hidden">
      {/* High-End Sidebar */}
      <aside className="w-72 bg-[#111] border-r border-white/5 flex flex-col shrink-0 z-50">
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-2xl shadow-accent/20 rotate-3">C</div>
          <div>
            <h2 className="text-lg font-black tracking-tighter leading-none">Century</h2>
            <p className="text-[9px] text-muted font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">Sovereign MFO</p>
          </div>
        </div>

        <nav className="flex-1 px-6 py-6 space-y-12 overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <p className="px-5 text-[10px] font-black text-muted uppercase tracking-[0.4em] mb-6 opacity-30">Principal</p>
            {[
              { id: 'Dashboard', icon: LayoutDashboard },
              { id: 'Clientes', icon: UserCircle },
              { id: 'Reuniões', icon: Calendar },
              { id: 'Tarefas', icon: ClipboardList, count: 5 },
            ].map(item => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all relative group ${activeTab === item.id ? 'bg-white/[0.05] text-accent' : 'text-muted hover:bg-white/[0.02] hover:text-white'}`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={18} className={activeTab === item.id ? 'text-accent' : 'text-muted group-hover:text-white'} />
                  {item.id}
                </div>
                {item.count && <span className="bg-accent/10 text-accent text-[9px] px-2 py-0.5 rounded-lg font-black">{item.count}</span>}
                {activeTab === item.id && <div className="absolute left-0 w-1.5 h-6 bg-accent rounded-r-full shadow-[0_0_15px_#eab308]"></div>}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="px-5 text-[10px] font-black text-muted uppercase tracking-[0.4em] mb-6 opacity-30">Consultoria</p>
            {[
              { id: 'Documentos', icon: FolderOpen },
              { id: 'Planilha Mestra', icon: FileSpreadsheet },
              { id: 'Perfil de Risco', icon: Target },
              { id: 'Carteiras', icon: PieChartIcon },
              { id: 'Gap Analysis', icon: BarChart3 },
              { id: 'Relatórios', icon: FileText },
            ].map(item => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group ${activeTab === item.id ? 'bg-white/[0.05] text-accent' : 'text-muted hover:bg-white/[0.02] hover:text-white'}`}
              >
                <item.icon size={18} className={activeTab === item.id ? 'text-accent' : 'text-muted group-hover:text-white'} />
                {item.id}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-8 border-t border-white/5 space-y-4 bg-white/[0.01]">
           <button className="w-full flex items-center gap-4 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted hover:text-white transition-colors group"><MessageSquare size={18} /> Fluxo Digital</button>
           <button className="w-full flex items-center gap-4 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-muted hover:text-white transition-colors group"><Settings size={18} /> Configurações</button>
           <div className="pt-4 flex items-center justify-between px-5 opacity-20">
              <span className="text-[9px] font-black uppercase tracking-widest italic">V3.2 SOBERANO</span>
              <Activity size={14} className="text-green-500 animate-pulse" />
           </div>
        </div>
      </aside>

      {/* Main Orchestrator View */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-12 shrink-0 bg-[#0a0a0a]/80 backdrop-blur-3xl z-40">
           <div className="flex items-center gap-10">
              <h2 className="text-2xl font-black tracking-tight text-white">{activeTab}</h2>
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-all" />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-[13px] font-medium focus:outline-none focus:border-accent/40 w-96 transition-all shadow-inner focus:bg-white/[0.07]"
                />
              </div>
           </div>

           <div className="flex items-center gap-8">
              <button className="bg-accent hover:bg-accent/90 hover:scale-105 active:scale-95 text-black px-7 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-2xl shadow-accent/20">
                <Plus size={18} strokeWidth={4} /> Novo
              </button>
              <div className="flex items-center gap-5">
                 <button className="text-muted hover:text-white p-2.5 bg-white/5 rounded-xl transition-all hover:bg-white/10"><HelpCircle size={22} /></button>
                 <button className="text-muted hover:text-white p-2.5 bg-white/5 rounded-xl relative transition-all hover:bg-white/10 group">
                    <Bell size={22} />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full border-2 border-[#111]"></span>
                 </button>
              </div>
              <div className="h-10 w-px bg-white/10"></div>
              <div className="flex items-center gap-4 cursor-pointer hover:bg-white/5 p-2 rounded-2xl transition-all group">
                 <div className="text-right">
                    <p className="text-[13px] font-black leading-none mb-1">Guilherme Roessing</p>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-50">Especialista MFO</p>
                 </div>
                 <div className="w-12 h-12 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center font-black text-sm text-accent shadow-premium group-hover:rotate-3 transition-transform">GR</div>
                 <ChevronDown size={16} className="text-muted group-hover:text-white transition-colors" />
              </div>
           </div>
        </header>

        <main className="flex-1 p-12 overflow-y-auto no-scrollbar relative bg-[#0a0a0a]">
           {activeTab === 'Dashboard' && renderDashboard()}
           {activeTab !== 'Dashboard' && (
             <div className="flex flex-col items-center justify-center h-full text-muted space-y-4 animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center shadow-inner"><Binary size={48} className="opacity-20" /></div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">Engine Century Orquestrando {activeTab}...</p>
             </div>
           )}
           
           {/* Floating Brain Assistant Integration */}
           <div className="fixed bottom-12 right-12 z-[100]">
              <div className="flex flex-col items-end gap-6">
                 {isBrainOpen && (
                   <div className="bg-[#111]/95 backdrop-blur-3xl border border-white/10 p-8 rounded-[4rem] w-[450px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-in zoom-in slide-in-from-bottom-12 duration-500">
                      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center text-black shadow-lg shadow-accent/20 animate-pulse"><Cpu size={20} /></div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Century Brain</p>
                               <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-40">Motor Operacional Ativo</p>
                            </div>
                         </div>
                         <button onClick={() => setIsBrainOpen(false)} className="text-muted hover:text-white p-2 bg-white/5 rounded-xl transition-all"><X size={18} /></button>
                      </div>
                      
                      <div className="max-h-[400px] overflow-y-auto space-y-6 no-scrollbar mb-8 text-[14px] leading-relaxed pr-2">
                         {messages.length === 0 ? (
                           <div className="py-12 text-center space-y-4">
                              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-muted opacity-30 rotate-12"><MessageSquare size={32} /></div>
                              <p className="text-muted font-black uppercase text-[10px] tracking-[0.3em] opacity-40 italic leading-loose">Recebendo inputs de voz e dados estratégicos.<br/>Ponto de controle: Reunião Pedro Lima.</p>
                           </div>
                         ) : messages.map(m => (
                           <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in duration-500`}>
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${m.role === 'assistant' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/10 text-white'}`}>
                                 {m.role === 'assistant' ? <Cpu size={14} /> : <User size={14} />}
                              </div>
                              <div className={`p-5 rounded-3xl ${m.role === 'assistant' ? 'bg-white/5 border border-white/5 text-gray-200' : 'bg-accent/10 border border-accent/10 text-accent font-bold'} shadow-sm text-xs`}>
                                 {m.content}
                              </div>
                           </div>
                         ))}
                         {isLoading && (
                           <div className="flex items-center gap-4 text-muted animate-pulse px-2">
                              <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center"><Binary size={14} /></div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Consultoria Sovereign Processando...</span>
                           </div>
                         )}
                      </div>

                      <div className="flex items-center gap-3 bg-white/5 rounded-[2.5rem] p-4 border border-white/10 shadow-inner group focus-within:border-accent/40 transition-all">
                        <button className="p-2 text-muted hover:text-white transition-colors"><Paperclip size={22} /></button>
                        <input 
                           value={input}
                           onChange={(e) => setInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                           placeholder="Qual o próximo gate do fluxo?" 
                           className="flex-1 bg-transparent border-none outline-none p-2 text-xs font-black uppercase tracking-widest text-white placeholder:text-muted/20"
                        />
                        <button 
                           onClick={handleSend}
                           disabled={!input.trim() || isLoading}
                           className="bg-accent text-black p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-20"
                        >
                          <Send size={18} strokeWidth={3} />
                        </button>
                      </div>
                   </div>
                 )}
                 
                 <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setIsBrainOpen(!isBrainOpen)}
                      className={`p-6 rounded-[2rem] bg-[#111] border border-white/10 shadow-2xl hover:scale-105 active:scale-95 transition-all group ${isBrainOpen ? 'text-accent border-accent/40 shadow-accent/20' : 'text-muted hover:text-white'}`}
                    >
                       <MessageSquare size={32} className="group-hover:rotate-12 transition-transform" />
                    </button>
                    <button 
                      onClick={toggleLive}
                      className={`w-24 h-24 rounded-[3.5rem] flex items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,0.6)] transition-all relative overflow-hidden group ${isLiveActive ? 'bg-red-500 scale-110 shadow-red-500/30' : 'bg-accent shadow-accent/30 hover:scale-105 active:scale-95'}`}
                    >
                       {isLiveActive && <div className="absolute inset-0 bg-white/20 animate-ping opacity-30"></div>}
                       {isLiveActive ? <MicOff size={40} className="text-white z-10" /> : <Mic size={40} className="text-black z-10" />}
                    </button>
                 </div>
              </div>
           </div>
        </main>
      </div>

      {/* High Fidelity Institutional Report Preview */}
      {showReportPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-10 animate-in fade-in duration-500">
           <div className="bg-[#111] w-full max-w-6xl h-full rounded-[5rem] border border-white/10 flex flex-col shadow-2xl overflow-hidden">
             <div className="px-16 py-12 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-8">
                   <div className="w-20 h-20 bg-accent rounded-[2.5rem] flex items-center justify-center text-black shadow-2xl rotate-6 transition-transform hover:rotate-0"><FileText size={40} strokeWidth={2.5} /></div>
                   <div>
                     <h2 className="text-4xl font-black tracking-tighter">Proposta Estratégica</h2>
                     <p className="text-[13px] font-black text-muted uppercase tracking-[0.4em] mt-2 flex items-center gap-3">
                       <ShieldCheck size={18} className="text-accent" /> Century Sovereign Intelligence • AUVP V3.2
                     </p>
                   </div>
                </div>
                <div className="flex gap-6">
                  <button onClick={() => setShowReportPreview(false)} className="px-12 py-5 bg-accent hover:bg-accent/90 text-black rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-accent/20 hover:scale-105 transition-all flex items-center gap-4">
                    <Download size={22} /> Gerar PDF Final
                  </button>
                  <button onClick={() => setShowReportPreview(false)} className="p-5 bg-white/5 border border-white/10 rounded-3xl text-muted hover:text-white transition-all shadow-sm"><X size={32} /></button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-24 space-y-32 no-scrollbar bg-[#0a0a0a]">
                <section className="grid grid-cols-12 gap-20 items-center">
                  <div className="col-span-7 space-y-10">
                    <span className="px-6 py-2.5 bg-accent/10 text-accent rounded-full text-[11px] font-black uppercase tracking-[0.4em] border border-accent/20">Client Review</span>
                    <h3 className="text-7xl font-black tracking-tighter leading-tight text-white">Pedro Henrique<br/><span className="text-accent">Lima</span></h3>
                    <p className="text-muted text-2xl leading-relaxed font-medium opacity-80 max-w-xl">Estruturação patrimonial e governança multigeracional processada pelo sistema Century Sovereign Intelligence para o ciclo de 2026.</p>
                  </div>
                  <div className="col-span-5 grid gap-8">
                    {[
                      { l: 'Patrimônio Auditado', v: 'R$ 1.145.890', i: Wallet, c: 'text-blue-400' },
                      { l: 'Perfil de Risco', v: 'Moderado', i: Target, c: 'text-accent' },
                      { l: 'Score de Governança', v: 'Tier IV Soberano', i: ShieldCheck, c: 'text-green-400' }
                    ].map((it, idx) => (
                      <div key={idx} className="bg-white/5 p-10 rounded-[3.5rem] border border-white/10 flex items-center justify-between hover:bg-white/[0.08] transition-all">
                         <div className="space-y-2">
                            <p className="text-[11px] font-black text-muted uppercase tracking-widest opacity-50">{it.l}</p>
                            <p className={`text-3xl font-black ${it.c}`}>{it.v}</p>
                         </div>
                         <div className={`p-5 bg-white/5 rounded-[1.75rem] ${it.c} shadow-inner`}><it.i size={32} /></div>
                      </div>
                    ))}
                  </div>
                </section>
                
                <section className="space-y-16">
                   <div className="flex justify-between items-end border-b border-white/5 pb-10">
                      <div>
                        <h4 className="text-4xl font-black tracking-tight text-white">Gap Analysis AUVP</h4>
                        <p className="text-[12px] font-black text-muted uppercase tracking-[0.3em] mt-3 opacity-50">Divergência entre alocação atual e recomendada</p>
                      </div>
                   </div>
                   <div className="h-[450px] w-full bg-white/[0.02] rounded-[5rem] p-16 border border-white/5 shadow-inner">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[{class: 'RF', c: 50, t: 40}, {class: 'Ações', c: 15, t: 25}, {class: 'FIIs', c: 10, t: 15}, {class: 'Intl', c: 20, t: 15}, {class: 'Caixa', c: 5, t: 5}]}>
                           <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                           <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 14, fontWeight: 900}} />
                           <YAxis hide />
                           <Bar dataKey="c" fill="#eab308" radius={[15, 15, 0, 0]} barSize={60} />
                           <Bar dataKey="t" fill="rgba(255,255,255,0.1)" radius={[15, 15, 0, 0]} barSize={60} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </section>
             </div>
             
             <footer className="px-16 py-12 border-t border-white/5 flex items-center justify-between bg-black/50">
                <div className="flex items-center gap-6">
                   <p className="text-[12px] font-black text-muted uppercase tracking-[0.5em]">Century Multi Family Office Proprietary Document</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]"></div>
                   <p className="text-[11px] font-black text-accent uppercase tracking-[0.3em]">Criptografia Sovereign Ativa</p>
                </div>
             </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
