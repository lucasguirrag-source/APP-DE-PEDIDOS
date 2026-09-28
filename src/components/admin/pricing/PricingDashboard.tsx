import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Scale, 
  Search, 
  Percent, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  RefreshCw,
  Flame,
  HelpCircle,
  Plus
} from 'lucide-react';
import { MenuItem } from '../../../types';
import { 
  Ingredient, 
  ProductCostSheet, 
  PricingState 
} from '../../../types/pricing';
import { 
  loadPricingState, 
  savePricingState 
} from '../../../utils/pricingEngine';
import { PricingWizardModal } from './PricingWizardModal';
import { ProductCostResultModal } from './ProductCostResultModal';
import { IngredientsManagerModal } from './IngredientsManagerModal';

interface PricingDashboardProps {
  menuItems: MenuItem[];
  onUpdateMenuItemPrice?: (productId: string, newPrice: number) => void;
  showToast: (msg: string) => void;
}

export const PricingDashboard: React.FC<PricingDashboardProps> = ({
  menuItems,
  onUpdateMenuItemPrice,
  showToast,
}) => {
  const [pricingState, setPricingState] = useState<PricingState>(() => loadPricingState(menuItems));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modais
  const [wizardProduct, setWizardProduct] = useState<MenuItem | null>(null);
  const [resultSheet, setResultSheet] = useState<ProductCostSheet | null>(null);
  const [isIngredientsModalOpen, setIsIngredientsModalOpen] = useState(false);

  // Sincroniza se o cardápio mudar
  useEffect(() => {
    setPricingState(loadPricingState(menuItems));
  }, [menuItems]);

  const { ingredients, sheets } = pricingState;

  // Cálculos dos 3 cards do topo
  const allProducts = Array.isArray(menuItems) ? menuItems : [];
  const totalCount = allProducts.length;
  
  const completedSheets = Object.values(sheets).filter((s) => s.isComplete);
  const completedCount = completedSheets.length;
  
  const pendingCount = Math.max(0, totalCount - completedCount);

  // Filtra produtos
  const filteredProducts = allProducts.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesQuery) return false;

    const sheet = sheets[p.id];
    const isComp = sheet?.isComplete || false;

    if (activeFilter === 'pending') return !isComp;
    if (activeFilter === 'completed') return isComp;
    return true;
  });

  const pendingProducts = filteredProducts.filter((p) => !sheets[p.id]?.isComplete);
  const completedProducts = filteredProducts.filter((p) => sheets[p.id]?.isComplete);

  // Salva ficha calculada no wizard
  const handleSaveSheet = (sheet: ProductCostSheet, newlyCreated: Ingredient[]) => {
    const updatedSheets = {
      ...sheets,
      [sheet.productId]: sheet,
    };
    let updatedIngredients = ingredients;
    if (newlyCreated.length > 0) {
      updatedIngredients = [...ingredients, ...newlyCreated];
    }

    setPricingState((prev) => ({
      ...prev,
      sheets: updatedSheets,
      ingredients: updatedIngredients,
    }));

    savePricingState(updatedIngredients, updatedSheets);
    showToast(`Ficha de custos de ${sheet.productName} salva com sucesso!`);
  };

  // Salva atualização de margem no modal de resultado
  const handleUpdateSheetMargin = (newMargin: number, newCommercialPrice?: number) => {
    if (!resultSheet) return;
    const updatedSheet = {
      ...resultSheet,
      targetMarginPercent: newMargin,
      commercialSuggestedPrice: newCommercialPrice || resultSheet.commercialSuggestedPrice,
    };

    const updatedSheets = {
      ...sheets,
      [updatedSheet.productId]: updatedSheet,
    };

    setPricingState((prev) => ({
      ...prev,
      sheets: updatedSheets,
    }));

    savePricingState(ingredients, updatedSheets);
  };

  const handleApplyPriceToMenu = (productId: string, newPrice: number) => {
    if (onUpdateMenuItemPrice) {
      onUpdateMenuItemPrice(productId, newPrice);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TOPO: TÍTULO & BOTÕES DE AÇÃO */}
      <div className="bg-[#141414] border border-[#242424] p-5 sm:p-7 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FFA000]/15 text-[#FFA000]">
                <Calculator className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-[#FFA000] uppercase tracking-wider">
                Engenharia de Cardápio & Margem
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-brand font-black text-white mt-1">
              CUSTOS DOS PRODUTOS
            </h1>
            <p className="text-xs text-[#8E8E8E] mt-0.5">
              Controle seus custos e descubra o preço ideal de cada produto com lucro garantido no bolso.
            </p>
          </div>

          {/* BOTÃO GERENCIAR E MODIFICAR INGREDIENTES */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsIngredientsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7A00]/20 to-[#FFA000]/20 hover:from-[#FF7A00]/30 hover:to-[#FFA000]/30 border border-[#FF7A00]/50 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:border-[#FFA000]"
              title="Modificar, editar preços ou excluir insumos salvos (Bacon, Carnes, Pães, etc.)"
            >
              <Scale className="w-4 h-4 text-[#FFA000]" />
              <span className="text-[#FFA000] font-black">✏️ Modificar Insumos Salvos</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#FFA000] text-black text-[10px] font-black">
                {ingredients.length}
              </span>
            </button>
          </div>
        </div>

        {/* OS 3 CARDS DO TOPO EXATAMENTE COMO PEDIDO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
          
          {/* CARD 1: PRODUTOS CADASTRADOS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1A1A] border border-[#292929] flex items-center justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-brand font-black text-white block">
                {totalCount}
              </span>
              <span className="text-xs font-bold text-zinc-400 mt-0.5 block">
                Produtos cadastrados
              </span>
            </div>
            <span className="p-3 rounded-2xl bg-zinc-800/80 text-zinc-300">
              <Layers className="w-5 h-5" />
            </span>
          </div>

          {/* CARD 2: CUSTOS COMPLETOS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1A1A] border border-emerald-950/60 flex items-center justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-brand font-black text-emerald-400 block">
                {completedCount}
              </span>
              <span className="text-xs font-bold text-zinc-400 mt-0.5 block">
                Custos completos
              </span>
            </div>
            <span className="p-3 rounded-2xl bg-emerald-950/40 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>

          {/* CARD 3: PRECISAM DE ATENÇÃO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1A1A] border border-amber-950/60 flex items-center justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-brand font-black text-[#FFA000] block">
                {pendingCount}
              </span>
              <span className="text-xs font-bold text-zinc-400 mt-0.5 block">
                Precisam de atenção
              </span>
            </div>
            <span className="p-3 rounded-2xl bg-amber-950/40 text-[#FFA000]">
              <AlertCircle className="w-5 h-5" />
            </span>
          </div>

        </div>
      </div>

      {/* BARRA DE FILTROS & PESQUISA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* FILTROS: TODOS, PENDENTES, COMPLETOS */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#262626] rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#FFA000] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-[#FFA000] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ⚠️ Precisam de Custo ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-[#FFA000] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🟢 Completos ({completedCount})
          </button>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#141414] border border-[#282828] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
          />
        </div>
      </div>

      {/* SEÇÃO 1: PRODUTOS QUE PRECISAM DE CUSTO (ATENÇÃO) */}
      {(activeFilter === 'all' || activeFilter === 'pending') && pendingProducts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFA000] animate-pulse" />
            <h3 className="font-brand font-black text-sm uppercase tracking-wider text-white">
              Produtos que precisam de custo ({pendingProducts.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingProducts.map((prod) => {
              const sheet = sheets[prod.id];
              const completedSteps = sheet?.completedSteps || 0;
              const totalSteps = sheet?.totalSteps || 8;
              const percent = Math.round((completedSteps / totalSteps) * 100);

              return (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-[#161616] border border-[#2B2B2B] hover:border-[#FFA000]/60 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🍔</span>
                        <div>
                          <h4 className="font-bold text-white text-sm group-hover:text-[#FFA000] transition-colors">
                            {prod.name}
                          </h4>
                          <span className="text-[11px] text-zinc-400 capitalize">
                            {prod.category} · Venda atual: R$ {prod.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-500/40 text-[#FFA000] text-[10px] font-bold">
                        {percent > 0 ? `${percent}%` : 'Pendente'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>{completedSteps > 0 ? `${completedSteps} de ${totalSteps} itens cadastrados` : 'Custo ainda não calculado'}</span>
                        <span className="font-mono text-zinc-300">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#252525] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#FFA000] rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWizardProduct(prod)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#222222] hover:bg-[#FFA000] text-zinc-200 hover:text-black font-brand font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>{completedSteps > 0 ? 'Continuar' : 'Calcular Custo'}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: PRODUTOS COM CUSTO CALCULADO (COMPLETOS) */}
      {(activeFilter === 'all' || activeFilter === 'completed') && completedProducts.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-brand font-black text-sm uppercase tracking-wider text-white">
              Produtos com custo calculado ({completedProducts.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedProducts.map((prod) => {
              const sheet = sheets[prod.id];
              if (!sheet) return null;

              return (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-[#161616] border border-[#282828] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-white text-sm">
                            {prod.name}
                          </h4>
                          <span className="text-[11px] text-zinc-400 capitalize">
                            {prod.category}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        Completo
                      </span>
                    </div>

                    {/* Resumo financeiro do card */}
                    <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-[#1F1F1F] text-center text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Custo</span>
                        <span className="font-mono font-bold text-zinc-200">
                          R$ {sheet.totalDirectCost.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Venda</span>
                        <span className="font-mono font-bold text-white">
                          R$ {prod.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Margem</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {sheet.currentMarginPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setResultSheet(sheet)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#222222] hover:bg-[#2C2C2C] text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Ver Custo & Margem</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWizardProduct(prod)}
                      className="p-2 rounded-xl bg-[#222] hover:bg-[#2C2C2C] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Recalcular no Assistente"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ASSISTENTE PASSO A PASSO (WIZARD) */}
      {wizardProduct && (
        <PricingWizardModal
          isOpen={!!wizardProduct}
          onClose={() => setWizardProduct(null)}
          product={wizardProduct}
          existingSheet={sheets[wizardProduct.id]}
          allIngredients={ingredients}
          onSaveSheet={handleSaveSheet}
          onOpenResult={(sheet) => setResultSheet(sheet)}
          showToast={showToast}
        />
      )}

      {/* MODAL 2: TELA DE RESULTADO & SIMULAÇÃO DE MARGEM */}
      {resultSheet && (
        <ProductCostResultModal
          isOpen={!!resultSheet}
          onClose={() => setResultSheet(null)}
          sheet={resultSheet}
          onUpdateSheetMargin={handleUpdateSheetMargin}
          onApplyPriceToMenu={handleApplyPriceToMenu}
          onOpenWizardToEdit={() => {
            const prod = menuItems.find((p) => p.id === resultSheet.productId);
            if (prod) {
              setResultSheet(null);
              setWizardProduct(prod);
            }
          }}
          showToast={showToast}
        />
      )}

      {/* MODAL 3: BASE DE INGREDIENTES E DETECTOR DE IMPACTO */}
      {isIngredientsModalOpen && (
        <IngredientsManagerModal
          isOpen={isIngredientsModalOpen}
          onClose={() => setIsIngredientsModalOpen(false)}
          ingredients={ingredients}
          sheets={sheets}
          onSaveIngredients={(updated) => {
            setPricingState((prev) => ({ ...prev, ingredients: updated }));
            savePricingState(updated, sheets);
          }}
          onUpdateSheets={(updatedSheets) => {
            setPricingState((prev) => ({ ...prev, sheets: updatedSheets }));
            savePricingState(ingredients, updatedSheets);
          }}
          showToast={showToast}
        />
      )}

    </div>
  );
};
