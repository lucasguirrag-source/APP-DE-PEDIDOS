import { Coupon } from '../types';

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coupon-fome10',
    code: 'FOME10',
    type: 'percent',
    value: 10,
    minOrderValue: 30,
    isActive: true,
    description: '10% de desconto em qualquer pedido acima de R$ 30',
    usageCount: 42,
  },
  {
    id: 'coupon-burgervip',
    code: 'BURGERVIP',
    type: 'percent',
    value: 15,
    minOrderValue: 50,
    isActive: true,
    description: '15% de desconto especial exclusivo do Grupo VIP',
    usageCount: 28,
  },
  {
    id: 'coupon-sextou',
    code: 'SEXTOU',
    type: 'fixed',
    value: 10,
    minOrderValue: 40,
    validDays: [5], // Sexta-feira
    isActive: true,
    description: 'R$ 10,00 OFF na sua Sexta-feira!',
    usageCount: 35,
  },
  {
    id: 'coupon-quartasmash',
    code: 'QUARTASMASH',
    type: 'fixed',
    value: 8,
    minOrderValue: 35,
    validDays: [3], // Quarta-feira
    isActive: true,
    description: 'R$ 8,00 OFF na Quarta do Smash!',
    usageCount: 19,
  },
  {
    id: 'coupon-primeira',
    code: 'PRIMEIRACOMPRA',
    type: 'percent',
    value: 15,
    minOrderValue: 25,
    isActive: true,
    description: '15% de desconto para novos clientes no primeiro pedido',
    usageCount: 63,
  },
];

const STORAGE_KEY = 'aqf_coupons_v1';

export function getStoredCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored coupons:', e);
  }
  return DEFAULT_COUPONS;
}

export function saveStoredCoupons(coupons: Coupon[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    window.dispatchEvent(new CustomEvent('aqf_coupons_updated', { detail: coupons }));
  } catch (e) {
    console.error('Error saving coupons:', e);
  }
}

export function validateCoupon(
  code: string,
  subtotal: number,
  couponsList?: Coupon[]
): {
  isValid: boolean;
  discountAmount: number;
  coupon?: Coupon;
  message: string;
} {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { isValid: false, discountAmount: 0, message: 'Digite o código do cupom.' };
  }

  const list = couponsList || getStoredCoupons();
  const coupon = list.find((c) => c.code.toUpperCase() === normalized);

  if (!coupon) {
    return { isValid: false, discountAmount: 0, message: 'Cupom inválido ou inexistente.' };
  }

  if (!coupon.isActive) {
    return { isValid: false, discountAmount: 0, message: 'Este cupom não está mais ativo.' };
  }

  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Pedido mínimo para usar este cupom: R$ ${coupon.minOrderValue.toFixed(2).replace('.', ',')}.`,
    };
  }

  // Check valid day of week if specified
  if (coupon.validDays && coupon.validDays.length > 0) {
    const today = new Date().getDay();
    if (!coupon.validDays.includes(today)) {
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const validNames = coupon.validDays.map((d) => dayNames[d]).join(', ');
      return {
        isValid: false,
        discountAmount: 0,
        message: `Este cupom é válido apenas em: ${validNames}.`,
      };
    }
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = (subtotal * coupon.value) / 100;
  } else {
    discount = Math.min(coupon.value, subtotal);
  }

  return {
    isValid: true,
    discountAmount: Number(discount.toFixed(2)),
    coupon,
    message: coupon.type === 'percent'
      ? `Cupom ${coupon.code} aplicado: ${coupon.value}% de desconto!`
      : `Cupom ${coupon.code} aplicado: R$ ${coupon.value.toFixed(2).replace('.', ',')} de desconto!`,
  };
}
