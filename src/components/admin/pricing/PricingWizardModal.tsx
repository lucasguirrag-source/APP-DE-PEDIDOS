import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Check, 
  DollarSign, 
  Scale, 
  Package, 
  Percent, 
  Plus, 
  HelpCircle,
  Clock,
  ArrowRight,
  Flame
} from 'lucide-react';
import { 
  Ingredient, 
  ProductCostSheet, 
  ProductIngredientUsage,
  IngredientCategory,
  IngredientUnit 
} from '../../../types/pricing';
import { MenuItem } from '../../../types';
import { 
  calculateCostPerBaseUnit, 
  calculatePricingMetrics 
} from '../../../utils/pricingEngine';

interface StepConfig {
  id: number;
  category: IngredientCategory | 'taxas' | 'embalagens';
  title: string;
  iconName: string;
  defaultUnit: 'g' | 'un' | 'ml';
  question: string;
  subPrompt: string;
  examples: string[];
}

const WIZARD_STEPS: StepConfig[] = [
  {
    id: 1,
    category: 'pao',
    title: 'Pão do Lanche',
    iconName: '🍞',
    defaultUnit: 'un',
    question: 'Qual é o pão utilizado e quanto custa por unidade?',
    subPrompt: 'Ex: Pão Brioche Artesanal, Pão Australiano ou Gergelim.',
    examples: ['Pão Artesanal Brioche Dourado', 'Pão Australiano', 'Pão com Gergelim'],
  },
  {
    id: 2,
    category: 'carne',
    title: 'Carne / Blend Smash',
    iconName: '🥩',
    defaultUnit: 'g',
    question: 'Quantos gramas de carne vão nesse hambúrguer?',
    subPrompt: 'O sistema calcula exatamente o custo por grama a partir do preço do quilo.',
    examples: ['Blend Fraldinha 100g', 'Duplo Smash 2x100g (200g)', 'Carne Smash Kids (80g)'],
  },
  {
    id: 3,
    category: 'queijo',
    title: 'Queijo & Derivados',
    iconName: '🧀',
    defaultUnit: 'g',
    question: 'Quanto de queijo você utiliza nesse produto?',
    subPrompt: 'Cheddar cremoso quente, queijo prato duplo, muçarela, etc.',
    examples: ['Cheddar Cremoso Quente (30g)', 'Queijo Prato Duplo (40g)'],
  },
  {
    id: 4,
    category: 'bacon',
    title: 'Bacon ou Recheio Especial',
    iconName: '🥓',
    defaultUnit: 'g',
    question: 'Vai bacon fatiado crocante ou outro recheio?',
    subPrompt: 'Você paga o quilo e o sistema calcula pelas gramas da porção.',
    examples: ['Bacon Crocante Fatiado (30g)', 'Sem bacon (pule se não usar)'],
  },
  {
    id: 5,
    category: 'molho',
    title: 'Molhos da Casa',
    iconName: '🥫',
    defaultUnit: 'g',
    question: 'Quanto de molho especial é colocado no lanche?',
    subPrompt: 'Maionese artesanal, barbecue, molho verde ou molho da casa.',
    examples: ['Molho Especial da Casa (25g)', 'Maionese Temperada (20g)'],
  },
  {
    id: 6,
    category: 'embalagem',
    title: 'Embalagem do Produto',
    iconName: '📦',
    defaultUnit: 'un',
    question: 'Qual o custo da embalagem direta do lanche?',
    subPrompt: 'Caixa térmica kraft personalizada, papel acoplado ou berço.',
    examples: ['Caixa Kraft Térmica (R$ 1,50)', 'Papel Acoplado (R$ 0,35)'],
  },
  {
    id: 7,
    category: 'descartaveis',
    title: 'Adicionais & Descartáveis',
    iconName: '🛍️',
    defaultUnit: 'un',
    question: 'Itens que acompanham o pedido que costumamos esquecer:',
    subPrompt: 'Sacola kraft de entrega, guardanapos, sachês e lacre de segurança.',
    examples: ['Kit Sacola + Guardanapo + Lacre (R$ 0,50)'],
  },
  {
    id: 8,
    category: 'taxas',
    title: 'Taxas de Apps & Meios de Pagamento',
    iconName: '💳',
    defaultUnit: 'un',
    question: 'Taxas retidas sobre a venda do lanche:',
    subPrompt: 'Taxa da maquininha/cartão e comissão de aplicativo ou entrega absorvida.',
    examples: ['Taxa App: 10%', 'Taxa Cartão: 3.5%', 'Entrega Absorvida: R$ 0,00'],
  },
];

interface PricingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MenuItem;
  existingSheet?: ProductCostSheet;
  allIngredients: Ingredient[];
  onSaveSheet: (sheet: ProductCostSheet, newlyCreatedIngredients: Ingredient[]) => void;
  onOpenResult: (sheet: ProductCostSheet) => void;
  showToast: (msg: string) => void;
}

export const PricingWizardModal: React.FC<PricingWizardModalProps> = ({
  isOpen,
  onClose,
  product,
  existingSheet,
  allIngredients,
  onSaveSheet,
  onOpenResult,
  showToast,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tempIngredients, setTempIngredients] = useState<Ingredient[]>(allIngredients);
  const [newlyCreatedIngredients, setNewlyCreatedIngredients] = useState<Ingredient[]>([]);

  // Estado dos insumos escolhidos para este produto
  const [usages, setUsages] = useState<ProductIngredientUsage[]>(() => {
    return existingSheet?.ingredients || [];
  });

  // Custos que normalmente esquecemos (Steps 6, 7 e 8)
  const [packagingCost, setPackagingCost] = useState<number>(existingSheet?.packagingCost ?? 1.50);
  const [extrasCost, setExtrasCost] = useState<number>(existingSheet?.extrasCost ?? 0.30);
  const [appFeePercent, setAppFeePercent] = useState<number>(existingSheet?.appFeePercent ?? 10.0);
  const [paymentFeePercent, setPaymentFeePercent] = useState<number>(existingSheet?.paymentFeePercent ?? 3.5);
  const [absorbedDeliveryCost, setAbsorbedDeliveryCost] = useState<number>(existingSheet?.absorbedDeliveryCost ?? 0.0);
  const [otherOverheadCost, setOtherOverheadCost] = useState<number>(existingSheet?.otherOverheadCost ?? 0.50);
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(existingSheet?.targetMarginPercent ?? 30.0);

  // Estado do formulário da etapa atual
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('30');
  const [unitInput, setUnitInput] = useState<'g' | 'un' | 'ml'>('g');

  // Modo novo ingrediente caso não exista
  const [isCreatingNewIngredient, setIsCreatingNewIngredient] = useState<boolean>(false);
  const [newIngName, setNewIngName] = useState<string>('');
  const [newPackagePrice, setNewPackagePrice] = useState<string>('30.00');
  const [newPackageSize, setNewPackageSize] = useState<string>('1000');
  const [newPackageUnit, setNewPackageUnit] = useState<IngredientUnit>('kg');

  const step = WIZARD_STEPS[currentStepIndex];

  // Sincroniza com a etapa atual ao mudar
  useEffect(() => {
    if (!step) return;

    if (step.category === 'taxas') {
      return;
    }

    if (step.category === 'embalagem') {
      return;
    }

    if (step.category === 'descartaveis') {
      return;
    }

    // Busca insumo já associado a esta etapa
    const existingUsage = usages.find((u) => u.category === step.category);
    if (existingUsage) {
      setSelectedIngredientId(existingUsage.ingredientId);
      setQuantityInput(String(existingUsage.quantityUsed));
      setUnitInput(existingUsage.unit);
      setIsCreatingNewIngredient(false);
    } else {
      // Pré-seleciona primeiro ingrediente compatível da base
      const matchingIng = tempIngredients.find((ing) => ing.category === step.category);
      if (matchingIng) {
        setSelectedIngredientId(matchingIng.id);
        setQuantityInput(step.category === 'carne' ? '120' : step.category === 'pao' ? '1' : '30');
        setUnitInput(matchingIng.baseUnit);
        setIsCreatingNewIngredient(false);
      } else {
        // Se não tem na base, ativa modo criar
        setSelectedIngredientId('');
        setIsCreatingNewIngredient(true);
        setNewIngName('');
        setQuantityInput(step.category === 'carne' ? '120' : step.category === 'pao' ? '1' : '30');
        setUnitInput(step.defaultUnit);
      }
    }
  }, [currentStepIndex, step?.category]);

  if (!isOpen) return null;

  // Ingredientes disponíveis para a categoria do passo atual
  const availableCategoryIngredients = tempIngredients.filter(
    (ing) => ing.category === step.category
  );

  const selectedIngredient = tempIngredients.find((ing) => ing.id === selectedIngredientId);

  // Cálculo ao vivo do custo do insumo na etapa
  let liveItemCost = 0;
  if (!isCreatingNewIngredient && selectedIngredient) {
    const qty = parseFloat(quantityInput.replace(',', '.')) || 0;
    liveItemCost = Math.round(qty * selectedIngredient.costPerBaseUnit * 100) / 100;
  } else if (isCreatingNewIngredient) {
    const pkgPrice = parseFloat(newPackagePrice.replace(',', '.')) || 0;
    const pkgSize = parseFloat(newPackageSize.replace(',', '.')) || 1;
    const { cost } = calculateCostPerBaseUnit(pkgPrice, pkgSize, newPackageUnit);
    const qty = parseFloat(quantityInput.replace(',', '.')) || 0;
    liveItemCost = Math.round(qty * cost * 100) / 100;
  }

  // Avança para o próximo passo salvando a resposta
  const handleNextStep = () => {
    // Se for passo de ingrediente físico
    if (step.category !== 'taxas' && step.category !== 'embalagem' && step.category !== 'descartaveis') {
      let finalIng: Ingredient | undefined = selectedIngredient;

      // Se cadastrou um novo na hora:
      if (isCreatingNewIngredient) {
        if (!newIngName.trim()) {
          showToast('Digite o nome do ingrediente.');
          return;
        }

        const pkgPrice = parseFloat(newPackagePrice.replace(',', '.')) || 0;
        const pkgSize = parseFloat(newPackageSize.replace(',', '.')) || 1;
        const { cost, baseUnit } = calculateCostPerBaseUnit(pkgPrice, pkgSize, newPackageUnit);

        const created: Ingredient = {
          id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: newIngName.trim(),
          category: step.category as IngredientCategory,
          packagePrice: pkgPrice,
          packageSize: pkgSize,
          packageUnit: newPackageUnit,
          costPerBaseUnit: cost,
          baseUnit,
          updatedAt: new Date().toISOString(),
        };

        finalIng = created;
        setTempIngredients((prev) => [...prev, created]);
        setNewlyCreatedIngredients((prev) => [...prev, created]);
      }

      if (finalIng) {
        const qty = parseFloat(quantityInput.replace(',', '.')) || 0;
        const calculatedCost = Math.round(qty * finalIng.costPerBaseUnit * 100) / 100;

        // Atualiza na lista de usages
        const newUsages = usages.filter((u) => u.category !== step.category);
        if (qty > 0) {
          newUsages.push({
            ingredientId: finalIng.id,
            ingredientName: finalIng.name,
            category: step.category as IngredientCategory,
            quantityUsed: qty,
            unit: finalIng.baseUnit,
            costPerBaseUnit: finalIng.costPerBaseUnit,
            calculatedCost,
          });
        }
        setUsages(newUsages);
      }
    }

    // Se estiver no último passo, finaliza e abre tela de resultado
    if (currentStepIndex >= WIZARD_STEPS.length - 1) {
      finalizeSheet();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const finalizeSheet = () => {
    const ingredientsCost = usages.reduce((acc, curr) => acc + curr.calculatedCost, 0);
    const totalDirectCost = Math.round(
      (ingredientsCost + packagingCost + extrasCost + otherOverheadCost + absorbedDeliveryCost) * 100
    ) / 100;

    const metrics = calculatePricingMetrics(
      totalDirectCost,
      targetMarginPercent,
      appFeePercent,
      paymentFeePercent,
      product.price
    );

    const sheet: ProductCostSheet = {
      productId: product.id,
      productName: product.name,
      category: product.category,
      currentSalePrice: product.price,
      isComplete: true,
      totalSteps: 8,
      completedSteps: 8,
      ingredients: usages,
      packagingCost,
      extrasCost,
      appFeePercent,
      paymentFeePercent,
      absorbedDeliveryCost,
      otherOverheadCost,
      ingredientsCost: Math.round(ingredientsCost * 100) / 100,
      totalDirectCost,
      targetMarginPercent,
      suggestedPrice: metrics.suggestedPrice,
      commercialSuggestedPrice: metrics.commercialSuggestedPrice,
      estimatedProfit: metrics.estimatedProfit,
      currentMarginPercent: metrics.currentMarginPercent,
      currentProfit: metrics.currentProfit,
      lastCalculatedAt: new Date().toISOString(),
    };

    onSaveSheet(sheet, newlyCreatedIngredients);
    onClose();
    onOpenResult(sheet);
  };

  const progressPercent = Math.round(((currentStepIndex + 1) / WIZARD_STEPS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* CABEÇALHO DO ASSISTENTE */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-[#1C1C1C] to-[#141414] border-b border-[#262626]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FFA000]/15 text-[#FFA000]">
                <Flame className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-[#FFA000] uppercase tracking-wider block">
                  Assistente de Precificação
                </span>
                <h2 className="text-base sm:text-lg font-brand font-black text-white leading-tight">
                  Calculando: {product.name}
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

          {/* BARRA DE PROGRESSO VISUAL */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-zinc-400">
              <span className="flex items-center gap-1.5 text-white">
                <span className="text-sm">{step.iconName}</span>
                <span>{currentStepIndex + 1} de {WIZARD_STEPS.length} — {step.title}</span>
              </span>
              <span className="text-[#FFA000] font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#242424] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FFA000] to-[#FF7A00] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* CORPO DO ASSISTENTE: PERGUNTAS PASSO A PASSO */}
        <div className="p-5 sm:p-7 space-y-6 flex-grow overflow-y-auto max-h-[65vh]">

          {/* ETAPAS 1 a 5: INGREDIENTES FÍSICOS */}
          {step.category !== 'taxas' && step.category !== 'embalagem' && step.category !== 'descartaveis' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                  {step.question}
                </h3>
                <p className="text-xs text-zinc-400">
                  {step.subPrompt}
                </p>
              </div>

              {/* Opção 1: Já possui ingrediente cadastrado */}
              {availableCategoryIngredients.length > 0 && !isCreatingNewIngredient && (
                <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Ingrediente já salvo na sua base
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewIngredient(true);
                        setSelectedIngredientId('');
                      }}
                      className="text-xs text-[#FFA000] hover:underline font-bold cursor-pointer"
                    >
                      + Cadastrar novo
                    </button>
                  </div>

                  <select
                    value={selectedIngredientId}
                    onChange={(e) => setSelectedIngredientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                  >
                    {availableCategoryIngredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} — R$ {ing.packagePrice.toFixed(2).replace('.', ',')} / {ing.packageSize}{ing.packageUnit}
                      </option>
                    ))}
                  </select>

                  {selectedIngredient && (
                    <div className="p-3 rounded-xl bg-[#202020] text-xs space-y-1">
                      <div className="flex justify-between text-zinc-300">
                        <span>Preço de compra:</span>
                        <span className="font-bold text-white">
                          R$ {selectedIngredient.packagePrice.toFixed(2).replace('.', ',')} por {selectedIngredient.packageSize}{selectedIngredient.packageUnit}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400 text-[11px]">
                        <span>Custo unitário base:</span>
                        <span className="font-mono text-[#FFA000]">
                          R$ {selectedIngredient.costPerBaseUnit.toFixed(4).replace('.', ',')} / {selectedIngredient.baseUnit}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quantidade usada no lanche */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      {step.category === 'pao' 
                        ? 'Quantas unidades de pão vão nesse produto?' 
                        : `Quantas ${selectedIngredient?.baseUnit === 'g' ? 'gramas' : 'unidades'} você usa nesse lanche?`}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        placeholder="Ex: 120"
                        className="flex-1 px-4 py-3 rounded-xl bg-[#222222] border border-[#333333] text-white font-mono font-bold text-base focus:border-[#FFA000] focus:outline-hidden"
                      />
                      <span className="px-3.5 py-3 rounded-xl bg-[#222222] border border-[#333333] text-zinc-300 text-xs font-bold uppercase">
                        {selectedIngredient?.baseUnit || 'g'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Opção 2: Cadastrar novo ingrediente */}
              {(isCreatingNewIngredient || availableCategoryIngredients.length === 0) && (
                <div className="p-4 rounded-2xl bg-[#181818] border border-[#FFA000]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FFA000] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Cadastrar novo ingrediente
                    </span>
                    {availableCategoryIngredients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewIngredient(false)}
                        className="text-xs text-zinc-400 hover:text-white font-bold cursor-pointer"
                      >
                        ← Escolher já cadastrado
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Nome do Ingrediente
                    </label>
                    <input
                      type="text"
                      value={newIngName}
                      onChange={(e) => setNewIngName(e.target.value)}
                      placeholder={`Ex: ${step.examples[0] || 'Nome do insumo'}`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Preço do Pacote / Quilo (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newPackagePrice}
                        onChange={(e) => setNewPackagePrice(e.target.value)}
                        placeholder="30.00"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold font-mono focus:border-[#FFA000] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Tamanho do Pacote
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={newPackageSize}
                          onChange={(e) => setNewPackageSize(e.target.value)}
                          placeholder="1000"
                          className="w-20 px-2.5 py-2.5 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold font-mono text-center focus:border-[#FFA000] focus:outline-hidden"
                        />
                        <select
                          value={newPackageUnit}
                          onChange={(e) => setNewPackageUnit(e.target.value as IngredientUnit)}
                          className="flex-1 px-2.5 py-2.5 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                        >
                          <option value="kg">kg (quilos)</option>
                          <option value="g">gramas (g)</option>
                          <option value="un">unidades (un)</option>
                          <option value="l">litros (L)</option>
                          <option value="ml">mililitros (ml)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Quanto você usa neste lanche?
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        placeholder="Ex: 30"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#222] border border-[#333] text-white font-mono font-bold text-sm focus:border-[#FFA000] focus:outline-hidden"
                      />
                      <span className="px-3 py-2.5 rounded-xl bg-[#222] border border-[#333] text-zinc-300 text-xs font-bold uppercase">
                        {newPackageUnit === 'kg' ? 'g' : newPackageUnit === 'l' ? 'ml' : newPackageUnit}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD RESUMO DO CÁLCULO DESTE INGREDIENTE */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#202020] to-[#1A1A1A] border border-[#333] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Custo deste ingrediente no lanche:</span>
                  <span className="text-lg font-brand font-black text-[#FFA000]">
                    R$ {liveItemCost.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="text-right text-[11px] text-zinc-500 font-mono">
                  {quantityInput || 0} {unitInput} no produto
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 6: EMBALAGENS */}
          {step.category === 'embalagem' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                  {step.question}
                </h3>
                <p className="text-xs text-zinc-400">
                  {step.subPrompt}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-3">
                <label className="text-xs font-bold text-zinc-300 block">
                  Custo total da embalagem por lanche (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">R$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#222] border border-[#333] text-white font-mono font-bold text-base focus:border-[#FFA000] focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Dica: Caixas térmicas tipo kraft costumam custar entre R$ 1,20 e R$ 1,80 a unidade.
                </p>
              </div>
            </div>
          )}

          {/* ETAPA 7: DESCARTÁVEIS & ADICIONAIS */}
          {step.category === 'descartaveis' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                  {step.question}
                </h3>
                <p className="text-xs text-zinc-400">
                  {step.subPrompt}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    Guardanapos, sachês, talheres e sacola kraft (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">R$</span>
                    <input
                      type="number"
                      step="0.05"
                      value={extrasCost}
                      onChange={(e) => setExtrasCost(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#222] border border-[#333] text-white font-mono font-bold text-sm focus:border-[#FFA000] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    Outros custos operacionais proporcionais (luz, gás, óleo) (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">R$</span>
                    <input
                      type="number"
                      step="0.05"
                      value={otherOverheadCost}
                      onChange={(e) => setOtherOverheadCost(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#222] border border-[#333] text-white font-mono font-bold text-sm focus:border-[#FFA000] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 8: TAXAS & MARGEM DESEJADA */}
          {step.category === 'taxas' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                  Taxas da Venda & Margem Desejada
                </h3>
                <p className="text-xs text-zinc-400">
                  Considere as comissões descontadas para que o lucro caia limpo no seu bolso.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Taxa do Cardápio / App (%)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      value={appFeePercent}
                      onChange={(e) => setAppFeePercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white font-mono font-bold text-sm"
                    />
                    <span className="text-xs text-zinc-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Site próprio: 0% a 5%</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Taxa da Maquininha / Pix (%)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      value={paymentFeePercent}
                      onChange={(e) => setPaymentFeePercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#222] border border-[#333] text-white font-mono font-bold text-sm"
                    />
                    <span className="text-xs text-zinc-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Média cartão: 3.5%</span>
                </div>
              </div>

              {/* ESCOLHA DA MARGEM DESEJADA */}
              <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#FFA000]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-[#FFA000]" />
                    🎯 Qual margem de lucro você deseja?
                  </span>
                  <span className="font-brand font-black text-sm text-[#FFA000]">
                    {targetMarginPercent}%
                  </span>
                </div>

                {/* BOTÕES DE MARGEM RÁPIDA (20%, 25%, 30%, 35%, 40%) */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[20, 25, 30, 35, 40].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTargetMarginPercent(m)}
                      className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        targetMarginPercent === m
                          ? 'bg-[#FFA000] text-black shadow-md shadow-[#FFA000]/20'
                          : 'bg-[#242424] text-zinc-300 hover:bg-[#2C2C2C]'
                      }`}
                    >
                      {m}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RODAPÉ COM AÇÕES: VOLTAR, PULAR E PRÓXIMO */}
        <div className="p-4 sm:p-6 bg-[#161616] border-t border-[#262626] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentStepIndex === 0
                ? 'border-transparent text-zinc-600 cursor-not-allowed'
                : 'border-[#333] hover:bg-[#222] text-zinc-300 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FFA000]/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>{currentStepIndex >= WIZARD_STEPS.length - 1 ? 'Concluir & Ver Margem' : 'Próximo'}</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>
    </div>
  );
};
