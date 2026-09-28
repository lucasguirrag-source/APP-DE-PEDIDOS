import React from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { MenuItem } from '../types';

interface RepeatOrdersBlockProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onQuickAdd?: (item: MenuItem) => void;
  customerPhone?: string;
  onClearCustomer?: () => void;
}

export const RepeatOrdersBlock: React.FC<RepeatOrdersBlockProps> = ({
  items,
  onSelectItem,
  onQuickAdd,
  onClearCustomer,
}) => {
  // Se o cliente não tiver histórico ou não houver itens válidos, o bloco fica 100% oculto
  if (!items || items.length === 0) {
    return null;
  }

  const handleAction = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();

    // Verifica se o item possui personalizações, adicionais, pontos da carne ou pães (Item 7 e 8)
    const hasCustomizations = Boolean(
      (item.availableExtras && item.availableExtras.length > 0) ||
      (item.meatDonenessOptions && item.meatDonenessOptions.length > 0) ||
      (item.availableBreads && item.availableBreads.length > 0) ||
      (item.removalsList && item.removalsList.length > 0) ||
      item.category === 'smash' ||
      item.category === 'combos'
    );

    if (hasCustomizations) {
      // Abre a tela normal de personalização do produto para que o cliente confirme as opções atuais
      onSelectItem(item);
    } else if (onQuickAdd) {
      // Produto simples sem personalização obrigatória: adiciona 1 unidade diretamente ao carrinho
      onQuickAdd(item);
    } else {
      onSelectItem(item);
    }
  };

  return (
    <section 
      aria-label="Peça de novo" 
      className="mb-8 p-3.5 sm:p-5 rounded-3xl bg-gradient-to-b from-[#181818] via-[#121212] to-[#0E0E0E] border border-[#2B2B2B] shadow-xl relative overflow-hidden"
    >
      {/* Luz ambiente sutil de fundo */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-[#FFA000]/5 blur-3xl pointer-events-none" />

      {/* Cabeçalho do Bloco */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#222222] relative z-10">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFA000] text-black flex items-center justify-center font-black shadow-md shadow-[#FFA000]/25 shrink-0">
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-brand text-lg sm:text-xl md:text-2xl text-white font-black tracking-wide uppercase flex items-center gap-2">
              Peça de novo
            </h2>
            <p className="text-[10px] sm:text-xs text-[#A3A3A3] font-medium hidden xs:block">
              Seus produtos favoritos dos seus pedidos anteriores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#FFA000] bg-[#FFA000]/10 border border-[#FFA000]/20 px-2.5 py-1 rounded-full shrink-0">
            <Sparkles className="w-3 h-3 text-[#FFA000]" />
            <span>Personalizado</span>
          </div>

          {onClearCustomer && (
            <button
              type="button"
              onClick={onClearCustomer}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer transition-colors"
              title="Trocar cliente neste dispositivo"
            >
              Trocar
            </button>
          )}
        </div>
      </div>

      {/* Grade de Produtos: Carrossel com scroll horizontal suave no celular e grid no tablet/desktop */}
      <div className="flex overflow-x-auto gap-2.5 sm:gap-3.5 pb-2 pt-1 scrollbar-none sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 relative z-10">
        {items.map((item) => (
          <div
            key={`repeat-${item.id}`}
            onClick={() => onSelectItem(item)}
            className="w-[160px] sm:w-auto shrink-0 sm:shrink group bg-[#161616] hover:bg-[#1C1C1C] border border-[#2A2A2A] hover:border-[#FFA000] rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#FFA000]/10 hover:-translate-y-0.5"
          >
            {/* Imagem do Produto com Preço Atualizado */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#202020] mb-2">
              <img
                src={item.image}
                alt={item.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('placeholder')) {
                    target.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80';
                  }
                }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Badge de preço atual do cardápio */}
              <div className="absolute bottom-1 right-1 bg-black/90 backdrop-blur-xs text-[#FFA000] border border-[#FFA000]/40 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-black font-brand shadow-xs">
                R$ {item.price.toFixed(2).replace('.', ',')}
              </div>
            </div>

            {/* Nome do Produto */}
            <div className="flex-1 flex flex-col justify-between min-h-[44px] mb-2">
              <h3 
                className="font-brand text-xs sm:text-sm text-white group-hover:text-[#FFA000] font-bold line-clamp-2 leading-tight transition-colors"
                title={item.name}
              >
                {item.name}
              </h3>
            </div>

            {/* Botão de Ação: "Pedir novamente" */}
            <button
              type="button"
              onClick={(e) => handleAction(item, e)}
              className="w-full py-2 px-2.5 bg-[#FFA000] hover:bg-[#FFB300] active:scale-95 text-black rounded-xl font-brand font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-[#FFA000]/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 stroke-[2.5]" />
              <span className="truncate">Pedir novamente</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
