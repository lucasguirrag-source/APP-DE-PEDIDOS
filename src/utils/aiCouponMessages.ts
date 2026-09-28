import { Coupon } from '../types';

export interface GenerateCopyParams {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  coupon: Coupon;
  storeName?: string;
  promoGroupLink?: string;
  menuLink?: string;
  tone?: 'descontraido' | 'urgencia' | 'suculento' | 'direto';
}

export const DAYS_INFO = [
  { dayOfWeek: 1, name: 'Segunda-feira', short: 'Segunda', emoji: '💤', theme: 'Preguiça de cozinhar & Começar a semana bem' },
  { dayOfWeek: 2, name: 'Terça-feira', short: 'Terça', emoji: '🍔', theme: 'Terça do Smash suculento & Fraldinha artesanal' },
  { dayOfWeek: 3, name: 'Quarta-feira', short: 'Quarta', emoji: '⚽', theme: 'Quarta de Futebol, amigos e dobradinha de burgers' },
  { dayOfWeek: 4, name: 'Quinta-feira', short: 'Quinta', emoji: '🚀', theme: 'Quase Sexta! Prévia oficial do final de semana' },
  { dayOfWeek: 5, name: 'Sexta-feira', short: 'Sexta', emoji: '🔥', theme: 'SEXTOU Oficial! Lanche, amigos e comemoração' },
  { dayOfWeek: 6, name: 'Sábado', short: 'Sábado', emoji: '🎉', theme: 'Sábado à noite perfeito: rolê em casa com muito burger' },
  { dayOfWeek: 0, name: 'Domingo', short: 'Domingo', emoji: '👑', theme: 'Domingo da Família & Fechar o fim de semana com chave de ouro' },
];

export async function generateAICouponMessage(params: GenerateCopyParams): Promise<string> {
  const { dayOfWeek, coupon, storeName = 'AI QUE FOME', promoGroupLink = '', menuLink = '', tone = 'descontraido' } = params;

  try {
    const res = await fetch('/api/generate-coupon-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayOfWeek,
        couponCode: coupon.code,
        discountType: coupon.type,
        discountValue: coupon.value,
        minOrderValue: coupon.minOrderValue || 0,
        storeName,
        promoGroupLink,
        menuLink,
        tone,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.copy) {
        return data.copy.trim();
      }
    }
  } catch (error) {
    console.warn('Backend AI copy generation fallback to local engine:', error);
  }

  // Fallback to high-converting localized generative engine
  return generateLocalCopyFallback(params);
}

export function generateLocalCopyFallback(params: GenerateCopyParams): string {
  const { dayOfWeek, coupon, storeName = 'AI QUE FOME', promoGroupLink = '', tone = 'descontraido' } = params;
  const day = DAYS_INFO.find((d) => d.dayOfWeek === dayOfWeek) || DAYS_INFO[0];

  const discountText = coupon.type === 'percent'
    ? `${coupon.value}% DE DESCONTO`
    : `R$ ${coupon.value.toFixed(2).replace('.', ',')} DE DESCONTO`;

  const minOrderNotice = coupon.minOrderValue
    ? `\n*Pedido mínimo:* R$ ${coupon.minOrderValue.toFixed(2).replace('.', ',')}`
    : '';

  const groupInvite = promoGroupLink
    ? `\n\n👥 *Quer mais cupons exclusivos como esse?*\nEntre no nosso Grupo VIP do WhatsApp:\n${promoGroupLink}`
    : '';

  // Hooks by day
  const dayHooks: Record<number, string[]> = {
    1: [
      `😴 *SEGUNDA-FEIRA COM PREGUIÇA DE COZINHAR?*`,
      `💥 *COMECE SUA SEGUNDA COM O PÉ DIREITO!*`,
      `🍔 *SEGUNDOU NO AI QUE FOME!*`,
    ],
    2: [
      `🔥 *TERÇA DO SMASH BURGER ARTESANAL!*`,
      `🤤 *TERÇA-FEIRA PEDE UM LANCHE DE RESPEITO!*`,
      `⚡ *BATEU AQUELA FOME NESSA TERÇA?*`,
    ],
    3: [
      `⚽ *QUARTA-FEIRA: NOITE DE FUTEBOL E BURGER!*`,
      `🍟 *METADE DA SEMANA JÁ FOI: VOCÊ MERECE!*`,
      `🍔 *QUARTA DO COMBO SUCULENTO!*`,
    ],
    4: [
      `🚀 *QUASE SEXTOU! VEM DE QUINTA DOS BURGERS!*`,
      `🔥 *QUINTA-FEIRA É DIA DE DAR AQUELA ESCAPADA!*`,
      `🍔 *CHEIRINHO DE FIM DE SEMANA CHEGANDO...*`,
    ],
    5: [
      `🎉 *SEXTOUUUU COM S DE SMASH BURGER!*`,
      `🔥 *A MELHOR SEXTA-FEIRA DA CIDADE É AQUI!*`,
      `🍔 *HOJE É DIA DE REUNIR A GALERA E PEDIR!*`,
    ],
    6: [
      `👑 *SÁBADO À NOITE É LEI: PEDIR AI QUE FOME!*`,
      `🎉 *SABADOU COM O MELHOR HAMBÚRGUER DA REGIÃO!*`,
      `🍟 *BURGER ARTESANAL, FRITAS E COCA GELADA!*`,
    ],
    0: [
      `✨ *DOMINGO DA PREGUIÇA: A GENTE COZINHA PRA VOCÊ!*`,
      `👑 *FECHE O FINAL DE SEMANA COM CHAVE DE OURO!*`,
      `🍔 *DOMINGO EM FAMÍLIA COMBINA COM AI QUE FOME!*`,
    ],
  };

  const hooks = dayHooks[dayOfWeek] || dayHooks[1];
  const randomHook = hooks[Math.floor(Math.random() * hooks.length)];

  // Body styles based on tone
  let body = '';
  if (tone === 'urgencia') {
    body = `Hoje liberamos uma condição especial e *limitada* para você matar sua fome!\n` +
      `Nossos burgers com blend de fraldinha 100g, queijo cheddar derretido e pão quentinho estão saindo com um super desconto!\n\n` +
      `⏳ *VÁLIDO SOMENTE HOJE (${day.short.toUpperCase()}) OU ENQUANTO DURAREM OS ESTOQUES!*`;
  } else if (tone === 'suculento') {
    body = `Imagina só: blend de fraldinha 100g bem suculento, queijo cheddar cremoso escorrendo, bacon crocante no ponto e aquela maionese da casa inconfundível... 🤤\n\n` +
      `Ficou com água na boca? Então aproveita que hoje o desconto é por nossa conta!`;
  } else if (tone === 'direto') {
    body = `Sem enrolação: preparamos um cupom especial para a sua ${day.short} ser ainda mais saborosa e econômica!`;
  } else {
    // Descontraído
    body = `A fome bateu forte por aí? Esquece a louça e as panelas hoje, porque a equipe do *${storeName}* preparou um presentão pra você!\n` +
      `Nossos hambúrgueres artesanais estão tinindo na chapa, prontos pra chegar quentinhos até você!`;
  }

  return `${randomHook}\n\n` +
    `${body}\n\n` +
    `🎟️ *CUPOM EXCLUSIVO:* *${coupon.code}*\n` +
    `💰 *DESCONTO:* *${discountText}*${minOrderNotice}\n` +
    `📅 *Válido para hoje:* ${day.name}\n\n` +
    `👉 *COMO USAR:* Acesse nosso cardápio online, monte seu pedido e digite o cupom *${coupon.code}* no carrinho antes de finalizar!${groupInvite}\n\n` +
    `🛵 *Ai que fome! Peça agora e receba rapidinho na sua casa!* 🔥`;
}
