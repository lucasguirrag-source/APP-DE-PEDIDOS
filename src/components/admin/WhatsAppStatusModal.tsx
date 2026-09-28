import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Flame, 
  Sparkles, 
  Bike, 
  CheckCheck, 
  Phone, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Order } from '../../types';
import { 
  buildStatusWhatsAppMessage, 
  sendWhatsAppMessage, 
  MessageStatusKey 
} from '../../utils/whatsappTemplates';

interface WhatsAppStatusModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const WhatsAppStatusModal: React.FC<WhatsAppStatusModalProps> = ({
  order,
  isOpen,
  onClose,
  showToast,
}) => {
  if (!isOpen || !order) return null;

  const initialKey: MessageStatusKey =
    order.status === 'received' || order.status === 'preparing'
      ? 'preparing'
      : order.status === 'ready'
      ? 'ready'
      : order.status === 'on_the_way'
      ? 'on_the_way'
      : 'delivered';

  const [selectedStatus, setSelectedStatus] = useState<MessageStatusKey>(initialKey);
  const [messageContent, setMessageContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Quando o status selecionado muda ou a ordem muda, regenera o modelo
  useEffect(() => {
    const text = buildStatusWhatsAppMessage(order, selectedStatus);
    setMessageContent(text);
  }, [order, selectedStatus]);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent);
    setCopied(true);
    showToast('Mensagem copiada para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    const phone = order.customer?.phone || '';
    if (!phone) {
      showToast('Este pedido não possui telefone cadastrado.');
      return;
    }
    sendWhatsAppMessage(phone, messageContent);
    showToast(`WhatsApp aberto para ${order.customer?.name || 'Cliente'}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white text-zinc-900 border-2 border-black rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-black text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center font-black shadow-md">
              <MessageSquare className="w-5 h-5 fill-white stroke-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-brand font-black text-lg text-white">
                  Mensagem no WhatsApp
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#FF7A00] text-black font-black text-[11px]">
                  #{order.orderNumber || order.id.slice(-4)}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium">
                Cliente: <strong className="text-white">{order.customer?.name}</strong> • {order.customer?.phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-grow bg-white">
          {/* Seletor de Modelo de Status */}
          <div className="space-y-2">
            <label className="font-brand text-xs uppercase tracking-wider text-zinc-900 font-black block">
              Escolha a Mensagem Pronta por Etapa:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('preparing')}
                className={`p-2 rounded-xl border-2 font-brand font-black text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedStatus === 'preparing'
                    ? 'bg-[#FF7A00] text-black border-black shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-black'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Em Preparo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('ready')}
                className={`p-2 rounded-xl border-2 font-brand font-black text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedStatus === 'ready'
                    ? 'bg-emerald-500 text-black border-black shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-black'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Pronto</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('on_the_way')}
                className={`p-2 rounded-xl border-2 font-brand font-black text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedStatus === 'on_the_way'
                    ? 'bg-blue-600 text-white border-black shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-black'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Na Entrega</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('delivered')}
                className={`p-2 rounded-xl border-2 font-brand font-black text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedStatus === 'delivered'
                    ? 'bg-zinc-800 text-white border-black shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-black'
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                <span>Entregue</span>
              </button>
            </div>
          </div>

          {/* Aviso sobre envio manual */}
          <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-start gap-2 text-xs text-amber-900 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Envio 100% sob seu comando:</strong> O WhatsApp só é aberto quando você clicar em <strong>"Enviar no WhatsApp"</strong> abaixo. Nenhuma mensagem é disparada automaticamente ao alterar status.
            </span>
          </div>

          {/* Pré-visualização da Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-700">
                Texto da Mensagem (pode editar antes de enviar se quiser):
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-zinc-600 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <textarea
              rows={11}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="w-full p-3.5 rounded-2xl border-2 border-black bg-zinc-50 text-xs text-zinc-900 font-mono leading-relaxed focus:outline-hidden focus:border-[#FF7A00] resize-none"
            />
          </div>
        </div>

        {/* Rodapé / Ações */}
        <div className="p-4 sm:p-5 bg-zinc-100 border-t-2 border-black flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border-2 border-zinc-300 hover:border-black text-xs font-bold text-zinc-700 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-brand font-black text-xs sm:text-sm tracking-wide shadow-md border-2 border-black flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4 fill-white stroke-none" />
            <span>Enviar no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
