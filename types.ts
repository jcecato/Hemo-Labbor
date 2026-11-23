export enum AnalysisStatus {
  CRITICAL_LOW = 'CRITICAL_LOW',   // ↓↓
  CLINICAL_LOW = 'CLINICAL_LOW',   // ↓
  FUNCTIONAL_LOW = 'FUNCTIONAL_LOW', // ↘
  OPTIMIZED = 'OPTIMIZED',         // ↔
  FUNCTIONAL_HIGH = 'FUNCTIONAL_HIGH', // ↗
  CLINICAL_HIGH = 'CLINICAL_HIGH', // ↑
  CRITICAL_HIGH = 'CRITICAL_HIGH', // ↑↑
  UNKNOWN = 'UNKNOWN'
}

export interface ExamResult {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string; // Agora tratada como Alvo Ideal/Funcional
  status: AnalysisStatus;
  category?: string;
  notes?: string;
}

export interface ClinicalContext {
  knownConditions?: string[];
  symptoms?: string[];
  goals?: string[];
  medications?: string[];
  notes?: string;
}

export interface PositiveHighlight {
  group: string;
  headline: string;
  routineImpact: string;
}

export interface PriorityDeviation {
  marker: string;
  axis: string;
  severity: 'critico' | 'alerta';
  clinicalMeaning: string;
  technicalImpacts?: string[];
  routineTranslation: string;
}

export interface SuggestedFollowUpExam {
  examName: string;
  groupName: string;
  justification: string;
}

export interface ExamSuggestionItem {
  examName: string;
  groupName: string;
  priority: 'alta' | 'complementar';
  reason: string;
}

export interface ConsolidatedAlteredMarker {
  markerKey?: string;
  testName: string;
  value: string;
  unit: string;
  status: string;
  evaluationDate?: string;
  evaluationDateFormatted?: string;
  daysAgo?: number;
}

export type LongitudinalDirection = 'falling' | 'rising' | 'oscillating' | 'stable';

export interface LongitudinalPoint {
  date: string;
  formattedDate?: string;
  value: string;
  numericValue?: number;
  unit: string;
  status?: AnalysisStatus;
}

export interface LongitudinalTrend {
  markerKey: string;
  testName: string;
  unit: string;
  direction: LongitudinalDirection;
  deltaPercent: number;
  series: LongitudinalPoint[];
  previousValue: string;
  currentValue: string;
  summaryPill: string;
}

export interface AlreadyTestedExamSummary {
  testName: string;
  evaluationDate?: string;
  daysAgo: number;
  status?: string;
}

export interface RecentExamRequestSummary {
  examName: string;
  requestDate?: string;
  daysAgo: number;
}

export interface PreviousExamContextSummary {
  lastEvaluationDate?: string;
  consolidatedEvaluationsCount?: number;
  windowDays?: number;
  alteredMarkers: ConsolidatedAlteredMarker[];
  pendingFollowUpExams: SuggestedFollowUpExam[];
  alreadyTestedExams?: AlreadyTestedExamSummary[];
  recentlyRequestedExams?: RecentExamRequestSummary[];
}

export interface SuggestExamsOmittedSummary {
  recentlyRequested: string[];
  biologicalWindow: string[];
}

export interface SuggestExamsResponse {
  suggestions: ExamSuggestionItem[];
  omitted?: SuggestExamsOmittedSummary;
}

export interface StructuredSynthesisResult {
  clinicalSynthesisMarkdown: string;
  synthesis: string;
  positiveHighlights: PositiveHighlight[];
  priorityDeviations: PriorityDeviation[];
  patientRoutineSummary: string;
  patientPrintableReport: string;
  executiveAudioBriefing: string;
  suggestedFollowUpExams: SuggestedFollowUpExam[];
  longitudinalTrends?: Record<string, LongitudinalTrend>;
  schemaVersion: string;
}

export type NoteType = 'recording' | 'text' | 'lab-result' | 'exam-request' | 'referral';

export interface ClinicalNote {
  id: string;
  date: string;
  referenceDate?: string;
  title: string;
  content: string;
  type: NoteType;
  audioUrl?: string;
  finalReport?: string; // Campo para o laudo médico conclusivo (manual)
  exams?: string[];
  observation?: string;
  positiveHighlights?: PositiveHighlight[];
  priorityDeviations?: PriorityDeviation[];
  patientRoutineSummary?: string;
  patientPrintableReport?: string;
  executiveAudioBriefing?: string;
  suggestedFollowUpExams?: SuggestedFollowUpExam[];
  longitudinalTrends?: Record<string, LongitudinalTrend>;
  fulfilledExams?: Record<string, string>;
  reconciledAt?: string;
  requestStatus?: 'open' | 'completed';
  schemaVersion?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'male' | 'female';
  photoUrl?: string;
  email?: string;
  status: 'active' | 'inactive';
  lastVisit?: string;
  consultationRecordings?: ClinicalNote[];
}