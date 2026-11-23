import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Square, Volume2, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { generateClinicalTTS } from '../services/geminiService';
import { sanitizeForbiddenClinicalTerms, truncateAtSentenceBoundary } from '../utils';

interface ClinicalVoiceNarratorProps {
  text: string;
  executiveBriefing?: string;
  noteId?: string;
}

const MAX_AUDIO_CACHE_ENTRIES = 30;
// Cache em memória persistente por chave (noteId + voiceName) para reutilizar áudio sem nova chamada à API
const executiveAudioUrlCache = new Map<string, string>();

const hashTextShort = (input: string): string => {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

const putAudioCache = (key: string, url: string) => {
  if (executiveAudioUrlCache.has(key)) {
    executiveAudioUrlCache.delete(key);
  }
  executiveAudioUrlCache.set(key, url);
  if (executiveAudioUrlCache.size > MAX_AUDIO_CACHE_ENTRIES) {
    const oldestKey = executiveAudioUrlCache.keys().next().value;
    if (oldestKey) {
      const oldestUrl = executiveAudioUrlCache.get(oldestKey);
      if (oldestUrl) URL.revokeObjectURL(oldestUrl);
      executiveAudioUrlCache.delete(oldestKey);
    }
  }
};

const buildLegacySpokenFallback = (rawText: string): string => {
  const withoutFollowUp = (rawText || '')
    .replace(/###?\s*(?:4\.\s*)?(?:Investigação Complementar(?:\s+Sugerida)?|Avaliação Orientativa de Investigação Complementar)[\s\S]*/i, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*`_~>|()[\]]/g, ' ')
    .replace(/[→←↑↓↗↘↔●•]/g, ' ');

  const cleaned = sanitizeForbiddenClinicalTerms(withoutFollowUp)
    .replace(/\s+/g, ' ')
    .trim();

  return truncateAtSentenceBoundary(cleaned, 115);
};

// Converts base64 audio (complete WAV from Gemini 3.8 TTS or raw 16-bit PCM fallback) into a playable WAV blob
function audioBase64ToWavBlob(base64Audio: string, sampleRate: number = 24000): Blob {
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini 3.8 Flash Lite TTS unary output already includes a complete 44-byte RIFF/WAVE header
  const isAlreadyWav =
    len >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x41 && // A
    bytes[10] === 0x56 && // V
    bytes[11] === 0x45;   // E

  if (isAlreadyWav) {
    return new Blob([bytes], { type: 'audio/wav' });
  }

  const buffer = bytes.buffer;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + len, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, len, true);

  return new Blob([wavHeader, buffer], { type: 'audio/wav' });
}

export const ClinicalVoiceNarrator: React.FC<ClinicalVoiceNarratorProps> = ({
  text,
  executiveBriefing,
  noteId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState('puck');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const spokenText = useMemo(() => {
    if (typeof executiveBriefing === 'string' && executiveBriefing.trim()) {
      return sanitizeForbiddenClinicalTerms(executiveBriefing.trim());
    }
    return buildLegacySpokenFallback(text);
  }, [executiveBriefing, text]);

  const effectiveNoteKey = useMemo(() => {
    const cleanId = typeof noteId === 'string' && noteId.trim() ? noteId.trim() : `draft-${hashTextShort(spokenText)}`;
    return `${cleanId}::${hashTextShort(spokenText)}`;
  }, [noteId, spokenText]);

  const voicesList = [
    { key: 'puck', name: 'Puck (Masculino - Claro e Fluente)', gender: 'male' },
    { key: 'charon', name: 'Charon (Masculino - Clínico e Profundo)', gender: 'male' },
    { key: 'fenrir', name: 'Fenrir (Masculino - Expressivo e Dinâmico)', gender: 'male' },
    { key: 'kore', name: 'Kore (Feminino - Suave e Acolhedor)', gender: 'female' },
    { key: 'zephyr', name: 'Zephyr (Feminino - Quente e Profissional)', gender: 'female' },
    { key: 'aoede', name: 'Aoede (Feminino - Expressivo e Artístico)', gender: 'female' },
  ];

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Para a reprodução atual ao desmontar ou trocar de laudo (mantendo o cache em memória ativo)
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [effectiveNoteKey]);

  const handlePlay = async (voiceOverride?: string) => {
    setErrorMsg('');
    if (!spokenText) {
      setErrorMsg('Nenhum conteúdo disponível para o briefing em áudio.');
      return;
    }

    const activeVoice = voiceOverride || selectedVoice;

    // Se estiver pausado com a mesma voz, retoma imediatamente
    if (!voiceOverride && isPlaying && isPaused && audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
      return;
    }

    // Se já estiver reproduzindo a mesma voz, ignora clique duplicado
    if (!voiceOverride && isPlaying && !isPaused) return;

    const cacheKey = `${effectiveNoteKey}::${activeVoice}`;

    try {
      let audioUrl = executiveAudioUrlCache.get(cacheKey);

      if (!audioUrl) {
        setIsLoading(true);
        const base64Audio = await generateClinicalTTS(spokenText, activeVoice);
        const audioBlob = audioBase64ToWavBlob(base64Audio, 24000);
        audioUrl = URL.createObjectURL(audioBlob);
        putAudioCache(cacheKey, audioUrl);
      }

      setIsLoading(false);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.playbackRate = speed;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      audio.onpause = () => {
        setIsPaused(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setErrorMsg('Erro ao reproduzir o áudio.');
        cleanupAudio();
      };

      await audio.play();
    } catch (error: any) {
      console.error('TTS generation error:', error);
      setErrorMsg(error?.message || 'Não foi possível gerar o briefing em áudio. Verifique sua conexão.');
      setIsLoading(false);
      cleanupAudio();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    cleanupAudio();
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleVoiceChange = (voiceKey: string) => {
    setSelectedVoice(voiceKey);
    const wasPlaying = isPlaying;
    cleanupAudio();

    if (wasPlaying) {
      setTimeout(() => {
        handlePlay(voiceKey);
      }, 40);
    }
  };

  const speedOptions = [1.0, 1.25, 1.5];

  const currentVoiceName = useMemo(() => {
    return voicesList.find(v => v.key === selectedVoice)?.name || selectedVoice;
  }, [selectedVoice]);

  const isCachedForVoice = executiveAudioUrlCache.has(`${effectiveNoteKey}::${selectedVoice}`);

  return (
    <div id="clinical-voice-narrator" className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
            <Volume2 size={20} className={isPlaying && !isPaused ? 'animate-pulse' : ''} />
          </div>
          <div>
            <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="text-purple-500 fill-purple-200" />
              Ouvir Briefing Executivo
            </span>
            <span className="text-xs text-slate-600 font-medium block mt-0.5 truncate max-w-[280px] sm:max-w-[340px]">
              Resumo + Triangulação + Exames • <span className="font-semibold text-purple-700">{currentVoiceName.split(' (')[0]}</span>
              {isCachedForVoice ? ' • Em cache' : ''}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {isLoading ? (
            <button
              type="button"
              disabled
              className="min-h-[44px] flex items-center gap-2 bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-not-allowed"
            >
              <Loader2 size={15} className="animate-spin" />
              Gerando Áudio...
            </button>
          ) : isPlaying && !isPaused ? (
            <button
              type="button"
              onClick={handlePause}
              className="min-h-[44px] flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Pausar briefing"
            >
              <Pause size={15} />
              Pausar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handlePlay()}
              className="min-h-[44px] flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 hover:shadow"
              title="Ouvir Briefing Executivo em áudio"
            >
              <Play size={15} fill="currentColor" />
              {isPaused ? 'Retomar' : 'Ouvir Briefing Executivo'}
            </button>
          )}

          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              className="min-h-[44px] flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              title="Parar leitura"
            >
              <Square size={14} fill="currentColor" />
              Parar
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
            className="min-h-[44px] flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Volume2 size={14} className="text-slate-400" />
            <span>Voz</span>
            {isOptionsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-2.5 text-xs text-red-600 font-medium pl-1">
          {errorMsg}
        </div>
      )}

      {isOptionsOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeIn">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Velocidade da Reprodução</span>
            <div className="flex flex-wrap items-center gap-2">
              {speedOptions.map(opt => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => handleSpeedChange(opt)}
                  className={`min-h-[44px] min-w-[56px] px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    speed === opt
                      ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt === 1.25 ? '1.25x' : `${opt.toFixed(1)}x`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-w-sm w-full">
            <label htmlFor="clinical-voice-select" className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Selecionar Voz
            </label>
            <select
              id="clinical-voice-select"
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="min-h-[44px] w-full text-base sm:text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none shadow-sm cursor-pointer"
            >
              {voicesList.map(v => (
                <option key={v.key} value={v.key}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
