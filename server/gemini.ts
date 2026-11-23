import { GoogleGenAI, Type } from "@google/genai";
import { EXAM_GROUPS } from "../data/medicalData.ts";
import { CLINICAL_KNOWLEDGE_BASE } from "../data/clinicalKnowledge.ts";
import {
  normalizeExamLookup,
  canonicalizeExamIdentity,
  isLongCycleMarker,
  hasMonitoringOverride,
} from "../data/examNormalization.ts";
import type {
  ClinicalContext,
  PositiveHighlight,
  PriorityDeviation,
  SuggestedFollowUpExam,
  StructuredSynthesisResult,
  ExamSuggestionItem,
  PreviousExamContextSummary,
  AlreadyTestedExamSummary,
  RecentExamRequestSummary,
  SuggestExamsResponse,
  LongitudinalTrend,
} from "../types.ts";

const MODEL_NAME = 'gemini-2.5-flash';
const FALLBACK_MODEL_NAME = 'gemini-4-hydrogen';
const TTS_MODEL_NAME = 'gemini-3.8-flash-lite-tts';

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;

const getAI = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedApiKey = apiKey;
  }
  return cachedClient;
};

let cachedServerTargetTable: string | null = null;
const getServerTargetTablePrompt = (): string => {
  if (cachedServerTargetTable === null) {
    cachedServerTargetTable = Object.entries(CLINICAL_KNOWLEDGE_BASE)
      .map(([name, data]) => `- ${name}: ALVO IDEAL = ${data.ideal}`)
      .join('\n');
  }
  return cachedServerTargetTable;
};

const buildFallbackParams = (params: any) => {
  const nextParams: any = { ...params, model: FALLBACK_MODEL_NAME };
  if (params?.config && typeof params.config === 'object') {
    const { temperature: _temp, ...restConfig } = params.config;
    nextParams.config = restConfig;
  }
  return nextParams;
};

const parseGeminiJson = <T = Record<string, any>>(rawText?: string): T => {
  const trimmed = (rawText || '{}').trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!unfenced) {
    return {} as T;
  }

  try {
    return JSON.parse(unfenced) as T;
  } catch {
    // Extrai o bloco JSON principal { ... } mesmo quando há texto extra antes ou depois
    const firstBrace = unfenced.indexOf('{');
    const lastBrace = unfenced.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = unfenced.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate) as T;
      } catch {
        // segue para erro padronizado abaixo
      }
    }
    throw new Error('A IA retornou uma resposta fora do formato JSON esperado.');
  }
};

const callGeminiWithRetry = async (params: any, retries = 3, delay = 2000): Promise<any> => {
  const ai = getAI();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const status = Number(error?.status || error?.statusCode || 0);
      const msg = String(error?.message || '').toLowerCase();

      const isOverloaded =
        status === 503 ||
        status === 429 ||
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('overloaded') ||
        msg.includes('temporarily unavailable');

      const isModelIssue =
        status === 404 ||
        (status === 400 && (msg.includes('model') || msg.includes('not found') || msg.includes('unsupported')));

      // Se o erro for 400/404 relacionado ao modelo, aciona o fallback imediatamente sem desperdiçar retries
      if (isModelIssue && params?.model !== FALLBACK_MODEL_NAME) {
        console.warn(`Primary model ${params?.model} returned ${status}. Falling back to ${FALLBACK_MODEL_NAME}...`);
        return await ai.models.generateContent(buildFallbackParams(params));
      }

      if (attempt === retries || !isOverloaded) {
        if (isOverloaded && attempt === retries && params?.model !== FALLBACK_MODEL_NAME) {
          try {
            console.warn(`Falling back to ${FALLBACK_MODEL_NAME} due to high demand...`);
            return await ai.models.generateContent(buildFallbackParams(params));
          } catch {
            throw error;
          }
        }
        throw error;
      }
      console.warn(`Gemini API overloaded/unavailable (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
};

const PROTOCOLO_CORRECAO = `
# [PROTOCOLO DE CORREÇÃO DE DADOS - CRÍTICO]

**REGRA DE CONSISTÊNCIA OBRIGATÓRIA:**
1. **PROIBIÇÃO ABSOLUTA DE ALUCINAÇÃO E INFERÊNCIA DE EXAMES AUSENTES:**
   - Extraia estritamente e APENAS os exames que constam na tabela/lista principal de RESULTADOS do paciente.
   - Se um exame (como Vitamina B12, TSH, Ferritina, etc.) NÃO está presente no laudo do paciente, JAMAIS inclua este exame no JSON de saída.
   - NUNCA associe números de metodologias, notas de rodapé, números de páginas, código de barras ou valores de referência a exames não realizados.
   - NUNCA atribua o resultado numérico de uma linha (ex: Hematócrito = 38%) ao nome de outro exame (como Vitamina B12) por contaminação de contexto.
   - NUNCA confunda Vitamina B1 (Tiamina) com Vitamina B12 (Cobalamina) nem Vitamina B6 / B9. Se o laudo contiver 'VITAMINA B1', extraia como 'Vitamina B1' com seu resultado específico (ex: 38 mcg/L).

2. **Varredura Primária Horizontal (Linha a Linha):** 
   - Localize na mesma linha: Nome do Exame -> Coluna do Resultado do Paciente -> Unidade.
   - **MANDATÓRIO:** Ignore e descarte sumariamente qualquer texto nas seções "Valores de Referência", "VR:", "Referências:" ou tabelas de referência do laboratório no PDF/imagem. Extraia APENAS o resultado REAL do paciente.
   - **SÉRIE BRANCA / HEMOGRAMA:** 
     - **Leucócitos (Glóbulos Brancos – WBC):** Extraia OBRIGATORIAMENTE o valor absoluto (ex: '6.500 /uL' ou '6.500 /mm³'). Nunca extraia em porcentagem (%).
     - **Eosinófilos:** Extraia OBRIGATORIAMENTE em PORCENTAGEM (%) conforme consta no laudo do paciente (ex: '3,0 %'). NUNCA extraia Eosinófilos em valor absoluto. A unidade deve ser sempre '%'.
     - **Demais Marcadores da Série Branca (Neutrófilos, Linfócitos, Monócitos, Basófilos):** Sempre priorize extrair os valores em CONTAGEM ABSOLUTA (em /mm³, /uL ou x10³/uL, ex: '4.137 /mm³'). Se o laudo contiver a coluna de valor absoluto e a coluna de porcentagem %, extraia o VALOR ABSOLUTO. Caso o laudo traga apenas %, extraia em %.

3. **APOLIPOPROTEÍNAS VS LIPOPROTEÍNA (A):**
   - NUNCA confunda Apolipoproteína A / Apolipoproteína A1 (Apo-A1) ou Apolipoproteína B (Apo-B) com Lipoproteína (a) [Lp(a)]. Se o exame listar Apolipoproteína A (ex: 119 mg/dL), atribua a "Apo-A1". Se listar Apolipoproteína B (ex: 83 mg/dL), atribua a "Apo-B". Só atribua a "Lipoproteína (a) [Lp(a)]" se o laudo especificar Lipoproteína (a) / Lp(a).

4. **VITAMINA D (REGRA DETERMINÍSTICA 25-OH VS 1,25-OH):**
   - Toda menção genérica a "Vitamina D", "Vit D", "Vitamina D3", "25-OH", "25(OH)D", "25-hidroxivitamina D" ou "Vitamina D total" DEVE ser extraída OBRIGATORIAMENTE como "Vitamina D (semi ativa 25-OH)" com unidade padrão "ng/mL" (quando omitida).
   - Extraia como "Vitamina D (ativa 1,25 OH)" (unidade padrão "pg/mL") SOMENTE quando o laudo/texto/áudio contiver explicitamente "1,25", "1.25", "calcitriol" ou "ativa" (sem "semi ativa").

5. **PROIBIÇÃO DE DUPLICIDADE:**
   - Cada marcador laboratorial deve ser extraído EXATAMENTE UMA VEZ. Se o laudo contiver o mesmo marcador em tabelas diferentes, extraia apenas o valor único do laudo do paciente.

6. **Alvos Funcionais:** Use OBRIGATORIAMENTE os valores da tabela de Alvos fornecida. Ignore as referências do laboratório.
`;

const SEMANTICA_CLINICA_SIRI = `
SEMÂNTICA CLÍNICA DO SIRI (ÍNDICE DE RESPOSTA INFLAMATÓRIA SISTÊMICA):
- O SIRI integra neutrófilos, monócitos e linfócitos absolutos para estimar a intensidade da resposta inflamatória sistêmica e o predomínio da imunidade inata sobre a adaptativa.
- Não possui finalidade diagnóstica isolada; interprete sempre em conjunto com RNL, MLR, PLR, PCR-us e o contexto clínico-nutricional do paciente.
- SIRI elevado aponta maior carga inflamatória sistêmica, estresse fisiológico e possível disfunção imunometabólica modulável por conduta nutricional.
- O cálculo numérico já vem validado pelo motor matemático quando aplicável; nunca invente nem recalcule índices ausentes.
`;

const CLINICAL_SCOPE_GUARDRAIL = `
# GUARDRAIL OBRIGATÓRIO DE ESCOPO CLÍNICO (NUTRIÇÃO CLÍNICA)
- **Papel Profissional:** Você atua exclusivamente como suporte avançado de raciocínio bioquímico-funcional para um **NUTRICIONISTA CLÍNICO** (não médico).
- **Proibições Absolutas:**
  1. NUNCA emita diagnóstico médico definitivo nem prescreva medicamentos.
  2. NUNCA prometa cura, reversão garantida ou remissão clínica.
  3. NUNCA sugira que dieta, suplementos ou intervenções nutricionais curam doenças incuráveis, neurodegenerativas, genéticas, autoimunes ou oncológicas (ex.: ELA, esclerose múltipla/lateral, Alzheimer, Parkinson, neoplasias, doenças genéticas).
- **Diretriz para Condições Crônicas/Graves:**
  - Trate patologias confirmadas ou achados graves apenas como contexto clínico modulador, direcionando as condutas estritamente para suporte do estado nutricional, modulação metabólica e inflamatória, preservação de massa magra e funcionalidade, alívio de sintomas e qualidade de vida.
  - Sinalizar critérios objetivos para alinhamento médico SOMENTE quando houver indicação clínica real ou desvio grave que ultrapasse a atuação nutricional.
`;

const ANALYZE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          testName: { type: Type.STRING },
          value: { type: Type.STRING },
          unit: { type: Type.STRING },
          referenceRange: { type: Type.STRING },
        },
        required: ['id', 'testName', 'value', 'unit', 'referenceRange'],
      },
    },
  },
  required: ['results'],
};

const SYNTHESIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    clinicalSynthesisMarkdown: { type: Type.STRING },
    positiveHighlights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          group: { type: Type.STRING },
          headline: { type: Type.STRING },
          routineImpact: { type: Type.STRING },
        },
        required: ['group', 'headline', 'routineImpact'],
      },
    },
    priorityDeviations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          marker: { type: Type.STRING },
          axis: { type: Type.STRING },
          severity: { type: Type.STRING },
          clinicalMeaning: { type: Type.STRING },
          technicalImpacts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          routineTranslation: { type: Type.STRING },
        },
        required: [
          'marker',
          'axis',
          'severity',
          'clinicalMeaning',
          'technicalImpacts',
          'routineTranslation',
        ],
      },
    },
    patientRoutineSummary: { type: Type.STRING },
    patientPrintableReport: { type: Type.STRING },
    executiveAudioBriefing: { type: Type.STRING },
    suggestedFollowUpExams: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          examName: { type: Type.STRING },
          groupName: { type: Type.STRING },
          justification: { type: Type.STRING },
        },
        required: ['examName', 'groupName', 'justification'],
      },
    },
  },
  required: [
    'clinicalSynthesisMarkdown',
    'positiveHighlights',
    'priorityDeviations',
    'patientRoutineSummary',
    'patientPrintableReport',
    'executiveAudioBriefing',
    'suggestedFollowUpExams',
  ],
};

const SUGGEST_EXAMS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          examName: { type: Type.STRING },
          groupName: { type: Type.STRING },
          priority: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['examName', 'groupName', 'priority', 'reason'],
      },
    },
  },
  required: ['suggestions'],
};

const EIXOS_CLINICOS_LISTA = `
         - Eixo endócrino e metabólico
         - Eixo neuroendócrino
         - Eixo sono
         - Eixo metabolismo energético
         - Eixo metabolismo bioquímico / hepático / renal
         - Eixo sistema digestivo
         - Eixo cognitivo e emocional
         - Eixo destoxificação intestinal e hepática
         - Eixo sistema imune / inflamatório / hematológico
         - Eixo hormonal
         - Eixo estresse
         - Eixo vitaminas e minerais
         - Eixo hídrico`;

const buildCatalogPrompt = (): string => {
  return EXAM_GROUPS.map(
    (group) => `- Grupo "${group.title}": ${group.exams.join(' | ')}`
  ).join('\n');
};

const findExactCatalogEntry = (
  examName: string,
  groupName?: string
): { examName: string; groupName: string } | null => {
  const targetNorm = normalizeExamLookup(examName);
  if (!targetNorm) return null;

  // Prefer matching inside suggested group first if provided
  const orderedGroups = groupName
    ? [
        ...EXAM_GROUPS.filter((g) => normalizeExamLookup(g.title) === normalizeExamLookup(groupName)),
        ...EXAM_GROUPS.filter((g) => normalizeExamLookup(g.title) !== normalizeExamLookup(groupName)),
      ]
    : EXAM_GROUPS;

  for (const group of orderedGroups) {
    for (const catalogExam of group.exams) {
      if (normalizeExamLookup(catalogExam) === targetNorm) {
        return { examName: catalogExam, groupName: group.title };
      }
    }
  }

  for (const group of orderedGroups) {
    for (const catalogExam of group.exams) {
      const catNorm = normalizeExamLookup(catalogExam);
      if (catNorm.includes(targetNorm) || targetNorm.includes(catNorm)) {
        return { examName: catalogExam, groupName: group.title };
      }
    }
  }

  return null;
};

const formatStatusLabelPt = (status?: string): string => {
  switch (String(status || '').trim().toUpperCase()) {
    case 'OPTIMIZED':
      return 'Preservado (Alvo Ideal)';
    case 'FUNCTIONAL_HIGH':
    case 'SLIGHT_HIGH':
      return 'Atenção (Acima do Alvo)';
    case 'FUNCTIONAL_LOW':
    case 'SLIGHT_LOW':
      return 'Atenção (Abaixo do Alvo)';
    case 'CLINICAL_HIGH':
      return 'Prioritário (Elevado)';
    case 'CLINICAL_LOW':
      return 'Prioritário (Abaixo do Ideal)';
    case 'CRITICAL_HIGH':
      return 'Prioritário (Muito Elevado)';
    case 'CRITICAL_LOW':
      return 'Prioritário (Muito Abaixo do Ideal)';
    default:
      return 'Em Análise';
  }
};

const sanitizeClinicalOutputText = (rawText?: string): string => {
  if (!rawText) return '';
  return rawText
    // Substitui qualquer variação proibida de "gargalo" por "ponto limitante"
    .replace(/\bGargalos\b/g, 'Pontos limitantes')
    .replace(/\bgargalos\b/gi, 'pontos limitantes')
    .replace(/\bGargalo\b/g, 'Ponto limitante')
    .replace(/\bgargalo\b/gi, 'ponto limitante')
    // Substitui qualquer variação proibida de "destravar" por "desbloquear"
    .replace(/\bDestravamento(s)?\b/g, (_m, s) => `Desbloqueio${s || ''}`)
    .replace(/\bdestravamento(s)?\b/gi, (_m, s) => `desbloqueio${s || ''}`)
    .replace(/\bDestravar\b/g, 'Desbloquear')
    .replace(/\bdestravar\b/gi, 'desbloquear')
    .replace(/\bDestravando\b/g, 'Desbloqueando')
    .replace(/\bdestravando\b/gi, 'desbloqueando')
    .replace(/\bDestravado(s|a|as)?\b/g, (_m, s) => `Desbloqueado${s || ''}`)
    .replace(/\bdestravado(s|a|as)?\b/gi, (_m, s) => `desbloqueado${s || ''}`)
    .replace(/\bDestrave\b/g, 'Desbloqueie')
    .replace(/\bdestrave\b/gi, 'desbloqueie')
    .replace(/\bDestrava\b/g, 'Desbloqueia')
    .replace(/\bdestrava\b/gi, 'desbloqueia')
    // Remove qualquer variação proibida de "eufuncional"
    .replace(/\bEufuncionais\b/g, 'Funcionalmente equilibrados')
    .replace(/\beufuncionais\b/gi, 'funcionalmente equilibrados')
    .replace(/\bEufuncional\b/g, 'Funcionalmente equilibrado')
    .replace(/\beufuncional\b/gi, 'funcionalmente equilibrado')
    // Remove qualquer vazamento acidental de enums internos em inglês
    .replace(/\bCRITICAL_LOW\b/g, 'Prioritário (baixo)')
    .replace(/\bCRITICAL_HIGH\b/g, 'Prioritário (elevado)')
    .replace(/\bCLINICAL_LOW\b/g, 'Prioritário (baixo)')
    .replace(/\bCLINICAL_HIGH\b/g, 'Prioritário (elevado)')
    .replace(/\bFUNCTIONAL_LOW\b/g, 'Atenção (abaixo do ideal)')
    .replace(/\bFUNCTIONAL_HIGH\b/g, 'Atenção (acima do ideal)')
    .replace(/\bSLIGHT_LOW\b/g, 'Atenção (abaixo do ideal)')
    .replace(/\bSLIGHT_HIGH\b/g, 'Atenção (acima do ideal)')
    .replace(/\bOPTIMIZED\b/g, 'Preservado')
    .replace(/\bUNKNOWN\b/g, 'Em análise')
    .trim();
};

const sanitizePatientFacingText = (rawText?: string): string => {
  return sanitizeClinicalOutputText(rawText)
    .replace(/\bcriticamente\s+baix([oa]s?)\b/gi, 'bem abaixo do ideal')
    .replace(/\bcriticamente\s+alt([oa]s?)\b/gi, 'bem acima do ideal')
    .replace(/\bdeficiência\s+crítica\b/gi, 'nível bem abaixo do ideal')
    .replace(/\bris[kc]o\s+crítico\b/gi, 'ponto prioritário de cuidado')
    .trim();
};

const sanitizeSpokenBriefingText = (rawText?: string): string => {
  return sanitizeClinicalOutputText(rawText)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*`_~>|()[\]]/g, ' ')
    .replace(/[→←↑↓↗↘↔●•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const sanitizeFollowUpExams = (
  rawList: unknown,
  existingResultNames: string[] = []
): SuggestedFollowUpExam[] => {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set<string>();
  const existingCanonical = new Set<string>();
  for (const name of existingResultNames) {
    const key = canonicalizeExamIdentity(name);
    if (key) existingCanonical.add(key);
  }

  const sanitized: SuggestedFollowUpExam[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const rawExam = String((item as any).examName || '').trim();
    const rawGroup = String((item as any).groupName || '').trim();
    const justification = sanitizeClinicalOutputText(String((item as any).justification || '').trim());
    if (!rawExam || !justification) continue;

    const catalogMatch = findExactCatalogEntry(rawExam, rawGroup);
    if (!catalogMatch) continue;

    const canonical = canonicalizeExamIdentity(catalogMatch.examName);
    if (canonical && existingCanonical.has(canonical)) continue;
    if (seen.has(catalogMatch.examName) || (canonical && seen.has(`c:${canonical}`))) continue;

    seen.add(catalogMatch.examName);
    if (canonical) seen.add(`c:${canonical}`);

    sanitized.push({
      examName: catalogMatch.examName,
      groupName: catalogMatch.groupName,
      justification,
    });

    if (sanitized.length >= 6) break;
  }

  return sanitized;
};

const sanitizeClinicalContext = (ctx?: unknown): ClinicalContext | undefined => {
  if (!ctx || typeof ctx !== 'object') return undefined;
  const raw = ctx as Record<string, unknown>;
  const cleanStringArray = (val: unknown): string[] | undefined => {
    if (!Array.isArray(val)) return undefined;
    const items = val
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0)
      .slice(0, 20);
    return items.length > 0 ? items : undefined;
  };

  const cleaned: ClinicalContext = {
    knownConditions: cleanStringArray(raw.knownConditions),
    symptoms: cleanStringArray(raw.symptoms),
    goals: cleanStringArray(raw.goals),
    medications: cleanStringArray(raw.medications),
    notes: typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes.trim().slice(0, 1200) : undefined,
  };

  if (
    !cleaned.knownConditions &&
    !cleaned.symptoms &&
    !cleaned.goals &&
    !cleaned.medications &&
    !cleaned.notes
  ) {
    return undefined;
  }

  return cleaned;
};

const formatClinicalContextBlock = (ctx?: ClinicalContext): string => {
  if (!ctx) return '';
  const lines: string[] = [];
  if (ctx.knownConditions?.length) lines.push(`- Condições conhecidas / comorbidades: ${ctx.knownConditions.join('; ')}`);
  if (ctx.symptoms?.length) lines.push(`- Sintomas relatados: ${ctx.symptoms.join('; ')}`);
  if (ctx.goals?.length) lines.push(`- Objetivos clínicos/nutricionais: ${ctx.goals.join('; ')}`);
  if (ctx.medications?.length) lines.push(`- Medicações / suplementos em uso: ${ctx.medications.join('; ')}`);
  if (ctx.notes) lines.push(`- Observações clínicas adicionais (sem PII): ${ctx.notes}`);
  if (lines.length === 0) return '';

  return `\nCONTEXTO CLÍNICO DE ANAMNESE (SEM PII — USE COMO MODULADOR DA INTERPRETAÇÃO):\n${lines.join('\n')}\n`;
};

const buildExecutiveSynthesisGuidelines = (
  coverageRule: string,
  markerCount: number,
  hasOptimizedMarkers: boolean
) => `
      POSTURA CLÍNICA — INTELIGÊNCIA CLÍNICA PREDITIVA EM NUTRIÇÃO CLÍNICA (MOTOR EXECUTIVO 360° v2.2):
      - Atue em nível de consultoria bioquímico-funcional sênior para um NUTRICIONISTA CLÍNICO experiente.
      - Seja direto, cirúrgico, preditivo e de altíssima densidade decisória.
      - PROIBIDO dar explicações básicas de livro-texto ("a vitamina D é uma vitamina lipossolúvel..."), PROIBIDO usar linguagem submissa/vaga e PROIBIDO emitir diagnóstico médico definitivo ou prescrição medicamentosa.
      - PROIBIDO usar a palavra "gargalo" ou "gargalos" (substitua sempre por "ponto limitante", "pontos limitantes" ou "fator limitante").
      - PROIBIDO usar a palavra "destravar" (ou qualquer variação como "destrave", "destravando", "destravamento"). Use "desbloquear" quando necessário.
      - PROIBIDO usar a palavra "eufuncional" / "eufuncionais".
      - PROIBIDO exibir códigos/enums internos em inglês (como CRITICAL_LOW, CRITICAL_HIGH, CLINICAL_LOW, CLINICAL_HIGH, FUNCTIONAL_LOW, FUNCTIONAL_HIGH, SLIGHT_LOW, SLIGHT_HIGH, OPTIMIZED, UNKNOWN) em qualquer campo do JSON.
      - Destaque nomes de marcadores e valores em NEGRITO no Markdown técnico, ex.: **Vitamina D (semi ativa 25-OH) (20 ng/mL)**, **Ferritina (18 ng/mL)**.

      1. COBERTURA E FIDELIDADE ABSOLUTA:
         ${coverageRule}

      2. ESTRUTURA OBRIGATÓRIA DO CAMPO "clinicalSynthesisMarkdown" (EXATAMENTE ESTES 4 BLOCOS NA ORDEM ABAIXO — ELIMINE COMPLETAMENTE "ALAVANCAS DE MAIOR SOLUÇÃO" E "SINAIS DE ALERTA"):
         - ### 1. RESUMO GERAL
           Síntese técnica executiva e elegante de **35 a 55 palavras** (sem enrolação didática, sem linguagem coloquial e sem a palavra "gargalo").
           ${markerCount === 1
             ? 'REGRA DE MARCADOR ÚNICO (OBRIGATÓRIA): Declare explicitamente tratar-se de um **recorte bioquímico focal**, apontando o ponto limitante fisiológico central e a prioridade de suporte nutricional sem inventar comparações com exames ausentes.'
             : 'Apresente o padrão metabólico dominante, o ponto limitante nutricional central e os sistemas preservados em 35 a 55 palavras.'}
         - ### 2. EIXOS AVALIADOS
           Cada linha deve iniciar OBRIGATORIAMENTE pelo **Nome do Eixo** seguido de dois-pontos e os marcadores com seus valores e status entre parênteses (NUNCA inicie a linha com "Prioritário — Eixo..."):
           Formato obrigatório: \`- **Vitaminas e minerais:** **Vitamina D (semi ativa 25-OH) (20 ng/mL)** *(Prioritário)*\`
           Utilize dentre os eixos oficiais: ${EIXOS_CLINICOS_LISTA} e apenas os rótulos **Preservado**, **Atenção** ou **Prioritário**.
           REGRA DE COMPACTAÇÃO OBRIGATÓRIA: agrupe TODOS os eixos 100% preservados em uma ÚNICA linha compacta ao final (ex.: \`- **Eixos preservados (Metabolismo energético, Função hepática):** **Glicose (86 mg/dL)** *(Preservado)*, **AST (21 U/L)** *(Preservado)*.\`).
         - ### 3. TRIANGULAÇÃO ENTRE EIXOS & DEPENDÊNCIAS BIOQUÍMICAS E MEDICAMENTOSAS
           Formato telegráfico de altíssima densidade decisória usando **palavras-chave, setas direcionais obrigatórias (→, ↑, ↓) em TODAS as linhas e bullets curtos** (ESTRITAMENTE PROIBIDO escrever parágrafos narrativos longos):
           * **Regra de Cruzamento Real entre Marcadores:**
             ${markerCount >= 2
               ? '- Triangule obrigatoriamente os **marcadores reais presentes nos resultados** entre si, evidenciando causa-efeito bioquímica entre os desvios e marcadores preservados com setas (→, ↑, ↓), sem inventar exames ausentes.'
               : '- Informe em 1 linha curta tratar-se de marcador único (sem outros resultados no painel para cruzamento) e apresente apenas as dependências diretas da via metabólica com setas (→, ↑, ↓).'}
           * **Cofatores & Absorção:** liste os cofatores enzimáticos limitantes e condições de absorção/estilo de vida explicados com setas (ex.: \`Magnésio intracelular ↓ → atividade das hidroxilases ↓ → ativação da Vitamina D ↓\`).
           * **Ativos Medicamentosos Interferentes (SETAS OBRIGATÓRIAS EM CADA FÁRMACO):** liste classes e nomes específicos de ativos farmacológicos pertinentes aos desvios encontrados, SEMPRE acompanhados de cadeia causal com setas (→, ↑, ↓) mostrando exatamente como interferem no marcador:
             - Ex.: \`Corticosteroides (prednisona, dexametasona) → catabolismo enzimático ↑ → Vitamina D ↓\`
             - Ex.: \`Anticonvulsivantes (fenitoína, carbamazepina) → indução CYP450 ↑ → depuração hepática ↑ → Vitamina D ↓\`
             - Ex.: \`Bloqueadores de absorção lipídica (orlistate, colestiramina) → micelização de lipossolúveis ↓ → absorção de Vitamina D ↓\`
             - Ex.: \`Estatinas em altas doses → substrato 7-desidrocolesterol ↓ → síntese endógena de Vitamina D ↓\`
         - ### 4. INVESTIGAÇÃO COMPLEMENTAR SUGERIDA
           Lista ultra-enxuta (máximo de 4 a 6 exames ausentes do painel atual): \`- **Nome do Exame:** justificativa investigativa em 1 linha curta.\`
           BLINDAGEM ANTI-REPETIÇÃO: NUNCA sugira exames que já estejam presentes na lista de resultados fornecida!

      3. CATÁLOGO OFICIAL DE EXAMES (RESTRIÇÃO OBRIGATÓRIA PARA INVESTIGAÇÃO COMPLEMENTAR):
         Tanto na seção "### 4. INVESTIGAÇÃO COMPLEMENTAR SUGERIDA" quanto no array JSON "suggestedFollowUpExams", você SÓ PODE sugerir exames que constem LITERALMENTE na lista abaixo (usando o nome EXATO do exame e o título EXATO do grupo) e que NÃO estejam já presentes no laudo atual:
${buildCatalogPrompt()}

      4. REGRA RIGOROSA PARA "positiveHighlights":
         ${hasOptimizedMarkers
           ? 'Gere apenas itens correspondentes a eixos com marcadores realmente classificados como Preservado (máximo 5 itens). Nunca inclua marcadores em Atenção ou Prioritário.'
           : 'NÃO HÁ NENHUM marcador preservado neste recorte. Retorne OBRIGATORIAMENTE "positiveHighlights": [] (array vazio). É ESTRITAMENTE PROIBIDO inventar eixos genéricos como "Avaliação Preventiva" ou "Cuidado Proativo".'}

         [INSTRUÇÃO INTERNA — NÃO COPIE ESTE PARÁGRAFO NO TEXTO FINAL]:
         Se não houver lacuna investigativa relevante no catálogo, escreva em uma linha curta que o painel atual é suficiente no momento e retorne "suggestedFollowUpExams": []. NUNCA copie instruções deste prompt na resposta final.`;

export interface ExamResultPayload {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: string;
  category?: string;
  notes?: string;
}

export interface ChatHistoryEntry {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ReferenceFilePayload {
  name: string;
  base64?: string;
  mimeType?: string;
  textContent?: string;
}

export const analyzeMedicalInputServer = async (
  data: string,
  mimeType: string,
  isAudio: boolean = false,
  patientSex?: 'male' | 'female',
  targetTable: string = ""
): Promise<{ results: ExamResultPayload[]; synthesis: string }> => {
  const cleanMime = (mimeType || '').split(';')[0].trim().toLowerCase();
  const isPlainText = cleanMime === 'text/plain';
  const effectiveIsAudio = !isPlainText && Boolean(isAudio);
  const cleanData = data.replace(/^data:.*?;base64,/, '');
  const sexLabel = patientSex === 'male' ? 'MASCULINO (Homem)' : patientSex === 'female' ? 'FEMININO (Mulher)' : 'NÃO ESPECIFICADO';

  const effectiveTargetTable =
    typeof targetTable === 'string' && targetTable.trim()
      ? targetTable
      : getServerTargetTablePrompt();

  const systemInstruction = `
      Você é um Especialista em Extração Estruturada de Exames Laboratoriais.
      Sua única missão nesta etapa (Passo 1 — Extração Pura) é extrair com fidelidade absoluta os marcadores presentes no documento/áudio/texto fornecido em um array JSON "results", sem gerar texto discursivo ou síntese clínica.
      Toda a extração deve operar em temperatura 0.0 para exatidão matemática e zero alucinação.

      SEXO BIOLÓGICO DO PACIENTE DO CRM: ${sexLabel}.
      CRÍTICO: Ao preencher referências iniciais, considere o sexo ${sexLabel} quando aplicável.

      ${PROTOCOLO_CORRECAO}

      7. **ENTRADAS MANUAIS LIVRES E CURTAS (MUITO IMPORTANTE):**
         - O usuário pode digitar ou colar anotações manuais livres e curtas, mesmo **sem unidade de medida** e **sem valor de referência**, usando QUALQUER separador entre o nome do exame e o resultado:
           * Vírgula: "Vitamina D, 20" -> testName: "Vitamina D (semi ativa 25-OH)", value: "20", unit: "ng/mL"
           * Hífen: "Vitamina D-20" ou "Ferritina - 45" -> testName: "Vitamina D (semi ativa 25-OH)", value: "20", unit: "ng/mL"
           * Dois-pontos: "Vitamina D:20" ou "TSH: 3.1" -> testName: "Vitamina D (semi ativa 25-OH)", value: "20", unit: "ng/mL"
           * Ponto e vírgula: "Vitamina D;20" -> testName: "Vitamina D (semi ativa 25-OH)", value: "20", unit: "ng/mL"
           * Barra: "Vitamina D/20" -> testName: "Vitamina D (semi ativa 25-OH)", value: "20", unit: "ng/mL"
           * Igual ou espaço: "Vitamina D=20" ou "Vitamina D 20" -> testName: "Vitamina D (semi ativa 25-OH)", value: "20", unit: "ng/mL"
           * Vitamina D ativa explícita: "Vitamina D 1,25: 65" ou "Calcitriol 65" -> testName: "Vitamina D (ativa 1,25 OH)", value: "65", unit: "pg/mL"
         - **CRÍTICO:** Um hífen (-) ou barra (/) logo entre o nome do marcador e o valor numérico é SEMPRE um separador de campo — NUNCA interprete "Vitamina D-20" como número negativo ("-20") e NUNCA interprete "Vitamina D/20" como fração ou razão.
         - Quando o texto manual omitir a unidade de medida, retorne "unit": "" (ou "ng/mL" para Vitamina D 25-OH / "pg/mL" para Vitamina D 1,25-OH ativa), sem descartar o exame.
         - Extraia todos os marcadores informados, mesmo que haja apenas 1 marcador no texto ou áudio.

      TABELA DE ALVOS IDEAIS (REFERÊNCIA DE NOMENCLATURA E ALVOS):
      ${effectiveTargetTable}

      INSTRUÇÕES DE SAÍDA (PASSO 1 — SOMENTE EXTRAÇÃO):
      Retorne um objeto JSON único contendo APENAS o array "results":
      {
        "results": [{ "id", "testName", "value", "unit", "referenceRange" }]
      }
      - Em "value", informe apenas o resultado numérico/qualitativo real do paciente (nunca o valor de referência).
      - Em "unit", informe a unidade exatamente como consta no exame (ou "" se ausente em entrada manual curta).
      - Não inclua marcadores ausentes do laudo, não classifique status e não gere texto discursivo.
    `;

  const parts: any[] = [];
  if (isPlainText) {
    const decodedText = Buffer.from(cleanData, 'base64').toString('utf8').trim();
    if (!decodedText) {
      throw new Error('O texto fornecido para análise está vazio.');
    }
    parts.push({
      text: `Extraia exclusivamente os resultados laboratoriais do texto abaixo para o array JSON results (aceitando formatos curtos com qualquer separador, mesmo sem unidade ou valor de referência):\n\n${decodedText}`,
    });
  } else {
    parts.push({ inlineData: { mimeType: cleanMime, data: cleanData } });
    parts.push({
      text: effectiveIsAudio
        ? "Transcreva mentalmente o áudio e extraia exclusivamente os resultados laboratoriais narrados para o array JSON results."
        : "Extraia exclusivamente os resultados laboratoriais do laudo para o array JSON results.",
    });
  }

  const response = await callGeminiWithRetry({
    model: MODEL_NAME,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: ANALYZE_RESPONSE_SCHEMA,
      temperature: 0.0,
    },
    contents: [{ parts }],
  });

  const parsed = parseGeminiJson<{ results?: Partial<ExamResultPayload>[] }>(response.text);
  const normalizedResults: ExamResultPayload[] = Array.isArray(parsed.results)
    ? parsed.results
        .filter((item) => item && typeof item === 'object' && String(item.testName || '').trim())
        .map((item, idx) => ({
          id: String(item.id || `ext-${idx + 1}`).trim(),
          testName: String(item.testName || '').trim(),
          value: String(item.value ?? '').trim(),
          unit: String(item.unit ?? '').trim(),
          referenceRange: String(item.referenceRange ?? '').trim(),
          status: String(item.status || 'UNKNOWN').trim(),
        }))
    : [];

  return {
    results: normalizedResults,
    synthesis: ""
  };
};

export const chatWithClinicalAIServer = async (
  examResults: ExamResultPayload[],
  originalSynthesis: string,
  history: ChatHistoryEntry[],
  newMessage: string,
  referenceFiles: ReferenceFilePayload[] = [],
  patientSex?: 'male' | 'female',
  clinicalContext?: ClinicalContext
): Promise<string> => {
  const resultsSummary = examResults
    .map(r => `- ${r.testName}: ${r.value} ${r.unit} (Alvo Funcional: ${r.referenceRange}, Classificação: ${formatStatusLabelPt(r.status)})`)
    .join('\n');

  const sexLabel = patientSex === 'male' ? 'MASCULINO (Homem)' : patientSex === 'female' ? 'FEMININO (Mulher)' : 'NÃO ESPECIFICADO';
  const cleanContext = sanitizeClinicalContext(clinicalContext);
  const contextBlock = formatClinicalContextBlock(cleanContext);

  const systemInstruction = `
Você é um Consultor Sênior em Bioquímica Funcional Sistêmica e Nutrição Clínica (mesmo rigor executivo do Motor 360°).
O usuário é um NUTRICIONISTA CLÍNICO experiente dialogando sobre os exames laboratoriais do paciente.

${CLINICAL_SCOPE_GUARDRAIL}

DADOS ATUAIS DO PACIENTE (SEM PII):
Sexo Biológico do CRM: ${sexLabel}
${contextBlock}
Resultados dos exames laboratoriais analisados:
${resultsSummary}

Síntese Funcional Inicial gerada pelo sistema:
${originalSynthesis}

DIRETRIZES EXECUTIVAS DE RESPOSTA:
1. Seja cirúrgico, preditivo e de alta densidade decisória — PROIBIDO dar aula básica de livro-texto ou introduções longas.
2. Quando pertinente à pergunta, estruture a resposta de forma limpa em até 3 camadas objetivas:
   - **Mecanismo Provável**
   - **Cofatores/Bloqueios a Checar**
   - **Ação Nutricional / Investigação**
3. Conecte vias metabólicas reais, interações de nutrientes (ex.: zinco/cobre, cinética do ferro, conversão tireoidiana, eixos hormonais/inflamatórios) e padrões funcionais usando exclusivamente os marcadores presentes ou sinalizando lacunas reais.
4. Se houver arquivos de referência anexados à mensagem, utilize-os como base técnica de suporte.
5. PROIBIDO usar a palavra "gargalo" ou "gargalos" (use "ponto limitante" / "pontos limitantes"), PROIBIDO usar a palavra "destravar" (ou qualquer conjugação/derivação — use "desbloquear"), PROIBIDO usar a palavra "eufuncional" e PROIBIDO exibir códigos internos em inglês (CRITICAL_LOW, OPTIMIZED, etc.).
6. Sempre destaque nomes de marcadores e valores em negrito (ex.: **Glicose em jejum (86 mg/dL)**) e, quando útil, organize pelos eixos clínicos oficiais:
${EIXOS_CLINICOS_LISTA}

${SEMANTICA_CLINICA_SIRI}
`;

  const parts: any[] = [{ text: newMessage }];

  referenceFiles.forEach(file => {
    if (file.base64 && file.mimeType) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64.replace(/^data:.*?;base64,/, '')
        }
      });
      parts.push({ text: `[Arquivo de apoio anexado: ${file.name}]` });
    } else if (file.textContent) {
      parts.push({ text: `[Conteúdo do arquivo de apoio ${file.name}]:\n${file.textContent}` });
    }
  });

  const contents = [
    ...history,
    { role: 'user', parts }
  ];

  const response = await callGeminiWithRetry({
    model: MODEL_NAME,
    config: {
      systemInstruction,
      temperature: 0.0,
    },
    contents: contents as any
  });

  return sanitizeClinicalOutputText(response.text || "");
};

const truncateAtSentenceBoundaryServer = (text: string, maxWords: number): string => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';

  const words = clean.split(' ');
  if (words.length <= maxWords) return clean;

  const candidate = words.slice(0, maxWords).join(' ');
  const lastTerminator = Math.max(
    candidate.lastIndexOf('.'),
    candidate.lastIndexOf('!'),
    candidate.lastIndexOf('?')
  );

  if (lastTerminator >= Math.floor(candidate.length * 0.4)) {
    return candidate.slice(0, lastTerminator + 1).trim();
  }

  return `${candidate.replace(/[,;:\-]+$/, '').trim()}.`;
};

const prepareTextForClinicalTTS = (rawText: string): string => {
  return sanitizeClinicalOutputText(rawText || '')
    // Remover links Markdown mantendo o texto visível
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remover símbolos de status visuais, setas, parênteses, colchetes e formatação Markdown
    .replace(/[→←↑↓↗↘↔●•]/g, ' ')
    .replace(/[#*`_~>|()[\]]/g, ' ')
    // Remover marcadores de lista no início de linha
    .replace(/^\s*[-+]\s+/gm, '')
    // Converter ordinais simbólicos para forma falada natural
    .replace(/\b1[º°]\b/g, 'primeiro')
    .replace(/\b2[º°]\b/g, 'segundo')
    .replace(/\b3[º°]\b/g, 'terceiro')
    // Expandir razões com barra ANTES da regra genérica de barras
    .replace(/\bTG\s*\/\s*HDL\b/gi, 'razão triglicerídeos por H D L')
    .replace(/\bCT\s*\/\s*HDL\b/gi, 'razão colesterol total por H D L')
    .replace(/\bLDL\s*\/\s*HDL\b/gi, 'razão L D L por H D L')
    .replace(/\bAST\s*\/\s*ALT\b/gi, 'razão A S T por A L T')
    .replace(/\bTGO\s*\/\s*TGP\b/gi, 'razão T G O por T G P')
    .replace(/\bCa\s*\/\s*P\b/g, 'razão cálcio por fósforo')
    .replace(/\bZn\s*\/\s*Cu\b/g, 'razão zinco por cobre')
    .replace(/\bApo-?B\s*\/\s*Apo-?A1\b/gi, 'razão apolipoproteína B por apolipoproteína A um')
    // Expandir unidades laboratoriais ANTES da regra genérica de barras
    .replace(/\bmL\/min\/1[.,]73\s*m[²2]\b/gi, 'mililitros por minuto por 1,73 metro quadrado')
    .replace(/\bmg\/24h\b/gi, 'miligramas por 24 horas')
    .replace(/\bg\/24h\b/gi, 'gramas por 24 horas')
    .replace(/\bmg\/dL\b/gi, 'miligramas por decilitro')
    .replace(/\bmg\/L\b/gi, 'miligramas por litro')
    .replace(/\bng\/dL\b/gi, 'nanogramas por decilitro')
    .replace(/\bng\/mL\b/gi, 'nanogramas por mililitro')
    .replace(/\bpg\/mL\b/gi, 'picogramas por mililitro')
    .replace(/\b(?:mcg|µg)\/dL\b/gi, 'microgramas por decilitro')
    .replace(/\b(?:mcg|µg)\/L\b/gi, 'microgramas por litro')
    .replace(/\b(?:uUI|µUI)\/mL\b/gi, 'microunidades internacionais por mililitro')
    .replace(/\bmUI\/L\b/gi, 'miliunidades internacionais por litro')
    .replace(/\bUI\/mL\b/gi, 'unidades internacionais por mililitro')
    .replace(/\bUI\/L\b/gi, 'unidades internacionais por litro')
    .replace(/\bpmol\/L\b/gi, 'picomols por litro')
    .replace(/\bnmol\/L\b/gi, 'nanomols por litro')
    .replace(/\b(?:umol|µmol)\/L\b/gi, 'micromols por litro')
    .replace(/\bmmol\/L\b/gi, 'milimols por litro')
    .replace(/\bmEq\/L\b/gi, 'miliequivalentes por litro')
    .replace(/\bK\/[uµ]L\b/gi, 'mil por microlitro')
    .replace(/\bU\/L\b/gi, 'unidades por litro')
    .replace(/\bg\/dL\b/gi, 'gramas por decilitro')
    .replace(/\bg\/L\b/gi, 'gramas por litro')
    .replace(/\/mm[³3]/gi, 'por milímetro cúbico')
    .replace(/\/[uµ]L/gi, 'por microlitro')
    .replace(/\bfL\b/g, 'fentolitros')
    .replace(/(\d+(?:[.,]\d+)?)\s*%/g, '$1 por cento')
    // Expandir siglas clínicas e marcadores para pronúncia natural em PT-BR (mais específicas primeiro)
    .replace(/\b1[.,]25[\s-]*OH\b/gi, 'um vírgula vinte e cinco hidroxi')
    .replace(/\b25[\s-]*OH\b/gi, 'vinte e cinco hidroxi')
    .replace(/\bPCR-us\b/gi, 'Proteína C Reativa ultrassensível')
    .replace(/\bHbA1c\b/gi, 'hemoglobina glicada')
    .replace(/\beTFG\b/g, 'ritmo de filtração glomerular')
    .replace(/\bHOMA-IR\b/gi, 'índice HOMA I R')
    .replace(/\bAnti-TPO\b/gi, 'anti peroxidase tireoidiana')
    .replace(/\bDHEA-S\b/gi, 'sulfato de D H E A')
    .replace(/\bIGF-1\b/gi, 'I G F um')
    .replace(/\bApo-?B\b/gi, 'apolipoproteína B')
    .replace(/\bApo-?A1\b/gi, 'apolipoproteína A um')
    .replace(/\bLp\s*a\b/gi, 'lipoproteína a')
    .replace(/\bRNL\b/g, 'razão neutrófilos por linfócitos')
    .replace(/\bPLR\b/g, 'razão plaquetas por linfócitos')
    .replace(/\bMLR\b/g, 'razão monócitos por linfócitos')
    .replace(/\bSIRI\b/g, 'índice de resposta inflamatória sistêmica')
    .replace(/\bVLDL\b/g, 'V L D L')
    .replace(/\bHDL\b/g, 'H D L')
    .replace(/\bLDL\b/g, 'L D L')
    .replace(/\bTSH\b/g, 'T S H')
    .replace(/\bT4L\b/g, 'T quatro livre')
    .replace(/\bT3L\b/g, 'T três livre')
    .replace(/\bSHBG\b/g, 'S H B G')
    .replace(/\bCHCM\b/g, 'C H C M')
    .replace(/\bVCM\b/g, 'V C M')
    .replace(/\bHCM\b/g, 'H C M')
    .replace(/\bRDW\b/g, 'R D W')
    .replace(/\bTyG\b/g, 'índice triglicerídeos glicose')
    .replace(/\bAST\b/g, 'A S T')
    .replace(/\bALT\b/g, 'A L T')
    .replace(/\bGGT\b/g, 'gama G T')
    .replace(/\bPTH\b/g, 'paratormônio')
    .replace(/\bVHS\b/g, 'V H S')
    .replace(/\bWBC\b/g, 'leucócitos totais')
    .replace(/\bRBC\b/g, 'eritrócitos')
    .replace(/\bTG\b/g, 'triglicerídeos')
    .replace(/\bHb\b/g, 'hemoglobina')
    .replace(/\bHt\b/g, 'hematócrito')
    // Suavizar barras restantes entre palavras (ex: hepático / renal -> hepático e renal)
    .replace(/\s*\/\s*/g, ' e ')
    // Melhorar pausas entre linhas e remover espaços duplicados
    .replace(/\n{2,}/g, '. ')
    .replace(/\n+/g, ', ')
    .replace(/\s*([.,;:])\s*/g, '$1 ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
};

export const generateClinicalTTSServer = async (
  text: string,
  voice: string = 'puck'
): Promise<string> => {
  const ai = getAI();
  const cleanText = prepareTextForClinicalTTS(text);
  const voiceName = voice.charAt(0).toUpperCase() + voice.slice(1).toLowerCase();

  const maxAttempts = 3;
  let delayMs = 1500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: TTS_MODEL_NAME,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: 'Narrador clínico claro, sereno, profissional e articulado em português do Brasil',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName
              }
            }
          }
        }
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }

      throw new Error("Nenhum áudio foi retornado pelo modelo.");
    } catch (error: any) {
      const status = Number(error?.status || error?.statusCode || 0);
      const msg = String(error?.message || '').toLowerCase();
      const isTransient =
        status === 429 ||
        status === 503 ||
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('overloaded') ||
        msg.includes('temporarily unavailable');

      if (!isTransient || attempt === maxAttempts) {
        throw error;
      }

      console.warn(`Gemini TTS overloaded/unavailable (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms...`);
      await new Promise((res) => setTimeout(res, delayMs));
      delayMs *= 2;
    }
  }

  throw new Error("Nenhum áudio foi retornado pelo modelo.");
};

const formatCleanPatientMarkerServer = (exam: ExamResultPayload): string => {
  const name = (exam.testName || '').trim();
  const value = String(exam.value ?? '').trim();
  if (!value) return name;
  const unit = (exam.unit || '').trim();
  const isPercent = unit === '%' || value.endsWith('%');
  const cleanVal = value.replace(/%$/, '').trim();
  return isPercent ? `${name} ${cleanVal}%` : `${name} ${cleanVal}`;
};

const buildFallbackPatientPrintableReport = (
  results: ExamResultPayload[],
  patientRoutineSummary: string,
  suggestedFollowUpExams: SuggestedFollowUpExam[]
): string => {
  const preserved = results.filter((r) => r.status === 'OPTIMIZED');
  const attention = results.filter((r) => r.status !== 'OPTIMIZED');
  const sections: string[] = [];

  if (preserved.length > 0) {
    sections.push(
      `### O que está favorável no seu organismo\n${preserved.map((r) => `- **${formatCleanPatientMarkerServer(r)}:** dentro da faixa funcional esperada, apoiando o equilíbrio da sua rotina do dia a dia.`).join('\n')}`
    );
  }

  if (attention.length > 0) {
    sections.push(
      `### Pontos de atenção na sua rotina\n${patientRoutineSummary || `Na revisão dos seus exames, há ${attention.length} marcador(es) com oportunidade de ajuste nutricional (${attention.slice(0, 6).map((r) => formatCleanPatientMarkerServer(r)).join(', ')}). Cuidar desses pontos favorece energia, constância e bem-estar nas suas tarefas do dia a dia.`}`
    );
  }

  sections.push(
    `### Direcionamento propositivo\nO planejamento nutricional direciona ajustes graduais e práticos para a sua rotina do dia a dia e suas tarefas, reconstruindo reservas e sustentando sua vitalidade com segurança.`
  );

  if (suggestedFollowUpExams.length > 0) {
    sections.push(
      `### Acompanhamento complementar\nPara acompanhar a evolução com precisão, alguns exames complementares direcionados podem compor o próximo retorno.`
    );
  }

  return sanitizePatientFacingText(sections.join('\n\n'));
};

const buildFallbackExecutiveAudioBriefing = (
  clinicalSynthesisMarkdown: string
): string => {
  const raw = (clinicalSynthesisMarkdown || '').trim();
  if (!raw) return '';

  // Extrai os blocos atuais (v2.2: Resumo Geral + Triangulação/Dependências/Fármacos + Investigação Complementar)
  // mantendo compatibilidade com laudos anteriores caso necessário
  const resumoMatch = raw.match(/###\s*(?:1\.\s*)?Resumo Geral\s*([\s\S]*?)(?=###\s|$)/i);
  const triangulacaoMatch = raw.match(/###\s*(?:3\.\s*)?Triangulação[^\n]*\s*([\s\S]*?)(?=###\s|$)/i);
  const investigacaoMatch = raw.match(/###\s*(?:4\.\s*)?Investigação Complementar(?:\s+Sugerida)?\s*([\s\S]*?)(?=###\s|$)/i);

  const selectedBlocks = [
    resumoMatch?.[1]?.trim(),
    triangulacaoMatch?.[1]?.trim(),
    investigacaoMatch?.[1]?.trim(),
  ].filter(Boolean);

  const sourceText = selectedBlocks.length > 0 ? selectedBlocks.join(' ') : raw;

  const withoutHeadingsAndBullets = sourceText
    .replace(/^#{1,4}\s+.*$/gm, ' ')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\b1[º°]\b/g, 'primeiro')
    .replace(/\b2[º°]\b/g, 'segundo')
    .replace(/\b3[º°]\b/g, 'terceiro');

  const cleaned = sanitizeSpokenBriefingText(withoutHeadingsAndBullets);
  return truncateAtSentenceBoundaryServer(cleaned, 115);
};

const formatLongitudinalTrendsBlock = (trends?: Record<string, LongitudinalTrend>): string => {
  if (!trends || typeof trends !== 'object') return '';
  const seenNames = new Set<string>();
  const validLines: string[] = [];

  for (const t of Object.values(trends)) {
    if (!t || !t.testName || !Array.isArray(t.series) || t.series.length < 2) continue;
    const normName = normalizeExamLookup(t.testName);
    if (seenNames.has(normName)) continue;
    seenNames.add(normName);

    const timelineStr = t.series
      .map((p) => `${p.formattedDate || p.date}: ${p.value}${t.unit ? ` ${t.unit}` : ''}`)
      .join(' -> ');
    const dirLabel =
      t.direction === 'oscillating'
        ? 'Oscilante'
        : t.direction === 'falling'
          ? `Queda (${t.deltaPercent}%)`
          : t.direction === 'rising'
            ? `Elevação (+${t.deltaPercent}%)`
            : 'Estável';
    validLines.push(`- ${t.testName}: ${t.summaryPill} (${dirLabel} | Série cronológica: ${timelineStr})`);
    if (validLines.length >= 20) break;
  }

  if (validLines.length === 0) return '';
  return `\nEVOLUÇÃO LONGITUDINAL DETERMINÍSTICA DE MARCADORES REPETIDOS (INCORPORE AS OSCILAÇÕES E RESPOSTAS EVOLUTIVAS NO BLOCO 1 "RESUMO GERAL" E NO BLOCO 3 "TRIANGULAÇÃO"):\n${validLines.join('\n')}\n`;
};

export const regenerateSynthesisFromResultsServer = async (
  results: ExamResultPayload[],
  patientSex?: 'male' | 'female',
  clinicalContext?: ClinicalContext,
  longitudinalTrends?: Record<string, LongitudinalTrend>
): Promise<StructuredSynthesisResult> => {
  const sexLabel = patientSex === 'male' ? 'MASCULINO (Homem)' : patientSex === 'female' ? 'FEMININO (Mulher)' : 'NÃO ESPECIFICADO';
  const cleanContext = sanitizeClinicalContext(clinicalContext);
  const contextBlock = formatClinicalContextBlock(cleanContext);
  const longitudinalBlock = formatLongitudinalTrendsBlock(longitudinalTrends);

  const hasOptimizedMarkers = results.some((r) => String(r.status || '').toUpperCase() === 'OPTIMIZED');
  const currentResultNames = results.map((r) => r.testName).filter(Boolean);

  const resultsSummary = results
    .map(r => `- ${r.testName}: ${r.value} ${r.unit} (Alvo Funcional: ${r.referenceRange}, Classificação: ${formatStatusLabelPt(r.status)})`)
    .join('\n');

  const systemInstruction = `
      Você é o Motor Clínico Executivo 360° (v2.3) — Inteligência Clínica Preditiva em Nutrição Clínica de nível sênior.
      Sua missão é gerar uma resposta estruturada em JSON baseada estritamente nos resultados laboratoriais JÁ VALIDADOS matematicamente abaixo.

      ${CLINICAL_SCOPE_GUARDRAIL}

      SEXO BIOLÓGICO DO PACIENTE DO CRM: ${sexLabel}.
      ${contextBlock}
      ${longitudinalBlock}

      REGRA DE FIDELIDADE ABSOLUTA À CLASSIFICAÇÃO CALCULADA (ZERO CONTRADIÇÃO):
      - Cada marcador abaixo já traz a Classificação validada deterministicamente pelo motor matemático do sistema (considerando sexo biológico e limites exatos).
      - É ESTRITAMENTE PROIBIDO reclassificar, suavizar ou contradizer a Classificação fornecida:
        * "Preservado (Alvo Ideal)" -> trate como marcador preservado / ponto forte.
        * "Atenção (...)" -> trate como desvio leve ou tendência precoce em atenção.
        * "Prioritário (...)" -> trate como desvio expressivo / prioritário.

      ${SEMANTICA_CLINICA_SIRI}

${buildExecutiveSynthesisGuidelines(
  `MANDATÓRIO E CRÍTICO: TODOS os ${results.length} marcadores fornecidos abaixo devem ser fielmente contemplados no campo "clinicalSynthesisMarkdown".
         PROIBIDA A INVENÇÃO OU CÁLCULO DE NOVOS MARCADORES: não invente, estime nem calcule marcadores ou índices ausentes da lista fornecida.`,
  results.length,
  hasOptimizedMarkers
)}

      SEPARAÇÃO ESTRITA DE LINGUAGEM POR PÚBLICO:
      A) CAMPO TÉCNICO ("clinicalSynthesisMarkdown" — Nutricionista / Dashboard / CRM):
         - Consultoria sênior em Nutrição Clínica nos 4 blocos obrigatórios, zero explicação básica de livro-texto, zero "gargalo".
         - Se houver bloco de EVOLUÇÃO LONGITUDINAL DETERMINÍSTICA fornecido acima, incorpore de forma concisa a resposta evolutiva ou oscilação relevante no Bloco 1 (RESUMO GERAL) e na cadeia causal com setas do Bloco 3 (TRIANGULAÇÃO).
      B) CAMPOS VOLTADOS AO PACIENTE ("patientPrintableReport" e "patientRoutineSummary" — Impressão e App):
         - Linguagem acolhedora, concreta e propositiva ancorada na "rotina do dia a dia e nas suas tarefas".
         - PROIBIDO usar "identificamos", "identificou", "detectamos", "analisamos", voz passiva artificial com "-se" ("nota-se", "observa-se", "estrutura-se", "evidencia-se") e 1ª pessoa do singular isolada ("Eu"). Utilize sujeitos clínicos diretos e naturais (ex.: "Na revisão dos seus exames, há...", "Os pontos de atenção atuais ligam-se...", "O planejamento nutricional direciona...").
         - PROIBIDO usar termos alarmistas ("criticamente baixo", "criticamente alto", "deficiência crítica", "risco crítico").
         - Ao citar marcadores no texto voltado ao paciente, exiba SOMENTE o nome e o número limpo (ex.: Ferritina 18, Vitamina D 20), mantendo o símbolo "%" APENAS quando a unidade original for percentual (ex.: Hematócrito 38,2%), removendo unidades técnicas confusas (ng/mL, µg/dL, g/dL, fL, pg, /µL).
      C) CAMPO DE ÁUDIO TTS ("executiveAudioBriefing" — Nutricionista):
         - Exatamente **80 a 115 palavras** (~30 a 45 segundos mesmo em painéis extensos), contendo EXCLUSIVAMENTE: Resumo Geral + Triangulação, dependências bioquímicas e ativos medicamentosos interferentes + Exames complementares prioritários.
         - Pronúncia natural em português corrido, SEM markdown, SEM símbolos de seta (→, ↑, ↓), SEM parênteses, SEM barras, SEM siglas quebradas, SEM enums em inglês, SEM "gargalo", SEM "eufuncional" e SEM "destravar".

      ESQUEMA JSON OBRIGATÓRIO DE SAÍDA (RETORNE EXATAMENTE ESTAS CHAVES):
      {
        "clinicalSynthesisMarkdown": "String Markdown técnica para o nutricionista/CRM contendo EXATAMENTE os 4 cabeçalhos nesta ordem: ### 1. RESUMO GERAL, ### 2. EIXOS AVALIADOS, ### 3. TRIANGULAÇÃO ENTRE EIXOS & DEPENDÊNCIAS BIOQUÍMICAS E MEDICAMENTOSAS, ### 4. INVESTIGAÇÃO COMPLEMENTAR SUGERIDA.",
        "positiveHighlights": [
          {
            "group": "Nome do eixo realmente preservado",
            "headline": "Título curto e valorizador",
            "routineImpact": "Impacto concreto na rotina do dia a dia e tarefas do paciente sem jargão excessivo"
          }
        ],
        "priorityDeviations": [
          {
            "marker": "Nome do Marcador (Valor Unidade)",
            "axis": "Eixo clínico correspondente",
            "severity": "critico ou alerta",
            "clinicalMeaning": "Resumo bioquímico enxuto de 1 frase para compatibilidade CRM (sem diagnóstico médico definitivo)",
            "technicalImpacts": [
              "Foco fisiológico 1: repercussão bioquímica direta (5 a 9 palavras)",
              "Foco fisiológico 2: repercussão bioquímica direta (5 a 9 palavras)",
              "Foco fisiológico 3: repercussão bioquímica direta (5 a 9 palavras)",
              "Foco fisiológico 4: repercussão bioquímica direta (5 a 9 palavras)",
              "Foco fisiológico 5: repercussão bioquímica direta (5 a 9 palavras)",
              "Foco fisiológico 6: repercussão bioquímica direta (5 a 9 palavras)"
            ],
            "routineTranslation": "Tradução acolhedora e objetiva para a rotina do dia a dia (sem alarmismo, sem 'identificamos', sem '-se' artificial)"
          }
        ],
        "patientRoutineSummary": "Resumo acolhedor de 2 a 3 frases curtas ancorado na rotina do dia a dia e tarefas, sem 'identificamos'/'detectamos'/'-se' artificial, sem alarmismo, sem unidades técnicas confusas (apenas nome + número limpo ou %) e sem códigos internos.",
        "patientPrintableReport": "Relatório pronto para impressão e entrega ao paciente em linguagem acolhedora, propositiva e ancorada na rotina do dia a dia e nas suas tarefas, sem jargões pesados, sem 'identificamos'/'detectamos'/'-se' artificial, sem alarmismo e exibindo marcadores apenas como nome + número limpo (mantendo % só para percentuais), estruturado com cabeçalhos ###: (1) ### O que está favorável no seu organismo [OMITIR COMPLETAMENTE esta seção se não houver nenhum marcador preservado no recorte], (2) ### Pontos de atenção na sua rotina, (3) ### Direcionamento propositivo, (4) ### Acompanhamento complementar (1 a 2 linhas breves sem lista técnica exaustiva).",
        "executiveAudioBriefing": "Roteiro falado natural pronto para TTS destinado ao nutricionista (80 a 115 palavras, ~30 a 45 segundos), narrando EXCLUSIVAMENTE: Resumo Geral + Triangulação, dependências bioquímicas e ativos medicamentosos interferentes + Exames complementares prioritários. Texto corrido limpo, SEM markdown, SEM símbolos de seta, SEM parênteses, SEM barras, SEM enums em inglês, SEM 'gargalo', SEM 'eufuncional' e SEM 'destravar'.",
        "suggestedFollowUpExams": [
          {
            "examName": "Nome EXATO do exame conforme o Catálogo Oficial (e ausente do painel atual)",
            "groupName": "Nome EXATO do grupo conforme o Catálogo Oficial",
            "justification": "1 linha ultra-enxuta explicando a correlação investigativa"
          }
        ]
      }

      REGRAS QUANTITATIVAS E DE QUALIDADE DOS CAMPOS:
      - "positiveHighlights": ${hasOptimizedMarkers ? 'de 1 a 5 objetos apenas para eixos com marcadores Preservados.' : 'OBRIGATORIAMENTE [] (vazio), pois não há marcadores preservados no recorte.'}
      - "priorityDeviations": ordene por impacto clínico real (severity: "critico" para marcadores Prioritários e "alerta" para marcadores em Atenção). Cada item DEVE conter exatamente 6 elementos distintos e objetivos em "technicalImpacts" (5 a 9 palavras cada, no formato "Foco fisiológico: repercussão bioquímica direta"). Se todos estiverem Preservados, retorne [].
      - "suggestedFollowUpExams": máximo de 4 a 6 exames mais resolutivos do Catálogo Oficial, nunca repetindo exames já presentes no painel atual.
      - "patientPrintableReport": ${hasOptimizedMarkers ? 'inclua todas as 4 seções em linguagem acolhedora.' : 'OMITA completamente a seção "### O que está favorável no seu organismo", iniciando diretamente em "### Pontos de atenção na sua rotina".'}
      - "executiveAudioBriefing": respeite rigorosamente o teto de 80 a 115 palavras em português natural fluido sem setas, sem parênteses e sem "gargalo".
    `;

  const response = await callGeminiWithRetry({
    model: MODEL_NAME,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: SYNTHESIS_RESPONSE_SCHEMA,
      maxOutputTokens: 8192,
      temperature: 0.0,
    },
    contents: [{
      parts: [{ text: `Abaixo está a lista completa e validada de resultados de exames do paciente (${results.length} marcadores):\n${resultsSummary}\n${longitudinalBlock}\nGere o JSON completo do Motor Clínico Executivo 360° (v2.3) seguindo 100% as classificações fornecidas, os 4 blocos técnicos (com setas direcionais obrigatórias na triangulação e nos fármacos interferentes), os 6 technicalImpacts por marcador desviado, o relatório impresso acolhedor do paciente, o briefing executivo falado para o nutricionista (80-115 palavras sem setas/parênteses/gargalo), o guardrail de nutrição clínica e o Catálogo Oficial.` }]
    }]
  });

  const parsed = parseGeminiJson<Record<string, any>>(response.text);
  const clinicalSynthesisMarkdown = sanitizeClinicalOutputText(
    typeof parsed.clinicalSynthesisMarkdown === 'string' && parsed.clinicalSynthesisMarkdown.trim()
      ? parsed.clinicalSynthesisMarkdown.trim()
      : typeof parsed.synthesis === 'string'
        ? parsed.synthesis.trim()
        : ''
  );

  // Blindagem determinística: se não há nenhum marcador OPTIMIZED, positiveHighlights DEVE ser vazio
  const positiveHighlights: PositiveHighlight[] = hasOptimizedMarkers && Array.isArray(parsed.positiveHighlights)
    ? parsed.positiveHighlights
        .filter((item: any) => item && typeof item === 'object' && (item.headline || item.routineImpact))
        .slice(0, 5)
        .map((item: any) => ({
          group: sanitizeClinicalOutputText(String(item.group || 'Equilíbrio Funcional').trim()),
          headline: sanitizeClinicalOutputText(String(item.headline || '').trim()),
          routineImpact: sanitizePatientFacingText(String(item.routineImpact || '').trim()),
        }))
    : [];

  const priorityDeviations: PriorityDeviation[] = Array.isArray(parsed.priorityDeviations)
    ? parsed.priorityDeviations
        .filter((item: any) => item && typeof item === 'object' && item.marker)
        .map((item: any) => {
          const clinicalMeaning = sanitizeClinicalOutputText(String(item.clinicalMeaning || '').trim());
          const rawImpacts = Array.isArray(item.technicalImpacts)
            ? item.technicalImpacts
                .map((t: unknown) => sanitizeClinicalOutputText(String(t || '').trim()))
                .filter(Boolean)
                .slice(0, 6)
            : [];
          return {
            marker: sanitizeClinicalOutputText(String(item.marker || '').trim()),
            axis: sanitizeClinicalOutputText(String(item.axis || 'Metabolismo Geral').trim()),
            severity: String(item.severity || '').toLowerCase() === 'critico' ? 'critico' : 'alerta',
            clinicalMeaning,
            technicalImpacts: rawImpacts,
            routineTranslation: sanitizePatientFacingText(String(item.routineTranslation || '').trim()),
          };
        })
    : [];

  const patientRoutineSummary = sanitizePatientFacingText(
    typeof parsed.patientRoutineSummary === 'string' ? parsed.patientRoutineSummary.trim() : ''
  );

  const suggestedFollowUpExams = sanitizeFollowUpExams(parsed.suggestedFollowUpExams, currentResultNames);

  const rawPatientPrintable =
    typeof parsed.patientPrintableReport === 'string' && parsed.patientPrintableReport.trim()
      ? sanitizePatientFacingText(parsed.patientPrintableReport.trim())
      : buildFallbackPatientPrintableReport(results, patientRoutineSummary, suggestedFollowUpExams);

  // Se não há marcadores preservados, garante que a seção favorável não apareça vazia/inventada
  const patientPrintableReport = !hasOptimizedMarkers
    ? rawPatientPrintable
        .replace(/###\s*O que está favorável no seu organismo[\s\S]*?(?=###\s*Pontos de atenção|$)/i, '')
        .trim()
    : rawPatientPrintable;

  const executiveAudioBriefing =
    typeof parsed.executiveAudioBriefing === 'string' && parsed.executiveAudioBriefing.trim()
      ? sanitizeSpokenBriefingText(parsed.executiveAudioBriefing.trim())
      : buildFallbackExecutiveAudioBriefing(clinicalSynthesisMarkdown);

  return {
    clinicalSynthesisMarkdown,
    synthesis: clinicalSynthesisMarkdown,
    positiveHighlights,
    priorityDeviations,
    patientRoutineSummary,
    patientPrintableReport,
    executiveAudioBriefing,
    suggestedFollowUpExams,
    longitudinalTrends:
      longitudinalTrends && typeof longitudinalTrends === 'object' ? longitudinalTrends : undefined,
    schemaVersion: '2.0',
  };
};

const stripAccidentalPiiServer = (text: string): string => {
  return (text || '')
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[CPF REMOVIDO]')
    .replace(/(\bcpf[ \t]*[:\-]?[ \t]*)\d{11}\b/gi, '$1[CPF REMOVIDO]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL REMOVIDO]')
    .replace(/(?:\+?55[ \t]*)?(?:\(\d{2}\)[ \t]*|\b\d{2}[ \t]+)(?:9\d{4}|\d{4})[- \t]?\d{4}\b/g, '[TELEFONE REMOVIDO]')
    .trim()
    .slice(0, 1500);
};

export interface SuggestExamsInput {
  patientSex?: 'male' | 'female';
  patientAge?: number;
  symptomsAndGoals?: string;
  previousExamsContext?: PreviousExamContextSummary;
  recentlyRequestedExams?: RecentExamRequestSummary[];
  alreadyTestedExams?: AlreadyTestedExamSummary[];
}

const formatDaysAgoPt = (daysAgo?: number): string => {
  if (typeof daysAgo !== 'number' || !Number.isFinite(daysAgo) || daysAgo < 0) return '';
  const rounded = Math.floor(daysAgo);
  if (rounded === 0) return 'hoje';
  if (rounded === 1) return 'há 1 dia';
  return `há ${rounded} dias`;
};

export const suggestExamsServer = async ({
  patientSex,
  patientAge,
  symptomsAndGoals,
  previousExamsContext,
  recentlyRequestedExams: topLevelRecentRequests,
  alreadyTestedExams: topLevelAlreadyTested,
}: SuggestExamsInput): Promise<SuggestExamsResponse> => {
  const sexLabel =
    patientSex === 'male' ? 'MASCULINO' : patientSex === 'female' ? 'FEMININO' : 'NÃO ESPECIFICADO';
  const ageLabel =
    typeof patientAge === 'number' && Number.isFinite(patientAge) && patientAge > 0 && patientAge <= 125
      ? `${Math.round(patientAge)} anos`
      : 'Não informada';

  const cleanKeywords = stripAccidentalPiiServer(symptomsAndGoals || '');

  // Mescla fontes de exames solicitados recentemente (< 45 dias)
  const mergedRecentRequests: RecentExamRequestSummary[] = [
    ...(Array.isArray(topLevelRecentRequests) ? topLevelRecentRequests : []),
    ...(Array.isArray(previousExamsContext?.recentlyRequestedExams) ? previousExamsContext.recentlyRequestedExams : []),
  ];

  const recentRequestMap = new Map<string, RecentExamRequestSummary>();
  for (const item of mergedRecentRequests) {
    if (!item || typeof item !== 'object') continue;
    const examName = String(item.examName || '').trim();
    const daysAgo = typeof item.daysAgo === 'number' && Number.isFinite(item.daysAgo) ? Math.max(0, Math.floor(item.daysAgo)) : 0;
    if (!examName || daysAgo >= 45) continue;
    const key = canonicalizeExamIdentity(examName);
    if (!key) continue;
    const existing = recentRequestMap.get(key);
    if (!existing || daysAgo < existing.daysAgo) {
      recentRequestMap.set(key, {
        examName,
        requestDate: item.requestDate ? String(item.requestDate) : undefined,
        daysAgo,
      });
    }
  }

  // Mescla fontes de exames já realizados (janela biológica: 30d padrão, 60d ciclo longo)
  const mergedAlreadyTested: AlreadyTestedExamSummary[] = [
    ...(Array.isArray(topLevelAlreadyTested) ? topLevelAlreadyTested : []),
    ...(Array.isArray(previousExamsContext?.alreadyTestedExams) ? previousExamsContext.alreadyTestedExams : []),
  ];

  const alreadyTestedMap = new Map<string, AlreadyTestedExamSummary>();
  for (const item of mergedAlreadyTested) {
    if (!item || typeof item !== 'object') continue;
    const testName = String(item.testName || '').trim();
    const daysAgo = typeof item.daysAgo === 'number' && Number.isFinite(item.daysAgo) ? Math.max(0, Math.floor(item.daysAgo)) : 999;
    if (!testName || daysAgo >= 60) continue;
    const key = canonicalizeExamIdentity(testName);
    if (!key) continue;
    const existing = alreadyTestedMap.get(key);
    if (!existing || daysAgo < existing.daysAgo) {
      alreadyTestedMap.set(key, {
        testName,
        evaluationDate: item.evaluationDate ? String(item.evaluationDate) : undefined,
        daysAgo,
        status: item.status ? String(item.status) : undefined,
      });
    }
  }

  const alteredLines = Array.isArray(previousExamsContext?.alteredMarkers)
    ? previousExamsContext.alteredMarkers
        .slice(0, 40)
        .map((m) => {
          const ageStr = formatDaysAgoPt(m.daysAgo);
          const ageSuffix = ageStr ? ` — coletado ${ageStr}` : '';
          return `- ${String(m.testName || '').trim()}: ${String(m.value || '').trim()} ${String(m.unit || '').trim()} (Classificação: ${formatStatusLabelPt(m.status)}${ageSuffix})`;
        })
        .join('\n')
    : '';

  const pendingLines = Array.isArray(previousExamsContext?.pendingFollowUpExams)
    ? previousExamsContext.pendingFollowUpExams
        .slice(0, 15)
        .map((f) => `- ${String(f.examName || '').trim()} (${String(f.groupName || '').trim()}): ${String(f.justification || '').trim()}`)
        .join('\n')
    : '';

  const recentRequestLines = Array.from(recentRequestMap.values())
    .slice(0, 40)
    .map((r) => `- ${r.examName} (solicitado ${formatDaysAgoPt(r.daysAgo)}, aguardando resultado)`)
    .join('\n');

  const blockedWindowLines = Array.from(alreadyTestedMap.values())
    .filter((t) => {
      const minWindow = isLongCycleMarker(t.testName) ? 60 : 30;
      return t.daysAgo < minWindow && !hasMonitoringOverride(cleanKeywords, t.testName);
    })
    .slice(0, 40)
    .map((t) => {
      const minWindow = isLongCycleMarker(t.testName) ? 60 : 30;
      return `- ${t.testName} (realizado ${formatDaysAgoPt(t.daysAgo)}; janela mínima ${minWindow} dias)`;
    })
    .join('\n');

  const consolidatedMeta =
    typeof previousExamsContext?.consolidatedEvaluationsCount === 'number' &&
    previousExamsContext.consolidatedEvaluationsCount > 1
      ? ` (histórico consolidado de ${previousExamsContext.consolidatedEvaluationsCount} avaliações nos últimos ${previousExamsContext.windowDays || 180} dias)`
      : '';

  const systemInstruction = `
Você é um Especialista em Bioquímica Funcional e Planejamento Laboratorial para **NUTRIÇÃO CLÍNICA**.
Sua tarefa é sugerir exames laboratoriais pertinentes para compor uma nova solicitação do nutricionista clínico, com foco preditivo, metabólico e nutricional.

${CLINICAL_SCOPE_GUARDRAIL}

PROIBIÇÕES GLOBAIS DE VOCABULÁRIO:
- PROIBIDO usar a palavra "gargalo" ou "gargalos" (use "ponto limitante" / "pontos limitantes").
- PROIBIDO usar a palavra "destravar" (ou qualquer conjugação/derivação — use "desbloquear").
- PROIBIDO usar a palavra "eufuncional" / "eufuncionais".
- PROIBIDO exibir códigos/enums internos em inglês (CRITICAL_LOW, CRITICAL_HIGH, CLINICAL_LOW, CLINICAL_HIGH, FUNCTIONAL_LOW, FUNCTIONAL_HIGH, SLIGHT_LOW, SLIGHT_HIGH, OPTIMIZED, UNKNOWN).

REGRAS CRÍTICAS DE SAÍDA:
1. Você SÓ PODE sugerir exames que existam LITERALMENTE na lista oficial do Catálogo abaixo (use o nome EXATO do exame e o título EXATO do grupo):
${buildCatalogPrompt()}

2. Retorne JSON puro exatamente neste esquema:
{
  "suggestions": [
    {
      "examName": "Nome EXATO do exame no catálogo",
      "groupName": "Título EXATO do grupo no catálogo",
      "priority": "alta ou complementar",
      "reason": "1 linha preditivo-decisória conectando o desvio/sintoma atual à hipótese bioquímica ou nutricional que este exame confirma ou descarta (sem diagnóstico médico)"
    }
  ]
}

3. CRITÉRIOS CLÍNICOS E BLINDAGEM ANTI-DUPLICIDADE:
   - Selecione entre 4 e 12 exames altamente coerentes (sem listas genéricas gigantes).
   - "alta": exames essenciais para confirmar/descartar hipóteses diretamente ligadas aos desvios anteriores não reavaliados, sugestões pendentes ou sintomas/objetivos centrais informados.
   - "complementar": exames de apoio para triangulação metabólica, cofatores nutricionais ou acompanhamento evolutivo.
   - PROIBIDO sugerir exames que estejam na lista de "JÁ SOLICITADOS RECENTEMENTE (< 45 DIAS)" aguardando resultado.
   - PROIBIDO sugerir exames bloqueados pela "JANELA BIOLÓGICA" (< 30 dias para exames gerais; < 60 dias para Hemoglobina Glicada/HbA1c, Vitamina D e Ferritina), a menos que o nutricionista peça explicitamente monitoramento nas palavras-chave. Priorize marcadores complementares ou lacunas de investigação ainda não cobertas.
   - Considere marcadores alterados de avaliações anteriores dentro dos últimos 180 dias que ainda não foram reavaliados (observando há quantos dias foram coletados).
   - Mantenha zero menção a nomes, documentos ou dados pessoais.
`;

  const userPrompt = `
DADOS ANONIMIZADOS DO PACIENTE (ZERO PII):
- Sexo biológico: ${sexLabel}
- Idade: ${ageLabel}
- Sinais, sintomas, objetivos e condições informadas pelo nutricionista: ${cleanKeywords || 'Avaliação metabólica e nutricional preventiva'}
${previousExamsContext?.lastEvaluationDate ? `- Data da avaliação mais recente analisada: ${previousExamsContext.lastEvaluationDate}${consolidatedMeta}` : ''}

MARCADORES ALTERADOS CONSOLIDADOS (ÚLTIMOS 180 DIAS — STATUS MAIS RECENTE POR MARCADOR):
${alteredLines || 'Nenhum marcador alterado selecionado ou registrado.'}

INVESTIGAÇÃO COMPLEMENTAR PENDENTE DE SÍNTESES ANTERIORES:
${pendingLines || 'Nenhuma pendência prévia registrada.'}

EXAMES JÁ SOLICITADOS RECENTEMENTE (< 45 DIAS — AGUARDANDO RESULTADO — NÃO SUGERIR):
${recentRequestLines || 'Nenhuma solicitação pendente recente.'}

EXAMES EM JANELA BIOLÓGICA RECENTE (NÃO REPETIR SEM PEDIDO EXPLÍCITO DE MONITORAMENTO):
${blockedWindowLines || 'Nenhum exame bloqueado por janela biológica.'}

Gere o JSON com as sugestões do catálogo oficial agrupadas por prioridade clínica ("alta" primeiro, depois "complementar"), evitando qualquer exame já solicitado recentemente ou dentro da janela biológica bloqueada.
`;

  const response = await callGeminiWithRetry({
    model: MODEL_NAME,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: SUGGEST_EXAMS_RESPONSE_SCHEMA,
      temperature: 0.0,
    },
    contents: [{ parts: [{ text: userPrompt }] }],
  });

  const parsed = parseGeminiJson<{ suggestions?: unknown[] }>(response.text);
  const rawList = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

  const seenExact = new Set<string>();
  const seenCanonical = new Set<string>();
  const suggestions: ExamSuggestionItem[] = [];
  const omittedRecentlyRequested = new Set<string>();
  const omittedBiologicalWindow = new Set<string>();

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const rawExam = String((item as any).examName || '').trim();
    const rawGroup = String((item as any).groupName || '').trim();
    const reason = String((item as any).reason || '').trim();
    if (!rawExam || !reason) continue;

    const exact = findExactCatalogEntry(rawExam, rawGroup);
    if (!exact) continue;

    const canonicalKey = canonicalizeExamIdentity(exact.examName);
    if (seenExact.has(exact.examName) || (canonicalKey && seenCanonical.has(canonicalKey))) {
      continue;
    }

    // Trava determinística 1: exame já solicitado nos últimos 45 dias e aguardando resultado
    if (canonicalKey && recentRequestMap.has(canonicalKey)) {
      omittedRecentlyRequested.add(exact.examName);
      continue;
    }

    // Trava determinística 2: janela biológica (< 30d padrão; < 60d para HbA1c, Vitamina D e Ferritina)
    if (canonicalKey && alreadyTestedMap.has(canonicalKey)) {
      const tested = alreadyTestedMap.get(canonicalKey)!;
      const requiredMinDays = isLongCycleMarker(exact.examName) ? 60 : 30;
      if (tested.daysAgo < requiredMinDays && !hasMonitoringOverride(cleanKeywords, exact.examName)) {
        omittedBiologicalWindow.add(exact.examName);
        continue;
      }
    }

    seenExact.add(exact.examName);
    if (canonicalKey) seenCanonical.add(canonicalKey);

    const priorityRaw = String((item as any).priority || '').toLowerCase();
    const priority: 'alta' | 'complementar' = priorityRaw === 'alta' ? 'alta' : 'complementar';

    suggestions.push({
      examName: exact.examName,
      groupName: exact.groupName,
      priority,
      reason: sanitizeClinicalOutputText(reason),
    });
  }

  suggestions.sort((a, b) => {
    if (a.priority === b.priority) return 0;
    return a.priority === 'alta' ? -1 : 1;
  });

  return {
    suggestions,
    omitted: {
      recentlyRequested: Array.from(omittedRecentlyRequested),
      biologicalWindow: Array.from(omittedBiologicalWindow),
    },
  };
};
