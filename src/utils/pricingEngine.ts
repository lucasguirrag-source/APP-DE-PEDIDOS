import { 
  Ingredient, 
  ProductCostSheet, 
  PricingState,
  IngredientUnit,
  ProductIngredientUsage 
} from '../types/pricing';
import { MenuItem } from '../types';
import { INITIAL_INGREDIENTS, INITIAL_PRODUCT_COST_SHEETS } from '../data/initialPricingData';

const INGREDIENTS_KEY = 'aqf_pricing_ingredients_v2';
const SHEETS_KEY = 'aqf_pricing_sheets_v2';

/**
 * Converte preço do pacote para custo por unidade base (g, un, ml)
 */
export function calculateCostPerBaseUnit(
  packagePrice: number,
  packageSize: number,
  unit: IngredientUnit
): { cost: number; baseUnit: 'g' | 'un' | 'ml' } {
  const price = Math.max(0, packagePrice);
  const size = Math.max(0.001, packageSize);

  if (unit === 'kg') {
    // 1 kg = 1000g. Se packageSize for 1 (1kg), divide por 1000
    // Se packageSize já for 1000 (1000g), divide direto
    const totalGrams = size <= 10 ? size * 1000 : size;
    return { cost: price / totalGrams, baseUnit: 'g' };
  }

  if (unit === 'l') {
    const totalMl = size <= 10 ? size * 1000 : size;
    return { cost: price / totalMl, baseUnit: 'ml' };
  }

  if (unit === 'g') {
    return { cost: price / size, baseUnit: 'g' };
  }

  if (unit === 'ml') {
    return { cost: price / size, baseUnit: 'ml' };
  }

  // Padrão 'un'
  return { cost: price / size, baseUnit: 'un' };
}

/**
 * Arredonda para preço comercial atraente de cardápio (.90 ou .00)
 */
export function roundToCommercialPrice(rawPrice: number): number {
  if (rawPrice <= 0) return 0;
  const intPart = Math.floor(rawPrice);
  const decimalPart = rawPrice - intPart;

  if (decimalPart <= 0.25) {
    return intPart; // Ex: 18.15 -> 18.00
  } else if (decimalPart <= 0.65) {
    return intPart + 0.50; // Ex: 18.40 -> 18.50
  } else {
    return intPart + 0.90; // Ex: 18.75 -> 18.90
  }
}

/**
 * Calcula o preço de venda sugerido e margens
 */
export function calculatePricingMetrics(
  totalCost: number,
  targetMarginPercent: number,
  appFeePercent: number = 10,
  paymentFeePercent: number = 3.5,
  currentSalePrice: number = 0
): {
  suggestedPrice: number;
  commercialSuggestedPrice: number;
  estimatedProfit: number;
  currentMarginPercent: number;
  currentProfit: number;
} {
  const totalFeesPercent = (appFeePercent || 0) + (paymentFeePercent || 0);
  const totalDeduction = (targetMarginPercent + totalFeesPercent) / 100;

  let suggestedPrice = 0;
  if (totalDeduction < 0.95) {
    suggestedPrice = totalCost / (1 - totalDeduction);
  } else {
    suggestedPrice = totalCost * (1 + targetMarginPercent / 100) * 1.15;
  }

  suggestedPrice = isNaN(suggestedPrice) || suggestedPrice < 0 ? 0 : Math.round(suggestedPrice * 100) / 100;
  const commercialSuggestedPrice = roundToCommercialPrice(suggestedPrice);

  // Lucro estimado com o preço sugerido
  const feesAmount = suggestedPrice * (totalFeesPercent / 100);
  const estimatedProfit = Math.max(0, suggestedPrice - totalCost - feesAmount);

  // Margem e lucro atuais baseados no preço atual de venda no cardápio
  let currentMarginPercent = 0;
  let currentProfit = 0;
  if (currentSalePrice > 0) {
    const currentFees = currentSalePrice * (totalFeesPercent / 100);
    currentProfit = currentSalePrice - totalCost - currentFees;
    currentMarginPercent = (currentProfit / currentSalePrice) * 100;
  }

  return {
    suggestedPrice,
    commercialSuggestedPrice,
    estimatedProfit: Math.round(estimatedProfit * 100) / 100,
    currentMarginPercent: Math.round(currentMarginPercent * 10) / 10,
    currentProfit: Math.round(currentProfit * 100) / 100,
  };
}

/**
 * Carrega estado completo da Precificação (ingredientes + fichas técnicas)
 */
export function loadPricingState(menuItems?: MenuItem[]): PricingState {
  let ingredients = INITIAL_INGREDIENTS;
  let sheets = { ...INITIAL_PRODUCT_COST_SHEETS };

  if (typeof window !== 'undefined') {
    try {
      const savedIngs = localStorage.getItem(INGREDIENTS_KEY);
      if (savedIngs) {
        const parsed = JSON.parse(savedIngs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          ingredients = parsed;
        }
      }

      const savedSheets = localStorage.getItem(SHEETS_KEY);
      if (savedSheets) {
        const parsedSheets = JSON.parse(savedSheets);
        if (parsedSheets && typeof parsedSheets === 'object') {
          sheets = { ...sheets, ...parsedSheets };
        }
      }
    } catch (e) {
      console.error('Error loading pricing state:', e);
    }
  }

  // Garante que todo produto do cardápio tenha ao menos uma ficha inicial registrada
  const safeItems = Array.isArray(menuItems) ? menuItems : [];
  safeItems.forEach((item) => {
    if (!item || !item.id) return;
    if (!sheets[item.id]) {
      sheets[item.id] = {
        productId: item.id,
        productName: item.name,
        category: item.category,
        currentSalePrice: item.price,
        isComplete: false,
        totalSteps: 8,
        completedSteps: 0,
        ingredients: [],
        packagingCost: 1.50,
        extrasCost: 0.30,
        appFeePercent: 10,
        paymentFeePercent: 3.5,
        absorbedDeliveryCost: 0,
        otherOverheadCost: 0.50,
        ingredientsCost: 0,
        totalDirectCost: 2.30,
        targetMarginPercent: 30,
        suggestedPrice: item.price,
        commercialSuggestedPrice: item.price,
        estimatedProfit: item.price * 0.3,
        currentMarginPercent: 0,
        currentProfit: 0,
        lastCalculatedAt: new Date().toISOString(),
      };
    } else {
      // Atualiza o preço atual do cardápio para refletir alterações
      sheets[item.id].currentSalePrice = item.price;
      sheets[item.id].productName = item.name;
    }
  });

  return {
    ingredients,
    sheets,
    defaultAppFeePercent: 10,
    defaultPaymentFeePercent: 3.5,
    defaultPackagingCost: 1.50,
    defaultExtrasCost: 0.30,
  };
}

/**
 * Salva os ingredientes e fichas técnicas no localStorage e no servidor
 */
export function savePricingState(
  ingredients: Ingredient[],
  sheets: Record<string, ProductCostSheet>
): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
    localStorage.setItem(SHEETS_KEY, JSON.stringify(sheets));

    // Notifica outros componentes da aplicação
    window.dispatchEvent(new CustomEvent('pricing_data_updated', {
      detail: { ingredients, sheets }
    }));

    // Sincroniza em segundo plano com o backend do servidor
    fetch('/api/admin/pricing/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, sheets }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving pricing state:', e);
  }
}

/**
 * Detecta produtos afetados quando o preço de um ingrediente é alterado
 */
export function getImpactedProducts(
  ingredientId: string,
  newPrice: number,
  newUnit: IngredientUnit,
  newSize: number,
  sheets: Record<string, ProductCostSheet>,
  ingredients: Ingredient[]
): {
  impactedCount: number;
  products: Array<{
    sheet: ProductCostSheet;
    oldCost: number;
    newCost: number;
    diff: number;
  }>;
} {
  const { cost: newCostPerBaseUnit } = calculateCostPerBaseUnit(newPrice, newSize, newUnit);
  const products: Array<{
    sheet: ProductCostSheet;
    oldCost: number;
    newCost: number;
    diff: number;
  }> = [];

  Object.values(sheets).forEach((sheet) => {
    const usage = sheet.ingredients.find((ing) => ing.ingredientId === ingredientId);
    if (usage) {
      const oldIngCost = usage.calculatedCost;
      const newIngCost = usage.quantityUsed * newCostPerBaseUnit;
      const diff = newIngCost - oldIngCost;

      const newTotalCost = Math.max(0, sheet.totalDirectCost + diff);
      products.push({
        sheet,
        oldCost: sheet.totalDirectCost,
        newCost: Math.round(newTotalCost * 100) / 100,
        diff: Math.round(diff * 100) / 100,
      });
    }
  });

  return {
    impactedCount: products.length,
    products,
  };
}

/**
 * Atualiza em lote todos os produtos afetados por uma mudança de ingrediente
 */
export function updateAllImpactedProducts(
  ingredientId: string,
  newCostPerBaseUnit: number,
  sheets: Record<string, ProductCostSheet>
): Record<string, ProductCostSheet> {
  const updatedSheets = { ...sheets };

  Object.keys(updatedSheets).forEach((productId) => {
    const sheet = updatedSheets[productId];
    const hasIng = sheet.ingredients.some((ing) => ing.ingredientId === ingredientId);
    if (!hasIng) return;

    const newIngredients = sheet.ingredients.map((ing) => {
      if (ing.ingredientId === ingredientId) {
        const calculatedCost = Math.round(ing.quantityUsed * newCostPerBaseUnit * 100) / 100;
        return {
          ...ing,
          costPerBaseUnit: newCostPerBaseUnit,
          calculatedCost,
        };
      }
      return ing;
    });

    const ingredientsCost = newIngredients.reduce((acc, curr) => acc + curr.calculatedCost, 0);
    const totalDirectCost = Math.round(
      (ingredientsCost + sheet.packagingCost + sheet.extrasCost + sheet.otherOverheadCost) * 100
    ) / 100;

    const metrics = calculatePricingMetrics(
      totalDirectCost,
      sheet.targetMarginPercent,
      sheet.appFeePercent,
      sheet.paymentFeePercent,
      sheet.currentSalePrice
    );

    updatedSheets[productId] = {
      ...sheet,
      ingredients: newIngredients,
      ingredientsCost: Math.round(ingredientsCost * 100) / 100,
      totalDirectCost,
      suggestedPrice: metrics.suggestedPrice,
      commercialSuggestedPrice: metrics.commercialSuggestedPrice,
      estimatedProfit: metrics.estimatedProfit,
      currentMarginPercent: metrics.currentMarginPercent,
      currentProfit: metrics.currentProfit,
      lastCalculatedAt: new Date().toISOString(),
    };
  });

  return updatedSheets;
}
