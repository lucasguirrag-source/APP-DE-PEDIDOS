import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  ExternalLink, 
  MapPin, 
  ChevronRight, 
  X,
  Clock,
  Sparkles,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Order } from '../../types';

interface CustomerManagerProps {
  orders: Order[];
  showToast: (msg: string) => void;
}

interface AggregatedCustomer {
  phone: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  lastOrderDate: string;
  addresses: string[];
  orders: Order[];
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ orders, showToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<AggregatedCustomer | null>(null);

  // Group and aggregate customers based on orders
  const customersList = useMemo(() => {
    const customerMap = new Map<string, AggregatedCustomer>();

    orders.forEach((order) => {
      const rawPhone = order.customer?.phone?.replace(/\D/g, '') || 'sem-telefone';
      const name = order.customer?.name || 'Cliente';
      const key = rawPhone !== 'sem-telefone' ? rawPhone : `name-${name.toLowerCase().trim()}`;

      const addrStr = order.customer?.address
        ? `${order.customer.address.street}, ${order.customer.address.number} - ${order.customer.address.neighborhood}`
        : 'Retirada no balcão';

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          phone: order.customer?.phone || '',
          name: name,
          totalOrders: 1,
          totalSpent: order.total,
          averageTicket: order.total,
          lastOrderDate: order.createdAt || 'Hoje',
          addresses: addrStr ? [addrStr] : [],
          orders: [order],
        });
      } else {
        const existing = customerMap.get(key)!;
        existing.totalOrders += 1;
        existing.totalSpent += order.total;
        existing.averageTicket = existing.totalSpent / existing.totalOrders;
        if (addrStr && !existing.addresses.includes(addrStr)) {
          existing.addresses.push(addrStr);
        }
        existing.orders.push(order);
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Filtered by search
  const filteredCustomers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return customersList;
    return customersList.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.replace(/\D/g, '').includes(query) ||
        c.addresses.some((a) => a.toLowerCase().includes(query))
    );
  }, [customersList, searchTerm]);

  // Total summary metrics
  const totalUniqueCustomers = customersList.length;
  const totalRevenueAllCustomers = customersList.reduce((acc, c) => acc + c.totalSpent, 0);
  const averageSpendPerCustomer = totalUniqueCustomers > 0 ? totalRevenueAllCustomers / totalUniqueCustomers : 0;

  const handleOpenWhatsApp = (phone: string, name: string) => {
    let clean = phone.replace(/\D/g, '');
    if (!clean) {
      showToast('Telefone inválido ou não informado.');
      return;
    }
    if (!clean.startsWith('55') && clean.length >= 10) {
      clean = `55${clean}`;
    }
    const message = encodeURIComponent(`Olá, ${name}! Tudo bem? Aqui é da Hamburgueria AI QUE FOME em Capim Grosso!🍔`);
    window.open(`https://wa.me/${clean}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-black text-white p-5 sm:p-6 rounded-3xl border-2 border-black shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FF7A00] text-black font-black flex items-center justify-center">
                <Users className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-brand font-black text-white">
                Base de Clientes
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1">
              Consulte o histórico detalhado, frequência de pedidos e valor total gasto de cada cliente em Capim Grosso.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Clientes</span>
              <strong className="text-base sm:text-lg font-brand font-black text-[#FF7A00]">
                {totalUniqueCustomers}
              </strong>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Total Gasto</span>
              <strong className="text-base sm:text-lg font-brand font-black text-emerald-400">
                R$ {totalRevenueAllCustomers.toFixed(0)}
              </strong>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">Ticket Médio</span>
              <strong className="text-base sm:text-lg font-brand font-black text-amber-400">
                R$ {averageSpendPerCustomer.toFixed(0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente por nome, telefone ou bairro..."
          className="w-full pl-11 pr-4 py-3 bg-white border-2 border-black rounded-2xl font-bold text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#FF7A00] shadow-sm"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Customers Cards & List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border-2 border-black text-center space-y-3 shadow-md">
          <div className="w-14 h-14 rounded-full bg-orange-100 text-[#FF7A00] flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-brand font-black text-base text-zinc-900">Nenhum cliente encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Tente pesquisar por outro nome ou número de telefone.'
              : 'Assim que novos pedidos forem realizados, os clientes aparecerão aqui automaticamente.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-black rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all space-y-3 relative group flex flex-col justify-between"
            >
              <div>
                {/* Header with Name & Orders count */}
                <div className="flex items-start justify-between gap-2 border-b-2 border-zinc-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-black font-brand font-black flex items-center justify-center text-sm border-2 border-black">
                      {customer.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-brand font-black text-sm text-zinc-900 line-clamp-1">
                        {customer.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-bold">
                        <Phone className="w-3 h-3 text-[#FF7A00]" />
                        <span>{customer.phone || 'Sem número'}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-[#FF7A00] text-[11px] font-brand font-black whitespace-nowrap">
                    {customer.totalOrders} {customer.totalOrders === 1 ? 'pedido' : 'pedidos'}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">Total Gasto</span>
                    <strong className="text-sm font-black text-emerald-600">
                      R$ {customer.totalSpent.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">Ticket Médio</span>
                    <strong className="text-sm font-black text-amber-600">
                      R$ {customer.averageTicket.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                </div>

                {/* Primary Address */}
                {customer.addresses.length > 0 && (
                  <div className="text-[11px] text-zinc-600 flex items-start gap-1.5 bg-orange-50/60 p-2 rounded-xl border border-orange-100">
                    <MapPin className="w-3.5 h-3.5 text-[#FF7A00] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{customer.addresses[0]}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(customer)}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-black text-white font-brand font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Ver Histórico</span>
                </button>

                {customer.phone && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(customer.phone, customer.name)}
                    className="p-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white border-2 border-black transition-colors cursor-pointer"
                    title="Conversar no WhatsApp"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border-2 border-black rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b-2 border-black flex items-center justify-between bg-zinc-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FF7A00] text-black font-brand font-black flex items-center justify-center border-2 border-black text-base">
                  {selectedCustomer.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-brand font-black text-lg text-zinc-900">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-600 font-bold">
                    <span>{selectedCustomer.phone || 'Sem telefone'}</span>
                    <span>•</span>
                    <span className="text-[#FF7A00]">{selectedCustomer.totalOrders} pedidos realizados</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl hover:bg-zinc-200 text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content: Orders History List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-grow">
              <div className="flex items-center justify-between">
                <h4 className="font-brand font-black text-sm text-zinc-900 uppercase tracking-wider">
                  Histórico de Pedidos
                </h4>
                <span className="text-xs font-black text-emerald-600">
                  Total acumulado: R$ {selectedCustomer.totalSpent.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="space-y-3">
                {selectedCustomer.orders.map((order, orderIdx) => (
                  <div
                    key={order.id || orderIdx}
                    className="p-4 rounded-2xl border-2 border-zinc-200 bg-zinc-50 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs border-b border-zinc-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-brand font-black text-sm text-[#FF7A00]">
                          #{order.orderNumber || order.id.slice(-4)}
                        </span>
                        <span className="text-zinc-500 font-mono">
                          {order.createdAt || 'Recent'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 font-bold text-[10px]">
                          {order.customer?.deliveryMethod === 'pickup' ? '🏬 Balcão' : '🛵 Entrega'}
                        </span>
                      </div>
                      <strong className="font-brand font-black text-base text-zinc-900">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </strong>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 text-xs text-zinc-800">
                      {order.items.map((cartItem, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-start">
                          <div>
                            <span className="font-black mr-1 text-[#FF7A00]">{cartItem.quantity}x</span>
                            <span className="font-bold">{cartItem.item.name}</span>
                            {cartItem.selectedExtras && cartItem.selectedExtras.length > 0 && (
                              <div className="text-[10px] text-zinc-500 pl-4">
                                + {cartItem.selectedExtras.map((e) => e.name).join(', ')}
                              </div>
                            )}
                            {cartItem.notes && (
                              <div className="text-[10px] italic text-zinc-500 pl-4">
                                Obs: {cartItem.notes}
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-zinc-600">
                            R$ {cartItem.totalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Address */}
                    {order.customer?.deliveryMethod === 'delivery' && order.customer?.address && (
                      <div className="text-[11px] text-zinc-600 bg-white p-2 rounded-xl border border-zinc-200 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF7A00] shrink-0 mt-0.5" />
                        <span>
                          {order.customer.address.street}, {order.customer.address.number} - {order.customer.address.neighborhood}
                          {order.customer.address.complement && ` (${order.customer.address.complement})`}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-black flex items-center justify-between bg-zinc-50 rounded-b-3xl">
              {selectedCustomer.phone ? (
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(selectedCustomer.phone, selectedCustomer.name)}
                  className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-brand font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer border-2 border-black"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Chamar no WhatsApp</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 font-bold text-xs text-zinc-800 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
