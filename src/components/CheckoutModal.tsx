import React, { useState } from 'react';
import { 
  X, 
  Send, 
  CreditCard, 
  Banknote, 
  MapPin, 
  Bike, 
  Store, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  Tag, 
  Ban,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { CartItem, CustomerData, Order } from '../types';
import { getDeliveryLocations, DeliveryLocation } from '../data/deliveryLocations';
import { getNextOrderNumber } from '../utils/orderNumberGenerator';
import { soundAlert } from '../utils/soundAlert';
import { normalizeWhatsAppNumber } from '../utils/storeSettings';
import { recordCustomerOrder, saveCustomerPhone } from '../utils/repeatOrder';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  appliedCoupon: string | null;
  onOrderSuccess: (order: Order) => void;
  storePhone?: string;
  promoGroupLink?: string;
  discountPercent?: number;
  isStoreOpen?: boolean;
  storeClosedReason?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  deliveryFee: initialDeliveryFee,
  discountAmount,
  total,
  appliedCoupon,
  onOrderSuccess,
  storePhone = '5574999999999',
  promoGroupLink = '',
  discountPercent = 0,
  isStoreOpen = true,
  storeClosedReason = '',
}) => {
  const [deliveryLocations] = useState<DeliveryLocation[]>(() => getDeliveryLocations());
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    const locations = getDeliveryLocations();
    return locations.length > 0 ? locations[0].id : '';
  });
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('aqf_customer_name') || '';
    } catch {
      return '';
    }
  });
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem('aqf_customer_phone') || '';
    } catch {
      return '';
    }
  });
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [cashChangeFor, setCashChangeFor] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calcula taxa de entrega com base no bairro selecionado
  const selectedLocation = deliveryLocations.find((l) => l.id === selectedLocationId);
  const activeDeliveryFee = deliveryMethod === 'delivery' 
    ? (selectedLocation ? selectedLocation.fee : initialDeliveryFee)
    : 0;

  // Desconto percentual configurado pelo administrador (ex: 5%, 8%, 10%, ou 0%)
  const activeDiscountPercent = typeof discountPercent === 'number'
    ? discountPercent
    : (parseFloat(String(discountPercent)) || 0);
  const percentDiscountVal = activeDiscountPercent > 0 ? (subtotal * activeDiscountPercent) / 100 : 0;
  const effectiveDiscount = Math.max(discountAmount, percentDiscountVal);
  const currentGrandTotal = Math.max(0, subtotal + activeDeliveryFee - effectiveDiscount);

  const getEffectiveNeighborhood = () => {
    if (selectedLocation?.neighborhood.includes('Outro')) {
      return customNeighborhood.trim() || 'Outro Bairro (A consultar)';
    }
    return selectedLocation ? selectedLocation.neighborhood : 'Centro';
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Validar se loja está aberta (Item 12)
    if (!isStoreOpen) {
      errors.push('A loja está FECHADA no momento e não está aceitando novos pedidos.');
      setFormErrors(errors);
      return false;
    }

    if (!name.trim()) errors.push('Por favor, informe seu nome.');
    if (!phone.trim() || phone.trim().length < 8) errors.push('Por favor, informe um WhatsApp válido com DDD.');
    
    if (deliveryMethod === 'delivery') {
      if (!street.trim()) errors.push('Informe a rua ou avenida de entrega.');
      if (!number.trim()) errors.push('Informe o número do endereço.');
      if (selectedLocation?.neighborhood.includes('Outro') && !customNeighborhood.trim()) {
        errors.push('Por favor, digite o nome do seu bairro.');
      }
    }

    if (paymentMethod === 'cash' && cashChangeFor) {
      const changeNum = parseFloat(cashChangeFor.replace(',', '.'));
      if (isNaN(changeNum) || changeNum < currentGrandTotal) {
        errors.push(`O valor do troco deve ser maior que o total (R$ ${currentGrandTotal.toFixed(2).replace('.', ',')}).`);
      }
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleFinalizarPedido = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    // Número de pedido progressivo
    const orderNumber = getNextOrderNumber();
    const effectiveNeighborhood = getEffectiveNeighborhood();

    const customer: CustomerData = {
      name: name.trim(),
      phone: phone.trim(),
      deliveryMethod,
      address: {
        street: street.trim(),
        number: number.trim(),
        neighborhood: effectiveNeighborhood,
        complement: complement.trim(),
        reference: reference.trim(),
      },
      paymentMethod: paymentMethod as any,
      cashChangeFor: cashChangeFor.trim() || undefined,
      notes: orderNotes.trim(),
    };

    // Item 2: Status simplificado inicia como 'preparing' (Em preparo)
    const newOrder: Order = {
      id: `AQF-${Date.now()}`,
      orderNumber,
      items,
      customer,
      subtotal,
      deliveryFee: activeDeliveryFee,
      discount: effectiveDiscount,
      total: currentGrandTotal,
      couponCode: discountPercent > 0 ? `${discountPercent}% OFF` : (appliedCoupon || undefined),
      status: 'preparing',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      estimatedDeliveryTime: selectedLocation?.estimatedTime || '30 - 45 min',
    };

    // Backend order validation and persistence
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.error) {
          setFormErrors([data.error]);
          setIsSubmitting(false);
          return;
        }
      }
    } catch {
      // Offline / dev fallback
    }

    // Mensagem Automática do WhatsApp com os dados solicitados
    let message = `*NOVO PEDIDO - AI QUE FOME*\n`;
    message += `*Pedido:* #${orderNumber}\n\n`;

    message += `*Nome:* ${customer.name}\n`;
    message += `*Telefone:* ${customer.phone}\n`;
    if (deliveryMethod === 'delivery') {
      message += `*Endereço:* ${customer.address.street}, Nº ${customer.address.number} - Bairro: ${customer.address.neighborhood}`;
      if (customer.address.complement) message += ` (${customer.address.complement})`;
      if (customer.address.reference) message += ` | Ref: ${customer.address.reference}`;
      message += `\n\n`;
    } else {
      message += `*Retirada:* Retirada no Balcão\n\n`;
    }

    message += `*Itens do Pedido:*\n`;
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.quantity}x ${item.item.name} - R$ ${item.totalPrice.toFixed(2).replace('.', ',')}\n`;
      if (item.selectedBread) message += `   • Pão: ${item.selectedBread}\n`;
      if (item.selectedDoneness) message += `   • Ponto: ${item.selectedDoneness}\n`;
      if (item.selectedExtras.length > 0) {
        message += `   • Adicionais: ${item.selectedExtras.map((e) => `${e.quantity > 1 ? `${e.quantity}x ` : ''}${e.name}`).join(', ')}\n`;
      }
      if (item.selectedRemovals.length > 0) {
        message += `   • Sem: ${item.selectedRemovals.join(', ')}\n`;
      }
      if (item.notes) message += `   • Obs: "${item.notes}"\n`;
    });
    message += `\n`;

    message += `*Valor do Pedido:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    if (deliveryMethod === 'delivery') {
      message += `*Taxa de Entrega:* R$ ${activeDeliveryFee.toFixed(2).replace('.', ',')} (${effectiveNeighborhood})\n`;
    }
    message += `*Valor do Desconto:* ${effectiveDiscount > 0 ? `R$ ${effectiveDiscount.toFixed(2).replace('.', ',')}` : 'R$ 0,00'}\n`;
    message += `*Total a Pagar:* R$ ${currentGrandTotal.toFixed(2).replace('.', ',')}\n\n`;

    message += `*Forma de Pagamento:* ${paymentMethod === 'card' ? 'Cartão na Entrega (Levar maquininha)' : `Dinheiro ${cashChangeFor ? `(Troco para R$ ${cashChangeFor})` : '(Sem troco)'}`}\n`;
    if (orderNotes.trim()) {
      message += `*Observações:* ${orderNotes.trim()}\n`;
    }

    // Toca o alerta sonoro: "EDILMA SAIU PEDIDO"
    soundAlert.speakAlert('EDILMA SAIU PEDIDO');

    // Abre imediatamente o WhatsApp com a mensagem pronta usando o telefone configurado
    const cleanPhone = normalizeWhatsAppNumber(storePhone || '5574999999999');
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    const whatsappWaMeUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    // Grava o pedido no histórico exclusivo do cliente para alimentar o "Peça de novo"
    recordCustomerOrder(newOrder);

    // Envia o pedido no sistema e fecha o modal de checkout (abre a tela de pedido em produção)
    onOrderSuccess(newOrder);
    setIsSubmitting(false);
    onClose();

    // Redireciona imediatamente direto para o WhatsApp
    try {
      const opened = window.open(whatsappUrl, '_blank');
      if (!opened) {
        window.location.href = whatsappUrl;
      }
    } catch {
      window.location.href = whatsappWaMeUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-[#121212] text-white rounded-3xl border border-[#2B2B2B] shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Checkout com design escuro artesanal da hamburgueria */}
        <div className="p-4 sm:p-5 bg-[#0E0E0E] border-b border-[#222222] text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-brand text-lg text-white font-black">
              Finalizar Pedido
            </h2>
            <p className="text-xs text-[#A3A3A3]">
              AI QUE FOME · Capim Grosso - BA
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA: LOJA FECHADA */}
        {!isStoreOpen && (
          <div className="bg-red-950/80 border-b border-red-500/50 text-white p-3 sm:p-4 flex items-center gap-3 shrink-0">
            <Ban className="w-5 h-5 shrink-0 text-red-400" />
            <div className="text-xs font-bold leading-tight">
              <span className="block font-black uppercase tracking-wider text-sm text-red-400">LOJA FECHADA</span>
              <span>{storeClosedReason || 'No momento a loja não está aceitando novos pedidos. Volte mais tarde!'}</span>
            </div>
          </div>
        )}

        {/* BANNER: DESCONTO PERCENTUAL */}
        {discountPercent > 0 && (
          <div className="bg-[#FFA000]/15 border-b border-[#FFA000]/30 px-4 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#FFA000] font-bold">
              <Tag className="w-4 h-4 text-[#FFA000]" />
              <span>Desconto Especial de {discountPercent}% OFF aplicado ao seu pedido!</span>
            </div>
            <span className="font-black text-black bg-[#FFA000] px-2 py-0.5 rounded-full text-[11px]">
              - R$ {percentDiscountVal.toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        {/* Formulário com rolagem interna */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-grow text-xs bg-[#121212]">
          
          {/* Mensagens de Erro */}
          {formErrors.length > 0 && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Por favor, verifique os campos abaixo:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                {formErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 1. Modalidade: Entrega ou Retirada */}
          <div className="space-y-2">
            <label className="font-brand text-xs uppercase tracking-wider text-white font-black block">
              Como deseja receber seu lanche?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border font-brand font-black text-xs transition-all cursor-pointer ${
                  deliveryMethod === 'delivery'
                    ? 'bg-[#FFA000] text-black border-[#FFA000] shadow-md shadow-[#FFA000]/25'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-zinc-400 hover:text-white hover:border-[#444]'
                }`}
              >
                <Bike className="w-4 h-4 shrink-0" />
                <span>Entrega</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border font-brand font-black text-xs transition-all cursor-pointer ${
                  deliveryMethod === 'pickup'
                    ? 'bg-[#FFA000] text-black border-[#FFA000] shadow-md shadow-[#FFA000]/25'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-zinc-400 hover:text-white hover:border-[#444]'
                }`}
              >
                <Store className="w-4 h-4 shrink-0" />
                <span>Retirada no Balcão</span>
              </button>
            </div>
          </div>

          {/* 2. Dados do Cliente */}
          <div className="space-y-3 pt-2">
            <label className="font-brand text-xs uppercase tracking-wider text-white font-black block">
              Seus Dados
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Lucas Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] text-xs font-semibold text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Seu WhatsApp (com DDD) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 74999998888"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] text-xs font-semibold text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000]"
                />
              </div>
            </div>
          </div>

          {/* 3. Endereço (somente se delivery) */}
          {deliveryMethod === 'delivery' && (
            <div className="space-y-3 pt-2">
              <label className="font-brand text-xs uppercase tracking-wider text-white font-black block">
                Endereço de Entrega em Capim Grosso
              </label>

              {/* Bairro com Taxa */}
              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Selecione o Bairro / Região *
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] text-xs font-bold text-white focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000] cursor-pointer"
                >
                  {deliveryLocations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-[#1A1A1A] text-white">
                      {loc.neighborhood} — Taxa: R$ {loc.fee.toFixed(2).replace('.', ',')} ({loc.estimatedTime})
                    </option>
                  ))}
                </select>
              </div>

              {selectedLocation?.neighborhood.includes('Outro') && (
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Qual o seu Bairro / Localidade? *
                  </label>
                  <input
                    type="text"
                    required
                    value={customNeighborhood}
                    onChange={(e) => setCustomNeighborhood(e.target.value)}
                    placeholder="Digite o nome do seu bairro"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] text-xs font-semibold text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000]"
                  />
                </div>
              )}

              {/* Rua e Número */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ex: Av. ACM, Rua da Matriz..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] text-xs font-semibold text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Nº ou S/N"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] text-xs font-semibold text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000]"
                  />
                </div>
              </div>

              {/* Complemento e Referência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Complemento (Apto, Bloco, Casa)
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] text-xs font-medium text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ex: Em frente à farmácia..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] text-xs font-medium text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Forma de Pagamento */}
          <div className="space-y-2 pt-2 border-t border-[#222222]">
            <label className="font-brand text-xs uppercase tracking-wider text-white font-black block">
              Forma de Pagamento (Paga na Entrega ou Retirada)
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-3 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-[#FFA000] text-black border-[#FFA000] font-black shadow-md shadow-[#FFA000]/25'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-zinc-400 hover:text-white hover:border-[#444]'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Cartão / PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-[#FFA000] text-black border-[#FFA000] font-black shadow-md shadow-[#FFA000]/25'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-zinc-400 hover:text-white hover:border-[#444]'
                }`}
              >
                <Banknote className="w-4 h-4 shrink-0" />
                <span>Dinheiro Vivo</span>
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="p-3 bg-[#181818] rounded-2xl border border-[#2E2E2E] space-y-1.5 mt-2">
                <label className="text-xs font-bold text-white block">
                  Precisa de troco para quanto?
                </label>
                <input
                  type="text"
                  value={cashChangeFor}
                  onChange={(e) => setCashChangeFor(e.target.value)}
                  placeholder="Ex: 50,00 ou 100,00 (ou deixe em branco se não precisar)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2E2E2E] bg-[#121212] text-xs font-bold text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000]"
                />
              </div>
            )}
          </div>

          {/* 5. Observações Gerais */}
          <div className="space-y-1.5 pt-2 border-t border-[#222222]">
            <label className="font-brand text-xs uppercase tracking-wider text-white font-black block">
              Observações Gerais do Pedido
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Ex: Enviar guardanapos extras, maionese à parte..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] text-xs font-medium text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#FFA000] focus:ring-1 focus:ring-[#FFA000] resize-none"
            />
          </div>

        </div>

        {/* Rodapé Fixo com Botão "Finalizar Pedido" */}
        <div className="p-4 sm:p-5 bg-[#0E0E0E] border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold text-zinc-400 block">Total a Pagar</span>
            <span className="font-brand font-black text-2xl text-[#FFA000]">
              R$ {currentGrandTotal.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-[11px] text-zinc-400 block">
              {deliveryMethod === 'delivery' ? `Taxa de R$ ${activeDeliveryFee.toFixed(2).replace('.', ',')}` : 'Retirada no Balcão (Sem taxa)'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinalizarPedido}
            disabled={!isStoreOpen || isSubmitting}
            className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-brand font-black text-sm tracking-wide shadow-lg transition-all ${
              !isStoreOpen
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed border border-zinc-600'
                : 'bg-[#FFA000] hover:bg-[#FFB300] text-black shadow-[#FFA000]/25 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
          >
            <Send className="w-4 h-4 text-black" />
            <span>
              {!isStoreOpen 
                ? 'Loja Fechada no Momento' 
                : isSubmitting 
                ? 'Enviando Pedido...' 
                : 'Finalizar Pedido'
              }
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
