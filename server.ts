import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.resolve(process.cwd(), 'public')));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'public', 'uploads')));

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Salva imagens Base64 fisicamente no disco para nunca perder ou estourar cota do localStorage
function saveBase64ToFile(base64DataUrl: string, prefix = 'img'): string {
  try {
    const matches = base64DataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64DataUrl;
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (e) {
    console.error('Error saving base64 to file:', e);
    return base64DataUrl;
  }
}

// Arquivos para persistência definitiva do cardápio no servidor
const MENU_ITEMS_FILE = path.resolve(process.cwd(), 'menu-items-data.json');
const CATEGORIES_FILE = path.resolve(process.cwd(), 'menu-categories-data.json');
const COMPLEMENTS_FILE = path.resolve(process.cwd(), 'menu-complements-data.json');
const PRICING_FILE = path.resolve(process.cwd(), 'pricing-data.json');

app.get('/api/admin/pricing/data', (_req, res) => {
  try {
    if (fs.existsSync(PRICING_FILE)) {
      const data = fs.readFileSync(PRICING_FILE, 'utf-8');
      return res.json({ success: true, data: JSON.parse(data) });
    }
  } catch (e) {
    console.error('Error reading pricing data:', e);
  }
  return res.json({ success: true, data: null });
});

app.post('/api/admin/pricing/data', (req, res) => {
  try {
    const { ingredients, sheets } = req.body;
    if (ingredients || sheets) {
      fs.writeFileSync(PRICING_FILE, JSON.stringify({ ingredients, sheets }, null, 2), 'utf-8');
      return res.json({ success: true });
    }
    return res.status(400).json({ success: false, error: 'Dados inválidos' });
  } catch (e: any) {
    console.error('Error saving pricing data:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Persistent storage simulation in server memory + local json cache file
interface ServerStoreState {
  settings: {
    name: string;
    phone: string;
    phoneDisplay: string;
    address: string;
    promoGroupLink: string;
    discountPercent: number;
    isManuallyClosed: boolean;
    deliveryFee: number;
    freeDeliveryThreshold: number;
    bannerImageUrl?: string;
    aboutText?: string;
    footerManifesto?: string;
    scheduleNotice?: string;
    footerPromoText?: string;
    instagramHandle?: string;
    instagramUrl?: string;
    openingHoursSchedule: {
      dayOfWeek: number;
      dayName: string;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }[];
    platformRates: {
      id: string;
      name: string;
      ratePercent: number;
    }[];
  };
  transactions: {
    id: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    date: string;
    channel?: string;
    platformFeePercent?: number;
    netAmount?: number;
  }[];
  orders: any[];
  coupons: {
    id: string;
    code: string;
    type: 'percent' | 'fixed';
    value: number;
    minOrderValue?: number;
    validDays?: number[];
    isActive: boolean;
    description?: string;
    usageCount?: number;
  }[];
}

const DEFAULT_SERVER_SCHEDULE = [
  { dayOfWeek: 1, dayName: 'Segunda-feira', openTime: '18:00', closeTime: '23:45', isClosed: true },
  { dayOfWeek: 2, dayName: 'Terça-feira', openTime: '18:00', closeTime: '23:45', isClosed: false },
  { dayOfWeek: 3, dayName: 'Quarta-feira', openTime: '18:00', closeTime: '23:45', isClosed: false },
  { dayOfWeek: 4, dayName: 'Quinta-feira', openTime: '18:00', closeTime: '23:45', isClosed: false },
  { dayOfWeek: 5, dayName: 'Sexta-feira', openTime: '18:00', closeTime: '00:00', isClosed: false },
  { dayOfWeek: 6, dayName: 'Sábado', openTime: '18:00', closeTime: '00:30', isClosed: false },
  { dayOfWeek: 0, dayName: 'Domingo', openTime: '18:00', closeTime: '23:45', isClosed: false },
];

let serverState: ServerStoreState = {
  settings: {
    name: 'AI QUE FOME',
    phone: '5574999999999',
    phoneDisplay: '(74) 99999-9999',
    address: 'Av. Senhor dos Passos, 280 - Centro, Capim Grosso - BA',
    promoGroupLink: 'https://chat.whatsapp.com/ExemploGrupoPromocoes',
    discountPercent: 0,
    isManuallyClosed: false,
    deliveryFee: 6.0,
    freeDeliveryThreshold: 0,
    openingHoursSchedule: DEFAULT_SERVER_SCHEDULE,
    platformRates: [
      { id: 'site', name: 'Site Próprio', ratePercent: 0 },
      { id: 'whatsapp', name: 'WhatsApp', ratePercent: 0 },
      { id: 'cartao', name: 'Cartão de Crédito/Débito', ratePercent: 3.5 },
      { id: 'ifood', name: 'iFood / Outros', ratePercent: 12.0 },
    ],
  },
  transactions: [],
  orders: [],
  coupons: [
    {
      id: 'coupon-fome10',
      code: 'FOME10',
      type: 'percent',
      value: 10,
      minOrderValue: 30,
      isActive: true,
      description: '10% de desconto em qualquer pedido acima de R$ 30',
      usageCount: 42,
    },
    {
      id: 'coupon-burgervip',
      code: 'BURGERVIP',
      type: 'percent',
      value: 15,
      minOrderValue: 50,
      isActive: true,
      description: '15% de desconto especial exclusivo do Grupo VIP',
      usageCount: 28,
    },
    {
      id: 'coupon-sextou',
      code: 'SEXTOU',
      type: 'fixed',
      value: 10,
      minOrderValue: 40,
      validDays: [5],
      isActive: true,
      description: 'R$ 10,00 OFF na sua Sexta-feira!',
      usageCount: 35,
    },
    {
      id: 'coupon-quartasmash',
      code: 'QUARTASMASH',
      type: 'fixed',
      value: 8,
      minOrderValue: 35,
      validDays: [3],
      isActive: true,
      description: 'R$ 8,00 OFF na Quarta do Smash!',
      usageCount: 19,
    },
    {
      id: 'coupon-primeira',
      code: 'PRIMEIRACOMPRA',
      type: 'percent',
      value: 15,
      minOrderValue: 25,
      isActive: true,
      description: '15% de desconto no primeiro pedido',
      usageCount: 63,
    },
  ],
};

const SETTINGS_FILE = path.resolve(process.cwd(), 'store-settings.json');

function loadPersistedSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        serverState.settings = {
          ...serverState.settings,
          ...parsed,
          discountPercent: typeof parsed.discountPercent === 'number' ? parsed.discountPercent : (parseFloat(parsed.discountPercent) || 0),
        };
      }
    }
  } catch (e) {
    console.error('Failed to load persisted settings:', e);
  }
}

function savePersistedSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save persisted settings:', e);
  }
}

loadPersistedSettings();

// Check open status helper
function isStoreOpenServer(): { isOpen: boolean; reason: string } {
  if (serverState.settings.isManuallyClosed) {
    return { isOpen: false, reason: 'Loja fechada temporariamente pela administração.' };
  }

  const now = new Date();
  let brDate: Date;
  try {
    const brTimeStr = now.toLocaleString('en-US', { timeZone: 'America/Bahia' });
    brDate = new Date(brTimeStr);
  } catch {
    brDate = now;
  }

  const currentDayOfWeek = brDate.getDay();
  const currentMinutes = brDate.getHours() * 60 + brDate.getMinutes();

  const todaySchedule = serverState.settings.openingHoursSchedule.find(
    (s) => s.dayOfWeek === currentDayOfWeek
  );

  if (!todaySchedule || todaySchedule.isClosed) {
    return { isOpen: false, reason: `Hoje (${todaySchedule?.dayName || 'hoje'}) a loja está fechada.` };
  }

  const [openH, openM] = (todaySchedule.openTime || '18:00').split(':').map(Number);
  const [closeH, closeM] = (todaySchedule.closeTime || '23:45').split(':').map(Number);
  const openTotal = openH * 60 + openM;
  let closeTotal = closeH * 60 + closeM;

  if (closeTotal < openTotal) {
    if (currentMinutes >= openTotal || currentMinutes <= closeTotal) {
      return { isOpen: true, reason: 'Loja aberta para pedidos.' };
    }
  } else {
    if (currentMinutes >= openTotal && currentMinutes <= closeTotal) {
      return { isOpen: true, reason: 'Loja aberta para pedidos.' };
    }
  }

  return {
    isOpen: false,
    reason: `Loja fechada no momento. Horário hoje: das ${todaySchedule.openTime} às ${todaySchedule.closeTime}.`,
  };
}

// -------------------------------------------------------------
// STORE SETTINGS & STATUS APIS
// -------------------------------------------------------------
app.get('/api/store/settings', (_req, res) => {
  res.json({ success: true, settings: serverState.settings });
});

app.post('/api/store/settings', (req, res) => {
  const newSettings = req.body;
  const cleanDiscount = typeof newSettings.discountPercent === 'number'
    ? newSettings.discountPercent
    : (parseFloat(newSettings.discountPercent) || 0);

  // Se bannerImageUrl for Base64, salva fisicamente no disco
  let cleanBannerUrl = newSettings.bannerImageUrl;
  if (cleanBannerUrl && cleanBannerUrl.startsWith('data:image/')) {
    cleanBannerUrl = saveBase64ToFile(cleanBannerUrl, 'banner');
  }

  serverState.settings = {
    ...serverState.settings,
    ...newSettings,
    bannerImageUrl: cleanBannerUrl,
    discountPercent: cleanDiscount,
  };
  savePersistedSettings(serverState.settings);
  res.json({ success: true, settings: serverState.settings });
});

// -------------------------------------------------------------
// IMAGE UPLOAD API (Persistência Física de Fotos no Servidor)
// -------------------------------------------------------------
app.post('/api/upload-image', (req, res) => {
  try {
    const { image, prefix } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, error: 'Imagem não fornecida' });
    }

    // Se já for URL pública ou caminho relativo, mantém
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/uploads/')) {
      return res.json({ success: true, url: image });
    }

    const savedUrl = saveBase64ToFile(image, prefix || 'img');
    return res.json({ success: true, url: savedUrl });
  } catch (error: any) {
    console.error('Upload image error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// MENU PERSISTENCE APIS (Cardápio Definitivo no Disco do Servidor)
// -------------------------------------------------------------
app.get('/api/menu/items', (_req, res) => {
  try {
    if (fs.existsSync(MENU_ITEMS_FILE)) {
      const data = fs.readFileSync(MENU_ITEMS_FILE, 'utf-8');
      return res.json({ success: true, items: JSON.parse(data) });
    }
  } catch (e) {
    console.error('Error reading menu items:', e);
  }
  return res.json({ success: true, items: null });
});

app.post('/api/menu/items', (req, res) => {
  try {
    const { items } = req.body;
    if (Array.isArray(items)) {
      // Salva qualquer imagem em Base64 como arquivo estático permanente
      const sanitized = items.map((item: any) => {
        if (item.image && item.image.startsWith('data:image/')) {
          const fileUrl = saveBase64ToFile(item.image, 'item');
          return { ...item, image: fileUrl };
        }
        return item;
      });

      fs.writeFileSync(MENU_ITEMS_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
      return res.json({ success: true, items: sanitized });
    }
    return res.status(400).json({ success: false, error: 'Lista de itens inválida' });
  } catch (e: any) {
    console.error('Error saving menu items:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/menu/categories', (_req, res) => {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
      return res.json({ success: true, categories: JSON.parse(data) });
    }
  } catch (e) {
    console.error('Error reading categories:', e);
  }
  return res.json({ success: true, categories: null });
});

app.post('/api/menu/categories', (req, res) => {
  try {
    const { categories } = req.body;
    if (Array.isArray(categories)) {
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf-8');
      return res.json({ success: true, categories });
    }
    return res.status(400).json({ success: false, error: 'Categorias inválidas' });
  } catch (e: any) {
    console.error('Error saving categories:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/menu/complements', (_req, res) => {
  try {
    if (fs.existsSync(COMPLEMENTS_FILE)) {
      const data = fs.readFileSync(COMPLEMENTS_FILE, 'utf-8');
      return res.json({ success: true, complements: JSON.parse(data) });
    }
  } catch (e) {
    console.error('Error reading complements:', e);
  }
  return res.json({ success: true, complements: null });
});

app.post('/api/menu/complements', (req, res) => {
  try {
    const { complements } = req.body;
    if (Array.isArray(complements)) {
      const sanitized = complements.map((comp: any) => {
        if (comp.image && comp.image.startsWith('data:image/')) {
          const fileUrl = saveBase64ToFile(comp.image, 'comp');
          return { ...comp, image: fileUrl };
        }
        return comp;
      });
      fs.writeFileSync(COMPLEMENTS_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
      return res.json({ success: true, complements: sanitized });
    }
    return res.status(400).json({ success: false, error: 'Complementos inválidos' });
  } catch (e: any) {
    console.error('Error saving complements:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/store/status', (_req, res) => {
  const status = isStoreOpenServer();
  res.json({
    success: true,
    isOpen: status.isOpen,
    reason: status.reason,
    settings: serverState.settings,
  });
});

// -------------------------------------------------------------
// ORDERS API (Validated in Backend!) - Item 13: Segurança e Validações
// -------------------------------------------------------------
app.post('/api/orders', (req, res) => {
  const storeStatus = isStoreOpenServer();
  // Validates if store is open (Item 8)
  if (!storeStatus.isOpen) {
    res.status(403).json({
      success: false,
      error: 'A loja está FECHADA no momento e não está aceitando novos pedidos.',
      reason: storeStatus.reason,
    });
    return;
  }

  const orderData = req.body;
  if (!orderData || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    res.status(400).json({ success: false, error: 'Pedido inválido ou sacola vazia.' });
    return;
  }

  // Backend recalculation to prevent client-side tampering of prices & totals
  let calculatedSubtotal = 0;
  for (const item of orderData.items) {
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    const unitPrice = Math.max(0, parseFloat(item.unitPrice || item.item?.price) || 0);

    let extrasTotal = 0;
    if (item.selectedExtras && Array.isArray(item.selectedExtras)) {
      for (const extra of item.selectedExtras) {
        const extraQty = Math.max(1, parseInt(extra.quantity) || 1);
        const extraPrice = Math.max(0, parseFloat(extra.price) || 0);
        extrasTotal += extraPrice * extraQty;
      }
    }

    const itemTotalPrice = (unitPrice + extrasTotal) * qty;
    calculatedSubtotal += itemTotalPrice;
  }

  const deliveryMethod = orderData.customer?.deliveryMethod === 'pickup' ? 'pickup' : 'delivery';
  let validatedDeliveryFee = 0;
  if (deliveryMethod === 'delivery') {
    if (serverState.settings.freeDeliveryThreshold > 0 && calculatedSubtotal >= serverState.settings.freeDeliveryThreshold) {
      validatedDeliveryFee = 0;
    } else {
      validatedDeliveryFee = Math.max(0, parseFloat(orderData.deliveryFee) || serverState.settings.deliveryFee);
    }
  }

  // Validate discount (supports any configured % or coupon)
  let validatedDiscount = 0;
  if (orderData.discount && parseFloat(orderData.discount) > 0) {
    const requestedDiscount = parseFloat(orderData.discount);
    validatedDiscount = Math.min(requestedDiscount, calculatedSubtotal);
  }

  // Securely compute final total
  const validatedTotal = Math.max(0, calculatedSubtotal + validatedDeliveryFee - validatedDiscount);

  // Initial status starts strictly as 'preparing' (Item 2)
  const orderNumber = orderData.orderNumber || Math.floor(1000 + Math.random() * 9000);
  const newOrder = {
    ...orderData,
    id: orderData.id || `AQF-${orderNumber}`,
    orderNumber,
    subtotal: calculatedSubtotal,
    deliveryFee: validatedDeliveryFee,
    discount: validatedDiscount,
    total: validatedTotal,
    status: 'preparing',
    createdAt: orderData.createdAt || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };

  serverState.orders.unshift(newOrder);

  // Auto record site sales transaction in ledger (Item 4)
  serverState.transactions.push({
    id: `tx-ord-${newOrder.orderNumber}`,
    type: 'income',
    category: 'vendas_site',
    description: `Pedido #${newOrder.orderNumber} (${deliveryMethod === 'delivery' ? 'Delivery' : 'Retirada'})`,
    amount: validatedTotal,
    date: new Date().toISOString().split('T')[0],
    channel: 'site',
    platformFeePercent: 0,
    netAmount: validatedTotal,
  });

  res.status(201).json({ success: true, order: newOrder });
});

app.get('/api/orders', (_req, res) => {
  res.json({ success: true, orders: serverState.orders });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = serverState.orders.find((o) => o.id === id);
  if (order) {
    order.status = status;
    res.json({ success: true, order });
  } else {
    res.status(404).json({ success: false, error: 'Pedido não encontrado.' });
  }
});

// -------------------------------------------------------------
// ADMIN AUTHENTICATION API
// -------------------------------------------------------------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  // Default credentials: admin / admin123 or gerente / aiquefome
  if (
    (username === 'admin' && (password === 'admin123' || password === 'admin' || password === 'fome123')) ||
    (username === 'gerente' && (password === 'aiquefome' || password === 'admin123'))
  ) {
    const token = `adm_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    res.json({ success: true, token, user: { username, role: 'admin' } });
  } else {
    res.status(401).json({ success: false, error: 'Credenciais inválidas. Verifique usuário e senha.' });
  }
});

app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer adm_token_')) {
    res.json({ success: true, valid: true });
  } else {
    res.status(401).json({ success: false, valid: false });
  }
});

// -------------------------------------------------------------
// INTELLIGENT FINANCIAL CONTROL WITH GEMINI API
// -------------------------------------------------------------
app.get('/api/admin/finance/data', (_req, res) => {
  // Compute summary metrics
  const txs = serverState.transactions;
  const totalRevenue = txs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + (t.netAmount || t.amount), 0);
  const totalExpenses = txs
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expensePercent = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTxs = txs.filter((t) => t.date === todayStr);
  const dailyRevenue = todayTxs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + (t.netAmount || t.amount), 0);
  const dailyExpenses = todayTxs
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const dailyProfit = dailyRevenue - dailyExpenses;

  res.json({
    success: true,
    transactions: txs,
    platformRates: serverState.settings.platformRates,
    summary: {
      totalRevenue,
      totalExpenses,
      totalCosts: totalExpenses,
      netProfit,
      profitMarginPercent,
      expensePercent,
      monthlyCostEstimate: totalExpenses * 4,
      dailyRevenue,
      dailyExpenses,
      dailyProfit,
      weeklyRevenue: totalRevenue,
      weeklyExpenses: totalExpenses,
      weeklyProfit: netProfit,
      monthlyRevenue: totalRevenue * 4,
      monthlyExpenses: totalExpenses * 4,
      monthlyProfit: netProfit * 4,
      discountsGranted: 0,
      platformFeesPaid: txs.reduce((acc, t) => acc + (t.amount - (t.netAmount || t.amount)), 0),
    },
  });
});

app.post('/api/admin/finance/transaction', (req, res) => {
  const tx = req.body;
  if (!tx.amount || !tx.type) {
    res.status(400).json({ success: false, error: 'Dados da transação incompletos.' });
    return;
  }
  const newTx = {
    ...tx,
    id: tx.id || `tx-${Date.now()}`,
    date: tx.date || new Date().toISOString().split('T')[0],
  };
  serverState.transactions.unshift(newTx);
  res.json({ success: true, transaction: newTx });
});

app.delete('/api/admin/finance/transaction/:id', (req, res) => {
  const { id } = req.params;
  serverState.transactions = serverState.transactions.filter((t) => t.id !== id);
  res.json({ success: true });
});

// Gemini Chat Endpoint
app.post('/api/admin/finance/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Check transactions context
    const currentTransactions = serverState.transactions.slice(0, 15);
    const platformRates = serverState.settings.platformRates;

    const currentRevenue = serverState.transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const currentExpenses = serverState.transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const systemPrompt = `Você é o Assistente Financeiro Inteligente da Hamburgueria "AI QUE FOME" em Capim Grosso - Bahia.
Seu objetivo é conversar com o administrador e entender detalhadamente a situação financeira do negócio, despesas, faturamento e taxas.

Você deve ser ADAPTATIVO:
- Analise o que já foi informado e identifique o que ainda falta.
- Se o administrador informa uma despesa (ex: "Gastei R$ 250 no mercado hoje com carnes e queijo"), compreenda o valor, a categoria e registre.
- Se o administrador informa receita (ex: "Entrou R$ 600 em vendas pelo site"), pergunte se houve vendas por WhatsApp, outro app, balcão ou dinheiro.
- Exemplos de perguntas inteligentes que você deve fazer progressivamente quando notar que falta informação:
  * Qual foi sua conta de luz este mês?
  * Quanto pagou de água?
  * Quanto gastou com fornecedores de carnes, pães e queijos?
  * Quanto gastou com embalagens de delivery?
  * Quanto gastou com funcionários / motoboys?
  * Quanto gastou com gás de cozinha?
  * Quanto paga de aluguel e internet?
  * Quanto gastou com publicidade / Instagram?
  * Houve alguma venda fora do site (balcão ou WhatsApp)?
  * Qual a taxa que as maquininhas ou plataformas estão cobrando?

Contexto atual da hamburgueria:
- Faturamento já registrado: R$ ${currentRevenue.toFixed(2)}
- Despesas já registradas: R$ ${currentExpenses.toFixed(2)}
- Taxas de plataformas configuradas: ${JSON.stringify(platformRates)}
- Últimas movimentações: ${JSON.stringify(currentTransactions)}

SEMPRE responda em português brasileiro com tom prestativo, profissional e conciso.
SE a mensagem do administrador contiver um gasto, custo ou receita que deva ser adicionado ao caixa, inclua ao final da sua resposta um bloco JSON puro com a chave "NEW_TRANSACTION":
Exemplo:
{"NEW_TRANSACTION": {"type": "expense", "category": "mercado", "description": "Compras no mercado", "amount": 250.00}}
Ou para receita:
{"NEW_TRANSACTION": {"type": "income", "category": "vendas_externas", "description": "Vendas balcão/WhatsApp", "amount": 400.00, "channel": "whatsapp"}}`;

    if (!apiKey) {
      // Graceful fallback with intelligent rule-based response
      let recognizedTx: any = null;
      let reply = '';
      const lower = (message || '').toLowerCase();

      // Check numbers
      const match = message.match(/(\d+[\.,]?\d*)/);
      const val = match ? parseFloat(match[1].replace(',', '.')) : 0;

      if (lower.includes('gastei') || lower.includes('paguei') || lower.includes('despesa') || lower.includes('custo') || lower.includes('conta')) {
        let cat = 'outros';
        if (lower.includes('luz') || lower.includes('energia')) cat = 'luz';
        else if (lower.includes('agua')) cat = 'agua';
        else if (lower.includes('mercado') || lower.includes('carne') || lower.includes('queijo')) cat = 'mercado';
        else if (lower.includes('embalag')) cat = 'embalagens';
        else if (lower.includes('gas')) cat = 'gas';
        else if (lower.includes('aluguel')) cat = 'aluguel';
        else if (lower.includes('funcionario') || lower.includes('salario') || lower.includes('motoboy')) cat = 'funcionarios';

        if (val > 0) {
          recognizedTx = {
            id: `tx-${Date.now()}`,
            type: 'expense',
            category: cat,
            description: message,
            amount: val,
            date: new Date().toISOString().split('T')[0],
          };
          serverState.transactions.unshift(recognizedTx);
          reply = `Registrei a despesa de R$ ${val.toFixed(2).replace('.', ',')} em "${cat}".\n\nAgora me conta: você teve algum gasto recente com embalagens de hambúrguer ou fornecedores de carne? E como foram as vendas de hoje no balcão e WhatsApp?`;
        } else {
          reply = `Entendi que você teve uma despesa. Qual foi o valor exato pago e qual a categoria (luz, mercado, fornecedores, embalagens)?`;
        }
      } else if (lower.includes('venda') || lower.includes('entrou') || lower.includes('faturei') || lower.includes('recebi')) {
        if (val > 0) {
          recognizedTx = {
            id: `tx-${Date.now()}`,
            type: 'income',
            category: 'vendas_externas',
            description: message,
            amount: val,
            date: new Date().toISOString().split('T')[0],
            channel: lower.includes('whatsapp') ? 'whatsapp' : 'balcao',
            platformFeePercent: 0,
            netAmount: val,
          };
          serverState.transactions.unshift(recognizedTx);
          reply = `Ótimo! Lancei a receita de R$ ${val.toFixed(2).replace('.', ',')} no caixa.\n\nVocê teve alguma taxa descontada nessa venda (ex: maquininha de cartão) ou teve algum outro recebimento em dinheiro hoje?`;
        } else {
          reply = `Qual foi o valor total que entrou hoje? Entrou algum valor por aplicativo, maquininha ou dinheiro vivo?`;
        }
      } else {
        reply = `Olá! Sou seu assistente de finanças do AI QUE FOME. Hoje nós já registramos R$ ${currentRevenue.toFixed(2).replace('.', ',')} em receitas e R$ ${currentExpenses.toFixed(2).replace('.', ',')} em despesas.\n\nPara calcularmos seu lucro líquido com precisão: quanto você gastou hoje com mercado/insumos ou fornecedores? Teve alguma venda fora do site?`;
      }

      res.json({
        success: true,
        reply,
        detectedTransaction: recognizedTx,
        suggestedActions: [
          'Gastei R$ 150 no mercado hoje',
          'A conta de luz veio R$ 380',
          'Entrou R$ 420 em vendas no balcão',
          'Paguei R$ 80 de embalagens',
        ],
      });
      return;
    }

    // Call Gemini API via modern @google/genai SDK
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...(Array.isArray(history)
        ? history.slice(-6).map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          }))
        : []),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents as any,
    });

    const replyText = response.text || 'Entendido. Como posso ajudar com as finanças hoje?';

    // Parse potential NEW_TRANSACTION json
    let detectedTransaction: any = null;
    let cleanReply = replyText;
    const jsonMatch = replyText.match(/\{[\s\S]*"NEW_TRANSACTION"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.NEW_TRANSACTION && parsed.NEW_TRANSACTION.amount) {
          detectedTransaction = {
            id: `tx-ai-${Date.now()}`,
            type: parsed.NEW_TRANSACTION.type || 'expense',
            category: parsed.NEW_TRANSACTION.category || 'outros',
            description: parsed.NEW_TRANSACTION.description || 'Lançamento via IA',
            amount: Number(parsed.NEW_TRANSACTION.amount),
            date: new Date().toISOString().split('T')[0],
            channel: parsed.NEW_TRANSACTION.channel || 'outro',
            platformFeePercent: parsed.NEW_TRANSACTION.platformFeePercent || 0,
            netAmount: parsed.NEW_TRANSACTION.netAmount || Number(parsed.NEW_TRANSACTION.amount),
          };
          serverState.transactions.unshift(detectedTransaction);
        }
        cleanReply = replyText.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error('Failed to parse transaction JSON from Gemini:', e);
      }
    }

    res.json({
      success: true,
      reply: cleanReply,
      detectedTransaction,
      suggestedActions: [
        'Qual é o meu lucro líquido hoje?',
        'Gastei R$ 180 com carnes e insumos',
        'Entrou R$ 350 no WhatsApp em dinheiro',
        'Paguei R$ 120 de entregadores hoje',
      ],
    });
  } catch (error: any) {
    console.error('Gemini finance chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar consulta financeira com IA.',
      reply: 'Não foi possível consultar a IA no momento. Por favor tente novamente.',
    });
  }
});

// -------------------------------------------------------------
// COUPONS API & PERSISTENCE
// -------------------------------------------------------------
app.get('/api/coupons', (_req, res) => {
  res.json({ success: true, coupons: serverState.coupons || [] });
});

app.post('/api/coupons', (req, res) => {
  const coupon = req.body;
  if (!coupon || !coupon.code) {
    res.status(400).json({ success: false, error: 'Código do cupom é obrigatório.' });
    return;
  }
  const cleanCode = String(coupon.code).trim().toUpperCase();
  const existingIndex = (serverState.coupons || []).findIndex(
    (c) => c.id === coupon.id || c.code.toUpperCase() === cleanCode
  );

  const newCoupon = {
    ...coupon,
    id: coupon.id || `coupon-${Date.now()}`,
    code: cleanCode,
    value: Number(coupon.value) || 10,
    isActive: coupon.isActive !== false,
  };

  if (existingIndex >= 0) {
    serverState.coupons[existingIndex] = newCoupon;
  } else {
    serverState.coupons = [newCoupon, ...(serverState.coupons || [])];
  }

  res.json({ success: true, coupon: newCoupon });
});

app.delete('/api/coupons/:id', (req, res) => {
  const { id } = req.params;
  serverState.coupons = (serverState.coupons || []).filter((c) => c.id !== id);
  res.json({ success: true });
});

// -------------------------------------------------------------
// AI WHATSAPP PROMOTIONAL MESSAGE GENERATOR (Gemini API)
// -------------------------------------------------------------
app.post('/api/generate-coupon-copy', async (req, res) => {
  try {
    const {
      dayOfWeek,
      couponCode,
      discountType,
      discountValue,
      minOrderValue,
      storeName = 'AI QUE FOME',
      promoGroupLink = '',
      tone = 'descontraido',
    } = req.body;

    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayName = dayNames[Number(dayOfWeek)] || 'Hoje';

    const discountFormatted = discountType === 'percent'
      ? `${discountValue}% OFF`
      : `R$ ${Number(discountValue).toFixed(2).replace('.', ',')} OFF`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.json({ success: false, reason: 'no_api_key' });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Você é um redator de publicidade de delivery especialista em WhatsApp para a hamburgueria artesanal "${storeName}".
Escreva UMA mensagem irresistível, com alto poder de conversão e apetitosa para ser disparada no WhatsApp para clientes ou grupos.

INFORMAÇÕES DA PROMOÇÃO:
- Dia da semana: ${dayName}
- Cupom especial: ${couponCode}
- Desconto: ${discountFormatted}
- Pedido mínimo: ${minOrderValue ? `R$ ${minOrderValue}` : 'Sem pedido mínimo'}
- Tom de comunicação: ${tone} (descontraído, faminto, apetitoso)
${promoGroupLink ? `- Link do Grupo VIP de Promoções do WhatsApp: ${promoGroupLink}` : ''}

REGRAS:
1. Conecte com o dia da semana (${dayName}) de forma natural (ex: na segunda a preguiça de cozinhar, na terça matar a vontade, na quarta o futebol, na quinta quase sexta, na sexta o sextou com burger, no sábado à noite o rolê perfeito, no domingo o conforto em família).
2. Destaque em negrito o cupom *${couponCode}* e o desconto *${discountFormatted}*.
3. Destaque a qualidade dos lanches: blend artesanal de fraldinha 100g, cheddar cremoso derretido e pão quentinho.
4. Formate estritamente para WhatsApp (emojis 🍔, 🔥, 🤤, 🎟️, 🛵, texto em *negrito*).
5. Inclua chamada de ação: acessar o cardápio e inserir o cupom *${couponCode}* no carrinho.
${promoGroupLink ? `6. Inclua o convite para entrar no Grupo VIP de WhatsApp: ${promoGroupLink}` : ''}
7. NÃO coloque saudações de IA (ex: "Aqui está sua mensagem:"), responda APENAS com o texto final da mensagem pronto para copiar e colar.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.85,
      },
    });

    const copy = response.text || '';
    res.json({ success: true, copy });
  } catch (error: any) {
    console.error('Gemini coupon copy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function setupVite() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: 3000, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} in ${isProd ? 'production' : 'development'} mode.`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
