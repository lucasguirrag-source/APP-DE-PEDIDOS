import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Bell, 
  ChevronRight, 
  Bike, 
  TrendingUp, 
  Calculator, 
  MessageSquare, 
  Users, 
  UtensilsCrossed, 
  Settings, 
  Printer, 
  Tag, 
  FileText, 
  Store, 
  LogOut, 
  ClipboardList,
  Flame,
  Rocket,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { StoreSettings } from '../../types';

interface AnotaAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: 'pedidos' | 'cardapio' | 'precificacao' | 'financas' | 'clientes' | 'locais' | 'config') => void;
  onOpenPrinterModal: () => void;
  onOpenCouponModal: () => void;
  onOpenAboutModal: () => void;
  onNavigateToStore: () => void;
  onLogout: () => void;
  storeSettings: StoreSettings;
  isStoreOpen: boolean;
  pendingOrdersCount: number;
}

export const AnotaAiDrawer: React.FC<AnotaAiDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenPrinterModal,
  onOpenCouponModal,
  onOpenAboutModal,
  onNavigateToStore,
  onLogout,
  storeSettings,
  isStoreOpen,
  pendingOrdersCount,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  const matchesSearch = (text: string) => {
    if (!searchFilter.trim()) return true;
    return text.toLowerCase().includes(searchFilter.toLowerCase().trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop escuro com blur suave */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Painel Lateral Estilo Anota AI em Laranja e Grafite Profundo */}
      <div className="relative w-full max-w-[320px] sm:max-w-[340px] bg-gradient-to-b from-[#141416] via-[#101012] to-[#0D0D0E] border-r border-[#FF7A00]/25 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-left duration-250 text-white select-none">
        
        {/* CABEÇALHO DO DRAWER COM LOGO 'aí que Fome' */}
        <div className="p-4 border-b border-[#242426] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Ícone Mascote Estilo Anota AI */}
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#E65100] to-[#FFA000] p-0.5 shadow-md shadow-[#FF7A00]/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#1A1A1C] rounded-[14px] flex items-center justify-center">
                <span className="text-lg">🍔</span>
              </div>
            </div>

            {/* Logo 'aí que Fome' */}
            <div className="flex flex-col">
              <div className="flex items-center text-lg font-black tracking-tight leading-none font-brand">
                <span className="text-zinc-200">aí que </span>
                <span className="text-[#FF7A00] ml-1">Fome</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold tracking-wide">
                Painel do Restaurante
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#1E1E22] hover:bg-[#2A2A30] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CAMPO DE BUSCA (Procurando por algo?) */}
        <div className="px-4 pt-3.5 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Procurando por algo?"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#1B1B1E] border border-[#2D2D32] focus:border-[#FF7A00] text-xs font-medium text-white placeholder-zinc-400 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* NOTIFICAÇÕES */}
        <div className="px-4 py-1.5">
          <button
            type="button"
            onClick={() => handleItemClick(() => onSelectTab('pedidos'))}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#1E1E22] text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#FF7A00]" />
              <span>Notificações</span>
            </div>
            {pendingOrdersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#FF7A00] text-black text-[10px] font-black">
                {pendingOrdersCount} novos
              </span>
            )}
          </button>
        </div>

        {/* CARD PROMO / CRESCIMENTO (Venda mais hoje - Ações para crescer >) */}
        <div className="px-4 py-2">
          <button
            type="button"
            onClick={() => handleItemClick(() => onSelectTab('precificacao'))}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#FF7A00]/20 via-[#FF7A00]/15 to-[#FF5500]/10 border border-[#FF7A00]/40 hover:border-[#FF7A00] transition-all text-left flex items-center justify-between group cursor-pointer shadow-lg shadow-[#FF7A00]/10"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#E65100] text-black flex items-center justify-center shadow-md">
                <Rocket className="w-5 h-5 text-black stroke-[2.4]" />
              </div>
              <div>
                <span className="text-xs font-black text-white group-hover:text-[#FFA000] transition-colors block">
                  Venda mais hoje
                </span>
                <span className="text-[11px] text-zinc-300 font-medium block">
                  Ações para crescer & lucrar
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#FFA000] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* LISTAGEM DE ITENS COM SCROLL */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs font-semibold">
          
          {/* GRUPO 1: SEU DIA A DIA */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Seu dia a dia
            </span>

            {matchesSearch('pedidos') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => onSelectTab('pedidos'))}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'pedidos'
                    ? 'bg-[#FF7A00] text-black font-black shadow-md shadow-[#FF7A00]/25'
                    : 'text-zinc-200 hover:bg-[#1E1E22] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ClipboardList className={`w-4 h-4 ${activeTab === 'pedidos' ? 'text-black' : 'text-[#FF7A00]'}`} />
                  <span>Pedidos</span>
                </div>
                {pendingOrdersCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'pedidos' ? 'bg-black text-[#FFA000]' : 'bg-[#FF7A00] text-black'
                  }`}>
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            )}

            {matchesSearch('entregas locais taxas') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => onSelectTab('locais'))}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'locais'
                    ? 'bg-[#FF7A00] text-black font-black shadow-md shadow-[#FF7A00]/25'
                    : 'text-zinc-200 hover:bg-[#1E1E22] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bike className={`w-4 h-4 ${activeTab === 'locais' ? 'text-black' : 'text-[#FF7A00]'}`} />
                  <span>Entregas & Bairros</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {matchesSearch('desempenho financas relatorios lucro') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => onSelectTab('financas'))}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'financas'
                    ? 'bg-[#FF7A00] text-black font-black shadow-md shadow-[#FF7A00]/25'
                    : 'text-zinc-200 hover:bg-[#1E1E22] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className={`w-4 h-4 ${activeTab === 'financas' ? 'text-black' : 'text-[#FF7A00]'}`} />
                  <span>Meu Desempenho</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {matchesSearch('precificacao custos planilha margem lucro insumos') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => onSelectTab('precificacao'))}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'precificacao'
                    ? 'bg-[#FF7A00] text-black font-black shadow-md shadow-[#FF7A00]/25'
                    : 'text-zinc-200 hover:bg-[#1E1E22] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calculator className={`w-4 h-4 ${activeTab === 'precificacao' ? 'text-black' : 'text-emerald-400'}`} />
                  <div className="flex items-center gap-1.5">
                    <span>Precificação & Custos</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-black text-[9px] font-black">
                      NOVO
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {matchesSearch('whatsapp robo mensagens cupons marketing') && (
              <button
                type="button"
                onClick={() => handleItemClick(onOpenCouponModal)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-200 hover:bg-[#1E1E22] hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-[#FF7A00]" />
                  <span>Robô & WhatsApp IA</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}
          </div>

          {/* GRUPO 2: GESTÃO DO RESTAURANTE */}
          <div className="space-y-1 pt-2 border-t border-[#222226]">
            <span className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Gestão da Loja
            </span>

            {matchesSearch('clientes base frequencia contatos') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => onSelectTab('clientes'))}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'clientes'
                    ? 'bg-[#FF7A00] text-black font-black shadow-md shadow-[#FF7A00]/25'
                    : 'text-zinc-200 hover:bg-[#1E1E22] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className={`w-4 h-4 ${activeTab === 'clientes' ? 'text-black' : 'text-[#FF7A00]'}`} />
                  <span>Clientes</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {matchesSearch('cardapio produtos lanches categorias adicionais conferir') && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleItemClick(() => onSelectTab('cardapio'))}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'cardapio'
                      ? 'bg-[#FF7A00] text-black font-black shadow-md shadow-[#FF7A00]/25'
                      : 'text-zinc-200 hover:bg-[#1E1E22] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className={`w-4 h-4 ${activeTab === 'cardapio' ? 'text-black' : 'text-[#FF7A00]'}`} />
                    <span>Cardápio & Produtos</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                {/* BOTÃO SOLICITADO: CONFERIR CARDÁPIO */}
                <button
                  type="button"
                  onClick={() => handleItemClick(onNavigateToStore)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#FF7A00]/15 hover:bg-[#FF7A00]/25 border border-[#FF7A00]/40 text-[#FFA000] text-[11px] font-bold transition-all cursor-pointer group"
                  title="Abrir e conferir o cardápio como cliente"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">👁️</span>
                    <span>Conferir Cardápio (Visão Cliente)</span>
                  </div>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

            {matchesSearch('configuracoes loja horario endereco banner') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => onSelectTab('config'))}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'config'
                    ? 'bg-[#FF7A00] text-black font-black shadow-md shadow-[#FF7A00]/25'
                    : 'text-zinc-200 hover:bg-[#1E1E22] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className={`w-4 h-4 ${activeTab === 'config' ? 'text-black' : 'text-[#FF7A00]'}`} />
                  <span>Configurações da Loja</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {matchesSearch('impressora papel letras comanda termica') && (
              <button
                type="button"
                onClick={() => handleItemClick(onOpenPrinterModal)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-200 hover:bg-[#1E1E22] hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Printer className="w-4 h-4 text-zinc-400" />
                  <span>Impressora & Comprovante</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {matchesSearch('cupons desconto promocoes') && (
              <button
                type="button"
                onClick={() => handleItemClick(onOpenCouponModal)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-200 hover:bg-[#1E1E22] hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-zinc-400" />
                  <span>Cupons de Desconto</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {matchesSearch('sobre textos rodape manifesto instagram') && (
              <button
                type="button"
                onClick={() => handleItemClick(onOpenAboutModal)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-200 hover:bg-[#1E1E22] hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span>Editar Sobre a Loja</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}
          </div>

        </div>

        {/* PILL INFERIOR DA LOJA (ESTILO ANOTA AI COM BADGE ABERTO/FECHADO) */}
        <div className="p-3 border-t border-[#222226]">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#1A1A1E] to-[#161619] border border-[#2E2E34] flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Ícone Redondo da Loja */}
              <div className="w-10 h-10 rounded-full bg-[#24242A] border border-[#3A3A42] flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-[#FFA000]" />
              </div>

              {/* Informações da Loja */}
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white truncate leading-tight">
                  AI QUE FOME
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  Lucas Guirra
                </p>
                {/* Badge ABERTO / FECHADO */}
                <span className={`inline-block mt-0.5 px-2 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                  isStoreOpen 
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400' 
                    : 'bg-[#FF7A00]/15 border-[#FF7A00] text-[#FF7A00]'
                }`}>
                  {isStoreOpen ? 'ABERTO' : 'FECHADO'}
                </span>
              </div>
            </div>

            {/* Ações: Ver Loja / Sair */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onNavigateToStore}
                className="p-2 rounded-xl bg-[#24242A] hover:bg-[#303038] text-zinc-300 hover:text-[#FFA000] transition-colors cursor-pointer"
                title="Ver Cardápio como Cliente"
              >
                <LogOut className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
