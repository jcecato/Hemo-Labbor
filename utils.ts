import { ExamResult } from './types';
import { CLINICAL_KNOWLEDGE_BASE } from './data/clinicalKnowledge';

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Ordena resultados laboratoriais seguindo a hierarquia definida no Gabarito Clínico.
 * Utiliza busca de substring para lidar com variações de nomenclatura da IA.
 */
export const sortExamResults = (results: ExamResult[]): ExamResult[] => {
  const markerOrder = Object.keys(CLINICAL_KNOWLEDGE_BASE);
  
  const getSortScore = (testName: string): number => {
    const name = (testName || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, " ")
      .trim();
    
    // Tenta encontrar o índice na ordem oficial
    const index = markerOrder.findIndex(officialName => {
      const official = officialName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, " ")
        .trim();
      
      const officialShort = official.split(' (')[0].trim();
      return official.includes(name) || name.includes(officialShort) || officialShort.includes(name);
    });

    return index === -1 ? 999 : index; // Desconhecidos vão para o fim
  };

  return [...results].sort((a, b) => getSortScore(a.testName) - getSortScore(b.testName));
};

export const PRINT_ASSETS = {
  logo: "https://i.ibb.co/JRkkVnRx/Vitt-re-CENTRO-INTEGRADO-EM-SA-DE-sem-fundo.png",
  signature: "https://i.ibb.co/9HfYMTYb/Assinatura-Digital.png",
  govbr: "https://upload.wikimedia.org/wikipedia/commons/1/11/Gov.br_logo.svg",
} as const;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB (evita estourar limite de 50 MB após Base64)
export const MAX_AUDIO_RECORDING_SECONDS = 5 * 60; // 5 minutos

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_PDF_MIME_TYPES = ['application/pdf'] as const;
export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/aac',
] as const;
export const ALLOWED_REFERENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
] as const;

export const normalizeMimeType = (mime?: string): string =>
  (mime || '').split(';')[0].trim().toLowerCase();

/**
 * Converte string UTF-8 para Base64 de forma moderna (sem usar unescape() obsoleto).
 */
export const utf8ToBase64 = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

/**
 * Classificação unificada de micronutrientes (vitaminas e minerais) para badges na tela e na impressão.
 */
export const isMicronutrientExam = (exam: { category?: string; testName?: string }): boolean => {
  const cat = (exam.category || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const name = (exam.testName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return (
    cat.includes('vitamina') ||
    cat.includes('mineral') ||
    cat.includes('micro') ||
    name.includes('vitamina') ||
    name.includes('zinco') ||
    name.includes('magnesio') ||
    name.includes('selenio') ||
    name.includes('cobre') ||
    name.includes('acido folico') ||
    name.includes('folato') ||
    name.includes('b12') ||
    name.includes('tiamina')
  );
};

export interface PiiSanitizationResult {
  sanitized: string;
  maskedCount: number;
}

/**
 * Sanitização determinística leve para mascarar padrões óbvios de CPF, e-mail e telefone
 * antes do envio de texto manual à IA (preserva valores laboratoriais numéricos e quebras de linha).
 */
export const sanitizeClinicalTextPII = (input: string): PiiSanitizationResult => {
  if (!input) return { sanitized: '', maskedCount: 0 };
  let maskedCount = 0;
  let text = input;

  // 1. CPF formatado (XXX.XXX.XXX-XX) ou rotulado explicitamente como CPF com 11 dígitos
  text = text.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, () => {
    maskedCount += 1;
    return '[CPF REMOVIDO]';
  });
  text = text.replace(/(\bcpf[ \t]*[:\-]?[ \t]*)\d{11}\b/gi, (_m, prefix) => {
    maskedCount += 1;
    return `${prefix}[CPF REMOVIDO]`;
  });

  // 2. E-mails
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, () => {
    maskedCount += 1;
    return '[EMAIL REMOVIDO]';
  });

  // 3. Telefones brasileiros (somente espaços horizontais [ \t], nunca atravessando quebras de linha)
  text = text.replace(/(?:\+?55[ \t]*)?(?:\(\d{2}\)[ \t]*|\b\d{2}[ \t]+)(?:9\d{4}|\d{4})[- \t]?\d{4}\b/g, () => {
    maskedCount += 1;
    return '[TELEFONE REMOVIDO]';
  });
  text = text.replace(/(\b(?:tel(?:efone)?|cel(?:ular)?|fone|whatsapp)[ \t]*[:\-]?[ \t]*)[\d \t().+-]{8,18}/gi, (_m, prefix) => {
    maskedCount += 1;
    return `${prefix}[TELEFONE REMOVIDO]`;
  });

  return { sanitized: text, maskedCount };
};

export const escapeHtml = (input: string): string =>
  (input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Sanitização determinística unificada (espelho exato do servidor):
 * bloqueia todas as conjugações de "destravar", "eufuncional", "gargalo(s)" e enums internos em inglês.
 */
export const sanitizeForbiddenClinicalTerms = (rawText?: string): string => {
  if (!rawText) return '';
  return rawText
    .replace(/\bGargalos\b/g, 'Pontos limitantes')
    .replace(/\bgargalos\b/gi, 'pontos limitantes')
    .replace(/\bGargalo\b/g, 'Ponto limitante')
    .replace(/\bgargalo\b/gi, 'ponto limitante')
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
    .replace(/\bEufuncionais\b/g, 'Funcionalmente equilibrados')
    .replace(/\beufuncionais\b/gi, 'funcionalmente equilibrados')
    .replace(/\bEufuncional\b/g, 'Funcionalmente equilibrado')
    .replace(/\beufuncional\b/gi, 'funcionalmente equilibrado')
    .replace(/\bCRITICAL_LOW\b/g, 'Prioritário')
    .replace(/\bCRITICAL_HIGH\b/g, 'Prioritário')
    .replace(/\bCLINICAL_LOW\b/g, 'Prioritário')
    .replace(/\bCLINICAL_HIGH\b/g, 'Prioritário')
    .replace(/\bFUNCTIONAL_LOW\b/g, 'Atenção')
    .replace(/\bFUNCTIONAL_HIGH\b/g, 'Atenção')
    .replace(/\bSLIGHT_LOW\b/g, 'Atenção')
    .replace(/\bSLIGHT_HIGH\b/g, 'Atenção')
    .replace(/\bOPTIMIZED\b/g, 'Preservado')
    .replace(/\bUNKNOWN\b/g, 'Em análise')
    .trim();
};

/**
 * Sanitização voltada ao paciente (remove também expressões alarmistas).
 */
export const sanitizePatientFacingClinicalText = (rawText?: string): string => {
  return sanitizeForbiddenClinicalTerms(rawText)
    .replace(/\bcriticamente\s+baix([oa]s?)\b/gi, 'bem abaixo do ideal')
    .replace(/\bcriticamente\s+alt([oa]s?)\b/gi, 'bem acima do ideal')
    .replace(/\bdeficiência\s+crítica\b/gi, 'nível bem abaixo do ideal')
    .replace(/\bris[kc]o\s+crítico\b/gi, 'ponto prioritário de cuidado')
    .trim();
};

/**
 * Trunca texto falado respeitando sempre o término da última frase completa dentro do teto de palavras.
 */
export const truncateAtSentenceBoundary = (text: string, maxWords: number): string => {
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


