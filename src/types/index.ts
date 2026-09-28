export type Category = 'todos' | 'smash' | 'combos' | 'acompanhamentos' | 'bebidas' | 'sobremesas' | string;

export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  isSoldOut?: boolean; // Esgotar categoria - se ativado, nem a categoria nem os itens aparecem para o cliente
  order: number;
}

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
  image?: string;
  enabled?: boolean;
  isRequired?: boolean; // Se é obrigatório ou opcional
  minQuantity?: number; // Quantidade mínima
  maxQuantity?: number; // Quantidade máxima
  order?: number; // Ordem dos complementos
}

export interface MenuItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category;
  image: string;
  videoUrl?: string; // Vídeo do produto cadastrado pelo administrador
  isPopular?: boolean;
  isNew?: boolean;
  isPosterHighlight?: boolean;
  servesCount?: number;
  calories?: number;
  preparationTime: string;
  availableBreads?: string[];
  meatDonenessOptions?: string[];
  availableExtras?: ExtraOption[];
  removalsList?: string[];
  isAvailable?: boolean;
}

export interface SelectedExtra {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartItem {
  cartItemId: string;
  item: MenuItem;
  selectedBread?: string;
  selectedDoneness?: string;
  selectedExtras: SelectedExtra[];
  selectedRemovals: string[];
  notes?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerData {
  name: string;
  phone: string;
  deliveryMethod: 'delivery' | 'pickup';
  address: {
    street: string;
    number: string;
    neighborhood: string;
    complement: string;
    reference: string;
  };
  paymentMethod: 'pix' | 'card' | 'cash';
  cashChangeFor?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  items: CartItem[];
  customer: CustomerData;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  // Simplificado conforme Item 2:
  // Delivery: 'preparing' (Em preparo) -> 'on_the_way' (Saiu para entrega)
  // Retirada: 'preparing' (Em preparo) -> 'ready' (Pronto para retirada)
  status: 'preparing' | 'on_the_way' | 'ready' | 'received' | 'delivered';
  createdAt: string;
  estimatedDeliveryTime: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  dayName: string;
  openTime: string; // Ex: '18:00'
  closeTime: string; // Ex: '23:45'
  isClosed: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number; // Ex: 10 para 10% ou 10.00 para R$ 10,00
  minOrderValue?: number;
  validDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Domingo, 1 = Segunda, etc.)
  isActive: boolean;
  description?: string;
  usageCount?: number;
}

export interface PlatformRate {
  id: string;
  name: string;
  ratePercent: number;
}

export interface StoreSettings {
  name: string;
  phone: string; // Telefone com DDD (ex: 5574999999999)
  phoneDisplay: string; // Ex: (74) 99999-9999
  address: string; // Endereço da loja em Capim Grosso - BA
  promoGroupLink: string; // Link do grupo VIP de promoções
  discountPercent: number; // Desconto em porcentagem (ex: 10 para 10% OFF)
  isManuallyClosed: boolean; // Fechamento manual da loja
  deliveryFee: number;
  freeDeliveryThreshold: number;
  bannerImageUrl?: string; // Imagem de capa/banner da loja (Recomendado: 1200x400 ou proporção 3:1)
  aboutText?: string; // Texto "Sobre a Hamburgueria" no modal de informações
  footerManifesto?: string; // Texto manifesto do rodapé ("Inspirado na paixão por smash burgers...")
  scheduleNotice?: string; // Observação de horários (ex: "*Segundas-feiras fechado para manutenção...")
  footerPromoText?: string; // Texto de Ofertas & Redes ("Participe do nosso grupo de promoções exclusivas...")
  instagramHandle?: string; // Ex: @aiquefome.smash
  instagramUrl?: string; // Ex: https://instagram.com/aiquefome.smash
  openingHoursSchedule: DaySchedule[];
  platformRates: PlatformRate[];
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string; // 'vendas_site' | 'vendas_externas' | 'luz' | 'agua' | 'mercado' | 'fornecedores' | 'embalagens' | 'funcionarios' | 'aluguel' | 'gas' | 'internet' | 'publicidade' | 'outros'
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  channel?: string; // 'site' | 'whatsapp' | 'balcao' | 'ifood' | 'outro'
  platformFeePercent?: number;
  netAmount?: number;
}

export interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalCosts: number;
  netProfit: number;
  profitMarginPercent: number;
  expensePercent: number;
  monthlyCostEstimate: number;
  dailyRevenue: number;
  dailyExpenses: number;
  dailyProfit: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyProfit: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  discountsGranted: number;
  platformFeesPaid: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  detectedTransaction?: FinancialTransaction;
  suggestedActions?: string[];
}
