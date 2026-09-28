import React from 'react';
import { Clock, Plus, Sparkles, Flame } from 'lucide-react';
import { MenuItem } from '../types';

interface ProductCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(item)}
      className="group flex flex-col justify-between bg-[#FAF5EE] rounded-3xl border border-[#D9C5AB] hover:border-[#B44C16] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer h-full"
    >
      {/* Image Container with overlay & badge */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#EADCC8]">
        <img
          src={item.image}
          alt={item.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          loading="lazy"
        />

        {/* Gradient overlay for contrast */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Highlight Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {item.isPosterHighlight && (
            <span className="inline-flex items-center gap-1 bg-[#B44C16] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
              <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
              Lanche do Pôster
            </span>
          )}
          {item.isPopular && !item.isPosterHighlight && (
            <span className="inline-flex items-center gap-1 bg-[#231815] text-[#F59E0B] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              Mais Pedido
            </span>
          )}
          {item.isNew && (
            <span className="inline-flex items-center gap-1 bg-emerald-700 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
              Novidade
            </span>
          )}
        </div>

        {/* Preparation time badge */}
        <div className="absolute bottom-3 right-3 bg-[#231815]/85 backdrop-blur-xs text-[#FAF5EE] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm">
          <Clock className="w-3 h-3 text-[#F59E0B]" />
          <span>{item.preparationTime}</span>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 sm:p-6 flex flex-col flex-grow justify-between">
        <div>
          {/* Tagline */}
          <div className="text-xs font-bold text-[#B44C16] uppercase tracking-wider mb-1">
            {item.tagline}
          </div>

          {/* Product Name */}
          <h3 className="font-brand text-xl sm:text-2xl text-[#231815] group-hover:text-[#B44C16] transition-colors line-clamp-1 mb-2">
            {item.name}
          </h3>

          {/* Product Description */}
          <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed line-clamp-2 mb-4">
            {item.description}
          </p>
        </div>

        {/* Price & Action Button Footer */}
        <div className="pt-3 border-t border-[#D9C5AB]/60 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            {item.originalPrice && (
              <span className="text-xs text-[#8C6B58] line-through font-semibold">
                R$ {item.originalPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-[#4A382F]">R$</span>
              <span className="font-brand text-2xl font-black text-[#231815]">
                {item.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="flex items-center gap-1.5 bg-[#231815] group-hover:bg-[#B44C16] text-[#FAF5EE] px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Pedir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
