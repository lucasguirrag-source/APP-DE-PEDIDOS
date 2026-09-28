import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Check, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Store, 
  ShoppingBag, 
  Sliders, 
  Phone, 
  Image as ImageIcon,
  LogOut,
  AlertCircle,
  UtensilsCrossed,
  Layers,
  ChefHat,
  Menu as MenuIcon,
  Printer,
  Bluetooth,
  Headphones,
  Settings,
  Edit3,
  Columns,
  FileText,
  X,
  Search,
  CheckCircle2,
  Bike,
  Flame,
  Minus,
  MapPin,
  MoreVertical,
  Tag,
  Save
} from 'lucide-react';
import { ExtraOption, MenuItem, Order, CartItem, CategoryData, StoreSettings, DaySchedule, PlatformRate } from '../../types';
import { adminSecurity } from '../../utils/adminSecurity';
import { DEFAULT_EXTRAS, STORE_INFO } from '../../data/menuData';
import { COMPLEMENT_IMAGE_PRESETS } from '../ComplementSettingsModal';
import { MenuManager } from './MenuManager';
import { OrderManager } from './OrderManager';
import { FinanceManager } from './FinanceManager';
import { CustomerManager } from './CustomerManager';
import { PrinterSettingsModal } from './PrinterSettingsModal';
import { DeliveryLocationsManager } from './DeliveryLocationsManager';
import { CouponManagerModal } from './CouponManagerModal';
import { AboutEditModal } from './AboutEditModal';
import { PricingDashboard } from './pricing/PricingDashboard';
import { AnotaAiDrawer } from './AnotaAiDrawer';
import { getStoredStoreSettings, saveStoredStoreSettings, DEFAULT_STORE_SETTINGS, DEFAULT_SCHEDULE, normalizeWhatsAppNumber } from '../../utils/storeSettings';
import { compressAndConvertImage, uploadImageToServer } from '../../utils/imageUpload';
import { Upload, Loader2, Link as LinkIcon, DollarSign, Users, Calendar, Clock, Globe, Calculator } from 'lucide-react';

interface AdminPortalProps {
  complements: ExtraOption[];
  onSaveComplements: (updated: ExtraOption[]) => void;
  menuItems: MenuItem[];
  onSaveMenuItems: (updated: MenuItem[]) => void;
  categories?: CategoryData[];
  onSaveCategories?: (updated: CategoryData[]) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onAddOrder?: (newOrder: Order) => void;
  onNavigateToStore: () => void;
  storeSettings?: StoreSettings;
  onUpdateStoreSettings?: (updated: StoreSettings) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  complements,
  onSaveComplements,
  menuItems,
  onSaveMenuItems,
  categories,
  onSaveCategories,
  orders,
  onUpdateOrderStatus,
  onAddOrder,
  onNavigateToStore,
  storeSettings: propStoreSettings,
  onUpdateStoreSettings,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => adminSecurity.isAuthenticated());

  // Login Form State
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [securityStatus, setSecurityStatus] = useState(() => adminSecurity.getSecurityStatus());
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);

  // Default active tab is strictly 'pedidos' as requested!
  const [activeTab, setActiveTab] = useState<'pedidos' | 'cardapio' | 'precificacao' | 'financas' | 'clientes' | 'locais' | 'config'>('pedidos');

  // New Order Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderType, setNewOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerStreet, setNewCustomerStreet] = useState('');
  const [newCustomerNumber, setNewCustomerNumber] = useState('');
  const [newCustomerNeighborhood, setNewCustomerNeighborhood] = useState('');
  const [newCustomerComplement, setNewCustomerComplement] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [newOrderInitialStatus, setNewOrderInitialStatus] = useState<Order['status']>('preparing');
  const [selectedItemsForNewOrder, setSelectedItemsForNewOrder] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Modals
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isAboutEditModalOpen, setIsAboutEditModalOpen] = useState(false);
  const [isTopLeftMenuOpen, setIsTopLeftMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Complementos Management State
  const [complementsList, setComplementsList] = useState<ExtraOption[]>(complements);
  const [showAddComplement, setShowAddComplement] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompPrice, setNewCompPrice] = useState('5.00');
  const [newCompImage, setNewCompImage] = useState(COMPLEMENT_IMAGE_PRESETS[0].url);
  const [isUploadingCompImage, setIsUploadingCompImage] = useState(false);

  // Store Management State (Synchronized with backend & site)
  const [currentStoreSettings, setCurrentStoreSettings] = useState<StoreSettings>(() => {
    return propStoreSettings || getStoredStoreSettings();
  });

  const [storeStatus, setStoreStatus] = useState<boolean>(() => {
    return !currentStoreSettings.isManuallyClosed;
  });
  const [storeFee, setStoreFee] = useState<string>(() => {
    return currentStoreSettings.deliveryFee.toFixed(2);
  });
  const [storePhone, setStorePhone] = useState<string>(() => {
    return currentStoreSettings.phone;
  });
  const [storeAddress, setStoreAddress] = useState<string>(() => {
    return currentStoreSettings.address;
  });
  const [storePromoLink, setStorePromoLink] = useState<string>(() => {
    return currentStoreSettings.promoGroupLink;
  });
  const [storeDiscountPercent, setStoreDiscountPercent] = useState<string>(() => {
    return String(currentStoreSettings.discountPercent !== undefined ? currentStoreSettings.discountPercent : 0);
  });
  const [storeBannerImageUrl, setStoreBannerImageUrl] = useState<string>(() => {
    return currentStoreSettings.bannerImageUrl || '';
  });
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(() => {
    return currentStoreSettings.openingHoursSchedule || DEFAULT_SCHEDULE;
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (propStoreSettings) {
      setCurrentStoreSettings(propStoreSettings);
      setStoreStatus(!propStoreSettings.isManuallyClosed);
      setStoreFee(propStoreSettings.deliveryFee.toFixed(2));
      setStorePhone(propStoreSettings.phone);
      setStoreAddress(propStoreSettings.address);
      setStorePromoLink(propStoreSettings.promoGroupLink);
      setStoreDiscountPercent(String(propStoreSettings.discountPercent !== undefined ? propStoreSettings.discountPercent : 0));
      setStoreBannerImageUrl(propStoreSettings.bannerImageUrl || '');
      if (propStoreSettings.openingHoursSchedule) {
        setWeeklySchedule(propStoreSettings.openingHoursSchedule);
      }
    }
  }, [propStoreSettings]);

  useEffect(() => {
    setComplementsList(complements);
  }, [complements]);

  useEffect(() => {
    const status = adminSecurity.getSecurityStatus();
    setSecurityStatus(status);

    if (status.isLocked && status.lockoutRemainingSeconds > 0) {
      setLockoutCountdown(status.lockoutRemainingSeconds);
      const interval = setInterval(() => {
        setLockoutCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setSecurityStatus(adminSecurity.getSecurityStatus());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loginError]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const res = adminSecurity.login(username, password);
    if (res.success) {
      setIsAuthenticated(true);
      showToast('Bem-vindo ao Gerenciador de Pedidos!');
    } else {
      setLoginError(res.error || 'Erro ao autenticar.');
      setSecurityStatus(adminSecurity.getSecurityStatus());
    }
  };

  const handleLogout = () => {
    adminSecurity.logout();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    showToast('Sessão encerrada com sucesso.');
  };

  // Actions for New Order
  const handleAddItemToNewOrder = (item: MenuItem) => {
    setSelectedItemsForNewOrder((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) => (i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleRemoveItemFromNewOrder = (itemId: string) => {
    setSelectedItemsForNewOrder((prev) => {
      const existing = prev.find((i) => i.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => (i.item.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
      }
      return prev.filter((i) => i.item.id !== itemId);
    });
  };

  const calculateNewOrderSubtotal = () => {
    return selectedItemsForNewOrder.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  };

  const handleCreateNewOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemsForNewOrder.length === 0) {
      showToast('Adicione ao menos um item ao pedido!');
      return;
    }
    if (!newCustomerName.trim()) {
      showToast('Informe o nome do cliente!');
      return;
    }

    const subtotal = calculateNewOrderSubtotal();
    const deliveryFee = newOrderType === 'delivery' ? parseFloat(storeFee) || 5.0 : 0;
    const total = subtotal + deliveryFee;

    const cartItems: CartItem[] = selectedItemsForNewOrder.map((it) => ({
      cartItemId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      item: it.item,
      selectedExtras: [],
      selectedRemovals: [],
      quantity: it.quantity,
      unitPrice: it.item.price,
      totalPrice: it.item.price * it.quantity,
    }));

    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: `AQF-${orderNumber}`,
      orderNumber,
      items: cartItems,
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      status: newOrderInitialStatus,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      estimatedDeliveryTime: newOrderType === 'delivery' ? '30 - 45 min' : 'Pronto para balcão',
      customer: {
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || 'Não informado',
        deliveryMethod: newOrderType,
        address: {
          street: newCustomerStreet.trim() || (newOrderType === 'pickup' ? 'Balcão da Loja' : 'Rua Central'),
          number: newCustomerNumber.trim() || 'S/N',
          neighborhood: newCustomerNeighborhood.trim() || 'Centro',
          complement: newCustomerComplement.trim(),
          reference: '',
        },
        paymentMethod: newPaymentMethod,
      },
    };

    if (onAddOrder) {
      onAddOrder(newOrder);
    }
    showToast(`Pedido #${orderNumber} cadastrado com sucesso!`);
    setIsNewOrderModalOpen(false);
    setSelectedItemsForNewOrder([]);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerStreet('');
    setNewCustomerNumber('');
    setNewCustomerNeighborhood('');
    setNewCustomerComplement('');
    setActiveTab('pedidos');
  };

  // Complement Handlers
  const handleUpdateComplement = (id: string, updates: Partial<ExtraOption>) => {
    const updated = complementsList.map((item) => (item.id === id ? { ...item, ...updates } : item));
    setComplementsList(updated);
    onSaveComplements(updated);
    showToast('Adicional atualizado!');
  };

  const handleDeleteComplement = (id: string) => {
    const updated = complementsList.filter((item) => item.id !== id);
    setComplementsList(updated);
    onSaveComplements(updated);
    showToast('Adicional excluído.');
  };

  const handleAddNewComplement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) {
      showToast('Digite o nome do complemento!');
      return;
    }
    const priceNum = parseFloat(newCompPrice.replace(',', '.')) || 0;
    const newComp: ExtraOption = {
      id: `extra-${Date.now()}`,
      name: newCompName.trim(),
      price: priceNum,
      image: newCompImage,
      enabled: true,
    };
    const updated = [...complementsList, newComp];
    setComplementsList(updated);
    onSaveComplements(updated);
    setNewCompName('');
    setNewCompPrice('5.00');
    setShowAddComplement(false);
    showToast('Novo complemento adicionado!');
  };

  const handleResetComplements = () => {
    if (window.confirm('Deseja restaurar a lista padrão de adicionais?')) {
      setComplementsList(DEFAULT_EXTRAS);
      onSaveComplements(DEFAULT_EXTRAS);
      showToast('Adicionais restaurados para o padrão.');
    }
  };

  const handleSavePlatformRates = (newRates: PlatformRate[]) => {
    const updated = {
      ...currentStoreSettings,
      platformRates: newRates,
    };
    setCurrentStoreSettings(updated);
    saveStoredStoreSettings(updated);
    if (onUpdateStoreSettings) {
      onUpdateStoreSettings(updated);
    }
    showToast('Taxas das plataformas salvas!');
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (PNG ou JPG).');
      return;
    }

    try {
      showToast('Enviando e salvando imagem de capa no servidor...');
      const permanentUrl = await uploadImageToServer(file, 'banner', 1600, 800, 0.88);
      setStoreBannerImageUrl(permanentUrl);
      showToast('Imagem de capa salva com sucesso! Clique em "Salvar Imagem de Capa" para confirmar.');
    } catch {
      showToast('Erro ao processar imagem de capa.');
    }
  };

  const handleSaveStoreSettings = async () => {
    setIsSavingSettings(true);
    const cleanPhone = normalizeWhatsAppNumber(storePhone);
    const cleanFee = parseFloat(storeFee.replace(',', '.')) || 6.0;
    const cleanDiscount = isNaN(parseFloat(storeDiscountPercent.replace(',', '.'))) ? 0 : parseFloat(storeDiscountPercent.replace(',', '.'));

    const newSettings: StoreSettings = {
      ...currentStoreSettings,
      name: 'AI QUE FOME',
      phone: cleanPhone,
      phoneDisplay: storePhone,
      address: storeAddress.trim(),
      promoGroupLink: storePromoLink.trim(),
      discountPercent: cleanDiscount,
      bannerImageUrl: storeBannerImageUrl.trim(),
      isManuallyClosed: !storeStatus,
      deliveryFee: cleanFee,
      openingHoursSchedule: weeklySchedule,
    };

    setCurrentStoreSettings(newSettings);
    saveStoredStoreSettings(newSettings);

    try {
      await fetch('/api/store/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (e) {
      console.error('Server sync error:', e);
    }

    if (onUpdateStoreSettings) {
      onUpdateStoreSettings(newSettings);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: newSettings }));
    }

    setIsSavingSettings(false);
    showToast('Configurações da loja e telefone atualizados com sucesso!');
  };

  // Botão simples e rápido no topo direito para Fechar/Abrir loja instantaneamente
  const handleQuickToggleStoreOpenClose = async () => {
    const nextStatus = !storeStatus;
    setStoreStatus(nextStatus);
    const newSettings: StoreSettings = {
      ...currentStoreSettings,
      isManuallyClosed: !nextStatus,
    };
    setCurrentStoreSettings(newSettings);
    saveStoredStoreSettings(newSettings);
    try {
      await fetch('/api/store/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (e) {
      console.error('Error syncing store status with server:', e);
    }
    if (onUpdateStoreSettings) {
      onUpdateStoreSettings(newSettings);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: newSettings }));
    }
    showToast(nextStatus ? '🟢 Loja aberta com sucesso!' : '🔴 Loja fechada para novos pedidos!');
  };

  const handleSaveAboutSettings = async (updatedSettings: StoreSettings) => {
    setCurrentStoreSettings(updatedSettings);
    saveStoredStoreSettings(updatedSettings);

    setStoreAddress(updatedSettings.address);
    setStorePhone(updatedSettings.phoneDisplay || updatedSettings.phone);
    setStorePromoLink(updatedSettings.promoGroupLink);

    try {
      await fetch('/api/store/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
    } catch (e) {
      console.error('Server sync error:', e);
    }

    if (onUpdateStoreSettings) {
      onUpdateStoreSettings(updatedSettings);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: updatedSettings }));
    }

    showToast('Dados e textos do "Sobre a Hamburgueria" atualizados na página com sucesso!');
  };

  // ==========================================
  // TELA DE LOGIN (PROTEÇÃO CONTRA INVASORES)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121212] border border-[#222222] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#FFA000]/15 border border-[#FFA000]/30 text-[#FFA000] flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="font-brand font-black text-2xl text-white tracking-wide">
              ADMINISTRADOR
            </h1>
            <p className="text-xs text-[#8E8E8E]">
              Painel de Gestão de Pedidos e Cardápio
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                Usuário do Administrador
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Lucas guirra"
                  disabled={securityStatus.isLocked}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#FFA000] text-sm text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={securityStatus.isLocked}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#FFA000] text-sm text-white focus:outline-hidden disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setUsername('Lucas guirra');
                  setPassword('13081999');
                  const res = adminSecurity.login('Lucas guirra', '13081999');
                  if (res.success) {
                    setIsAuthenticated(true);
                    showToast('Bem-vindo, Lucas guirra! Sessão iniciada.');
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#3A3A3A] text-xs text-[#FFA000] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFA000]" />
                <span>Entrar como Administrador (Lucas guirra)</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={securityStatus.isLocked}
              className="w-full bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black py-3.5 rounded-2xl text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#FFA000]/20 disabled:opacity-50 mt-2"
            >
              Acessar Painel
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={onNavigateToStore}
              className="text-xs text-[#737373] hover:text-[#FFA000] flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para o Cardápio de Clientes</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD ADMINISTRATIVO AUTENTICADO
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0E0E10] text-white flex flex-col font-sans">
      
      {/* Toast de Notificação */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#FF7A00] text-black font-brand font-black px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-3 duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span className="text-xs tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: ESTILO ANOTA AI EM LARANJA COM 3 PONTINHOS / HAMBURGER E BOTÃO DE FECHAR LOJA */}
      <header className="sticky top-0 z-40 bg-[#121214] border-b border-[#242426] px-3 sm:px-6 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Esquerda: 3 Pontinhos / Hamburger Menu + Logo Oficial 'aí que Fome' */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsTopLeftMenuOpen(true)}
              className="p-2 rounded-xl bg-[#1C1C20] hover:bg-[#28282E] border border-[#2F2F36] text-[#FF7A00] hover:text-[#FFA000] transition-all cursor-pointer flex items-center justify-center shadow-xs group"
              title="Menu Principal (3 Pontinhos / Hambúrguer)"
            >
              <MenuIcon className="w-5 h-5 stroke-[2.5] group-hover:scale-105 transition-transform" />
            </button>

            {/* Logo Oficial aí que Fome */}
            <div 
              onClick={() => setActiveTab('pedidos')}
              className="flex items-center gap-2 select-none cursor-pointer group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#E65100] to-[#FFA000] p-0.5 shadow-xs flex items-center justify-center">
                <div className="w-full h-full bg-[#18181A] rounded-[10px] flex items-center justify-center">
                  <span className="text-sm sm:text-base">🍔</span>
                </div>
              </div>
              <div className="font-brand font-black text-base sm:text-lg tracking-tight leading-none flex items-center">
                <span className="text-zinc-200">aí que </span>
                <span className="text-[#FF7A00] ml-1">Fome</span>
              </div>
            </div>
          </div>

          {/* Direita: Botão Pequeno e Simples de Fechar/Abrir Loja + Ver Cardápio */}
          <div className="flex items-center gap-2">
            
            {/* BOTÃO PEQUENO E SIMPLES: FECHAR LOJA / ABRIR LOJA (SOLICITADO PELO USUÁRIO) */}
            <button
              type="button"
              onClick={handleQuickToggleStoreOpenClose}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs border ${
                storeStatus
                  ? 'bg-red-950/40 hover:bg-red-900/60 border-red-500/50 text-red-300'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/50 text-emerald-300'
              }`}
              title={storeStatus ? 'Clique para fechar a loja para novos pedidos' : 'Clique para abrir a loja para novos pedidos'}
            >
              <span className={`w-2 h-2 rounded-full ${storeStatus ? 'bg-red-500' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="font-brand font-black tracking-wide">
                {storeStatus ? 'Fechar Loja' : 'Abrir Loja'}
              </span>
            </button>

            {/* Ver Loja / Cardápio de Clientes */}
            <button
              type="button"
              onClick={onNavigateToStore}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF7A00]/15 hover:bg-[#FF7A00]/25 border border-[#FF7A00]/40 text-xs font-bold text-[#FFA000] transition-all cursor-pointer"
              title="Acessar cardápio de pedidos do cliente"
            >
              <Store className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Ver Cardápio</span>
            </button>

            {/* Copiar Link do Cardápio para o Cliente */}
            <button
              type="button"
              onClick={() => {
                const url = typeof window !== 'undefined' ? `${window.location.origin}/?view=store` : '';
                if (url && navigator.clipboard) {
                  navigator.clipboard.writeText(url);
                  showToast('Link do cardápio copiado com sucesso!');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C20] hover:bg-[#28282E] border border-[#2F2F36] text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Copiar link do cardápio para enviar aos clientes no WhatsApp ou Instagram"
            >
              <LinkIcon className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span className="hidden lg:inline">Copiar Link</span>
            </button>

            {/* Sair */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-xl bg-[#1A1A1E] hover:bg-red-950/40 border border-[#2D2D32] hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* DRAWER ESTILO ANOTA AI */}
      <AnotaAiDrawer
        isOpen={isTopLeftMenuOpen}
        onClose={() => setIsTopLeftMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
        onOpenCouponModal={() => setIsCouponModalOpen(true)}
        onOpenAboutModal={() => setIsAboutEditModalOpen(true)}
        onNavigateToStore={onNavigateToStore}
        onLogout={handleLogout}
        storeSettings={currentStoreSettings}
        isStoreOpen={storeStatus}
        pendingOrdersCount={orders.filter((o) => o.status === 'received' || o.status === 'preparing').length}
      />

      {/* CORPO PRINCIPAL DO ADMINISTRADOR */}
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-6 flex-grow">
        
        {/* Banner de navegação para voltar aos pedidos quando em outra seção */}
        {activeTab !== 'pedidos' && (
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#242426]">
            <button
              type="button"
              onClick={() => setActiveTab('pedidos')}
              className="px-3 py-1.5 rounded-xl bg-[#1A1A1E] hover:bg-[#25252A] border border-[#2E2E34] text-zinc-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF7A00]" />
              <span>← Voltar para Pedidos</span>
            </button>

            <span className="text-xs font-bold text-zinc-400">
              {activeTab === 'cardapio' ? '🍔 Cardápio & Produtos' :
               activeTab === 'precificacao' ? '📊 Custos & Precificação' :
               activeTab === 'financas' ? '📈 Meu Desempenho / Finanças' :
               activeTab === 'clientes' ? '👥 Clientes Cadastrados' :
               activeTab === 'locais' ? '🛵 Taxas de Entrega & Bairros' :
               activeTab === 'config' ? '⚙️ Configurações da Loja' : activeTab}
            </span>
          </div>
        )}

        {/* TELA DE PEDIDOS (PADRÃO AO ENTRAR) */}
        {activeTab === 'pedidos' && (
          <div className="space-y-4">
            <OrderManager
              orders={orders}
              onUpdateOrderStatus={onUpdateOrderStatus}
              showToast={showToast}
            />
          </div>
        )}

        {/* TELA DE CARDÁPIO */}
        {activeTab === 'cardapio' && (
          <div className="space-y-4">
            <MenuManager
              menuItems={menuItems}
              onSaveMenuItems={onSaveMenuItems}
              categories={categories}
              onSaveCategories={onSaveCategories}
              complements={complementsList}
              onSaveComplements={onSaveComplements}
              onNavigateToStore={onNavigateToStore}
              showToast={showToast}
            />
          </div>
        )}

        {/* TELA DE PRECIFICAÇÃO INTELIGENTE & CUSTOS DOS PRODUTOS */}
        {activeTab === 'precificacao' && (
          <div className="space-y-4">
            <PricingDashboard
              menuItems={menuItems}
              onUpdateMenuItemPrice={(productId, newPrice) => {
                const updated = menuItems.map((item) =>
                  item.id === productId ? { ...item, price: newPrice } : item
                );
                onSaveMenuItems(updated);
              }}
              showToast={showToast}
            />
          </div>
        )}

        {/* TELA DE FINANÇAS & IA (Item 4) */}
        {activeTab === 'financas' && (
          <div className="space-y-4">
            <FinanceManager
              platformRates={currentStoreSettings.platformRates || []}
              onSavePlatformRates={handleSavePlatformRates}
              showToast={showToast}
            />
          </div>
        )}

        {/* TELA DE CLIENTES (Item 6) */}
        {activeTab === 'clientes' && (
          <div className="space-y-4">
            <CustomerManager
              orders={orders}
              showToast={showToast}
            />
          </div>
        )}

        {/* TELA DE LOCAIS E TAXAS DE ENTREGA */}
        {activeTab === 'locais' && (
          <div className="space-y-4">
            <DeliveryLocationsManager showToast={showToast} />
          </div>
        )}

        {/* TELA DE CONFIGURAÇÕES (Itens 3, 8, 10) */}
        {activeTab === 'config' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-[#141414] border border-[#222222] p-5 sm:p-6 rounded-3xl space-y-6">
              <div>
                <h2 className="font-brand font-black text-xl text-white">Configurações Gerais da Operação</h2>
                <p className="text-xs text-[#8E8E8E] mt-1">
                  Ajuste o telefone oficial, status da loja, horários semanais e grupo VIP de promoções.
                </p>
              </div>

              {/* ATALHO E PAINEL: EDITAR SOBRE A HAMBURGUERIA & TEXTOS DO SITE */}
              <div className="bg-gradient-to-r from-[#1C180E] via-[#161616] to-[#121212] border-2 border-[#FFA000]/60 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFA000] text-black flex items-center justify-center font-black shrink-0 shadow-lg shadow-[#FFA000]/25">
                    <FileText className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-brand font-black text-base text-white">
                        EDITAR SOBRE A HAMBURGUERIA
                      </h3>
                      <span className="bg-[#FFA000] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Configurável
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Edite a apresentação da loja, manifesto do rodapé, horários, endereço físico e contatos das redes sociais.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAboutEditModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs tracking-wider uppercase transition-all shadow-md shadow-[#FFA000]/20 hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
                >
                  <Edit3 className="w-4 h-4 stroke-[2.5]" />
                  <span>Editar Textos &amp; Sobre</span>
                </button>
              </div>

              {/* Status da Loja (Item 8: Botão Fechar Loja) */}
              <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-white">Status da Hamburgueria / Cozinha</h3>
                  <p className="text-xs text-[#888] mt-0.5">
                    {storeStatus
                      ? '🟢 Loja aberta e aceitando pedidos no site.'
                      : '🔴 LOJA FECHADA: O site exibe o aviso em destaque e bloqueia novos pedidos.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !storeStatus;
                    setStoreStatus(next);
                    showToast(next ? 'Loja marcada como ABERTA!' : 'Loja marcada como FECHADA! Clientes serão avisados.');
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-brand font-black cursor-pointer transition-all shrink-0 ${
                    storeStatus
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/40'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-900/40'
                  }`}
                >
                  {storeStatus ? '⛔ Fechar Loja Agora' : '✅ Reabrir Loja'}
                </button>
              </div>

              {/* Telefone e Endereço (Item 3: DDD 74 e sincronização real) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">WhatsApp da Loja (com DDD 74) *</label>
                    <span className="text-[10px] text-[#FFA000] font-bold">Reflete em todo o site</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="Ex: 5574999999999 ou (74) 99999-9999"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#202020] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleSaveStoreSettings}
                      disabled={isSavingSettings}
                      className="px-3.5 py-2 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-black text-xs cursor-pointer shrink-0 transition-all shadow-md shadow-[#FFA000]/15"
                    >
                      Salvar
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-emerald-400 font-mono">
                      Ativo: +{normalizeWhatsAppNumber(storePhone)}
                    </p>
                    <a
                      href={`https://wa.me/${normalizeWhatsAppNumber(storePhone)}?text=${encodeURIComponent('Teste de WhatsApp - AI QUE FOME')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#FFA000] hover:underline font-bold"
                    >
                      Testar no WhatsApp ↗
                    </a>
                  </div>
                </div>

                <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-white block">Endereço da Hamburgueria *</label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Ex: Av. Senhor dos Passos, 280 - Centro, Capim Grosso - BA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#202020] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                  />
                  <p className="text-[11px] text-[#777]">
                    Localização oficial exibida aos clientes de Capim Grosso e região.
                  </p>
                </div>
              </div>

              {/* Grupo VIP de Promoções (Item 10) e Desconto Automático */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">Link do Grupo de WhatsApp (Cupons Exclusivos) *</label>
                    <span className="text-[10px] text-emerald-400 font-bold">Mensagem Automática</span>
                  </div>
                  <input
                    type="url"
                    value={storePromoLink}
                    onChange={(e) => setStorePromoLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/ExemploGrupo"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#202020] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                  />
                  <p className="text-[11px] text-[#777]">
                    Este link será inserido automaticamente na mensagem de pedido enviada pelo WhatsApp, avisando aos clientes que cupons exclusivos são liberados no grupo!
                  </p>
                </div>

                <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">Desconto Especial Automático (% OFF)</label>
                    <span className="text-[10px] text-[#FFA000] font-bold">Qualquer % desejada</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={storeDiscountPercent}
                      onChange={(e) => setStoreDiscountPercent(e.target.value)}
                      placeholder="Ex: 5"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#202020] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleSaveStoreSettings}
                      disabled={isSavingSettings}
                      className="px-3.5 py-2 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-black text-xs cursor-pointer shrink-0 transition-all shadow-md shadow-[#FFA000]/15"
                    >
                      Salvar
                    </button>
                  </div>
                  <p className="text-[11px] text-[#777]">
                    Digite qualquer porcentagem (ex: 5 para 5% OFF, ou 0 para nenhum). É aplicada imediatamente no carrinho e checkout.
                  </p>
                </div>
              </div>

              {/* Imagem de Capa / Banner Promocional do Site */}
              <div className="bg-[#181818] border border-[#282828] p-4 sm:p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#282828]">
                  <div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#FFA000]" />
                      <h3 className="font-bold text-sm text-white">Imagem de Capa / Banner do Cardápio</h3>
                    </div>
                    <p className="text-xs text-[#888] mt-0.5">
                      Personalize a imagem principal que aparece no topo da página inicial para todos os seus clientes.
                    </p>
                  </div>

                  {/* Informação destacada da medida para o usuário */}
                  <div className="bg-[#202020] border border-[#FFA000]/40 px-3.5 py-2 rounded-xl text-left sm:text-right shrink-0">
                    <span className="text-[10px] text-[#A3A3A3] block uppercase font-bold tracking-wider">Medida Recomendada</span>
                    <span className="font-brand font-black text-xs text-[#FFA000] block">1200 x 400 px (3:1)</span>
                    <span className="text-[10px] text-[#777] block">ou 1600 x 500 px · Formato PNG ou JPG</span>
                  </div>
                </div>

                {/* Pré-visualização ao vivo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Pré-visualização do Banner:</span>
                    {storeBannerImageUrl ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Imagem personalizada ativa
                      </span>
                    ) : (
                      <span className="text-[#A3A3A3] font-medium">Exibindo banner padrão ("Piscou? Chegou!")</span>
                    )}
                  </div>

                  <div className="relative w-full aspect-[3/1] max-h-[190px] bg-black rounded-2xl overflow-hidden border border-[#333] flex items-center justify-center shadow-inner">
                    {storeBannerImageUrl ? (
                      <img
                        src={storeBannerImageUrl}
                        alt="Prévia da Capa da Loja"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full relative overflow-hidden flex items-center justify-between px-6 bg-gradient-to-r from-black via-[#0E0E0E] to-[#141414]">
                        <div className="space-y-1">
                          <span className="bg-[#FFA000] text-black px-2 py-0.5 rounded text-[9px] font-brand font-black uppercase tracking-wider">
                            AI QUE FOME
                          </span>
                          <div className="font-brand font-black text-lg sm:text-2xl text-white leading-tight">
                            PISCOU? <span className="text-[#FFA000]">CHEGOU</span>
                          </div>
                          <span className="text-[10px] text-[#888] block">
                            Smash burgers na brasa · Capim Grosso - BA
                          </span>
                        </div>
                        <div className="text-right hidden xs:block">
                          <span className="text-xs text-[#FFA000] font-bold block">Banner Oficial Ativo</span>
                          <span className="text-[10px] text-[#666]">1200 x 400 px</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controles de Upload de Arquivo e Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Upload do Arquivo do Computador ou Celular */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      Fazer Upload de Imagem (Celular / Computador)
                    </label>
                    <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-[#FFA000]/60 bg-[#202020] hover:bg-[#282828] text-white text-xs font-bold cursor-pointer transition-colors shadow-sm">
                      <Upload className="w-4 h-4 text-[#FFA000]" />
                      <span>Escolher Imagem (PNG ou JPG)</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        onChange={handleBannerFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Campo para colar URL caso prefira */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      Ou Cole a URL / Link Direto da Imagem
                    </label>
                    <input
                      type="url"
                      value={storeBannerImageUrl}
                      onChange={(e) => setStoreBannerImageUrl(e.target.value)}
                      placeholder="https://sua-imagem.com/banner.png"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#202020] border border-[#333] text-white text-xs font-bold focus:border-[#FFA000] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Barra de Ações: Restaurar Padrão e Salvar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#242424]">
                  <div>
                    {storeBannerImageUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          setStoreBannerImageUrl('');
                          showToast('Banner padrão restaurado! Clique em Salvar para confirmar no site.');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-red-500/40 hover:bg-red-950/40 text-red-400 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Restaurar Banner Padrão
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#777]">
                        Dica: Crie imagens em 1200x400 para manter máxima nitidez em telas de celulares e computadores.
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveStoreSettings}
                    disabled={isSavingSettings}
                    className="px-4 py-2 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-black text-xs cursor-pointer transition-all shadow-md shadow-[#FFA000]/20 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingSettings ? 'Salvando...' : 'Salvar Imagem de Capa'}</span>
                  </button>
                </div>
              </div>

              {/* Horário Semanal de Funcionamento (Item 8) */}
              <div className="bg-[#181818] border border-[#282828] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">Horário Semanal de Abertura e Fechamento</h3>
                    <p className="text-xs text-[#888]">
                      O sistema controla automaticamente a abertura da loja pelo horário de Capim Grosso (BA).
                    </p>
                  </div>
                  <Clock className="w-5 h-5 text-[#FFA000]" />
                </div>

                <div className="space-y-2">
                  {weeklySchedule.map((sched, idx) => (
                    <div
                      key={sched.dayOfWeek}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#202020] border border-[#2D2D2D] text-xs"
                    >
                      <div className="flex items-center gap-2 w-32">
                        <span className="font-bold text-white">{sched.dayName}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sched.isClosed}
                            onChange={(e) => {
                              const updated = [...weeklySchedule];
                              updated[idx] = { ...updated[idx], isClosed: e.target.checked };
                              setWeeklySchedule(updated);
                            }}
                            className="rounded-sm text-red-500 focus:ring-red-500"
                          />
                          <span className={sched.isClosed ? 'text-red-400 font-bold' : 'text-[#888]'}>
                            {sched.isClosed ? 'Fechado o dia todo' : 'Aberto'}
                          </span>
                        </label>

                        {!sched.isClosed && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={sched.openTime}
                              onChange={(e) => {
                                const updated = [...weeklySchedule];
                                updated[idx] = { ...updated[idx], openTime: e.target.value };
                                setWeeklySchedule(updated);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-xs font-mono font-bold"
                            />
                            <span className="text-[#666]">às</span>
                            <input
                              type="time"
                              value={sched.closeTime}
                              onChange={(e) => {
                                const updated = [...weeklySchedule];
                                updated[idx] = { ...updated[idx], closeTime: e.target.value };
                                setWeeklySchedule(updated);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-xs font-mono font-bold"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de Salvar Alterações com Feedback */}
              <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                <p className="text-[11px] text-[#888]">
                  Todas as alterações entram em vigor imediatamente para todos os clientes online.
                </p>
                <button
                  type="button"
                  onClick={handleSaveStoreSettings}
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-[#FFA000]/20 flex items-center gap-1.5 transition-all"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Salvar Todas as Configurações</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL: NOVO PEDIDO MANUAL (BALCÃO OU DELIVERY)                            */}
      {/* ========================================================================= */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFA000]/15 text-[#FFA000] border border-[#FFA000]/30 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-brand font-black text-base text-white">Lançar Novo Pedido</h3>
                  <p className="text-xs text-[#888]">Crie um pedido rápido de balcão ou delivery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#222] text-[#888] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateNewOrderSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-grow text-xs">
              
              {/* Tipo de Pedido */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewOrderType('delivery')}
                  className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    newOrderType === 'delivery'
                      ? 'bg-[#1565C0] text-white ring-2 ring-blue-400'
                      : 'bg-[#1E1E1E] text-[#888] hover:text-white'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>🛵 Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewOrderType('pickup')}
                  className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    newOrderType === 'pickup'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : 'bg-[#1E1E1E] text-[#888] hover:text-white'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>🏬 Retirada Balcão</span>
                </button>
              </div>

              {/* Dados do Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#AAA] font-bold block mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#333] text-white focus:border-[#FFA000] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[#AAA] font-bold block mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="11999999999"
                    className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#333] text-white focus:border-[#FFA000] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Endereço (se delivery) */}
              {newOrderType === 'delivery' && (
                <div className="space-y-2 bg-[#1A1A1A] p-3 rounded-2xl border border-[#2B2B2B]">
                  <span className="text-[#FFA000] font-bold block">Endereço de Entrega</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Rua / Avenida"
                        value={newCustomerStreet}
                        onChange={(e) => setNewCustomerStreet(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#222] border border-[#333] text-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nº"
                        value={newCustomerNumber}
                        onChange={(e) => setNewCustomerNumber(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#222] border border-[#333] text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={newCustomerNeighborhood}
                      onChange={(e) => setNewCustomerNeighborhood(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#222] border border-[#333] text-white"
                    />
                    <input
                      type="text"
                      placeholder="Complemento / Apto"
                      value={newCustomerComplement}
                      onChange={(e) => setNewCustomerComplement(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#222] border border-[#333] text-white"
                    />
                  </div>
                </div>
              )}

              {/* Seleção de Itens do Cardápio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#AAA] font-bold">Adicionar Produtos ao Pedido</span>
                  <span className="text-[11px] text-[#FFA000] font-bold">
                    {selectedItemsForNewOrder.length} produto(s) selecionado(s)
                  </span>
                </div>

                {/* Itens já selecionados */}
                {selectedItemsForNewOrder.length > 0 && (
                  <div className="bg-[#181818] p-2.5 rounded-xl border border-[#2B2B2B] space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedItemsForNewOrder.map((it) => (
                      <div key={it.item.id} className="flex items-center justify-between py-1 border-b border-[#252525] last:border-0">
                        <span className="font-bold text-white truncate max-w-[200px]">
                          {it.item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromNewOrder(it.item.id)}
                            className="p-1 rounded-md bg-[#252525] hover:bg-red-900/60 text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-[#FFA000] min-w-4 text-center">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddItemToNewOrder(it.item)}
                            className="p-1 rounded-md bg-[#252525] hover:bg-[#FFA000] hover:text-black text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-white min-w-16 text-right">
                            R$ {(it.item.price * it.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Busca e Lista Rápida de Produtos */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Filtrar produtos do cardápio..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#1E1E1E] border border-[#333] text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1 border border-[#222] rounded-xl bg-[#111]">
                  {menuItems
                    .filter((m) => m.name.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                    .slice(0, 10)
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddItemToNewOrder(item)}
                        className="p-2 rounded-lg bg-[#181818] hover:bg-[#252525] border border-[#292929] text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div className="truncate pr-2">
                          <span className="font-medium text-white block truncate">{item.name}</span>
                          <span className="text-[10px] text-[#FFA000]">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <Plus className="w-4 h-4 text-[#888] group-hover:text-[#FFA000] shrink-0" />
                      </button>
                    ))}
                </div>
              </div>

              {/* Pagamento e Estágio Inicial */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[#AAA] font-bold block mb-1">Forma de Pagamento</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#333] text-white"
                  >
                    <option value="pix">PIX</option>
                    <option value="card">Cartão de Crédito/Débito</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#AAA] font-bold block mb-1">Status Inicial</label>
                  <select
                    value={newOrderInitialStatus}
                    onChange={(e) => setNewOrderInitialStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#333] text-white font-bold"
                  >
                    <option value="preparing">🔥 Em preparo (Cozinha)</option>
                    <option value="ready">✨ Pronto</option>
                    <option value="received">⏱️ Em análise</option>
                  </select>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-[#1F1F1F] p-3 rounded-2xl flex items-center justify-between font-brand font-black text-sm">
                <span>Total Estimado:</span>
                <span className="text-base text-[#FFA000]">
                  R$ {(calculateNewOrderSubtotal() + (newOrderType === 'delivery' ? parseFloat(storeFee) || 5 : 0)).toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-[#222] hover:bg-[#2A2A2A] text-white font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black cursor-pointer shadow-lg shadow-[#FFA000]/20"
                >
                  Confirmar e Lançar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUPORTE */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2B2B2B] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7A00]/15 text-[#FF7A00] flex items-center justify-center mx-auto">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-brand font-black text-lg text-white">Central de Suporte</h3>
              <p className="text-xs text-[#888] mt-1">Dúvidas operacionais ou suporte técnico direto via WhatsApp</p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.open(`https://wa.me/55${storePhone.replace(/\D/g, '')}`, '_blank');
                  setIsSupportModalOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-[#25D366] text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-[#22bf5b]"
              >
                <span>Chamar no WhatsApp Oficial</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#202020] text-[#AAA] hover:text-white text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAÇÕES DE PAPEL, LETRAS E IMPRESSÃO */}
      <PrinterSettingsModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        showToast={showToast}
      />

      {/* MODAL: ÁREA DE CUPONS & WHATSAPP COM IA (ACESSÍVEL PELOS 3 PONTINHOS DO TOPO ESQUERDO) */}
      <CouponManagerModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        showToast={showToast}
        promoGroupLink={storePromoLink}
        storePhone={storePhone}
      />

      {/* MODAL: EDITAR SOBRE A HAMBURGUERIA (ACESSÍVEL PELOS 3 PONTINHOS DO TOPO ESQUERDO) */}
      <AboutEditModal
        isOpen={isAboutEditModalOpen}
        onClose={() => setIsAboutEditModalOpen(false)}
        storeSettings={currentStoreSettings}
        onSave={handleSaveAboutSettings}
      />

    </div>
  );
};
