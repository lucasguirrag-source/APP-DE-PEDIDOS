import React from 'react';
import { X, Clock, Bike, MapPin, Store, CreditCard, Phone, Instagram, Flame, Gift } from 'lucide-react';
import { StoreSettings } from '../types';
import { FomeLogo } from './FomeLogo';

interface DeliveryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings?: StoreSettings;
  isOpenStatus?: { isOpen: boolean; reason: string };
}

export const DeliveryInfoModal: React.FC<DeliveryInfoModalProps> = ({ 
  isOpen, 
  onClose,
  storeSettings,
  isOpenStatus,
}) => {
  if (!isOpen) return null;

  const phone = storeSettings?.phone || '5574999999999';
  const cleanPhone = phone.replace(/\D/g, '');
  const phoneDisplay = storeSettings?.phoneDisplay || '(74) 99999-9999';
  const address = storeSettings?.address || 'Av. Senhor dos Passos, 280 - Centro, Capim Grosso - BA';
  const fee = storeSettings?.deliveryFee || 6.0;
  const freeThreshold = storeSettings?.freeDeliveryThreshold || 70.0;
  const isStoreOpen = isOpenStatus?.isOpen ?? !storeSettings?.isManuallyClosed;
  const promoLink = storeSettings?.promoGroupLink;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#121212] text-white rounded-3xl border border-[#2B2B2B] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-black text-white flex items-center justify-between shrink-0 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <FomeLogo size="sm" variant="cheddar" />
            <div>
              <h2 className="font-brand text-base sm:text-lg text-white">AI QUE FOME</h2>
              <p className="text-[11px] text-[#A3A3A3]">Hamburgueria Artesanal em Capim Grosso - BA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs text-[#D4D4D4] bg-[#121212]">
          
          {/* Status Atual */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isStoreOpen 
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
              : 'bg-red-950/40 border-red-500/50 text-red-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <div>
                <strong className="block font-brand font-black text-sm">
                  {isStoreOpen ? 'LOJA ABERTA AGORA' : 'LOJA FECHADA NO MOMENTO'}
                </strong>
                <span className="text-[11px] opacity-80">
                  {isOpenStatus?.reason || (isStoreOpen ? 'Recebendo pedidos normalmente' : 'Não estamos aceitando pedidos agora')}
                </span>
              </div>
            </div>
          </div>

          {/* Sobre Nós */}
          <div className="bg-[#181818] p-4 rounded-2xl border border-[#262626] space-y-2">
            <span className="font-brand text-xs uppercase tracking-wider text-[#FFA000] font-black block">
              Sobre a Hamburgueria
            </span>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              {storeSettings?.aboutText || 'Smash burgers autênticos com crostinha crocante na chapa de aço, queijo cheddar artesanal derretendo e receitas que alimentam sua fome de verdade no coração de Capim Grosso.'}
            </p>
          </div>

          {/* Redes Sociais & Contato com Telefone Atualizado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={`https://wa.me/${cleanPhone}?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs hover:opacity-95 transition-opacity"
            >
              <Phone className="w-4 h-4 fill-white" />
              <span>WhatsApp: {phoneDisplay}</span>
            </a>

            {promoLink ? (
              <a
                href={promoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#1E1E1E] hover:bg-[#282828] border border-emerald-500/50 text-emerald-400 py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-colors"
              >
                <Gift className="w-4 h-4" />
                <span>Grupo VIP Promoções</span>
              </a>
            ) : (
              <a
                href={storeSettings?.instagramUrl || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs hover:opacity-95 transition-opacity"
              >
                <Instagram className="w-4 h-4" />
                <span>{storeSettings?.instagramHandle || '@aiquefome.smash'}</span>
              </a>
            )}
          </div>

          {/* Horário de Funcionamento */}
          <div className="bg-[#181818] p-4 rounded-2xl border border-[#262626] space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FFA000]" />
              <h4 className="font-brand text-white font-bold text-xs uppercase">
                Horários Semanais de Atendimento
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
              {(storeSettings?.openingHoursSchedule || []).map((s) => (
                <div key={s.dayOfWeek} className="flex justify-between items-center bg-[#222] px-2.5 py-1.5 rounded-lg">
                  <span className="text-zinc-300 font-medium">{s.dayName}:</span>
                  <span className={s.isClosed ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {s.isClosed ? 'Fechado' : `${s.openTime} às ${s.closeTime}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Entrega e Retirada */}
          <div className="bg-[#181818] p-4 rounded-2xl border border-[#262626] space-y-3">
            <h4 className="font-brand text-white font-bold text-xs uppercase">
              Entrega &amp; Retirada em Capim Grosso
            </h4>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#242424] flex items-center justify-center text-[#FFA000] shrink-0">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <p className="text-white font-semibold">Entrega</p>
                <p className="text-[#A3A3A3]">
                  Tempo médio: <b>35 a 45 minutos</b>. Taxa calculada de acordo com o bairro no momento do pedido.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-[#242424]">
              <div className="w-8 h-8 rounded-xl bg-[#242424] flex items-center justify-center text-[#FFA000] shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <p className="text-white font-semibold">Retirada no Balcão</p>
                <p className="text-[#A3A3A3]">
                  Pronto em <b>15 a 20 minutos</b>. Sem qualquer taxa adicional.
                </p>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="bg-[#181818] p-4 rounded-2xl border border-[#262626] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#242424] flex items-center justify-center text-[#FFA000] shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-brand text-white font-bold text-xs uppercase mb-1">
                Endereço da Loja
              </h4>
              <p className="text-[#A3A3A3]">{address}</p>
            </div>
          </div>

          {/* Formas de Pagamento Aceitas */}
          <div className="bg-[#181818] p-4 rounded-2xl border border-[#262626] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#242424] flex items-center justify-center text-[#FFA000] shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-brand text-white font-bold text-xs uppercase mb-1">
                Formas de Pagamento
              </h4>
              <p className="text-[#A3A3A3]">
                PIX com aprovação instantânea, Cartões de Crédito e Débito (todas as bandeiras) e Dinheiro com troco.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-black border-t border-[#222222] flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#FFA000] hover:bg-[#FFB300] text-black rounded-xl font-brand font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Entendido, Voltar ao Cardápio
          </button>
        </div>

      </div>
    </div>
  );
};
