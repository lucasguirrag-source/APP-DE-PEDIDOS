import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  ShoppingBag, 
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Search,
  Filter,
  CreditCard,
  Wallet,
  Clock,
  Edit2
} from 'lucide-react';
import { FinancialTransaction, PlatformRate } from '../../types';

interface FinanceManagerProps {
  platformRates: PlatformRate[];
  onSavePlatformRates: (rates: PlatformRate[]) => void;
  showToast: (msg: string) => void;
}

const STORAGE_KEY = 'aqf_finance_txs_v3_clean';

const EXPENSE_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'carnes_insumos', label: 'Carnes & Blends', icon: '🥩' },
  { id: 'paes_queijos', label: 'Pães & Laticínios', icon: '🍞' },
  { id: 'embalagens', label: 'Embalagens & Sacolas', icon: '📦' },
  { id: 'motoboy_equipe', label: 'Diária Motoboy / Equipe', icon: '🛵' },
  { id: 'gas', label: 'Gás de Cozinha', icon: '🔥' },
  { id: 'contas_fixas', label: 'Contas (Luz, Água, Internet)', icon: '💡' },
  { id: 'mercado', label: 'Mercado / Hortifrúti', icon: '🛒' },
  { id: 'outros', label: 'Outras Despesas', icon: '🏷️' },
];

const INCOME_CHANNELS: { id: string; label: string }[] = [
  { id: 'site', label: 'Vendas no Site / Cardápio' },
  { id: 'balcao', label: 'Vendas no Balcão (Loja)' },
  { id: 'whatsapp', label: 'Vendas diretas no WhatsApp' },
  { id: 'ifood', label: 'iFood / Apps Terceiros' },
  { id: 'outras_entradas', label: 'Outras Entradas' },
];

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  platformRates,
  onSavePlatformRates,
  showToast,
}) => {
  // Transações financeiras: tudo começa 100% ZERADO como o usuário solicitou!
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return []; // Inicia completamente zerado!
  });

  // Filtro de período
  const [filterPeriod, setFilterPeriod] = useState<'hoje' | '7dias' | 'mes' | 'todos' | 'custom'>('hoje');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Modal / Formulário de Novo Gasto (Despesa)
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('carnes_insumos');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao' | 'boleto'>('pix');

  // Modal / Formulário de Nova Entrada (Faturamento)
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [incomeDate, setIncomeDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeChannel, setIncomeChannel] = useState('balcao');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomePaymentMethod, setIncomePaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao'>('pix');

  // Salva no localStorage e sincroniza com o servidor
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  // Carrega do servidor se houver transações salvas
  useEffect(() => {
    const fetchServerLedger = async () => {
      try {
        const res = await fetch('/api/admin/finance/data');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.transactions) && data.transactions.length > 0) {
            setTransactions(data.transactions);
          }
        }
      } catch (err) {
        // Fallback silencioso para o localStorage
      }
    };
    fetchServerLedger();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtra transações pelo período selecionado
  const filteredTransactions = transactions.filter((t) => {
    if (filterPeriod === 'hoje') {
      return t.date === todayStr;
    }
    if (filterPeriod === 'custom') {
      return t.date === customDate;
    }
    if (filterPeriod === '7dias') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      return t.date >= past7.toISOString().split('T')[0];
    }
    if (filterPeriod === 'mes') {
      const currentMonth = todayStr.substring(0, 7);
      return t.date.startsWith(currentMonth);
    }
    return true; // 'todos'
  });

  // Separa Entradas (Faturamento) e Saídas (Gastos)
  const incomeList = filteredTransactions.filter((t) => t.type === 'income');
  const expenseList = filteredTransactions.filter((t) => t.type === 'expense');

  // Cálculos do período
  const totalRevenue = incomeList.reduce((acc, t) => acc + (t.netAmount !== undefined ? t.netAmount : t.amount), 0);
  const totalExpenses = expenseList.reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalRevenue - totalExpenses;

  // Handler para adicionar novo gasto
  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expenseAmount.replace(',', '.')) || 0;
    if (parsedAmount <= 0) {
      showToast('Digite um valor de gasto válido.');
      return;
    }
    if (!expenseDesc.trim()) {
      showToast('Digite a descrição do que foi comprado ou gasto.');
      return;
    }

    const newTx: FinancialTransaction = {
      id: `exp-${Date.now()}`,
      type: 'expense',
      category: expenseCategory,
      description: expenseDesc.trim(),
      amount: parsedAmount,
      date: expenseDate || todayStr,
      channel: expensePaymentMethod,
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    setExpenseDesc('');
    setExpenseAmount('');
    setIsAddingExpense(false);

    try {
      await fetch('/api/admin/finance/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
    } catch (e) {
      console.error(e);
    }

    showToast(`Gasto de R$ ${parsedAmount.toFixed(2).replace('.', ',')} lançado na planilha!`);
  };

  // Handler para adicionar nova entrada / venda manual
  const handleAddIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(incomeAmount.replace(',', '.')) || 0;
    if (parsedAmount <= 0) {
      showToast('Digite um valor de faturamento válido.');
      return;
    }

    const newTx: FinancialTransaction = {
      id: `inc-${Date.now()}`,
      type: 'income',
      category: incomeChannel,
      description: incomeDesc.trim() || 'Vendas registradas',
      amount: parsedAmount,
      netAmount: parsedAmount,
      date: incomeDate || todayStr,
      channel: incomePaymentMethod,
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    setIncomeDesc('');
    setIncomeAmount('');
    setIsAddingIncome(false);

    try {
      await fetch('/api/admin/finance/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
    } catch (e) {
      console.error(e);
    }

    showToast(`Entrada de R$ ${parsedAmount.toFixed(2).replace('.', ',')} adicionada ao faturamento!`);
  };

  // Handler para excluir transação
  const handleDeleteTransaction = async (id: string, desc: string) => {
    if (window.confirm(`Deseja realmente excluir o lançamento "${desc}"?`)) {
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);

      try {
        await fetch(`/api/admin/finance/transaction/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error(e);
      }

      showToast('Lançamento removido com sucesso.');
    }
  };

  // Formatação de data amigável
  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none">
      
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO COM FILTRO DE PERÍODO                                         */}
      {/* ========================================================================= */}
      <div className="bg-[#141416] border border-[#26262B] p-5 sm:p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FF7A00]/15 text-[#FFA000]">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-[#FFA000] uppercase tracking-wider">
                Gestão Financeira & Caixa
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-brand font-black text-white mt-1">
              MEU DESEMPENHO
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acompanhe seu faturamento e lance os gastos diários da hamburgueria na planilha.
            </p>
          </div>

          {/* Filtros de Período */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#1C1C20] p-1.5 rounded-2xl border border-[#2D2D34]">
            <button
              type="button"
              onClick={() => setFilterPeriod('hoje')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === 'hoje'
                  ? 'bg-[#FF7A00] text-black font-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('7dias')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === '7dias'
                  ? 'bg-[#FF7A00] text-black font-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              7 Dias
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('mes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === 'mes'
                  ? 'bg-[#FF7A00] text-black font-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Este Mês
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === 'todos'
                  ? 'bg-[#FF7A00] text-black font-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterPeriod === 'custom'
                  ? 'bg-[#FF7A00] text-black font-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Por Data</span>
            </button>
          </div>
        </div>

        {/* Seletor de data específica caso escolha "Por Data" */}
        {filterPeriod === 'custom' && (
          <div className="pt-2 flex items-center gap-2 border-t border-[#222226] text-xs">
            <span className="text-zinc-400 font-bold">Ver movimentações do dia:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#1C1C20] border border-[#33333A] text-white font-mono text-xs font-bold focus:border-[#FF7A00] focus:outline-hidden cursor-pointer"
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. OS 3 CARDS DO BALANCETE GERAL (TUDO INICIA ZERADO R$ 0,00)             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          {/* CARD 1: FATURAMENTO (O QUE ENTROU) */}
          <div className="p-4 rounded-2xl bg-[#18181B] border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Faturamento (Entrou)
              </span>
              <span className="text-2xl sm:text-3xl font-brand font-black text-white block mt-1 font-mono">
                R$ {totalRevenue.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-zinc-400">
                {incomeList.length} {incomeList.length === 1 ? 'venda registrada' : 'vendas registradas'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* CARD 2: GASTOS (O QUE SAIU) */}
          <div className="p-4 rounded-2xl bg-[#18181B] border border-red-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
                Gastos da Loja (Saiu)
              </span>
              <span className="text-2xl sm:text-3xl font-brand font-black text-white block mt-1 font-mono">
                R$ {totalExpenses.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-zinc-400">
                {expenseList.length} {expenseList.length === 1 ? 'gasto lançado' : 'gastos lançados'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          {/* CARD 3: SALDO EM CAIXA (LUCRO LÍQUIDO) */}
          <div className={`p-4 rounded-2xl bg-[#18181B] border flex items-center justify-between ${
            netBalance >= 0 ? 'border-[#FF7A00]/40' : 'border-red-500/50'
          }`}>
            <div>
              <span className="text-[11px] font-bold text-[#FFA000] uppercase tracking-wider block">
                Saldo / Caixa Líquido
              </span>
              <span className={`text-2xl sm:text-3xl font-brand font-black block mt-1 font-mono ${
                netBalance >= 0 ? 'text-[#FFA000]' : 'text-red-400'
              }`}>
                R$ {netBalance.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] text-zinc-400">
                Faturamento menos gastos
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/15 border border-[#FF7A00]/40 text-[#FFA000] flex items-center justify-center">
              <Wallet className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LAYOUT DUPLO: FATURAMENTO (ESQUERDA) + PLANILHA DE GASTOS (DIREITA)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* ======================================================================= */}
        {/* COLUNA 1: FATURAMENTO & O QUE ENTROU                                    */}
        {/* ======================================================================= */}
        <div className="bg-[#141416] border border-[#242428] rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#242428]">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <div>
                <h3 className="font-brand font-black text-base text-white">
                  Faturamento (Entradas)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Valores reais que entraram no caixa
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingIncome(!isAddingIncome)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-brand font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Lançar Entrada</span>
            </button>
          </div>

          {/* FORMULÁRIO RÁPIDO PARA REGISTRAR ENTRADA/VENDA */}
          {isAddingIncome && (
            <form onSubmit={handleAddIncomeSubmit} className="p-4 rounded-2xl bg-[#1A1A1E] border border-emerald-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#26262B]">
                <span className="text-xs font-black text-emerald-400">
                  Registrar Faturamento / Entrada
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingIncome(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                    Data da Venda / Entrada
                  </label>
                  <input
                    type="date"
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                    Valor Entrado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                    Origem / Canal
                  </label>
                  <select
                    value={incomeChannel}
                    onChange={(e) => setIncomeChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold"
                  >
                    {INCOME_CHANNELS.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={incomePaymentMethod}
                    onChange={(e) => setIncomePaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão de Crédito/Débito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vendas no balcão da noite, combo especial"
                  value={incomeDesc}
                  onChange={(e) => setIncomeDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-brand font-black text-xs uppercase shadow-md cursor-pointer"
                >
                  Salvar Faturamento
                </button>
              </div>
            </form>
          )}

          {/* LISTAGEM DE ENTRADAS */}
          <div className="space-y-2">
            {incomeList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#18181A] border border-[#25252A] text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-black text-white">
                  Tudo zerado em R$ 0,00
                </h4>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Como ainda não foram feitas vendas no período, o faturamento está zerado. Ele só aparecerá aqui quando você lançar manualmente ou quando pedidos forem finalizados.
                </p>
              </div>
            ) : (
              <div className="bg-[#18181B] border border-[#26262B] rounded-2xl divide-y divide-[#242428] overflow-hidden text-xs">
                {incomeList.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#1E1E22] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                        <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{item.description}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                          <span>{formatDateBR(item.date)}</span>
                          <span>•</span>
                          <span className="capitalize">{item.channel || 'PIX'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-brand font-black text-sm text-emerald-400 font-mono">
                        + R$ {item.amount.toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(item.id, item.description)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Excluir entrada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* COLUNA 2: PLANILHA DE GASTOS DO DIA (SOLICITADO PELO USUÁRIO)           */}
        {/* ======================================================================= */}
        <div className="bg-[#141416] border border-[#242428] rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#242428]">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
              <div>
                <h3 className="font-brand font-black text-base text-white">
                  Planilha de Gastos do Dia
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Lance carnes, pães, gás, motoboys e compras diárias
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingExpense(!isAddingExpense)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#E65100] hover:from-[#FFA000] hover:to-[#FF7A00] text-black font-brand font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Novo Gasto</span>
            </button>
          </div>

          {/* FORMULÁRIO COMPLETO PARA LANÇAR GASTO (COM DATA SELECIONÁVEL) */}
          {isAddingExpense && (
            <form onSubmit={handleAddExpenseSubmit} className="p-4 rounded-2xl bg-[#1A1A1E] border border-[#FF7A00]/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#26262B]">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#FFA000]">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Lançar Gasto na Planilha</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {/* Data do Gasto (permite colocar a data que esqueceu) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-zinc-300">
                      Data do Gasto
                    </label>
                    <button
                      type="button"
                      onClick={() => setExpenseDate(todayStr)}
                      className="text-[9px] font-bold text-[#FFA000] hover:underline"
                    >
                      Usar Hoje
                    </button>
                  </div>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold font-mono focus:border-[#FF7A00] focus:outline-hidden"
                    title="Selecione o dia que realizou o gasto (pode ser data retroativa)"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-300 block mb-1">
                    Valor Gasto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold font-mono focus:border-[#FF7A00] focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-zinc-300 block mb-1">
                    Categoria do Gasto
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold focus:border-[#FF7A00] focus:outline-hidden"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-300 block mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold focus:border-[#FF7A00] focus:outline-hidden"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro em Espécie</option>
                    <option value="cartao">Cartão de Crédito/Débito</option>
                    <option value="boleto">Boleto / Transferência</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-300 block mb-1">
                  Descrição do Gasto (O que você comprou?)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10kg de fraldinha moída, 30 pães brioche, botijão de gás"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-[#2F2F36] text-white text-xs font-bold focus:border-[#FF7A00] focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#E65100] hover:brightness-110 text-black font-brand font-black text-xs uppercase shadow-md cursor-pointer"
                >
                  Salvar na Planilha
                </button>
              </div>
            </form>
          )}

          {/* LISTAGEM DA PLANILHA DE GASTOS */}
          <div className="space-y-2">
            {expenseList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#18181A] border border-[#25252A] text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-red-950/40 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-black text-white">
                  Nenhum gasto registrado
                </h4>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Sua planilha de gastos está limpa. Clique em "+ Novo Gasto" para lançar suas compras de hoje ou de dias anteriores caso tenha esquecido.
                </p>
              </div>
            ) : (
              <div className="bg-[#18181B] border border-[#26262B] rounded-2xl divide-y divide-[#242428] overflow-hidden text-xs">
                {expenseList.map((item) => {
                  const catObj = EXPENSE_CATEGORIES.find((c) => c.id === item.category);

                  return (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#1E1E22] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                          <span className="text-sm">{catObj?.icon || '📦'}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">{item.description}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                            <span className="font-mono text-zinc-300 font-bold">{formatDateBR(item.date)}</span>
                            <span>•</span>
                            <span className="text-[#FFA000]">{catObj?.label || item.category}</span>
                            <span>•</span>
                            <span className="uppercase">{item.channel || 'PIX'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-brand font-black text-sm text-red-400 font-mono">
                          - R$ {item.amount.toFixed(2).replace('.', ',')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(item.id, item.description)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Excluir gasto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
