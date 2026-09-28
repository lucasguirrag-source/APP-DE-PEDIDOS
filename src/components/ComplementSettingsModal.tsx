import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Check, Sparkles, Image as ImageIcon, DollarSign, Eye, EyeOff } from 'lucide-react';
import { ExtraOption } from '../types';
import { DEFAULT_EXTRAS } from '../data/menuData';

// Presets de imagens prontas de alta qualidade para escolha rápida
import extraBaconImg from '../assets/images/extra_bacon_crispy_1790109900778.jpg';
import extraCheddarImg from '../assets/images/extra_cheddar_melt_1790109912175.jpg';
import extraPattyImg from '../assets/images/extra_smash_patty_1790109924529.jpg';
import extraCheeseImg from '../assets/images/extra_cheese_double_1790109982674.jpg';
import extraSauceImg from '../assets/images/extra_sauce_pot_1790109962556.jpg';
import extraPicklesImg from '../assets/images/extra_pickles_slices_1790109973826.jpg';
import extraCrispyOnionImg from '../assets/images/extra_crispy_onion_1790109936341.jpg';

export const COMPLEMENT_IMAGE_PRESETS = [
  { label: 'Bacon Crocante', url: extraBaconImg },
  { label: 'Cheddar Quente', url: extraCheddarImg },
  { label: 'Carne Smash', url: extraPattyImg },
  { label: 'Queijo Duplo', url: extraCheeseImg },
  { label: 'Molho da Casa', url: extraSauceImg },
  { label: 'Picles Fatiados', url: extraPicklesImg },
  { label: 'Cebola Crispy', url: extraCrispyOnionImg },
];

interface ComplementSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  complements: ExtraOption[];
  onSaveComplements: (updated: ExtraOption[]) => void;
}

export const ComplementSettingsModal: React.FC<ComplementSettingsModalProps> = ({
  isOpen,
  onClose,
  complements,
  onSaveComplements,
}) => {
  const [list, setList] = useState<ExtraOption[]>(complements);
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  // Form para adicionar novo complemento
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('5.00');
  const [newImage, setNewImage] = useState<string>(extraBaconImg);

  // Sincroniza ao abrir
  React.useEffect(() => {
    if (isOpen) {
      setList(complements);
      setIsSavedNotice(false);
      setShowAddForm(false);
    }
  }, [isOpen, complements]);

  if (!isOpen) return null;

  const handleUpdateItem = (id: string, updates: Partial<ExtraOption>) => {
    setList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleToggleActive = (id: string) => {
    setList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: item.enabled === false ? true : false } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewComplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const parsedPrice = parseFloat(newPrice.replace(',', '.')) || 0;
    const newItem: ExtraOption = {
      id: `extra-custom-${Date.now()}`,
      name: newName.trim(),
      price: parsedPrice,
      image: newImage,
      enabled: true,
    };

    setList((prev) => [...prev, newItem]);
    setNewName('');
    setNewPrice('5.00');
    setShowAddForm(false);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Tem certeza que deseja restaurar a lista padrão de complementos?')) {
      setList(DEFAULT_EXTRAS);
    }
  };

  const handleSave = () => {
    onSaveComplements(list);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#121212] text-white rounded-3xl border border-[#2B2B2B] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#222222] flex items-center justify-between bg-[#161616] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFA000]/15 border border-[#FFA000]/40 flex items-center justify-center text-[#FFA000]">
              <Sparkles className="w-5 h-5 text-[#FFA000]" />
            </div>
            <div>
              <h2 className="font-brand font-black text-lg sm:text-xl text-white">
                Configurações de Complementos
              </h2>
              <p className="text-xs text-[#8E8E8E]">
                Edite nomes, valores, imagens e adicione novos adicionais
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#202020] hover:bg-[#2B2B2B] text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-grow">
          
          {/* Ações de Topo: Adicionar e Restaurar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#FFA000]/15"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{showAddForm ? 'Fechar formulário' : 'Novo Complemento'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 text-xs text-[#8E8E8E] hover:text-[#FFA000] px-3 py-1.5 rounded-xl border border-[#2B2B2B] hover:border-[#FFA000]/40 transition-colors cursor-pointer"
              title="Restaurar lista original"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          {/* Formulário para Adicionar Novo Complemento */}
          {showAddForm && (
            <form
              onSubmit={handleAddNewComplement}
              className="bg-[#181818] border border-[#FFA000]/40 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="font-brand font-black text-xs uppercase tracking-wider text-[#FFA000]">
                  Adicionar Novo Complemento
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-[#888888] hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] text-[#A3A3A3] font-bold">Nome do Complemento</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Queijo Gorgonzola Especial"
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#2B2B2B] text-xs text-white placeholder-[#555] focus:outline-hidden focus:border-[#FFA000]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#A3A3A3] font-bold">Preço Unitário (R$)</label>
                  <input
                    type="text"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="5.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#2B2B2B] text-xs text-white placeholder-[#555] focus:outline-hidden focus:border-[#FFA000]"
                  />
                </div>
              </div>

              {/* Escolha da Foto */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] text-[#A3A3A3] font-bold flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-[#FFA000]" />
                  <span>Escolha a Imagem do Complemento:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPLEMENT_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewImage(preset.url)}
                      className={`flex items-center gap-1.5 p-1 rounded-xl border text-[11px] transition-all cursor-pointer ${
                        newImage === preset.url
                          ? 'border-[#FFA000] bg-[#FFA000]/15 text-white font-bold'
                          : 'border-[#2B2B2B] bg-[#121212] text-[#888888] hover:border-[#404040]'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-md object-cover pointer-events-none select-none"
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black px-4 py-2 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer shadow-sm"
                >
                  Salvar e Inserir na Lista
                </button>
              </div>
            </form>
          )}

          {/* Lista de Complementos */}
          <div className="space-y-2.5">
            <span className="font-brand font-black text-xs uppercase tracking-wider text-[#A3A3A3] block">
              Lista Atual de Complementos ({list.length})
            </span>

            {list.map((item) => {
              const isEnabled = item.enabled !== false;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isEnabled
                      ? 'bg-[#161616] border-[#2A2A2A]'
                      : 'bg-[#121212] border-[#222222] opacity-60'
                  }`}
                >
                  {/* Lado Esquerdo: Imagem Pequena Não Clicável + Nome + Preço */}
                  <div className="flex items-center gap-3 flex-grow min-w-0 w-full sm:w-auto">
                    {/* Imagem pequena não clicável */}
                    <div className="relative shrink-0">
                      <img
                        src={item.image || extraBaconImg}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-[#333333] pointer-events-none select-none shadow-xs"
                      />
                    </div>

                    {/* Inputs de Edição Direta */}
                    <div className="flex-grow space-y-1 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                        className="w-full font-brand text-xs sm:text-sm font-bold text-white bg-transparent border-b border-transparent hover:border-[#444] focus:border-[#FFA000] focus:outline-hidden px-1 py-0.5"
                        placeholder="Nome do complemento"
                      />
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-[#1F1F1F] px-2 py-0.5 rounded-lg border border-[#2B2B2B]">
                          <span className="text-[10px] text-[#FFA000] font-bold">R$</span>
                          <input
                            type="number"
                            step="0.50"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              handleUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                            }
                            className="w-16 font-brand text-xs font-bold text-[#FFA000] bg-transparent focus:outline-hidden"
                          />
                        </div>

                        {/* Seletor rápido de imagem para o item existente */}
                        <div className="relative group">
                          <button
                            type="button"
                            className="text-[10px] text-[#888] hover:text-[#FFA000] flex items-center gap-1 bg-[#1F1F1F] px-2 py-1 rounded-lg border border-[#2B2B2B] cursor-pointer"
                            title="Trocar foto do complemento"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Mudar foto</span>
                          </button>
                          
                          {/* Dropdown de fotos prontas no hover/click */}
                          <div className="hidden group-hover:flex absolute left-0 top-full mt-1 z-30 bg-[#1A1A1A] border border-[#333333] p-2 rounded-xl shadow-xl flex-wrap gap-1 w-64">
                            {COMPLEMENT_IMAGE_PRESETS.map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleUpdateItem(item.id, { image: p.url })}
                                className="flex items-center gap-1 p-1 rounded-lg hover:bg-[#252525] text-[10px] text-white cursor-pointer w-full"
                              >
                                <img
                                  src={p.url}
                                  alt={p.label}
                                  referrerPolicy="no-referrer"
                                  className="w-5 h-5 rounded-md object-cover pointer-events-none select-none"
                                />
                                <span className="truncate">{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ações: Ativar/Desativar e Excluir */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        isEnabled
                          ? 'bg-[#1E1E1E] text-white border-[#333333] hover:border-[#FFA000]'
                          : 'bg-[#181818] text-[#777] border-[#222222]'
                      }`}
                      title={isEnabled ? 'Desativar temporariamente' : 'Ativar complemento'}
                    >
                      {isEnabled ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">Ativo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[10px] text-zinc-500">Pausado</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 rounded-xl bg-[#1E1E1E] hover:bg-red-950/40 text-[#888] hover:text-red-400 border border-[#2B2B2B] hover:border-red-500/50 transition-colors cursor-pointer"
                      title="Excluir complemento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Rodapé Fixo com Botão Salvar */}
        <div className="p-4 sm:p-5 bg-[#0D0D0D] border-t border-[#222222] flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[#737373] hidden sm:block">
            As alterações são salvas e atualizam o cardápio em tempo real.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#2E2E2E] text-xs font-bold text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-brand font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                isSavedNotice
                  ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                  : 'bg-[#FFA000] hover:bg-[#FFB300] text-black shadow-[#FFA000]/20 hover:scale-102'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSavedNotice ? 'Salvo com sucesso!' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
