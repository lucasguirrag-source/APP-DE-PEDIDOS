export interface PrinterLayoutConfig {
  paperSize: '58mm' | '80mm';
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'monospace' | 'sans-serif' | 'condensed';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  boldItemNames: boolean;
  highlightNotes: boolean;
  printDivider: 'dashed' | 'double' | 'solid';
  copies: 1 | 2;
  showStoreHeader: boolean;
}

export const DEFAULT_PRINTER_CONFIG: PrinterLayoutConfig = {
  paperSize: '58mm',
  fontSize: 'medium',
  fontFamily: 'monospace',
  lineHeight: 'normal',
  boldItemNames: true,
  highlightNotes: true,
  printDivider: 'dashed',
  copies: 1,
  showStoreHeader: true,
};

const STORAGE_KEY = 'aqf_printer_layout_settings';

export const getPrinterConfig = (): PrinterLayoutConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Erro ao ler configurações de impressão:', e);
  }
  return DEFAULT_PRINTER_CONFIG;
};

export const savePrinterConfig = (config: PrinterLayoutConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Erro ao salvar configurações de impressão:', e);
  }
};

export const resetPrinterConfig = (): PrinterLayoutConfig => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Erro ao resetar configurações de impressão:', e);
  }
  return DEFAULT_PRINTER_CONFIG;
};

// Mapeamentos CSS
export const getFontSizePx = (size: PrinterLayoutConfig['fontSize']) => {
  switch (size) {
    case 'small':
      return '11px';
    case 'large':
      return '15px';
    case 'medium':
    default:
      return '13px';
  }
};

export const getFontFamilyCss = (font: PrinterLayoutConfig['fontFamily']) => {
  switch (font) {
    case 'sans-serif':
      return `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
    case 'condensed':
      return `'Arial Narrow', 'Nimbus Sans L', sans-serif-condensed, sans-serif`;
    case 'monospace':
    default:
      return `'Courier New', Courier, 'Lucida Console', Monaco, monospace`;
  }
};

export const getLineHeightValue = (lh: PrinterLayoutConfig['lineHeight']) => {
  switch (lh) {
    case 'tight':
      return '1.15';
    case 'relaxed':
      return '1.6';
    case 'normal':
    default:
      return '1.35';
  }
};

export const getDividerCss = (divider: PrinterLayoutConfig['printDivider']) => {
  switch (divider) {
    case 'double':
      return 'border: 0; border-top: 2px double #000; margin: 6px 0;';
    case 'solid':
      return 'border: 0; border-top: 1px solid #000; margin: 6px 0;';
    case 'dashed':
    default:
      return 'border: 0; border-top: 1px dashed #000; margin: 6px 0;';
  }
};

export const generateReceiptHtml = (
  order: any,
  config: PrinterLayoutConfig,
  viaLabel?: string
): string => {
  const is58 = config.paperSize === '58mm';
  const widthPx = is58 ? '260px' : '360px';
  const fontSizePx = getFontSizePx(config.fontSize);
  const fontFamilyCss = getFontFamilyCss(config.fontFamily);
  const lineHeightVal = getLineHeightValue(config.lineHeight);
  const dividerStyle = getDividerCss(config.printDivider);

  const itemsHtml = (order.items || [])
    .map((i: any) => {
      const nameStyle = config.boldItemNames ? 'font-weight: bold;' : 'font-weight: normal;';
      const obsStyle = config.highlightNotes
        ? 'display: block; margin-top: 3px; padding: 2px 4px; background: #e5e5e5; font-weight: bold; border-left: 3px solid #000;'
        : 'display: block; margin-top: 3px; font-style: italic;';

      return `
        <div style="margin-bottom: 7px; ${nameStyle}">
          <span>${i.quantity || 1}x ${i.item?.name || i.name || 'Produto'}</span>
          <span style="float: right;">R$ ${((i.totalPrice || (i.item?.price || 0) * (i.quantity || 1))).toFixed(2).replace('.', ',')}</span>
          <div style="clear: both; font-size: 0.9em; font-weight: normal;">
            ${i.selectedBread ? `• Pão: ${i.selectedBread}<br/>` : ''}
            ${i.selectedDoneness ? `• Ponto: ${i.selectedDoneness}<br/>` : ''}
            ${i.selectedExtras && i.selectedExtras.length > 0 ? `• Adic: ${i.selectedExtras.map((e: any) => `${e.quantity > 1 ? `${e.quantity}x ` : ''}${e.name}`).join(', ')}<br/>` : ''}
            ${i.selectedRemovals && i.selectedRemovals.length > 0 ? `<span style="text-decoration: line-through;">• Sem: ${i.selectedRemovals.join(', ')}</span><br/>` : ''}
            ${i.notes ? `<div style="${obsStyle}">OBS: ${i.notes}</div>` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div style="
      width: ${widthPx};
      max-width: 100%;
      font-family: ${fontFamilyCss};
      font-size: ${fontSizePx};
      line-height: ${lineHeightVal};
      color: #000;
      background: #fff;
      padding: 6px;
      margin: 0 auto;
      box-sizing: border-box;
    ">
      ${
        config.showStoreHeader
          ? `
        <div style="text-align: center; margin-bottom: 4px;">
          <div style="font-size: 1.25em; font-weight: 900; letter-spacing: 0.5px;">AI QUE FOME SMASH</div>
          <div style="font-size: 0.85em; font-weight: bold;">DELIVERY & BALCÃO</div>
        </div>
        `
          : ''
      }
      
      ${viaLabel ? `<div style="text-align: center; font-size: 0.85em; font-weight: bold; padding: 2px 0; border: 1px dashed #000; margin: 4px 0;">-- ${viaLabel.toUpperCase()} --</div>` : ''}

      <hr style="${dividerStyle}"/>
      
      <div style="font-weight: bold; font-size: 1.1em; text-align: center;">
        PEDIDO #${order.orderNumber || (order.id ? order.id.slice(-6) : '101')}
      </div>
      <div style="font-size: 0.85em; text-align: center; margin-bottom: 4px;">
        ${order.createdAt || new Date().toLocaleString('pt-BR')}
      </div>

      <hr style="${dividerStyle}"/>

      <div style="font-size: 0.9em; margin-bottom: 4px;">
        <strong>CLIENTE:</strong> ${order.customer?.name || 'Cliente Teste'}<br/>
        <strong>TEL:</strong> ${order.customer?.phone || '(11) 99999-9999'}<br/>
        <strong>TIPO:</strong> ${order.customer?.deliveryMethod === 'pickup' ? 'RETIRADA NO BALCÃO' : 'ENTREGA DELIVERY'}
        ${
          order.customer?.deliveryMethod !== 'pickup' && order.customer?.address
            ? `<br/><strong>END:</strong> ${order.customer.address.street}, ${order.customer.address.number} - ${order.customer.address.neighborhood}
               ${order.customer.address.complement ? `<br/>Compl: ${order.customer.address.complement}` : ''}
               ${order.customer.address.reference ? `<br/>Ref: ${order.customer.address.reference}` : ''}`
            : ''
        }
      </div>

      <hr style="${dividerStyle}"/>

      <div style="font-size: 0.85em; font-weight: bold; margin-bottom: 4px;">ITENS DO PEDIDO:</div>
      ${itemsHtml}

      <hr style="${dividerStyle}"/>

      <div style="font-size: 0.95em;">
        <div>Subtotal: <span style="float: right;">R$ ${(order.subtotal || 38.0).toFixed(2).replace('.', ',')}</span></div>
        ${order.deliveryFee ? `<div>Taxa Entrega: <span style="float: right;">R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}</span></div>` : ''}
        ${order.discount ? `<div>Desconto: <span style="float: right;">-R$ ${order.discount.toFixed(2).replace('.', ',')}</span></div>` : ''}
        <div style="font-weight: 900; font-size: 1.15em; margin-top: 4px; border-top: 1px solid #000; padding-top: 2px;">
          TOTAL: <span style="float: right;">R$ ${(order.total || 38.0).toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <div style="clear: both; margin-top: 6px; font-size: 0.85em;">
        <strong>PAGAMENTO:</strong> ${(order.customer?.paymentMethod || 'PIX').toUpperCase()}
        ${order.customer?.cashChangeFor ? `<br/>Troco para: R$ ${order.customer.cashChangeFor}` : ''}
      </div>

      <hr style="${dividerStyle}"/>

      <div style="text-align: center; font-size: 0.75em; margin-top: 6px;">
        Obrigado pela preferência!<br/>
        * AI QUE FOME SMASH *
      </div>
    </div>
  `;
};

// Dispara impressão de teste na impressora térmica / navegador
export const triggerTestPrint = (config: PrinterLayoutConfig) => {
  const sampleOrder = {
    id: 'test-101',
    orderNumber: '101',
    createdAt: new Date().toLocaleString('pt-BR'),
    customer: {
      name: 'João Silva (Teste)',
      phone: '(11) 98765-4321',
      deliveryMethod: 'delivery',
      paymentMethod: 'PIX',
      address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        complement: 'Apto 42',
        reference: 'Próximo à padaria',
      },
    },
    items: [
      {
        quantity: 2,
        item: { name: 'Smash Bacon Duplo', price: 28.0 },
        totalPrice: 56.0,
        selectedBread: 'Brioche Selado',
        selectedDoneness: 'Ao ponto',
        selectedExtras: [{ name: 'Bacon Extra Crocante', quantity: 1 }],
        selectedRemovals: ['Sem Picles'],
        notes: 'Caprichar na maionese da casa!',
      },
      {
        quantity: 1,
        item: { name: 'Batata Rústica Individual', price: 14.0 },
        totalPrice: 14.0,
        notes: 'Pouco sal por favor',
      },
    ],
    subtotal: 70.0,
    deliveryFee: 6.0,
    discount: 0,
    total: 76.0,
  };

  triggerPrintOrder(sampleOrder, config);
};

// Dispara impressão de um pedido real
export const triggerPrintOrder = (order: any, customConfig?: PrinterLayoutConfig) => {
  const config = customConfig || getPrinterConfig();
  const printWindow = window.open('', '_blank', 'width=460,height=750');
  if (!printWindow) {
    alert('A janela de impressão foi bloqueada pelo navegador. Permita pop-ups para imprimir.');
    return;
  }

  const is58 = config.paperSize === '58mm';
  const pageCssWidth = is58 ? '58mm' : '80mm';

  let fullHtml = '';
  if (config.copies === 2) {
    fullHtml = `
      ${generateReceiptHtml(order, config, '1ª VIA - COZINHA')}
      <div style="page-break-after: always; height: 16px;"></div>
      ${generateReceiptHtml(order, config, '2ª VIA - EXPEDIÇÃO / CLIENTE')}
    `;
  } else {
    fullHtml = generateReceiptHtml(order, config, 'VIA ÚNICA');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Comanda #${order.orderNumber || 'Pedido'} - AI QUE FOME</title>
        <style>
          @page {
            size: ${pageCssWidth} auto;
            margin: 0mm;
          }
          @media print {
            body {
              margin: 0;
              padding: 2mm;
            }
          }
          body {
            margin: 0;
            padding: 8px;
            background: #fff;
          }
        </style>
      </head>
      <body>
        ${fullHtml}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
