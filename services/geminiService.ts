import {
  ExamResult,
  AnalysisStatus,
  ClinicalContext,
  PositiveHighlight,
  PriorityDeviation,
  SuggestedFollowUpExam,
  StructuredSynthesisResult,
  PreviousExamContextSummary,
  AlreadyTestedExamSummary,
  RecentExamRequestSummary,
  SuggestExamsResponse,
  LongitudinalTrend,
  LongitudinalPoint,
  LongitudinalDirection,
  ClinicalNote,
} from '../types';
import { CLINICAL_KNOWLEDGE_BASE } from '../data/clinicalKnowledge';
import { canonicalizeExamIdentity, normalizeExamLookup } from '../data/examNormalization';
import { auth } from './firebaseService';
import { sortExamResults } from '../utils';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (!user) return headers;

  try {
    const token = await user.getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  } catch (err: any) {
    const rawMsg = String(err?.message || err?.code || '');
    const is403OrTokenService =
      rawMsg.includes('403') ||
      rawMsg.toLowerCase().includes('securetoken') ||
      rawMsg.toLowerCase().includes('forbidden') ||
      rawMsg.toLowerCase().includes('permission') ||
      rawMsg.includes('auth/internal-error');

    if (is403OrTokenService) {
      throw new Error(
        'Falha ao renovar sessão do Firebase (403). Faça login novamente ou verifique a liberação do domínio *.run.app e da Token Service API na chave Web do GCP.'
      );
    }

    throw new Error(
      `Falha ao obter token de autenticação do Firebase (${rawMsg || 'erro desconhecido'}). Faça login novamente ou verifique a liberação do domínio *.run.app e da Token Service API na chave Web do GCP.`
    );
  }
};

const postGeminiApi = async <T>(endpoint: string, payload: unknown): Promise<T> => {
  const headers = await getAuthHeaders();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const serverMsg = typeof data?.error === 'string' && data.error.trim() ? data.error.trim() : '';
    throw new Error(
      serverMsg
        ? `[HTTP ${response.status}] ${serverMsg}`
        : `Falha na requisição para ${endpoint} (HTTP ${response.status}).`
    );
  }
  return data as T;
};

export interface UnifiedAnalysis {
  results: ExamResult[];
  synthesis: string;
  clinicalSynthesisMarkdown?: string;
  positiveHighlights?: PositiveHighlight[];
  priorityDeviations?: PriorityDeviation[];
  patientRoutineSummary?: string;
  patientPrintableReport?: string;
  executiveAudioBriefing?: string;
  suggestedFollowUpExams?: SuggestedFollowUpExam[];
  longitudinalTrends?: Record<string, LongitudinalTrend>;
  schemaVersion?: string;
}

/**
 * Analisa e normaliza resultados médicos com base no banco de conhecimentos clínicos,
 * preenchendo alvos ideais e recalculando os status de forma 100% matemática e exata.
 */
const parseNumericValue = (valStr: any): number | null => {
  if (valStr === undefined || valStr === null) return null;
  let str = String(valStr).trim();
  if (!str) return null;

  // Se for percentual (contém '%')
  if (str.includes('%')) {
    const pctMatch = str.match(/(\d+([.,]\d+)?)\s*%/);
    if (pctMatch && pctMatch[1]) {
      const parsed = parseFloat(pctMatch[1].replace(',', '.'));
      return isNaN(parsed) ? null : parsed;
    }
  }

  let cleanStr = str.replace(/\.(\d{3})(?!\d)/g, '$1'); // 1.932 -> 1932
  const numbers = cleanStr.match(/(\d+([.,]\d+)?)/g);
  if (numbers && numbers.length >= 2 && !str.includes('%')) {
    const secondNum = parseFloat(numbers[1].replace(',', '.'));
    return isNaN(secondNum) ? null : secondNum;
  } else if (numbers && numbers.length >= 1) {
    const parsed = parseFloat(numbers[0].replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
  }

  const clean = str.toLowerCase().replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? null : parsed;
};

export const getGenderSpecificIdeal = (idealStr: string, sex?: 'male' | 'female'): string => {
  if (!idealStr) return "";
  if (!sex) return idealStr;

  const clauses = idealStr.split('|').map(c => c.trim());
  if (clauses.length <= 1) return idealStr;

  if (sex === 'male') {
    const maleClause = clauses.find(c => {
      const lc = c.toLowerCase();
      return lc.includes('homen') || lc.includes('masculin') || lc.includes('homem');
    });
    if (maleClause) return maleClause;
  } else {
    const femaleClause = clauses.find(c => {
      const lc = c.toLowerCase();
      return lc.includes('mulher') || lc.includes('feminin');
    });
    if (femaleClause) return femaleClause;
  }

  return idealStr;
};

const parseIdealRange = (idealStr: string, isPercentage: boolean = false, sex?: 'male' | 'female'): { min: number | null; max: number | null } | null => {
  if (!idealStr) return null;
  const targetStr = getGenderSpecificIdeal(idealStr, sex);
  let cleanStr = targetStr.toLowerCase();

  if (isPercentage) {
    const parenMatch = cleanStr.match(/\(([^)]*%\s*[^)]*)\)/);
    const pctTargetStr = (parenMatch && parenMatch[1]) ? parenMatch[1] : cleanStr;
    const pNumbers = pctTargetStr.match(/(\d+([.,]\d+)?)/g);
    if (pNumbers && pNumbers.length >= 2) {
      return { min: parseFloat(pNumbers[0].replace(',', '.')), max: parseFloat(pNumbers[1].replace(',', '.')) };
    } else if (pNumbers && pNumbers.length === 1) {
      return { min: parseFloat(pNumbers[0].replace(',', '.')), max: parseFloat(pNumbers[0].replace(',', '.')) };
    }
  } else {
    // Absolute mode: strip parenthetical commentary (e.g. "(Alerta > 3,0)" or "(40 a 60%)") so we parse primary absolute targets
    cleanStr = cleanStr.replace(/\([^)]*\)/g, '');
  }

  // If string contains '|', prioritize section with 'baixo risco', 'alvo ideal', 'otimizado' or take the first section
  let targetClause = cleanStr;
  if (cleanStr.includes('|')) {
    const parts = cleanStr.split('|');
    const idealPart = parts.find(p => p.includes('baixo risco') || p.includes('alvo ideal') || p.includes('otimizado') || p.includes('ideal'));
    targetClause = idealPart ? idealPart : parts[0];
  }

  // Remove thousand separator dots (e.g., "4.000" -> "4000", "150.000" -> "150000")
  targetClause = targetClause.replace(/\.(\d{3})(?!\d)/g, '$1');
  const str = targetClause.replace(/,/g, '.');

  // Check for explicit less than / superior / inferior BEFORE general range matching
  if (str.includes('<') || str.includes('inferior a') || str.includes('abaixo de') || str.includes('ate ') || str.includes('até ') || str.includes('menor que') || str.includes('menos de')) {
    const match = str.match(/(?:<|inferior a|abaixo de|ate|até|menor que|menos de)\s*(\d+(\.\d+)?)/);
    if (match) {
      return { min: null, max: parseFloat(match[1]) };
    }
  }

  if (str.includes('>') || str.includes('superior a') || str.includes('acima de') || str.includes('maior que') || str.includes('mais de')) {
    const match = str.match(/(?:>|superior a|acima de|maior que|mais de)\s*(\d+(\.\d+)?)/);
    if (match) {
      return { min: parseFloat(match[1]), max: null };
    }
  }

  // Check for explicit range (e.g. "1.0 - 2.0" or "10.00 a 16.00")
  const rangeMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:-|a|à)\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max };
    }
  }

  const numbers = str.match(/(\d+(\.\d+)?)/g);
  if (numbers && numbers.length >= 2) {
    const min = parseFloat(numbers[0]);
    const max = parseFloat(numbers[1]);
    return { min: isNaN(min) ? null : min, max: isNaN(max) ? null : max };
  } else if (numbers && numbers.length === 1) {
    const val = parseFloat(numbers[0]);
    return { min: isNaN(val) ? null : val, max: isNaN(val) ? null : val };
  }

  return null;
};

const calculateStatus = (valueNum: number, min: number | null, max: number | null): AnalysisStatus => {
  if (min !== null && max !== null) {
    if (valueNum >= min && valueNum <= max) {
      return AnalysisStatus.OPTIMIZED;
    }
    if (valueNum > max) {
      const dev = max > 0 ? (valueNum - max) / max : 1;
      if (dev > 0.5) return AnalysisStatus.CRITICAL_HIGH;
      if (dev > 0.3) return AnalysisStatus.CLINICAL_HIGH;
      return AnalysisStatus.FUNCTIONAL_HIGH;
    }
    if (valueNum < min) {
      const dev = min > 0 ? (min - valueNum) / min : 1;
      if (dev > 0.5) return AnalysisStatus.CRITICAL_LOW;
      if (dev > 0.3) return AnalysisStatus.CLINICAL_LOW;
      return AnalysisStatus.FUNCTIONAL_LOW;
    }
  } else if (max !== null) {
    if (valueNum <= max) {
      return AnalysisStatus.OPTIMIZED;
    }
    const dev = max > 0 ? (valueNum - max) / max : 1;
    if (dev > 0.5) return AnalysisStatus.CRITICAL_HIGH;
    if (dev > 0.3) return AnalysisStatus.CLINICAL_HIGH;
    return AnalysisStatus.FUNCTIONAL_HIGH;
  } else if (min !== null) {
    if (valueNum >= min) {
      return AnalysisStatus.OPTIMIZED;
    }
    const dev = min > 0 ? (min - valueNum) / min : 1;
    if (dev > 0.5) return AnalysisStatus.CRITICAL_LOW;
    if (dev > 0.3) return AnalysisStatus.CLINICAL_LOW;
    return AnalysisStatus.FUNCTIONAL_LOW;
  }

  return AnalysisStatus.OPTIMIZED;
};

const findKnowledgeBaseMatch = (testName: string) => {
  const name = testName.trim().toLowerCase();
  const nameLower = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Blindagem determinística para Vitamina D:
  // Toda menção genérica ("Vitamina D", "Vit D", "25-OH", "25(OH)D", "Vitamina D total")
  // DEVE mapear para "Vitamina D (semi ativa 25-OH)" (ng/mL).
  // Mapeia para "Vitamina D (ativa 1,25 OH)" (pg/mL) SOMENTE quando houver "1,25", "1.25", "calcitriol" ou "ativa" explícito (sem "semi ativa").
  const isVitaminDQuery =
    /\bvit(?:amina)?\s*\.?\s*d(?:2|3)?\b/.test(nameLower) ||
    /\b25[\s-]*(?:\(oh\)|oh)\s*d?\b/.test(nameLower) ||
    nameLower.includes("hidroxivitamina d") ||
    nameLower.includes("hidroxi-vitamina d") ||
    nameLower.includes("calcidiol") ||
    nameLower.includes("calcitriol") ||
    nameLower.includes("colecalciferol");

  if (isVitaminDQuery) {
    const isSemiActiveExplicit =
      /semi[\s-]*ativa/.test(nameLower) ||
      /\b25[\s-]*(?:\(oh\)|oh|hidroxi)/.test(nameLower) ||
      nameLower.includes("calcidiol");

    const isActive125Explicit =
      !isSemiActiveExplicit &&
      (/\b1[.,\s]*25\b/.test(nameLower) ||
        nameLower.includes("calcitriol") ||
        /\bativa\b/.test(nameLower));

    if (isActive125Explicit && CLINICAL_KNOWLEDGE_BASE["Vitamina D (ativa 1,25 OH)"]) {
      return {
        key: "Vitamina D (ativa 1,25 OH)",
        data: CLINICAL_KNOWLEDGE_BASE["Vitamina D (ativa 1,25 OH)"],
      };
    }

    if (CLINICAL_KNOWLEDGE_BASE["Vitamina D (semi ativa 25-OH)"]) {
      return {
        key: "Vitamina D (semi ativa 25-OH)",
        data: CLINICAL_KNOWLEDGE_BASE["Vitamina D (semi ativa 25-OH)"],
      };
    }
  }

  // Proteção para Urina / EAS para evitar colisão com marcadores séricos (ex: Glicose de Urina -> Glicose na Urina)
  if (
    nameLower.includes("urina") || 
    nameLower.includes("urinaria") || 
    nameLower.includes("eas") || 
    nameLower.includes("urina tipo 1") ||
    nameLower.includes("glicosuria")
  ) {
    if (nameLower.includes("glicose") || nameLower.includes("glicosuria")) {
      return { key: "Glicose na Urina", data: CLINICAL_KNOWLEDGE_BASE["Glicose na Urina"] };
    }
    if (nameLower.includes("proteinuria") || nameLower.includes("proteina")) {
      return { key: "Proteinúria", data: CLINICAL_KNOWLEDGE_BASE["Proteinúria"] };
    }
    if (nameLower.includes("creatinina")) {
      return { key: "Creatinina Urinária", data: CLINICAL_KNOWLEDGE_BASE["Creatinina Urinária"] };
    }
    if (nameLower.includes("potassio")) {
      return { key: "Potássio urinário", data: CLINICAL_KNOWLEDGE_BASE["Potássio urinário"] };
    }
  }

  const keys = Object.keys(CLINICAL_KNOWLEDGE_BASE);

  // 1. Direct lowercase match on official keys
  for (const key of keys) {
    if (key.toLowerCase() === name) {
      return { key, data: CLINICAL_KNOWLEDGE_BASE[key] };
    }
  }

  // 2. Direct match on parenthetical base names (e.g., "Hemoglobina" matching "Hemoglobina (Hb)")
  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const key of keys) {
    const keyLower = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanKeyBase = keyLower.split(' (')[0]
      .replace(/[^a-z0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanName === cleanKeyBase) {
      return { key, data: CLINICAL_KNOWLEDGE_BASE[key] };
    }
  }

  // 3. Specific synonym/alias mapping
  const synonyms: Record<string, string> = {
    "tgp": "ALT (TGP)",
    "tgo": "AST (TGO)",
    "alt": "ALT (TGP)",
    "ast": "AST (TGO)",
    "sodio": "Sódio",
    "potassio": "Potássio",
    "acido urico": "Ácido Úrico",
    "ureia": "Ureia",
    "creatinina": "Creatinina",
    "glicose": "Glicose em jejum",
    "insulina": "Insulina em jejum",
    "indice de triglicerideos glicose tyg": "Índice de Triglicerídeos-Glicose (TyG)",
    "indice triglicerides glicose tyg": "Índice de Triglicerídeos-Glicose (TyG)",
    "tyg": "Índice de Triglicerídeos-Glicose (TyG)",
    "indice de triglicerideos glicose": "Índice de Triglicerídeos-Glicose (TyG)",
    "indice triglicerides glicose": "Índice de Triglicerídeos-Glicose (TyG)",
    "tg:glicose": "Índice de Triglicerídeos-Glicose (TyG)",
    "tg/glicose": "Índice de Triglicerídeos-Glicose (TyG)",
    "triglicerideos:glicose": "Índice de Triglicerídeos-Glicose (TyG)",
    "triglicerideos/glicose": "Índice de Triglicerídeos-Glicose (TyG)",
    "hba1c": "Hemoglobina Glicada (HbA1c)",
    "hemoglobina glicada": "Hemoglobina Glicada (HbA1c)",
    "tsh": "TSH",
    "t4 livre": "T4 Livre",
    "t3 livre": "T3 Livre",
    "colesterol total": "Colesterol Total (CT)",
    "hdl": "HDL Colesterol",
    "hdl colesterol": "HDL Colesterol",
    "hdl (colesterol de alta densidade)": "HDL Colesterol",
    "ldl": "LDL Colesterol",
    "ldl colesterol": "LDL Colesterol",
    "ldl (colesterol de baixa densidade)": "LDL Colesterol",
    "triglicerides": "Triglicerídeos (TG)",
    "triglicerideos": "Triglicerídeos (TG)",
    "vldl": "Colesterol VLDL",
    "ferritina": "Ferritina",
    "ferro": "Ferro",
    "vitamina d": "Vitamina D (semi ativa 25-OH)",
    "vitamina d3": "Vitamina D (semi ativa 25-OH)",
    "vitamina d3 ativa": "Vitamina D (ativa 1,25 OH)",
    "vitamina d ativa 1 25": "Vitamina D (ativa 1,25 OH)",
    "vitamina d3 ativa 1 25": "Vitamina D (ativa 1,25 OH)",
    "1 25 di hidroxivitamina d": "Vitamina D (ativa 1,25 OH)",
    "1 25 di hidroxivitamina d3": "Vitamina D (ativa 1,25 OH)",
    "1 25 hidroxivitamina d": "Vitamina D (ativa 1,25 OH)",
    "1 25 dihidroxivitamina d": "Vitamina D (ativa 1,25 OH)",
    "1 25 dihidroxivitamina d3": "Vitamina D (ativa 1,25 OH)",
    "vitamina d 1 25 oh": "Vitamina D (ativa 1,25 OH)",
    "vitamina d3 1 25 oh": "Vitamina D (ativa 1,25 OH)",
    "amilase": "Amilase",
    "lipase": "Lipase pancreática",
    "lipase pancreatica": "Lipase pancreática",
    "creatina quinase": "Creatina Quinase",
    "ck": "Creatina Quinase",
    "ckmb": "CK-MB",
    "ck mb": "CK-MB",
    "vitamina a": "Vitamina A",
    "vitamina c": "Vitamina C",
    "relacao calcio fosforo": "Razão Cálcio:Fósforo",
    "calcio fosforo": "Razão Cálcio:Fósforo",
    "calcio/fosforo": "Razão Cálcio:Fósforo",
    "calcio:fosforo": "Razão Cálcio:Fósforo",
    "relacao calcio albumina": "Cálcio Corrigido pela Albumina",
    "calcio albumina": "Cálcio Corrigido pela Albumina",
    "calcio corrigido": "Cálcio Corrigido pela Albumina",
    "calcio corrigido pela albumina": "Cálcio Corrigido pela Albumina",
    "razao calcio albumina": "Cálcio Corrigido pela Albumina",
    "relacao albumina globulina": "Relação Albumina:Globulina",
    "albumina globulina": "Relação Albumina:Globulina",
    "relacao pcr-us:albumina": "Relação PCR-us:Albumina",
    "relacao pcr us albumina": "Relação PCR-us:Albumina",
    "pcr-us/albumina": "Relação PCR-us:Albumina",
    "pcr us/albumina": "Relação PCR-us:Albumina",
    "pcr:albumina": "Relação PCR-us:Albumina",
    "pcr-us:albumina": "Relação PCR-us:Albumina",
    "vitamina b1": "Vitamina B1 (Tiamina)",
    "vitamina b1 (tiamina)": "Vitamina B1 (Tiamina)",
    "tiamina": "Vitamina B1 (Tiamina)",
    "vitamina b12": "Vitamina B12",
    "acido folico": "Ácido Fólico",
    "zinco": "Zinco",
    "cobre": "Cobre",
    "selênio": "Selênio",
    "selenio": "Selênio",
    "magnésio": "Magnésio",
    "magnesio": "Magnésio",
    "cálcio": "Cálcio Total",
    "calcio": "Cálcio Total",
    "homocisteina": "Homocisteína",
    "pcr": "Proteína C Reativa (PCR-us)",
    "pcr-us": "Proteína C Reativa (PCR-us)",
    "ggt": "GGT",
    "gama glutamil transferase": "GGT",
    "gama-glutamil transferase": "GGT",
    "gama-glutamiltransferase": "GGT",
    "gama gt": "GGT",
    "gama-gt": "GGT",
    "apolipoproteina a": "Apo-A1",
    "apolipoproteina a1": "Apo-A1",
    "apolipoproteina 'a'": "Apo-A1",
    "apolipoproteina \"a\"": "Apo-A1",
    "apo-a1": "Apo-A1",
    "apo a1": "Apo-A1",
    "apo a": "Apo-A1",
    "apolipoproteina b": "Apo-B",
    "apolipoproteina 'b'": "Apo-B",
    "apolipoproteina \"b\"": "Apo-B",
    "apo-b": "Apo-B",
    "apo b": "Apo-B",
    "lipoproteina a": "Lipoproteína (a) [Lp(a)]",
    "lipoproteina (a)": "Lipoproteína (a) [Lp(a)]",
    "lipo (a)": "Lipoproteína (a) [Lp(a)]",
    "lp(a)": "Lipoproteína (a) [Lp(a)]",
    "eosinofilos": "Eosinófilos",
    "eosinofilo": "Eosinófilos",
    "amônia": "Amônia",
    "amonia": "Amônia",
    "albumina": "Albumina Total e Frações",
    "albumina total": "Albumina Total e Frações",
    "albumina total e fracoes": "Albumina Total e Frações",
    "fosfatase alcalina": "Fosfatase Alcalina (FA)",
    "osmolaridade": "Osmolaridade Sérica",
    "ureia / creatinina": "Relação Ureia:Creatinina (Sérica)",
    "ureia/creatinina": "Relação Ureia:Creatinina (Sérica)",
    "ureia:creatinina": "Relação Ureia:Creatinina (Sérica)",
    "razao ureia/creatinina": "Relação Ureia:Creatinina (Sérica)",
    "razao ureia / creatinina": "Relação Ureia:Creatinina (Sérica)",
    "relacao ureia:creatinina": "Relação Ureia:Creatinina (Sérica)",
    "relacao ureia / creatinina": "Relação Ureia:Creatinina (Sérica)",
    "relacao ast:alt": "Relação AST:ALT",
    "relacao ast/alt": "Relação AST:ALT",
    "ast:alt": "Relação AST:ALT",
    "ast/alt": "Relação AST:ALT",
    "indice de de ritis": "Relação AST:ALT",
    "de ritis": "Relação AST:ALT",
    "neutrofilos": "Neutrófilos",
    "monocitos": "Monócitos",
    "linfocitos": "Linfócitos",
    "etfg": "Ritmo de Filtração Glomerular (eTFG)",
    "ritmo de filtracao glomerular": "Ritmo de Filtração Glomerular (eTFG)",
    "taxa de filtracao glomerular": "Ritmo de Filtração Glomerular (eTFG)",
    "tfg": "Ritmo de Filtração Glomerular (eTFG)",
    "ritmo de filtracao glomerular etfg": "Ritmo de Filtração Glomerular (eTFG)",
    "razao neutrofilos linfocitos": "Razão Neutrófilos:Linfócitos (RNL)",
    "rnl": "Razão Neutrófilos:Linfócitos (RNL)",
    "relacao neutrofilo linfocito": "Razão Neutrófilos:Linfócitos (RNL)",
    "neutrofilos linfocitos": "Razão Neutrófilos:Linfócitos (RNL)",
    "razao neutrofilos linfocitos rnl": "Razão Neutrófilos:Linfócitos (RNL)",
    "siri": "Índice de Resposta Inflamatória Sistêmica (SIRI)",
    "indice siri": "Índice de Resposta Inflamatória Sistêmica (SIRI)",
    "indice de resposta inflamatoria sistemica": "Índice de Resposta Inflamatória Sistêmica (SIRI)",
    "neutrofilos absolutos x monocitos absolutos / linfocitos absolutos": "Índice de Resposta Inflamatória Sistêmica (SIRI)",
    "hb": "Hemoglobina (Hb)",
    "hemoglobina": "Hemoglobina (Hb)",
    "hematocrito": "Hematócrito (Ht)",
    "ht": "Hematócrito (Ht)",
    "hemacias": "Eritrócitos (Glóbulos Vermelhos – RBC)",
    "rbc": "Eritrócitos (Glóbulos Vermelhos – RBC)",
    "globulos vermelhos": "Eritrócitos (Glóbulos Vermelhos – RBC)",
    "wbc": "Leucócitos Totais (WBC)",
    "leucocitos": "Leucócitos Totais (WBC)",
    "plaquetas": "Plaquetas"
  };

  // 3a. Match on exact synonym
  for (const synKey in synonyms) {
    if (cleanName === synKey) {
      const officialKey = synonyms[synKey];
      if (CLINICAL_KNOWLEDGE_BASE[officialKey]) {
        return { key: officialKey, data: CLINICAL_KNOWLEDGE_BASE[officialKey] };
      }
    }
  }

  // 3b. Match if cleanName contains the synonym (e.g. "glicose de jejum" contains synonym "glicose")
  for (const synKey in synonyms) {
    if (cleanName.includes(synKey)) {
      const officialKey = synonyms[synKey];
      if (CLINICAL_KNOWLEDGE_BASE[officialKey]) {
        return { key: officialKey, data: CLINICAL_KNOWLEDGE_BASE[officialKey] };
      }
    }
  }

  // 4. Substring match as fallback (only if cleanName matches a key, and we protect against too short strings)
  if (cleanName.length > 2) {
    for (const key of keys) {
      const keyLower = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cleanKeyBase = keyLower.split(' (')[0].trim();
      
      // PROTEÇÃO CRÍTICA: Não permite que termos simples (sem palavras de razão/relação)
      // casem com chaves compostas de razões/relações (que contêm "razão", "relação", "ratio", "indice", ":", "/")
      const isOfficialKeyRatio = keyLower.includes("razao") || keyLower.includes("relacao") || keyLower.includes("ratio") || keyLower.includes("indice") || keyLower.includes(":") || keyLower.includes("/");
      const isSearchTermRatio = cleanName.includes("razao") || cleanName.includes("relacao") || cleanName.includes("ratio") || cleanName.includes("indice") || cleanName.includes(":") || cleanName.includes("/");
      
      // PROTEÇÃO CRÍTICA: Termos de apolipoproteína não podem casar com lipoproteína (a)
      const isApoSearch = cleanName.includes("apoli") || cleanName.includes("apo-") || cleanName.includes("apo ");
      const isLpKey = keyLower.includes("lipoproteina (a)") || keyLower.includes("lipo (a)") || keyLower.includes("lp(a)");
      if (isApoSearch && isLpKey) {
        continue;
      }

      if (isOfficialKeyRatio && !isSearchTermRatio) {
        continue;
      }

      const containsAsWord = (haystack: string, needle: string) => {
        if (!needle || needle.length < 2) return false;
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|\\b)${escaped}(?:$|\\b)`, 'i');
        return regex.test(haystack);
      };

      if (containsAsWord(keyLower, cleanName) || containsAsWord(cleanName, cleanKeyBase)) {
        return { key, data: CLINICAL_KNOWLEDGE_BASE[key] };
      }
    }
  }

  return null;
};

const enrichRatios = (results: ExamResult[], sex?: 'male' | 'female'): ExamResult[] => {
  const valuesMap: Record<string, number> = {};
  results.forEach(res => {
    const num = parseNumericValue(res.value);
    if (num !== null) {
      valuesMap[res.testName] = num;
    }
  });

  const keysValues = Object.keys(valuesMap);
  const findVal = (terms: string[]): number | undefined => {
    const foundKey = keysValues.find(k => {
      const kNorm = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      return terms.some(t => {
        const tNorm = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
        return kNorm === tNorm || kNorm.includes(tNorm) || tNorm.includes(kNorm);
      });
    });
    return foundKey ? valuesMap[foundKey] : undefined;
  };

  const normalizeNorm = (text: string) =>
    (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const EXCLUDED_WBC_SUBTYPES = [
    "bastonete",
    "metamielocito",
    "mielocito",
    "blasto",
    "promielocito",
    "jovem",
    "razao",
    "relacao",
    "rnl",
    "nlr",
    "mlr",
    "plr",
    "siri",
    "indice",
  ];

  const inspectWbcResult = (res: ExamResult) => {
    const nameNorm = normalizeNorm(res.testName);
    const unitNorm = normalizeNorm(res.unit || "").replace(/\s+/g, "");
    const valNorm = normalizeNorm(String(res.value || ""));

    const hasPct =
      nameNorm.includes("%") ||
      nameNorm.includes("percentual") ||
      nameNorm.includes("porcentagem") ||
      nameNorm.includes("relativ") ||
      unitNorm.includes("%") ||
      unitNorm.includes("percent") ||
      valNorm.includes("%");

    const hasGigaScale =
      unitNorm.includes("giga") ||
      unitNorm.includes("10^") ||
      unitNorm.includes("10³") ||
      unitNorm.includes("10e") ||
      unitNorm.includes("x10") ||
      unitNorm.includes("10*") ||
      unitNorm.includes("mil/") ||
      unitNorm.includes("k/ul") ||
      unitNorm.includes("k/mm") ||
      nameNorm.includes("giga") ||
      nameNorm.includes("10^");

    const hasRawCellUnit =
      unitNorm.includes("/mm") ||
      unitNorm.includes("/ul") ||
      unitNorm.includes("cel/") ||
      nameNorm.includes("/mm") ||
      nameNorm.includes("/ul");

    const hasAbs =
      hasGigaScale ||
      hasRawCellUnit ||
      nameNorm.includes("absoluto") ||
      nameNorm.includes("abs");

    return { nameNorm, unitNorm, hasPct, hasGigaScale, hasRawCellUnit, hasAbs };
  };

  const getWbcTotaisGiga = (): number | undefined => {
    const wbcRes = results.find(res => {
      const { nameNorm, hasPct } = inspectWbcResult(res);
      if (hasPct) return false;
      return (
        nameNorm.includes("leucocitos totais") ||
        nameNorm.includes("globulos brancos") ||
        nameNorm === "leucocitos" ||
        nameNorm.includes("wbc")
      );
    });
    if (!wbcRes) return undefined;
    const num = parseNumericValue(wbcRes.value);
    if (num === null || num <= 0) return undefined;
    const { hasGigaScale, hasRawCellUnit } = inspectWbcResult(wbcRes);
    if (hasGigaScale && num <= 100) return num;
    if (hasRawCellUnit || num > 50) return num / 1000;
    return num;
  };

  const findMatchingWbcEntries = (priorityTermGroups: string[][]): ExamResult[] => {
    const matched: ExamResult[] = [];
    for (const group of priorityTermGroups) {
      const groupHits = results.filter(res => {
        if (matched.includes(res)) return false;
        const nameNorm = normalizeNorm(res.testName);
        if (EXCLUDED_WBC_SUBTYPES.some(ex => nameNorm.includes(ex))) return false;
        return group.some(t => nameNorm.includes(normalizeNorm(t)));
      });
      matched.push(...groupHits);
    }
    return matched;
  };

  const findLeucocitoAbsoluto = (priorityTermGroups: string[][]): number | undefined => {
    const candidates = findMatchingWbcEntries(priorityTermGroups);

    // 1. Prioriza valor absoluto explícito (checando testName E unit)
    for (const res of candidates) {
      const { unitNorm, hasPct, hasGigaScale, hasRawCellUnit, hasAbs } = inspectWbcResult(res);
      if (hasPct) continue;

      const num = parseNumericValue(res.value);
      if (num === null || num <= 0) continue;

      if (hasAbs || (unitNorm === "" && num > 100)) {
        if (hasGigaScale && num <= 100) return num;
        if (hasRawCellUnit || num > 50) return num / 1000;
        return num;
      }
    }

    // 2. Fallback: se houver percentual válido e Leucócitos Totais em unidade absoluta compatível
    const leucGiga = getWbcTotaisGiga();
    if (leucGiga !== undefined && leucGiga > 0) {
      for (const res of candidates) {
        const { unitNorm, hasPct, hasAbs } = inspectWbcResult(res);
        const pctVal = parseNumericValue(res.value);
        if (pctVal === null || pctVal <= 0 || pctVal > 100) continue;
        if (hasPct || (!hasAbs && unitNorm === "" && pctVal <= 100)) {
          return (pctVal / 100) * leucGiga;
        }
      }
    }

    return undefined;
  };

  const findLeucocitoPercentual = (priorityTermGroups: string[][]): number | undefined => {
    const candidates = findMatchingWbcEntries(priorityTermGroups);
    for (const res of candidates) {
      const { unitNorm, hasPct, hasAbs } = inspectWbcResult(res);
      const num = parseNumericValue(res.value);
      if (num === null || num <= 0 || num > 100) continue;
      if (hasPct || (!hasAbs && unitNorm === "")) {
        return num;
      }
    }
    return undefined;
  };

  const newRatios: ExamResult[] = [];

  const addCalculatedRatio = (officialName: string, value: number, unit: string = "", notes: string = "") => {
    if (!Number.isFinite(value)) return;
    const knowledge = CLINICAL_KNOWLEDGE_BASE[officialName];
    if (!knowledge) return;

    const valStr = value.toFixed(2);
    const parsedRange = parseIdealRange(knowledge.ideal, false, sex);
    const status = parsedRange 
      ? calculateStatus(value, parsedRange.min, parsedRange.max)
      : AnalysisStatus.OPTIMIZED;
    const genderRef = getGenderSpecificIdeal(knowledge.ideal, sex);

    const existingIdx = results.findIndex(r => r.testName === officialName);
    if (existingIdx !== -1) {
      results[existingIdx] = {
        ...results[existingIdx],
        value: valStr,
        unit: unit || results[existingIdx].unit,
        referenceRange: genderRef || knowledge.ideal,
        status: status,
        notes: notes || undefined
      };
    } else {
      newRatios.push({
        id: `calc-${officialName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        testName: officialName,
        value: valStr,
        unit: unit,
        referenceRange: genderRef || knowledge.ideal,
        status: status,
        category: "Cálculos",
        notes: notes || undefined
      });
    }
  };

  const tg = valuesMap["Triglicerídeos (TG)"] ?? valuesMap["Triglicerídeos"];
  const hdl = valuesMap["HDL Colesterol"] ?? valuesMap["HDL (Colesterol de Alta Densidade)"] ?? valuesMap["HDL"];
  if (tg !== undefined && hdl !== undefined && hdl > 0) {
    addCalculatedRatio("Razão Triglicerídeos:HDL (TG:HDL)", tg / hdl);
  }

  const ct = valuesMap["Colesterol Total (CT)"] ?? valuesMap["Colesterol Total"];
  if (ct !== undefined && hdl !== undefined && hdl > 0) {
    addCalculatedRatio("Razão Colesterol Total:HDL (CT:HDL)", ct / hdl);
  }

  const ldl = valuesMap["LDL Colesterol"] ?? valuesMap["LDL (Colesterol de Baixa Densidade)"] ?? valuesMap["LDL"];
  if (ldl !== undefined && hdl !== undefined && hdl > 0) {
    addCalculatedRatio("Razão LDL:HDL", ldl / hdl);
  }

  if (tg !== undefined && hdl !== undefined && hdl > 0) {
    addCalculatedRatio("Índice de Aterogenicidade de Plasma (AIP)", Math.log10((tg / hdl) * 0.4366));
  }

  // Auto-calcular Índice Triglicérides-Glicose (TyG)
  const glicose = valuesMap["Glicose em jejum"] !== undefined ? valuesMap["Glicose em jejum"] : (valuesMap["Glicose Jejum"] !== undefined ? valuesMap["Glicose Jejum"] : valuesMap["Glicose"]);
  const tgVal = valuesMap["Triglicerídeos (TG)"] !== undefined ? valuesMap["Triglicerídeos (TG)"] : valuesMap["Triglicerídeos"];

  if (tgVal !== undefined && glicose !== undefined && tgVal > 0 && glicose > 0) {
    addCalculatedRatio("Índice de Triglicerídeos-Glicose (TyG)", Math.log((tgVal * glicose) / 2));
  }

  const au = valuesMap["Ácido Úrico"];
  if (au !== undefined && hdl !== undefined && hdl > 0) {
    addCalculatedRatio("Razão Ácido Úrico:HDL", (au / hdl) * 100);
  }

  const zinco = valuesMap["Zinco"];
  const cobre = valuesMap["Cobre"];
  if (zinco !== undefined && cobre !== undefined && cobre > 0) {
    addCalculatedRatio("Razão Zinco:Cobre", zinco / cobre);
  }

  const apoBVal = findVal(["Apo-B", "Apolipoproteína B", "Apolipoproteina B", "Apo B"]);
  const apoA1Val = findVal(["Apo-A1", "Apolipoproteína A1", "Apolipoproteina A1", "Apo A1", "Apo-A"]);
  if (apoBVal !== undefined && apoA1Val !== undefined && apoA1Val > 0) {
    addCalculatedRatio("Razão Apolipoproteína B:Apolipoproteína A1 (Apo-B:Apo-A1)", apoBVal / apoA1Val, "razão");
  }

  const t3LivreVal = findVal(["T3 Livre", "T3L"]);
  const t3ReversoVal = findVal(["T3 Reverso", "rT3", "T3R"]);
  if (t3LivreVal !== undefined && t3ReversoVal !== undefined && t3ReversoVal > 0) {
    addCalculatedRatio("Razão T3 Livre : T3 Reverso (fT3 : rT3)", t3LivreVal / t3ReversoVal, "razão");
  }

  const ast = valuesMap["AST (TGO)"];
  const alt = valuesMap["ALT (TGP)"];
  if (ast !== undefined && alt !== undefined && alt > 0) {
    addCalculatedRatio("Relação AST:ALT", ast / alt);
  }

  const neutrofilosPriority = [
    ["neutrofilos totais", "neutrofilos absolutos"],
    ["neutrofilos segmentados", "segmentados"],
    ["neutrofilos"]
  ];
  const monocitosPriority = [["monocitos"]];
  const linfocitosPriority = [["linfocitos"]];

  const neutrofilosAbs = findLeucocitoAbsoluto(neutrofilosPriority);
  const monocitosAbs = findLeucocitoAbsoluto(monocitosPriority);
  const linfocitosAbs = findLeucocitoAbsoluto(linfocitosPriority);

  const neutrofilosPct = neutrofilosAbs === undefined ? findLeucocitoPercentual(neutrofilosPriority) : undefined;
  const monocitosPct = monocitosAbs === undefined ? findLeucocitoPercentual(monocitosPriority) : undefined;
  const linfocitosPct = linfocitosAbs === undefined ? findLeucocitoPercentual(linfocitosPriority) : undefined;

  if (
    neutrofilosAbs !== undefined &&
    monocitosAbs !== undefined &&
    linfocitosAbs !== undefined &&
    neutrofilosAbs > 0 &&
    monocitosAbs > 0 &&
    linfocitosAbs > 0
  ) {
    // SIRI = (Neutrófilos Absolutos × Monócitos Absolutos) ÷ Linfócitos Absolutos em Giga/L
    addCalculatedRatio("Índice de Resposta Inflamatória Sistêmica (SIRI)", (neutrofilosAbs * monocitosAbs) / linfocitosAbs, "giga/L");
  }

  // RNL (Neutrófilos / Linfócitos) em unidades compatíveis (ambos absolutos ou ambos percentuais válidos)
  if (neutrofilosAbs !== undefined && linfocitosAbs !== undefined && neutrofilosAbs > 0 && linfocitosAbs > 0) {
    addCalculatedRatio("Razão Neutrófilos:Linfócitos (RNL)", neutrofilosAbs / linfocitosAbs, "razão");
  } else if (neutrofilosPct !== undefined && linfocitosPct !== undefined && neutrofilosPct > 0 && linfocitosPct > 0) {
    addCalculatedRatio("Razão Neutrófilos:Linfócitos (RNL)", neutrofilosPct / linfocitosPct, "razão");
  }

  // MLR (Monócitos / Linfócitos) em unidades compatíveis (ambos absolutos ou ambos percentuais válidos)
  if (monocitosAbs !== undefined && linfocitosAbs !== undefined && monocitosAbs > 0 && linfocitosAbs > 0) {
    addCalculatedRatio("Relação Monócito:Linfócito (MLR)", monocitosAbs / linfocitosAbs, "razão");
  } else if (monocitosPct !== undefined && linfocitosPct !== undefined && monocitosPct > 0 && linfocitosPct > 0) {
    addCalculatedRatio("Relação Monócito:Linfócito (MLR)", monocitosPct / linfocitosPct, "razão");
  }

  // PLR (Plaquetas / Linfócitos) — requer ambos em contagem absoluta (Giga/L) e divisor > 0
  const plaquetasRes = results.find(res => {
    const { nameNorm, hasPct } = inspectWbcResult(res);
    if (hasPct || EXCLUDED_WBC_SUBTYPES.some(ex => nameNorm.includes(ex))) return false;
    return nameNorm.includes("plaqueta") || nameNorm.includes("trombocito");
  });
  const plaquetasVal = plaquetasRes ? parseNumericValue(plaquetasRes.value) : null;
  if (plaquetasRes && plaquetasVal !== null && plaquetasVal > 0 && linfocitosAbs !== undefined && linfocitosAbs > 0) {
    const { hasRawCellUnit } = inspectWbcResult(plaquetasRes);
    const plaquetasGiga = (hasRawCellUnit || plaquetasVal > 1000) ? plaquetasVal / 1000 : plaquetasVal;
    if (plaquetasGiga > 0) {
      addCalculatedRatio("Relação Plaqueta:Linfócito (PLR)", plaquetasGiga / linfocitosAbs, "razão");
    }
  }

  // Auto-calcular Relação Ureia:Creatinina (Sérica)
  const ureiaVal = findVal(["Ureia Sérica", "Ureia"]);
  const creatininaVal = findVal(["Creatinina Sérica", "Creatinina"]);
  if (ureiaVal !== undefined && creatininaVal !== undefined && creatininaVal > 0) {
    addCalculatedRatio("Relação Ureia:Creatinina (Sérica)", ureiaVal / creatininaVal, "razão");
  }

  // Auto-calcular Testosterona Livre e Biodisponível (Vermeulen)

  // Cálcio, Albumina, Globulina, Fósforo auto-calculations
  const calcioCalc = findVal(["Cálcio Total", "Cálcio sérico", "Cálcio"]);
  const albuminaCalc = findVal(["Albumina Total e Frações", "Albumina"]);
  const globulinaCalc = findVal(["Globulina", "Globulinas"]);
  const fosforoCalc = findVal(["Fósforo", "Fosforo"]);

  if (calcioCalc !== undefined && albuminaCalc !== undefined && albuminaCalc > 0) {
    addCalculatedRatio("Cálcio Corrigido pela Albumina", calcioCalc + 0.8 * (4.0 - albuminaCalc), "mg/dL");
  }

  if (albuminaCalc !== undefined && globulinaCalc !== undefined && globulinaCalc > 0) {
    addCalculatedRatio("Relação Albumina:Globulina", albuminaCalc / globulinaCalc);
  }

  if (calcioCalc !== undefined && fosforoCalc !== undefined && fosforoCalc > 0) {
    addCalculatedRatio("Razão Cálcio:Fósforo", calcioCalc / fosforoCalc);
  }

  // Auto-calcular Relação PCR-us:Albumina
  const pcrVal = findVal(["Proteína C Reativa ultrassensível (PCR-us)", "PCR-us", "PCR ultrassensível", "PCR"]);
  if (pcrVal !== undefined && albuminaCalc !== undefined && albuminaCalc > 0) {
    const albGperL = albuminaCalc < 15 ? albuminaCalc * 10 : albuminaCalc;
    addCalculatedRatio("Relação PCR-us:Albumina", pcrVal / albGperL);
  }

  const totalT = findVal(["Testosterona Total", "Testosterona Sérica"]);
  const shbgVal = findVal(["SHBG", "Globulina Ligadora"]);
  const albVal = findVal(["Albumina"]);

  if (totalT !== undefined && shbgVal !== undefined) {
    const totalT_nmol = (totalT > 100) ? (totalT * 0.03467) : totalT;
    const shbg_nmol = shbgVal;
    const albumin_gL = (albVal !== undefined) ? (albVal < 10 ? albVal * 10 : albVal) : 43; // Default 4.3 g/dL = 43 g/L

    const totalT_mol = totalT_nmol * 1e-9;
    const shbg_mol = shbg_nmol * 1e-9;
    const albumin_mol = albumin_gL / 69000;

    const K_alb = 3.6e4;
    const K_shbg = 1.0e9;

    const N = 1 + K_alb * albumin_mol;
    const a = K_shbg * N;
    const b = N + K_shbg * (shbg_mol - totalT_mol);
    const c = -totalT_mol;

    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      const fT_mol = (-b + Math.sqrt(discriminant)) / (2 * a);
      const freeT_pgml = fT_mol * 288.42 * 1e9;
      const freeT_pct = (fT_mol / totalT_mol) * 100;
      
      const bioT_nmol = fT_mol * N * 1e9;
      const bioT_pct = ((fT_mol * N) / totalT_mol) * 100;

      const detailsText = `Testosterona Livre: ${freeT_pgml.toFixed(2)} pg/mL (${freeT_pct.toFixed(2)}%). Testosterona Biodisponível: ${bioT_nmol.toFixed(2)} nmol/L (${bioT_pct.toFixed(2)}%).`;
      addCalculatedRatio(
        "Testosterona Livre e Biodisponível (Cálculo)",
        freeT_pgml,
        "pg/mL",
        detailsText
      );
    }
  }

  return [...results, ...newRatios];
};

const convertValueAndUnit = (testName: string, valNum: number, unitStr: string): { valNum: number; unitStr: string } => {
  const normName = testName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normUnit = unitStr.toLowerCase().trim().replace(/\s/g, "");

  // Vitamina B12
  if (normName.includes("b12") || normName.includes("cobalamina")) {
    if (normUnit.includes("pmol")) {
      return { valNum: valNum * 1.355, unitStr: "pg/mL" };
    }
    if (normUnit === "ng/l") {
      return { valNum: valNum, unitStr: "pg/mL" };
    }
    if (normUnit === "ng/ml" || normUnit.includes("ng/ml")) {
      return { valNum: valNum * 1000, unitStr: "pg/mL" };
    }
    return { valNum, unitStr: "pg/mL" };
  }

  // Cálcio (Total ou Sérico) - exclui cálcio iônico que usa mmol/L
  if ((normName.includes("calcio") && (normName.includes("serico") || normName.includes("total"))) || normName === "calcio") {
    if (normUnit.includes("mmol")) {
      return { valNum: valNum * 4.01, unitStr: "mg/dL" };
    }
    if (normUnit.includes("meq")) {
      return { valNum: valNum * 2.005, unitStr: "mg/dL" };
    }
    if (normUnit === "mg/l" || normUnit === "mgl") {
      return { valNum: valNum * 0.1, unitStr: "mg/dL" };
    }
    if (normUnit === "g/l" || normUnit === "gl") {
      return { valNum: valNum * 100, unitStr: "mg/dL" };
    }
    return { valNum, unitStr: "mg/dL" };
  }

  // Vitamina D (25-OH padrão ng/mL; ativa 1,25-OH padrão pg/mL)
  if (normName.includes("vitamina d") && normName.includes("25") && !normName.includes("1,25") && !normName.includes("1.25")) {
    if (normUnit.includes("nmol")) {
      return { valNum: valNum / 2.5, unitStr: "ng/mL" };
    }
    if (normUnit === "ug/l" || normUnit === "µg/l") {
      return { valNum: valNum, unitStr: "ng/mL" };
    }
    return { valNum, unitStr: "ng/mL" };
  }
  if (normName.includes("vitamina d") && (normName.includes("1,25") || normName.includes("1.25") || normName.includes("ativa"))) {
    if (normUnit.includes("pmol")) {
      return { valNum: valNum / 2.4, unitStr: "pg/mL" };
    }
    return { valNum, unitStr: unitStr || "pg/mL" };
  }

  // Zinco
  if (normName.includes("zinco")) {
    if (normUnit.includes("umol") || normUnit.includes("µmol")) {
      return { valNum: valNum * 6.54, unitStr: "µg/dL" };
    }
    if (normUnit === "ug/l" || normUnit === "µg/l") {
      return { valNum: valNum * 0.1, unitStr: "µg/dL" };
    }
    return { valNum, unitStr: "µg/dL" };
  }

  // Cobre
  if (normName.includes("cobre")) {
    if (normUnit.includes("umol") || normUnit.includes("µmol")) {
      return { valNum: valNum * 6.35, unitStr: "µg/dL" };
    }
    if (normUnit === "ug/l" || normUnit === "µg/l") {
      return { valNum: valNum * 0.1, unitStr: "µg/dL" };
    }
    return { valNum, unitStr: "µg/dL" };
  }

  // Magnésio
  if (normName.includes("magnesio")) {
    if (normUnit.includes("meq")) {
      return { valNum: valNum * 1.22, unitStr: "mg/dL" };
    }
    if (normUnit.includes("mmol")) {
      return { valNum: valNum * 2.43, unitStr: "mg/dL" };
    }
    return { valNum, unitStr: "mg/dL" };
  }

  return { valNum, unitStr };
};

export const crossValidateResults = (results: ExamResult[], synthesis: string, sex?: 'male' | 'female'): ExamResult[] => {
  // 1. Primeiro recupera valores vazios ou zero usando a síntese
  const validated = results.map(res => {
    const valStr = String(res.value || "").trim();
    if (valStr === "0" || valStr === "" || valStr === "null") {
      const escapedName = res.testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`${escapedName}[^0-9]*?(\\d+[.,]?\\d*)`, 'i');
      const match = synthesis.match(regex);
      if (match && match[1]) {
        return { ...res, value: match[1].replace(',', '.') };
      }
    }
    return res;
  });

  // 2. Normaliza nomes, preenche referências e calcula status de forma matemática e exata
  const normalized = validated.map(res => {
    const match = findKnowledgeBaseMatch(res.testName);
    if (match) {
      let valueNum = parseNumericValue(res.value);
      let unitStr = res.unit || "";

      // Realiza a conversão de unidade e valor se necessário!
      if (valueNum !== null) {
        const converted = convertValueAndUnit(match.key, valueNum, unitStr);
        valueNum = converted.valNum;
        unitStr = converted.unitStr;
      }

      const unitLowerNoSpace = unitStr.toLowerCase().replace(/\s+/g, '');
      const hasExplicitAbsUnit =
        unitLowerNoSpace.includes('/mm') ||
        unitLowerNoSpace.includes('/ul') ||
        unitLowerNoSpace.includes('giga') ||
        unitLowerNoSpace.includes('10^') ||
        unitLowerNoSpace.includes('10³') ||
        unitLowerNoSpace.includes('x10') ||
        unitLowerNoSpace.includes('mil/') ||
        unitLowerNoSpace.includes('cel/');

      const isWbcDiff =
        match.key.includes("Neutrófilos") ||
        match.key.includes("Linfócitos") ||
        match.key.includes("Monócitos") ||
        match.key.includes("Eosinófilos") ||
        match.key.includes("Basófilos");

      let isPct =
        unitLowerNoSpace.includes('%') ||
        String(res.value).includes('%') ||
        (!hasExplicitAbsUnit && valueNum !== null && valueNum <= 100 && isWbcDiff);

      if (match.key === "Eosinófilos") {
        isPct = true;
        unitStr = "%";
        if (valueNum !== null && valueNum > 50) {
          const wbcRes = validated.find(r => {
            const k = r.testName.toLowerCase();
            return k.includes("leucocitos") || k.includes("wbc");
          });
          const wbcNum = wbcRes ? parseNumericValue(wbcRes.value) : null;
          if (wbcNum && wbcNum > 0) {
            const wbcGiga = wbcNum <= 100 ? wbcNum * 1000 : wbcNum;
            valueNum = (valueNum / wbcGiga) * 100;
          } else {
            valueNum = valueNum / 100;
          }
        }
      }

      if (match.key.includes("Leucócitos") || match.key.includes("WBC")) {
        isPct = false;
        if (valueNum !== null && valueNum <= 100) {
          valueNum = valueNum * 1000;
        }
      } else if (
        isWbcDiff &&
        !isPct &&
        hasExplicitAbsUnit &&
        valueNum !== null &&
        valueNum <= 50 &&
        (unitLowerNoSpace.includes('giga') || unitLowerNoSpace.includes('10^') || unitLowerNoSpace.includes('10³') || unitLowerNoSpace.includes('x10') || unitLowerNoSpace.includes('mil/'))
      ) {
        valueNum = valueNum * 1000;
        unitStr = "/mm³";
      }

      const parsedRange = parseIdealRange(match.data.ideal, isPct, sex);
      
      let finalStatus = res.status;
      if (valueNum !== null && parsedRange !== null) {
        finalStatus = calculateStatus(valueNum, parsedRange.min, parsedRange.max);
      } else if (res.status === AnalysisStatus.UNKNOWN || !res.status) {
        finalStatus = AnalysisStatus.OPTIMIZED; // Fallback se não der pra calcular
      }

      const genderRef = getGenderSpecificIdeal(match.data.ideal, sex);

      return {
        ...res,
        testName: match.key, // Normaliza o nome do teste para o padrão do banco
        value: valueNum !== null ? String(Number(valueNum.toFixed(2))) : res.value, // Atualiza para o valor convertido redondo
        unit: unitStr || res.unit, // Atualiza para a unidade oficial/convertida
        referenceRange: genderRef || match.data.ideal, // Garante o Alvo Ideal específico do sexo
        status: finalStatus
      };
    }
    return res;
  });

  // 3. Deduplica resultados por testName normalizado para evitar qualquer duplicação
  const uniqueMap = new Map<string, ExamResult>();
  for (const item of normalized) {
    if (!uniqueMap.has(item.testName)) {
      uniqueMap.set(item.testName, item);
    } else {
      const existing = uniqueMap.get(item.testName)!;
      if ((existing.value === "0" || existing.value === "" || !existing.value) && item.value) {
        uniqueMap.set(item.testName, item);
      }
    }
  }
  const deduplicated = Array.from(uniqueMap.values()).filter((item) => {
    const isCalcRatio = Boolean(item.id?.startsWith('calc-')) || item.category === 'Cálculos';
    const valTrim = String(item.value || '').trim();
    const isBrokenZeroRatio =
      isCalcRatio && (valTrim === '0' || valTrim === '0.00' || valTrim === '0,00' || valTrim === 'NaN');
    return !isBrokenZeroRatio;
  });

  // 4. Calcula e adiciona razões e índices metabólicos/inflamatórios automaticamente
  return enrichRatios(deduplicated, sex);
};

const normalizeIsoDateOnly = (rawDate?: string): string => {
  const trimmed = (rawDate || '').trim();
  if (!trimmed) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

const formatIsoToPtBrDate = (isoDate: string): string => {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return isoDate;
};

const formatPtNumberString = (rawVal: string): string => {
  const trimmed = String(rawVal || '').trim();
  if (!trimmed) return '-';
  return trimmed.replace('.', ',');
};

/**
 * Motor matemático determinístico de evolução longitudinal para marcadores repetidos em >= 2 datas distintas.
 * Zero custo de IA: cruza resultados atuais com o histórico cronológico do paciente via normalizeExamLookup.
 */
export const computeLongitudinalTrends = (
  currentResults: ExamResult[],
  historicalRecords: ClinicalNote[] = [],
  currentReferenceDate?: string,
  excludeNoteId?: string
): Record<string, LongitudinalTrend> => {
  const trends: Record<string, LongitudinalTrend> = {};
  if (!Array.isArray(currentResults) || currentResults.length === 0) return trends;
  if (!Array.isArray(historicalRecords) || historicalRecords.length === 0) return trends;

  const currentIsoDate = normalizeIsoDateOnly(currentReferenceDate);

  const historicalPointsByKey = new Map<string, Map<string, LongitudinalPoint>>();

  for (const note of historicalRecords) {
    if (!note || note.type !== 'lab-result') continue;
    if (excludeNoteId && note.id === excludeNoteId) continue;

    let noteResults: ExamResult[] = [];
    if (typeof note.content === 'string' && note.content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(note.content);
        if (Array.isArray(parsed?.results)) {
          noteResults = parsed.results;
        }
      } catch {
        noteResults = [];
      }
    }
    if (noteResults.length === 0) continue;

    const noteIsoDate = normalizeIsoDateOnly(note.referenceDate || note.date);
    const noteFormattedDate = formatIsoToPtBrDate(noteIsoDate);

    for (const r of noteResults) {
      if (!r?.testName) continue;
      const num = parseNumericValue(r.value);
      if (num === null) continue;
      const canonicalKey = canonicalizeExamIdentity(r.testName) || normalizeExamLookup(r.testName);
      if (!canonicalKey) continue;

      if (!historicalPointsByKey.has(canonicalKey)) {
        historicalPointsByKey.set(canonicalKey, new Map<string, LongitudinalPoint>());
      }
      const dateMap = historicalPointsByKey.get(canonicalKey)!;
      dateMap.set(noteIsoDate, {
        date: noteIsoDate,
        formattedDate: noteFormattedDate,
        value: String(r.value),
        numericValue: num,
        unit: r.unit || '',
        status: r.status,
      });
    }
  }

  for (const curr of currentResults) {
    if (!curr?.testName) continue;
    const currNum = parseNumericValue(curr.value);
    if (currNum === null) continue;

    const lookupKey = normalizeExamLookup(curr.testName);
    const canonicalKey = canonicalizeExamIdentity(curr.testName) || lookupKey;
    if (!lookupKey || !canonicalKey) continue;

    const existingDateMap = historicalPointsByKey.get(canonicalKey);
    const mergedByDate = new Map<string, LongitudinalPoint>(existingDateMap ? existingDateMap.entries() : []);

    mergedByDate.set(currentIsoDate, {
      date: currentIsoDate,
      formattedDate: formatIsoToPtBrDate(currentIsoDate),
      value: String(curr.value),
      numericValue: currNum,
      unit: curr.unit || '',
      status: curr.status,
    });

    if (mergedByDate.size < 2) continue;

    const series = Array.from(mergedByDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-5);

    if (series.length < 2) continue;

    const prevPoint = series[series.length - 2];
    const lastPoint = series[series.length - 1];
    const prevNum = prevPoint.numericValue ?? 0;
    const lastNum = lastPoint.numericValue ?? 0;

    const deltaPercent =
      Math.abs(prevNum) > 0.0001
        ? Math.round(((lastNum - prevNum) / Math.abs(prevNum)) * 100)
        : 0;

    let isOscillating = false;
    if (series.length >= 3) {
      const significantDirections: number[] = [];
      for (let i = 1; i < series.length; i++) {
        const p0 = series[i - 1].numericValue ?? 0;
        const p1 = series[i].numericValue ?? 0;
        const stepPct = Math.abs(p0) > 0.0001 ? ((p1 - p0) / Math.abs(p0)) * 100 : 0;
        if (Math.abs(stepPct) > 5) {
          significantDirections.push(stepPct > 0 ? 1 : -1);
        }
      }
      for (let i = 1; i < significantDirections.length; i++) {
        if (significantDirections[i] !== significantDirections[i - 1]) {
          isOscillating = true;
          break;
        }
      }
    }

    let direction: LongitudinalDirection = 'stable';
    const seriesValues = series.map((p) => formatPtNumberString(p.value)).join(' → ');
    let summaryPill = '';

    if (isOscillating) {
      direction = 'oscillating';
      summaryPill = `${seriesValues} ⇄ Oscilante`;
    } else if (Math.abs(deltaPercent) <= 5) {
      direction = 'stable';
      summaryPill = `${seriesValues} → Estável`;
    } else if (deltaPercent < -5) {
      direction = 'falling';
      summaryPill = `${seriesValues} ↘ ${deltaPercent}%`;
    } else {
      direction = 'rising';
      summaryPill = `${seriesValues} ↑ +${deltaPercent}%`;
    }

    const trendObj: LongitudinalTrend = {
      markerKey: lookupKey,
      testName: curr.testName,
      unit: curr.unit || lastPoint.unit || '',
      direction,
      deltaPercent,
      series,
      previousValue: formatPtNumberString(prevPoint.value),
      currentValue: formatPtNumberString(lastPoint.value),
      summaryPill,
    };

    trends[lookupKey] = trendObj;
    if (canonicalKey !== lookupKey) {
      trends[canonicalKey] = trendObj;
    }
  }

  return trends;
};

export const analyzeMedicalInput = async (
  data: string,
  mimeType: string,
  isAudio: boolean = false,
  patientSex?: 'male' | 'female',
  onProgress?: (stage: 'extracting' | 'validating' | 'synthesizing') => void,
  clinicalContext?: ClinicalContext,
  historicalRecords?: ClinicalNote[],
  currentReferenceDate?: string
): Promise<UnifiedAnalysis> => {
  try {
    // Passo 1: Extração pura dos marcadores brutos pela IA
    onProgress?.('extracting');
    const parsed = await postGeminiApi<{ results?: ExamResult[]; synthesis?: string }>('/api/gemini/analyze', {
      data,
      mimeType,
      isAudio,
      patientSex,
    });

    // Passo 2: Validação matemática determinística (sem minBuffer, normalização e razões válidas)
    onProgress?.('validating');
    const validatedResults = sortExamResults(
      crossValidateResults(parsed.results || [], "", patientSex)
    );

    const longitudinalTrends = computeLongitudinalTrends(
      validatedResults,
      historicalRecords || [],
      currentReferenceDate
    );

    // Passo 3: Geração da Síntese Funcional estruturada e coerente com os resultados validados + evolução longitudinal
    let structured: StructuredSynthesisResult | null = null;
    if (validatedResults.length > 0) {
      onProgress?.('synthesizing');
      structured = await regenerateSynthesisFromResults(
        validatedResults,
        patientSex,
        clinicalContext,
        longitudinalTrends
      );
    }

    return {
      results: validatedResults,
      synthesis: structured?.clinicalSynthesisMarkdown || structured?.synthesis || "",
      clinicalSynthesisMarkdown: structured?.clinicalSynthesisMarkdown || "",
      positiveHighlights: structured?.positiveHighlights || [],
      priorityDeviations: structured?.priorityDeviations || [],
      patientRoutineSummary: structured?.patientRoutineSummary || "",
      patientPrintableReport: structured?.patientPrintableReport || "",
      executiveAudioBriefing: structured?.executiveAudioBriefing || "",
      suggestedFollowUpExams: structured?.suggestedFollowUpExams || [],
      longitudinalTrends: structured?.longitudinalTrends || longitudinalTrends,
      schemaVersion: structured?.schemaVersion || "2.0",
    };
  } catch (error) {
    console.error("Erro na análise unificada:", error);
    throw error instanceof Error ? error : new Error("Falha ao processar análise laboratorial.");
  }
};

/**
 * Chats with Clinical AI regarding a specific exam analysis and supplementary reference files.
 */
export const chatWithClinicalAI = async (
  examResults: ExamResult[],
  originalSynthesis: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string,
  referenceFiles: { name: string; base64?: string; mimeType?: string; textContent?: string }[],
  patientSex?: 'male' | 'female',
  clinicalContext?: ClinicalContext
): Promise<string> => {
  try {
    const data = await postGeminiApi<{ text: string }>('/api/gemini/chat', {
      examResults,
      originalSynthesis,
      history,
      newMessage,
      referenceFiles,
      patientSex,
      clinicalContext,
    });
    return data.text || "";
  } catch (error) {
    console.error("Erro no chat clínico:", error);
    throw error instanceof Error ? error : new Error("Falha ao processar resposta do chat clínico.");
  }
};

/**
 * Gera áudio de síntese de laudo usando o modelo de TTS de alta qualidade do Gemini.
 */
export const generateClinicalTTS = async (text: string, voice: string = 'puck'): Promise<string> => {
  try {
    const data = await postGeminiApi<{ audioBase64: string }>('/api/gemini/tts', {
      text,
      voice,
    });
    if (data.audioBase64) {
      return data.audioBase64;
    }
    throw new Error("Nenhum áudio foi retornado pelo modelo.");
  } catch (error) {
    console.error("Erro ao gerar TTS do Gemini:", error);
    throw error;
  }
};

/**
 * Re-gera a síntese estruturada (Markdown + arrays estruturados para UI e CRM) a partir de ExamResult[].
 */
export const regenerateSynthesisFromResults = async (
  results: ExamResult[],
  patientSex?: 'male' | 'female',
  clinicalContext?: ClinicalContext,
  longitudinalTrends?: Record<string, LongitudinalTrend>
): Promise<StructuredSynthesisResult> => {
  try {
    const data = await postGeminiApi<Partial<StructuredSynthesisResult>>('/api/gemini/regenerate-synthesis', {
      results,
      patientSex,
      clinicalContext,
      longitudinalTrends,
    });
    const markdown = data.clinicalSynthesisMarkdown || data.synthesis || "";
    return {
      clinicalSynthesisMarkdown: markdown,
      synthesis: markdown,
      positiveHighlights: Array.isArray(data.positiveHighlights) ? data.positiveHighlights : [],
      priorityDeviations: Array.isArray(data.priorityDeviations) ? data.priorityDeviations : [],
      patientRoutineSummary: typeof data.patientRoutineSummary === 'string' ? data.patientRoutineSummary : "",
      patientPrintableReport: typeof data.patientPrintableReport === 'string' ? data.patientPrintableReport : "",
      executiveAudioBriefing: typeof data.executiveAudioBriefing === 'string' ? data.executiveAudioBriefing : "",
      suggestedFollowUpExams: Array.isArray(data.suggestedFollowUpExams) ? data.suggestedFollowUpExams : [],
      longitudinalTrends:
        data.longitudinalTrends && typeof data.longitudinalTrends === 'object'
          ? data.longitudinalTrends
          : longitudinalTrends,
      schemaVersion: data.schemaVersion || '2.0',
    };
  } catch (error) {
    console.error("Erro ao re-gerar síntese:", error);
    throw error instanceof Error ? error : new Error("Falha ao re-gerar síntese funcional.");
  }
};

export interface SuggestExamsRequest {
  patientSex?: 'male' | 'female';
  patientAge?: number;
  symptomsAndGoals?: string;
  previousExamsContext?: PreviousExamContextSummary;
  recentlyRequestedExams?: RecentExamRequestSummary[];
  alreadyTestedExams?: AlreadyTestedExamSummary[];
}

export const suggestExamsWithAI = async (
  payload: SuggestExamsRequest
): Promise<SuggestExamsResponse> => {
  try {
    const data = await postGeminiApi<Partial<SuggestExamsResponse>>('/api/gemini/suggest-exams', payload);
    return {
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      omitted: {
        recentlyRequested: Array.isArray(data.omitted?.recentlyRequested) ? data.omitted!.recentlyRequested : [],
        biologicalWindow: Array.isArray(data.omitted?.biologicalWindow) ? data.omitted!.biologicalWindow : [],
      },
    };
  } catch (error) {
    console.error("Erro ao sugerir exames:", error);
    throw error instanceof Error ? error : new Error("Falha ao sugerir exames complementares.");
  }
};
