
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icons } from './Icon';
import {
  Patient,
  ExamResult,
  ClinicalNote,
  PositiveHighlight,
  PriorityDeviation,
  SuggestedFollowUpExam,
  LongitudinalTrend,
} from '../types';
import {
  analyzeMedicalInput,
  computeLongitudinalTrends,
  UnifiedAnalysis,
} from '../services/geminiService';
import {
  normalizeExamLookup,
  canonicalizeExamIdentity,
  isCoreHemogramMarker,
} from '../data/examNormalization';
import {
  blobToBase64,
  utf8ToBase64,
  sortExamResults,
  MAX_UPLOAD_BYTES,
  MAX_AUDIO_RECORDING_SECONDS,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_PDF_MIME_TYPES,
  ALLOWED_AUDIO_MIME_TYPES,
  normalizeMimeType,
  sanitizeClinicalTextPII,
} from '../utils';
import { printPatientReport } from '../utils/printReport';
import { AnalysisReportView } from './AnalysisReportView';
import Modal from './Modal';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const RECONCILIATION_WINDOW_DAYS = 90;

const formatIsoToPtBr = (raw?: string): string => {
  const clean = (raw || '').trim();
  if (!clean) return '';
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('pt-BR');
  }
  return clean;
};

const parseNoteTimestamp = (note: ClinicalNote): number => {
  const ref = (note.referenceDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(ref)) {
    const parsedRef = new Date(`${ref}T12:00:00`).getTime();
    if (Number.isFinite(parsedRef)) return parsedRef;
  }
  const parsedDate = new Date(note.referenceDate || note.date || 0).getTime();
  return Number.isFinite(parsedDate) ? parsedDate : 0;
};

const parseExamRequestList = (note: ClinicalNote): string[] => {
  if (Array.isArray(note.exams) && note.exams.length > 0) {
    return note.exams.map((e) => String(e || '').trim()).filter(Boolean);
  }
  const parts = (note.content || '').split('\n\nMotivo/Obs: ');
  const rawExams = parts[0] || '';
  return rawExams
    .split('\n')
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
};

const toSafeRtdbExamKey = (examName: string): string => {
  const canon = canonicalizeExamIdentity(examName) || normalizeExamLookup(examName);
  return canon.replace(/[.#$\[\]\/]/g, '_');
};

interface MatchedOpenGuide {
  note: ClinicalNote;
  dateFormatted: string;
  totalCount: number;
  recognizedTotalCount: number;
  pendingAfterDeliveryCount: number;
  newlyRecognizedKeys: string[];
}

interface Props {
  patient: Patient;
  onSave?: (patientId: string, note: ClinicalNote) => Promise<boolean> | void;
  onPrepareExamRequest?: (exams: SuggestedFollowUpExam[]) => void;
}

export const EvaluationChat: React.FC<Props> = ({ patient, onSave, onPrepareExamRequest }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<'extracting' | 'validating' | 'synthesizing'>('extracting');
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [synthesis, setSynthesis] = useState("");
  const [positiveHighlights, setPositiveHighlights] = useState<PositiveHighlight[]>([]);
  const [priorityDeviations, setPriorityDeviations] = useState<PriorityDeviation[]>([]);
  const [patientRoutineSummary, setPatientRoutineSummary] = useState("");
  const [patientPrintableReport, setPatientPrintableReport] = useState("");
  const [executiveAudioBriefing, setExecutiveAudioBriefing] = useState("");
  const [suggestedFollowUpExams, setSuggestedFollowUpExams] = useState<SuggestedFollowUpExam[]>([]);
  const [longitudinalTrends, setLongitudinalTrends] = useState<Record<string, LongitudinalTrend>>({});
  const [closingGuideId, setClosingGuideId] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [sanitizePiiOnSend, setSanitizePiiOnSend] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cleanupRecordingResources();
    };
  }, []);

  useEffect(() => {
    setSaveFeedback(null);
    setClosingGuideId(null);
  }, [patient.id]);

  const cleanupRecordingResources = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current || !dataArrayRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = dataArrayRef.current;

    analyserRef.current.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2.5;
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
    animationFrameIdRef.current = requestAnimationFrame(drawVisualizer);
  };

  const applyAnalysisResult = (analysis: UnifiedAnalysis) => {
    const sorted = sortExamResults(analysis.results);
    setResults(sorted);
    const synth = analysis.clinicalSynthesisMarkdown || analysis.synthesis || "";
    setSynthesis(synth);
    setPositiveHighlights(analysis.positiveHighlights || []);
    setPriorityDeviations(analysis.priorityDeviations || []);
    setPatientRoutineSummary(analysis.patientRoutineSummary || "");
    setPatientPrintableReport(analysis.patientPrintableReport || "");
    setExecutiveAudioBriefing(analysis.executiveAudioBriefing || "");
    setSuggestedFollowUpExams(analysis.suggestedFollowUpExams || []);
    const computedTrends =
      analysis.longitudinalTrends && Object.keys(analysis.longitudinalTrends).length > 0
        ? analysis.longitudinalTrends
        : computeLongitudinalTrends(
            sorted,
            patient.consultationRecordings || [],
            new Date().toISOString().split('T')[0]
          );
    setLongitudinalTrends(computedTrends);
    setSaveFeedback(null);
  };

  const resetStructuredAnalysis = () => {
    setResults([]);
    setSynthesis("");
    setPositiveHighlights([]);
    setPriorityDeviations([]);
    setPatientRoutineSummary("");
    setPatientPrintableReport("");
    setExecutiveAudioBriefing("");
    setSuggestedFollowUpExams([]);
    setLongitudinalTrends({});
    setSaveFeedback(null);
    setUploadError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadError(null);

    const normalizedMime = normalizeMimeType(file.type);
    const allowedList: readonly string[] =
      type === 'image' ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_PDF_MIME_TYPES;

    if (!allowedList.includes(normalizedMime)) {
      setUploadError(
        type === 'image'
          ? `Formato de imagem inválido (${normalizedMime || 'desconhecido'}). Utilize apenas JPG, PNG ou WebP.`
          : `Formato inválido (${normalizedMime || 'desconhecido'}). Envie apenas arquivos PDF (.pdf).`
      );
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`O arquivo selecionado possui ${sizeMb} MB e excede o limite máximo seguro de 25 MB.`);
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('Falha ao ler arquivo local.'));
        reader.readAsDataURL(file);
      });

      const analysis = await analyzeMedicalInput(
        base64,
        normalizedMime,
        false,
        patient.sex,
        setAnalysisStage,
        undefined,
        patient.consultationRecordings,
        new Date().toISOString().split('T')[0]
      );
      applyAnalysisResult(analysis);
    } catch (error: any) {
      setUploadError(error?.message || "Erro ao processar documento. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRecording = async () => {
    resetStructuredAnalysis();
    setRecordingTime('00:00');
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setUploadError("Este navegador não suporta captura de áudio via microfone.");
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setUploadError("Este navegador não suporta gravação de áudio (MediaRecorder indisponível).");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err: any) {
      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setUploadError("Permissão de microfone negada. Libere o acesso ao microfone nas configurações do navegador.");
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setUploadError("Nenhum microfone foi encontrado neste dispositivo.");
      } else {
        setUploadError(`Acesso ao microfone indisponível (${err?.message || errName || 'erro de dispositivo'}).`);
      }
      return;
    }

    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        const audioContext = new AudioContextCtor();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        drawVisualizer();
      }

      const candidateCodecs = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ];
      const supportedCodec =
        typeof MediaRecorder.isTypeSupported === 'function'
          ? candidateCodecs.find((codec) => MediaRecorder.isTypeSupported(codec))
          : undefined;

      let recorder: MediaRecorder;
      try {
        recorder = supportedCodec
          ? new MediaRecorder(stream, { mimeType: supportedCodec })
          : new MediaRecorder(stream);
      } catch (codecErr: any) {
        cleanupRecordingResources();
        setUploadError(
          `Formato/codec de gravação de áudio não suportado neste navegador (${supportedCodec || 'padrão'}: ${codecErr?.message || 'erro ao iniciar MediaRecorder'}).`
        );
        return;
      }

      const effectiveRecorderMime = recorder.mimeType || supportedCodec || 'audio/webm';
      const cleanAudioMime = normalizeMimeType(effectiveRecorderMime);
      if (!(ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(cleanAudioMime)) {
        cleanupRecordingResources();
        setUploadError(`Formato de gravação de áudio não suportado pelo servidor (${cleanAudioMime || 'desconhecido'}).`);
        return;
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        cleanupRecordingResources();
        setIsRecording(false);
        setUploadError(`Erro durante a gravação de áudio (${event?.error?.message || 'falha no gravador'}).`);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: cleanAudioMime });
        cleanupRecordingResources();

        if (audioChunksRef.current.length === 0 || audioBlob.size === 0) {
          setUploadError("O áudio gravado está vazio ou mudo. Fale próximo ao microfone por pelo menos 1 segundo e tente novamente.");
          return;
        }

        if (audioBlob.size > MAX_UPLOAD_BYTES) {
          const sizeMb = (audioBlob.size / (1024 * 1024)).toFixed(1);
          setUploadError(`A gravação possui ${sizeMb} MB e excede o limite máximo seguro de 25 MB.`);
          return;
        }

        setIsAnalyzing(true);
        try {
          const base64 = await blobToBase64(audioBlob);
          if (!base64) {
            setUploadError("Não foi possível codificar o áudio gravado. Tente gravar novamente.");
            return;
          }

          const analysis = await analyzeMedicalInput(
            base64,
            cleanAudioMime,
            true,
            patient.sex,
            setAnalysisStage,
            undefined,
            patient.consultationRecordings,
            new Date().toISOString().split('T')[0]
          );
          applyAnalysisResult(analysis);
          
          if (analysis.results.length === 0 && !analysis.synthesis) {
            setSynthesis("Nenhum dado laboratorial claro foi identificado na narração.");
          }
        } catch (err: any) {
          console.error(err);
          setUploadError(err?.message || "Erro no processamento da narração.");
        } finally {
          setIsAnalyzing(false);
        }
      };

      recorder.start(1000);
      setIsRecording(true);
      let sec = 0;
      timerRef.current = setInterval(() => {
        sec++;
        setRecordingTime(`${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`);
        if (sec >= MAX_AUDIO_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      cleanupRecordingResources();
      setIsRecording(false);
      setUploadError(err?.message || "Erro inesperado ao iniciar a gravação de áudio.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleProcessText = async () => {
    if (!importText.trim()) return;
    setUploadError(null);
    const textToSend = sanitizePiiOnSend
      ? sanitizeClinicalTextPII(importText).sanitized
      : importText;

    setIsTextModalOpen(false);
    setIsAnalyzing(true);
    try {
      const textBytes = new Blob([textToSend]).size;
      if (textBytes > MAX_UPLOAD_BYTES) {
        setUploadError('O texto colado excede o limite máximo seguro de 25 MB.');
        setIsAnalyzing(false);
        return;
      }
      const base64 = utf8ToBase64(textToSend);
      const analysis = await analyzeMedicalInput(
        base64,
        "text/plain",
        false,
        patient.sex,
        setAnalysisStage,
        undefined,
        patient.consultationRecordings,
        new Date().toISOString().split('T')[0]
      );
      applyAnalysisResult(analysis);
    } catch (error: any) {
      setUploadError(error?.message || "Erro ao processar texto.");
    } finally {
      setIsAnalyzing(false);
      setImportText("");
    }
  };

  // Cruzamento inteligente determinístico dos exames extraídos contra guias abertas (últimos 90 dias)
  const matchedOpenGuides = useMemo<MatchedOpenGuide[]>(() => {
    if (!results.length) return [];

    const currentResultKeys = new Set<string>();
    let coreHemogramCount = 0;

    for (const r of results) {
      if (!r?.testName) continue;
      const canon = canonicalizeExamIdentity(r.testName);
      const norm = normalizeExamLookup(r.testName);
      if (canon) currentResultKeys.add(canon);
      if (norm) currentResultKeys.add(norm);
      if (isCoreHemogramMarker(r.testName)) {
        coreHemogramCount += 1;
      }
    }
    if (coreHemogramCount >= 4) {
      currentResultKeys.add('hemograma_completo');
    }

    const nowMs = Date.now();
    const openGuides = (patient.consultationRecordings || [])
      .filter((n) => n.type === 'exam-request' && n.requestStatus !== 'completed')
      .map((note) => ({ note, timestampMs: parseNoteTimestamp(note) }))
      .filter(
        ({ timestampMs }) =>
          timestampMs > 0 && nowMs - timestampMs <= RECONCILIATION_WINDOW_DAYS * MS_PER_DAY
      )
      .sort((a, b) => b.timestampMs - a.timestampMs);

    const matched: MatchedOpenGuide[] = [];

    for (const { note } of openGuides) {
      const rawExams = parseExamRequestList(note);
      const seenKeys = new Set<string>();
      const uniqueExams: string[] = [];
      for (const raw of rawExams) {
        const key = toSafeRtdbExamKey(raw);
        if (!key || seenKeys.has(key)) continue;
        seenKeys.add(key);
        uniqueExams.push(raw);
      }
      if (uniqueExams.length === 0) continue;

      const existingFulfilledKeys = new Set<string>();
      if (note.fulfilledExams && typeof note.fulfilledExams === 'object') {
        for (const k of Object.keys(note.fulfilledExams)) {
          const canon = canonicalizeExamIdentity(k);
          const norm = normalizeExamLookup(k);
          if (canon) existingFulfilledKeys.add(canon);
          if (norm) existingFulfilledKeys.add(norm);
          if (k) existingFulfilledKeys.add(k);
        }
      }

      const newlyRecognizedKeys: string[] = [];
      let recognizedInThisDeliveryCount = 0;
      let recognizedTotalCount = 0;

      for (const exam of uniqueExams) {
        const canon = canonicalizeExamIdentity(exam);
        const norm = normalizeExamLookup(exam);
        const safeKey = toSafeRtdbExamKey(exam);

        const isAlreadyFulfilled =
          (canon && existingFulfilledKeys.has(canon)) ||
          (norm && existingFulfilledKeys.has(norm)) ||
          existingFulfilledKeys.has(safeKey);

        const isDeliveredNow =
          (canon && currentResultKeys.has(canon)) ||
          (norm && currentResultKeys.has(norm));

        if (isDeliveredNow) {
          recognizedInThisDeliveryCount += 1;
          if (!isAlreadyFulfilled && safeKey) {
            newlyRecognizedKeys.push(safeKey);
          }
        }
        if (isAlreadyFulfilled || isDeliveredNow) {
          recognizedTotalCount += 1;
        }
      }

      if (recognizedInThisDeliveryCount > 0) {
        matched.push({
          note,
          dateFormatted: formatIsoToPtBr(note.referenceDate || note.date),
          totalCount: uniqueExams.length,
          recognizedTotalCount,
          pendingAfterDeliveryCount: Math.max(0, uniqueExams.length - recognizedTotalCount),
          newlyRecognizedKeys,
        });
      }
    }

    return matched;
  }, [results, patient.consultationRecordings]);

  const handleCloseGuidePending = async (guide: MatchedOpenGuide) => {
    if (!onSave || closingGuideId) return;
    setClosingGuideId(guide.note.id);
    setSaveFeedback(null);
    try {
      const now = new Date();
      const nowIsoDate = now.toISOString().split('T')[0];
      const mergedFulfilled: Record<string, string> = {
        ...(guide.note.fulfilledExams || {}),
      };
      for (const key of guide.newlyRecognizedKeys) {
        mergedFulfilled[key] = nowIsoDate;
      }

      const updatedGuide: ClinicalNote = {
        ...guide.note,
        fulfilledExams: mergedFulfilled,
        reconciledAt: now.toISOString(),
        requestStatus: 'completed',
      };
      const saved = await onSave(patient.id, updatedGuide);
      if (saved === false) {
        setSaveFeedback({
          type: 'error',
          message: `Não foi possível encerrar a guia de ${guide.dateFormatted}. Tente novamente.`,
        });
      } else {
        setSaveFeedback({
          type: 'success',
          message: `Pendências da guia de ${guide.dateFormatted} encerradas com sucesso.`,
        });
      }
    } catch (err) {
      console.error('Erro ao encerrar pendências da guia:', err);
      setSaveFeedback({
        type: 'error',
        message: 'Erro ao atualizar a guia de solicitação no banco de dados.',
      });
    } finally {
      setClosingGuideId(null);
    }
  };

  const handleSave = async () => {
    if (!onSave || !synthesis) return;
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const nowIsoDate = nowIso.split('T')[0];
      const sortedBeforeSave = sortExamResults(results);
      const finalTrends =
        Object.keys(longitudinalTrends).length > 0
          ? longitudinalTrends
          : computeLongitudinalTrends(
              sortedBeforeSave,
              patient.consultationRecordings || [],
              nowIsoDate
            );

      const reportData = {
        results: sortedBeforeSave,
        synthesis,
        clinicalSynthesisMarkdown: synthesis,
        positiveHighlights,
        priorityDeviations,
        patientRoutineSummary,
        patientPrintableReport,
        executiveAudioBriefing,
        suggestedFollowUpExams,
        longitudinalTrends: finalTrends,
        schemaVersion: '2.0',
      };

      const note: ClinicalNote = {
        id: `ia-eval-${now.getTime()}`,
        date: nowIso,
        referenceDate: nowIsoDate,
        title: 'Avaliação Smart',
        content: JSON.stringify(reportData),
        type: 'lab-result',
        positiveHighlights,
        priorityDeviations,
        patientRoutineSummary,
        patientPrintableReport,
        executiveAudioBriefing,
        suggestedFollowUpExams,
        longitudinalTrends: finalTrends,
        schemaVersion: '2.0',
      };
      const saved = await onSave(patient.id, note);
      if (saved === false) {
        setSaveFeedback({
          type: 'error',
          message: 'Não foi possível salvar no banco de dados. Verifique sua conexão e tente novamente.',
        });
        return;
      }

      // Reconciliação automática das guias abertas reconhecidas nesta entrega
      let reconciledGuidesCount = 0;
      for (const guide of matchedOpenGuides) {
        if (guide.note.requestStatus === 'completed') continue;
        const mergedFulfilled: Record<string, string> = {
          ...(guide.note.fulfilledExams || {}),
        };
        for (const key of guide.newlyRecognizedKeys) {
          mergedFulfilled[key] = nowIsoDate;
        }
        const updatedGuide: ClinicalNote = {
          ...guide.note,
          fulfilledExams: mergedFulfilled,
          reconciledAt: nowIso,
          requestStatus: guide.pendingAfterDeliveryCount === 0 ? 'completed' : 'open',
        };
        const reconciledOk = await onSave(patient.id, updatedGuide);
        if (reconciledOk !== false) {
          reconciledGuidesCount += 1;
        }
      }

      setSaveFeedback({
        type: 'success',
        message:
          reconciledGuidesCount > 0
            ? `Análise salva no Prontuário com sucesso e ${reconciledGuidesCount} guia(s) de solicitação atualizada(s) automaticamente.`
            : 'Análise salva no Prontuário com sucesso!',
      });
    } catch (error) {
      console.error("Save error:", error);
      setSaveFeedback({
        type: 'error',
        message: 'Erro ao salvar análise no banco de dados. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = (customResults?: ExamResult[]) => {
    const activeResults = customResults || results;
    if (!activeResults.length) return;
    printPatientReport({
      patient,
      results: activeResults,
      patientPrintableReport,
      fallbackReportText: synthesis,
      patientRoutineSummary,
    });
  };

  const handleClear = () => { resetStructuredAnalysis(); };

  const piiPreview = sanitizeClinicalTextPII(importText);

  return (
    <div className="flex flex-col h-full gap-5 p-2 md:p-6 w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div onClick={() => fileInputRef.current?.click()} className="group cursor-pointer bg-white border border-slate-200 hover:border-medical-500 hover:bg-medical-50 p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
          <div className="w-10 h-10 bg-medical-100 text-medical-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><Icons.Camera size={20} /></div>
          <div className="text-center"><h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Capturar Exame</h4><p className="text-[10px] text-slate-500">JPG, PNG ou WebP (máx. 25 MB)</p></div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
        </div>
        <div onClick={() => pdfInputRef.current?.click()} className="group cursor-pointer bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><Icons.FileText size={20} /></div>
          <div className="text-center"><h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Importar PDF</h4><p className="text-[10px] text-slate-500">PDF laboratorial (máx. 25 MB)</p></div>
          <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'pdf')} />
        </div>
        <div onClick={isRecording ? stopRecording : startRecording} className={`group cursor-pointer p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all border shadow-sm relative overflow-hidden ${isRecording ? 'bg-red-50 border-red-200 shadow-md scale-105 ring-2 ring-red-500/20 z-10' : 'bg-white border-slate-200 hover:border-purple-500 hover:bg-purple-50'}`}>
          {isRecording ? (
            <div className="flex flex-col items-center gap-1 w-full">
              <canvas ref={canvasRef} width="100" height="30" className="h-6 w-full" />
              <span className="text-red-600 font-bold text-xs font-mono tracking-tighter">{recordingTime} / 05:00</span>
              <button type="button" className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold">PARAR</button>
            </div>
          ) : (
            <><div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><Icons.Mic size={20} /></div><div className="text-center"><h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Transcrição de Áudio</h4><p className="text-[10px] text-slate-500">Leitura de voz (máx. 5 min)</p></div></>
          )}
        </div>
        <div onClick={() => setIsTextModalOpen(true)} className="group cursor-pointer bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50 p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"><Icons.ClipboardPaste size={20} /></div>
          <div className="text-center"><h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Importar Texto</h4><p className="text-[10px] text-slate-500">Colar dados com filtro LGPD</p></div>
        </div>
      </div>

      {/* Aviso discreto de Privacidade e LGPD */}
      <div className="print:hidden bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-[11px] text-slate-600">
        <Icons.Info size={15} className="text-medical-600 shrink-0" />
        <span>
          <strong>Privacidade & LGPD:</strong> Quando possível, oculte ou recorte cabeçalhos com dados cadastrais sensíveis (CPF, RG, telefone e nome completo) de PDFs e imagens antes do envio. Nenhum dado cadastral do CRM é enviado à IA.
        </span>
      </div>

      {uploadError && (
        <div className="print:hidden bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-red-700 font-medium">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle size={16} className="text-red-500 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-400 hover:text-red-700 p-1 rounded-lg"
            title="Fechar aviso"
          >
            <Icons.X size={14} />
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-4 animate-pulse">
          <Icons.Loader2 className="w-12 h-12 text-medical-500 animate-spin" />
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800 tracking-tight">Processando Inteligência Clínica</p>
            <p className="text-sm text-slate-500">
              {analysisStage === 'extracting' && 'Passo 1/3: Extraindo marcadores do laudo...'}
              {analysisStage === 'validating' && 'Passo 2/3: Calculando alvos funcionais, status e razões...'}
              {analysisStage === 'synthesizing' && 'Passo 3/3: Gerando Síntese Funcional coerente...'}
            </p>
          </div>
        </div>
      )}

      {results.length > 0 && !isAnalyzing && (
        <AnalysisReportView 
          results={results}
          synthesis={synthesis}
          positiveHighlights={positiveHighlights}
          priorityDeviations={priorityDeviations}
          patientRoutineSummary={patientRoutineSummary}
          executiveAudioBriefing={executiveAudioBriefing}
          suggestedFollowUpExams={suggestedFollowUpExams}
          longitudinalTrends={longitudinalTrends}
          historicalRecords={patient.consultationRecordings}
          referenceDate={new Date().toISOString().split('T')[0]}
          onPrepareExamRequest={onPrepareExamRequest}
          onPrint={() => handlePrint()}
          onDelete={handleClear}
          title="Análise Estratégica"
          showSynthesis={true}
          patientSex={patient.sex}
        />
      )}

      {results.length > 0 && !isAnalyzing && (
        <div className="flex flex-col gap-3 pt-4 print:hidden px-2">
          {matchedOpenGuides.length > 0 && (
            <div className="flex flex-col gap-2">
              {matchedOpenGuides.map((guide) => {
                const isClosing = closingGuideId === guide.note.id;
                return (
                  <div
                    key={guide.note.id}
                    className="bg-purple-50/80 border border-purple-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-purple-900"
                  >
                    <span className="font-medium">
                      🔗 Guia de <strong>{guide.dateFormatted}</strong>:{' '}
                      <strong>{guide.recognizedTotalCount}</strong> de{' '}
                      <strong>{guide.totalCount}</strong> exames reconhecidos nesta entrega (
                      {guide.pendingAfterDeliveryCount}{' '}
                      {guide.pendingAfterDeliveryCount === 1 ? 'pendente' : 'pendentes'})
                    </span>
                    {guide.pendingAfterDeliveryCount > 0 && onSave && (
                      <button
                        type="button"
                        onClick={() => handleCloseGuidePending(guide)}
                        disabled={isClosing}
                        className="min-h-[32px] px-3 py-1 rounded-lg bg-white hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-300 font-semibold text-[11px] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isClosing ? (
                          <Icons.Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Icons.Check size={12} />
                        )}
                        Encerrar pendências desta guia
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {saveFeedback && (
            <div
              className={`rounded-xl px-4 py-3 text-xs font-medium flex items-center justify-between gap-3 border ${
                saveFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {saveFeedback.type === 'success' ? (
                  <Icons.CheckCircle size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <Icons.AlertTriangle size={16} className="text-red-500 shrink-0" />
                )}
                <span>{saveFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveFeedback(null)}
                className="opacity-60 hover:opacity-100 p-1 rounded"
                title="Fechar mensagem"
              >
                <Icons.X size={14} />
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={isSaving} className="px-8 py-4 bg-medical-600 text-white hover:bg-medical-700 rounded-xl text-base font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50">
              {isSaving ? <Icons.Loader2 size={20} className="animate-spin" /> : <Icons.Save size={20} />} Salvar no Prontuário
            </button>
          </div>
        </div>
      )}

      {!results.length && !isAnalyzing && (
        <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><Icons.FlaskConical size={32} strokeWidth={1} /></div>
          <div><h3 className="text-lg font-bold text-slate-700">Aguardando Dados Laboratoriais</h3><p className="text-sm text-slate-500 max-w-sm mt-1">Análise sincronizada com Alvos Funcionais.</p></div>
        </div>
      )}

      <Modal isOpen={isTextModalOpen} onClose={() => { setIsTextModalOpen(false); setImportText(""); }} title="Importar Resultados (Texto)" size="lg">
        <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2">
              <Icons.Info size={15} className="text-medical-600 shrink-0 mt-0.5" />
              <span>
                Evite colar cabeçalhos com nome completo, RG, CPF ou telefone do paciente. Os resultados numéricos dos exames serão preservados integralmente.
              </span>
            </div>

            <textarea autoFocus value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Cole aqui os dados do laudo..." className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none text-base sm:text-sm font-mono bg-slate-50" />

            <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/60 border border-amber-200/70 rounded-xl px-3.5 py-2.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sanitizePiiOnSend}
                  onChange={(e) => setSanitizePiiOnSend(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Mascarar automaticamente CPF, e-mail e telefone antes de enviar à IA (LGPD)</span>
              </label>
              {piiPreview.maskedCount > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {piiPreview.maskedCount} dado(s) sensível(is) detectado(s)
                </span>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setIsTextModalOpen(false); setImportText(""); }} className="min-h-[44px] px-5 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors">Cancelar</button>
                <button type="button" onClick={handleProcessText} disabled={!importText.trim()} className="min-h-[44px] px-8 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"><Icons.Wand2 size={16} /> Analisar Texto</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
