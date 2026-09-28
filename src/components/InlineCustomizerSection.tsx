import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, ShoppingBag, Sparkles, Clock } from 'lucide-react';
import { MenuItem, SelectedExtra, CartItem, ExtraOption } from '../types';

interface InlineCustomizerSectionProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (cartItem: Omit<CartItem, 'cartItemId'>) => void;
}

export const InlineCustomizerSection: React.FC<InlineCustomizerSectionProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [selectedRemovals, setSelectedRemovals] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddedAnimation, setIsAddedAnimation] = useState<boolean>(false);

  // Reset/Initialize whenever active item changes
  useEffect(() => {
    if (item) {
      setSelectedExtras([]);
      setSelectedRemovals([]);
      setNotes('');
      setQuantity(1);
      setIsAddedAnimation(false);
    }
  }, [item]);

  if (!item) return null;

  // Toggle extra
  const toggleExtra = (extra: ExtraOption) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      } else {
        return [...prev, { id: extra.id, name: extra.name, price: extra.price, quantity: 1, image: extra.image }];
      }
    });
  };

  // Toggle removal
  const toggleRemoval = (removal: string) => {
    setSelectedRemovals((prev) => {
      if (prev.includes(removal)) {
        return prev.filter((r) => r !== removal);
      } else {
        return [...prev, removal];
      }
    });
  };

  // Calculate unit price and total
  const extrasTotal = selectedExtras.reduce((acc, curr) => acc + (curr.price * (curr.quantity || 1)), 0);
  const unitPrice = item.price + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    setIsAddedAnimation(true);
    setTimeout(() => {
      onAddToCart({
        item,
        selectedExtras,
        selectedRemovals,
        notes: notes.trim() || undefined,
        quantity,
        unitPrice,
        totalPrice,
      });
      setIsAddedAnimation(false);
    }, 250);
  };

  return (
    <section 
      id="detalhes-lanche" 
      className="mt-6 sm:mt-8 scroll-mt-20 animate-in slide-in-from-top-4 fade-in duration-300 transition-all"
    >
      {/* Container 100% Branco, Moderno e Limpo */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden p-5 sm:p-7 lg:p-8 relative">
        
        {/* Header bar com botão de fechar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#9C4915] text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              Pedido Selecionado
            </span>
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
              Personalize os adicionais e monte o seu lanche
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <span>Fechar</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grade Principal: Foto com visual limpo à esquerda, Opções à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* Lado Esquerdo: Foto Viva e Detalhes */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-gray-50 group">
              <img
                src={item.image}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Selo de Chapa Quente */}
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs text-[#F59E0B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Na Chapa Quente</span>
              </div>

              {/* Tempo */}
              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm">
                <Clock className="w-3 h-3 text-[#F59E0B]" />
                <span>{item.preparationTime}</span>
              </div>

              {/* Preço de Destaque */}
              <div className="absolute bottom-3 right-3 bg-[#9C4915] text-white px-4 py-1.5 rounded-xl font-brand text-xl font-black shadow-lg">
                R$ {unitPrice.toFixed(2).replace('.', ',')}
              </div>
            </div>

            {/* Badges de Destaque */}
            <div className="mt-4 w-full flex flex-wrap gap-2 justify-center">
              <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-lg border border-gray-200">
                100% Artesanal
              </span>
              <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-lg border border-gray-200">
                Receita Exclusiva
              </span>
              {item.calories && (
                <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-lg border border-gray-200">
                  ~{item.calories} kcal
                </span>
              )}
            </div>
          </div>

          {/* Lado Direito: Informações e Personalização em Fundo Branco */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Título e Descrição */}
            <div>
              <span className="text-xs font-bold text-[#9C4915] uppercase tracking-wider block mb-1">
                {item.tagline}
              </span>
              <h2 className="font-brand text-2xl sm:text-3xl text-gray-900 leading-tight">
                {item.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-1.5">
                {item.description}
              </p>
            </div>

            {/* Adicionais / Turbinar o Lanche */}
            {item.availableExtras && item.availableExtras.length > 0 && (
              <div className="space-y-2.5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black font-brand uppercase tracking-wider text-gray-900">
                    Turbinar seu Lanche (Opcional)
                  </label>
                  <span className="text-[11px] text-gray-500">Escolha o quanto quiser</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.availableExtras.map((extra) => {
                    const isSelected = selectedExtras.some((e) => e.id === extra.id);
                    return (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => toggleExtra(extra)}
                        className={`p-3 rounded-xl text-left border text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-[#9C4915] text-gray-900 font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-[#9C4915] border-[#9C4915] text-white' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span>{extra.name}</span>
                        </div>
                        <span className="text-[#9C4915] font-bold">
                          + R$ {extra.price.toFixed(2).replace('.', ',')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Remoções de Ingredientes */}
            {item.removalsList && item.removalsList.length > 0 && (
              <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <label className="text-xs font-black font-brand uppercase tracking-wider text-gray-900 block">
                  Deseja remover algum ingrediente?
                </label>
                <div className="flex flex-wrap gap-2">
                  {item.removalsList.map((ing) => {
                    const isRemoved = selectedRemovals.includes(ing);
                    return (
                      <button
                        key={ing}
                        type="button"
                        onClick={() => toggleRemoval(ing)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isRemoved
                            ? 'bg-rose-50 border-rose-300 text-rose-700 line-through'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Sem {ing}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Observações para a Cozinha */}
            <div className="space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <label className="text-xs font-black font-brand uppercase tracking-wider text-gray-900 block">
                Observações para a Chapa
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: caprichar no molho, cortar ao meio..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-[#9C4915] focus:ring-1 focus:ring-[#9C4915]"
              />
            </div>

            {/* Barra Inferior: Quantidade e Botão Adicionar à Sacola */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              
              {/* Seletor de Quantidade */}
              <div className="flex items-center gap-3 bg-gray-100 px-4 py-2.5 rounded-2xl border border-gray-200">
                <span className="text-xs font-bold text-gray-600">Quantidade:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 flex items-center justify-center text-gray-800 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-brand text-base font-black w-6 text-center text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CTA Adicionar à Sacola */}
              <button
                type="button"
                onClick={handleConfirm}
                className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-brand text-sm uppercase tracking-wider text-white shadow-md transition-all cursor-pointer ${
                  isAddedAnimation 
                    ? 'bg-emerald-600 scale-98' 
                    : 'bg-[#9C4915] hover:bg-[#833C0F] hover:shadow-lg'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isAddedAnimation 
                    ? 'Adicionado com Sucesso!' 
                    : `Adicionar à Sacola • R$ ${totalPrice.toFixed(2).replace('.', ',')}`}
                </span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
