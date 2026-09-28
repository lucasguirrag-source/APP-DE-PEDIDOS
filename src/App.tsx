/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, ShieldAlert, ShieldCheck, AlertCircle, Gift, ExternalLink } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { PhotoMural } from './components/PhotoMural';
import { ProductCustomizerModal } from './components/ProductCustomizerModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LiveOrderTrackerModal } from './components/LiveOrderTrackerModal';
import { DeliveryInfoModal } from './components/DeliveryInfoModal';
import { RepeatOrdersBlock } from './components/RepeatOrdersBlock';
import { Footer } from './components/Footer';
import { FomeLogo } from './components/FomeLogo';

import { Category, MenuItem, CartItem, Order, ExtraOption, CategoryData, StoreSettings } from './types';
import { MENU_ITEMS, DEFAULT_CATEGORIES, STORE_INFO, DEFAULT_EXTRAS, INITIAL_DEMO_ORDERS } from './data/menuData';
import { AdminPortal } from './components/admin/AdminPortal';
import { getStoredStoreSettings, checkStoreOpenStatus, DEFAULT_STORE_SETTINGS } from './utils/storeSettings';
import { validateCoupon } from './utils/couponManager';
import { getCurrentCustomerPhone, getRepeatOrderProducts, recordCustomerOrder, normalizePhone } from './utils/repeatOrder';

// Helper para detectar rota do administrador
const isSecretAdminRoute = (pathOrHash: string): boolean => {
  const p = pathOrHash.toLowerCase();
  return (
    p.includes('admin') ||
    p.includes('gerente') ||
    p.includes('gestao') ||
    p.includes('painel')
  );
};

// Versão de controle para garantir a limpeza e atualização completa do cardápio sem descrições de categorias
const CURRENT_MENU_VERSION = 'v6_sem_descricoes_categorias';

export default function App() {
  // O preview abre SEMPRE no painel do administrador por padrão como solicitado
  const [currentView, setCurrentView] = useState<'store' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const full = (window.location.pathname + window.location.hash + window.location.search).toLowerCase();
      if (full.includes('view=store') || full.includes('cliente') || full.includes('cardapio-online')) {
        return 'store';
      }
      return 'admin';
    }
    return 'admin';
  });

  // Category & search state
  const [activeCategory, setActiveCategory] = useState<Category>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item to open cleanly in modal
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isDeliveryInfoOpen, setIsDeliveryInfoOpen] = useState(false);

  // Categories list with localStorage & server persistence
  const [categories, setCategories] = useState<CategoryData[]>(() => {
    try {
      const saved = localStorage.getItem('aqf_categories_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const handleSaveCategories = async (updated: CategoryData[]) => {
    setCategories(updated);
    try {
      localStorage.setItem('aqf_categories_v5', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    try {
      await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updated }),
      });
    } catch (err) {
      console.error('Server sync error for categories:', err);
    }

    showToast('Categorias atualizadas com sucesso!');
  };

  // Menu items with localStorage & server persistence (Preserva imagens e lanches customizados)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('aqf_menu_items_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return MENU_ITEMS;
    } catch {
      return MENU_ITEMS;
    }
  });

  const handleSaveMenuItems = async (updated: MenuItem[]) => {
    setMenuItems(updated);
    try {
      localStorage.setItem('aqf_menu_items_v5', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    try {
      const res = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updated }),
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.items)) {
        setMenuItems(data.items);
        try {
          localStorage.setItem('aqf_menu_items_v5', JSON.stringify(data.items));
        } catch {}
      }
    } catch (err) {
      console.error('Server sync error for menu items:', err);
    }

    showToast('Cardápio e fotos atualizados com sucesso!');
  };

  // Complements list with localStorage & server persistence
  const [complements, setComplements] = useState<ExtraOption[]>(() => {
    try {
      const saved = localStorage.getItem('aqf_complements_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_EXTRAS;
    } catch {
      return DEFAULT_EXTRAS;
    }
  });

  const handleSaveComplements = async (updated: ExtraOption[]) => {
    setComplements(updated);
    try {
      localStorage.setItem('aqf_complements_v2', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    try {
      const res = await fetch('/api/menu/complements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complements: updated }),
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.complements)) {
        setComplements(data.complements);
        try {
          localStorage.setItem('aqf_complements_v2', JSON.stringify(data.complements));
        } catch {}
      }
    } catch (err) {
      console.error('Server sync error for complements:', err);
    }

    showToast('Complementos atualizados com sucesso!');
  };

  // Cart & orders state (with localStorage persistence)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aqf_cart_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('aqf_active_order_v2');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [allOrders, setAllOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('aqf_all_orders_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_DEMO_ORDERS;
    } catch {
      return INITIAL_DEMO_ORDERS;
    }
  });

  // Coupons
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Store Settings (Dynamic configuration for phone, schedule, address, VIP promo link, status)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getStoredStoreSettings());

  useEffect(() => {
    // Fetch settings from server
    fetch('/api/store/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          const localSettings = getStoredStoreSettings();
          const merged: StoreSettings = {
            ...data.settings,
            phone: localSettings.phone && localSettings.phone !== DEFAULT_STORE_SETTINGS.phone
              ? localSettings.phone
              : data.settings.phone,
            discountPercent: typeof localSettings.discountPercent === 'number'
              ? localSettings.discountPercent
              : (typeof data.settings.discountPercent === 'number' ? data.settings.discountPercent : 0),
            freeDeliveryThreshold: (typeof localSettings.freeDeliveryThreshold === 'number' && localSettings.freeDeliveryThreshold !== 70)
              ? localSettings.freeDeliveryThreshold
              : (typeof data.settings.freeDeliveryThreshold === 'number' && data.settings.freeDeliveryThreshold !== 70 ? data.settings.freeDeliveryThreshold : 0),
            bannerImageUrl: localSettings.bannerImageUrl || data.settings.bannerImageUrl || '',
          };
          setStoreSettings(merged);
        }
      })
      .catch((err) => console.log('Store settings fetch error:', err));

    // Fetch menu items from server (Persistência no servidor)
    fetch('/api/menu/items')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.items) && data.items.length > 0) {
          setMenuItems(data.items);
          try {
            localStorage.setItem('aqf_menu_items_v5', JSON.stringify(data.items));
          } catch {}
        }
      })
      .catch((err) => console.log('Menu items fetch error:', err));

    // Fetch categories from server
    fetch('/api/menu/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
          try {
            localStorage.setItem('aqf_categories_v5', JSON.stringify(data.categories));
          } catch {}
        }
      })
      .catch((err) => console.log('Categories fetch error:', err));

    // Fetch complements from server
    fetch('/api/menu/complements')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.complements) && data.complements.length > 0) {
          setComplements(data.complements);
          try {
            localStorage.setItem('aqf_complements_v2', JSON.stringify(data.complements));
          } catch {}
        }
      })
      .catch((err) => console.log('Complements fetch error:', err));

    // Listen to updates from AdminPortal
    const handleSettingsUpdated = (e: any) => {
      if (e?.detail) {
        setStoreSettings(e.detail);
      } else {
        setStoreSettings(getStoredStoreSettings());
      }
    };

    window.addEventListener('store_settings_updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('store_settings_updated', handleSettingsUpdated);
    };
  }, []);

  // Identificação do Cliente & Histórico Personalizado ("Peça de novo")
  const [customerPhone, setCustomerPhone] = useState<string>(() => getCurrentCustomerPhone());

  useEffect(() => {
    const handlePhoneUpdate = (e: any) => {
      if (e.detail?.phone) {
        setCustomerPhone(e.detail.phone);
      } else {
        setCustomerPhone(getCurrentCustomerPhone());
      }
    };
    const handleOrdersUpdate = () => {
      setCustomerPhone(getCurrentCustomerPhone());
    };

    window.addEventListener('aqf_customer_phone_updated', handlePhoneUpdate);
    window.addEventListener('aqf_customer_orders_updated', handleOrdersUpdate);
    return () => {
      window.removeEventListener('aqf_customer_phone_updated', handlePhoneUpdate);
      window.removeEventListener('aqf_customer_orders_updated', handleOrdersUpdate);
    };
  }, []);

  // Produtos do bloco "Peça de novo" exclusivos para o cliente identificado
  const repeatOrderItems = useMemo(() => {
    if (!customerPhone) return [];
    return getRepeatOrderProducts(customerPhone, allOrders, menuItems, categories);
  }, [customerPhone, allOrders, menuItems, categories]);

  const storeOpenStatus = useMemo(() => checkStoreOpenStatus(storeSettings), [storeSettings]);

  // Listen to browser navigation (URLs: /gerente, /admin, #/gerente, #/admin)
  useEffect(() => {
    const handleLocationChange = () => {
      const full = window.location.pathname + window.location.hash + window.location.search;
      if (isSecretAdminRoute(full)) {
        setCurrentView('admin');
      } else {
        setCurrentView('store');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToStore = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('store');
  };

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '#admin');
    setCurrentView('admin');
  };

  useEffect(() => {
    try {
      localStorage.setItem('aqf_cart_v2', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem('aqf_active_order_v2', JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem('aqf_active_order_v2');
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeOrder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Cart calculations with reactive store settings
  const cartItemCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const isFreeDelivery = (storeSettings.freeDeliveryThreshold ?? 0) > 0 && subtotal >= storeSettings.freeDeliveryThreshold;
  const deliveryFee = cartItems.length === 0 ? 0 : (isFreeDelivery ? 0 : storeSettings.deliveryFee);

  // Desconto calculado com base na porcentagem configurada na loja OU cupom aplicado
  const storePercent = typeof storeSettings.discountPercent === 'number'
    ? storeSettings.discountPercent
    : (parseFloat(String(storeSettings.discountPercent)) || 0);
  const percentDiscountAmount = storePercent > 0 ? (subtotal * storePercent) / 100 : 0;
  const effectiveDiscount = Math.max(discountAmount, percentDiscountAmount);

  const grandTotal = Math.max(0, subtotal + deliveryFee - effectiveDiscount);

  // Add item to cart
  const handleAddToCart = (itemData: Omit<CartItem, 'cartItemId'>) => {
    const cartItemId = `${itemData.item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newCartItem: CartItem = {
      ...itemData,
      cartItemId,
    };

    setCartItems((prev) => [...prev, newCartItem]);
    showToast(`${itemData.quantity}x ${itemData.item.name} adicionado à sacola!`);
  };

  // Update item quantity
  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  // Remove item
  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  // Coupon handling
  const handleApplyCoupon = (code: string) => {
    const res = validateCoupon(code, subtotal);
    if (res.isValid && res.coupon) {
      setAppliedCoupon(res.coupon.code);
      setDiscountAmount(res.discountAmount);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  // Categorias visíveis para o cliente (oculta categorias esgotadas e ordena pela ordem oficial)
  const clientCategories = useMemo(() => {
    return categories
      .filter((c) => !c.isSoldOut)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories]);

  // Seções visíveis no cardápio do cliente baseado no filtro selecionado
  const visibleCategorySections = useMemo(() => {
    const list = activeCategory === 'todos'
      ? clientCategories
      : clientCategories.filter((sec) => sec.id === activeCategory);
    return list.map((c) => ({ id: c.id, title: c.name }));
  }, [activeCategory, clientCategories]);

  // Itens visíveis para o cliente:
  // "Botão de esgotar categoria— se apertar não aparece esgotado mas sim nem mesmo aparece para o cliente"
  // "Botão de esgotar item — se apertar não aparece nada para o cliente"
  const clientVisibleItems = useMemo(() => {
    const soldOutCatIds = new Set(categories.filter((c) => c.isSoldOut).map((c) => c.id));
    return menuItems.filter((item) => {
      if (item.isAvailable === false) return false;
      if (soldOutCatIds.has(item.category)) return false;
      return true;
    });
  }, [menuItems, categories]);

  // Filter items by search query
  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return clientVisibleItems;
    const q = searchQuery.toLowerCase().trim();
    return clientVisibleItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [searchQuery, clientVisibleItems]);

  // Order status update handler
  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setAllOrders((prev) => {
      const updated = prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord));
      try {
        localStorage.setItem('aqf_all_orders_v2', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (activeOrder && activeOrder.id === orderId) {
      const updatedActive = { ...activeOrder, status: newStatus };
      setActiveOrder(updatedActive);
      try {
        localStorage.setItem('aqf_active_order_v2', JSON.stringify(updatedActive));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Handle successful order creation
  const handleOrderSuccess = (newOrder: Order) => {
    setActiveOrder(newOrder);

    // Grava o pedido no histórico exclusivo do cliente
    recordCustomerOrder(newOrder);
    const cleanPhone = normalizePhone(newOrder.customer?.phone);
    if (cleanPhone) {
      setCustomerPhone(cleanPhone);
    }

    setAllOrders((prev) => {
      const updated = [newOrder, ...prev];
      try {
        localStorage.setItem('aqf_all_orders_v2', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setCartItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setIsOrderTrackerOpen(true);
    showToast(`Pedido #${newOrder.orderNumber} enviado com sucesso!`);
  };

  // Se a rota for o painel secreto (/gerente ou /admin), renderiza o AdminPortal isolado
  if (currentView === 'admin') {
    return (
      <AdminPortal
        complements={complements}
        onSaveComplements={handleSaveComplements}
        menuItems={menuItems}
        onSaveMenuItems={handleSaveMenuItems}
        categories={categories}
        onSaveCategories={handleSaveCategories}
        orders={allOrders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onAddOrder={handleOrderSuccess}
        onNavigateToStore={navigateToStore}
        storeSettings={storeSettings}
        onUpdateStoreSettings={(newSettings) => setStoreSettings(newSettings)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-[#FFA000] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#141414] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#FFA000] flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300">
          <Sparkles className="w-4 h-4 text-[#FFA000] shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Navbar com logotipo oficial e controles */}
      <Navbar
        cartItemCount={cartItemCount}
        cartTotal={grandTotal}
        onOpenCart={() => setIsCartOpen(true)}
        hasActiveOrder={!!activeOrder}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        onOpenDeliveryInfo={() => setIsDeliveryInfoOpen(true)}
        promoGroupLink={storeSettings.promoGroupLink}
      />

      <main className="flex-grow max-w-6xl mx-auto w-full px-2.5 sm:px-6 py-2 sm:py-4">
        
        {/* Banner de LOJA FECHADA (Item 8) */}
        {!storeOpenStatus.isOpen && (
          <div className="mb-4 bg-red-950/95 border-2 border-red-600 text-white p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <strong className="font-brand font-black text-xs sm:text-sm text-red-200 uppercase tracking-wider">
                    LOJA FECHADA NO MOMENTO
                  </strong>
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Pausada
                  </span>
                </div>
                <p className="text-xs text-red-300 mt-0.5">
                  {storeOpenStatus.reason || 'A cozinha não está aceitando novos pedidos no momento.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDeliveryInfoOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
            >
              Ver Horários
            </button>
          </div>
        )}

        {/* Banner de Capa da Loja (Customizável pelo Administrador ou Padrão Piscou Chegou) */}
        <HeroBanner
          onScrollToMenu={() => {
            const el = document.getElementById('cardapio-secao');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          bannerImageUrl={storeSettings.bannerImageUrl}
        />

        {/* Banner Convite para o Grupo VIP de Promoções (Item 10) */}
        {storeSettings.promoGroupLink && (
          <div className="my-3 bg-gradient-to-r from-emerald-950/90 via-zinc-900 to-black border-2 border-emerald-500/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Gift className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-brand font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                    Grupo VIP de Promoções
                  </span>
                  <span className="bg-emerald-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    Ofertas Exclusivas
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Participe do nosso grupo oficial no WhatsApp e receba cupons secretos de desconto e novidades em primeira mão!
                </p>
              </div>
            </div>
            <a
              href={storeSettings.promoGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-brand font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Entrar no Grupo VIP</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Barra de Categorias e Campo de Busca */}
        <div id="cardapio-secao" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 pt-2">
          <div className="flex-grow overflow-hidden">
            <CategoryFilter
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              categories={categories}
            />
          </div>

          {/* Campo de Busca em Tema Escuro */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar lanche..."
              className="w-full pl-9 pr-7 py-2 rounded-xl border border-[#262626] bg-[#141414] text-xs font-semibold text-white placeholder-[#737373] focus:outline-hidden focus:border-[#FFA000] transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737373] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Cardápio Organizado por Sessões de Categorias */}
        {searchedItems.length === 0 ? (
          <div className="bg-[#121212] rounded-3xl border border-[#262626] p-8 text-center space-y-3 my-8 shadow-xl">
            <ShieldAlert className="w-9 h-9 text-[#FFA000] mx-auto" />
            <h3 className="font-brand text-lg text-white">Nenhum item encontrado</h3>
            <p className="text-xs text-[#A3A3A3] max-w-xs mx-auto">
              Não encontramos resultados para &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('todos');
              }}
              className="bg-[#FFA000] text-black px-4 py-2 rounded-xl text-xs font-black hover:bg-[#FFB300] transition-colors cursor-pointer"
            >
              Ver todos os lanches
            </button>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Bloco "Peça de novo" - PRIMEIRO bloco exibido no cardápio para clientes com pedidos anteriores */}
            {repeatOrderItems.length > 0 && !searchQuery && (
              <RepeatOrdersBlock
                items={repeatOrderItems}
                customerPhone={customerPhone}
                onClearCustomer={() => {
                  if (window.confirm('Deseja desvincular o histórico deste cliente neste dispositivo?')) {
                    localStorage.removeItem('aqf_customer_phone');
                    localStorage.removeItem('aqf_customer_name');
                    setCustomerPhone('');
                    showToast('Histórico desvinculado com sucesso!');
                  }
                }}
                onSelectItem={(item) => setCustomizingItem(item)}
                onQuickAdd={(item) => {
                  handleAddToCart({
                    item,
                    quantity: 1,
                    unitPrice: item.price,
                    totalPrice: item.price,
                    selectedExtras: [],
                    selectedRemovals: [],
                  });
                  showToast(`${item.name} adicionado ao carrinho!`);
                }}
              />
            )}

            {visibleCategorySections.map((section) => {
              const categoryItems = searchedItems.filter(
                (item) => item.category === section.id && item.isAvailable !== false
              );
              if (categoryItems.length === 0) return null;

              return (
                <section key={section.id} id={`categoria-${section.id}`} className="scroll-mt-24">
                  {/* Cabeçalho da Sessão: Apenas o Título da Categoria */}
                  <div className="mb-3 sm:mb-4 pb-2 border-b border-[#242424]">
                    <h2 className="font-brand text-lg sm:text-2xl text-white uppercase tracking-wide">
                      {section.title}
                    </h2>
                  </div>

                  {/* Mural com 3 Itens por Fileira */}
                  <PhotoMural
                    items={categoryItems}
                    onSelectItem={(item) => setCustomizingItem(item)}
                  />
                </section>
              );
            })}
          </div>
        )}

      </main>

      {/* Rodapé Estiloso com a Marca sem botões de admin visíveis */}
      <Footer
        onOpenDeliveryInfo={() => setIsDeliveryInfoOpen(true)}
        storePhone={storeSettings.phone}
        storePhoneDisplay={storeSettings.phoneDisplay}
        storeAddress={storeSettings.address}
        promoGroupLink={storeSettings.promoGroupLink}
        footerManifesto={storeSettings.footerManifesto}
        scheduleNotice={storeSettings.scheduleNotice}
        footerPromoText={storeSettings.footerPromoText}
        instagramHandle={storeSettings.instagramHandle}
        instagramUrl={storeSettings.instagramUrl}
        openingHoursSchedule={storeSettings.openingHoursSchedule}
      />

      {/* Delivery & Store Info Modal */}
      <DeliveryInfoModal
        isOpen={isDeliveryInfoOpen}
        onClose={() => setIsDeliveryInfoOpen(false)}
        storeSettings={storeSettings}
        isOpenStatus={storeOpenStatus}
      />

      {/* Product Customizer Modal */}
      <ProductCustomizerModal
        item={customizingItem}
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleAddToCart}
        availableComplements={complements}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        discountAmount={effectiveDiscount}
      />

      {/* Checkout Modal com validações de loja aberta e telefone dinâmico */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        discountAmount={effectiveDiscount}
        total={grandTotal}
        appliedCoupon={appliedCoupon}
        onOrderSuccess={handleOrderSuccess}
        storePhone={storeSettings.phone}
        promoGroupLink={storeSettings.promoGroupLink}
        discountPercent={storePercent}
        isStoreOpen={storeOpenStatus.isOpen}
        storeClosedReason={storeOpenStatus.reason}
      />

      {/* Order Tracker */}
      <LiveOrderTrackerModal
        order={activeOrder}
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        storePhone={storeSettings.phone}
      />
    </div>
  );
}
