import React, { useState, useEffect } from 'react';
import { X, Flame, Bike, Store, Phone, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../types';

interface LiveOrderTrackerModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  storePhone?: string;
}

export const LiveOrderTrackerModal: React.FC<LiveOrderTrackerModalProps> = ({
  order,
  isOpen,
  onClose,
  storePhone = '5574999999999',
}) => {
  const [remainingMinutes, setRemainingMinutes] = useState<number>(30);

  useEffect(() => {
    if (isOpen && order) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FFA000', '#FFFFFF', '#FF5722'],
        });
      } catch {
        // Fallback
      }

      const countdown = setInterval(() => {
        setRemainingMinutes((prev) => Math.max(1, prev - 1));
      }, 60000);

      return () => {
        clearInterval(countdown);
      };
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const isDelivery = order.customer.deliveryMethod === 'delivery';

  // Status simplificado conforme Item 2:
  // Para ENTREGA: 1. Em preparo -> 2. Saiu para entrega
  // Para RETIRADA: 1. Em preparo -> 2. Pronto para retirada
  const isStep2Active = isDelivery
    ? order.status === 'on_the_way' || order.status === 'delivered'
    : order.status === 'ready' || order.status === 'delivered';

  const steps = isDelivery
    ? [
        {
          id: 1,
          title: 'Pedido em produção',
          desc: 'Os smash burgers estão na chapa de aço sendo prensados e preparados com carinho.',
          icon: <Flame className={`w-6 h-6 ${!isStep2Active ? 'text-[#FFA000] animate-pulse' : 'text-[#FFA000]'}`} />,
          isActive: !isStep2Active,
          isDone: isStep2Active,
        },
        {
          id: 2,
          title: 'Saiu para entrega',
          desc: 'O entregador já retirou seu pacote e está a caminho do seu endereço!',
          icon: <Bike className={`w-6 h-6 ${isStep2Active ? 'text-[#FFA000] animate-bounce' : 'text-[#666]'}`} />,
          isActive: isStep2Active,
          isDone: false,
        },
      ]
    : [
        {
          id: 1,
          title: 'Pedido em produção',
          desc: 'Seu lanche artesanal está na chapa de aço sendo preparado com carinho.',
          icon: <Flame className={`w-6 h-6 ${!isStep2Active ? 'text-[#FFA000] animate-pulse' : 'text-[#FFA000]'}`} />,
          isActive: !isStep2Active,
          isDone: isStep2Active,
        },
        {
          id: 2,
          title: 'Pronto para retirada',
          desc: 'Seu pedido está pronto e quentinho no balcão da loja aguardando você!',
          icon: <Store className={`w-6 h-6 ${isStep2Active ? 'text-[#FFA000] animate-bounce' : 'text-[#666]'}`} />,
          isActive: isStep2Active,
          isDone: false,
        },
      ];

  const currentStatusTitle = isStep2Active
    ? isDelivery
      ? 'Saiu para entrega'
      : 'Pronto para retirada'
    : 'Pedido em produção';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#121212] text-white rounded-3xl border border-[#2B2B2B] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-black text-white flex items-center justify-between shrink-0 border-b border-[#222222]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFA000] animate-ping" />
              <h2 className="font-brand text-lg text-white">
                Pedido #{order.orderNumber}
              </h2>
            </div>
            <p className="text-xs text-[#A3A3A3]">
              Tipo: <strong>{isDelivery ? 'Entrega' : 'Retirada no Balcão'}</strong>
            </p>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-grow bg-[#121212]">
          
          {/* Status Banner */}
          <div className="bg-[#181818] p-5 rounded-3xl border border-[#2B2B2B] text-center space-y-2 relative overflow-hidden">
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-bold block">
              Status Atual do Pedido
            </span>
            <div className="font-brand text-3xl sm:text-4xl text-[#FFA000] font-black">
              {currentStatusTitle}
            </div>
            <p className="text-xs text-[#888888]">
              {isDelivery ? `Previsão: ${remainingMinutes} - ${remainingMinutes + 10} min` : 'Aguarde no balcão da loja'}
            </p>
          </div>

          {/* Stepper Timeline: EXATAMENTE 2 ETAPAS SIMPLIFICADAS */}
          <div className="space-y-3">
            <span className="font-brand text-xs uppercase tracking-wider text-[#A3A3A3] block">
              Etapas do Pedido ({isDelivery ? 'Entrega' : 'Retirada'})
            </span>

            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                    step.isActive
                      ? 'bg-[#1C1C1C] border-[#FFA000] shadow-lg shadow-[#FFA000]/15'
                      : step.isDone
                      ? 'bg-[#161616] border-[#FFA000]/30'
                      : 'bg-[#121212] border-[#222222] opacity-40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h4 className="font-brand text-sm sm:text-base text-white font-bold">
                        {step.title}
                      </h4>
                      {step.isActive && (
                        <span className="text-[10px] bg-[#FFA000]/20 text-[#FFA000] border border-[#FFA000]/40 px-2 py-0.5 rounded-full font-bold">
                          Em andamento
                        </span>
                      )}
                      {step.isDone && (
                        <span className="text-[10px] bg-[#FFA000]/20 text-[#FFA000] border border-[#FFA000]/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#FFA000]" />
                          Concluído
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dados do Pedido */}
          <div className="bg-[#181818] p-4 rounded-2xl border border-[#262626] space-y-2 text-xs">
            {isDelivery ? (
              <div className="flex justify-between text-[#888888]">
                <span>Endereço de Entrega:</span>
                <span className="font-semibold text-white text-right max-w-[60%]">
                  {order.customer.address.street}, {order.customer.address.number} - {order.customer.address.neighborhood}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-[#888888]">
                <span>Retirada:</span>
                <span className="font-semibold text-white">Balcão da Loja</span>
              </div>
            )}
            <div className="flex justify-between text-[#888888]">
              <span>Total do Pedido:</span>
              <span className="font-bold text-[#FFA000]">
                R$ {order.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

        </div>

        {/* Footer Contact CTA */}
        <div className="p-4 bg-black border-t border-[#222222] flex items-center justify-between gap-3">
          <a
            href={`https://wa.me/${storePhone}?text=Ol%C3%A1!%20Gostaria%20de%20saber%20sobre%20meu%20pedido%20%23${order.orderNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#FFA000] hover:bg-[#FFB300] text-black py-3 px-4 rounded-xl font-brand font-black text-xs transition-colors shadow-md shadow-[#FFA000]/20"
          >
            <Phone className="w-4 h-4 fill-black" />
            <span>Falar com o Restaurante</span>
          </a>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-[#333333] hover:bg-[#1A1A1A] text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
