import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  Square, 
  Upload, 
  Trash2, 
  Sparkles, 
  Music, 
  Radio, 
  Check, 
  Play, 
  Flame, 
  AlertCircle 
} from 'lucide-react';
import { soundAlert } from '../../utils/soundAlert';

interface EdilmaSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const EdilmaSoundModal: React.FC<EdilmaSoundModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  if (!isOpen) return null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCustomAudio, setHasCustomAudio] = useState(false);
  const [audioFileName, setAudioFileName] = useState('');
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    const custom = soundAlert.getCustomAudio();
    setHasCustomAudio(!!custom);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      setCountdown(10);
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(0);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const handlePlay = () => {
    if (isPlaying) {
      soundAlert.stop();
      setIsPlaying(false);
      showToast('Áudio interrompido.');
      return;
    }

    setIsPlaying(true);
    soundAlert.speakAlert();
    showToast('🔥🎶 Gritando: "EDIIIIIIIIIILMA SAIIIIIU PEDIDOOOOOOOI"!');
  };

  const handleStop = () => {
    soundAlert.stop();
    setIsPlaying(false);
    showToast('Áudio interrompido.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      showToast('Por favor selecione um arquivo de áudio válido (.mp3, .wav, etc.)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Arquivo muito grande. Limite de 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (base64) {
        soundAlert.setCustomAudio(base64);
        setHasCustomAudio(true);
        setAudioFileName(file.name);
        showToast('Música IA personalizada salva com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAudio = () => {
    soundAlert.setCustomAudio(null);
    setHasCustomAudio(false);
    setAudioFileName('');
    showToast('Música personalizada removida. Usando grito nativo sintetizado de 10s!');
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
            <div className="w-10 h-10 rounded-2xl bg-[#FF7A00] text-black flex items-center justify-center font-black shadow-md">
              <Flame className="w-5 h-5 fill-black stroke-none" />
            </div>
            <div>
              <h3 className="font-brand font-black text-lg text-white">
                Grito da Edilma (10 Segundos)
              </h3>
              <p className="text-xs text-zinc-300 font-medium">
                Alerta cantado estilo música com IA para novos pedidos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-white flex-grow">
          
          {/* Card do Player Principal */}
          <div className="p-5 rounded-2xl bg-orange-50 border-2 border-[#FF7A00] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF7A00] animate-ping" />
                <span className="font-brand font-black text-xs uppercase tracking-wider text-[#E65100]">
                  {isPlaying ? `Tocando (${countdown}s restantes)` : 'Pronto para tocar'}
                </span>
              </div>
              <span className="text-[11px] font-bold bg-white px-2.5 py-1 rounded-full border border-orange-200 text-zinc-700">
                ⏱️ Duração: 10s
              </span>
            </div>

            {/* Letra Cantada */}
            <div className="bg-white p-3.5 rounded-xl border border-orange-200 text-center space-y-1">
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Voz Cantada & Gritada:
              </p>
              <p className="font-brand font-black text-sm sm:text-base text-zinc-900 tracking-tight leading-snug">
                “EDIIIIIIIIIILMA! SAIIIIIU PEDIDOOOOOOOI!”
              </p>
              <p className="text-xs text-[#E65100] font-bold">
                (Com buzina de DJ, beat 130 BPM, sintetizador e metais)
              </p>
            </div>

            {/* Botão de Tocar / Parar */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlay}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-brand font-black text-sm tracking-wide shadow-md border-2 border-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : 'bg-[#FF7A00] hover:bg-[#ff8f26] text-black hover:scale-105 active:scale-95'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-white stroke-none" />
                    <span>PARAR SOM AGORA ({countdown}s)</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 stroke-[2.5]" />
                    <span>SOLTAR O GRITO CANTADO (10s)</span>
                  </>
                )}
              </button>

              {isPlaying && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-4 py-3.5 rounded-2xl bg-black text-white font-black text-xs border-2 border-black hover:bg-zinc-800 cursor-pointer"
                >
                  Silenciar
                </button>
              )}
            </div>
          </div>

          {/* Seção de Música IA Customizada (Suno / Udio / Gravação MP3) */}
          <div className="p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-200 space-y-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#FF7A00]" />
              <h4 className="font-brand font-black text-sm text-zinc-900">
                Tem uma música gerada por IA (Suno / Udio)?
              </h4>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              Se você gerou uma música da Edilma no Suno AI, Udio ou gravou um áudio no celular, você pode carregar o arquivo <strong>.mp3</strong> aqui para tocar sempre que sair pedido!
            </p>

            {hasCustomAudio ? (
              <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Áudio personalizado ativo {audioFileName ? `(${audioFileName})` : ''}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCustomAudio}
                  className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors cursor-pointer"
                  title="Remover e voltar ao grito nativo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-300 hover:border-black rounded-2xl bg-white cursor-pointer transition-all group">
                <Upload className="w-6 h-6 text-zinc-400 group-hover:text-black mb-1.5 transition-colors" />
                <span className="font-brand font-bold text-xs text-zinc-800">
                  Clique para carregar seu arquivo .MP3 ou .WAV
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  Até 8MB • Música do Suno AI ou gravação
                </span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-600 space-y-1">
            <span className="font-bold block text-zinc-800">💡 Como funciona na prática:</span>
            <p>
              Toda vez que um cliente finalizar o pedido no site ou você receber uma nova comanda, esse grito cantado de 10 segundos toca na recepção/cozinha para ninguém deixar passar despercebido.
            </p>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-4 bg-zinc-100 border-t-2 border-black flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-brand font-black text-xs tracking-wide cursor-pointer transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
