import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Sparkles, 
  Percent, 
  Check, 
  TrendingUp, 
  Tag, 
  Layers, 
  ArrowUpRight,
  Flame,
  Lightbulb,
  Edit2
} from 'lucide-react';
import { ProductCostSheet } from '../../../types/pricing';
import { calculatePricingMetrics } from '../../../utils/pricingEngine';

interface ProductCostResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: ProductCostSheet;
  onUpdateSheetMargin: (newMargin: number, newCommercialPrice?: number) => void;
  onApplyPriceToMenu?: (productId: string, newPrice: number) => void;
  onOpenWizardToEdit?: () => void;
  showToast: (msg: string) => void;
}

export const ProductCostResultModal: React.FC<ProductCostResultModalProps> = ({
  isOpen,
  onClose,
  sheet,
  onUpdateSheetMargin,
  onApplyPriceToMenu,
  onOpenWizardToEdit,
  showToast,
}) => {
  const [selectedMargin, setSelectedMargin] = useState<number>(sheet.targetMarginPercent || 30);
  const [customMarginInput, setCustomMarginInput] = useState<string>(String(sheet.targetMarginPercent || 30));

  if (!isOpen) return null;

  const metrics = calculatePricingMetrics(
    sheet.totalDirectCost,
    selectedMargin,
    sheet.appFeePercent,
    sheet.paymentFeePercent,
    sheet.currentSalePrice
  );

  const handleSelectMargin = (margin: number) => {
    setSelectedMargin(margin);
    setCustomMarginInput(String(margin));
  };

  const handleCustomMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomMarginInput(e.target.value);
    const num = parseFloat(e.target.value);
    if (!isNaN(num) && num > 0 && num < 90) {
      setSelectedMargin(num);
    }
  };

  const handleSaveAndApply = () => {
    onUpdateSheetMargin(selectedMargin, metrics.commercialSuggestedPrice);
    if (onApplyPriceToMenu && metrics.commercialSuggestedPrice > 0) {
      onApplyPriceToMenu(sheet.productId, metrics.commercialSuggestedPrice);
      showToast(`Preço do ${sheet.productName} atualizado para R$ ${metrics.commercialSuggestedPrice.toFixed(2).replace('.', ',')} no cardápio!`);
    } else {
      showToast(`Ficha técnica e margem de ${selectedMargin}% salvas com sucesso!`);
    }
    onClose();
  };

  const handleOnlySaveCost = () => {
    onUpdateSheetMargin(selectedMargin);
    showToast('Ficha técnica de custos salva com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        
        {/* CABEÇALHO */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-[#1C1C1C] to-[#141414] border-b border-[#262626] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#FFA000]/15 text-[#FFA000]">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-bold text-[#FFA000] uppercase tracking-wider block">
                Ficha Técnica & Precificação
              </span>
              <h2 className="text-lg sm:text-xl font-brand font-black text-white leading-tight">
                {sheet.productName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#202020] hover:bg-[#2A2A2A] text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-grow">
          
          {/* TABELA VISUAL DOS COMPONENTES E CUSTOS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
              <span>Componente do Lanche</span>
              <span>Custo Unitário</span>
            </div>

            <div className="bg-[#171717] border border-[#262626] rounded-2xl divide-y divide-[#222] overflow-hidden text-xs">
              {sheet.ingredients.map((ing, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFA000]" />
                    <span className="text-white font-medium">{ing.ingredientName}</span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      ({ing.quantityUsed}{ing.unit})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-zinc-200">
                    R$ {ing.calculatedCost.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}

              {/* Embalagens */}
              <div className="p-3 flex items-center justify-between bg-[#1A1A1A]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-white font-medium">Embalagem Térmica Direta</span>
                </div>
                <span className="font-mono font-bold text-zinc-200">
                  R$ {sheet.packagingCost.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Descartáveis e Adicionais */}
              <div className="p-3 flex items-center justify-between bg-[#1A1A1A]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="text-white font-medium">Guardanapos, Sachês & Sacola</span>
                </div>
                <span className="font-mono font-bold text-zinc-200">
                  R$ {sheet.extrasCost.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Outros custos proporcionais se houver */}
              {sheet.otherOverheadCost > 0 && (
                <div className="p-3 flex items-center justify-between bg-[#1A1A1A]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    <span className="text-zinc-400">Outros custos fixos proporcionais</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-400">
                    R$ {sheet.otherOverheadCost.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CARD DESTAQUE: CUSTO TOTAL */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#201C14] to-[#1A1812] border border-[#FFA000]/40 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                CUSTO TOTAL DO PRODUTO
              </span>
              <span className="text-2xl sm:text-3xl font-brand font-black text-[#FFA000]">
                R$ {sheet.totalDirectCost.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {onOpenWizardToEdit && (
              <button
                type="button"
                onClick={onOpenWizardToEdit}
                className="px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333] text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-[#FFA000]" />
                <span>Editar Itens</span>
              </button>
            )}
          </div>

          {/* COMPARAÇÃO COM O PREÇO ATUAL DE VENDA NO CARDÁPIO */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#171717] border border-[#282828] text-center">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Preço Atual</span>
              <span className="text-sm sm:text-base font-brand font-black text-white">
                R$ {sheet.currentSalePrice.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Margem Atual</span>
              <span className={`text-sm sm:text-base font-brand font-black ${
                sheet.currentMarginPercent >= 30 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {sheet.currentMarginPercent.toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Lucro / Unid.</span>
              <span className="text-sm sm:text-base font-brand font-black text-emerald-400">
                R$ {sheet.currentProfit.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* SIMULAÇÃO DE MARGEM DESEJADA */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-[#181818] border border-[#2C2C2C]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#FFA000]" />
                🎯 Simulação de Preço por Margem Desejada
              </span>
              <span className="font-brand font-black text-sm text-[#FFA000]">
                {selectedMargin}%
              </span>
            </div>

            {/* BOTÕES DE MARGEM RÁPIDA: 20% 25% 30% 35% 40% */}
            <div className="grid grid-cols-5 gap-1.5">
              {[20, 25, 30, 35, 40].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMargin(m)}
                  className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    selectedMargin === m
                      ? 'bg-[#FFA000] text-black shadow-md shadow-[#FFA000]/20 scale-102'
                      : 'bg-[#222] text-zinc-300 hover:bg-[#2A2A2A]'
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>

            {/* RESULTADO DA SIMULAÇÃO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#262626]">
              <div className="p-3 rounded-xl bg-[#202020]">
                <span className="text-[11px] text-zinc-400 block">Preço Sugerido (Matemático):</span>
                <span className="text-lg font-brand font-black text-zinc-200">
                  R$ {metrics.suggestedPrice.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-emerald-400 block font-medium mt-0.5">
                  Lucro estimado: R$ {metrics.estimatedProfit.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* PREÇO COMERCIAL SUGERIDO ARREDONDADO */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#241D12] to-[#1C170E] border border-[#FFA000]/40">
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#FFA000]">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Preço Comercial Sugerido:</span>
                </div>
                <span className="text-xl font-brand font-black text-white block mt-0.5">
                  R$ {metrics.commercialSuggestedPrice.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  Arredondado para psicologia de cardápio (.90 / .00)
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* BARRA DE AÇÕES INFERIORES */}
        <div className="p-4 sm:p-6 bg-[#161616] border-t border-[#262626] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleOnlySaveCost}
            className="px-4 py-2.5 rounded-xl border border-[#333] hover:bg-[#222] text-zinc-300 text-xs font-bold cursor-pointer transition-colors text-center"
          >
            Apenas Salvar Ficha de Custo
          </button>

          <button
            type="button"
            onClick={handleSaveAndApply}
            className="px-5 py-2.5 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FFA000]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Aplicar R$ {metrics.commercialSuggestedPrice.toFixed(2).replace('.', ',')} no Cardápio</span>
          </button>
        </div>

      </div>
    </div>
  );
};
