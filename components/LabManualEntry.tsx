import React, { useState } from 'react';
import { Icons } from './Icon';
import {
  ClinicalNote,
  Patient,
  ExamResult,
  PositiveHighlight,
  PriorityDeviation,
  SuggestedFollowUpExam,
  StructuredSynthesisResult,
  LongitudinalTrend,
} from '../types';
import { AnalysisReportView } from './AnalysisReportView';
import { sortExamResults } from '../utils';
import { printPatientReport, buildFallbackPatientPrintableReport } from '../utils/printReport';
import Modal from './Modal';
import {
  regenerateSynthesisFromResults,
  crossValidateResults,
  computeLongitudinalTrends,
} from '../services/geminiService';

interface Props {
  patient: Patient;
  onSave: (patientId: string, note: ClinicalNote) => Promise<boolean> | void;
  onDelete: (patientId: string, noteId: string) => Promise<boolean> | void;
  onPrepareExamRequest?: (exams: SuggestedFollowUpExam[]) => void;
  onNavigateToEvaluation?: () => void;
}

const formatPtBrDateClean = (rawDate?: string): string => {
  const trimmed = (rawDate || '').trim();
  if (!trimmed) return '-';
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[1]}/${brMatch[2]}/${brMatch[3]}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('pt-BR');
  }
  return trimmed;
};

const formatCleanCardTitle = (note: ClinicalNote): string => {
  const rawTitle = (note.title || '').trim();
  const strippedTitle = rawTitle
    .replace(/\s*[-·•]\s*\d{2}\/\d{2}\/\d{4}\s*$/g, '')
    .replace(/\s*\(\d{2}\/\d{2}\/\d{4}\)\s*$/g, '')
    .trim();
  const baseTitle =
    strippedTitle ||
    (note.type === 'exam-request' ? 'Solicitação de Exames' : 'Avaliação Smart');
  const dateStr = formatPtBrDateClean(note.referenceDate || note.date);
  return `${baseTitle} · ${dateStr}`;
};

const formatCleanExamsSubtitle = (note: ClinicalNote): string => {
  if (note.type === 'exam-request') {
    if (Array.isArray(note.exams) && note.exams.length > 0) {
      return `Exames Solicitados: ${note.exams.join(', ')}`;
    }
    const lines = (note.content || '')
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter((l) => l && !l.toUpperCase().startsWith('SOLICITAÇÃO') && !l.toUpperCase().startsWith('MOTIVO'));
    return lines.length > 0 ? `Exames Solicitados: ${lines.join(', ')}` : 'Exames Solicitados: -';
  }

  try {
    const parsed = JSON.parse(note.content);
    if (Array.isArray(parsed?.results) && parsed.results.length > 0) {
      const nonCalcNames = parsed.results
        .filter((r: ExamResult) => !r.id?.startsWith('calc-') && r.category !== 'Cálculos')
        .map((r: ExamResult) => (r.testName || '').trim())
        .filter(Boolean);
      const allNames =
        nonCalcNames.length > 0
          ? nonCalcNames
          : parsed.results.map((r: ExamResult) => (r.testName || '').trim()).filter(Boolean);
      const uniqueNames = Array.from(new Set(allNames));
      if (uniqueNames.length > 0) {
        return `Exames: ${uniqueNames.join(', ')}`;
      }
    }
  } catch {
    // Registro textual legado
  }

  const fallbackLines = (note.content || '')
    .split('\n')
    .map((line) => line.split(':')[0]?.trim())
    .filter((name) => Boolean(name) && name.length <= 50);

  if (fallbackLines.length > 0) {
    return `Exames: ${Array.from(new Set(fallbackLines)).join(', ')}`;
  }
  return 'Exames: Registro laboratorial';
};

export const LabManualEntry: React.FC<Props> = ({
  patient,
  onSave,
  onDelete,
  onPrepareExamRequest,
  onNavigateToEvaluation,
}) => {
  const [selectedReportNote, setSelectedReportNote] = useState<ClinicalNote | null>(null);

  // States para o Modal Dual de Relatório (Laudo Técnico CRM x Relatório do Paciente Impressão)
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportModalTab, setReportModalTab] = useState<'technical' | 'patient'>('technical');
  const [activeReportNote, setActiveReportNote] = useState<ClinicalNote | null>(null);
  const [reportText, setReportText] = useState('');
  const [patientReportText, setPatientReportText] = useState('');
  const [audioBriefingText, setAudioBriefingText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratedStructured, setRegeneratedStructured] = useState<StructuredSynthesisResult | null>(null);
  const [recalculatedResultsForModal, setRecalculatedResultsForModal] = useState<ExamResult[] | null>(null);
  const [upgradingNoteId, setUpgradingNoteId] = useState<string | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const isRichReport = (rawContent: string) => {
    try {
      const parsed = JSON.parse(rawContent);
      return Boolean(parsed && parsed.results && Array.isArray(parsed.results));
    } catch {
      return false;
    }
  };

  const isLegacyLabReport = (note: ClinicalNote): boolean => {
    if (!isRichReport(note.content)) return false;
    let parsed: Record<string, any> | null = null;
    try {
      const candidate = JSON.parse(note.content);
      if (candidate && typeof candidate === 'object') {
        parsed = candidate;
      }
    } catch {
      return false;
    }

    const resolvedSchema = note.schemaVersion || parsed?.schemaVersion;
    const hasPatientPrintable = Boolean(
      (typeof note.patientPrintableReport === 'string' && note.patientPrintableReport.trim()) ||
      (typeof parsed?.patientPrintableReport === 'string' && parsed.patientPrintableReport.trim())
    );
    const hasAudioBriefing = Boolean(
      (typeof note.executiveAudioBriefing === 'string' && note.executiveAudioBriefing.trim()) ||
      (typeof parsed?.executiveAudioBriefing === 'string' && parsed.executiveAudioBriefing.trim())
    );
    const resolvedDeviations: PriorityDeviation[] = Array.isArray(note.priorityDeviations)
      ? note.priorityDeviations
      : Array.isArray(parsed?.priorityDeviations)
        ? parsed.priorityDeviations
        : [];
    const missingTechnicalImpacts =
      resolvedDeviations.length > 0 &&
      resolvedDeviations.some(
        (d) => !Array.isArray(d?.technicalImpacts) || d.technicalImpacts.length === 0
      );
    const resolvedSynthesis = String(
      note.finalReport || parsed?.clinicalSynthesisMarkdown || parsed?.synthesis || ''
    );
    const hasLegacy6BlockHeadings = /###\s*(?:Alavancas de Maior Solução|Sinais de Alerta)\b/i.test(
      resolvedSynthesis
    );

    return (
      resolvedSchema !== '2.0' ||
      !hasPatientPrintable ||
      !hasAudioBriefing ||
      missingTechnicalImpacts ||
      hasLegacy6BlockHeadings
    );
  };

  const handleUpgradeReportToV2 = async (note: ClinicalNote) => {
    setUpgradeError(null);
    setUpgradingNoteId(note.id);
    try {
      let parsed: Record<string, any>;
      try {
        parsed = JSON.parse(note.content);
      } catch {
        throw new Error("O conteúdo deste registro não possui marcadores estruturados para atualização.");
      }

      const rawResults: ExamResult[] = Array.isArray(parsed?.results) ? parsed.results : [];
      if (rawResults.length === 0) {
        throw new Error("Nenhum marcador laboratorial encontrado neste laudo para reprocessamento.");
      }

      // 1. Recalcula alvos funcionais, status (sem minBuffer) e razões leucocitárias/metabólicas
      const recalculatedResults = sortExamResults(
        crossValidateResults(rawResults, "", patient.sex)
      );

      const longitudinalTrends = computeLongitudinalTrends(
        recalculatedResults,
        patient.consultationRecordings || [],
        note.referenceDate || note.date,
        note.id
      );

      // 2. Gera nova Síntese Funcional v2.0 coerente com os resultados recalculados e evolução longitudinal
      const structured = await regenerateSynthesisFromResults(
        recalculatedResults,
        patient.sex,
        undefined,
        longitudinalTrends
      );
      const finalMarkdown = structured.clinicalSynthesisMarkdown || structured.synthesis || '';

      // 3. Atualiza content JSON e campos de raiz com retrocompatibilidade total
      const updatedContent = JSON.stringify({
        ...parsed,
        results: recalculatedResults,
        synthesis: finalMarkdown,
        clinicalSynthesisMarkdown: finalMarkdown,
        positiveHighlights: structured.positiveHighlights || [],
        priorityDeviations: structured.priorityDeviations || [],
        patientRoutineSummary: structured.patientRoutineSummary || '',
        patientPrintableReport: structured.patientPrintableReport || '',
        executiveAudioBriefing: structured.executiveAudioBriefing || '',
        suggestedFollowUpExams: structured.suggestedFollowUpExams || [],
        longitudinalTrends,
        schemaVersion: '2.0',
      });

      const updatedNote: ClinicalNote = {
        ...note,
        content: updatedContent,
        finalReport: finalMarkdown,
        positiveHighlights: structured.positiveHighlights || [],
        priorityDeviations: structured.priorityDeviations || [],
        patientRoutineSummary: structured.patientRoutineSummary || '',
        patientPrintableReport: structured.patientPrintableReport || '',
        executiveAudioBriefing: structured.executiveAudioBriefing || '',
        suggestedFollowUpExams: structured.suggestedFollowUpExams || [],
        longitudinalTrends,
        schemaVersion: '2.0',
      };

      const saved = await onSave(patient.id, updatedNote);
      if (saved === false) {
        throw new Error("Falha ao persistir o laudo atualizado no Firebase Realtime Database. Verifique sua conexão e tente novamente.");
      }

      setSelectedReportNote(prev => (prev && prev.id === updatedNote.id ? updatedNote : prev));
    } catch (error: any) {
      console.error("Erro ao atualizar laudo para Motor 360°:", error);
      setUpgradeError(error?.message || "Falha ao atualizar laudo para Motor 360°.");
    } finally {
      setUpgradingNoteId(null);
    }
  };

  const handleRegenerateWithAI = async () => {
    if (!activeReportNote) return;
    setIsRegenerating(true);
    try {
      let resultsToUse: ExamResult[] = [];
      try {
        const parsed = JSON.parse(activeReportNote.content);
        if (parsed.results && Array.isArray(parsed.results)) {
          resultsToUse = parsed.results;
        }
      } catch {
        resultsToUse = [];
      }

      if (resultsToUse.length === 0) {
        setUpgradeError("Nenhum resultado de exame estruturado foi encontrado para regerar a síntese.");
        setIsRegenerating(false);
        return;
      }

      const recalculatedResults = sortExamResults(
        crossValidateResults(resultsToUse, "", patient.sex)
      );
      const longitudinalTrends = computeLongitudinalTrends(
        recalculatedResults,
        patient.consultationRecordings || [],
        activeReportNote.referenceDate || activeReportNote.date,
        activeReportNote.id
      );
      const structured = await regenerateSynthesisFromResults(
        recalculatedResults,
        patient.sex,
        undefined,
        longitudinalTrends
      );
      if (structured && structured.clinicalSynthesisMarkdown) {
        setReportText(structured.clinicalSynthesisMarkdown);
        setPatientReportText(
          structured.patientPrintableReport ||
            buildFallbackPatientPrintableReport(
              structured.patientRoutineSummary,
              recalculatedResults
            )
        );
        setAudioBriefingText(structured.executiveAudioBriefing || '');
        setRegeneratedStructured({
          ...structured,
          longitudinalTrends,
        });
        setRecalculatedResultsForModal(recalculatedResults);
      }
    } catch (error: any) {
      console.error("Erro ao regerar síntese por IA:", error);
      setUpgradeError(error?.message || "Ocorreu um erro ao regerar a síntese com o novo motor clínico. Tente novamente.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const openReportModal = (note: ClinicalNote) => {
    setActiveReportNote(note);
    setReportModalTab('technical');
    setRegeneratedStructured(null);
    setRecalculatedResultsForModal(null);

    let parsed: Record<string, any> | null = null;
    try {
      const candidate = JSON.parse(note.content);
      if (candidate && typeof candidate === 'object') {
        parsed = candidate;
      }
    } catch {
      parsed = null;
    }

    const technicalText =
      note.finalReport ||
      parsed?.clinicalSynthesisMarkdown ||
      parsed?.synthesis ||
      (parsed ? '' : note.content);

    const resolvedPatientText =
      (typeof note.patientPrintableReport === 'string' && note.patientPrintableReport.trim()
        ? note.patientPrintableReport
        : typeof parsed?.patientPrintableReport === 'string' && parsed.patientPrintableReport.trim()
          ? parsed.patientPrintableReport
          : buildFallbackPatientPrintableReport(
              note.patientRoutineSummary || parsed?.patientRoutineSummary || '',
              Array.isArray(parsed?.results) ? parsed.results : []
            ));

    const resolvedAudioBriefing =
      typeof note.executiveAudioBriefing === 'string' && note.executiveAudioBriefing.trim()
        ? note.executiveAudioBriefing
        : typeof parsed?.executiveAudioBriefing === 'string'
          ? parsed.executiveAudioBriefing
          : '';

    setReportText(technicalText);
    setPatientReportText(resolvedPatientText);
    setAudioBriefingText(resolvedAudioBriefing);
    setReportModalOpen(true);
  };

  const handleSaveReport = async () => {
    if (!activeReportNote) return;
    let updatedContent = activeReportNote.content;

    try {
      const parsed = JSON.parse(activeReportNote.content);
      if (parsed && typeof parsed === 'object') {
        updatedContent = JSON.stringify({
          ...parsed,
          ...(recalculatedResultsForModal ? { results: recalculatedResultsForModal } : {}),
          synthesis: reportText,
          clinicalSynthesisMarkdown: reportText,
          patientPrintableReport: patientReportText,
          ...(audioBriefingText ? { executiveAudioBriefing: audioBriefingText } : {}),
          ...(regeneratedStructured
            ? {
                positiveHighlights: regeneratedStructured.positiveHighlights,
                priorityDeviations: regeneratedStructured.priorityDeviations,
                patientRoutineSummary: regeneratedStructured.patientRoutineSummary,
                suggestedFollowUpExams: regeneratedStructured.suggestedFollowUpExams,
                longitudinalTrends: regeneratedStructured.longitudinalTrends,
                schemaVersion: '2.0',
              }
            : {}),
        });
      }
    } catch {
      updatedContent = activeReportNote.content;
    }

    const updatedNote: ClinicalNote = {
      ...activeReportNote,
      content: updatedContent,
      finalReport: reportText,
      patientPrintableReport: patientReportText,
      ...(audioBriefingText ? { executiveAudioBriefing: audioBriefingText } : {}),
      ...(regeneratedStructured
        ? {
            positiveHighlights: regeneratedStructured.positiveHighlights,
            priorityDeviations: regeneratedStructured.priorityDeviations,
            patientRoutineSummary: regeneratedStructured.patientRoutineSummary,
            suggestedFollowUpExams: regeneratedStructured.suggestedFollowUpExams,
            longitudinalTrends: regeneratedStructured.longitudinalTrends,
            schemaVersion: '2.0',
          }
        : {}),
    };

    try {
      const saved = await onSave(patient.id, updatedNote);
      if (saved === false) {
        setUpgradeError("Não foi possível salvar as alterações do laudo no Firebase Realtime Database. Tente novamente.");
        return;
      }
      setUpgradeError(null);
      setRegeneratedStructured(null);
      setRecalculatedResultsForModal(null);
      setReportModalOpen(false);
    } catch (error: any) {
      console.error("Erro ao salvar relatório final:", error);
      setUpgradeError(error?.message || "Erro ao salvar alterações do laudo.");
    }
  };

  const handleDeleteFullRecord = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    onDelete(patient.id, noteId);
  };

  const handlePrint = (
    note: ClinicalNote,
    overridePatientReport?: string,
    overrideFallbackTechnical?: string
  ) => {
    let parsed: Record<string, any> | null = null;
    try {
      const candidate = JSON.parse(note.content);
      if (candidate && typeof candidate === 'object') {
        parsed = candidate;
      }
    } catch {
      return;
    }

    const results: ExamResult[] = Array.isArray(parsed?.results) ? parsed.results : [];
    const savedPatientReport =
      typeof overridePatientReport === 'string' && overridePatientReport.trim()
        ? overridePatientReport
        : typeof note.patientPrintableReport === 'string' && note.patientPrintableReport.trim()
          ? note.patientPrintableReport
          : typeof parsed?.patientPrintableReport === 'string' && parsed.patientPrintableReport.trim()
            ? parsed.patientPrintableReport
            : undefined;

    const fallbackTechnical =
      overrideFallbackTechnical ||
      note.finalReport ||
      parsed?.clinicalSynthesisMarkdown ||
      parsed?.synthesis ||
      '';

    const routineSummary =
      note.patientRoutineSummary || parsed?.patientRoutineSummary || '';

    printPatientReport({
      patient,
      results,
      patientPrintableReport: savedPatientReport,
      fallbackReportText: fallbackTechnical,
      patientRoutineSummary: routineSummary,
      date: note.date,
    });
  };

  const history = (patient.consultationRecordings || [])
    .filter(n => n.type === 'lab-result')
    .sort((a, b) => {
      const dateA = a.referenceDate ? new Date(a.referenceDate).getTime() : new Date(a.date).getTime();
      const dateB = b.referenceDate ? new Date(b.referenceDate).getTime() : new Date(b.date).getTime();
      return dateB - dateA;
    });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 relative">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Icons.FileText className="text-medical-600" size={20} /> Histórico de Avaliações
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulte laudos estruturados, evolução longitudinal de marcadores e relatórios para impressão.
            </p>
          </div>

          {onNavigateToEvaluation && (
            <button
              type="button"
              onClick={onNavigateToEvaluation}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <Icons.Plus size={15} />
              <span>+ Nova Avaliação Smart</span>
            </button>
          )}
        </div>

        {upgradeError && !selectedReportNote && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-2 text-xs text-red-700 font-medium">
            <div className="flex items-center gap-2">
              <Icons.AlertTriangle size={15} className="text-red-500 shrink-0" />
              <span>{upgradeError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUpgradeError(null)}
              className="text-red-400 hover:text-red-700 p-1"
              title="Fechar aviso"
            >
              <Icons.X size={13} />
            </button>
          </div>
        )}

        {history.length === 0 ? (
          <div className="py-14 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Icons.Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Nenhuma avaliação laboratorial registrada</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Inicie uma Avaliação Smart para extrair exames via PDF, imagem, áudio ou texto estruturado.
              </p>
            </div>
            {onNavigateToEvaluation && (
              <button
                type="button"
                onClick={onNavigateToEvaluation}
                className="mt-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
              >
                <Icons.Plus size={14} />
                <span>+ Nova Avaliação Smart</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {history.map(item => {
              const isIA = isRichReport(item.content);
              const isLegacy = isLegacyLabReport(item);
              const isItemUpgrading = upgradingNoteId === item.id;
              const cleanTitle = formatCleanCardTitle(item);
              const examsSubtitle = formatCleanExamsSubtitle(item);

              return (
                <div
                  key={item.id}
                  className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-medical-200 ${
                    isIA ? 'border-l-4 border-l-purple-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        setUpgradeError(null);
                        if (isIA) {
                          setSelectedReportNote(item);
                        } else {
                          openReportModal(item);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isIA && <Icons.Sparkles size={14} className="text-purple-500 shrink-0" />}
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {cleanTitle}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {examsSubtitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 items-center bg-slate-50 rounded-xl p-1 shrink-0">
                      {isLegacy && (
                        <button
                          type="button"
                          disabled={Boolean(upgradingNoteId)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpgradeReportToV2(item);
                          }}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm"
                          title="Atualizar Laudo para Motor 360° (recalcular alvos, razões, relatório do paciente e briefing executivo)"
                        >
                          {isItemUpgrading ? (
                            <Icons.Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Icons.Sparkles size={12} />
                          )}
                          <span>{isItemUpgrading ? 'Atualizando...' : 'Atualizar para Motor 360°'}</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUpgradeError(null);
                          if (isIA) {
                            setSelectedReportNote(item);
                          } else {
                            openReportModal(item);
                          }
                        }}
                        className="text-slate-600 px-2 py-1.5 hover:bg-white rounded-lg text-[10px] font-bold uppercase transition-all"
                        title="Ver Análise"
                      >
                        <Icons.Activity size={14} />
                      </button>

                      {isIA && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReportModal(item);
                          }}
                          className="text-medical-600 px-2 py-1.5 hover:bg-white rounded-lg text-[10px] font-bold uppercase transition-all"
                          title="Relatório Final"
                        >
                          <Icons.FileText size={14} />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDeleteFullRecord(e, item.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-all"
                        title="Excluir Permanentemente"
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Relatório de Análises Clínicas"
        size="lg"
      >
        <div className="flex flex-col h-full space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs">
            <button
              type="button"
              onClick={() => setReportModalTab('technical')}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                reportModalTab === 'technical'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icons.BrainCircuit size={14} />
              <span>Laudo Técnico (CRM)</span>
            </button>
            <button
              type="button"
              onClick={() => setReportModalTab('patient')}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                reportModalTab === 'patient'
                  ? 'bg-medical-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icons.Printer size={14} />
              <span>Relatório do Paciente (Impressão)</span>
            </button>
          </div>

          <div
            className={`p-3.5 rounded-xl flex items-start gap-3 border ${
              reportModalTab === 'technical'
                ? 'bg-purple-50/60 border-purple-100 text-purple-900'
                : 'bg-medical-50 border-medical-100 text-medical-900'
            }`}
          >
            <Icons.Sparkles
              className={`shrink-0 mt-0.5 ${
                reportModalTab === 'technical' ? 'text-purple-600' : 'text-medical-600'
              }`}
              size={16}
            />
            <p className="text-[11px] leading-relaxed font-medium">
              {reportModalTab === 'technical'
                ? 'Versão técnica executiva (4 blocos 360°) salva no prontuário e sincronizada com o CRM para apoio à decisão nutricional.'
                : 'Versão acolhedora e propositiva destinada à impressão e entrega ao paciente. O botão "Imprimir Laudo Final" utiliza este conteúdo.'}
            </p>
          </div>

          {reportModalTab === 'technical' ? (
            <textarea
              autoFocus
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Síntese técnica estruturada em 4 blocos (1. Resumo Geral, 2. Eixos Avaliados, 3. Triangulação & Dependências Bioquímicas e Medicamentosas, 4. Investigação Complementar Sugerida)..."
              className="w-full h-[420px] p-6 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 font-sans text-base sm:text-sm leading-relaxed outline-none focus:ring-2 focus:ring-purple-500/20 resize-none shadow-inner"
            />
          ) : (
            <textarea
              autoFocus
              value={patientReportText}
              onChange={(e) => setPatientReportText(e.target.value)}
              placeholder="Relatório acolhedor e propositivo voltado ao paciente para impressão..."
              className="w-full h-[420px] p-6 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 font-sans text-base sm:text-sm leading-relaxed outline-none focus:ring-2 focus:ring-medical-500/20 resize-none shadow-inner"
            />
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="px-5 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRegenerateWithAI}
                disabled={isRegenerating}
                className="px-5 py-2.5 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 rounded-xl text-sm font-bold shadow-md flex items-center gap-2 transition-all"
              >
                <Icons.Sparkles
                  size={16}
                  className={isRegenerating ? 'animate-spin text-amber-300' : 'text-amber-300'}
                />
                {isRegenerating ? 'Regerando com Motor 360°...' : 'Regerar com Motor 360°'}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveReport}
                className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-bold shadow-md flex items-center gap-2"
              >
                <Icons.Save size={16} /> Salvar Alterações
              </button>
              <button
                type="button"
                onClick={() =>
                  activeReportNote && handlePrint(activeReportNote, patientReportText, reportText)
                }
                className="px-6 py-2.5 bg-medical-600 text-white hover:bg-medical-700 rounded-xl text-sm font-bold shadow-md flex items-center gap-2"
              >
                <Icons.Printer size={16} /> Imprimir Laudo Final
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {selectedReportNote && (
        <div className="fixed inset-0 z-50 bg-[#0f172a]/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[1820px] h-[90vh] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col border border-white/20">
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar min-h-0">
              {(() => {
                let data: {
                  results?: ExamResult[];
                  synthesis?: string;
                  clinicalSynthesisMarkdown?: string;
                  positiveHighlights?: PositiveHighlight[];
                  priorityDeviations?: PriorityDeviation[];
                  patientRoutineSummary?: string;
                  patientPrintableReport?: string;
                  executiveAudioBriefing?: string;
                  suggestedFollowUpExams?: SuggestedFollowUpExam[];
                  longitudinalTrends?: Record<string, LongitudinalTrend>;
                  schemaVersion?: string;
                } = { results: [], synthesis: '' };
                try {
                  data = JSON.parse(selectedReportNote.content);
                } catch {
                  data = { results: [], synthesis: selectedReportNote.content };
                }

                const resolvedSynthesis =
                  selectedReportNote.finalReport ||
                  data.clinicalSynthesisMarkdown ||
                  data.synthesis ||
                  '';
                const resolvedHighlights = Array.isArray(selectedReportNote.positiveHighlights)
                  ? selectedReportNote.positiveHighlights
                  : Array.isArray(data.positiveHighlights)
                    ? data.positiveHighlights
                    : [];
                const resolvedDeviations = Array.isArray(selectedReportNote.priorityDeviations)
                  ? selectedReportNote.priorityDeviations
                  : Array.isArray(data.priorityDeviations)
                    ? data.priorityDeviations
                    : [];
                const resolvedRoutineSummary =
                  typeof selectedReportNote.patientRoutineSummary === 'string'
                    ? selectedReportNote.patientRoutineSummary
                    : typeof data.patientRoutineSummary === 'string'
                      ? data.patientRoutineSummary
                      : '';
                const resolvedAudioBriefing =
                  typeof selectedReportNote.executiveAudioBriefing === 'string'
                    ? selectedReportNote.executiveAudioBriefing
                    : typeof data.executiveAudioBriefing === 'string'
                      ? data.executiveAudioBriefing
                      : '';
                const resolvedFollowUp = Array.isArray(selectedReportNote.suggestedFollowUpExams)
                  ? selectedReportNote.suggestedFollowUpExams
                  : Array.isArray(data.suggestedFollowUpExams)
                    ? data.suggestedFollowUpExams
                    : [];
                const resolvedLongitudinalTrends =
                  selectedReportNote.longitudinalTrends &&
                  typeof selectedReportNote.longitudinalTrends === 'object'
                    ? selectedReportNote.longitudinalTrends
                    : data.longitudinalTrends && typeof data.longitudinalTrends === 'object'
                      ? data.longitudinalTrends
                      : undefined;
                const resolvedSchemaVersion =
                  selectedReportNote.schemaVersion || data.schemaVersion;
                const canUpgrade = isLegacyLabReport(selectedReportNote);

                return (
                  <AnalysisReportView
                    results={Array.isArray(data.results) ? data.results : []}
                    synthesis={resolvedSynthesis}
                    positiveHighlights={resolvedHighlights}
                    priorityDeviations={resolvedDeviations}
                    patientRoutineSummary={resolvedRoutineSummary}
                    executiveAudioBriefing={resolvedAudioBriefing}
                    noteId={selectedReportNote.id}
                    suggestedFollowUpExams={resolvedFollowUp}
                    longitudinalTrends={resolvedLongitudinalTrends}
                    historicalRecords={patient.consultationRecordings}
                    referenceDate={selectedReportNote.referenceDate || selectedReportNote.date}
                    schemaVersion={resolvedSchemaVersion}
                    onUpgradeToV2={
                      canUpgrade
                        ? () => handleUpgradeReportToV2(selectedReportNote)
                        : undefined
                    }
                    isUpgradingToV2={upgradingNoteId === selectedReportNote.id}
                    upgradeError={upgradeError}
                    onPrepareExamRequest={
                      onPrepareExamRequest
                        ? (exams) => {
                            setSelectedReportNote(null);
                            onPrepareExamRequest(exams);
                          }
                        : undefined
                    }
                    onClose={() => {
                      setUpgradeError(null);
                      setSelectedReportNote(null);
                    }}
                    onEditSynthesis={() => {
                      const noteToEdit = selectedReportNote;
                      setSelectedReportNote(null);
                      openReportModal(noteToEdit);
                    }}
                    onPrint={() => handlePrint(selectedReportNote)}
                    title={`Dashboard Analítico: ${formatPtBrDateClean(selectedReportNote.referenceDate || selectedReportNote.date)}`}
                    patientSex={patient.sex}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

