import React from 'react';
import { X, Check, Sparkles, Flame } from 'lucide-react';
import { FomeLogo } from './FomeLogo';
import heroBurgerImg from '../assets/images/hero_burger_cheddar_1790106215036.jpg';

interface DesignPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPosterBurger: () => void;
}

export const DesignPosterModal: React.FC<DesignPosterModalProps> = ({
  isOpen,
  onClose,
  onOrderPosterBurger,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[#FAF5EE] rounded-3xl border border-[#D9C5AB] shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#231815] text-[#FAF5EE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <h2 className="font-brand text-xl text-white">Identidade Visual & Pôster Oficial</h2>
              <p className="text-xs text-[#DECBB3]">Design autoral adaptado para o sistema de pedidos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#FAF5EE] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-grow">
          {/* Visual Showcase replicating the poster 1:1 */}
          <div className="max-w-md mx-auto aspect-[2/3] bg-[#DECBB3] rounded-3xl border-4 border-[#231815] shadow-2xl overflow-hidden relative flex flex-col justify-between p-6 sm:p-8">
            {/* Split layout simulation */}
            <div className="absolute inset-0 flex">
              {/* Left kraft paper column */}
              <div className="w-1/2 h-full bg-[#E4D5BE] flex flex-col justify-between py-10 px-6 z-10">
                <div className="space-y-1">
                  <div className="font-brand font-black text-5xl sm:text-6xl text-[#231815] leading-none">
                    AI
                  </div>
                  <div className="font-brand font-black text-5xl sm:text-6xl text-[#93380C] leading-none">
                    FOME
                  </div>
                  <div className="font-brand font-black text-5xl sm:text-6xl text-[#231815] leading-none">
                    QUE
                  </div>
                </div>

                <div className="flex justify-start">
                  <FomeLogo size="md" variant="dark" />
                </div>
              </div>

              {/* Right Burger half */}
              <div className="w-1/2 h-full overflow-hidden relative">
                <img
                  src={heroBurgerImg}
                  alt="Poster Smash Cheddar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-left"
                />
                <div className="absolute inset-y-0 left-0 w-1 bg-[#231815]/20 shadow-xs" />
              </div>
            </div>
          </div>

          {/* Details breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-white p-4 rounded-2xl border border-[#D9C5AB]">
              <div className="w-8 h-8 rounded-full bg-[#B44C16]/10 text-[#B44C16] flex items-center justify-center font-bold mb-2">
                <Check className="w-4 h-4" />
              </div>
              <h4 className="font-brand text-sm text-[#231815]">Tipografia & Cores</h4>
              <p className="text-xs text-[#5C483E] mt-1">
                Fundo kraft/papel reciclado, espresso profundo (#231815) e o caramelo quente (#B44C16).
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#D9C5AB]">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 text-[#B44C16] flex items-center justify-center font-bold mb-2">
                <Flame className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <h4 className="font-brand text-sm text-[#231815]">Lanche Assinatura</h4>
              <p className="text-xs text-[#5C483E] mt-1">
                O smash burger com cascata de cheddar do pôster transformado no lanche principal do cardápio.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#D9C5AB]">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-2">
                <Check className="w-4 h-4" />
              </div>
              <h4 className="font-brand text-sm text-[#231815]">Selo / Logo FOME</h4>
              <p className="text-xs text-[#5C483E] mt-1">
                Selo de pão de hambúrguer estilizado incorporado no topo, botões e sacola de pedidos.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#D9C5AB] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#8C6B58]">
            Deseja experimentar o burger do pôster?
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onOrderPosterBurger();
              }}
              className="flex-1 sm:flex-none bg-[#B44C16] hover:bg-[#93380C] text-white px-6 py-3 rounded-xl font-brand text-xs tracking-wider transition-colors cursor-pointer"
            >
              Pedir o Burger do Pôster
            </button>
            <button
              onClick={onClose}
              className="bg-[#FAF5EE] border border-[#D9C5AB] text-[#231815] px-5 py-3 rounded-xl font-bold text-xs hover:bg-[#EADCC8] transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
