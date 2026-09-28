import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import defaultBannerCombo from '../assets/images/piscou_chegou_banner_1790426174499.jpg';

interface HeroBannerProps {
  onScrollToMenu: () => void;
  bannerImageUrl?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onScrollToMenu, bannerImageUrl }) => {
  // Se o lojista configurou uma imagem de capa customizada (via upload ou URL), exibe ela com destaque total
  if (bannerImageUrl && bannerImageUrl.trim() !== '') {
    return (
      <section 
        onClick={onScrollToMenu}
        className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#2B2B2B] my-2 sm:my-3 shadow-2xl cursor-pointer group bg-black transition-all hover:border-[#FFA000]/60 active:scale-[0.995]"
        title="Clique para ver o cardápio"
      >
        <img
          src={bannerImageUrl}
          alt="Banner Promocional - AI QUE FOME"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          className="w-full h-auto max-h-[260px] sm:max-h-[360px] md:max-h-[440px] object-cover object-center rounded-2xl sm:rounded-3xl transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Botão flutuante sutil no canto inferior para facilitar a navegação */}
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 bg-black/85 backdrop-blur-md border border-[#FFA000]/50 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 shadow-lg group-hover:bg-[#FFA000] group-hover:text-black transition-all">
          <span className="font-brand font-black text-[10px] sm:text-xs uppercase tracking-wider">
            Ver Cardápio
          </span>
          <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
        </div>
      </section>
    );
  }

  // Banner Padrão: "PISCOU? CHEGOU" com o combo artesanal de smash burger, batatas e refrigerante
  return (
    <section 
      onClick={onScrollToMenu}
      className="relative w-full bg-gradient-to-r from-black via-[#0D0D0D] to-[#121212] text-white overflow-hidden rounded-2xl sm:rounded-3xl border border-[#262626] my-2 sm:my-3 shadow-2xl cursor-pointer group transition-all hover:border-[#FFA000]/50"
      title="Clique para ver o cardápio"
    >
      <div className="flex items-center justify-between min-h-[125px] sm:min-h-[160px] md:min-h-[190px] px-3.5 sm:px-6 md:px-8 relative">
        
        {/* Lado Esquerdo: Tipografia Marcante "PISCOU? CHEGOU" com estética da hamburgueria */}
        <div className="flex flex-col justify-center space-y-1 sm:space-y-1.5 z-10 py-3 sm:py-4 max-w-[62%] sm:max-w-[55%]">
          
          {/* Badge FOME */}
          <div className="inline-flex items-center gap-1.5">
            <span className="bg-[#FFA000] text-black px-2 py-0.5 rounded-lg text-[9px] sm:text-[11px] font-brand font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-[#FFA000]/20">
              <Sparkles className="w-2.5 h-2.5 text-black" />
              AI QUE FOME
            </span>
            <span className="text-[10px] sm:text-xs text-[#8E8E8E] font-bold hidden sm:inline-block">
              · Capim Grosso - BA
            </span>
          </div>

          {/* Slogan "PISCOU? CHEGOU" */}
          <div className="select-none leading-none pt-0.5">
            <span className="block font-brand font-black text-2xl sm:text-4xl md:text-5xl text-[#F5F2EB] tracking-tight drop-shadow-sm">
              PISCOU?
            </span>
            <span className="block font-brand font-black text-3xl sm:text-5xl md:text-6xl text-[#FFA000] tracking-tight -mt-1 sm:-mt-2 drop-shadow-md">
              CHEGOU
            </span>
          </div>

          <p className="text-[10px] sm:text-xs text-[#A3A3A3] font-medium hidden xs:block">
            Smash burgers prensados na brasa com cheddar derretido e entrega rápida.
          </p>

          {/* Botão Ver Cardápio */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 bg-[#FFA000] group-hover:bg-[#FFB300] text-black font-brand font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs tracking-wider uppercase transition-all shadow-md shadow-[#FFA000]/20 group-hover:scale-103">
              <span>Ver Cardápio</span>
              <ArrowDown className="w-3 h-3 stroke-[2.5]" />
            </span>
          </div>

        </div>

        {/* Lado Direito: Foto do Combo com Smash Burger, Batatas Fritas e Refrigerante Gelado */}
        <div className="relative h-full w-40 sm:w-64 md:w-96 shrink-0 overflow-hidden flex items-center justify-end self-stretch">
          <img
            src={defaultBannerCombo}
            alt="Combo Smash Burger com Batatas e Refrigerante - AI QUE FOME"
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-right sm:object-center transition-transform duration-300 group-hover:scale-105"
          />
          {/* Efeito de fade suave conectando perfeitamente a foto com a área de texto */}
          <div className="absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-black via-black/70 to-transparent pointer-events-none" />
        </div>

      </div>
    </section>
  );
};
