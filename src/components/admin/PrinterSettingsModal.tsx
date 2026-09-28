import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  X, 
  Type, 
  Sliders, 
  Check, 
  RotateCcw, 
  FileText, 
  Layers, 
  Eye, 
  Sparkles 
} from 'lucide-react';
import { 
  PrinterLayoutConfig, 
  getPrinterConfig, 
  savePrinterConfig, 
  resetPrinterConfig, 
  triggerTestPrint,
  getFontSizePx,
  getFontFamilyCss,
  getLineHeightValue,
  getDividerCss
} from '../../utils/printerSettings';

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [config, setConfig] = useState<PrinterLayoutConfig>(() => getPrinterConfig());
  const [activeTab, setActiveTab] = useState<'paper' | 'preview'>('paper');

  useEffect(() => {
    if (isOpen) {
      setConfig(getPrinterConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateConfig = (patch: Partial<PrinterLayoutConfig>) => {
    const updated = { ...config, ...patch };
    setConfig(updated);
    savePrinterConfig(updated);
  };

  const handleReset = () => {
    const def = resetPrinterConfig();
    setConfig(def);
    showToast('Configurações de papel e fonte restauradas para o padrão!');
  };

  const handleTestPrint = () => {
    savePrinterConfig(config);
    triggerTestPrint(config);
    showToast('Abrindo diálogo de impressão para teste...');
  };

  const handleSave = () => {
    savePrinterConfig(config);
    showToast('Configurações de papel e letras salvas com sucesso!');
    onClose();
  };

  const previewWidth = config.paperSize === '58mm' ? 'max-w-[280px]' : 'max-w-[340px]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#141414] border border-[#2D2D2D] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden">
        
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF7A00]/15 border border-[#FF7A00]/30 text-[#FF7A00] flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-brand font-black text-lg text-white">Configurações de Impressão & Papel</h3>
              <p className="text-xs text-[#8E8E8E]">Ajuste a bobina, tamanho das letras, fontes e layout da comanda</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Alternador Mobile (Config vs Prévia) */}
            <div className="flex sm:hidden bg-[#1F1F1F] p-1 rounded-xl border border-[#333]">
              <button
                type="button"
                onClick={() => setActiveTab('paper')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  activeTab === 'paper' ? 'bg-[#FF7A00] text-black' : 'text-zinc-400'
                }`}
              >
                Ajustes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  activeTab === 'preview' ? 'bg-[#FF7A00] text-black' : 'text-zinc-400'
                }`}
              >
                Prévia
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#777] hover:text-white bg-[#1F1F1F] hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo do Modal em 2 Colunas no Desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5">
          
          {/* COLUNA ESQUERDA: Controles de Configuração */}
          <div className={`sm:col-span-7 space-y-5 ${activeTab === 'preview' ? 'hidden sm:block' : 'block'}`}>
            
            {/* 1. LARGURA DO PAPEL / BOBINA */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#FFA000] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>1. Largura da Bobina / Papel</span>
              </label>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => updateConfig({ paperSize: '58mm' })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    config.paperSize === '58mm'
                      ? 'bg-[#FF7A00]/15 border-[#FF7A00] text-white ring-1 ring-[#FF7A00]'
                      : 'bg-[#1C1C1C] border-[#2E2E2E] text-zinc-300 hover:border-[#444]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-brand font-black text-sm">Bobina 58mm</span>
                    {config.paperSize === '58mm' && (
                      <span className="w-4 h-4 rounded-full bg-[#FF7A00] text-black flex items-center justify-center text-[10px] font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 block">Padrão mini térmica (Mais econômica)</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateConfig({ paperSize: '80mm' })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    config.paperSize === '80mm'
                      ? 'bg-[#FF7A00]/15 border-[#FF7A00] text-white ring-1 ring-[#FF7A00]'
                      : 'bg-[#1C1C1C] border-[#2E2E2E] text-zinc-300 hover:border-[#444]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-brand font-black text-sm">Bobina 80mm</span>
                    {config.paperSize === '80mm' && (
                      <span className="w-4 h-4 rounded-full bg-[#FF7A00] text-black flex items-center justify-center text-[10px] font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 block">Bobina larga tradicional (Mais espaço)</span>
                </button>
              </div>
            </div>

            {/* 2. TAMANHO DAS LETRAS / FONTE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#FFA000] uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>2. Tamanho das Letras</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'small', label: 'Pequeno', sizeLabel: '11px', desc: 'Compacto' },
                  { key: 'medium', label: 'Médio', sizeLabel: '13px', desc: 'Padrão' },
                  { key: 'large', label: 'Grande', sizeLabel: '15px', desc: 'Cozinha' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => updateConfig({ fontSize: s.key as any })}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      config.fontSize === s.key
                        ? 'bg-[#FF7A00]/15 border-[#FF7A00] text-white ring-1 ring-[#FF7A00]'
                        : 'bg-[#1C1C1C] border-[#2E2E2E] text-zinc-300 hover:border-[#444]'
                    }`}
                  >
                    <div className="font-brand font-black text-xs sm:text-sm">{s.label}</div>
                    <div className="text-[10px] text-zinc-400">{s.sizeLabel} • {s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. TIPO DE FONTE (FAMÍLIA) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#FFA000] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>3. Estilo / Família da Fonte</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'monospace', name: 'Monospace', sample: 'Courier', desc: 'Clássico Maquininha' },
                  { key: 'sans-serif', name: 'Moderna', sample: 'Inter', desc: 'Sem Serifa Limpa' },
                  { key: 'condensed', name: 'Compacta', sample: 'Condensada', desc: 'Estreita Econômica' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => updateConfig({ fontFamily: f.key as any })}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      config.fontFamily === f.key
                        ? 'bg-[#FF7A00]/15 border-[#FF7A00] text-white ring-1 ring-[#FF7A00]'
                        : 'bg-[#1C1C1C] border-[#2E2E2E] text-zinc-300 hover:border-[#444]'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{f.name}</div>
                    <div className="text-[10px] text-zinc-400">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. ESPAÇAMENTO ENTRE LINHAS */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#FFA000] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>4. Espaçamento entre Linhas</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'tight', label: 'Compacto', sub: 'Poupa papel' },
                  { key: 'normal', label: 'Normal', sub: 'Padrão térmico' },
                  { key: 'relaxed', label: 'Expandido', sub: 'Leitura fácil' },
                ].map((lh) => (
                  <button
                    key={lh.key}
                    type="button"
                    onClick={() => updateConfig({ lineHeight: lh.key as any })}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      config.lineHeight === lh.key
                        ? 'bg-[#FF7A00]/15 border-[#FF7A00] text-white ring-1 ring-[#FF7A00]'
                        : 'bg-[#1C1C1C] border-[#2E2E2E] text-zinc-400 hover:border-[#444]'
                    }`}
                  >
                    <div className="text-xs font-bold">{lh.label}</div>
                    <div className="text-[10px] text-zinc-500">{lh.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. OPÇÕES AVANÇADAS DE DESTAQUE */}
            <div className="p-3.5 rounded-2xl bg-[#1A1A1A] border border-[#2B2B2B] space-y-3">
              <div className="text-xs font-bold text-[#FFA000] uppercase tracking-wider">
                Destaques na Impressão
              </div>

              {/* Toggle: Negrito no nome do produto */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Nome do Lanche em Negrito</span>
                  <span className="text-[11px] text-zinc-400">Ajuda o chapeiro a ler rápido os itens</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.boldItemNames}
                    onChange={(e) => updateConfig({ boldItemNames: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF7A00]"></div>
                </label>
              </div>

              {/* Toggle: Destacar observações */}
              <div className="flex items-center justify-between pt-1 border-t border-[#262626]">
                <div>
                  <span className="text-xs font-bold text-white block">Destacar Observações do Cliente</span>
                  <span className="text-[11px] text-zinc-400">Coloca fundo cinza escuro nas notas (Ex: sem cebola)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.highlightNotes}
                    onChange={(e) => updateConfig({ highlightNotes: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF7A00]"></div>
                </label>
              </div>

              {/* Vias de Impressão */}
              <div className="flex items-center justify-between pt-1 border-t border-[#262626]">
                <div>
                  <span className="text-xs font-bold text-white block">Vias de Impressão</span>
                  <span className="text-[11px] text-zinc-400">1 via para cozinha ou 2 vias (cozinha + cliente)</span>
                </div>
                <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-[#333]">
                  <button
                    type="button"
                    onClick={() => updateConfig({ copies: 1 })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      config.copies === 1 ? 'bg-[#FF7A00] text-black' : 'text-zinc-400'
                    }`}
                  >
                    1 Via
                  </button>
                  <button
                    type="button"
                    onClick={() => updateConfig({ copies: 2 })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      config.copies === 2 ? 'bg-[#FF7A00] text-black' : 'text-zinc-400'
                    }`}
                  >
                    2 Vias
                  </button>
                </div>
              </div>

              {/* Linhas Divisórias */}
              <div className="flex items-center justify-between pt-1 border-t border-[#262626]">
                <div>
                  <span className="text-xs font-bold text-white block">Linha Divisória</span>
                  <span className="text-[11px] text-zinc-400">Estilo dos separadores do cupom</span>
                </div>
                <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-[#333]">
                  <button
                    type="button"
                    onClick={() => updateConfig({ printDivider: 'dashed' })}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      config.printDivider === 'dashed' ? 'bg-[#FF7A00] text-black' : 'text-zinc-400'
                    }`}
                  >
                    - - - -
                  </button>
                  <button
                    type="button"
                    onClick={() => updateConfig({ printDivider: 'double' })}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      config.printDivider === 'double' ? 'bg-[#FF7A00] text-black' : 'text-zinc-400'
                    }`}
                  >
                    ====
                  </button>
                  <button
                    type="button"
                    onClick={() => updateConfig({ printDivider: 'solid' })}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      config.printDivider === 'solid' ? 'bg-[#FF7A00] text-black' : 'text-zinc-400'
                    }`}
                  >
                    ————
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: Prévia ao Vivo da Bobina Térmica */}
          <div className={`sm:col-span-5 flex flex-col items-center justify-start ${activeTab === 'paper' ? 'hidden sm:flex' : 'flex'}`}>
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFA000] uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5" />
                <span>Prévia ao Vivo</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 bg-[#1F1F1F] px-2 py-0.5 rounded-md border border-[#333]">
                {config.paperSize} • {getFontSizePx(config.fontSize)}
              </span>
            </div>

            {/* Simulação física da bobina saindo da impressora */}
            <div className="w-full bg-[#181818] border border-[#2B2B2B] rounded-3xl p-3 flex flex-col items-center">
              
              {/* Slot da impressora térmica */}
              <div className="w-32 h-2.5 bg-zinc-800 rounded-full mb-2 border border-zinc-700 shadow-inner" />

              {/* Papel Térmico com serrilha e sombra */}
              <div 
                className={`w-full ${previewWidth} bg-white text-black p-3.5 rounded-lg shadow-2xl transition-all duration-200 border border-gray-300 relative`}
                style={{
                  fontFamily: getFontFamilyCss(config.fontFamily),
                  fontSize: getFontSizePx(config.fontSize),
                  lineHeight: getLineHeightValue(config.lineHeight),
                }}
              >
                {/* Serrilha decorativa no topo */}
                <div className="absolute -top-1.5 left-0 right-0 h-1.5 bg-[radial-gradient(circle,transparent_2px,#fff_2px)] bg-[length:6px_6px]" />

                {/* Conteúdo do Cupom Teste */}
                <div className="text-center font-bold pb-1">
                  <div className="text-[1.2em] font-black tracking-tight">AI QUE FOME SMASH</div>
                  <div className="text-[0.8em] text-gray-700">DELIVERY & BALCÃO</div>
                </div>

                <div 
                  className="my-1.5" 
                  style={{ borderTop: config.printDivider === 'double' ? '2px double #000' : config.printDivider === 'solid' ? '1px solid #000' : '1px dashed #000' }}
                />

                <div className="text-center font-bold text-[1.1em]">
                  PEDIDO #104
                </div>
                <div className="text-center text-[0.85em] text-gray-600">
                  Hoje às 19:42 • Delivery
                </div>

                <div 
                  className="my-1.5" 
                  style={{ borderTop: config.printDivider === 'double' ? '2px double #000' : config.printDivider === 'solid' ? '1px solid #000' : '1px dashed #000' }}
                />

                <div className="text-[0.9em]">
                  <strong>Cliente:</strong> Marcos Ribeiro<br/>
                  <strong>Rua:</strong> Av. Paulista, 1500 - Ap 32
                </div>

                <div 
                  className="my-1.5" 
                  style={{ borderTop: config.printDivider === 'double' ? '2px double #000' : config.printDivider === 'solid' ? '1px solid #000' : '1px dashed #000' }}
                />

                <div className="space-y-1.5">
                  <div>
                    <div className={`flex justify-between ${config.boldItemNames ? 'font-bold' : ''}`}>
                      <span>1x Smash Salad Duplo</span>
                      <span>R$ 32,00</span>
                    </div>
                    <div className="text-[0.85em] text-gray-700">
                      • Pão Brioche Selado<br/>
                      • Ponto: Ao ponto
                    </div>
                    {config.highlightNotes && (
                      <div className="text-[0.85em] bg-gray-200 px-1.5 py-0.5 rounded-sm font-bold border-l-2 border-black mt-0.5">
                        OBS: Sem tomate, dobro de maionese
                      </div>
                    )}
                  </div>

                  <div className="pt-1 border-t border-gray-200">
                    <div className={`flex justify-between ${config.boldItemNames ? 'font-bold' : ''}`}>
                      <span>1x Batata Rústica</span>
                      <span>R$ 14,00</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="my-1.5" 
                  style={{ borderTop: config.printDivider === 'double' ? '2px double #000' : config.printDivider === 'solid' ? '1px solid #000' : '1px dashed #000' }}
                />

                <div className="text-[0.9em] flex justify-between font-black text-[1.1em]">
                  <span>TOTAL:</span>
                  <span>R$ 46,00</span>
                </div>
                <div className="text-[0.85em] text-gray-700">
                  Forma: PIX
                </div>

                <div 
                  className="my-1.5" 
                  style={{ borderTop: config.printDivider === 'double' ? '2px double #000' : config.printDivider === 'solid' ? '1px solid #000' : '1px dashed #000' }}
                />

                <div className="text-center text-[0.75em] text-gray-600">
                  {config.copies === 2 ? 'Via 1 de 2 • Cozinha' : 'Obrigado pela preferência!'}
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 mt-2 text-center">
                Visualização ao vivo proporcional à bobina térmica
              </div>
            </div>

          </div>

        </div>

        {/* Rodapé com Ações */}
        <div className="px-5 py-4 border-t border-[#262626] bg-[#111] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#333] text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestPrint}
              className="px-4 py-2.5 rounded-xl bg-[#242424] hover:bg-[#2F2F2F] border border-[#3E3E3E] text-white text-xs font-brand font-black flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#FF7A00]" />
              <span>Imprimir Teste</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#FF8F00] text-black text-xs font-brand font-black transition-all cursor-pointer shadow-lg shadow-[#FF7A00]/20"
            >
              Salvar Ajustes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
