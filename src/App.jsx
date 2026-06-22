import React, { useState, useEffect } from 'react';
import { 
  Play, CheckCircle, AlertTriangle, QrCode, Trash2, 
  Plus, Users, Settings, Package, Home, BarChart2, 
  TrendingUp, Wrench, Truck, ShieldAlert, FileSpreadsheet, MessageSquare,
  Sun, Moon, User, Layers, Calendar, Menu, X
} from 'lucide-react';
import { Client, Databases } from 'appwrite';

const client = new Client();

client
    // Cole aqui o seu endpoint regional (o mesmo que funcionou no Python!)
    .setEndpoint('https://eu.cloud.appwrite.io/v1') 
    // Cole aqui o seu Project ID que está no seu arquivo .env ou painel
    .setProject('6a3836060035d3d489d3'); 

export const databases = new Databases(client);

// Deixe os IDs das tabelas aqui para facilitar o uso nos componentes
export const DATABASE_ID = '6a383648000d85e5fca5';
export const TABELA_LOTES_ID = 'lotes';

import { ID } from 'appwrite';
import { databases, DATABASE_ID, TABELA_LOTES_ID } from './appwriteConfig';

function SeuFormulario() {
  
  const handleCadastrarLote = async (dadosDoFormulario) => {
    try {
      // Envia os dados direto para o Appwrite
      const resposta = await databases.createDocument(
        DATABASE_ID,
        TABELA_LOTES_ID,
        ID.unique(), // Gera o ID automático da linha (row)
        {
          numero: dadosDoFormulario.numero,
          cliente: dadosDoFormulario.cliente.toUpperCase(),
          servico: dadosDoFormulario.servico,
          totalpecas: parseInt(dadosDoFormulario.totalPecas), // Lembra que ficou tudo minúsculo no banco?
          pecasProntas: 0,
          pecasDefeito: 0,
          status: 'A Iniciar',
          progresso: 0,
          precoUnitario: parseFloat(dadosDoFormulario.precoUnitario)
        }
      );

      console.log("✅ Lote salvo no Appwrite!", resposta);
      alert("Lote cadastrado com sucesso! 🚀");

    } catch (error) {
      console.error("❌ Erro ao salvar no Appwrite:", error);
      alert("Erro ao salvar o lote.");
    }
  }};
export default function FacaoProERP() {
  // --- ESTADOS DO SISTEMA ---
  const [telaAtiva, setTelaAtiva] = useState('inicio');
  const [menuMobileAberto, setMenuMobileAberto] = useState(false); // Novo estado para o menu responsivo
  const [darkMode, setDarkMode] = useState(() => {
    const salvo = localStorage.getItem('fp_dark_mode');
    return salvo !== null ? JSON.parse(salvo) : true;
  });
  
  const [servicos, setServicos] = useState(() => JSON.parse(localStorage.getItem('fp_servicos')) || []);
  const [lotes, setLotes] = useState(() => JSON.parse(localStorage.getItem('fp_lotes')) || []);
  const [equipe, setEquipe] = useState(() => JSON.parse(localStorage.getItem('fp_equipe')) || []);
  const [cortes, setCortes] = useState(() => JSON.parse(localStorage.getItem('fp_cortes')) || []);
  const [maquinas, setMaquinas] = useState(() => JSON.parse(localStorage.getItem('fp_maquinas')) || []);
  const [coletas, setColetas] = useState(() => JSON.parse(localStorage.getItem('fp_coletas')) || []);

  // --- ESTADOS DAS MELHORIAS ---
  const [operadorSelecionado, setOperadorSelecionado] = useState('');
  const [filtroLoteRelatorio, setFiltroLoteRelatorio] = useState('todos');

  // --- FORMULÁRIOS ---
  const [novoServico, setNovoServico] = useState({ nome: '', preco: '' });
  const [novoLote, setNovoLote] = useState({ numero: '', servico: '', totalPecas: '', cliente: '' });
  const [novoCorte, setNovoCorte] = useState({ loteId: '', pesoRolo: '', pecasObtidas: '' });
  const [novaMaquina, setNovaMaquina] = useState({ nome: '', codigo: '', revisaoDias: '' });
  const [novaColeta, setNovaColeta] = useState({ loteId: '', motorista: '', destino: '' });
  const [novoColaborador, setNovoColaborador] = useState({ nome: '', funcao: '' });

  // --- SALVAMENTO AUTOMÁTICO (EFEITOS) ---
  useEffect(() => { localStorage.setItem('fp_dark_mode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('fp_servicos', JSON.stringify(servicos)); }, [servicos]);
  useEffect(() => { localStorage.setItem('fp_lotes', JSON.stringify(lotes)); }, [lotes]);
  useEffect(() => { localStorage.setItem('fp_equipe', JSON.stringify(equipe)); }, [equipe]);
  useEffect(() => { localStorage.setItem('fp_cortes', JSON.stringify(cortes)); }, [cortes]);
  useEffect(() => { localStorage.setItem('fp_maquinas', JSON.stringify(maquinas)); }, [maquinas]);
  useEffect(() => { localStorage.setItem('fp_coletas', JSON.stringify(coletas)); }, [coletas]);

  // --- FUNÇÕES OPERACIONAIS ---
  const cadastrarServico = (e) => {
    e.preventDefault();
    if (!novoServico.nome || !novoServico.preco) return;
    setServicos([...servicos, { id: Date.now(), nome: novoServico.nome.toUpperCase(), preco: parseFloat(novoServico.preco) }]);
    setNovoServico({ nome: '', preco: '' });
  };

  const cadastrarLote = (e) => {
    e.preventDefault();
    if (lotes.some(l => l.numero === novoLote.numero)) {
      alert("Este número de lote já existe!");
      return;
    }
    const servicoEncontrado = servicos.find(s => s.nome === novoLote.servico);
    const precoUnitario = servicoEncontrado ? servicoEncontrado.preco : 0;

    const loteCriado = {
      id: Date.now(),
      numero: novoLote.numero,
      servico: novoLote.servico,
      cliente: novoLote.cliente.toUpperCase(),
      totalPecas: parseInt(novoLote.totalPecas),
      pecasProntas: 0,
      pecasDefeito: 0,
      status: 'A Iniciar',
      progresso: 0,
      precoUnitario: precoUnitario,
      historicoBipagem: []
    };

    setLotes([...lotes, loteCriado]);
    setNovoLote({ numero: '', servico: '', totalPecas: '', cliente: '' });
  };

  const biparPecaAvançado = (id, tipo = 'sucesso') => {
    if (!operadorSelecionado && tipo === 'sucesso') {
      alert("Por favor, selecione qual costureiro(a) está operando antes de bipar!");
      return;
    }

    setLotes(lotes.map(lote => {
      if (lote.id === id) {
        const totalAtual = lote.pecasProntas + lote.pecasDefeito;
        if (totalAtual >= lote.totalPecas) {
          alert("Este lote já atingiu a quantidade total planejada!");
          return lote;
        }

        let novasProntas = lote.pecasProntas;
        let novosDefeitos = lote.pecasDefeito;
        let novoLog = [...lote.historicoBipagem];

        if (tipo === 'sucesso') {
          novasProntas += 1;
          novoLog.push({
            id: Date.now(),
            operador: operadorSelecionado,
            tipo: 'Sucesso',
            hora: new Date().toLocaleTimeString('pt-BR')
          });
        } else {
          novosDefeitos += 1;
          novoLog.push({
            id: Date.now(),
            operador: operadorSelecionado || 'Não Informado',
            tipo: 'Defeito/Segunda Linha',
            hora: new Date().toLocaleTimeString('pt-BR')
          });
        }

        const totalProcessado = novasProntas + novosDefeitos;
        const novoProgresso = Math.round((totalProcessado / lote.totalPecas) * 100);
        
        let novoStatus = lote.status;
        if (totalProcessado > 0 && totalProcessado < lote.totalPecas) novoStatus = 'Em Costura';
        if (totalProcessado === lote.totalPecas) novoStatus = 'Pronto';

        return { 
          ...lote, 
          pecasProntas: novasProntas, 
          pecasDefeito: novosDefeitos,
          progresso: novoProgresso,
          status: novoStatus,
          historicoBipagem: novoLog
        };
      }
      return lote;
    }));
  };

  const avancarStatusManual = (id) => {
    setLotes(lotes.map(l => {
      if (l.id === id) {
        if (l.status === 'A Iniciar') return { ...l, status: 'Em Costura', progresso: 50 };
        if (l.status === 'Em Costura') return { ...l, status: 'Pronto', pecasProntas: l.totalPecas, progresso: 100 };
      }
      return l;
    }));
  };

  const voltarStatusManual = (id) => {
    setLotes(lotes.map(l => {
      if (l.id === id) {
        if (l.status === 'Pronto') return { ...l, status: 'Em Costura', progresso: 50 };
        if (l.status === 'Em Costura') return { ...l, status: 'A Iniciar', pecasProntas: 0, pecasDefeito: 0, progresso: 0 };
      }
      return l;
    }));
  };

  const deletarLote = (id) => {
    if (confirm("Deseja realmente remover este lote permanentemente?")) {
      setLotes(lotes.filter(l => l.id !== id));
    }
  };

  const cadastrarCorte = (e) => {
    e.preventDefault();
    const loteAlvo = lotes.find(l => l.id === parseInt(novoCorte.loteId));
    const rendimento = (parseInt(novoCorte.pecasObtidas) / parseFloat(novoCorte.pesoRolo)).toFixed(2);
    
    setCortes([...cortes, {
      id: Date.now(),
      loteNumero: loteAlvo ? loteAlvo.numero : 'S/N',
      pesoRolo: parseFloat(novoCorte.pesoRolo),
      pecasObtidas: parseInt(novoCorte.pecasObtidas),
      rendimento: rendimento
    }]);
    setNovoCorte({ loteId: '', pesoRolo: '', pecasObtidas: '' });
  };

  const cadastrarMaquina = (e) => {
    e.preventDefault();
    setMaquinas([...maquinas, {
      id: Date.now(),
      nome: novaMaquina.nome.toUpperCase(),
      codigo: novaMaquina.codigo,
      revisaoDias: novaMaquina.revisaoDias,
      status: 'Operacional'
    }]);
    setNovaMaquina({ nome: '', codigo: '', revisaoDias: '' });
  };

  const alternarStatusMaquina = (id) => {
    setMaquinas(maquinas.map(m => m.id === id ? { ...m, status: m.status === 'Operacional' ? 'Em Manutenção' : 'Operacional' } : m));
  };

  const cadastrarColeta = (e) => {
    e.preventDefault();
    const loteAlvo = lotes.find(l => l.id === parseInt(novaColeta.loteId));
    setColetas([...coletas, {
      id: Date.now(),
      loteNumero: loteAlvo ? loteAlvo.numero : 'S/N',
      motorista: novaColeta.motorista.toUpperCase(),
      destino: novaColeta.destino.toUpperCase(),
      status: 'Pendente'
    }]);
    setNovaColeta({ loteId: '', motorista: '', destino: '' });
  };

  const concluirColeta = (id) => {
    setColetas(coletas.map(c => c.id === id ? { ...c, status: 'Coletado ✅' } : c));
  };

  const cadastrarColaborador = (e) => {
    e.preventDefault();
    setEquipe([...equipe, { id: Date.now(), nome: novoColaborador.nome.toUpperCase(), funcao: novoColaborador.funcao.toUpperCase() }]);
    setNovoColaborador({ nome: '', funcao: '' });
  };

  const gerarMensagemZap = (lote) => {
    const texto = `*Relatório FacçãoPro - Lote ${lote.numero}*\n\n` +
                  `• Cliente: ${lote.cliente}\n` +
                  `• Serviço: ${lote.servico}\n` +
                  `• Status: ${lote.status}\n` +
                  `• Boas: ${lote.pecasProntas} pçs\n` +
                  `• Defeitos: ${lote.pecasDefeito} pçs\n` +
                  `• Progresso: ${lote.progresso}% de ${lote.totalPecas} pçs`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
  };

  const exportarParaCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Lote,Cliente,Servico,Pecas Planejadas,Pecas Prontas,Defeitos,Faturamento Bruto (R$)\n";
    
    lotes.forEach(l => {
      const faturamento = (l.pecasProntas * l.precoUnitario).toFixed(2);
      csvContent += `${l.numero},${l.cliente},${l.servico},${l.totalPecas},${l.pecasProntas},${l.pecasDefeito},${faturamento}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_producao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CÁLCULOS DO DASHBOARD ---
  const maquinasParadas = maquinas.filter(m => m.status === 'Em Manutenção').length;
  const faturamentoGeral = lotes.reduce((acc, curr) => acc + (curr.pecasProntas * curr.precoUnitario), 0);
  const totalPecasBipadasGeral = lotes.reduce((acc, curr) => acc + curr.pecasProntas, 0);
  const totalDefeitosGeral = lotes.reduce((acc, curr) => acc + curr.pecasDefeito, 0);

  const loteRelatorioSelecionado = lotes.find(l => l.id === parseInt(filtroLoteRelatorio));

  // --- MAPEAMENTO DE CORES (MODO CLARO / ESCURO) ---
  const classesBgBase = darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800";
  const classesSidebar = darkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const classesHeader = darkMode ? "bg-slate-950/40 border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const classesCard = darkMode ? "bg-slate-950/60 border-slate-800/80 text-slate-200" : "bg-white border-slate-200 shadow-sm text-slate-700";
  const classesCardInterno = darkMode ? "bg-slate-950 border-slate-800/80" : "bg-slate-50 border-slate-200";
  const classesInput = darkMode ? "bg-slate-900 border-slate-800 text-slate-100 focus:border-blue-500" : "bg-white border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-100";
  const classesTabelaHeader = darkMode ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-200";
  const classesLinhaTabela = darkMode ? "hover:bg-slate-950/40 border-slate-850" : "hover:bg-slate-100/50 border-slate-200";

  const classesSelectCustom = (valor) => `w-full flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
    valor 
      ? 'bg-blue-500/10 border-blue-500/40 text-blue-500' 
      : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-300 text-slate-500'
  }`;

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${classesBgBase}`}>
      
      {/* CORTINA DE FUNDO ESCURA (MOBILE) */}
      {menuMobileAberto && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMenuMobileAberto(false)}
        />
      )}

      {/* MENU LATERAL RESPONSIVO (Muda apenas em telas menores) */}
      <div className={`
        fixed inset-y-0 left-0 w-64 border-r flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${menuMobileAberto ? 'translate-x-0' : '-translate-x-full'}
        ${classesSidebar}
      `}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white font-black tracking-wider text-xl shadow-md shadow-blue-500/20">FPRO</div>
              <div>
                <h1 className={`font-bold text-sm tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>FACÇÃOPRO ERP</h1>
                <span className="text-xs text-emerald-500 font-semibold">v2.4 Dynamic</span>
              </div>
            </div>
            
            {/* BOTÃO PARA FECHAR MENU (MOBILE) */}
            <button 
              onClick={() => setMenuMobileAberto(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* ALERTA DE MÁQUINA PARADA */}
          {maquinasParadas > 0 && (
            <div className={`mb-5 p-3 rounded-xl flex items-start gap-2.5 animate-pulse border ${darkMode ? 'bg-rose-950/40 border-rose-800/60' : 'bg-rose-50 border-rose-200'}`}>
              <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className={`text-xs font-bold ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>ALERTAS DA OFICINA</h4>
                <p className={`text-[11px] leading-tight mt-0.5 ${darkMode ? 'text-rose-400/90' : 'text-rose-600'}`}>{maquinasParadas} máquina(s) retida(s) em manutenção.</p>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {[
              { id: 'inicio', label: 'Início (Chão de Fábrica)', icon: <Home size={18} /> },
              { id: 'pedidos', label: 'Pedidos e Cortes', icon: <Package size={18} /> },
              { id: 'lotes', label: 'Gerenciamento de Lotes', icon: <QrCode size={18} /> },
              { id: 'equipe', label: 'Equipe e Oficina', icon: <Users size={18} /> },
              { id: 'painel', label: 'Painel de Relatórios', icon: <BarChart2 size={18} /> },
              { id: 'coletas', label: 'Logística e Saídas', icon: <Truck size={18} /> },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setTelaAtiva(item.id);
                  setMenuMobileAberto(false); // Fecha o menu ao clicar em uma opção no mobile
                }} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  telaAtiva === item.id 
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/10' 
                    : darkMode ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button 
            onClick={() => {
              setTelaAtiva('config');
              setMenuMobileAberto(false);
            }} 
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${telaAtiva === 'config' ? 'text-blue-500 font-bold' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <Settings size={16} /> Configurações Gerais
          </button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`h-16 border-b flex items-center justify-between px-4 lg:px-8 z-10 ${classesHeader}`}>
          <div className="flex items-center gap-3">
            {/* BOTÃO HAMBÚRGUER (Visível apenas em telas menores) */}
            <button 
              onClick={() => setMenuMobileAberto(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-700 hover:bg-slate-800/40 text-slate-300 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h2 className={`text-base lg:text-lg font-bold capitalize ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{telaAtiva.replace('-', ' ')}</h2>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6">
            {/* BOTÃO MODO CLARO/ESCURO */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50'}`}
              title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* SELETOR 1: OPERADOR (CABEÇALHO) */}
            <div className="flex items-center gap-3">
              <div className={classesSelectCustom(operadorSelecionado)}>
                <User size={14} className={operadorSelecionado ? 'text-blue-500' : 'text-slate-400'} />
                <select 
                  value={operadorSelecionado} 
                  onChange={(e) => setOperadorSelecionado(e.target.value)}
                  className="bg-transparent border-none p-0 pr-6 focus:outline-none cursor-pointer text-inherit"
                >
                  <option value="" className={darkMode ? "bg-slate-950 text-slate-400" : "bg-white text-slate-500"}>
                    {operadorSelecionado ? "Trocar Operador" : "Nenhum operador"}
                  </option>
                  {equipe.map(colab => (
                    <option key={colab.id} value={colab.nome} className={darkMode ? "bg-slate-950 text-slate-200" : "bg-white text-slate-800"}>
                      {colab.nome} ({colab.funcao})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          
          {/* TELA: INÍCIO (CHÃO DE FÁBRICA) */}
          {telaAtiva === 'inicio' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border ${classesCard}`}>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Aguardando Fila</span>
                  <p className="text-2xl font-black mt-1">{lotes.filter(l => l.status === 'A Iniciar').length} Lotes</p>
                </div>
                <div className={`p-4 rounded-xl border ${classesCard}`}>
                  <span className="text-xs text-blue-500 font-bold uppercase tracking-wider">Em Linha (Costura)</span>
                  <p className="text-2xl font-black text-blue-500 mt-1">{lotes.filter(l => l.status === 'Em Costura').length} Lotes</p>
                </div>
                <div className={`p-4 rounded-xl border ${classesCard}`}>
                  <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Prontos / Acabamento</span>
                  <p className="text-2xl font-black text-emerald-500 mt-1">{lotes.filter(l => l.status === 'Pronto').length} Lotes</p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-rose-950/20 border-rose-900/30' : 'bg-rose-50 border-rose-100'}`}>
                  <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">Refugos (Segunda Linha)</span>
                  <p className="text-2xl font-black text-rose-500 mt-1">{totalDefeitosGeral} Peças</p>
                </div>
              </div>

              {/* LISTAGEM DE APONTAMENTO DIGITAL */}
              <div className={`border rounded-xl p-5 ${classesCard}`}>
                <h3 className={`font-bold text-sm uppercase tracking-wide mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>Controle de Linha por Bipagem</h3>
                <div className="space-y-4">
                  {lotes.length === 0 ? <p className="text-xs text-slate-400">Nenhum lote em produção ativa.</p> : null}
                  {lotes.map(lote => (
                    <div key={lote.id} className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${classesCardInterno}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Lote #{lote.numero}</span>
                          <span className="text-xs text-slate-400">• {lote.cliente}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${lote.status === 'Pronto' ? 'bg-emerald-500/10 text-emerald-500' : lote.status === 'Em Costura' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-300/30 text-slate-500'}`}>{lote.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{lote.servico} — Planejado: {lote.totalPecas} pçs</p>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-emerald-500 font-semibold">Boas: <strong>{lote.pecasProntas}</strong></span>
                          <span className="text-rose-500 font-semibold">Defeitos: <strong>{lote.pecasDefeito}</strong></span>
                        </div>

                        <div className={`w-64 h-2 rounded-full mt-2 overflow-hidden flex ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div className="bg-blue-500 h-full" style={{ width: `${(lote.pecasProntas / lote.totalPecas) * 100}%` }}></div>
                          <div className="bg-rose-500 h-full" style={{ width: `${(lote.pecasDefeito / lote.totalPecas) * 100}%` }}></div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => biparPecaAvançado(lote.id, 'sucesso')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/10">
                          <Plus size={14} /> Bipar Peça
                        </button>
                        <button onClick={() => biparPecaAvançado(lote.id, 'defeito')} className={`border font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${darkMode ? 'bg-rose-950/40 border-rose-900/60 text-rose-400 hover:bg-rose-900/30' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}>
                          <AlertTriangle size={14} /> Rejeitar (Defeito)
                        </button>
                        <button onClick={() => voltarStatusManual(lote.id)} className={`text-xs px-2.5 py-2 rounded-lg transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                          Voltar Etapa
                        </button>
                        <button onClick={() => avancarStatusManual(lote.id)} className={`text-xs px-2.5 py-2 rounded-lg transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                          Avançar Etapa
                        </button>
                        <a href={gerarMensagemZap(lote)} target="_blank" rel="noreferrer" className={`border p-2 rounded-lg transition-all ${darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}>
                          <MessageSquare size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TELA: PEDIDOS E CORTES */}
          {telaAtiva === 'pedidos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`border p-5 rounded-xl space-y-4 ${classesCard}`}>
                <h3 className="font-bold text-sm uppercase tracking-wide">Lançar Nova Ordem de Lote</h3>
                <form onSubmit={cadastrarLote} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Número do Lote/O.S</label>
                    <input type="text" value={novoLote.numero} onChange={(e) => setNovoLote({...novoLote, numero: e.target.value})} placeholder="Ex: 4015" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Cliente (Facção/Marca)</label>
                    <input type="text" value={novoLote.cliente} onChange={(e) => setNovoLote({...novoLote, cliente: e.target.value})} placeholder="Ex: Cotton Star" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tipo de Peça / Grade</label>
                    <div className={classesSelectCustom(novoLote.servico)}>
                      <Layers size={14} className={novoLote.servico ? 'text-blue-500' : 'text-slate-400'} />
                      <select 
                        value={novoLote.servico} 
                        onChange={(e) => setNovoLote({...novoLote, servico: e.target.value})} 
                        className="bg-transparent border-none p-0 pr-6 focus:outline-none cursor-pointer text-inherit w-full"
                        required
                      >
                        <option value="" className={darkMode ? "bg-slate-950 text-slate-400" : "bg-white text-slate-500"}>
                          {novoLote.servico ? "Trocar Modelo" : "Nenhum modelo de peça configurado"}
                        </option>
                        {servicos.map(s => (
                          <option key={s.id} value={s.nome} className={darkMode ? "bg-slate-950 text-slate-200" : "bg-white text-slate-800"}>
                            {s.nome} (R$ {s.preco.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Grade Total Solicitada (Peças)</label>
                    <input type="number" value={novoLote.totalPecas} onChange={(e) => setNovoLote({...novoLote, totalPecas: e.target.value})} placeholder="Ex: 1200" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg transition-all shadow-md shadow-blue-500/10">Liberar para Enfesto e Costura</button>
                </form>
              </div>

              <div className={`border p-5 rounded-xl flex flex-col justify-between ${classesCard}`}>
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wide">Rendimento do Rolo (Corte)</h3>
                  <form onSubmit={cadastrarCorte} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Vincular ao Lote</label>
                      <div className={classesSelectCustom(novoCorte.loteId)}>
                        <QrCode size={14} className={novoCorte.loteId ? 'text-blue-500' : 'text-slate-400'} />
                        <select 
                          value={novoCorte.loteId} 
                          onChange={(e) => setNovoCorte({...novoCorte, loteId: e.target.value})} 
                          className="bg-transparent border-none p-0 pr-6 focus:outline-none cursor-pointer text-inherit w-full"
                          required
                        >
                          <option value="" className={darkMode ? "bg-slate-950 text-slate-400" : "bg-white text-slate-500"}>
                            {novoCorte.loteId ? "Trocar Lote Alvo" : "Nenhum lote alvo selecionado"}
                          </option>
                          {lotes.map(l => (
                            <option key={l.id} value={l.id} className={darkMode ? "bg-slate-950 text-slate-200" : "bg-white text-slate-800"}>
                              Lote #{l.numero} ({l.cliente})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Peso do Rolo (Kg)</label>
                        <input type="number" step="0.01" value={novoCorte.pesoRolo} onChange={(e) => setNovoCorte({...novoCorte, pesoRolo: e.target.value})} placeholder="Ex: 24.50" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Peças Cortadas</label>
                        <input type="number" value={novoCorte.pecasObtidas} onChange={(e) => setNovoCorte({...novoCorte, pecasObtidas: e.target.value})} placeholder="Ex: 150" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                      </div>
                    </div>
                    <button type="submit" className={`w-full font-bold text-xs py-2.5 rounded-lg transition-all border ${darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'}`}>Calcular e Salvar Rendimento</button>
                  </form>
                </div>

                <div className={`border-t mt-4 pt-4 overflow-x-auto ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${classesTabelaHeader}`}>
                        <th className="pb-2 font-semibold">Lote</th>
                        <th className="pb-2 font-semibold">Massa Rolo</th>
                        <th className="pb-2 font-semibold">Rendimento Real</th>
                      </tr>
                    </thead>
                    <tbody className={darkMode ? "divide-y divide-slate-850" : "divide-y divide-slate-200"}>
                      {cortes.map(c => (
                        <tr key={c.id}>
                          <td className={`py-2 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-900'}`}>#{c.loteNumero}</td>
                          <td className="py-2 text-slate-400">{c.pesoRolo} Kg</td>
                          <td className="py-2 text-emerald-500 font-bold">{c.rendimento} pçs/Kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TELA: GERENCIAMENTO DE LOTES */}
          {telaAtiva === 'lotes' && (
            <div className={`border rounded-xl p-5 ${classesCard}`}>
              <h3 className="font-bold text-sm uppercase tracking-wide mb-4">Acervo Geral de Lotes Ativos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b ${classesTabelaHeader}`}>
                      <th className="pb-3 font-semibold">Nº Lote</th>
                      <th className="pb-3 font-semibold">Cliente</th>
                      <th className="pb-3 font-semibold">Modelo</th>
                      <th className="pb-3 font-semibold">Grade</th>
                      <th className="pb-3 font-semibold">Boas</th>
                      <th className="pb-3 font-semibold">Defeitos</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className={darkMode ? "divide-y divide-slate-850" : "divide-y divide-slate-200"}>
                    {lotes.map(l => (
                      <tr key={l.id} className={classesLinhaTabela}>
                        <td className="py-3 font-bold">#{l.numero}</td>
                        <td className="py-3">{l.cliente}</td>
                        <td className="py-3 text-slate-400">{l.servico}</td>
                        <td className="py-3 font-semibold">{l.totalPecas}</td>
                        <td className="py-3 text-emerald-500 font-bold">{l.pecasProntas}</td>
                        <td className="py-3 text-rose-500 font-bold">{l.pecasDefeito}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${l.status === 'Pronto' ? 'bg-emerald-500/10 text-emerald-500' : l.status === 'Em Costura' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-400'}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button onClick={() => deletarLote(l.id)} className="text-rose-500 hover:text-rose-400 p-1 rounded">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TELA: EQUIPE E OFICINA */}
          {telaAtiva === 'equipe' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`border p-5 rounded-xl space-y-4 ${classesCard}`}>
                <h3 className="font-bold text-sm uppercase tracking-wide">Cadastrar Costureiro(a) / Staff</h3>
                <form onSubmit={cadastrarColaborador} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nome Completo</label>
                    <input type="text" value={novoColaborador.nome} onChange={(e) => setNovoColaborador({...novoColaborador, nome: e.target.value})} placeholder="Ex: MARIA SILVA" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Função / Operação</label>
                    <input type="text" value={novoColaborador.funcao} onChange={(e) => setNovoColaborador({...novoColaborador, funcao: e.target.value})} placeholder="Ex: RETA / OVERLOQUE" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg transition-all">Registrar na Equipe</button>
                </form>
              </div>

              <div className={`border p-5 rounded-xl space-y-4 ${classesCard}`}>
                <h3 className="font-bold text-sm uppercase tracking-wide">Monitoramento de Máquinas</h3>
                <form onSubmit={cadastrarMaquina} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={novaMaquina.nome} onChange={(e) => setNovaMaquina({...novaMaquina, nome: e.target.value})} placeholder="Máquina (Ex: Galoneira)" className={`col-span-1 p-2 text-xs rounded-lg border ${classesInput}`} required />
                    <input type="text" value={novaMaquina.codigo} onChange={(e) => setNovaMaquina({...novaMaquina, codigo: e.target.value})} placeholder="Código (Ex: GL-02)" className={`col-span-1 p-2 text-xs rounded-lg border ${classesInput}`} required />
                    <input type="number" value={novaMaquina.revisaoDias} onChange={(e) => setNovaMaquina({...novaMaquina, revisaoDias: e.target.value})} placeholder="Revisar em (Dias)" className={`col-span-1 p-2 text-xs rounded-lg border ${classesInput}`} required />
                  </div>
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 rounded-lg border border-slate-700">Incluir maquinário</button>
                </form>

                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${classesTabelaHeader}`}>
                        <th className="pb-2">Cód</th>
                        <th className="pb-2">Equipamento</th>
                        <th className="pb-2">Status Oficina</th>
                        <th className="pb-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className={darkMode ? "divide-y divide-slate-850" : "divide-y divide-slate-200"}>
                      {maquinas.map(m => (
                        <tr key={m.id}>
                          <td className="py-2 font-bold">{m.codigo}</td>
                          <td className="py-2 text-slate-400">{m.nome}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${m.status === 'Operacional' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            <button onClick={() => alternarStatusMaquina(m.id)} className="text-blue-500 text-[11px] font-semibold hover:underline">
                              Alterar Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TELA: PAINEL DE RELATÓRIOS */}
          {telaAtiva === 'painel' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-xl border ${classesCard}`}>
                  <span className="text-xs text-slate-400 font-bold uppercase">Volume Total Bipado</span>
                  <p className="text-3xl font-black text-blue-500 mt-1">{totalPecasBipadasGeral} <span className="text-xs text-slate-400 font-normal">pçs</span></p>
                </div>
                <div className={`p-5 rounded-xl border ${classesCard}`}>
                  <span className="text-xs text-slate-400 font-bold uppercase">Previsão Faturamento Bruto</span>
                  <p className="text-3xl font-black text-emerald-500 mt-1">R$ {faturamentoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex items-end">
                  <button onClick={exportarParaCSV} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs p-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg">
                    <FileSpreadsheet size={16} /> Exportar Planilha de Produção (.CSV)
                  </button>
                </div>
              </div>

              {/* RASTREAMENTO DETALHADO POR LOTE */}
              <div className={`border p-5 rounded-xl ${classesCard}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wide">Histórico Técnico de Bipagem</h3>
                  <select 
                    value={filtroLoteRelatorio} 
                    onChange={(e) => setFiltroLoteRelatorio(e.target.value)}
                    className={`p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`}
                  >
                    <option value="todos">Selecionar Lote para Auditoria</option>
                    {lotes.map(l => (
                      <option key={l.id} value={l.id}>Lote #{l.numero} - {l.cliente}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  {loteRelatorioSelecionado ? (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b ${classesTabelaHeader}`}>
                          <th className="pb-2">Horário do Registro</th>
                          <th className="pb-2">Operador Responsável</th>
                          <th className="pb-2">Resultado/Tipo</th>
                        </tr>
                      </thead>
                      <tbody className={darkMode ? "divide-y divide-slate-850" : "divide-y divide-slate-200"}>
                        {loteRelatorioSelecionado.historicoBipagem.map(h => (
                          <tr key={h.id}>
                            <td className="py-2 text-slate-400">{h.hora}</td>
                            <td className="py-2 font-medium">{h.operador}</td>
                            <td className={`py-2 font-bold ${h.tipo === 'Sucesso' ? 'text-emerald-500' : 'text-rose-500'}`}>{h.tipo}</td>
                          </tr>
                        ))}
                        {loteRelatorioSelecionado.historicoBipagem.length === 0 && (
                          <tr><td colSpan="3" className="py-4 text-slate-400 text-center">Nenhum registro de bipagem neste lote até o momento.</td></tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">Escolha um lote acima para verificar o log de auditoria técnica da costura.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TELA: LOGÍSTICA E SAÍDAS */}
          {telaAtiva === 'coletas' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`border p-5 rounded-xl space-y-4 ${classesCard}`}>
                <h3 className="font-bold text-sm uppercase tracking-wide">Agendar Liberação/Coleta</h3>
                <form onSubmit={cadastrarColeta} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Selecione o Lote Pronto</label>
                    <div className={classesSelectCustom(novaColeta.loteId)}>
                      <Truck size={14} className={novaColeta.loteId ? 'text-blue-500' : 'text-slate-400'} />
                      <select 
                        value={novaColeta.loteId} 
                        onChange={(e) => setNovaColeta({...novaColeta, loteId: e.target.value})} 
                        className="bg-transparent border-none p-0 pr-6 focus:outline-none cursor-pointer text-inherit w-full"
                        required
                      >
                        <option value="" className={darkMode ? "bg-slate-950 text-slate-400" : "bg-white text-slate-500"}>Nenhum lote pronto selecionado</option>
                        {lotes.filter(l => l.status === 'Pronto').map(l => (
                          <option key={l.id} value={l.id}>Lote #{l.numero} ({l.cliente})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nome do Motorista / Transportador</label>
                    <input type="text" value={novaColeta.motorista} onChange={(e) => setNovaColeta({...novaColeta, motorista: e.target.value})} placeholder="Ex: CARLOS SOUZA" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Destino Final (Cidade / Matriz)</label>
                    <input type="text" value={novaColeta.destino} onChange={(e) => setNovaColeta({...novaColeta, destino: e.target.value})} placeholder="Ex: MATRIZ BLUMENAU" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg transition-all">Despachar e Gerar Protocolo</button>
                </form>
              </div>

              <div className={`border p-5 rounded-xl space-y-4 ${classesCard}`}>
                <h3 className="font-bold text-sm uppercase tracking-wide">Saídas Pendentes / Histórico</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${classesTabelaHeader}`}>
                        <th className="pb-2">Lote</th>
                        <th className="pb-2">Portador</th>
                        <th className="pb-2">Destino</th>
                        <th className="pb-2 text-right">Controle</th>
                      </tr>
                    </thead>
                    <tbody className={darkMode ? "divide-y divide-slate-850" : "divide-y divide-slate-200"}>
                      {coletas.map(c => (
                        <tr key={c.id}>
                          <td className="py-2 font-bold">#{c.loteNumero}</td>
                          <td className="py-2 text-slate-400">{c.motorista}</td>
                          <td className="py-2 text-slate-400">{c.destino}</td>
                          <td className="py-2 text-right">
                            {c.status === 'Pendente' ? (
                              <button onClick={() => concluirColeta(c.id)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded">
                                Confirmar Saída
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-500 font-bold">{c.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TELA: CONFIGURAÇÕES GERAIS */}
          {telaAtiva === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`border p-5 rounded-xl space-y-4 ${classesCard}`}>
                <h3 className="font-bold text-sm uppercase tracking-wide">Tabela de Preços e Serviços (Facção)</h3>
                <form onSubmit={cadastrarServico} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Nome do Modelo</label>
                      <input type="text" value={novoServico.nome} onChange={(e) => setNovoServico({...novoServico, nome: e.target.value})} placeholder="Ex: CAMISETA POLO" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Preço Pago por Peça (R$)</label>
                      <input type="number" step="0.01" value={novoServico.preco} onChange={(e) => setNovoServico({...novoServico, preco: e.target.value})} placeholder="Ex: 2.80" className={`w-full p-2 text-xs rounded-lg border focus:outline-none ${classesInput}`} required />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg transition-all">Cadastrar Novo Preço de Serviço</button>
                </form>

                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${classesTabelaHeader}`}>
                        <th className="pb-2">Modelo Cadastrado</th>
                        <th className="pb-2 text-right">Valor Unitário</th>
                      </tr>
                    </thead>
                    <tbody className={darkMode ? "divide-y divide-slate-850" : "divide-y divide-slate-200"}>
                      {servicos.map(s => (
                        <tr key={s.id}>
                          <td className="py-2 font-medium uppercase">{s.nome}</td>
                          <td className="py-2 text-right text-emerald-500 font-bold">R$ {s.preco.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}