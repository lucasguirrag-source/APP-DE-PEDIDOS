import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Check, ShoppingBag, Sparkles, Clock, Play, Image as ImageIcon, Volume2, VolumeX, Settings, ZoomIn, Maximize2 } from 'lucide-react';
import { MenuItem, SelectedExtra, CartItem, ExtraOption } from '../types';

interface ProductCustomizerModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: Omit<CartItem, 'cartItemId'>) => void;
  availableComplements?: ExtraOption[];
}

export const ProductCustomizerModal: React.FC<ProductCustomizerModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
  availableComplements,
}) => {
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [selectedRemovals, setSelectedRemovals] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddedAnimation, setIsAddedAnimation] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item) {
      setSelectedExtras([]);
      setSelectedRemovals([]);
      setNotes('');
      setQuantity(1);
      setIsAddedAnimation(false);
      setShowVideo(false);
      setIsMuted(true);
      setIsImageZoomOpen(false);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  // Prioriza complementos específicos do produto cadastrados pelo administrador (Item 6)
  const extrasList = (item.availableExtras && item.availableExtras.length > 0
    ? item.availableExtras.filter((e) => e.enabled !== false)
    : (availableComplements && availableComplements.length > 0
        ? availableComplements.filter((e) => e.enabled !== false)
        : []
      )
  );

  // Adiciona mais uma unidade do complemento desejado (respeitando maxQuantity se configurado)
  const handleIncrementExtra = (extra: ExtraOption) => {
    const maxQty = extra.maxQuantity && extra.maxQuantity > 0 ? extra.maxQuantity : 10;
    setSelectedExtras((prev) => {
      const existing = prev.find((e) => e.id === extra.id);
      if (existing) {
        if (existing.quantity >= maxQty) return prev;
        return prev.map((e) =>
          e.id === extra.id ? { ...e, quantity: e.quantity + 1 } : e
        );
      } else {
        return [
          ...prev,
          {
            id: extra.id,
            name: extra.name,
            price: extra.price,
            quantity: 1,
            image: extra.image,
          },
        ];
      }
    });
  };

  // Subtrai uma unidade ou remove se zerar
  const handleDecrementExtra = (extra: ExtraOption) => {
    setSelectedExtras((prev) => {
      const existing = prev.find((e) => e.id === extra.id);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((e) => e.id !== extra.id);
      }
      return prev.map((e) =>
        e.id === extra.id ? { ...e, quantity: e.quantity - 1 } : e
      );
    });
  };

  const toggleRemoval = (removal: string) => {
    setSelectedRemovals((prev) => {
      if (prev.includes(removal)) {
        return prev.filter((r) => r !== removal);
      } else {
        return [...prev, removal];
      }
    });
  };

  // Total de adicionais multiplicando preço pela quantidade de cada um
  const extrasTotal = selectedExtras.reduce(
    (acc, curr) => acc + curr.price * curr.quantity,
    0
  );
  const unitPrice = item.price + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    setIsAddedAnimation(true);
    setTimeout(() => {
      onAddToCart({
        item,
        quantity,
        selectedExtras,
        selectedRemovals,
        notes: notes.trim() || undefined,
        unitPrice,
        totalPrice,
      });
      setIsAddedAnimation(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-[#121212] text-white rounded-3xl border border-[#2B2B2B] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com Foto ou Vídeo */}
        <div className="relative h-48 sm:h-64 w-full bg-black shrink-0 overflow-hidden">
          {showVideo && item.videoUrl ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={item.videoUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
              />

              {/* Controles de Som do Vídeo */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-3 left-3 bg-black/80 hover:bg-black text-white p-2 rounded-full backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                title={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#FFA000]" />}
              </button>

              {/* Alternar de volta para foto */}
              <button
                type="button"
                onClick={() => setShowVideo(false)}
                className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer shadow-md"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Ver foto</span>
              </button>
            </div>
          ) : (
            <div 
              className="relative w-full h-full cursor-zoom-in group select-none"
              onClick={() => setIsImageZoomOpen(true)}
              title="Clique para visualizar a imagem inteira"
            >
              <img
                src={item.image}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/30 to-transparent" />

              {/* Botão de Dica: Ver Foto Inteira */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageZoomOpen(true);
                }}
                className="absolute top-3.5 right-14 bg-black/80 hover:bg-black text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs transition-all shadow-md border border-white/20 hover:border-[#FFA000] cursor-pointer"
                title="Ver foto inteira"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#FFA000]" />
                <span className="text-[10px] sm:text-xs">Foto inteira</span>
              </button>

              {/* Botão em destaque "Ver vídeo do prato" */}
              {item.videoUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideo(true);
                  }}
                  className="absolute bottom-3 right-3 bg-[#FFA000] hover:bg-[#FFB300] text-black px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer animate-pulse"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Ver vídeo do prato</span>
                </button>
              )}
            </div>
          )}

          {/* Botão de Fechar Modal */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 bg-black/70 hover:bg-black text-white p-2 rounded-full transition-colors cursor-pointer shadow-md z-10"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tag de chapa quente */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10">
            <span className="bg-black/80 border border-[#FFA000]/40 backdrop-blur-xs text-[#FFA000] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FFA000]" />
              <span>Na Chapa Quente</span>
            </span>
          </div>

          {/* Nome */}
          {!showVideo && (
            <div className="absolute bottom-3 left-5 right-28">
              <h2 className="font-brand text-2xl sm:text-3xl text-white leading-tight truncate drop-shadow-md">
                {item.name}
              </h2>
            </div>
          )}
        </div>

        {/* Conteúdo com Fundo Branco, Bordas em Preto e Laranja */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-grow bg-white text-zinc-900">
          
          {showVideo && (
            <div>
              <h2 className="font-brand font-black text-2xl sm:text-3xl text-zinc-900 leading-tight">
                {item.name}
              </h2>
            </div>
          )}

          {/* Banner interativo: "Ver vídeo do prato" */}
          {item.videoUrl && (
            <button
              type="button"
              onClick={() => setShowVideo(!showVideo)}
              className={`w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer group ${
                showVideo
                  ? 'bg-orange-50 border-[#FF7A00] text-zinc-900 shadow-sm'
                  : 'bg-zinc-50 border-black hover:border-[#FF7A00] text-zinc-900 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FF7A00] text-black flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </div>
                <div className="text-left">
                  <span className="font-brand font-black text-xs sm:text-sm text-zinc-900 block">
                    {showVideo ? 'Reproduzindo vídeo do prato' : 'Ver vídeo do preparo'}
                  </span>
                  <span className="text-[11px] text-zinc-600 block">
                    Assista o preparo artesanal e veja todos os detalhes antes de pedir
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#FF7A00] underline shrink-0 hidden sm:inline">
                {showVideo ? 'Ver foto' : 'Assistir agora'}
              </span>
            </button>
          )}

          {/* Descrição */}
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
            <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
              {item.description}
            </p>
            <div className="shrink-0 bg-white border-2 border-black text-zinc-900 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>{item.preparationTime}</span>
            </div>
          </div>

          {/* Turbine com Adicionais */}
          {extrasList && extrasList.length > 0 && (
            <div className="space-y-3 pt-3 border-t-2 border-zinc-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-brand text-xs uppercase tracking-wider text-zinc-900 font-black">
                    Turbine com Adicionais
                  </span>
                  <span className="text-[10px] bg-[#FF7A00] text-black px-2 py-0.5 rounded-full font-black uppercase">
                    Ilimitado
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 font-semibold">Opcional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {extrasList.map((extra) => {
                  const selected = selectedExtras.find((e) => e.id === extra.id);
                  const qty = selected?.quantity || 0;

                  return (
                    <div
                      key={extra.id}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border-2 transition-all ${
                        qty > 0
                          ? 'border-[#FF7A00] bg-orange-50/70 shadow-sm'
                          : 'border-black bg-white hover:border-[#FF7A00]'
                      }`}
                    >
                      {/* Lado Esquerdo: Imagem Pequena NÃO CLICÁVEL + Nome e Preço */}
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {extra.image && (
                          <img
                            src={extra.image}
                            alt={extra.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover shrink-0 pointer-events-none select-none border border-zinc-300 shadow-xs"
                          />
                        )}

                        <div className="min-w-0">
                          <div className="font-brand text-xs sm:text-sm text-zinc-900 font-bold truncate">
                            {extra.name}
                          </div>
                          <div className="text-[11px] sm:text-xs text-[#FF7A00] font-black">
                            + R$ {extra.price.toFixed(2).replace('.', ',')}
                            {qty > 1 && (
                              <span className="text-zinc-600 font-semibold ml-1">
                                ({qty}x = R$ {(extra.price * qty).toFixed(2).replace('.', ',')})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Botão (+) para adicionar quantos desejar e (-) para diminuir */}
                      <div className="shrink-0 flex items-center">
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleIncrementExtra(extra)}
                            className="flex items-center gap-1 bg-[#FF7A00] hover:bg-[#FF8F00] text-black font-brand font-black px-2.5 py-1.5 rounded-xl text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm border border-black"
                            title={`Adicionar ${extra.name}`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Adicionar</span>
                          </button>
                        ) : (
                          <div className="flex items-center bg-white border-2 border-[#FF7A00] rounded-xl p-0.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleDecrementExtra(extra)}
                              className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-black flex items-center justify-center transition-colors cursor-pointer"
                              title="Diminuir"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className="w-7 text-center font-brand font-black text-xs text-[#FF7A00]">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncrementExtra(extra)}
                              className="w-7 h-7 rounded-lg bg-[#FF7A00] hover:bg-[#FF8F00] text-black font-black flex items-center justify-center transition-colors cursor-pointer hover:scale-105"
                              title="Adicionar mais um"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Retirar Ingredientes */}
          {item.removalsList && item.removalsList.length > 0 && (
            <div className="space-y-2 pt-3 border-t-2 border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="font-brand text-xs uppercase tracking-wider text-zinc-900 font-black">
                  Deseja retirar algum ingrediente?
                </span>
                <span className="text-[11px] text-zinc-500 font-semibold">Opcional</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.removalsList.map((removal) => {
                  const isRemoved = selectedRemovals.includes(removal);
                  return (
                    <button
                      key={removal}
                      type="button"
                      onClick={() => toggleRemoval(removal)}
                      className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                        isRemoved
                          ? 'border-red-600 bg-red-50 text-red-600 line-through'
                          : 'border-black bg-white text-zinc-800 hover:border-[#FF7A00] hover:bg-orange-50/50'
                      }`}
                    >
                      Sem {removal}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observações para a Cozinha */}
          <div className="space-y-1.5 pt-3 border-t-2 border-zinc-100">
            <label className="font-brand text-xs uppercase tracking-wider text-zinc-900 font-black block">
              Observações Especiais
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Mandar guardanapos extras, maionese no potinho..."
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black bg-white text-xs font-medium text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-[#FF7A00]"
            />
          </div>

        </div>

        {/* Rodapé Fixo */}
        <div className="p-4 sm:p-5 bg-white border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Seletor de Quantidade */}
          <div className="flex items-center bg-zinc-100 border-2 border-black rounded-2xl p-1 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 hover:bg-zinc-200 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-brand font-black text-base text-zinc-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Botão Adicionar à Sacola */}
          <button
            onClick={handleConfirm}
            className={`w-full sm:flex-1 flex items-center justify-between px-6 py-3.5 rounded-2xl font-brand text-sm tracking-wide shadow-md transition-all cursor-pointer border-2 border-black ${
              isAddedAnimation
                ? 'bg-emerald-500 text-black scale-98 font-black'
                : 'bg-[#FF7A00] hover:bg-[#FF8F00] text-black font-black shadow-lg shadow-[#FF7A00]/25'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-black" />
              <span>{isAddedAnimation ? 'Adicionado!' : 'Adicionar à Sacola'}</span>
            </div>
            <span className="text-base font-black">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>

      </div>

      {/* MODAL LIGHTBOX: VISUALIZAR IMAGEM INTEIRA COM BOTÃO X INTUITIVO */}
      {isImageZoomOpen && item && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsImageZoomOpen(false)}
        >
          {/* Barra Superior com Título e Botão X Intuitivo */}
          <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between z-50 pointer-events-none">
            <div className="pointer-events-auto bg-black/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-zinc-800 shadow-2xl max-w-[70%]">
              <h3 className="font-brand font-black text-sm sm:text-lg text-white truncate">
                {item.name}
              </h3>
              <p className="text-[11px] text-[#FFA000] font-bold">Visualização completa da foto</p>
            </div>

            {/* BOTÃO X INTUITIVO PARA SAIR DA IMAGEM */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsImageZoomOpen(false);
              }}
              className="pointer-events-auto bg-[#FFA000] hover:bg-[#FFB300] text-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-brand font-black flex items-center gap-2 shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Sair da imagem"
            >
              <X className="w-5 h-5 stroke-[3]" />
              <span>FECHAR (X)</span>
            </button>
          </div>

          {/* Imagem Completa (Uncropped / object-contain) */}
          <div 
            className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={item.image}
              alt={item.name}
              className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] border border-zinc-800 cursor-zoom-out"
              onClick={() => setIsImageZoomOpen(false)}
            />
          </div>

          {/* Dica no rodapé */}
          <div className="absolute bottom-4 text-center pointer-events-none">
            <p className="text-xs text-zinc-400 bg-black/80 px-4 py-1.5 rounded-full border border-zinc-800 backdrop-blur-xs">
              Toque no botão <strong className="text-white">FECHAR (X)</strong> ou na imagem para voltar ao pedido
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
