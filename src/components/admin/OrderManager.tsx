import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ChefHat, 
  Truck, 
  CheckCheck, 
  AlertCircle, 
  Search, 
  Printer, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  Columns,
  Flame,
  Bike,
  PackageCheck,
  Edit2,
  X,
  Check,
  Filter,
  CornerDownRight,
  Sliders,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Square,
  Music,
  Store,
  Flame as FlameIcon
} from 'lucide-react';
import { Order } from '../../types';
import { triggerPrintOrder } from '../../utils/printerSettings';
import { soundAlert } from '../../utils/soundAlert';
import { WhatsAppStatusModal } from './WhatsAppStatusModal';
import { EdilmaSoundModal } from './EdilmaSoundModal';

interface OrderManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  showToast: (msg: string) => void;
}

type TabType = 'preparing' | 'ready' | 'on_the_way' | 'received' | 'delivered' | 'all';

export const OrderManager: React.FC<OrderManagerProps> = ({
  orders,
  onUpdateOrderStatus,
  showToast,
}) => {
  // Primary active tab defaults to 'preparing' (Em preparo)
  const [activeTab, setActiveTab] = useState<TabType>('preparing');
  const [viewMode, setViewMode] = useState<'tabs' | 'kanban'>('tabs');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [soundActive, setSoundActive] = useState<boolean>(() => soundAlert.isEnabled());
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<Order | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const handleOpenWhatsAppModal = (order: Order) => {
    setWhatsAppModalOrder(order);
    setIsWhatsAppModalOpen(true);
  };

  // Track new orders to play sound: "EDILMA SAIU PEDIDO"
  const prevOrderCountRef = useRef<number>(orders.length);

  useEffect(() => {
    if (orders.length > prevOrderCountRef.current) {
      // Novo pedido recebido!
      soundAlert.speakAlert('EDILMA SAIU PEDIDO');
      showToast('🔊 EDILMA SAIU PEDIDO!');
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length, showToast]);

  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    soundAlert.setEnabled(next);
    if (!next) {
      soundAlert.stop();
      setIsSoundPlaying(false);
    }
    showToast(next ? 'Alerta "EDILMA SAIU PEDIDO" ativado!' : 'Alerta sonoro desativado.');
  };

  const handleTestVoice = () => {
    if (isSoundPlaying) {
      soundAlert.stop();
      setIsSoundPlaying(false);
      showToast('Áudio interrompido.');
      return;
    }

    setIsSoundPlaying(true);
    soundAlert.speakAlert();
    showToast('🔥🎶 Gritando: "EDIIIIIIIIIILMA SAIIIIIU PEDIDOOOOOOOI" (10s)!');
    
    // Desativa status visual após 10 segundos
    setTimeout(() => {
      setIsSoundPlaying(false);
    }, 10000);
  };

  // Anota AI banner settings stored in localStorage
  const [autoAccept, setAutoAccept] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aqf_auto_accept_orders');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [prepTimeBalcao, setPrepTimeBalcao] = useState<string>(() => {
    return localStorage.getItem('aqf_time_balcao') || '20 a 45 min';
  });

  const [prepTimeDelivery, setPrepTimeDelivery] = useState<string>(() => {
    return localStorage.getItem('aqf_time_delivery') || '30 a 50 min';
  });

  const [isEditingTimes, setIsEditingTimes] = useState(false);
  const [tempBalcao, setTempBalcao] = useState(prepTimeBalcao);
  const [tempDelivery, setTempDelivery] = useState(prepTimeDelivery);

  // Counters
  const countReceived = orders.filter((o) => o.status === 'received').length;
  const countPreparing = orders.filter((o) => o.status === 'preparing').length;
  const countReady = orders.filter((o) => o.status === 'ready').length;
  const countOnTheWay = orders.filter((o) => o.status === 'on_the_way').length;
  const countDelivered = orders.filter((o) => o.status === 'delivered').length;

  const handleToggleAutoAccept = () => {
    const nextVal = !autoAccept;
    setAutoAccept(nextVal);
    try {
      localStorage.setItem('aqf_auto_accept_orders', JSON.stringify(nextVal));
    } catch {}
    showToast(nextVal ? 'Pedidos configurados para aceitação automática!' : 'Modo de conferência manual de pedidos ativado.');
  };

  const handleSaveTimes = () => {
    setPrepTimeBalcao(tempBalcao);
    setPrepTimeDelivery(tempDelivery);
    try {
      localStorage.setItem('aqf_time_balcao', tempBalcao);
      localStorage.setItem('aqf_time_delivery', tempDelivery);
    } catch {}
    setIsEditingTimes(false);
    showToast('Tempos de preparo atualizados com sucesso!');
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Pedidos sincronizados com o servidor!');
    }, 600);
  };

  const handleStatusChange = (orderId: string, status: Order['status']) => {
    onUpdateOrderStatus(orderId, status);
    const label = 
      status === 'preparing' ? 'Em preparo' :
      status === 'ready' ? 'Pronto' :
      status === 'on_the_way' ? 'Saiu para entrega' :
      status === 'delivered' ? 'Entregue / Concluído' : 'Em análise';
    showToast(`Pedido movido para "${label}"!`);
  };

  const openWhatsAppCustomer = (order: Order) => {
    const clean = (order.customer?.phone || '').replace(/\D/g, '');
    if (!clean) return;

    let statusText = '';
    if (order.status === 'preparing') {
      statusText = 'está *EM PREPARO* na nossa chapa quente e logo ficará pronto! 🍔🔥';
    } else if (order.status === 'ready') {
      statusText = order.customer.deliveryMethod === 'delivery'
        ? 'está *PRONTO* e já está sendo embalado para o motoboy! 🛵✨'
        : 'está *PRONTO* e quentinho te esperando no balcão da loja para retirada! 🏬🎉';
    } else if (order.status === 'on_the_way') {
      statusText = 'já *SAIU PARA ENTREGA* com nosso entregador! Fique de olho no interfone/portão. 🛵💨';
    } else if (order.status === 'delivered') {
      statusText = 'foi marcado como *ENTREGUE*! Esperamos que você ame a refeição. Bom apetite! 😋❤️';
    } else {
      statusText = 'foi recebido e já está sendo confirmado pela cozinha!';
    }

    const msg = encodeURIComponent(
      `Olá ${order.customer?.name || 'Cliente'}! Aqui é do *AI QUE FOME*. 👋\n\nSeu pedido *#${order.orderNumber}* ${statusText}`
    );
    window.open(`https://wa.me/55${clean}?text=${msg}`, '_blank');
  };

  const handlePrintCupom = (order: Order) => {
    triggerPrintOrder(order);
  };

  const getStatusBadge = (status: Order['status'], deliveryMethod?: string) => {
    const isPickup = deliveryMethod === 'pickup';
    const isAdvanced = isPickup
      ? status === 'ready' || status === 'delivered'
      : status === 'on_the_way' || status === 'delivered';

    if (isAdvanced) {
      return isPickup ? (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Store className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pronto para retirada</span>
        </span>
      ) : (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-300">
          <Bike className="w-3.5 h-3.5 text-blue-600" />
          <span>Saiu para entrega</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-orange-100 text-[#E65100] border border-orange-300">
        <Flame className="w-3.5 h-3.5 text-[#E65100]" />
        <span>Em preparo</span>
      </span>
    );
  };

  // Filter orders
  const filterOrdersByStatus = (statusList: Order['status'] | 'all') => {
    return orders.filter((order) => {
      const matchesStatus = statusList === 'all' || order.status === statusList;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (order.customer?.name || '').toLowerCase().includes(q) ||
        (order.customer?.phone || '').includes(q) ||
        String(order.orderNumber).includes(q) ||
        order.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  };

  const currentTabOrders = filterOrdersByStatus(activeTab);

  // Render Order Card component em Fundo Branco de Alta Visibilidade
  const renderOrderCard = (order: Order) => {
    const customerName = order.customer?.name || 'Cliente';
    const customerPhone = order.customer?.phone || '';
    const payment = (order.customer?.paymentMethod || 'cartão').toUpperCase();
    const isPickup = order.customer?.deliveryMethod === 'pickup';

    return (
      <div
        key={order.id}
        className="bg-white border-2 border-black rounded-2xl p-4 sm:p-5 transition-all space-y-3.5 shadow-md hover:shadow-lg"
      >
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-[#FF7A00] text-black font-brand font-black flex items-center justify-center text-sm border-2 border-black shadow-xs">
              #{order.orderNumber || order.id.slice(-4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-brand font-black text-base text-zinc-900">
                  {customerName}
                </h3>
                <span className="text-[11px] text-zinc-500 font-bold font-mono">
                  {order.createdAt || 'Agora'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600 mt-0.5 font-medium">
                <span className="flex items-center gap-1 text-[#E65100] font-bold">
                  <Phone className="w-3.5 h-3.5" />
                  {customerPhone || 'Sem telefone'}
                </span>
                <span>•</span>
                <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                  {isPickup ? '🏬 Balcão' : '🛵 Delivery'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(order.status, order.customer?.deliveryMethod)}

            <button
              type="button"
              onClick={() => handlePrintCupom(order)}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-[#FF7A00] text-zinc-800 hover:text-black transition-colors cursor-pointer border-2 border-black"
              title="Imprimir comanda térmica"
            >
              <Printer className="w-4 h-4" />
            </button>

            {customerPhone && (
              <button
                type="button"
                onClick={() => handleOpenWhatsAppModal(order)}
                className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs border-2 border-black"
                title="Avisar cliente no WhatsApp (mensagem pronta deste status)"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* Items List com Fundo Claro e Texto Preto Nítido */}
        <div className="space-y-2 bg-zinc-50 p-3.5 rounded-xl border-2 border-zinc-200">
          {order.items.map((cartItem, idx) => (
            <div key={idx} className="flex justify-between items-start text-xs text-zinc-900 font-medium">
              <div className="space-y-0.5">
                <div className="font-black text-sm">
                  <span className="text-[#FF7A00] mr-1.5 bg-black px-1.5 py-0.2 rounded-md text-white font-black">
                    {cartItem.quantity}x
                  </span>
                  {cartItem.item.name}
                </div>
                {cartItem.selectedBread && (
                  <div className="text-[11px] text-zinc-600 pl-3 font-semibold">🥖 {cartItem.selectedBread}</div>
                )}
                {cartItem.selectedDoneness && (
                  <div className="text-[11px] text-zinc-600 pl-3 font-semibold">🥩 {cartItem.selectedDoneness}</div>
                )}
                {cartItem.selectedExtras && cartItem.selectedExtras.length > 0 && (
                  <div className="text-[11px] text-[#E65100] pl-3 font-black">
                    ➕ {cartItem.selectedExtras.map((e) => `${e.quantity > 1 ? `${e.quantity}x ` : ''}${e.name}`).join(', ')}
                  </div>
                )}
                {cartItem.selectedRemovals && cartItem.selectedRemovals.length > 0 && (
                  <div className="text-[11px] text-red-600 pl-3 font-bold line-through">
                    🚫 Sem: {cartItem.selectedRemovals.join(', ')}
                  </div>
                )}
                {cartItem.notes && (
                  <div className="text-[11px] italic text-zinc-700 pl-3 font-bold">
                    💬 Obs: "{cartItem.notes}"
                  </div>
                )}
              </div>
              <span className="font-black text-zinc-900 shrink-0 ml-2 text-sm">
                R$ {cartItem.totalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>

        {/* Delivery Address */}
        {!isPickup && order.customer?.address && (
          <div className="flex items-start gap-2 text-xs text-zinc-700 bg-orange-50/70 p-2.5 rounded-xl border border-orange-200 font-medium">
            <MapPin className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-900 font-bold">
                {order.customer.address.street}, {order.customer.address.number}
              </span>
              {order.customer.address.complement && ` (${order.customer.address.complement})`}
              {' — Bairro: '}<strong className="text-black">{order.customer.address.neighborhood}</strong>
              {order.customer.address.reference && (
                <div className="text-[11px] text-zinc-600">Ref: {order.customer.address.reference}</div>
              )}
            </div>
          </div>
        )}

        {/* Footer: Price & Status Pipeline Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2 text-xs text-zinc-700">
            <span>Pag: <strong className="text-zinc-900 font-black">{payment}</strong></span>
            <span>•</span>
            <span>Total: <strong className="text-[#FF7A00] font-brand font-black text-base">R$ {order.total.toFixed(2).replace('.', ',')}</strong></span>
          </div>

          {/* Quick Advancement Action - Regra 2: Status Simplificado */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isPickup ? (
              // RETIRADA: Em preparo -> Pronto para retirada
              order.status !== 'ready' && order.status !== 'delivered' ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange(order.id, 'ready')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-brand font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-2 border-black"
                >
                  <Store className="w-4 h-4" />
                  <span>Avançar: Pronto para retirada ➔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusChange(order.id, 'preparing')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer border border-zinc-300"
                >
                  <span>↺ Voltar para Em preparo</span>
                </button>
              )
            ) : (
              // ENTREGA: Em preparo -> Saiu para entrega
              order.status !== 'on_the_way' && order.status !== 'delivered' ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange(order.id, 'on_the_way')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-brand font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-2 border-black"
                >
                  <Bike className="w-4 h-4" />
                  <span>Avançar: Saiu para entrega ➔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusChange(order.id, 'preparing')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer border border-zinc-300"
                >
                  <span>↺ Voltar para Em preparo</span>
                </button>
              )
            )}
          </div>

            {/* Botão de Enviar Mensagem do Status no WhatsApp (Manual sob demanda) */}
            {customerPhone && (
              <button
                type="button"
                onClick={() => handleOpenWhatsAppModal(order)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#25D366] text-emerald-900 hover:text-white border-2 border-emerald-600 font-brand font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Abrir WhatsApp com a mensagem pronta desta etapa"
              >
                <Send className="w-3 h-3" />
                <span>
                  {order.status === 'received' || order.status === 'preparing'
                    ? 'Avisar: Em Preparo'
                    : order.status === 'ready'
                    ? 'Avisar: Pronto'
                    : order.status === 'on_the_way'
                    ? 'Avisar: Saiu p/ Entrega'
                    : 'Avisar: Entregue'}
                </span>
              </button>
            )}
          </div>
        </div>
    );
  };

  return (
    <div className="space-y-5 bg-white text-zinc-900 rounded-3xl p-4 sm:p-6 border-2 border-black shadow-xl">
      
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR: CONTROLES DE SOM, VISUALIZAÇÃO E ATUALIZAÇÃO             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b-2 border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-brand font-black text-2xl text-zinc-900">
              Meus Pedidos
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF7A00] text-black font-brand font-black text-xs">
              {orders.length} pedidos
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            Gerenciamento em tempo real com alertas de voz para novos pedidos
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão Testar Grito Cantado EDILMA SAIU PEDIDO (10s) */}
          <button
            type="button"
            onClick={handleTestVoice}
            className={`px-3.5 py-2 rounded-xl border-2 border-black font-brand font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isSoundPlaying
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-orange-100 hover:bg-[#FF7A00] text-black hover:scale-105'
            }`}
            title="Grito cantado de 10 segundos: EDIIIIIIIIIILMA SAIIIIIU PEDIDOOOOOOOI"
          >
            {isSoundPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white stroke-none" />
                <span>⏹️ Parar Grito (10s)</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#E65100]" />
                <span>🔥 Gritar: "EDILMA SAIU PEDIDO" (10s)</span>
              </>
            )}
          </button>

          {/* Botão Configurar Áudio / MP3 IA */}
          <button
            type="button"
            onClick={() => setIsSoundModalOpen(true)}
            className="px-2.5 py-2 rounded-xl border-2 border-black bg-white hover:bg-zinc-100 text-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Configurar áudio, letra cantada ou subir MP3 gerado por IA (Suno/Udio)"
          >
            <Music className="w-4 h-4 text-[#FF7A00]" />
            <span className="hidden sm:inline text-xs font-black">Música IA</span>
          </button>

          {/* Mudo / Ativar Som */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border-2 transition-colors cursor-pointer ${
              soundActive 
                ? 'bg-emerald-100 border-emerald-600 text-emerald-800' 
                : 'bg-zinc-100 border-zinc-300 text-zinc-500'
            }`}
            title={soundActive ? 'Voz ativada para novos pedidos' : 'Voz desativada'}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Alternar Abas / Kanban */}
          <div className="flex items-center bg-zinc-100 border-2 border-black rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'tabs' ? 'bg-[#FF7A00] text-black shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Abas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'kanban' ? 'bg-[#FF7A00] text-black shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 rounded-xl border-2 border-black bg-zinc-100 hover:bg-zinc-200 text-black cursor-pointer"
            title="Atualizar pedidos"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#FF7A00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 BOTÕES DE ETAPAS (Análise, Produção, Pronto, Entrega)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Em Análise */}
        <button
          type="button"
          onClick={() => setActiveTab('received')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-brand font-black text-xs sm:text-sm transition-all cursor-pointer border-2 border-black shadow-sm ${
            activeTab === 'received'
              ? 'bg-zinc-800 text-white ring-2 ring-[#FF7A00]'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <span>Análise</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-600 text-white">
            {countReceived}
          </span>
        </button>

        {/* Produção / Em preparo */}
        <button
          type="button"
          onClick={() => setActiveTab('preparing')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-brand font-black text-xs sm:text-sm transition-all cursor-pointer border-2 border-black shadow-sm ${
            activeTab === 'preparing'
              ? 'bg-[#FF7A00] text-black ring-2 ring-black font-black'
              : 'bg-orange-100 text-zinc-800 hover:bg-orange-200'
          }`}
        >
          <span>Produção</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-black text-[#FF7A00]">
            {countPreparing}
          </span>
        </button>

        {/* Pronto */}
        <button
          type="button"
          onClick={() => setActiveTab('ready')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-brand font-black text-xs sm:text-sm transition-all cursor-pointer border-2 border-black shadow-sm ${
            activeTab === 'ready'
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
              : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
          }`}
        >
          <span>Pronto</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-900 text-white">
            {countReady}
          </span>
        </button>

        {/* Saiu p/ entrega */}
        <button
          type="button"
          onClick={() => setActiveTab('on_the_way')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-brand font-black text-xs sm:text-sm transition-all cursor-pointer border-2 border-black shadow-sm ${
            activeTab === 'on_the_way'
              ? 'bg-blue-600 text-white ring-2 ring-blue-400'
              : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
          }`}
        >
          <span>Entrega</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-900 text-white">
            {countOnTheWay}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* BANNER DE TEMPO DE PREPARO E AUTO-ACEITAÇÃO (ESTILO ANOTA AI)             */}
      {/* ========================================================================= */}
      {viewMode === 'tabs' && (
        <div className="rounded-2xl overflow-hidden border-2 border-black shadow-sm bg-white">
          <div className="bg-zinc-900 px-4 py-2.5 flex items-center justify-between text-white font-brand font-black">
            <span className="text-xs sm:text-sm uppercase tracking-wider">
              {activeTab === 'received' && 'Pedidos em Análise'}
              {activeTab === 'preparing' && 'Em preparo / Produção'}
              {activeTab === 'ready' && 'Pronto para entrega ou retirada'}
              {activeTab === 'on_the_way' && 'Saiu para entrega com Motoboy'}
              {activeTab === 'delivered' && 'Finalizados / Entregues'}
              {activeTab === 'all' && 'Todos os Pedidos'}
            </span>
            <span className="text-sm font-black px-2.5 py-0.5 rounded-md bg-[#FF7A00] text-black">
              {currentTabOrders.length}
            </span>
          </div>

          <div className="p-3.5 sm:p-4 bg-zinc-50 border-t border-zinc-200 space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm flex-wrap gap-2">
              <div className="flex items-center gap-3 font-semibold text-zinc-900 flex-wrap">
                <div>
                  <span className="font-normal text-zinc-600">Tempo Balcão: </span>
                  <strong className="text-black font-black">{prepTimeBalcao}</strong>
                </div>
                <div>
                  <span className="font-normal text-zinc-600">Tempo Delivery: </span>
                  <strong className="text-black font-black">{prepTimeDelivery}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingTimes(!isEditingTimes)}
                  className="text-zinc-900 hover:text-[#FF7A00] font-black text-xs underline cursor-pointer"
                >
                  {isEditingTimes ? 'Fechar edição' : 'Editar tempos'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleAutoAccept}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    autoAccept 
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black' 
                      : 'bg-zinc-200 text-zinc-700 border-zinc-300'
                  }`}
                >
                  {autoAccept ? '✓ Aceitação Automática' : 'Conferência Manual'}
                </button>
              </div>
            </div>

            {/* Inputs de edição de tempo se aberto */}
            {isEditingTimes && (
              <div className="p-3 bg-white border border-zinc-300 rounded-xl space-y-2 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                      Tempo estimado para Balcão:
                    </label>
                    <input
                      type="text"
                      value={tempBalcao}
                      onChange={(e) => setTempBalcao(e.target.value)}
                      placeholder="Ex: 20 a 40 min"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 text-xs text-zinc-900 font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                      Tempo estimado para Delivery:
                    </label>
                    <input
                      type="text"
                      value={tempDelivery}
                      onChange={(e) => setTempDelivery(e.target.value)}
                      placeholder="Ex: 30 a 50 min"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 text-xs text-zinc-900 font-bold bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingTimes(false)}
                    className="px-3 py-1 text-xs text-zinc-600 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTimes}
                    className="px-4 py-1 rounded-lg bg-[#FF7A00] text-black font-brand font-black text-xs border border-black cursor-pointer shadow-xs"
                  >
                    Salvar Tempos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barra de Busca rápida */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar pedidos por cliente, número (#) ou telefone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 border-2 border-black text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-[#FF7A00] font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-black cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODO KANBAN: 3 COLUNAS LADO A LADO                                        */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Coluna 1: Em preparo */}
          <div className="space-y-3 bg-zinc-50 p-3.5 rounded-2xl border-2 border-black">
            <div className="p-3 rounded-xl bg-[#FF7A00] text-black font-brand font-black flex items-center justify-between border-2 border-black shadow-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                <span>Em preparo</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-black text-white text-xs font-black">
                {countPreparing}
              </span>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {filterOrdersByStatus('preparing').length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-300 rounded-xl bg-white">
                  Nenhum pedido em preparo no momento.
                </div>
              ) : (
                filterOrdersByStatus('preparing').map(renderOrderCard)
              )}
            </div>
          </div>

          {/* Coluna 2: Pronto */}
          <div className="space-y-3 bg-zinc-50 p-3.5 rounded-2xl border-2 border-black">
            <div className="p-3 rounded-xl bg-emerald-600 text-white font-brand font-black flex items-center justify-between border-2 border-black shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Pronto</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-black text-white text-xs font-black">
                {countReady}
              </span>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {filterOrdersByStatus('ready').length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-300 rounded-xl bg-white">
                  Nenhum pedido pronto no momento.
                </div>
              ) : (
                filterOrdersByStatus('ready').map(renderOrderCard)
              )}
            </div>
          </div>

          {/* Coluna 3: Saiu para entrega */}
          <div className="space-y-3 bg-zinc-50 p-3.5 rounded-2xl border-2 border-black">
            <div className="p-3 rounded-xl bg-blue-600 text-white font-brand font-black flex items-center justify-between border-2 border-black shadow-xs">
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4" />
                <span>Saiu para entrega</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-black text-white text-xs font-black">
                {countOnTheWay}
              </span>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {filterOrdersByStatus('on_the_way').length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-300 rounded-xl bg-white">
                  Nenhum pedido em rota de entrega.
                </div>
              ) : (
                filterOrdersByStatus('on_the_way').map(renderOrderCard)
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODO TAB: LISTA DE PEDIDOS DA ABA ATIVA                                   */
        /* ========================================================================= */
        <div className="space-y-3.5">
          {currentTabOrders.length === 0 ? (
            <div className="py-16 px-4 text-center bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-3xl space-y-3">
              <div className="flex flex-col items-center justify-center text-zinc-500">
                <CornerDownRight className="w-8 h-8 rotate-45 text-[#FF7A00] stroke-[2] mb-2" />
                <p className="text-sm font-bold text-zinc-800">
                  {autoAccept 
                    ? 'Nenhum pedido pendente nesta etapa no momento'
                    : 'Nenhum pedido nesta etapa no momento'}
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Novos pedidos do cardápio online ou inseridos pelo botão <strong className="text-black font-black">"Novo pedido"</strong> aparecerão aqui e dispararão o alerta de voz!
                </p>
              </div>

              {/* Troca rápida de etapa se houver pedidos */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {countPreparing > 0 && activeTab !== 'preparing' && (
                  <button
                    onClick={() => setActiveTab('preparing')}
                    className="px-3 py-1.5 rounded-xl bg-[#FF7A00] text-black text-xs font-black border border-black cursor-pointer shadow-xs"
                  >
                    Ver Produção ({countPreparing})
                  </button>
                )}
                {countReady > 0 && activeTab !== 'ready' && (
                  <button
                    onClick={() => setActiveTab('ready')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black border border-black cursor-pointer shadow-xs"
                  >
                    Ver Prontos ({countReady})
                  </button>
                )}
                {countOnTheWay > 0 && activeTab !== 'on_the_way' && (
                  <button
                    onClick={() => setActiveTab('on_the_way')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black border border-black cursor-pointer shadow-xs"
                  >
                    Ver Entrega ({countOnTheWay})
                  </button>
                )}
              </div>
            </div>
          ) : (
            currentTabOrders.map(renderOrderCard)
          )}
        </div>
      )}

      {/* Modal de Mensagens Prontas de WhatsApp por Status (Disparo Manual) */}
      <WhatsAppStatusModal
        order={whatsAppModalOrder}
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        showToast={showToast}
      />

      {/* Modal de Áudio e Música IA da Edilma */}
      <EdilmaSoundModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
        showToast={showToast}
      />

    </div>
  );
};
