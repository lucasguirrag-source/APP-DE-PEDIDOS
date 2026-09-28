import { StoreSettings, DaySchedule } from '../types';

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 1, dayName: 'Segunda-feira', openTime: '18:00', closeTime: '23:45', isClosed: true },
  { dayOfWeek: 2, dayName: 'Terça-feira', openTime: '18:00', closeTime: '23:45', isClosed: false },
  { dayOfWeek: 3, dayName: 'Quarta-feira', openTime: '18:00', closeTime: '23:45', isClosed: false },
  { dayOfWeek: 4, dayName: 'Quinta-feira', openTime: '18:00', closeTime: '23:45', isClosed: false },
  { dayOfWeek: 5, dayName: 'Sexta-feira', openTime: '18:00', closeTime: '00:00', isClosed: false },
  { dayOfWeek: 6, dayName: 'Sábado', openTime: '18:00', closeTime: '00:30', isClosed: false },
  { dayOfWeek: 0, dayName: 'Domingo', openTime: '18:00', closeTime: '23:45', isClosed: false },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  name: 'AI QUE FOME',
  phone: '5574999999999',
  phoneDisplay: '(74) 99999-9999',
  address: 'Av. Senhor dos Passos, 280 - Centro, Capim Grosso - BA',
  promoGroupLink: 'https://chat.whatsapp.com/ExemploGrupoPromocoes',
  discountPercent: 0, // Inicia em 0% ou configurado pelo administrador
  isManuallyClosed: false,
  deliveryFee: 6.0,
  freeDeliveryThreshold: 0, // Sem entrega grátis automática por padrão
  bannerImageUrl: '', // URL ou Base64 da imagem de capa configurada
  aboutText: 'Smash burgers autênticos com crostinha crocante na chapa de aço, queijo cheddar artesanal derretendo e receitas que alimentam sua fome de verdade no coração de Capim Grosso.',
  footerManifesto: 'Inspirado na paixão por smash burgers autênticos em Capim Grosso: crostinha estalando na chapa, queijo cheddar artesanal derretendo e receitas que alimentam sua fome de verdade.',
  scheduleNotice: '*Segundas-feiras fechado para manutenção e preparação dos insumos.',
  footerPromoText: 'Participe do nosso grupo de promoções exclusivas e acompanhe o preparo dos lanches.',
  instagramHandle: '@aiquefome.smash',
  instagramUrl: 'https://instagram.com/aiquefome.smash',
  openingHoursSchedule: DEFAULT_SCHEDULE,
  platformRates: [
    { id: 'site', name: 'Site / Cardápio Próprio', ratePercent: 0 },
    { id: 'whatsapp', name: 'WhatsApp Direto', ratePercent: 0 },
    { id: 'cartao', name: 'Cartão de Crédito/Débito', ratePercent: 3.5 },
    { id: 'ifood', name: 'iFood / Apps Terceiros', ratePercent: 12.0 },
  ],
};

const STORAGE_KEY = 'aqf_store_settings_v3';

export function normalizeWhatsAppNumber(rawPhone: string): string {
  if (!rawPhone) return '5574999999999';
  let cleaned = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
  // Se tem DDD e número (10 ou 11 dígitos), adiciona código do Brasil 55
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`;
  }
  return cleaned;
}

export const getStoredStoreSettings = (): StoreSettings => {
  if (typeof window === 'undefined') return DEFAULT_STORE_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let discountVal = 0;
      if (typeof parsed.discountPercent === 'number') {
        discountVal = parsed.discountPercent === 10 ? 0 : parsed.discountPercent;
      } else if (parsed.discountPercent) {
        const p = parseFloat(parsed.discountPercent);
        discountVal = p === 10 ? 0 : (isNaN(p) ? 0 : p);
      }

      const freeThresholdVal = typeof parsed.freeDeliveryThreshold === 'number' && parsed.freeDeliveryThreshold !== 70
        ? parsed.freeDeliveryThreshold
        : 0;

      const cleanedSettings: StoreSettings = {
        ...DEFAULT_STORE_SETTINGS,
        ...parsed,
        phone: parsed.phone ? normalizeWhatsAppNumber(parsed.phone) : DEFAULT_STORE_SETTINGS.phone,
        discountPercent: discountVal,
        freeDeliveryThreshold: freeThresholdVal,
        bannerImageUrl: typeof parsed.bannerImageUrl === 'string' ? parsed.bannerImageUrl : '',
        aboutText: parsed.aboutText || DEFAULT_STORE_SETTINGS.aboutText,
        footerManifesto: parsed.footerManifesto || DEFAULT_STORE_SETTINGS.footerManifesto,
        scheduleNotice: parsed.scheduleNotice || DEFAULT_STORE_SETTINGS.scheduleNotice,
        footerPromoText: parsed.footerPromoText || DEFAULT_STORE_SETTINGS.footerPromoText,
        instagramHandle: parsed.instagramHandle || DEFAULT_STORE_SETTINGS.instagramHandle,
        instagramUrl: parsed.instagramUrl || DEFAULT_STORE_SETTINGS.instagramUrl,
        openingHoursSchedule: parsed.openingHoursSchedule || DEFAULT_SCHEDULE,
        platformRates: parsed.platformRates || DEFAULT_STORE_SETTINGS.platformRates,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedSettings));
        localStorage.setItem('aqf_store_discount_percent', String(discountVal));
      } catch {}

      return cleanedSettings;
    }
  } catch (e) {
    console.error('Error loading store settings:', e);
  }
  return DEFAULT_STORE_SETTINGS;
};

export const saveStoredStoreSettings = (settings: StoreSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    const normalizedPhone = normalizeWhatsAppNumber(settings.phone);
    const normalizedSettings: StoreSettings = {
      ...settings,
      phone: normalizedPhone,
      discountPercent: typeof settings.discountPercent === 'number' ? settings.discountPercent : (parseFloat(String(settings.discountPercent)) || 0),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSettings));
    // Also sync old storage keys for backward compatibility
    localStorage.setItem('aqf_store_phone', normalizedPhone);
    localStorage.setItem('aqf_store_open_status', JSON.stringify(!settings.isManuallyClosed));
    localStorage.setItem('aqf_store_delivery_fee', settings.deliveryFee.toFixed(2));
    localStorage.setItem('aqf_store_discount_percent', String(normalizedSettings.discountPercent));

    window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: normalizedSettings }));

    // Sync with server in background
    fetch('/api/store/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedSettings),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving store settings:', e);
  }
};

/**
 * Verifica se a loja está aberta ou fechada com base:
 * 1. No fechamento manual
 * 2. No dia atual da semana
 * 3. No horário atual em Capim Grosso - BA (América/Bahia, UTC-3)
 * 4. No horário de abertura e fechamento configurado para o dia
 */
export function checkStoreOpenStatus(settings: StoreSettings): {
  isOpen: boolean;
  statusLabel: 'LOJA ABERTA' | 'LOJA FECHADA';
  reason: string;
  todaySchedule?: DaySchedule;
  currentTimeStr: string;
} {
  // Obter hora atual no fuso horário da Bahia / Capim Grosso (UTC-3)
  const now = new Date();
  let brDate: Date;
  try {
    const brTimeStr = now.toLocaleString('en-US', { timeZone: 'America/Bahia' });
    brDate = new Date(brTimeStr);
  } catch {
    brDate = now;
  }

  const currentDayOfWeek = brDate.getDay(); // 0 = Domingo, 1 = Segunda, ...
  const currentHours = brDate.getHours();
  const currentMinutes = brDate.getMinutes();
  const totalMinutesNow = currentHours * 60 + currentMinutes;
  const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

  // 1. Fechamento manual tem prioridade máxima
  if (settings.isManuallyClosed) {
    return {
      isOpen: false,
      statusLabel: 'LOJA FECHADA',
      reason: 'Loja pausada temporariamente pelo administrador.',
      currentTimeStr,
    };
  }

  // 2. Horário do dia atual
  const schedule = settings.openingHoursSchedule || DEFAULT_SCHEDULE;
  const todaySchedule = schedule.find((s) => s.dayOfWeek === currentDayOfWeek);

  if (!todaySchedule || todaySchedule.isClosed) {
    return {
      isOpen: false,
      statusLabel: 'LOJA FECHADA',
      reason: `Fechado hoje (${todaySchedule?.dayName || 'hoje'}).`,
      todaySchedule,
      currentTimeStr,
    };
  }

  const [openH, openM] = (todaySchedule.openTime || '18:00').split(':').map(Number);
  const [closeH, closeM] = (todaySchedule.closeTime || '23:45').split(':').map(Number);
  const openTotal = openH * 60 + openM;
  let closeTotal = closeH * 60 + closeM;

  // Se o fechamento for depois da meia-noite (ex: 00:30 ou 01:00)
  if (closeTotal < openTotal) {
    // Horário que vira a noite
    if (totalMinutesNow >= openTotal || totalMinutesNow <= closeTotal) {
      return {
        isOpen: true,
        statusLabel: 'LOJA ABERTA',
        reason: `Aberto hoje até ${todaySchedule.closeTime}.`,
        todaySchedule,
        currentTimeStr,
      };
    }
  } else {
    // Mesmo dia (ex: 18:00 às 23:45)
    if (totalMinutesNow >= openTotal && totalMinutesNow <= closeTotal) {
      return {
        isOpen: true,
        statusLabel: 'LOJA ABERTA',
        reason: `Aberto hoje das ${todaySchedule.openTime} às ${todaySchedule.closeTime}.`,
        todaySchedule,
        currentTimeStr,
      };
    }
  }

  return {
    isOpen: false,
    statusLabel: 'LOJA FECHADA',
    reason: `Fora do horário. Hoje funcionamos das ${todaySchedule.openTime} às ${todaySchedule.closeTime}.`,
    todaySchedule,
    currentTimeStr,
  };
}
