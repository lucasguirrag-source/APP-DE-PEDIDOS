// Utilitário de alerta sonoro musical e grito cantado estilo IA: 
// "EDIIIIIIIIIILMA SAIIIIIU PEDIDOOOOOOOI" (Duração exata: 10 segundos)

class SoundAlertService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private isCurrentlyPlaying: boolean = false;
  private stopTimeouts: number[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private activeNodes: { stop: () => void }[] = [];

  constructor() {
    try {
      const saved = localStorage.getItem('aqf_sound_alert_enabled');
      if (saved !== null) {
        this.soundEnabled = JSON.parse(saved);
      }
    } catch {}
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('aqf_sound_alert_enabled', JSON.stringify(enabled));
    } catch {}
    if (!enabled) {
      this.stop();
    }
  }

  // Interrompe imediatamente qualquer som ou voz em andamento
  public stop() {
    this.isCurrentlyPlaying = false;

    // Cancela timeouts de fala e áudio agendados
    this.stopTimeouts.forEach((t) => clearTimeout(t));
    this.stopTimeouts = [];

    // Cancela fala do sintetizador
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    // Para áudio HTML caso exista
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {}
      this.currentAudioElement = null;
    }

    // Para nós de áudio do Web Audio API
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch {}
    });
    this.activeNodes = [];
  }

  // Permite salvar um áudio personalizado (Ex: música gerada no Suno / Udio)
  public setCustomAudio(base64AudioUrl: string | null) {
    try {
      if (base64AudioUrl) {
        localStorage.setItem('aqf_custom_edilma_audio', base64AudioUrl);
      } else {
        localStorage.removeItem('aqf_custom_edilma_audio');
      }
    } catch {}
  }

  public getCustomAudio(): string | null {
    try {
      return localStorage.getItem('aqf_custom_edilma_audio');
    } catch {
      return null;
    }
  }

  /**
   * Toca o GRITO CANTADO DA EDILMA DE 10 SEGUNDOS ESTILO MÚSICA IA
   * "EDIIIIIIIIIILMA SAIIIIIU PEDIDOOOOOOOI"
   */
  public speakAlert(customTriggerText?: string) {
    if (!this.soundEnabled) return;

    this.stop();
    this.isCurrentlyPlaying = true;

    // Se houver um áudio customizado carregado pelo usuário (ex: MP3 de IA gerado no Suno)
    const customAudio = this.getCustomAudio();
    if (customAudio) {
      try {
        const audio = new Audio(customAudio);
        this.currentAudioElement = audio;
        audio.volume = 1.0;
        audio.play().catch((err) => {
          console.warn('Erro ao reproduzir áudio personalizado, tocando sintetizador nativo:', err);
          this.playSynthesized10sScream();
        });

        // Limita a reprodução a 10 segundos se durar mais
        const timer = window.setTimeout(() => {
          this.stop();
        }, 10000);
        this.stopTimeouts.push(timer);
        return;
      } catch (e) {
        console.warn('Falha no áudio customizado, executando sintetizador:', e);
      }
    }

    this.playSynthesized10sScream();
  }

  /**
   * Sintetiza uma trilha musical completa de 10 segundos com:
   * 1. DJ Airhorn de abertura (Buzina de estádio/funk)
   * 2. Beat dançante de 130 BPM com bumbo, caixa e pratos
   * 3. Acordes de metais / sintetizador empolgante
   * 4. Grito cantado em alta potência:
   *    "EDIIIIIIIIIILMA! SAIIIIIU PEDIDOOOOOOOI!"
   *    "CORRE EDILMA! SAIU PEDIDO NOVO NA CHAPA!"
   *    "AI QUE FOME SMASH!"
   */
  private playSynthesized10sScream() {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const duration = 10.0; // Exatamente 10 segundos

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.7, now);
      masterGain.gain.setValueAtTime(0.7, now + 9.2);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      masterGain.connect(ctx.destination);

      // -------------------------------------------------------------
      // 1. DJ AIRHORN DE ABERTURA (Buzina de estádio potente nos primeiros 1.2s)
      // -------------------------------------------------------------
      const hornStabs = [
        { start: 0.0, end: 0.14 },
        { start: 0.18, end: 0.32 },
        { start: 0.36, end: 0.50 },
        { start: 0.54, end: 1.15 }
      ];

      hornStabs.forEach(({ start, end }) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const hornGain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';

        // Afinação típica da corneta de funk/DJ (Bb4 + leve desafinação)
        osc1.frequency.setValueAtTime(466.16, now + start);
        osc2.frequency.setValueAtTime(472.0, now + start);

        hornGain.gain.setValueAtTime(0.4, now + start);
        hornGain.gain.exponentialRampToValueAtTime(0.001, now + end);

        osc1.connect(hornGain);
        osc2.connect(hornGain);
        hornGain.connect(masterGain);

        osc1.start(now + start);
        osc1.stop(now + end);
        osc2.start(now + start);
        osc2.stop(now + end);

        this.activeNodes.push(osc1, osc2);
      });

      // -------------------------------------------------------------
      // 2. BEAT DANÇANTE 130 BPM (Bumbo e Caixa dos 1.0s até 9.5s)
      // -------------------------------------------------------------
      const beatInterval = 0.46; // ~130 BPM
      const totalBeats = Math.floor((duration - 1.0) / beatInterval);

      for (let i = 0; i < totalBeats; i++) {
        const beatTime = now + 1.0 + i * beatInterval;

        // Bumbo potente (Kick Drum)
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, beatTime);
        kickOsc.frequency.exponentialRampToValueAtTime(38, beatTime + 0.12);
        kickGain.gain.setValueAtTime(0.65, beatTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.25);

        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);
        kickOsc.start(beatTime);
        kickOsc.stop(beatTime + 0.25);
        this.activeNodes.push(kickOsc);

        // Caixa / Palmas nos tempos 2 e 4
        if (i % 2 === 1) {
          const snareOsc = ctx.createOscillator();
          const snareGain = ctx.createGain();
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(280, beatTime);
          snareGain.gain.setValueAtTime(0.35, beatTime);
          snareGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.18);

          snareOsc.connect(snareGain);
          snareGain.connect(masterGain);
          snareOsc.start(beatTime);
          snareOsc.stop(beatTime + 0.18);
          this.activeNodes.push(snareOsc);
        }
      }

      // -------------------------------------------------------------
      // 3. SINTETIZADOR DE METAIS / BRASS MUSICAL (Harmonia vibrante)
      // -------------------------------------------------------------
      // Progressão: Dó Maior (1s), Sol Maior (3.2s), Lá Menor (5.5s), Fá/Dó (8s)
      const chordPhases = [
        { time: 1.0, dur: 2.2, freqs: [261.63, 329.63, 392.00] }, // C4, E4, G4
        { time: 3.2, dur: 2.3, freqs: [293.66, 369.99, 440.00] }, // D4, F#4, A4
        { time: 5.5, dur: 2.5, freqs: [220.00, 261.63, 329.63] }, // A3, C4, E4
        { time: 8.0, dur: 1.8, freqs: [261.63, 329.63, 523.25] }  // C4, E4, C5 (Grand Finale!)
      ];

      chordPhases.forEach((chord) => {
        chord.freqs.forEach((freq) => {
          const chordOsc = ctx.createOscillator();
          const chordGain = ctx.createGain();
          chordOsc.type = 'sawtooth';
          chordOsc.frequency.setValueAtTime(freq, now + chord.time);

          chordGain.gain.setValueAtTime(0.001, now + chord.time);
          chordGain.gain.linearRampToValueAtTime(0.12, now + chord.time + 0.1);
          chordGain.gain.setValueAtTime(0.12, now + chord.time + chord.dur - 0.2);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + chord.time + chord.dur);

          chordOsc.connect(chordGain);
          chordGain.connect(masterGain);
          chordOsc.start(now + chord.time);
          chordOsc.stop(now + chord.time + chord.dur);
          this.activeNodes.push(chordOsc);
        });
      });

      // -------------------------------------------------------------
      // 4. VOZES CANTADAS E GRITADAS COM AFINAÇÃO E ENERGIA MÁXIMA
      // -------------------------------------------------------------
      this.triggerSingingVocalChants();

      // Timer final para marcar encerramento após 10 segundos
      const endTimer = window.setTimeout(() => {
        this.isCurrentlyPlaying = false;
      }, duration * 1000);
      this.stopTimeouts.push(endTimer);

    } catch (e) {
      console.warn('Erro ao reproduzir sintetizador musical:', e);
      // Fallback para voz se Web Audio falhar
      this.triggerSingingVocalChants();
    }
  }

  /**
   * Dispara o grito cantado sequenciado em 4 fases cobrindo os 10 segundos
   */
  private triggerSingingVocalChants() {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) =>
          v.lang.includes('pt-BR') ||
          v.lang.includes('pt_BR') ||
          v.lang.toLowerCase().includes('pt')
      );

      // FASE 1 (Aos 0.8s): "EDIIIIIIIIIILMA!" (Grito agudo cantado)
      const t1 = window.setTimeout(() => {
        if (!this.isCurrentlyPlaying) return;
        const u1 = new SpeechSynthesisUtterance('EDIIIIIIIIIILMA!');
        u1.lang = 'pt-BR';
        u1.rate = 0.72; // Esticado para cantar a nota longa
        u1.pitch = 1.65; // Agudo estilo grito cantante
        u1.volume = 1.0;
        if (ptVoice) u1.voice = ptVoice;
        window.speechSynthesis.speak(u1);
      }, 800);
      this.stopTimeouts.push(t1);

      // FASE 2 (Aos 3.2s): "SAIIIIIU PEDIDOOOOOOOI!" (Canto em tom alto)
      const t2 = window.setTimeout(() => {
        if (!this.isCurrentlyPlaying) return;
        const u2 = new SpeechSynthesisUtterance('SAIIIIIU PEDIDOOOOOOOI!');
        u2.lang = 'pt-BR';
        u2.rate = 0.75; // Esticado
        u2.pitch = 1.55; // Alto e empolgante
        u2.volume = 1.0;
        if (ptVoice) u2.voice = ptVoice;
        window.speechSynthesis.speak(u2);
      }, 3200);
      this.stopTimeouts.push(t2);

      // FASE 3 (Aos 5.8s): "CORRE PRA CHAPA! EDILMA, SAIU PEDIDO NOVOOOO!"
      const t3 = window.setTimeout(() => {
        if (!this.isCurrentlyPlaying) return;
        const u3 = new SpeechSynthesisUtterance('CORRE PRA CHAPA! EDILMA, SAIU PEDIDO NOVOOOO!');
        u3.lang = 'pt-BR';
        u3.rate = 0.95;
        u3.pitch = 1.4;
        u3.volume = 1.0;
        if (ptVoice) u3.voice = ptVoice;
        window.speechSynthesis.speak(u3);
      }, 5800);
      this.stopTimeouts.push(t3);

      // FASE 4 (Aos 8.2s): "AI QUE FOME SMASH!"
      const t4 = window.setTimeout(() => {
        if (!this.isCurrentlyPlaying) return;
        const u4 = new SpeechSynthesisUtterance('AI QUE FOME SMASH!');
        u4.lang = 'pt-BR';
        u4.rate = 1.1;
        u4.pitch = 1.6;
        u4.volume = 1.0;
        if (ptVoice) u4.voice = ptVoice;
        window.speechSynthesis.speak(u4);
      }, 8200);
      this.stopTimeouts.push(t4);

    } catch (err) {
      console.warn('Erro ao disparar cantos de voz:', err);
    }
  }
}

export const soundAlert = new SoundAlertService();
