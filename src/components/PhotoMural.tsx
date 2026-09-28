import React from 'react';
import { Plus, Play } from 'lucide-react';
import { MenuItem } from '../types';

interface PhotoMuralProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

export const PhotoMural: React.FC<PhotoMuralProps> = ({ items, onSelectItem }) => {
  return (
    <div className="w-full">
      {/* Mural compacto cabendo estritamente 3 itens em cada fileira com visual preto & cheddar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5 md:gap-4.5 w-full">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="min-w-0 w-full group rounded-2xl p-1.5 sm:p-2.5 bg-[#121212] border border-[#242424] hover:border-[#FFA000] hover:shadow-lg hover:shadow-[#FFA000]/10 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
          >
            {/* Foto quadrada compacta estilo mural */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#1A1A1A]">
              <img
                src={item.image}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  // Fallback para evitar requisições repetidas ou imagens quebradas
                  const target = e.currentTarget;
                  if (!target.src.includes('placeholder')) {
                    target.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80';
                  }
                }}
              />

              {/* Selo indicando vídeo demonstrativo do prato */}
              {item.videoUrl && (
                <div 
                  className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 bg-black/90 backdrop-blur-xs text-[#FFA000] border border-[#FFA000]/40 px-1 sm:px-1.5 py-0.5 rounded-md text-[8px] sm:text-[10px] font-bold flex items-center gap-1 shadow-xs"
                  title="Possui vídeo do prato"
                >
                  <Play className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#FFA000]" />
                  <span className="hidden xs:inline">Vídeo</span>
                </div>
              )}

              {/* Preço sobre a foto no cantinho com destaque cheddar */}
              <div className="absolute bottom-1 right-1 bg-black/90 backdrop-blur-xs text-[#FFA000] border border-[#FFA000]/40 px-1.5 py-0.5 rounded-md text-[9px] sm:text-xs font-black font-brand shadow-xs">
                R$ {item.price.toFixed(2).replace('.', ',')}
              </div>
            </div>

            {/* Informações do Produto: Título, Descrição e Botão (+) */}
            <div className="pt-2 px-0.5 flex flex-col gap-1 flex-grow justify-between">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <h3 
                    className="font-brand text-[11px] sm:text-xs md:text-sm text-white group-hover:text-[#FFA000] leading-tight line-clamp-1 transition-colors font-bold flex-1"
                    title={item.name}
                  >
                    {item.name}
                  </h3>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(item);
                    }}
                    className="shrink-0 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-md sm:rounded-lg bg-[#FFA000] hover:bg-[#FFB300] text-black transition-colors cursor-pointer shadow-xs font-black"
                    title="Pedir"
                  >
                    <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </button>
                </div>

                {item.description && (
                  <p 
                    className="text-[10px] sm:text-[11px] text-[#A3A3A3] line-clamp-2 leading-relaxed"
                    title={item.description}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
