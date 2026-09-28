import React from 'react';
import { Flame, Star, Sparkles, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { FomeLogo } from './FomeLogo';
import { MenuItem } from '../types';
import heroBurgerImg from '../assets/images/hero_burger_cheddar_1790106215036.jpg';

interface HeroSectionProps {
  onOrderHeroItem: (item: MenuItem) => void;
  heroItem: MenuItem;
  onExploreMenu: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOrderHeroItem,
  heroItem,
  onExploreMenu,
}) => {
  return (
    <section className="relative overflow-hidden pt-4 pb-12 sm:pb-16 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Card replicating the user's poster aesthetic */}
        <div className="relative rounded-3xl bg-[#EADCC8] border border-[#D9C5AB] shadow-xl overflow-hidden">
          
          {/* Subtle paper grain texture pattern */}
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#231815 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 min-h-[560px] sm:min-h-[620px] items-stretch">
            
            {/* Left Side: Typography & Brand Identity from the Poster */}
            <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-between z-10">
              
              {/* Top micro badge */}
              <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#231815] text-[#FAF5EE] rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Smash Burger Artesanal
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#4A382F]">
                  <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  4.9 de 1.800+ avaliações
                </span>
              </div>

              {/* Poster Signature Typography */}
              <div className="space-y-1 mb-8">
                <div className="font-brand font-black text-6xl sm:text-7xl lg:text-8xl text-[#231815] tracking-tight leading-none select-none">
                  AI
                </div>
                <div className="font-brand font-black text-6xl sm:text-7xl lg:text-8xl text-[#B44C16] tracking-tight leading-none select-none">
                  FOME
                </div>
                <div className="font-brand font-black text-6xl sm:text-7xl lg:text-8xl text-[#231815] tracking-tight leading-none select-none">
                  QUE
                </div>

                {/* The iconic Stamp Logo */}
                <div className="pt-4 flex items-center gap-4">
                  <FomeLogo size="lg" variant="dark" />
                  <div className="h-10 w-px bg-[#D9C5AB]" />
                  <p className="text-xs sm:text-sm font-semibold text-[#4A382F] max-w-xs leading-relaxed">
                    A receita original: crosta ultra crocante de smash na chapa quente e rio de cheddar derretido artesanal.
                  </p>
                </div>
              </div>

              {/* CTAs and quick order */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                <button
                  onClick={() => onOrderHeroItem(heroItem)}
                  className="flex items-center justify-center gap-2.5 bg-[#B44C16] hover:bg-[#93380C] text-white px-7 py-4 rounded-2xl font-brand text-base tracking-wide shadow-lg shadow-[#B44C16]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                  <span>Pedir o Lanche do Pôster</span>
                  <span className="text-white/90 text-sm font-normal">· R$ {heroItem.price.toFixed(2).replace('.', ',')}</span>
                </button>

                <button
                  onClick={onExploreMenu}
                  className="flex items-center justify-center gap-2 bg-[#FAF5EE] hover:bg-white text-[#231815] border border-[#D9C5AB] px-5 py-4 rounded-2xl font-bold text-sm transition-all hover:border-[#B44C16] cursor-pointer"
                >
                  <span>Ver Cardápio</span>
                  <ArrowRight className="w-4 h-4 text-[#B44C16]" />
                </button>
              </div>

              {/* Bottom perks row */}
              <div className="grid grid-cols-3 gap-2 pt-8 mt-6 border-t border-[#D9C5AB]/70 text-[#4A382F]">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-[#B44C16] shrink-0" />
                  <span>30-45 min</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Flame className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>Chapa 100% Fresca</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pague no Pix/Cartão</span>
                </div>
              </div>

            </div>

            {/* Right Side: High-impact Food Photograph inspired by the poster */}
            <div className="lg:col-span-6 relative min-h-[380px] lg:min-h-full overflow-hidden flex items-center justify-center bg-[#E0CFB9]/50">
              
              {/* Background radial glow */}
              <div className="absolute inset-0 bg-radial from-[#F59E0B]/20 via-transparent to-transparent pointer-events-none" />

              {/* Burger image with dripping cheddar effect */}
              <div className="relative w-full h-full flex items-center justify-center p-6 lg:p-10">
                <div className="relative group max-w-lg w-full transition-transform duration-500 hover:scale-105">
                  <img
                    src={heroBurgerImg}
                    alt="Smash Burger O Brabo Cheddar - AI QUE FOME"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover rounded-2xl shadow-2xl border-4 border-[#FAF5EE]"
                  />

                  {/* Floating badge over image */}
                  <div className="absolute -bottom-4 right-4 sm:right-8 bg-[#231815] text-[#FAF5EE] px-4 py-3 rounded-2xl border-2 border-[#F59E0B] shadow-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#B44C16] flex items-center justify-center font-brand text-white font-black text-sm">
                      100%
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-xs text-white uppercase tracking-wider">Cheddar Borbulhante</span>
                      <span className="text-[11px] text-[#DECBB3]">Pão selado & 2x Smash 90g</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
