import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icon';
import {
  Patient,
  ClinicalNote,
  AnalysisStatus,
  ExamSuggestionItem,
  PreviousExamContextSummary,
  SuggestedFollowUpExam,
  ConsolidatedAlteredMarker,
  AlreadyTestedExamSummary,
  RecentExamRequestSummary,
  SuggestExamsOmittedSummary,
  LongitudinalTrend,
} from '../types';
import { EXAM_GROUPS } from '../data/medicalData';
import {
  normalizeExamLookup,
  canonicalizeExamIdentity,
  isCoreHemogramMarker,
} from '../data/examNormalization';
import { updatePatientLastVisit } from '../services/firebaseService';
import { suggestExamsWithAI, computeLongitudinalTrends } from '../services/geminiService';
import { sanitizeClinicalTextPII, PRINT_ASSETS, escapeHtml } from '../utils';
import { printHtmlDocument } from '../utils/printReport';

export interface PreselectedExamRequestPayload {
  exams: string[];
  observation?: string;
  nonce: number;
}

interface Props {
  patient: Patient;
  onSave: (patientId: string, note: ClinicalNote) => Promise<boolean> | void;
  onDelete: (patientId: string, noteId: string) => Promise<boolean> | void;
  preselectedRequest?: PreselectedExamRequestPayload | null;
  onConsumePreselected?: () => void;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const CONSOLIDATION_WINDOW_DAYS = 180;
const RECENT_REQUEST_WINDOW_DAYS = 45;
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

const getNoteDateLabel = (note: ClinicalNote): string | undefined => {
  const ref = (note.referenceDate || '').trim();
  if (ref) return ref;
  if (note.date) return note.date.split('T')[0];
  return undefined;
};

const computeDaysAgo = (timestampMs: number, nowMs: number): number => {
  if (!timestampMs || !Number.isFinite(timestampMs)) return 999;
  return Math.max(0, Math.floor((nowMs - timestampMs) / MS_PER_DAY));
};

const formatDaysAgoLabel = (daysAgo?: number): string => {
  if (typeof daysAgo !== 'number' || !Number.isFinite(daysAgo)) return '';
  const rounded = Math.max(0, Math.floor(daysAgo));
  if (rounded === 0) return 'hoje';
  if (rounded === 1) return 'há 1 dia';
  return `há ${rounded} dias`;
};

const getExamDedupeKey = (examName: string): string =>
  canonicalizeExamIdentity(examName) || normalizeExamLookup(examName);

const dedupeSelectedExams = (exams: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of exams) {
    const clean = (raw || '').trim();
    if (!clean) continue;
    const key = getExamDedupeKey(clean);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
};

const isExamInSelection = (selected: string[], examName: string): boolean => {
  const targetKey = getExamDedupeKey(examName);
  if (!targetKey) return false;
  return selected.some((item) => getExamDedupeKey(item) === targetKey);
};

const SEVERITY_RANK: Record<string, number> = {
  [AnalysisStatus.CRITICAL_LOW]: 0,
  [AnalysisStatus.CRITICAL_HIGH]: 0,
  [AnalysisStatus.CLINICAL_LOW]: 1,
  [AnalysisStatus.CLINICAL_HIGH]: 1,
  [AnalysisStatus.FUNCTIONAL_LOW]: 2,
  [AnalysisStatus.FUNCTIONAL_HIGH]: 2,
};

// Parser robusto compartilhado entre o histórico e a consolidação de solicitações recentes
const parseHistoryContent = (content: string) => {
  const safeContent = content || '';
  const parts = safeContent.split('\n\nMotivo/Obs: ');
  const rawExams = parts[0] || '';
  const examList = rawExams
    .split('\n')
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);

  const reason = parts[1] || 'Solicitação de rotina';
  return { examList, reason };
};

interface ConsolidatedMarkerEntry extends ConsolidatedAlteredMarker {
  markerKey: string;
  timestampMs: number;
  daysAgo: number;
  evaluationDateFormatted: string;
}

interface OpenGuideSummary {
  note: ClinicalNote;
  dateFormatted: string;
  timestampMs: number;
  daysAgo: number;
  totalCount: number;
  deliveredExams: string[];
  pendingExams: string[];
}

interface CatalogFollowUpTag {
  value: string;
  unit: string;
  isOscillating: boolean;
}

const buildFulfilledKeySet = (fulfilledExams?: Record<string, string>): Set<string> => {
  const set = new Set<string>();
  if (!fulfilledExams || typeof fulfilledExams !== 'object') return set;
  for (const rawKey of Object.keys(fulfilledExams)) {
    const canon = canonicalizeExamIdentity(rawKey);
    const norm = normalizeExamLookup(rawKey);
    if (canon) set.add(canon);
    if (norm) set.add(norm);
    if (rawKey) set.add(rawKey);
  }
  return set;
};

export const ExamRequest: React.FC<Props> = ({
  patient,
  onSave,
  onDelete,
  preselectedRequest,
  onConsumePreselected,
}) => {
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  
  const [observation, setObservation] = useState('');
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Assistente Preditivo de Solicitação + Blindagem Anti-Viés + Gaveta de Guias
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isGuidesDrawerOpen, setIsGuidesDrawerOpen] = useState(false);
  const [completingGuideId, setCompletingGuideId] = useState<string | null>(null);
  const [assistantKeywords, setAssistantKeywords] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<ExamSuggestionItem[]>([]);
  const [excludedMarkerKeys, setExcludedMarkerKeys] = useState<string[]>([]);
  const [omittedSuggestions, setOmittedSuggestions] = useState<SuggestExamsOmittedSummary>({
    recentlyRequested: [],
    biologicalWindow: [],
  });

  // Limpa estados transitórios do assistente ao trocar de paciente
  useEffect(() => {
    setExcludedMarkerKeys([]);
    setAiSuggestions([]);
    setOmittedSuggestions({ recentlyRequested: [], biologicalWindow: [] });
    setSuggestionError('');
    setIsGuidesDrawerOpen(false);
    setCompletingGuideId(null);
  }, [patient.id]);

  // 1. Consolidação por marcador nos últimos 180 dias + 2. Cruzamento com solicitações < 45 dias + 3. Janela biológica
  const historyIntelligence = useMemo(() => {
    const nowMs = Date.now();
    const notes = patient.consultationRecordings || [];

    const recentLabNotes = notes
      .filter((n) => n.type === 'lab-result')
      .map((note) => {
        const timestampMs = parseNoteTimestamp(note);
        return {
          note,
          timestampMs,
          daysAgo: computeDaysAgo(timestampMs, nowMs),
        };
      })
      .filter((entry) => entry.timestampMs > 0 && entry.daysAgo <= CONSOLIDATION_WINDOW_DAYS)
      .sort((a, b) => b.timestampMs - a.timestampMs);

    const latestResultByMarker = new Map<string, ConsolidatedMarkerEntry>();
    const latestTestedByMarker = new Map<string, { testName: string; evaluationDate?: string; daysAgo: number; timestampMs: number; status?: string }>();
    const pendingFollowUpMap = new Map<string, { item: SuggestedFollowUpExam; suggestedAtMs: number }>();

    for (const { note, timestampMs, daysAgo } of recentLabNotes) {
      const evaluationDate = getNoteDateLabel(note);
      let parsed: any = null;
      try {
        parsed = JSON.parse(note.content);
      } catch {
        parsed = null;
      }

      if (parsed && Array.isArray(parsed.results)) {
        let coreHemogramCount = 0;

        for (const r of parsed.results) {
          if (!r || !r.testName) continue;
          const testName = String(r.testName).trim();
          if (!testName) continue;

          if (isCoreHemogramMarker(testName)) {
            coreHemogramCount += 1;
          }

          const markerKey = canonicalizeExamIdentity(testName);
          if (!markerKey) continue;

          // Como iteramos da avaliação mais recente para a mais antiga, o primeiro registro é o status mais atual do marcador
          if (!latestResultByMarker.has(markerKey)) {
            latestResultByMarker.set(markerKey, {
              markerKey,
              testName,
              value: String(r.value ?? ''),
              unit: String(r.unit ?? ''),
              status: String(r.status || AnalysisStatus.UNKNOWN),
              evaluationDate,
              evaluationDateFormatted: formatIsoToPtBr(evaluationDate) || 'Data não informada',
              daysAgo,
              timestampMs,
            });
          }

          if (!latestTestedByMarker.has(markerKey)) {
            latestTestedByMarker.set(markerKey, {
              testName,
              evaluationDate,
              daysAgo,
              timestampMs,
              status: String(r.status || AnalysisStatus.UNKNOWN),
            });
          }
        }

        // Se o laudo trouxe um hemograma completo (>= 4 marcadores centrais), protege "Hemograma Completo" na janela biológica
        if (coreHemogramCount >= 4 && !latestTestedByMarker.has('hemograma_completo')) {
          latestTestedByMarker.set('hemograma_completo', {
            testName: 'Hemograma Completo',
            evaluationDate,
            daysAgo,
            timestampMs,
            status: 'TESTED',
          });
        }
      }

      // Coleta sugestões pendentes da síntese (preservando a mais recente)
      const noteFollowUps: SuggestedFollowUpExam[] =
        Array.isArray(note.suggestedFollowUpExams) && note.suggestedFollowUpExams.length > 0
          ? note.suggestedFollowUpExams
          : parsed && Array.isArray(parsed.suggestedFollowUpExams)
            ? parsed.suggestedFollowUpExams
            : [];

      for (const f of noteFollowUps) {
        if (!f || !f.examName) continue;
        const key = canonicalizeExamIdentity(f.examName);
        if (!key || pendingFollowUpMap.has(key)) continue;
        pendingFollowUpMap.set(key, {
          item: {
            examName: String(f.examName).trim(),
            groupName: String(f.groupName || '').trim(),
            justification: String(f.justification || '').trim(),
          },
          suggestedAtMs: timestampMs,
        });
      }
    }

    // Marcadores alterados consolidados (ordenados por severidade e depois recência)
    const consolidatedAlteredMarkers: ConsolidatedMarkerEntry[] = Array.from(latestResultByMarker.values())
      .filter(
        (m) =>
          m.status &&
          m.status !== AnalysisStatus.OPTIMIZED &&
          m.status !== AnalysisStatus.UNKNOWN
      )
      .sort((a, b) => {
        const rankA = SEVERITY_RANK[a.status] ?? 3;
        const rankB = SEVERITY_RANK[b.status] ?? 3;
        if (rankA !== rankB) return rankA - rankB;
        return a.daysAgo - b.daysAgo;
      });

    // Exames já realizados dentro de 60 dias (servidor aplica < 30d padrão e < 60d para ciclo longo)
    const alreadyTestedExams: AlreadyTestedExamSummary[] = Array.from(latestTestedByMarker.values())
      .filter((t) => t.daysAgo < 60)
      .map(({ testName, evaluationDate, daysAgo, status }) => ({
        testName,
        evaluationDate,
        daysAgo,
        status,
      }));

    // Remove sugestões de follow-up cujo marcador já foi efetivamente realizado em laudo posterior
    const pendingFollowUpExams: SuggestedFollowUpExam[] = Array.from(pendingFollowUpMap.entries())
      .filter(([key, entry]) => {
        const tested = latestTestedByMarker.get(key);
        return !tested || tested.timestampMs <= entry.suggestedAtMs;
      })
      .map(([, entry]) => entry.item)
      .slice(0, 15);

    // Cruzamento automático com solicitações abertas (últimos 90 dias) para gaveta de reconciliação
    const openRequestCandidates = notes
      .filter((n) => n.type === 'exam-request' && n.requestStatus !== 'completed')
      .map((note) => {
        const timestampMs = parseNoteTimestamp(note);
        return {
          note,
          timestampMs,
          daysAgo: computeDaysAgo(timestampMs, nowMs),
        };
      })
      .filter((entry) => entry.timestampMs > 0 && entry.daysAgo <= RECONCILIATION_WINDOW_DAYS)
      .sort((a, b) => b.timestampMs - a.timestampMs);

    const openGuides: OpenGuideSummary[] = [];
    const uniquePendingRecentKeys = new Set<string>();
    const recentlyRequestedMap = new Map<string, RecentExamRequestSummary>();

    for (const { note, timestampMs, daysAgo } of openRequestCandidates) {
      const requestDate = getNoteDateLabel(note);
      const dateFormatted = formatIsoToPtBr(requestDate || note.date);
      const rawExams =
        Array.isArray(note.exams) && note.exams.length > 0
          ? note.exams
          : parseHistoryContent(note.content).examList;
      const uniqueGuideExams = dedupeSelectedExams(rawExams);
      const fulfilledKeySet = buildFulfilledKeySet(note.fulfilledExams);

      const deliveredExams: string[] = [];
      const pendingExams: string[] = [];

      for (const examName of uniqueGuideExams) {
        const canonKey = canonicalizeExamIdentity(examName);
        const normKey = normalizeExamLookup(examName);
        const tested = canonKey ? latestTestedByMarker.get(canonKey) : undefined;
        const isFulfilledExplicit =
          (canonKey && fulfilledKeySet.has(canonKey)) ||
          (normKey && fulfilledKeySet.has(normKey)) ||
          fulfilledKeySet.has(examName);
        const isDeliveredByLab = Boolean(tested && tested.timestampMs >= timestampMs);

        if (isFulfilledExplicit || isDeliveredByLab) {
          deliveredExams.push(examName);
        } else {
          pendingExams.push(examName);
          const pendingKey = canonKey || normKey || examName;
          uniquePendingRecentKeys.add(pendingKey);

          if (daysAgo < RECENT_REQUEST_WINDOW_DAYS && canonKey && !recentlyRequestedMap.has(canonKey)) {
            recentlyRequestedMap.set(canonKey, {
              examName,
              requestDate,
              daysAgo,
            });
          }
        }
      }

      if (pendingExams.length > 0) {
        openGuides.push({
          note,
          dateFormatted,
          timestampMs,
          daysAgo,
          totalCount: uniqueGuideExams.length,
          deliveredExams,
          pendingExams,
        });
      }
    }

    // Agrupamento dos marcadores alterados por data da avaliação (ordem cronológica decrescente)
    const alteredByDateMap = new Map<string, { dateFormatted: string; timestampMs: number; markers: ConsolidatedMarkerEntry[] }>();
    for (const marker of consolidatedAlteredMarkers) {
      const dateKey = marker.evaluationDateFormatted || 'Sem data';
      const existing = alteredByDateMap.get(dateKey);
      if (existing) {
        existing.markers.push(marker);
      } else {
        alteredByDateMap.set(dateKey, {
          dateFormatted: dateKey,
          timestampMs: marker.timestampMs,
          markers: [marker],
        });
      }
    }
    const groupedAlteredMarkersByDate = Array.from(alteredByDateMap.values()).sort(
      (a, b) => b.timestampMs - a.timestampMs
    );

    // Mapa de micro-tags longitudinais para o catálogo (oscilação longitudinal OU alteração recente)
    const catalogFollowUpMap = new Map<string, CatalogFollowUpTag>();
    for (const marker of consolidatedAlteredMarkers) {
      if (!marker.value) continue;
      const tag: CatalogFollowUpTag = {
        value: marker.value,
        unit: marker.unit || '',
        isOscillating: false,
      };
      if (marker.markerKey) catalogFollowUpMap.set(marker.markerKey, tag);
      const norm = normalizeExamLookup(marker.testName);
      if (norm) catalogFollowUpMap.set(norm, tag);
    }

    if (recentLabNotes.length >= 2) {
      const latestNoteEntry = recentLabNotes[0];
      let latestParsed: any = null;
      try {
        latestParsed = JSON.parse(latestNoteEntry.note.content);
      } catch {
        latestParsed = null;
      }
      const latestResults = Array.isArray(latestParsed?.results) ? latestParsed.results : [];
      if (latestResults.length > 0) {
        const computedTrends: Record<string, LongitudinalTrend> =
          latestNoteEntry.note.longitudinalTrends &&
          Object.keys(latestNoteEntry.note.longitudinalTrends).length > 0
            ? latestNoteEntry.note.longitudinalTrends
            : computeLongitudinalTrends(
                latestResults,
                notes,
                getNoteDateLabel(latestNoteEntry.note),
                latestNoteEntry.note.id
              );

        for (const trend of Object.values(computedTrends) as LongitudinalTrend[]) {
          if (trend.direction === 'oscillating' && Array.isArray(trend.series) && trend.series.length > 0) {
            const latestVal = trend.currentValue || trend.series[trend.series.length - 1]?.value || '';
            if (!latestVal) continue;
            const tag: CatalogFollowUpTag = {
              value: latestVal,
              unit: trend.unit || '',
              isOscillating: true,
            };
            if (trend.markerKey) catalogFollowUpMap.set(trend.markerKey, tag);
            const canon = canonicalizeExamIdentity(trend.testName);
            if (canon) catalogFollowUpMap.set(canon, tag);
            const norm = normalizeExamLookup(trend.testName);
            if (norm) catalogFollowUpMap.set(norm, tag);
          }
        }
      }
    }

    const recentlyRequestedExams = Array.from(recentlyRequestedMap.values());
    const lastEvaluationDate = recentLabNotes[0] ? getNoteDateLabel(recentLabNotes[0].note) : undefined;
    const lastEvaluationDateFormatted = formatIsoToPtBr(lastEvaluationDate);

    return {
      lastEvaluationDate,
      lastEvaluationDateFormatted,
      consolidatedEvaluationsCount: recentLabNotes.length,
      consolidatedAlteredMarkers,
      groupedAlteredMarkersByDate,
      pendingFollowUpExams,
      alreadyTestedExams,
      recentlyRequestedExams,
      openGuides,
      totalPendingRecentCount: uniquePendingRecentKeys.size,
      catalogFollowUpMap,
    };
  }, [patient.consultationRecordings]);

  const activeAlteredMarkers = useMemo(
    () =>
      historyIntelligence.consolidatedAlteredMarkers.filter(
        (m) => !excludedMarkerKeys.includes(m.markerKey)
      ),
    [historyIntelligence.consolidatedAlteredMarkers, excludedMarkerKeys]
  );

  const toggleAlteredMarkerChip = (markerKey: string) => {
    setExcludedMarkerKeys((prev) =>
      prev.includes(markerKey) ? prev.filter((k) => k !== markerKey) : [...prev, markerKey]
    );
  };

  const handleSuggestExams = async () => {
    if (isSuggesting) return;
    setSuggestionError('');
    setIsSuggesting(true);
    try {
      const { sanitized } = sanitizeClinicalTextPII(assistantKeywords);
      const previousExamsContext: PreviousExamContextSummary = {
        lastEvaluationDate: historyIntelligence.lastEvaluationDate,
        consolidatedEvaluationsCount: historyIntelligence.consolidatedEvaluationsCount,
        windowDays: CONSOLIDATION_WINDOW_DAYS,
        alteredMarkers: activeAlteredMarkers.map(({ testName, value, unit, status, evaluationDate, daysAgo }) => ({
          testName,
          value,
          unit,
          status,
          evaluationDate,
          daysAgo,
        })),
        pendingFollowUpExams: historyIntelligence.pendingFollowUpExams,
        alreadyTestedExams: historyIntelligence.alreadyTestedExams,
        recentlyRequestedExams: historyIntelligence.recentlyRequestedExams,
      };

      const response = await suggestExamsWithAI({
        patientSex: patient.sex,
        patientAge: patient.age,
        symptomsAndGoals: sanitized,
        previousExamsContext,
        recentlyRequestedExams: historyIntelligence.recentlyRequestedExams,
        alreadyTestedExams: historyIntelligence.alreadyTestedExams,
      });

      setAiSuggestions(response.suggestions);
      const nextOmitted: SuggestExamsOmittedSummary = {
        recentlyRequested: response.omitted?.recentlyRequested || [],
        biologicalWindow: response.omitted?.biologicalWindow || [],
      };
      setOmittedSuggestions(nextOmitted);

      const totalOmitted = nextOmitted.recentlyRequested.length + nextOmitted.biologicalWindow.length;
      if (response.suggestions.length === 0 && totalOmitted === 0) {
        setSuggestionError('Nenhuma sugestão adicional encontrada para os parâmetros informados.');
      }
    } catch (err: any) {
      setSuggestionError(err?.message || 'Não foi possível gerar sugestões no momento.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleIncludeSuggestion = (examName: string, groupName?: string) => {
    setSelectedExams((prev) => dedupeSelectedExams([...prev, examName]));
    setIsSaved(false);
    if (groupName) {
      const matchedGroup = EXAM_GROUPS.find((g) => g.title === groupName);
      if (matchedGroup) {
        setExpandedGroup(matchedGroup.id);
      }
    }
  };

  const handleIncludeAllHighPriority = () => {
    const highPriorityExams = aiSuggestions
      .filter((s) => s.priority === 'alta')
      .map((s) => s.examName);
    if (highPriorityExams.length === 0) return;

    setSelectedExams((prev) => dedupeSelectedExams([...prev, ...highPriorityExams]));
    setIsSaved(false);
  };

  useEffect(() => {
    if (!preselectedRequest || !Array.isArray(preselectedRequest.exams) || preselectedRequest.exams.length === 0) {
      return;
    }

    const matchedCatalogExams: string[] = [];
    let firstMatchedGroupId: string | null = null;

    preselectedRequest.exams.forEach((rawName) => {
      const targetNorm = normalizeExamLookup(rawName);
      if (!targetNorm) return;

      for (const group of EXAM_GROUPS) {
        const exactMatch = group.exams.find((e) => normalizeExamLookup(e) === targetNorm);
        const partialMatch =
          exactMatch ||
          group.exams.find((e) => {
            const catNorm = normalizeExamLookup(e);
            return catNorm.includes(targetNorm) || targetNorm.includes(catNorm);
          });

        if (partialMatch) {
          if (!isExamInSelection(matchedCatalogExams, partialMatch)) {
            matchedCatalogExams.push(partialMatch);
          }
          if (!firstMatchedGroupId) {
            firstMatchedGroupId = group.id;
          }
          break;
        }
      }
    });

    if (matchedCatalogExams.length > 0) {
      setSelectedExams(dedupeSelectedExams(matchedCatalogExams));
      if (firstMatchedGroupId) {
        setExpandedGroup(firstMatchedGroupId);
      }
      if (preselectedRequest.observation) {
        setObservation(preselectedRequest.observation);
      }
      setEditingRequestId(null);
      setIsSaved(false);
      setSaveError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onConsumePreselected?.();
  }, [preselectedRequest?.nonce]);

  const toggleExam = (examName: string) => {
    setSelectedExams((prev) => {
      if (isExamInSelection(prev, examName)) {
        const targetKey = getExamDedupeKey(examName);
        return prev.filter((e) => getExamDedupeKey(e) !== targetKey);
      }
      return dedupeSelectedExams([...prev, examName]);
    });
    setIsSaved(false);
  };

  // FIX: Correção do Shadowing e Imutabilidade + remoção canônica sem duplicidade
  const removeExam = (examNameToRemove: string) => {
    const targetKey = getExamDedupeKey(examNameToRemove);
    setSelectedExams((prevExams) =>
      prevExams.filter((exam) => getExamDedupeKey(exam) !== targetKey)
    );
    setIsSaved(false);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  const toggleGroupSelection = (groupExams: string[]) => {
    setSelectedExams((prev) => {
      const allSelected = groupExams.every((exam) => isExamInSelection(prev, exam));
      if (allSelected) {
        const groupKeys = new Set(groupExams.map((exam) => getExamDedupeKey(exam)));
        return prev.filter((exam) => !groupKeys.has(getExamDedupeKey(exam)));
      }
      return dedupeSelectedExams([...prev, ...groupExams]);
    });
    setIsSaved(false);
  };

  const toggleHistoryItem = (id: string) => {
    setExpandedHistoryId(expandedHistoryId === id ? null : id);
  };

  const handleSaveRequest = async () => {
    const uniqueExams = dedupeSelectedExams(selectedExams);
    if (uniqueExams.length === 0 || isSaving) return;

    setSaveError('');
    setIsSaving(true);

    const nowIso = new Date().toISOString();
    const existingNote = editingRequestId
      ? patient.consultationRecordings?.find(n => n.id === editingRequestId)
      : undefined;
    const noteDate = existingNote?.date || nowIso;
    const cleanObs = observation.trim() || 'Solicitação de rotina';

    const note: ClinicalNote = {
        id: editingRequestId || `req-${Date.now()}`,
        date: noteDate,
        referenceDate: existingNote?.referenceDate || noteDate.split('T')[0],
        title: "Solicitação de Exames",
        content: `Exames Solicitados:\n${uniqueExams.map(e => `- ${e}`).join('\n')}\n\nMotivo/Obs: ${cleanObs}`,
        type: 'exam-request',
        exams: [...uniqueExams],
        observation: cleanObs,
        ...(existingNote?.fulfilledExams ? { fulfilledExams: existingNote.fulfilledExams } : {}),
        ...(existingNote?.reconciledAt ? { reconciledAt: existingNote.reconciledAt } : {}),
        requestStatus: existingNote?.requestStatus || 'open',
    };

    try {
      const saved = await onSave(patient.id, note);
      if (saved === false) {
        setSaveError('Não foi possível salvar no banco de dados. Verifique sua conexão ou permissões e tente novamente.');
        setIsSaved(false);
        return;
      }
      setSelectedExams(uniqueExams);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      setEditingRequestId(null);
    } catch (err) {
      console.error('Erro ao salvar solicitação:', err);
      setSaveError('Erro ao salvar solicitação no banco de dados. Tente novamente.');
      setIsSaved(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearStaging = () => {
      setSelectedExams([]);
      setObservation('');
      setEditingRequestId(null);
      setIsSaved(false);
      setSaveError('');
  };

  // FIX: Edição Isolada - Garante que o estado seja populado corretamente sem perdas ou duplicatas
  const handleEditHistory = (note: ClinicalNote) => {
      const parsed = parseHistoryContent(note.content);
      const sourceExams =
        Array.isArray(note.exams) && note.exams.length > 0 ? note.exams : parsed.examList;
      const reason = note.observation || parsed.reason;
      const uniqueExams = dedupeSelectedExams(sourceExams);
      
      if (uniqueExams.length > 0) {
          setSelectedExams(uniqueExams);
          setObservation(reason === 'Solicitação de rotina' ? '' : reason);
          setEditingRequestId(note.id);
          setIsSaved(false);
          // Scroll suave para o topo do formulário para melhor UX
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const handleReincludePendingExams = (pendingExams: string[]) => {
    if (!pendingExams.length) return;
    setSelectedExams((prev) => dedupeSelectedExams([...prev, ...pendingExams]));
    setIsSaved(false);
    setSaveError('');
  };

  const handleMarkGuideCompleted = async (guideNote: ClinicalNote) => {
    if (completingGuideId) return;
    setCompletingGuideId(guideNote.id);
    setSaveError('');
    try {
      const updatedGuide: ClinicalNote = {
        ...guideNote,
        requestStatus: 'completed',
        reconciledAt: new Date().toISOString(),
      };
      const saved = await onSave(patient.id, updatedGuide);
      if (saved === false) {
        setSaveError('Não foi possível encerrar a guia no momento. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao marcar guia como concluída:', err);
      setSaveError('Erro ao atualizar status da guia no banco de dados.');
    } finally {
      setCompletingGuideId(null);
    }
  };

  const handlePrintRequest = (note: ClinicalNote) => {
    const parsed = parseHistoryContent(note.content);
    const examList =
      Array.isArray(note.exams) && note.exams.length > 0 ? note.exams : parsed.examList;
    const dateFormatted = formatIsoToPtBr(note.referenceDate || note.date);
    const safePatientName = escapeHtml(patient.name || 'Paciente');
    const safeDate = escapeHtml(dateFormatted);
    const safeLogo = escapeHtml(PRINT_ASSETS.logo);
    const safeSignature = escapeHtml(PRINT_ASSETS.signature);

    const examItemsHtml = examList
      .map(
        (exam) => `
          <div class="exam-item">
            <span class="exam-bullet"></span>
            <span class="exam-name">${escapeHtml(exam)}</span>
          </div>
        `
      )
      .join('');

    const scopedPrintCss = `
      @page { size: A4; margin: 1.0cm 1.5cm 0.8cm 1.5cm; }
      #print-root * { box-sizing: border-box; }
      #print-root {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        line-height: 1.3;
      }
      #print-root .sheet {
        max-width: 820px;
        margin: 0 auto;
        border: 1px solid #e2e8f0;
        padding: 28px 32px;
        background: #ffffff;
      }
      #print-root .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #1e293b;
        padding-bottom: 10px;
        margin-bottom: 10px;
        gap: 16px;
      }
      #print-root .brand {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      #print-root .brand img {
        height: 62px;
        width: auto;
        object-fit: contain;
      }
      #print-root .title {
        margin: 0;
        font-size: 21px;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -0.02em;
        line-height: 1.2;
      }
      #print-root .subtitle {
        margin: 2px 0 0 0;
        font-size: 12px;
        font-weight: 500;
        color: #475569;
      }
      #print-root .date-box {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 8px 14px;
        text-align: center;
        background: #ffffff;
        flex-shrink: 0;
      }
      #print-root .date-label {
        margin: 0 0 4px 0;
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      #print-root .date-value {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
        line-height: 1;
      }
      #print-root .requester {
        margin: 0 0 6px 0;
        font-size: 14px;
        color: #0f172a;
      }
      #print-root .patient-row {
        margin: 0 0 12px 0;
        padding-bottom: 10px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 15px;
        color: #0f172a;
      }
      #print-root .patient-label {
        color: #64748b;
        margin-right: 6px;
      }
      #print-root .patient-name {
        font-weight: 700;
        text-transform: uppercase;
      }
      #print-root .exam-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: 28px;
        row-gap: 5px;
        margin-bottom: 8px;
      }
      #print-root .exam-item {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      #print-root .exam-bullet {
        width: 4px;
        height: 4px;
        border-radius: 9999px;
        background: #0f172a;
        flex-shrink: 0;
      }
      #print-root .exam-name {
        font-size: 13px;
        font-weight: 500;
        color: #1e293b;
        line-height: 1.3;
      }
      #print-root .signature-wrap {
        margin-top: 32px;
        display: flex;
        justify-content: center;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      #print-root .signature-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      #print-root .signature-inner img {
        height: 78px;
        width: auto;
        object-fit: contain;
      }
      #print-root .signature-line {
        width: 160px;
        height: 1px;
        background: #e2e8f0;
        margin: 2px 0 4px 0;
      }
      #print-root .signature-caption {
        margin: 0;
        font-size: 8px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      #print-root .footer {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      #print-root .footer p {
        margin: 0;
        font-size: 10px;
        color: #94a3b8;
      }
      @media print {
        #print-root .sheet {
          border: none;
          padding: 0;
        }
      }
    `;

    const printBodyHtml = `
      <div class="sheet">
        <div class="header">
          <div class="brand">
            <img src="${safeLogo}" alt="Logo Hemo Labor" />
            <div>
              <h1 class="title">Solicitação de Exames Laboratoriais</h1>
              <p class="subtitle">Hemo Labor • By Clinical Data</p>
            </div>
          </div>
          <div class="date-box">
            <p class="date-label">Data Solicitação</p>
            <p class="date-value">${safeDate}</p>
          </div>
        </div>

        <p class="requester">Solicitante: João Paulo G. Cecato | Nutricionista - CRN4 20100054</p>
        <p class="patient-row">
          <span class="patient-label">Paciente:</span>
          <span class="patient-name">${safePatientName}</span>
        </p>

        <div class="exam-grid">
          ${examItemsHtml}
        </div>

        <div class="signature-wrap">
          <div class="signature-inner">
            <img src="${safeSignature}" alt="Assinatura" />
            <div class="signature-line"></div>
            <p class="signature-caption">Assinatura Digitalizada</p>
          </div>
        </div>

        <div class="footer">
          <p>Documento gerado eletronicamente.</p>
        </div>
      </div>
    `;

    printHtmlDocument(
      printBodyHtml,
      `Solicitação de Exames - ${patient.name || 'Paciente'}`,
      scopedPrintCss
    );

    updatePatientLastVisit(patient.id);
  };

  const history = (patient.consultationRecordings || [])
    .filter(n => n.type === 'exam-request')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const historyCountAlteredTotal = historyIntelligence.consolidatedAlteredMarkers.length;
  const historyCountAlteredActive = activeAlteredMarkers.length;
  const evalCount = historyIntelligence.consolidatedEvaluationsCount;
  const pendingRecentCount = historyIntelligence.totalPendingRecentCount;
  const openGuides = historyIntelligence.openGuides;
  const highPriorityPendingCount = aiSuggestions.filter(
    (s) => s.priority === 'alta' && !isExamInSelection(selectedExams, s.examName)
  ).length;
  const omittedRecentCount = omittedSuggestions.recentlyRequested.length;
  const omittedWindowCount = omittedSuggestions.biologicalWindow.length;
  const hasOmittedSuggestions = omittedRecentCount > 0 || omittedWindowCount > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Assistente Inteligente de Solicitação (Barra compacta única + Gaveta de Guias Pendentes) */}
      <div className="bg-white rounded-xl border border-purple-200/80 shadow-sm overflow-hidden">
        <div className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-purple-50/70 to-white">
          <button
            type="button"
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Icons.Sparkles size={15} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block group-hover:text-purple-800 transition-colors">
                Assistente Inteligente de Solicitação
              </span>
              <span className="text-xs text-slate-600 block">
                {evalCount > 0 ? (
                  <>
                    Consolidado de <strong>{evalCount}</strong>{' '}
                    {evalCount === 1 ? 'avaliação' : 'avaliações'} (últimos 180 dias):{' '}
                    <strong>{historyCountAlteredActive}</strong> marcador(es) alterado(s) ativo(s)
                    {historyIntelligence.lastEvaluationDateFormatted
                      ? ` • última em ${historyIntelligence.lastEvaluationDateFormatted}`
                      : ''}
                    .
                  </>
                ) : (
                  'Sugestão preditiva por sexo, faixa etária e objetivos nutricionais (zero PII).'
                )}
              </span>
            </div>
          </button>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {pendingRecentCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsGuidesDrawerOpen((prev) => !prev);
                }}
                className={`min-h-[34px] text-[11px] font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${
                  isGuidesDrawerOpen
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                }`}
                title="Abrir gaveta de guias com exames pendentes"
              >
                <span>
                  {pendingRecentCount} {pendingRecentCount === 1 ? 'exame' : 'exames'} em solicitação recente ▾
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 hover:border-purple-300 bg-white text-xs font-semibold text-slate-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
              aria-expanded={isAssistantOpen}
            >
              <span>{isAssistantOpen ? 'Recolher' : 'Expandir'}</span>
              <Icons.ChevronDown
                size={15}
                className={`text-slate-400 transition-transform ${isAssistantOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Gaveta Expansível de Guias Recentes (por data, entregues vs pendentes) */}
        {isGuidesDrawerOpen && openGuides.length > 0 && (
          <div className="px-4 py-3 border-t border-purple-100 bg-purple-50/40 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                <Icons.Clock size={13} className="text-purple-600" />
                Guias em aberto (últimos 90 dias)
              </span>
              <button
                type="button"
                onClick={() => setIsGuidesDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                title="Fechar gaveta"
              >
                <Icons.X size={14} />
              </button>
            </div>

            <div className="space-y-2">
              {openGuides.map((guide) => {
                const isCompleting = completingGuideId === guide.note.id;
                return (
                  <div
                    key={guide.note.id}
                    className="bg-white border border-purple-200/70 rounded-xl p-3 space-y-2 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Guia {guide.dateFormatted} ·{' '}
                        <span className="text-emerald-700">
                          {guide.deliveredExams.length}{' '}
                          {guide.deliveredExams.length === 1 ? 'Entregue' : 'Entregues'} ✓
                        </span>{' '}
                        ·{' '}
                        <span className="text-amber-700">
                          {guide.pendingExams.length}{' '}
                          {guide.pendingExams.length === 1 ? 'Pendente' : 'Pendentes'} ⏳
                        </span>
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReincludePendingExams(guide.pendingExams)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 transition-colors flex items-center gap-1"
                        >
                          <Icons.Plus size={12} />
                          Re-incluir pendentes na guia atual
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkGuideCompleted(guide.note)}
                          disabled={isCompleting}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {isCompleting ? (
                            <Icons.Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Icons.Check size={12} />
                          )}
                          Marcar guia como concluída
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {guide.pendingExams.map((exam) => (
                        <span
                          key={`pending-${guide.note.id}-${exam}`}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80"
                        >
                          ⏳ {exam}
                        </span>
                      ))}
                      {guide.deliveredExams.map((exam) => (
                        <span
                          key={`delivered-${guide.note.id}-${exam}`}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50/70 text-emerald-700 border border-emerald-200/60 line-through decoration-emerald-400/70"
                        >
                          ✓ {exam}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isAssistantOpen && (
          <div className="p-4 border-t border-purple-100 bg-slate-50/40 space-y-4">
            {historyCountAlteredTotal > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700/90">
                    Marcadores alterados considerados (clique em 1 toque para desmarcar se já houver laudo externo)
                  </span>
                  {excludedMarkerKeys.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExcludedMarkerKeys([])}
                      className="text-[10px] font-bold text-purple-700 hover:text-purple-900 underline"
                    >
                      Marcar todos ({historyCountAlteredTotal})
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {historyIntelligence.groupedAlteredMarkersByDate.map((dateGroup) => (
                    <div
                      key={dateGroup.dateFormatted}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <span className="text-[11px] font-bold text-slate-600 mr-1 shrink-0">
                        {dateGroup.dateFormatted}:
                      </span>
                      {dateGroup.markers.map((marker) => {
                        const isChecked = !excludedMarkerKeys.includes(marker.markerKey);
                        const ageText = formatDaysAgoLabel(marker.daysAgo);
                        return (
                          <button
                            key={marker.markerKey}
                            type="button"
                            onClick={() => toggleAlteredMarkerChip(marker.markerKey)}
                            title={`${marker.testName}: ${marker.value} ${marker.unit} (${marker.evaluationDateFormatted}) — Clique para ${isChecked ? 'desconsiderar' : 'considerar'}`}
                            className={`min-h-[30px] px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
                              isChecked
                                ? 'bg-white text-purple-900 border-purple-300 shadow-2xs hover:border-purple-400'
                                : 'bg-slate-100/80 text-slate-400 border-slate-200 line-through hover:text-slate-600'
                            }`}
                          >
                            {isChecked ? (
                              <Icons.Check size={11} className="text-purple-600 shrink-0" />
                            ) : (
                              <Icons.X size={11} className="text-slate-400 shrink-0" />
                            )}
                            <span>{marker.testName}</span>
                            {ageText && (
                              <span
                                className={`text-[10px] font-medium ${
                                  isChecked ? 'text-purple-500' : 'text-slate-400'
                                }`}
                              >
                                ({ageText})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                  Palavras-chave (sinais, sintomas, objetivos ou condições conhecidas)
                </label>
                <input
                  type="text"
                  value={assistantKeywords}
                  onChange={(e) => setAssistantKeywords(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSuggestExams();
                    }
                  }}
                  placeholder="Ex.: fadiga crônica, queda de cabelo, resistência à insulina, suporte hepático..."
                  className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={handleSuggestExams}
                disabled={isSuggesting}
                className="min-h-[44px] px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
              >
                {isSuggesting ? (
                  <>
                    <Icons.Loader2 size={15} className="animate-spin" />
                    Analisando Catálogo...
                  </>
                ) : (
                  <>
                    <Icons.Wand2 size={15} />
                    Sugerir Exames
                  </>
                )}
              </button>
            </div>

            {suggestionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {suggestionError}
              </div>
            )}

            {hasOmittedSuggestions && (
              <div className="px-3 py-2 bg-slate-100/90 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Icons.ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                  Filtro anti-duplicidade ativo:
                </span>
                {omittedRecentCount > 0 && (
                  <span title={omittedSuggestions.recentlyRequested.join(', ')}>
                    <strong>{omittedRecentCount}</strong> omitido(s) por solicitação recente (&lt; 45d):{' '}
                    <span className="text-slate-500">{omittedSuggestions.recentlyRequested.join(', ')}</span>
                  </span>
                )}
                {omittedWindowCount > 0 && (
                  <span title={omittedSuggestions.biologicalWindow.join(', ')}>
                    <strong>{omittedWindowCount}</strong> omitido(s) por janela biológica (&lt; 30/60d):{' '}
                    <span className="text-slate-500">{omittedSuggestions.biologicalWindow.join(', ')}</span>
                  </span>
                )}
              </div>
            )}

            {aiSuggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Sugestões do Catálogo Oficial ({aiSuggestions.length})
                  </span>
                  {highPriorityPendingCount > 0 && (
                    <button
                      type="button"
                      onClick={handleIncludeAllHighPriority}
                      className="min-h-[40px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Icons.CheckSquare size={14} />
                      Incluir Todos de Alta Prioridade ({highPriorityPendingCount})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  {aiSuggestions.map((item) => {
                    const isIncluded = isExamInSelection(selectedExams, item.examName);
                    const isHigh = item.priority === 'alta';
                    return (
                      <div
                        key={item.examName}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                isHigh
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }`}
                            >
                              {isHigh ? 'Alta Prioridade' : 'Complementar'}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 truncate">
                              {item.groupName}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {item.examName}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1" title={item.reason}>
                            {item.reason}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleIncludeSuggestion(item.examName, item.groupName)}
                          disabled={isIncluded}
                          className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition-all ${
                            isIncluded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200'
                          }`}
                        >
                          {isIncluded ? (
                            <>
                              <Icons.Check size={13} /> Incluído
                            </>
                          ) : (
                            <>
                              <Icons.Plus size={13} /> Incluir
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[580px]">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-200">
                <div className="p-4 flex justify-between items-center bg-white border-b border-slate-200">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                        <Icons.FlaskConical className="text-medical-600" size={16} />
                        Catálogo de Exames
                    </h3>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-slate-50/50">
                {EXAM_GROUPS.map(group => {
                    const isAllSelected = group.exams.every(exam => isExamInSelection(selectedExams, exam));
                    
                    return (
                    <div key={group.id} className="mb-2 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className={`w-full px-3 py-2.5 flex items-center justify-between transition-colors cursor-pointer ${expandedGroup === group.id ? 'bg-slate-50' : 'hover:bg-slate-50'}`} onClick={() => toggleGroup(group.id)}>
                            <div className="flex items-center gap-3">
                                <div 
                                    onClick={(e) => { e.stopPropagation(); toggleGroupSelection(group.exams); }}
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAllSelected ? 'bg-medical-600 border-medical-600' : 'bg-white border-slate-300 hover:border-medical-400'}`}
                                >
                                    {isAllSelected && <Icons.CheckSquare size={10} className="text-white" />}
                                </div>
                                <span className="font-medium text-xs text-slate-700 uppercase tracking-tight">
                                    {group.title}
                                </span>
                            </div>
                            <Icons.ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedGroup === group.id ? 'rotate-180' : ''}`} />
                        </div>
                        {expandedGroup === group.id && (
                            <div className="p-2 grid grid-cols-1 gap-1 border-t border-slate-100">
                                {group.exams.map(exam => {
                                    const checked = isExamInSelection(selectedExams, exam);
                                    const followUpTag =
                                      historyIntelligence.catalogFollowUpMap.get(canonicalizeExamIdentity(exam)) ||
                                      historyIntelligence.catalogFollowUpMap.get(normalizeExamLookup(exam));
                                    return (
                                    <label key={exam} className="flex items-start gap-2 p-1.5 rounded hover:bg-medical-50 cursor-pointer group transition-colors">
                                        <div className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${checked ? 'bg-medical-600 border-medical-600' : 'border-slate-300 group-hover:border-medical-400'}`}>
                                            {checked && <Icons.CheckSquare size={9} className="text-white" />}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 flex-1">
                                          <span className="text-xs text-slate-600 group-hover:text-slate-900 select-none leading-tight">{exam}</span>
                                          {followUpTag && (
                                            <span
                                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border leading-none ${
                                                followUpTag.isOscillating
                                                  ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                                                  : 'bg-amber-50 text-amber-700 border-amber-200/80'
                                              }`}
                                              title={
                                                followUpTag.isOscillating
                                                  ? 'Marcador com oscilação longitudinal recente'
                                                  : 'Marcador alterado na última avaliação'
                                              }
                                            >
                                              Acompanhamento (último: {followUpTag.value}{followUpTag.unit ? ` ${followUpTag.unit}` : ''})
                                            </span>
                                          )}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={checked}
                                            onChange={() => toggleExam(exam)}
                                        />
                                    </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )})}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Icons.FileText className="text-medical-600" size={18} />
                    Resumo da Solicitação
                </h3>
                {selectedExams.length > 0 && (
                    <button onClick={handleClearStaging} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        Limpar tudo
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
                {selectedExams.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 opacity-60">
                        <Icons.FlaskConical size={48} strokeWidth={1} />
                        <p className="text-sm font-medium">Nenhum exame selecionado</p>
                        <p className="text-xs text-center max-w-[200px]">Selecione exames no catálogo à esquerda.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-600 uppercase">Exames ({selectedExams.length})</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {selectedExams.map((examName, idx) => (
                                    <div key={`${examName}-${idx}`} className="p-2.5 flex justify-between items-center hover:bg-slate-50 group animate-in fade-in slide-in-from-left-2 duration-200">
                                        <span className="text-sm text-slate-700 font-medium">{examName}</span>
                                        <button 
                                            onClick={() => removeExam(examName)} 
                                            className="text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <Icons.X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                             <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Motivo Clínico / Observação</label>
                             <textarea 
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                placeholder="Ex: Solicitação de rotina, Investigação de anemia..."
                                className="w-full text-sm p-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-medical-500 focus:border-medical-500 min-h-[80px] resize-y bg-slate-50"
                             />
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-white z-10 space-y-2">
                 {saveError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                        {saveError}
                    </div>
                 )}
                 <button 
                    onClick={handleSaveRequest}
                    disabled={selectedExams.length === 0 || isSaving}
                    className={`w-full py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95
                        ${isSaved ? 'bg-green-500 text-white ring-2 ring-green-300' : isSaving ? 'bg-medical-500 text-white opacity-80 cursor-wait' : editingRequestId ? 'bg-amber-500 text-white hover:bg-amber-600' : selectedExams.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-medical-600 text-white hover:bg-medical-700'}`}
                >
                    {isSaving ? <><Icons.Loader2 size={20} className="animate-spin" /> Salvando...</> : isSaved ? <><Icons.CheckCircle size={20} /> Salvo!</> : editingRequestId ? <><Icons.Save size={20} /> Atualizar</> : <><Icons.Save size={20} /> Salvar</>}
                </button>
            </div>
        </div>

        <div className="flex flex-col h-full overflow-hidden">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                        <Icons.Clock className="text-slate-500" size={16} />
                        Histórico
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
                    {history.length === 0 ? (
                        <div className="h-full flex items-center justify-center"><p className="text-xs text-slate-400">Nenhuma solicitação.</p></div>
                    ) : (
                        history.map(req => {
                            const { examList, reason } = parseHistoryContent(req.content);
                            const isExpanded = expandedHistoryId === req.id;
                            return (
                                <div key={req.id} className={`rounded-lg border transition-all bg-white group ${editingRequestId === req.id ? 'border-amber-400 ring-1 ring-amber-400' : isExpanded ? 'border-medical-200 shadow-sm' : 'border-slate-100 hover:border-medical-200'}`}>
                                    <div className="p-2 cursor-pointer flex justify-between items-start" onClick={() => toggleHistoryItem(req.id)}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Icons.ChevronDown size={12} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                <p className="text-xs font-bold text-slate-700">{formatIsoToPtBr(req.referenceDate || req.date)}</p>
                                                {req.requestStatus === 'completed' && (
                                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Concluída
                                                  </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5 pl-4 truncate">{reason}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                             <button onClick={(e) => { e.stopPropagation(); handleEditHistory(req); }} className="text-slate-300 hover:text-amber-500 p-1"><Icons.Pencil size={14} /></button>
                                             <button onClick={(e) => { e.stopPropagation(); handlePrintRequest(req); }} className="text-slate-300 hover:text-blue-600 p-1"><Icons.Printer size={14} /></button>
                                             <button onClick={(e) => { e.stopPropagation(); onDelete(patient.id, req.id); }} className="text-slate-300 hover:text-red-500 p-1"><Icons.Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="px-2 pb-2 pt-0 pl-6 animate-in slide-in-from-top-1">
                                            <div className="h-px bg-slate-100 mb-1.5 w-full"></div>
                                            <div className="flex flex-wrap gap-1">{examList.slice(0, 5).map((exam, idx) => (<span key={idx} className="text-[10px] bg-slate-50 border border-slate-100 px-1.5 rounded text-slate-600">{exam}</span>))}{examList.length > 5 && <span className="text-[10px] text-slate-400">+{examList.length - 5}</span>}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};