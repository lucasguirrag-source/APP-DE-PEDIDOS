import { Order } from '../types';

export type MessageStatusKey = 'preparing' | 'ready' | 'on_the_way' | 'delivered';

export const formatOrderItemsForWhatsApp = (order: Order): string => {
  return order.items
    .map((cartItem) => {
      let line = `• ${cartItem.quantity}x ${cartItem.item.name}`;
      const details: string[] = [];

      if (cartItem.selectedBread) {
        details.push(`Pão ${cartItem.selectedBread}`);
      }
      if (cartItem.selectedDoneness) {
        details.push(`Ponto: ${cartItem.selectedDoneness}`);
      }
      if (cartItem.selectedExtras && cartItem.selectedExtras.length > 0) {
        details.push(
          cartItem.selectedExtras
            .map((e) => `+ ${e.quantity > 1 ? `${e.quantity}x ` : ''}${e.name}`)
            .join(', ')
        );
      }
      if (cartItem.selectedRemovals && cartItem.selectedRemovals.length > 0) {
        details.push(`Sem: ${cartItem.selectedRemovals.join(', ')}`);
      }
      if (details.length > 0) {
        line += `\n  (${details.join(' | ')})`;
      }
      if (cartItem.notes) {
        line += `\n  Obs: "${cartItem.notes}"`;
      }
      return line;
    })
    .join('\n');
};

export const formatAddressForWhatsApp = (order: Order): string => {
  if (order.customer.deliveryMethod === 'pickup') {
    return 'Retirada no Balcão da Loja';
  }
  const addr = order.customer.address;
  if (!addr) return 'Endereço a confirmar';
  let text = `${addr.street}, ${addr.number}`;
  if (addr.neighborhood) text += ` - ${addr.neighborhood}`;
  if (addr.complement) text += ` (${addr.complement})`;
  if (addr.reference) text += `\nPonto de Ref: ${addr.reference}`;
  return text;
};

/**
 * Retorna a mensagem formatada para o status especificado ou o status atual do pedido.
 */
export const buildStatusWhatsAppMessage = (
  order: Order,
  targetStatus?: MessageStatusKey | Order['status']
): string => {
  const currentKey: MessageStatusKey =
    targetStatus === 'received' || targetStatus === 'preparing'
      ? 'preparing'
      : targetStatus === 'ready'
      ? 'ready'
      : targetStatus === 'on_the_way'
      ? 'on_the_way'
      : targetStatus === 'delivered'
      ? 'delivered'
      : order.status === 'received' || order.status === 'preparing'
      ? 'preparing'
      : order.status === 'ready'
      ? 'ready'
      : order.status === 'on_the_way'
      ? 'on_the_way'
      : 'delivered';

  const nome = order.customer?.name || 'Cliente';
  const numero_pedido = order.orderNumber || order.id.slice(-4);
  const valor = order.total.toFixed(2).replace('.', ',');
  const itens_do_pedido = formatOrderItemsForWhatsApp(order);
  const endereco = formatAddressForWhatsApp(order);
  const isPickup = order.customer.deliveryMethod === 'pickup';

  switch (currentKey) {
    case 'preparing':
      return `Olá, ${nome}! 👋

Aqui é do Ai que Fome Smash 🍔

Recebemos seu pedido #${numero_pedido} e ele já está em preparo! 🔥

🛍️ Seu pedido:
${itens_do_pedido}

📍 Endereço de entrega:
${endereco}

💰 Valor do pedido:
R$ ${valor}

Assim que estiver pronto, avisaremos você por aqui. 😉

Obrigado por pedir com o Ai que Fome Smash! ❤️`;

    case 'ready':
      if (isPickup) {
        return `Olá, ${nome}! 👋

Seu pedido #${numero_pedido} do Ai que Fome Smash está pronto! 🍔🔥

🛍️ Pedido:
${itens_do_pedido}

💰 Valor:
R$ ${valor}

📍 Retirada:
Seu pedido já pode ser retirado!

Estamos te esperando. 😋`;
      } else {
        return `Olá, ${nome}! 👋

Seu pedido #${numero_pedido} do Ai que Fome Smash está pronto! 🍔🔥

🛍️ Pedido:
${itens_do_pedido}

💰 Valor:
R$ ${valor}

📍 Endereço:
${endereco}

📍 Entrega:
Seu pedido está quentinho e sendo embalado para o motoboy sair!

Logo avisaremos assim que sair para entrega. 🛵💨`;
      }

    case 'on_the_way':
      return `Fique ligado, ${nome}! 👀🛵

Seu pedido #${numero_pedido} do Ai que Fome Smash saiu para entrega! 🔥

🛍️ Pedido:
${itens_do_pedido}

📍 Endereço:
${endereco}

💰 Valor:
R$ ${valor}

Em breve seu Smash estará chegando até você. 🍔❤️`;

    case 'delivered':
      return `Olá, ${nome}! 🎉🍔

Seu pedido #${numero_pedido} do Ai que Fome Smash foi entregue!

Esperamos que você aproveite muito cada mordida. Bom apetite! 😋❤️

Obrigado por pedir com o Ai que Fome Smash!`;
  }
};

export const sendWhatsAppMessage = (phone: string, text: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return;
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
};
