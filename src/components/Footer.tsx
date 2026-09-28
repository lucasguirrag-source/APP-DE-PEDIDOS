import React from 'react';
import { Phone, MapPin, Clock, Instagram, Heart, Sparkles, Gift } from 'lucide-react';
import { FomeLogo } from './FomeLogo';
import { DaySchedule } from '../types';

interface FooterProps {
  onOpenDeliveryInfo: () => void;
  storePhone?: string;
  storePhoneDisplay?: string;
  storeAddress?: string;
  promoGroupLink?: string;
  footerManifesto?: string;
  scheduleNotice?: string;
  footerPromoText?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  openingHoursSchedule?: DaySchedule[];
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDeliveryInfo,
  storePhone = '5574999999999',
  storePhoneDisplay = '(74) 99999-9999',
  storeAddress = 'Av. Senhor dos Passos, 280 - Centro, Capim Grosso - BA',
  promoGroupLink = '',
  footerManifesto = 'Inspirado na paixão por smash burgers autênticos em Capim Grosso: crostinha estalando na chapa, queijo cheddar artesanal derretendo e receitas que alimentam sua fome de verdade.',
  scheduleNotice = '*Segundas-feiras fechado para manutenção e preparação dos insumos.',
  footerPromoText = 'Participe do nosso grupo de promoções exclusivas e acompanhe o preparo dos lanches.',
  instagramHandle = '@aiquefome.smash',
  instagramUrl = 'https://instagram.com/aiquefome.smash',
  openingHoursSchedule = [],
}) => {
  const cleanPhone = storePhone.replace(/\D/g, '');

  // Resumo inteligente dos horários baseado na grade da loja
  const openDays = openingHoursSchedule.filter(s => !s.isClosed);
  const openDaysLabel = openDays.length > 0 
    ? (openDays.length === 6 && openingHoursSchedule.some(s => s.dayOfWeek === 1 && s.isClosed) 
        ? 'Terça a Domingo' 
        : `${openDays[0]?.dayName.split('-')[0]} a ${openDays[openDays.length - 1]?.dayName.split('-')[0]}`)
    : 'Terça a Domingo';

  const defaultHours = openDays[0] 
    ? `${openDays[0].openTime} às ${openDays[0].closeTime}` 
    : '18:00 às 23:45';

  return (
    <footer className="bg-black text-white pt-16 pb-12 border-t border-[#222222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#222222]">
          
          {/* Brand & Manifesto Institucional */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FomeLogo size="sm" variant="cheddar" />
              <div>
                <span className="font-brand text-2xl text-white tracking-tight leading-none block">
                  AI QUE FOME
                </span>
                <span className="text-[10px] uppercase font-bold text-[#FFA000] tracking-widest">
                  Capim Grosso - Bahia
                </span>
              </div>
            </div>

            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              {footerManifesto}
            </p>

            <button
              onClick={onOpenDeliveryInfo}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#FFA000] hover:text-white transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ver Horários &amp; Locais de Entrega</span>
            </button>
          </div>

          {/* Horários de Atendimento */}
          <div className="space-y-3">
            <h4 className="font-brand text-sm uppercase tracking-wider text-white">
              Horários de Atendimento
            </h4>
            <div className="space-y-2 text-xs text-[#A3A3A3]">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#FFA000] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">{openDaysLabel}</p>
                  <p>{defaultHours}</p>
                </div>
              </div>
              {scheduleNotice && (
                <p className="text-[11px] text-[#737373]">
                  {scheduleNotice}
                </p>
              )}
            </div>
          </div>

          {/* Contato & Localização em Capim Grosso */}
          <div className="space-y-3">
            <h4 className="font-brand text-sm uppercase tracking-wider text-white">
              Onde Estamos
            </h4>
            <div className="space-y-2.5 text-xs text-[#A3A3A3]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FFA000] shrink-0 mt-0.5" />
                <span>{storeAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#FFA000] shrink-0" />
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FFA000] transition-colors"
                >
                  {storePhoneDisplay || storePhone}
                </a>
              </div>
            </div>
          </div>

          {/* Grupo VIP e Redes Sociais */}
          <div className="space-y-3">
            <h4 className="font-brand text-sm uppercase tracking-wider text-white">
              Ofertas &amp; Redes
            </h4>
            <p className="text-xs text-[#A3A3A3]">
              {footerPromoText}
            </p>

            {promoGroupLink && (
              <a
                href={promoGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md"
              >
                <Gift className="w-4 h-4 fill-white" />
                <span>Entrar no Grupo VIP</span>
              </a>
            )}

            <div>
              <a
                href={instagramUrl || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333] hover:border-[#FFA000] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all mt-2"
              >
                <Instagram className="w-3.5 h-3.5 text-[#FFA000]" />
                <span>{instagramHandle || '@aiquefome.smash'}</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar: sem botões de admin visíveis ao cliente comum */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373]">
          <p>© {new Date().getFullYear()} AI QUE FOME Smash Burger · Capim Grosso - BA. Todos os direitos reservados.</p>
          
          <p className="flex items-center gap-1">
            Feito com <Heart className="w-3.5 h-3.5 text-[#FFA000] fill-[#FFA000]" /> e muito cheddar.
          </p>
        </div>
      </div>
    </footer>
  );
};
