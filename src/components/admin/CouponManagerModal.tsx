import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  Sparkles, 
  Copy, 
  Check, 
  MessageSquare, 
  Calendar, 
  Send, 
  Plus, 
  Trash2, 
  Flame, 
  Zap, 
  DollarSign, 
  Percent, 
  RefreshCw,
  ExternalLink,
  Users,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Coupon } from '../../types';
import { getStoredCoupons, saveStoredCoupons } from '../../utils/couponManager';
import { DAYS_INFO, generateAICouponMessage, GenerateCopyParams } from '../../utils/aiCouponMessages';

interface CouponManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
  promoGroupLink?: string;
  storePhone?: string;
}

export const CouponManagerModal: React.FC<CouponManagerModalProps> = ({
  isOpen,
  onClose,
  showToast,
  promoGroupLink = '',
  storePhone = '5574999999999',
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp_generator' | 'coupon_crud'>('whatsapp_generator');
  const [coupons, setCoupons] = useState<Coupon[]>(() => getStoredCoupons());

  // Current day calculation
  const todayDayOfWeek = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(todayDayOfWeek);

  // Selected coupon for message generation
  const [selectedCouponId, setSelectedCouponId] = useState<string>(() => {
    const list = getStoredCoupons();
    return list.find((c) => c.isActive)?.id || list[0]?.id || '';
  });

  const [messageTone, setMessageTone] = useState<'descontraido' | 'urgencia' | 'suculento' | 'direto'>('descontraido');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Form for new coupon
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percent' | 'fixed'>('percent');
  const [newValue, setNewValue] = useState('10');
  const [newMinOrder, setNewMinOrder] = useState('30');
  const [newDescription, setNewDescription] = useState('');
  const [newValidDays, setNewValidDays] = useState<number[]>([]);

  // Refresh coupons from storage
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCoupons();
      setCoupons(stored);
      if (!selectedCouponId && stored.length > 0) {
        setSelectedCouponId(stored[0].id);
      }
    }
  }, [isOpen]);

  // Initial message generation when opening or changing day / coupon
  useEffect(() => {
    if (isOpen && coupons.length > 0) {
      handleTriggerGeneration();
    }
  }, [selectedDay, selectedCouponId, messageTone, isOpen]);

  const activeCoupon = coupons.find((c) => c.id === selectedCouponId) || coupons[0];

  const handleTriggerGeneration = async () => {
    if (!activeCoupon) return;
    setIsGenerating(true);
    setCopied(false);
    try {
      const copy = await generateAICouponMessage({
        dayOfWeek: selectedDay,
        coupon: activeCoupon,
        storeName: 'AI QUE FOME',
        promoGroupLink,
        tone: messageTone,
      });
      setGeneratedMessage(copy);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    showToast('Mensagem copiada para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsAppShare = () => {
    if (!generatedMessage) return;
    const encoded = encodeURIComponent(generatedMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Coupon CRUD handlers
  const handleToggleActive = (id: string) => {
    const updated = coupons.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    setCoupons(updated);
    saveStoredCoupons(updated);
    showToast('Status do cupom atualizado!');
  };

  const handleDeleteCoupon = (id: string) => {
    if (coupons.length <= 1) {
      showToast('Mantenha ao menos 1 cupom cadastrado.');
      return;
    }
    const updated = coupons.filter((c) => c.id !== id);
    setCoupons(updated);
    saveStoredCoupons(updated);
    if (selectedCouponId === id) {
      setSelectedCouponId(updated[0]?.id || '');
    }
    showToast('Cupom excluído com sucesso.');
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) {
      showToast('Digite um código válido para o cupom!');
      return;
    }

    if (coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
      showToast('Já existe um cupom com esse código!');
      return;
    }

    const valNum = parseFloat(newValue.replace(',', '.')) || 0;
    if (valNum <= 0) {
      showToast('Informe um valor de desconto válido!');
      return;
    }

    const minNum = parseFloat(newMinOrder.replace(',', '.')) || 0;

    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}`,
      code: cleanCode,
      type: newType,
      value: valNum,
      minOrderValue: minNum > 0 ? minNum : undefined,
      validDays: newValidDays.length > 0 ? newValidDays : undefined,
      isActive: true,
      description: newDescription.trim() || `${cleanCode} - ${valNum}${newType === 'percent' ? '%' : ' R$'} OFF`,
      usageCount: 0,
    };

    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    saveStoredCoupons(updated);
    setSelectedCouponId(newCoupon.id);
    setNewCode('');
    setNewValue('10');
    setNewMinOrder('30');
    setNewDescription('');
    setNewValidDays([]);
    showToast(`Cupom ${cleanCode} cadastrado com sucesso!`);
    setActiveTab('whatsapp_generator');
  };

  const toggleDaySelection = (dayIndex: number) => {
    setNewValidDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-[#121212] border border-[#2A2A2A] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#181818] via-[#1A1A1A] to-[#20180B] border-b border-[#2A2A2A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFA000]/15 border border-[#FFA000]/30 text-[#FFA000] flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-brand font-black text-lg sm:text-xl text-white">
                  Área de Cupons & Mensagens VIP WhatsApp
                </h2>
                <span className="bg-[#FFA000] text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-black" />
                  IA
                </span>
              </div>
              <p className="text-xs text-[#A3A3A3]">
                Mensagens inteligentes que se adaptam conforme o dia da semana e promovem seus cupons
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#888] hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#242424] bg-[#151515] px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp_generator')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'whatsapp_generator'
                ? 'border-[#FFA000] text-[#FFA000]'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Disparador WhatsApp com IA (Por Dia)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coupon_crud')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'coupon_crud'
                ? 'border-[#FFA000] text-[#FFA000]'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Cadastrar & Gerenciar Cupons ({coupons.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-6">

          {/* TAB 1: GERADOR DE MENSAGENS COM IA POR DIA */}
          {activeTab === 'whatsapp_generator' && (
            <div className="space-y-6">
              
              {/* Seleção do Dia da Semana */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#FFA000]" />
                    <span>Selecione o Dia da Semana (A mensagem se adapta ao dia)</span>
                  </label>
                  {selectedDay === todayDayOfWeek && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      Dia de Hoje
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {DAYS_INFO.map((day) => {
                    const isSelected = selectedDay === day.dayOfWeek;
                    const isToday = todayDayOfWeek === day.dayOfWeek;
                    return (
                      <button
                        key={day.dayOfWeek}
                        type="button"
                        onClick={() => setSelectedDay(day.dayOfWeek)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#FFA000]/15 border-[#FFA000] text-white shadow-md shadow-[#FFA000]/10'
                            : 'bg-[#181818] border-[#2A2A2A] text-[#888] hover:border-[#3E3E3E] hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-base">
                          <span>{day.emoji}</span>
                          {isToday && (
                            <span className="text-[9px] bg-[#FFA000] text-black font-black px-1.5 py-0.2 rounded-md">
                              Hoje
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold mt-1 ${isSelected ? 'text-[#FFA000]' : 'text-white'}`}>
                          {day.short}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controles: Cupom Selecionado & Tom da Mensagem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Seleção do Cupom */}
                <div className="bg-[#181818] border border-[#282828] p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#FFA000]" />
                      <span>Cupom Citado na Mensagem</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('coupon_crud')}
                      className="text-[10px] text-[#FFA000] hover:underline font-bold"
                    >
                      + Novo Cupom
                    </button>
                  </div>

                  <select
                    value={selectedCouponId}
                    onChange={(e) => setSelectedCouponId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                  >
                    {coupons.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.type === 'percent' ? `${c.value}% OFF` : `R$ ${c.value.toFixed(2).replace('.', ',')} OFF`} {c.isActive ? '' : '(Inativo)'}
                      </option>
                    ))}
                  </select>

                  {activeCoupon && (
                    <p className="text-[11px] text-[#888]">
                      {activeCoupon.description || 'Cupom com desconto exclusivo para seus clientes.'}
                    </p>
                  )}
                </div>

                {/* Tom / Estilo da IA */}
                <div className="bg-[#181818] border border-[#282828] p-3.5 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFA000]" />
                    <span>Estilo & Tom da Copy (IA)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'descontraido', label: '🍔 Descontraído', desc: 'Amigável & Faminto' },
                      { id: 'suculento', label: '🤤 Suculento', desc: 'Foco no sabor dos blends' },
                      { id: 'urgencia', label: '⚡ Urgência', desc: 'Válido só hoje!' },
                      { id: 'direto', label: '🎯 Direto', desc: 'Prático e objetivo' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMessageTone(t.id as any)}
                        className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          messageTone === t.id
                            ? 'bg-[#FFA000]/15 border-[#FFA000] text-white'
                            : 'bg-[#202020] border-[#2E2E2E] text-[#777] hover:text-white'
                        }`}
                      >
                        <p className={`font-bold ${messageTone === t.id ? 'text-[#FFA000]' : 'text-white'}`}>
                          {t.label}
                        </p>
                        <p className="text-[10px] text-[#888]">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Botão de Gerar com IA */}
              <div className="flex items-center justify-between gap-3 bg-[#181818] border border-[#2A2A2A] p-3 rounded-2xl">
                <div className="text-xs text-[#AAA]">
                  <span>Cada clique gera uma </span>
                  <span className="text-[#FFA000] font-bold">mensagem nova e única</span>
                  <span> citando o cupom e o dia da semana.</span>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerGeneration}
                  disabled={isGenerating}
                  className="px-4 py-2.5 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#FFA000]/20 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Gerando com IA...' : 'Gerar Nova Variação'}</span>
                </button>
              </div>

              {/* Visualizador de Mensagem no Estilo WhatsApp */}
              <div className="bg-[#0C1510] border border-[#1B3627] rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#1B3627] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] text-black flex items-center justify-center font-bold">
                      <MessageSquare className="w-4 h-4 fill-black" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Pré-visualização para WhatsApp</h4>
                      <p className="text-[10px] text-emerald-400">
                        Pronto para colar em grupos VIP, listas de transmissão ou status
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="px-3 py-1.5 rounded-xl bg-[#1E2E24] hover:bg-[#284132] border border-[#25D366]/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenWhatsAppShare}
                      className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-[#25D366]/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Abrir no WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Caixa de Texto do WhatsApp */}
                <div className="bg-[#121B16] border border-[#1E2E24] rounded-2xl p-4 font-sans text-xs sm:text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed select-all">
                  {generatedMessage || 'Carregando mensagem adaptada com IA...'}
                </div>

                {promoGroupLink && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400/90 pt-1">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Seu link do Grupo VIP foi incluído na mensagem para convidar novos membros!</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: GERENCIAMENTO DE CUPONS */}
          {activeTab === 'coupon_crud' && (
            <div className="space-y-6">
              
              {/* Formulário de Criação de Novo Cupom */}
              <form onSubmit={handleCreateCoupon} className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#FFA000]" />
                    <span>Cadastrar Novo Cupom</span>
                  </h3>
                  <span className="text-[10px] text-[#888]">Funciona imediatamente no cardápio</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#AAA] block mb-1">Código do Cupom *</label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="Ex: QUINTA15"
                      className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-black uppercase focus:border-[#FFA000] focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#AAA] block mb-1">Tipo de Desconto *</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                    >
                      <option value="percent">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo em Reais (R$)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#AAA] block mb-1">
                      {newType === 'percent' ? 'Desconto em % *' : 'Desconto em R$ *'}
                    </label>
                    <input
                      type="number"
                      step={newType === 'percent' ? '1' : '0.50'}
                      min="1"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={newType === 'percent' ? '10' : '10.00'}
                      className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#AAA] block mb-1">
                      Pedido Mínimo (R$) (Opcional)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={newMinOrder}
                      onChange={(e) => setNewMinOrder(e.target.value)}
                      placeholder="Ex: 35.00"
                      className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#AAA] block mb-1">
                      Descrição / Regra (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Ex: Desconto de 15% na sua janta"
                      className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Dias da semana válidos */}
                <div>
                  <label className="text-[11px] font-bold text-[#AAA] block mb-1.5">
                    Válido em quais dias da semana? (Deixe em branco para todos os dias)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_INFO.map((d) => {
                      const isSel = newValidDays.includes(d.dayOfWeek);
                      return (
                        <button
                          key={d.dayOfWeek}
                          type="button"
                          onClick={() => toggleDaySelection(d.dayOfWeek)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            isSel
                              ? 'bg-[#FFA000] text-black border-[#FFA000]'
                              : 'bg-[#222] text-[#888] border-[#333] hover:text-white'
                          }`}
                        >
                          {d.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#FFA000]/20"
                  >
                    Salvar e Ativar Cupom
                  </button>
                </div>
              </form>

              {/* Lista de Cupons Atuais */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Cupons Cadastrados no Sistema
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        coupon.isActive
                          ? 'bg-[#181818] border-[#2A2A2A]'
                          : 'bg-[#141414] border-[#222] opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-[#FFA000] bg-[#FFA000]/10 px-2 py-0.5 rounded-md border border-[#FFA000]/30">
                              {coupon.code}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {coupon.type === 'percent' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2).replace('.', ',')} OFF`}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#888] mt-1.5">
                            {coupon.description || 'Sem descrição cadastrada'}
                          </p>
                          
                          {coupon.minOrderValue && (
                            <p className="text-[10px] text-[#777] mt-0.5">
                              Pedido mínimo: R$ {coupon.minOrderValue.toFixed(2).replace('.', ',')}
                            </p>
                          )}

                          {coupon.validDays && coupon.validDays.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-[10px] text-[#777]">Dias:</span>
                              {coupon.validDays.map((d) => (
                                <span key={d} className="text-[9px] bg-[#222] text-[#AAA] px-1.5 py-0.2 rounded-md">
                                  {DAYS_INFO.find((day) => day.dayOfWeek === d)?.short}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCouponId(coupon.id);
                              setActiveTab('whatsapp_generator');
                            }}
                            className="p-1.5 rounded-lg bg-[#FFA000]/15 hover:bg-[#FFA000]/25 text-[#FFA000] text-xs transition-colors cursor-pointer"
                            title="Gerar Mensagem de WhatsApp com este cupom"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(coupon.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                              coupon.isActive
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/60'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {coupon.isActive ? 'Ativo' : 'Inativo'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/50 transition-colors cursor-pointer"
                            title="Excluir cupom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[#151515] border-t border-[#242424] flex items-center justify-between text-xs text-[#777] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FFA000]" />
            <span>Os cupons cadastrados aqui são validados automaticamente na sacola do cliente.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#242424] hover:bg-[#2E2E2E] text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
