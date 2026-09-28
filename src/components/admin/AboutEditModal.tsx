import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  FileText, 
  MapPin, 
  Phone, 
  Clock, 
  Instagram, 
  Gift, 
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { DEFAULT_STORE_SETTINGS, normalizeWhatsAppNumber } from '../../utils/storeSettings';

interface AboutEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  onSave: (updatedSettings: StoreSettings) => void;
}

export const AboutEditModal: React.FC<AboutEditModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  onSave,
}) => {
  if (!isOpen) return null;

  const [aboutText, setAboutText] = useState(
    storeSettings.aboutText || DEFAULT_STORE_SETTINGS.aboutText || ''
  );
  const [footerManifesto, setFooterManifesto] = useState(
    storeSettings.footerManifesto || DEFAULT_STORE_SETTINGS.footerManifesto || ''
  );
  const [scheduleNotice, setScheduleNotice] = useState(
    storeSettings.scheduleNotice || DEFAULT_STORE_SETTINGS.scheduleNotice || ''
  );
  const [footerPromoText, setFooterPromoText] = useState(
    storeSettings.footerPromoText || DEFAULT_STORE_SETTINGS.footerPromoText || ''
  );
  const [address, setAddress] = useState(
    storeSettings.address || DEFAULT_STORE_SETTINGS.address || ''
  );
  const [phone, setPhone] = useState(
    storeSettings.phoneDisplay || storeSettings.phone || DEFAULT_STORE_SETTINGS.phone || ''
  );
  const [instagramHandle, setInstagramHandle] = useState(
    storeSettings.instagramHandle || DEFAULT_STORE_SETTINGS.instagramHandle || '@aiquefome.smash'
  );
  const [instagramUrl, setInstagramUrl] = useState(
    storeSettings.instagramUrl || DEFAULT_STORE_SETTINGS.instagramUrl || 'https://instagram.com/aiquefome.smash'
  );
  const [promoGroupLink, setPromoGroupLink] = useState(
    storeSettings.promoGroupLink || DEFAULT_STORE_SETTINGS.promoGroupLink || ''
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAboutText(storeSettings.aboutText || DEFAULT_STORE_SETTINGS.aboutText || '');
    setFooterManifesto(storeSettings.footerManifesto || DEFAULT_STORE_SETTINGS.footerManifesto || '');
    setScheduleNotice(storeSettings.scheduleNotice || DEFAULT_STORE_SETTINGS.scheduleNotice || '');
    setFooterPromoText(storeSettings.footerPromoText || DEFAULT_STORE_SETTINGS.footerPromoText || '');
    setAddress(storeSettings.address || DEFAULT_STORE_SETTINGS.address || '');
    setPhone(storeSettings.phoneDisplay || storeSettings.phone || DEFAULT_STORE_SETTINGS.phone || '');
    setInstagramHandle(storeSettings.instagramHandle || DEFAULT_STORE_SETTINGS.instagramHandle || '@aiquefome.smash');
    setInstagramUrl(storeSettings.instagramUrl || DEFAULT_STORE_SETTINGS.instagramUrl || 'https://instagram.com/aiquefome.smash');
    setPromoGroupLink(storeSettings.promoGroupLink || DEFAULT_STORE_SETTINGS.promoGroupLink || '');
  }, [storeSettings]);

  const handleResetToDefault = () => {
    if (window.confirm('Deseja restaurar todos os textos e informações para os padrões originais?')) {
      setAboutText(DEFAULT_STORE_SETTINGS.aboutText || '');
      setFooterManifesto(DEFAULT_STORE_SETTINGS.footerManifesto || '');
      setScheduleNotice(DEFAULT_STORE_SETTINGS.scheduleNotice || '');
      setFooterPromoText(DEFAULT_STORE_SETTINGS.footerPromoText || '');
      setAddress(DEFAULT_STORE_SETTINGS.address);
      setPhone(DEFAULT_STORE_SETTINGS.phoneDisplay || DEFAULT_STORE_SETTINGS.phone);
      setInstagramHandle(DEFAULT_STORE_SETTINGS.instagramHandle || '@aiquefome.smash');
      setInstagramUrl(DEFAULT_STORE_SETTINGS.instagramUrl || 'https://instagram.com/aiquefome.smash');
      setPromoGroupLink(DEFAULT_STORE_SETTINGS.promoGroupLink);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const cleanPhone = normalizeWhatsAppNumber(phone);

    const updated: StoreSettings = {
      ...storeSettings,
      aboutText: aboutText.trim(),
      footerManifesto: footerManifesto.trim(),
      scheduleNotice: scheduleNotice.trim(),
      footerPromoText: footerPromoText.trim(),
      address: address.trim(),
      phone: cleanPhone,
      phoneDisplay: phone.trim(),
      instagramHandle: instagramHandle.trim(),
      instagramUrl: instagramUrl.trim(),
      promoGroupLink: promoGroupLink.trim(),
    };

    await onSave(updated);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#141414] text-white rounded-3xl border border-[#2B2B2B] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="p-4 sm:p-5 bg-[#0D0D0D] border-b border-[#242424] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFA000] text-black flex items-center justify-center font-black shadow-md shadow-[#FFA000]/20">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-brand text-base sm:text-lg text-white font-black flex items-center gap-2">
                EDITAR SOBRE A HAMBURGUERIA
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Ao Vivo
                </span>
              </h2>
              <p className="text-xs text-[#A3A3A3]">
                Altere os textos institucionais, horários, endereço e contatos da página
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informação explicativa */}
        <div className="bg-[#FFA000]/10 border-b border-[#FFA000]/25 px-4 py-2.5 flex items-center gap-2 text-xs text-[#FFA000] shrink-0 font-medium">
          <Info className="w-4 h-4 shrink-0 text-[#FFA000]" />
          <span>Qualquer alteração salva aqui é atualizada instantaneamente no site (modal de informações e rodapé).</span>
        </div>

        {/* Formulário com rolagem */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-grow text-xs bg-[#141414]">
          
          {/* 1. Texto Principal "Sobre a Hamburgueria" */}
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-brand font-black text-xs uppercase tracking-wider text-[#FFA000] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFA000]" />
                Sobre a Hamburgueria (Modal de Informações)
              </label>
              <span className="text-[10px] text-zinc-500 font-bold">Exibido ao clicar em informações</span>
            </div>
            <textarea
              rows={3}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Digite a apresentação da sua hamburgueria..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs leading-relaxed focus:border-[#FFA000] focus:outline-hidden resize-none"
            />
            <p className="text-[11px] text-zinc-400">
              Texto que apresenta o conceito dos lanches artesanais quando o cliente abre o modal de informações da loja.
            </p>
          </div>

          {/* 2. Manifesto do Rodapé */}
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-brand font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#FFA000]" />
                Manifesto do Rodapé (Primeira Coluna)
              </label>
              <span className="text-[10px] text-zinc-500 font-bold">Rodapé do Site</span>
            </div>
            <textarea
              rows={3}
              value={footerManifesto}
              onChange={(e) => setFooterManifesto(e.target.value)}
              placeholder="Inspirado na paixão por smash burgers autênticos..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs leading-relaxed focus:border-[#FFA000] focus:outline-hidden resize-none"
            />
            <p className="text-[11px] text-zinc-400">
              Texto posicionado abaixo do logo AI QUE FOME no rodapé da página.
            </p>
          </div>

          {/* 3. Horários de Atendimento & Observação */}
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-brand font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FFA000]" />
                Horários de Atendimento (Observação)
              </label>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Nota / Observação Complementar dos Horários:
              </label>
              <input
                type="text"
                value={scheduleNotice}
                onChange={(e) => setScheduleNotice(e.target.value)}
                placeholder="*Segundas-feiras fechado para manutenção e preparação dos insumos."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs font-medium focus:border-[#FFA000] focus:outline-hidden"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Aviso explicativo que aparece no rodapé e no modal (ex: folgas semanais, preparo de insumos).
              </p>
            </div>
          </div>

          {/* 4. Onde Estamos & Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Endereço */}
            <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A] space-y-2">
              <label className="font-brand font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FFA000]" />
                Onde Estamos (Endereço)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Senhor dos Passos, 280 - Centro, Capim Grosso - BA"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs font-medium focus:border-[#FFA000] focus:outline-hidden"
              />
              <p className="text-[11px] text-zinc-400">
                Endereço físico oficial exibido aos clientes.
              </p>
            </div>

            {/* Telefone / WhatsApp */}
            <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A] space-y-2">
              <label className="font-brand font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#FFA000]" />
                Telefone / WhatsApp da Hamburgueria
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5511994225944 ou (74) 99999-9999"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs font-bold text-[#FFA000] focus:border-[#FFA000] focus:outline-hidden"
              />
              <p className="text-[11px] text-zinc-400">
                Número para onde os pedidos e dúvidas são direcionados no WhatsApp.
              </p>
            </div>
          </div>

          {/* 5. Ofertas & Redes (Grupo VIP & Instagram) */}
          <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#2A2A2A] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-brand font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#FFA000]" />
                Ofertas &amp; Redes Sociais
              </label>
            </div>

            {/* Texto da chamada */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Texto de Chamada do Rodapé:
              </label>
              <input
                type="text"
                value={footerPromoText}
                onChange={(e) => setFooterPromoText(e.target.value)}
                placeholder="Participe do nosso grupo de promoções exclusivas e acompanhe o preparo dos lanches."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs font-medium focus:border-[#FFA000] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Instagram Handle */}
              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1 flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5 text-[#FFA000]" />
                  Nome do Instagram (Ex: @aiquefome.smash)
                </label>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@aiquefome.smash"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs font-medium focus:border-[#FFA000] focus:outline-hidden"
                />
              </div>

              {/* Instagram URL */}
              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Link / URL Completo do Instagram
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/aiquefome.smash"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs font-medium focus:border-[#FFA000] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Link do Grupo VIP */}
            <div className="pt-1">
              <label className="text-[11px] font-bold text-zinc-300 block mb-1 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-emerald-400" />
                Link de Convite do Grupo de WhatsApp (Cupons VIP)
              </label>
              <input
                type="url"
                value={promoGroupLink}
                onChange={(e) => setPromoGroupLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/ExemploGrupo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#222222] border border-[#333333] text-white text-xs font-medium focus:border-[#FFA000] focus:outline-hidden"
              />
            </div>
          </div>

        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 sm:p-5 bg-[#0D0D0D] border-t border-[#242424] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#2B2B2B] text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#FFA000] hover:bg-[#FFB300] text-black font-brand font-black text-xs tracking-wider uppercase transition-all shadow-md shadow-[#FFA000]/25 hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
