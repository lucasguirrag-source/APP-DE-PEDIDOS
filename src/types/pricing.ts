export type IngredientUnit = 'kg' | 'g' | 'un' | 'l' | 'ml';

export type IngredientCategory = 
  | 'pao'
  | 'carne'
  | 'queijo'
  | 'bacon'
  | 'molho'
  | 'vegetal'
  | 'embalagem'
  | 'descartaveis'
  | 'outros';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  packagePrice: number; // Ex: 32.00
  packageSize: number; // Ex: 1000 (para 1000g / 1kg) ou 1 (para 1 un)
  packageUnit: IngredientUnit; // Ex: 'kg', 'g', 'un', 'l', 'ml'
  costPerBaseUnit: number; // Ex: 32.00 / 1000 = 0.032 por grama
  baseUnit: 'g' | 'un' | 'ml';
  supplier?: string;
  updatedAt: string;
}

export interface ProductIngredientUsage {
  ingredientId: string;
  ingredientName: string;
  category: IngredientCategory;
  quantityUsed: number; // Ex: 120 (gramas) ou 1 (unidade)
  unit: 'g' | 'un' | 'ml';
  costPerBaseUnit: number;
  calculatedCost: number; // quantityUsed * costPerBaseUnit
}

export interface ProductCostSheet {
  productId: string;
  productName: string;
  category: string;
  currentSalePrice: number;
  isComplete: boolean;
  totalSteps: number; // Padrão 8 etapas
  completedSteps: number;
  ingredients: ProductIngredientUsage[];
  // Custos que normalmente esquecemos
  packagingCost: number; // Embalagem (R$ 1,50)
  extrasCost: number; // Molho/guardanapo/talheres (R$ 0,30)
  appFeePercent: number; // Taxa do aplicativo (ex: 10%)
  paymentFeePercent: number; // Taxa de pagamento (ex: 3.5%)
  absorbedDeliveryCost: number; // Custo de entrega que você absorve (ex: R$ 0,00)
  otherOverheadCost: number; // Outros custos operacionais (R$ 0,50)
  
  // Totais calculados
  ingredientsCost: number;
  totalDirectCost: number; // Ingredientes + Embalagem + Extras + Outros
  targetMarginPercent: number; // Ex: 30%
  suggestedPrice: number; // Preço sugerido matemático
  commercialSuggestedPrice: number; // Preço comercial arredondado (ex: R$ 19,90)
  estimatedProfit: number;
  currentMarginPercent: number;
  currentProfit: number;
  lastCalculatedAt: string;
}

export interface PricingState {
  ingredients: Ingredient[];
  sheets: Record<string, ProductCostSheet>;
  defaultAppFeePercent: number;
  defaultPaymentFeePercent: number;
  defaultPackagingCost: number;
  defaultExtrasCost: number;
}
