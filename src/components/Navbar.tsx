import React from 'react';
import { ShoppingBag, ChevronRight, PackageCheck, Info, Gift, ExternalLink } from 'lucide-react';

interface NavbarProps {
  cartItemCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  hasActiveOrder?: boolean;
  onOpenOrderTracker?: () => void;
  onOpenDeliveryInfo: () => void;
  promoGroupLink?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartItemCount,
  cartTotal,
  onOpenCart,
  hasActiveOrder,
  onOpenOrderTracker,
  onOpenDeliveryInfo,
  promoGroupLink,
}) => {
  return (
    <header className="sticky top-0 z-40 px-2 sm:px-4 py-2 bg-black/90 backdrop-blur-md border-b border-[#222222] transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 h-13 sm:h-15">
        
        {/* Lado Esquerdo: Informações & Grupo VIP */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenDeliveryInfo}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#FFA000]/60 text-xs font-bold text-white transition-all cursor-pointer group shadow-xs"
            title="Conferir informações de entrega, horários e endereço"
          >
            <Info className="w-3.5 h-3.5 text-[#FFA000] group-hover:scale-110 transition-transform shrink-0" />
            <span className="hidden sm:inline text-[#D4D4D4]">Info:</span>
            <span className="text-[#FFA000] font-black underline flex items-center gap-0.5">
              Ver mais
              <ChevronRight className="w-3 h-3 inline-block" />
            </span>
          </button>

          {promoGroupLink && (
            <a
              href={promoGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 hover:border-[#25D366] text-xs font-black text-[#25D366] transition-all cursor-pointer shadow-xs"
              title="Entrar no Grupo VIP de Promoções e Descontos"
            >
              <Gift className="w-3.5 h-3.5 fill-[#25D366]" />
              <span className="hidden md:inline">Grupo VIP</span>
            </a>
          )}
        </div>

        {/* Centro: Logotipo AI QUE FOME com FOME em Laranja Cheddar */}
        <div className="flex-1 flex items-center justify-center min-w-0 select-none px-1 sm:px-2">
          <a
            href="#"
            className="flex items-center group"
            title="AI QUE FOME - Smash Burger"
          >
            <div className="font-brand font-black text-base sm:text-xl md:text-2xl tracking-tight whitespace-nowrap leading-none">
              <span className="text-white">AI </span>
              <span className="text-[#FFA000]">QUE </span>
              <span className="text-white group-hover:text-[#FFA000] transition-colors">FOME</span>
            </div>
          </a>
        </div>

        {/* Lado Direito: Status e Botão da Sacola */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {hasActiveOrder && (
            <button
              onClick={onOpenOrderTracker}
              className="hidden sm:flex items-center gap-1.5 bg-[#1A1A1A] border border-[#FFA000] text-[#FFA000] px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#FFA000] hover:text-black transition-colors cursor-pointer"
              title="Ver status do pedido"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Status</span>
            </button>
          )}

          {/* Botão da Sacola com Cor Cheddar Vibrante do Pôster */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-1.5 sm:gap-2 bg-[#FFA000] hover:bg-[#FFB300] text-black px-3 sm:px-4 py-2 rounded-xl font-brand font-black transition-all shadow-md shadow-[#FFA000]/15 cursor-pointer group"
            aria-label="Abrir Sacola"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-[#FFA000] text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[#FFA000]">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm text-black">
              R$ {cartTotal.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
