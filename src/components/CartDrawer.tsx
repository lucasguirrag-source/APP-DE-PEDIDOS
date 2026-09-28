import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, Tag, ShoppingBag, Sparkles } from 'lucide-react';
import { CartItem } from '../types';
import { STORE_INFO } from '../data/menuData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  appliedCoupon: string | null;
  onApplyCoupon: (code: string) => { success: boolean; message: string };
  onRemoveCoupon: () => void;
  discountAmount: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  discountAmount,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const isFreeDelivery = (STORE_INFO.freeDeliveryThreshold ?? 0) > 0 && subtotal >= STORE_INFO.freeDeliveryThreshold;
  const deliveryFee = items.length === 0 ? 0 : (isFreeDelivery ? 0 : STORE_INFO.deliveryFee);
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const res = onApplyCoupon(couponInput.trim());
    setCouponMessage({
      text: res.message,
      isError: !res.success,
    });

    if (res.success) {
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0F0F0F] text-white h-full shadow-2xl flex flex-col justify-between border-l border-[#242424] animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 bg-black text-white flex items-center justify-between shrink-0 border-b border-[#222222]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-[#FFA000]" />
            <div>
              <h2 className="font-brand text-xl text-white">Sua Sacola</h2>
              <span className="text-xs text-[#A3A3A3]">
                {items.length} {items.length === 1 ? 'item adicionado' : 'itens adicionados'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar Sacola"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-[#1A1A1A] border border-[#2B2B2B] flex items-center justify-center text-[#FFA000]">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-brand text-lg text-white">Sua sacola está vazia</h3>
                <p className="text-xs text-[#888888] max-w-xs">
                  Ai que fome! Que tal escolher um dos nossos smash burgers crocantes agora mesmo?
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-[#FFA000] text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#FFB300] transition-colors cursor-pointer shadow-md shadow-[#FFA000]/20"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            <>
              {/* Delivery Free Progress Bar */}
              <div className="bg-[#171717] p-3.5 rounded-2xl border border-[#2A2A2A]">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-1.5">
                  {isFreeDelivery ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Parabéns! Você ganhou Entrega Grátis!
                    </span>
                  ) : (
                    <span className="text-[#D4D4D4]">
                      Faltam R$ {(STORE_INFO.freeDeliveryThreshold - subtotal).toFixed(2).replace('.', ',')} para Entrega Grátis
                    </span>
                  )}
                  <span className="text-[#FFA000]">R$ {STORE_INFO.freeDeliveryThreshold.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="w-full bg-[#262626] h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${isFreeDelivery ? 'bg-emerald-500' : 'bg-[#FFA000]'}`}
                    style={{ width: `${Math.min(100, (subtotal / STORE_INFO.freeDeliveryThreshold) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Items */}
              {items.map((cartItem) => (
                <div
                  key={cartItem.cartItemId}
                  className="bg-[#141414] p-4 rounded-2xl border border-[#242424] space-y-3"
                >
                  <div className="flex gap-3">
                    <img
                      src={cartItem.item.image}
                      alt={cartItem.item.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#2A2A2A]"
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-brand text-xs sm:text-sm text-white font-bold truncate">
                          {cartItem.item.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(cartItem.cartItemId)}
                          className="text-[#666666] hover:text-red-400 transition-colors p-1 cursor-pointer"
                          aria-label="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-[#FFA000] font-bold font-brand mt-0.5">
                        R$ {cartItem.unitPrice.toFixed(2).replace('.', ',')} cada
                      </div>

                      {/* Customizations summary */}
                      <div className="text-[11px] text-[#888888] space-y-0.5 mt-1">
                        {cartItem.selectedExtras.length > 0 && (
                          <div className="text-[#E0E0E0]">
                            + {cartItem.selectedExtras.map((e) => `${e.quantity > 1 ? `${e.quantity}x ` : ''}${e.name}`).join(', ')}
                          </div>
                        )}
                        {cartItem.selectedRemovals.length > 0 && (
                          <div className="text-red-400">Sem: {cartItem.selectedRemovals.join(', ')}</div>
                        )}
                        {cartItem.notes && (
                          <div className="italic text-[#777777] truncate">Obs: &ldquo;{cartItem.notes}&rdquo;</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Line Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#222222]">
                    <div className="flex items-center bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(cartItem.cartItemId, cartItem.quantity - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#D4D4D4] hover:bg-[#282828] transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-white font-brand">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#D4D4D4] hover:bg-[#282828] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-brand font-black text-sm text-white">
                      R$ {cartItem.totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              ))}

              {/* Coupon input */}
              <div className="pt-2">
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Tag className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Cupom de desconto"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#2A2A2A] bg-[#141414] text-xs font-bold text-white uppercase placeholder-[#666666] focus:outline-hidden focus:border-[#FFA000]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#222222] hover:bg-[#2C2C2C] text-white border border-[#333333] hover:border-[#FFA000] rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Aplicar
                    </button>
                  </div>

                  {couponMessage && (
                    <div className={`text-[11px] font-semibold ${couponMessage.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                      {couponMessage.text}
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 px-3 py-1.5 rounded-xl text-xs">
                      <span>Cupom <b>{appliedCoupon}</b> aplicado</span>
                      <button
                        type="button"
                        onClick={onRemoveCoupon}
                        className="text-emerald-400 hover:text-emerald-200 underline font-bold cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 sm:p-6 bg-black border-t border-[#222222] space-y-4 shrink-0">
            <div className="space-y-1.5 text-xs text-[#A3A3A3]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-white">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Entrega</span>
                <span className="font-bold text-white">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-400 font-bold">Grátis</span>
                  ) : (
                    `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`
                  )}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#FFA000] font-bold">
                  <span>Desconto ({appliedCoupon})</span>
                  <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-brand font-black text-white pt-2 border-t border-[#222222]">
                <span>Total</span>
                <span className="text-[#FFA000]">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-4 bg-[#FFA000] hover:bg-[#FFB300] text-black rounded-2xl font-brand font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#FFA000]/20 hover:scale-101 active:scale-99 transition-all cursor-pointer"
            >
              <span>Finalizar Pedido</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
