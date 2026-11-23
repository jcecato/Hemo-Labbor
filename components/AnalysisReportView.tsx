import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Icons } from './Icon';
import {
  ExamResult,
  AnalysisStatus,
  PositiveHighlight,
  PriorityDeviation,
  SuggestedFollowUpExam,
  ClinicalContext,
  LongitudinalTrend,
  ClinicalNote,
} from '../types';
import {
  sortExamResults,
  isMicronutrientExam,
  MAX_UPLOAD_BYTES,
  ALLOWED_REFERENCE_MIME_TYPES,
  normalizeMimeType,
  sanitizeClinicalTextPII,
} from '../utils';
import { chatWithClinicalAI, computeLongitudinalTrends } from '../services/geminiService';
import { CLINICAL_KNOWLEDGE_BASE } from '../data/clinicalKnowledge';
import { normalizeExamLookup, canonicalizeExamIdentity } from '../data/examNormalization';
import { ClinicalVoiceNarrator } from './ClinicalVoiceNarrator';

interface Props {
  results: ExamResult[];
  synthesis: string;
  positiveHighlights?: PositiveHighlight[];
  priorityDeviations?: PriorityDeviation[];
  patientRoutineSummary?: string;
  executiveAudioBriefing?: string;
  noteId?: string;
  suggestedFollowUpExams?: SuggestedFollowUpExam[];
  longitudinalTrends?: Record<string, LongitudinalTrend>;
  historicalRecords?: ClinicalNote[];
  referenceDate?: string;
  clinicalContext?: ClinicalContext;
  onPrepareExamRequest?: (exams: SuggestedFollowUpExam[]) => void;
  onClose?: () => void;
  onEditSynthesis?: () => void;
  onPrint?: () => void;
  onDelete?: () => void;
  title?: string;
  showSynthesis?: boolean;
  patientSex?: 'male' | 'female';
  schemaVersion?: string;
  onUpgradeToV2?: () => void;
  isUpgradingToV2?: boolean;
  upgradeError?: string | null;
}

const StatusBadge: React.FC<{ status: AnalysisStatus, isMicronutrient?: boolean }> = ({ status, isMicronutrient }) => {
  const configs = {
    [AnalysisStatus.CRITICAL_HIGH]: { 
        label: isMicronutrient ? 'Prioritário (Excedente)' : 'Prioritário (Acima)', 
        symbol: '↑↑', 
        classes: 'bg-rose-100 text-rose-800 border-rose-200' 
    },
    [AnalysisStatus.CLINICAL_HIGH]: { 
        label: isMicronutrient ? 'Prioritário (Reserva Alta)' : 'Prioritário (Elevado)', 
        symbol: '↑', 
        classes: 'bg-red-100 text-red-700 border-red-200' 
    },
    [AnalysisStatus.FUNCTIONAL_HIGH]: { 
        label: isMicronutrient ? 'Atenção (Reserva Alta)' : 'Atenção (Acima)', 
        symbol: '↗', 
        classes: 'bg-orange-100 text-orange-700 border-orange-200' 
    },
    [AnalysisStatus.OPTIMIZED]: { 
        label: 'Preservado', 
        symbol: '↔', 
        classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    },
    [AnalysisStatus.FUNCTIONAL_LOW]: { 
        label: 'Atenção (Abaixo)', 
        symbol: '↘', 
        classes: 'bg-orange-100 text-orange-700 border-orange-200' 
    },
    [AnalysisStatus.CLINICAL_LOW]: { 
        label: 'Prioritário (Abaixo)', 
        symbol: '↓', 
        classes: 'bg-red-100 text-red-700 border-red-200' 
    },
    [AnalysisStatus.CRITICAL_LOW]: { 
        label: 'Prioritário (Muito Abaixo)', 
        symbol: '↓↓', 
        classes: 'bg-rose-100 text-rose-800 border-rose-200' 
    },
    [AnalysisStatus.UNKNOWN]: { label: 'Em Análise', symbol: '•', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
  };

  const config = configs[status] || configs[AnalysisStatus.UNKNOWN];

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase border shadow-sm ${config.classes}`}>
      <span className="text-sm tracking-tighter font-mono font-black">{config.symbol}</span>
      <span className="whitespace-nowrap tracking-tight">{config.label}</span>
    </span>
  );
};

const renderFormattedText = (text: string) => {
  const boldParts = text.split('**');
  return boldParts.flatMap((bPart, bIdx) => {
    const isBold = bIdx % 2 === 1;
    
    const italicParts = bPart.split('*');
    const renderedItalics = italicParts.map((iPart, iIdx) => {
      const isItalic = iIdx % 2 === 1;
      if (isItalic) {
        return <em key={`i-${iIdx}`} className="italic text-slate-800 font-medium">{iPart}</em>;
      }
      return iPart;
    });

    if (isBold) {
      return <strong key={`b-${bIdx}`} className="font-bold text-slate-950">{renderedItalics}</strong>;
    }
    return renderedItalics;
  });
};

const renderMessageLine = (line: string, index: number) => {
  const trimmed = line.trim();
  
  if (trimmed === "") {
    return <div key={index} className="h-[2em] block" />;
  }

  if (trimmed.startsWith('###')) {
    const text = trimmed.replace(/^###\s*/, '');
    return (
      <h4 key={index} className="text-lg font-bold text-purple-800 mt-6 mb-3 border-b border-slate-200 pb-1 uppercase tracking-wider">
        {renderFormattedText(text.toUpperCase())}
      </h4>
    );
  }

  if (trimmed.startsWith('##')) {
    const text = trimmed.replace(/^##\s*/, '');
    return (
      <h3 key={index} className="text-xl font-extrabold text-purple-900 mt-8 mb-4 border-b border-slate-200 pb-1.5 uppercase tracking-wide">
        {renderFormattedText(text.toUpperCase())}
      </h3>
    );
  }

  if (trimmed.startsWith('#')) {
    const text = trimmed.replace(/^#\s*/, '');
    return (
      <h2 key={index} className="text-2xl font-black text-slate-900 mt-10 mb-5 border-b-2 border-purple-600 pb-2 uppercase tracking-normal">
        {renderFormattedText(text.toUpperCase())}
      </h2>
    );
  }

  if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
    const text = trimmed.substring(2);
    return (
      <div key={index} className="flex items-start gap-2 pl-4 my-2">
        <span className="text-purple-600 mt-1.5 select-none text-[8px] shrink-0">●</span>
        <span className="flex-1 text-slate-800 leading-relaxed text-left">
          {renderFormattedText(text)}
        </span>
      </div>
    );
  }

  const numberedMatch = trimmed.match(/^(\d+)\.\s(.*)/);
  if (numberedMatch) {
    const num = numberedMatch[1];
    const text = numberedMatch[2];
    return (
      <div key={index} className="flex items-start gap-2 pl-2 my-3 font-medium text-slate-900">
        <span className="text-purple-600 select-none font-bold shrink-0">{num}.</span>
        <span className="flex-1 leading-relaxed text-justify">
          {renderFormattedText(text)}
        </span>
      </div>
    );
  }

  return (
    <p key={index} className="mb-3 last:mb-0 leading-relaxed text-justify text-slate-800 font-light">
      {renderFormattedText(line)}
    </p>
  );
};

const renderContentWithFormatting = (content: string) => {
  if (!content) return null;
  const lines = content.split('\n');
  return lines.map((line, lIdx) => renderMessageLine(line, lIdx));
};

export const AnalysisReportView: React.FC<Props> = ({ 
  results, 
  synthesis,
  positiveHighlights = [],
  priorityDeviations = [],
  patientRoutineSummary = '',
  executiveAudioBriefing = '',
  noteId,
  suggestedFollowUpExams = [],
  longitudinalTrends,
  historicalRecords,
  referenceDate,
  clinicalContext,
  onPrepareExamRequest,
  onClose, 
  onEditSynthesis,
  onPrint,
  onDelete, 
  title = "Análise Laboratorial",
  showSynthesis = true,
  patientSex,
  onUpgradeToV2,
  isUpgradingToV2 = false,
  upgradeError = null,
}) => {
  const sortedResults = useMemo(() => sortExamResults(results), [results]);
  const isLegacyReport = Boolean(onUpgradeToV2);
  const validPositiveHighlights = useMemo(
    () =>
      Array.isArray(positiveHighlights)
        ? positiveHighlights.filter(
            (item) =>
              item &&
              typeof item === 'object' &&
              (Boolean(item.headline?.trim()) || Boolean(item.routineImpact?.trim()))
          )
        : [],
    [positiveHighlights]
  );

  const resolvedLongitudinalTrends = useMemo(() => {
    if (longitudinalTrends && typeof longitudinalTrends === 'object' && Object.keys(longitudinalTrends).length > 0) {
      return longitudinalTrends;
    }
    if (Array.isArray(historicalRecords) && historicalRecords.length > 0) {
      return computeLongitudinalTrends(sortedResults, historicalRecords, referenceDate, noteId);
    }
    return {};
  }, [longitudinalTrends, historicalRecords, sortedResults, referenceDate, noteId]);

  // Expanded Exam Panel State
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [expandedTrendIds, setExpandedTrendIds] = useState<Record<string, boolean>>({});
  const [expandedDeviations, setExpandedDeviations] = useState<Record<string, boolean>>({});
  const [isPatientPreviewOpen, setIsPatientPreviewOpen] = useState(false);

  const toggleTrendTimeline = (id: string) => {
    setExpandedTrendIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleDeviationAccordion = (key: string) => {
    setExpandedDeviations((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resolveDeviationTitle = (markerText: string): string => {
    const clean = (markerText || '').trim();
    if (!clean || /\([^)]*\d[^)]*\)/.test(clean)) return clean;
    const norm = clean.toLowerCase();
    const matched = sortedResults.find((r) => {
      const rName = (r.testName || '').toLowerCase();
      return rName === norm || rName.includes(norm) || norm.includes(rName);
    });
    if (!matched || !matched.value) return clean;
    const valuePart = [matched.value, matched.unit].filter(Boolean).join(' ').trim();
    return `${matched.testName} (${valuePart})`;
  };

  // Chat and Reference Upload State
  const [activeTab, setActiveTab] = useState<'synthesis' | 'chat'>('synthesis');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [refFiles, setRefFiles] = useState<{ name: string; base64?: string; mimeType?: string; textContent?: string }[]>([]);
  const [refFileError, setRefFileError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, activeTab]);

  const handleRefFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Reset input
    if (!file) return;

    setRefFileError(null);
    const normalizedMime = normalizeMimeType(file.type) || (file.name.toLowerCase().endsWith('.txt') ? 'text/plain' : '');

    if (!(ALLOWED_REFERENCE_MIME_TYPES as readonly string[]).includes(normalizedMime)) {
      setRefFileError(
        `Formato não permitido (${normalizedMime || 'desconhecido'}). Anexe apenas JPG, PNG, WebP, PDF ou TXT.`
      );
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setRefFileError(`O arquivo "${file.name}" (${sizeMb} MB) ultrapassa o limite máximo de 25 MB.`);
      return;
    }

    const reader = new FileReader();
    if (normalizedMime === 'text/plain') {
      reader.onloadend = () => {
        const rawText = typeof reader.result === 'string' ? reader.result : '';
        const { sanitized } = sanitizeClinicalTextPII(rawText);
        setRefFiles(prev => [...prev, {
          name: file.name,
          mimeType: 'text/plain',
          textContent: sanitized
        }]);
      };
      reader.onerror = () => setRefFileError('Não foi possível ler o arquivo de texto.');
      reader.readAsText(file);
    } else {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setRefFiles(prev => [...prev, {
          name: file.name,
          base64,
          mimeType: normalizedMime
        }]);
      };
      reader.onerror = () => setRefFileError('Não foi possível ler o arquivo selecionado.');
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveRefFile = (idx: number) => {
    setRefFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() && refFiles.length === 0) return;

    setRefFileError(null);
    const userText = sanitizeClinicalTextPII(chatInput).sanitized;
    setChatInput('');
    const newUserMsg = { role: 'user' as const, text: userText };
    setChatMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const historyParam = chatMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const reply = await chatWithClinicalAI(
        results,
        synthesis,
        historyParam,
        userText,
        refFiles,
        patientSex,
        clinicalContext
      );

      setChatMessages(prev => [...prev, { role: 'model' as const, text: reply }]);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || "Ocorreu um erro ao obter resposta do modelo clínico. Verifique sua conexão ou os anexos enviados.";
      setChatMessages(prev => [...prev, { role: 'model' as const, text: errMsg }]);
    } finally {
      setIsTyping(false);
      setRefFiles([]);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center pb-6 border-b border-slate-100 mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="text-medical-500 flex items-center justify-center">
             <Icons.Activity size={24} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {title}
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {isLegacyReport && onUpgradeToV2 && (
            <button
              type="button"
              onClick={onUpgradeToV2}
              disabled={isUpgradingToV2}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
              title="Recalcular alvos funcionais, razões e gerar Síntese 360°, Relatório do Paciente e Briefing em Áudio"
            >
              {isUpgradingToV2 ? (
                <>
                  <Icons.Loader2 size={15} className="animate-spin" />
                  <span>Atualizando Motor 360°...</span>
                </>
              ) : (
                <>
                  <Icons.Sparkles size={15} />
                  <span>Atualizar para Motor 360°</span>
                </>
              )}
            </button>
          )}

          {onEditSynthesis && (
            <button 
              onClick={onEditSynthesis} 
              className="flex items-center gap-2 text-slate-400 hover:text-amber-600 transition-all group"
            >
              <Icons.Pencil size={18} />
              <span className="text-sm font-semibold">Editar Laudo</span>
            </button>
          )}

          {onPrint && !onEditSynthesis && (
             <button 
              onClick={onPrint} 
              className="flex items-center gap-2 text-slate-400 hover:text-medical-600 transition-all group"
            >
              <Icons.Printer size={18} />
              <span className="text-sm font-semibold">Imprimir</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-all group"
              title="Limpar análise atual"
            >
              <Icons.Trash2 size={18} />
              <span className="text-sm font-semibold">Limpar</span>
            </button>
          )}
          
          {onClose && (
            <button 
              onClick={onClose} 
              className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-all group"
            >
              <Icons.X size={18} />
              <span className="text-sm font-semibold">Fechar</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden min-h-0">
        <div className={`${showSynthesis ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col`}>
          <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <Icons.FileText size={16} className="text-medical-500" />
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-[0.15em]">Bioquímica Detalhada</h3>
             </div>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total: {sortedResults.length} marcadores</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
             <div className="divide-y divide-slate-100/60">
                {sortedResults.map((exam, idx) => {
                  const examId = exam.id || idx.toString();
                  const isExpanded = expandedExamId === examId;
                  const knowledge = CLINICAL_KNOWLEDGE_BASE[exam.testName];
                  const lookupKey = normalizeExamLookup(exam.testName);
                  const canonicalKey = canonicalizeExamIdentity(exam.testName);
                  const trend =
                    (lookupKey && resolvedLongitudinalTrends[lookupKey]) ||
                    (canonicalKey && resolvedLongitudinalTrends[canonicalKey]);
                  const hasTrend = Boolean(trend && Array.isArray(trend.series) && trend.series.length >= 2);
                  const isTrendExpanded = Boolean(expandedTrendIds[examId]);

                  const trendPillStyle =
                    trend?.direction === 'oscillating'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : trend?.direction === 'falling'
                        ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                        : trend?.direction === 'rising'
                          ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';

                  return (
                    <div 
                      key={examId} 
                      onClick={() => {
                        if (knowledge) {
                          setExpandedExamId(isExpanded ? null : examId);
                        }
                      }}
                      className={`flex flex-col px-6 py-5 transition-all duration-300 gap-3 ${knowledge ? 'cursor-pointer hover:bg-slate-50/70' : ''} ${isExpanded ? 'bg-slate-50/50 shadow-inner' : ''}`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                        <div className="flex-1 min-w-0 w-full flex items-start gap-2.5">
                          {knowledge && (
                            <span className="text-slate-400 mt-1 select-none shrink-0 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                              <Icons.ChevronRight size={14} />
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-[15px] group-hover:text-medical-600 transition-colors leading-tight mb-1 truncate flex items-center gap-2">
                              {exam.testName}
                            </p>
                            <div className="flex flex-col gap-0.5 text-[13px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-medium">Alvo Funcional:</span>
                                <span className="text-slate-500 font-bold">{exam.referenceRange}</span>
                              </div>
                              {exam.notes && (
                                <p className="text-[12px] text-indigo-600 font-semibold mt-0.5">
                                  {exam.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto">
                          {hasTrend && trend && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTrendTimeline(examId);
                              }}
                              title="Clique para exibir a linha do tempo cronológica deste marcador"
                              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-all flex items-center gap-1.5 shadow-2xs ${trendPillStyle}`}
                            >
                              <span>{trend.summaryPill}</span>
                            </button>
                          )}
                          <div className="text-left sm:text-right flex flex-col items-start sm:items-end min-w-[90px]">
                            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mb-1 leading-none">resultado</span>
                            <p className="font-mono font-bold text-slate-800 text-[15px] leading-none">
                              {exam.value} <span className="text-xs text-slate-400 font-normal lowercase ml-1">{exam.unit}</span>
                            </p>
                          </div>
                          <StatusBadge status={exam.status} isMicronutrient={isMicronutrientExam(exam)} />
                        </div>
                      </div>

                      {hasTrend && trend && isTrendExpanded && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] font-mono text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1 animate-in fade-in duration-200"
                        >
                          <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-slate-400 mr-1">
                            Histórico:
                          </span>
                          {trend.series.map((pt, pIdx) => (
                            <React.Fragment key={`${pt.date}-${pIdx}`}>
                              {pIdx > 0 && <span className="text-slate-300">|</span>}
                              <span>
                                <strong className="text-slate-700">{pt.formattedDate || pt.date}:</strong>{' '}
                                {String(pt.value).replace('.', ',')}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {/* Interactive Clinical Knowledge Drawer */}
                      {isExpanded && knowledge && (
                        <div className="w-full mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>
                          {knowledge.causasAltas && knowledge.causasAltas.length > 0 && (
                            <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100">
                              <h4 className="font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
                                <Icons.AlertTriangle size={12} className="text-rose-500" /> Principais Causas de Alta
                              </h4>
                              <ul className="space-y-1 text-rose-950 font-medium list-disc list-inside">
                                {knowledge.causasAltas.slice(0, 5).map((item, i) => (
                                  <li key={i} className="truncate" title={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {knowledge.causasBaixas && knowledge.causasBaixas.length > 0 && (
                            <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
                              <h4 className="font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
                                <Icons.AlertTriangle size={12} className="text-blue-500" /> Principais Causas de Baixa
                              </h4>
                              <ul className="space-y-1 text-blue-950 font-medium list-disc list-inside">
                                {knowledge.causasBaixas.slice(0, 5).map((item, i) => (
                                  <li key={i} className="truncate" title={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {knowledge.sinaisAltos && knowledge.sinaisAltos.length > 0 && (
                            <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-100">
                              <h4 className="font-bold text-orange-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
                                <Icons.Activity size={12} className="text-orange-500" /> Sinais & Sintomas Clínicos (Altos)
                              </h4>
                              <ul className="space-y-1 text-orange-950 font-medium list-disc list-inside">
                                {knowledge.sinaisAltos.slice(0, 5).map((item, i) => (
                                  <li key={i} className="truncate" title={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {knowledge.sinaisBaixos && knowledge.sinaisBaixos.length > 0 && (
                            <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100">
                              <h4 className="font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
                                <Icons.Activity size={12} className="text-amber-500" /> Sinais & Sintomas Clínicos (Baixos)
                              </h4>
                              <ul className="space-y-1 text-amber-950 font-medium list-disc list-inside">
                                {knowledge.sinaisBaixos.slice(0, 5).map((item, i) => (
                                  <li key={i} className="truncate" title={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {knowledge.interferentes && knowledge.interferentes.length > 0 && (
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 col-span-1 md:col-span-2">
                              <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
                                <Icons.Info size={12} className="text-slate-500" /> Fatores de Interferência Laboratorial
                              </h4>
                              <p className="text-slate-600 font-medium leading-relaxed">
                                {knowledge.interferentes.join(', ')}.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
           </div>
        </div>

        {showSynthesis && (
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
             <div className="bg-white text-slate-800 rounded-[2rem] p-8 shadow-2xl flex flex-col border border-slate-200 h-full overflow-hidden">
                <div className="flex items-center gap-4 mb-4 shrink-0">
                   <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center ring-1 ring-purple-100">
                      <Icons.BrainCircuit size={24} className="text-purple-600" />
                   </div>
                   <div>
                      <h3 className="font-bold text-xl leading-tight tracking-tight text-slate-900">Síntese Funcional</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-1">Visão Sistêmica de Saúde</p>
                   </div>
                </div>

                {/* Tab selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4 shrink-0 text-xs border border-slate-200/50">
                   <button 
                     onClick={() => setActiveTab('synthesis')}
                     className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'synthesis' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     Laudo Original
                   </button>
                   <button 
                     onClick={() => setActiveTab('chat')}
                     className={`flex-1 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'chat' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                   >
                     <Icons.Bot size={13} />
                     Discussão Clínica
                     {chatMessages.length > 0 && (
                       <span className="bg-purple-500 text-[9px] text-white px-1.5 py-0.5 rounded-full leading-none font-bold">
                         {chatMessages.length}
                       </span>
                     )}
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col min-h-0">
                   {activeTab === 'synthesis' ? (
                     <div className="text-[15px] text-slate-700 leading-relaxed font-light text-justify space-y-6">
                        {isLegacyReport && onUpgradeToV2 && (
                          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <Icons.Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                                  Laudo salvo em versão anterior ao Motor 360°
                                </p>
                                <p className="text-xs text-amber-800 font-normal mt-0.5 leading-relaxed">
                                  Reprocesse este laudo para recalcular alvos funcionais, atualizar razões leucocitárias e gerar os blocos completos do Motor 360° (Síntese Técnica, Relatório do Paciente, Briefing Executivo em Áudio e Investigação Complementar).
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={onUpgradeToV2}
                              disabled={isUpgradingToV2}
                              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95"
                            >
                              {isUpgradingToV2 ? (
                                <>
                                  <Icons.Loader2 size={14} className="animate-spin" />
                                  <span>Atualizando...</span>
                                </>
                              ) : (
                                <>
                                  <Icons.Sparkles size={14} />
                                  <span>Atualizar para Motor 360°</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {upgradeError && (
                          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium flex items-center gap-2 text-left">
                            <Icons.AlertTriangle size={15} className="text-red-500 shrink-0" />
                            <span>{upgradeError}</span>
                          </div>
                        )}

                        <ClinicalVoiceNarrator
                          text={synthesis}
                          executiveBriefing={executiveAudioBriefing}
                          noteId={noteId}
                        />

                        {validPositiveHighlights.length > 0 && (
                          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 text-left shadow-sm">
                            <div className="flex items-center justify-between gap-3 mb-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                                  <Icons.CheckCircle size={16} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wider leading-none">
                                    Pontos Fortes & Valor na Rotina
                                  </h4>
                                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                                    Sistemas preservados e reservas bioquímicas favoráveis
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                                {validPositiveHighlights.length} {validPositiveHighlights.length === 1 ? 'eixo' : 'eixos'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {validPositiveHighlights.map((item, idx) => (
                                <div
                                  key={`${item.group}-${idx}`}
                                  className="bg-white/90 border border-emerald-100 rounded-xl p-3.5 shadow-sm flex flex-col gap-1.5"
                                >
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                                    {item.group}
                                  </span>
                                  <p className="text-xs font-bold text-slate-900 leading-snug">
                                    {item.headline}
                                  </p>
                                  <p className="text-xs text-slate-600 font-normal leading-relaxed">
                                    {item.routineImpact}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {Array.isArray(priorityDeviations) && priorityDeviations.length > 0 && (
                          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 text-left">
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <Icons.AlertTriangle size={16} className="text-amber-600" />
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                  Desvios Prioritários Identificados
                                </h4>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                {priorityDeviations.length} {priorityDeviations.length === 1 ? 'marcador' : 'marcadores'}
                              </span>
                            </div>
                            <div className="space-y-2.5">
                              {priorityDeviations.map((dev, idx) => {
                                const isCritico = dev.severity === 'critico';
                                const devKey = `${dev.marker}-${idx}`;
                                const isExpanded = Boolean(expandedDeviations[devKey]);
                                const displayTitle = resolveDeviationTitle(dev.marker);
                                const impacts = Array.isArray(dev.technicalImpacts)
                                  ? dev.technicalImpacts.filter(Boolean).slice(0, 6)
                                  : [];

                                return (
                                  <div
                                    key={devKey}
                                    className={`bg-white rounded-xl border overflow-hidden transition-colors ${isCritico ? 'border-rose-200 border-l-4 border-l-rose-500' : 'border-amber-200 border-l-4 border-l-amber-500'}`}
                                  >
                                    <button
                                      type="button"
                                      aria-expanded={isExpanded}
                                      onClick={() => toggleDeviationAccordion(devKey)}
                                      className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-slate-50/70 transition-colors"
                                    >
                                      <span className="text-xs font-bold text-slate-900 leading-snug">
                                        {displayTitle}
                                      </span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                          {dev.axis}
                                        </span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${isCritico ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                          {isCritico ? 'Prioritário' : 'Atenção'}
                                        </span>
                                        <span
                                          className="text-slate-400 transition-transform duration-200 shrink-0"
                                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                        >
                                          <Icons.ChevronRight size={14} />
                                        </span>
                                      </div>
                                    </button>

                                    {isExpanded && (
                                      <div className="px-4 pb-3.5 pt-2.5 border-t border-slate-100 bg-slate-50/40">
                                        {impacts.length > 0 ? (
                                          <ul className="space-y-1.5">
                                            {impacts.map((impact, impIdx) => {
                                              const colonIdx = impact.indexOf(':');
                                              const hasPrefix = colonIdx > 0 && colonIdx < 45;
                                              return (
                                                <li key={impIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug font-normal">
                                                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isCritico ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                  <span>
                                                    {hasPrefix ? (
                                                      <>
                                                        <strong className="font-semibold text-slate-900">
                                                          {impact.slice(0, colonIdx + 1)}
                                                        </strong>
                                                        {impact.slice(colonIdx + 1)}
                                                      </>
                                                    ) : (
                                                      impact
                                                    )}
                                                  </span>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        ) : (
                                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                            {dev.clinicalMeaning || 'Atualize este laudo para Motor 360° para visualizar os 6 impactos técnicos objetivos.'}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {patientRoutineSummary && (
                          <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl text-left overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setIsPatientPreviewOpen((prev) => !prev)}
                              className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-indigo-50/70 transition-colors"
                            >
                              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-2">
                                <Icons.Info size={14} className="text-indigo-500" />
                                Prévia de Comunicação ao Paciente
                              </span>
                              <span className="text-indigo-500 transition-transform duration-200" style={{ transform: isPatientPreviewOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                <Icons.ChevronRight size={15} />
                              </span>
                            </button>
                            {isPatientPreviewOpen && (
                              <div className="px-4 pb-4 pt-1 border-t border-indigo-100/70">
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                  {patientRoutineSummary}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          {renderContentWithFormatting(synthesis)}
                        </div>

                        {Array.isArray(suggestedFollowUpExams) && suggestedFollowUpExams.length > 0 && (
                          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 text-left shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm shrink-0">
                                  <Icons.FlaskConical size={16} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-purple-950 uppercase tracking-wider leading-none">
                                    Investigação Complementar (Catálogo Oficial)
                                  </h4>
                                  <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                                    Exames prontos para pré-seleção na guia de solicitação
                                  </p>
                                </div>
                              </div>
                              {onPrepareExamRequest && (
                                <button
                                  type="button"
                                  onClick={() => onPrepareExamRequest(suggestedFollowUpExams)}
                                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
                                >
                                  <Icons.Plus size={14} /> Preparar Solicitação
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {suggestedFollowUpExams.map((item, idx) => (
                                <div
                                  key={`${item.examName}-${idx}`}
                                  className="bg-white border border-purple-100 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm"
                                >
                                  <span className="text-xs font-bold text-slate-900">{item.examName}</span>
                                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                                    {item.groupName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                     </div>
                   ) : (
                     <div className="flex flex-col h-full justify-between min-h-0">
                       <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
                         {chatMessages.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 space-y-3">
                             <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                               <Icons.Bot size={24} className="text-purple-600" />
                             </div>
                             <p className="text-xs font-medium max-w-xs leading-relaxed">
                               Faça perguntas sobre os marcadores e relações fisiológicas deste paciente. Você também pode anexar artigos ou diretrizes de referência abaixo.
                             </p>
                           </div>
                         ) : (
                           chatMessages.map((msg, idx) => (
                             <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                               <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 px-1">
                                 {msg.role === 'user' ? 'Clínico' : 'Analista IA'}
                               </span>
                               <div className={`p-5 rounded-2xl max-w-[90%] text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none font-medium' : 'bg-slate-100 text-slate-800 rounded-tl-none font-light text-justify border border-slate-200/60'}`}>
                                 {renderContentWithFormatting(msg.text)}
                               </div>
                             </div>
                           ))
                         )}
                         {isTyping && (
                           <div className="flex items-center gap-2 text-[15px] text-purple-600 font-medium py-2 animate-pulse">
                             <Icons.Loader2 size={14} className="animate-spin" />
                             <span>Analisando correlações bioquímicas...</span>
                           </div>
                         )}
                         <div ref={chatEndRef} />
                       </div>

                       <div className="mt-4 pt-3 border-t border-slate-100 shrink-0">
                         {refFileError && (
                           <div className="mb-2.5 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 font-medium flex items-center justify-between gap-2">
                             <span>{refFileError}</span>
                             <button type="button" onClick={() => setRefFileError(null)} className="text-red-400 hover:text-red-700">
                               <Icons.X size={12} />
                             </button>
                           </div>
                         )}

                         {refFiles.length > 0 && (
                           <div className="flex flex-wrap gap-2 mb-3">
                             {refFiles.map((f, fIdx) => (
                               <div key={fIdx} className="bg-slate-100 text-slate-600 text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200 max-w-xs">
                                 <Icons.FileText size={10} className="text-purple-600 shrink-0" />
                                 <span className="truncate flex-1">{f.name}</span>
                                 <button type="button" onClick={() => handleRemoveRefFile(fIdx)} className="text-slate-400 hover:text-red-500 font-black" title="Remover">
                                   <Icons.X size={10} />
                                 </button>
                               </div>
                             ))}
                           </div>
                         )}

                         <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-500 transition-all">
                           <button 
                             type="button"
                             onClick={() => refFileInputRef.current?.click()}
                             className="p-2 text-slate-500 hover:text-purple-600 rounded-xl hover:bg-slate-100 transition-all"
                             title="Anexar arquivo de referência (JPG, PNG, WebP, PDF ou TXT até 25 MB)"
                           >
                             <Icons.Paperclip size={18} />
                           </button>
                           <input 
                             type="text" 
                             value={chatInput}
                             onChange={(e) => setChatInput(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                             placeholder="Perguntar à IA (sem dados pessoais do paciente)..."
                             disabled={isTyping}
                             className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-base sm:text-[15px] text-slate-800 placeholder-slate-400 min-w-0"
                           />
                           <button 
                             type="button"
                             onClick={handleSendChatMessage}
                             disabled={isTyping || (!chatInput.trim() && refFiles.length === 0)}
                             className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 transition-all"
                             title="Enviar mensagem"
                           >
                             <Icons.Send size={14} />
                           </button>
                         </div>
                         <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                           LGPD: anexe apenas JPG, PNG, WebP, PDF ou TXT (máx. 25 MB) sem dados cadastrais identificáveis.
                         </p>
                         <input 
                           ref={refFileInputRef}
                           type="file"
                           accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,.txt"
                           className="hidden"
                           onChange={handleRefFileUpload}
                         />
                       </div>
                     </div>
                   )}
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
