import { Order, MenuItem, CategoryData } from '../types';

export const CUSTOMER_PHONE_KEY = 'aqf_customer_phone';
export const CUSTOMER_NAME_KEY = 'aqf_customer_name';
export const CUSTOMER_ORDERS_PREFIX = 'aqf_customer_orders_';

/**
 * Normaliza número de telefone removendo caracteres não numéricos
 */
export function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  let clean = rawPhone.replace(/\D/g, '');
  // Se começar com 0, remove
  clean = clean.replace(/^0+/, '');
  // Se tiver 10 ou 11 dígitos (DDD + número), padroniza com 55
  if (clean.length === 10 || clean.length === 11) {
    clean = `55${clean}`;
  }
  return clean;
}

/**
 * Obtém o telefone do cliente atualmente identificado no dispositivo
 */
export function getCurrentCustomerPhone(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved = localStorage.getItem(CUSTOMER_PHONE_KEY);
    if (saved && saved.trim() !== '') {
      return normalizePhone(saved);
    }

    // Fallback: verificar pedido ativo salvo na sessão
    const activeOrderStr = localStorage.getItem('aqf_active_order_v2');
    if (activeOrderStr) {
      const activeOrder = JSON.parse(activeOrderStr);
      if (activeOrder?.customer?.phone) {
        const clean = normalizePhone(activeOrder.customer.phone);
        if (clean) {
          localStorage.setItem(CUSTOMER_PHONE_KEY, clean);
          return clean;
        }
      }
    }

    // Fallback 2: verificar perfil de checkout anterior
    const profileStr = localStorage.getItem('aqf_customer_profile');
    if (profileStr) {
      const profile = JSON.parse(profileStr);
      if (profile?.phone) {
        const clean = normalizePhone(profile.phone);
        if (clean) {
          localStorage.setItem(CUSTOMER_PHONE_KEY, clean);
          return clean;
        }
      }
    }
  } catch (e) {
    console.error('Error getting current customer phone:', e);
  }
  return '';
}

/**
 * Salva o telefone e nome do cliente identificado
 */
export function saveCustomerPhone(phone: string, name?: string): void {
  if (typeof window === 'undefined') return;
  const clean = normalizePhone(phone);
  if (!clean) return;

  try {
    localStorage.setItem(CUSTOMER_PHONE_KEY, clean);
    if (name && name.trim()) {
      localStorage.setItem(CUSTOMER_NAME_KEY, name.trim());
    }
    window.dispatchEvent(
      new CustomEvent('aqf_customer_phone_updated', {
        detail: { phone: clean, name: name?.trim() || '' },
      })
    );
  } catch (e) {
    console.error('Error saving customer phone:', e);
  }
}

/**
 * Grava o pedido no histórico exclusivo daquele cliente
 */
export function recordCustomerOrder(order: Order): void {
  if (typeof window === 'undefined' || !order) return;
  const cleanPhone = normalizePhone(order.customer?.phone);
  if (!cleanPhone) return;

  saveCustomerPhone(cleanPhone, order.customer?.name);

  try {
    const key = `${CUSTOMER_ORDERS_PREFIX}${cleanPhone}`;
    const saved = localStorage.getItem(key);
    let orders: Order[] = saved ? JSON.parse(saved) : [];

    // Se o pedido ainda não existir na lista do cliente, adiciona no início
    if (!orders.some((o) => o.id === order.id)) {
      orders.unshift(order);
    }

    localStorage.setItem(key, JSON.stringify(orders));

    // Notifica ouvintes que o histórico de pedidos foi atualizado
    window.dispatchEvent(
      new CustomEvent('aqf_customer_orders_updated', {
        detail: { phone: cleanPhone, orderId: order.id },
      })
    );
  } catch (e) {
    console.error('Error saving customer order history:', e);
  }
}

/**
 * Obtém todos os pedidos vinculados exclusivamente ao cliente informado
 */
export function getCustomerOrders(phone: string, allOrders: Order[] = []): Order[] {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) return [];

  const map = new Map<string, Order>();

  // 1. Pedidos do armazenamento local exclusivo do cliente
  try {
    const key = `${CUSTOMER_ORDERS_PREFIX}${cleanPhone}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed: Order[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((ord) => {
          if (normalizePhone(ord.customer?.phone) === cleanPhone) {
            map.set(ord.id, ord);
          }
        });
      }
    }
  } catch (e) {
    console.error('Error loading customer specific orders:', e);
  }

  // 2. Pedidos em allOrders que correspondam ao telefone do cliente
  if (Array.isArray(allOrders)) {
    allOrders.forEach((ord) => {
      if (normalizePhone(ord.customer?.phone) === cleanPhone) {
        map.set(ord.id, ord);
      }
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

interface RankedProductStats {
  item: MenuItem;
  frequency: number;
  lastOrderedTime: number;
  score: number;
}

/**
 * Calcula os produtos mais relevantes para o bloco "Peça de novo"
 * Regras:
 * - Apenas clientes com pelo menos 1 pedido
 * - Frequência de compra prioritária + recência da compra
 * - Sem repetições de produtos
 * - Respeita disponibilidade atual do produto e categoria
 * - Sempre utiliza o produto e preço atual do cardápio
 * - Limite máximo de 6 produtos
 */
export function getRepeatOrderProducts(
  phone: string,
  allOrders: Order[],
  currentMenuItems: MenuItem[],
  categories: CategoryData[] = []
): MenuItem[] {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) return [];

  const customerOrders = getCustomerOrders(cleanPhone, allOrders);
  if (customerOrders.length === 0) {
    return [];
  }

  // Mapa de categorias esgotadas
  const soldOutCategoryIds = new Set(
    categories.filter((c) => c.isSoldOut).map((c) => c.id)
  );

  // Mapa de itens do cardápio atual disponíveis
  const availableItemsMap = new Map<string, MenuItem>();
  currentMenuItems.forEach((item) => {
    if (item.isAvailable !== false && !soldOutCategoryIds.has(item.category)) {
      availableItemsMap.set(item.id, item);
      // Mapear também por nome normalizado para caso o ID tenha mudado
      availableItemsMap.set(item.name.toLowerCase().trim(), item);
    }
  });

  const statsMap = new Map<string, RankedProductStats>();

  customerOrders.forEach((order) => {
    const orderTime = new Date(order.createdAt).getTime() || Date.now();

    if (Array.isArray(order.items)) {
      order.items.forEach((cartItem) => {
        const rawItem = cartItem.item;
        if (!rawItem) return;

        // Localiza a versão ATUALIZADA do item no cardápio
        const activeProduct =
          availableItemsMap.get(rawItem.id) ||
          availableItemsMap.get(rawItem.name.toLowerCase().trim());

        if (!activeProduct) {
          // Produto indisponível ou excluído do cardápio atual
          return;
        }

        const productId = activeProduct.id;
        const quantity = cartItem.quantity || 1;

        const existing = statsMap.get(productId);
        if (existing) {
          existing.frequency += quantity;
          existing.lastOrderedTime = Math.max(existing.lastOrderedTime, orderTime);
        } else {
          statsMap.set(productId, {
            item: activeProduct,
            frequency: quantity,
            lastOrderedTime: orderTime,
            score: 0,
          });
        }
      });
    }
  });

  if (statsMap.size === 0) {
    return [];
  }

  // Cálculo da pontuação de relevância (Frequência prioritária + Recência)
  // frequency * 1_000_000_000 + lastOrderedTime
  const rankedList: RankedProductStats[] = Array.from(statsMap.values()).map((stat) => {
    // Score inteligente ponderado: frequência é o fator primário, recência desempata
    const score = stat.frequency * 1_000_000_000_000 + stat.lastOrderedTime;
    return { ...stat, score };
  });

  // Ordena decrescente por score de relevância
  rankedList.sort((a, b) => b.score - a.score);

  // Retorna no máximo 6 produtos únicos com suas informações atualizadas do cardápio
  return rankedList.slice(0, 6).map((stat) => stat.item);
}
