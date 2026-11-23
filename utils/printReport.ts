import { AnalysisStatus, ExamResult, Patient } from '../types';
import {
  PRINT_ASSETS,
  isMicronutrientExam,
  sortExamResults,
  escapeHtml,
  sanitizePatientFacingClinicalText,
} from '../utils';

export interface PrintPatientReportOptions {
  patient: Patient;
  results: ExamResult[];
  patientPrintableReport?: string;
  fallbackReportText?: string;
  patientRoutineSummary?: string;
  date?: string;
}

const formatPatientCleanMarker = (exam: ExamResult): string => {
  const name = (exam.testName || '').trim();
  const value = String(exam.value ?? '').trim();
  if (!value) return name;
  const unit = (exam.unit || '').trim();
  const isPercent = unit === '%' || value.endsWith('%');
  const cleanVal = value.replace(/%$/, '').trim();
  return isPercent ? `${name} ${cleanVal}%` : `${name} ${cleanVal}`;
};

const sanitizePrintText = (raw: string): string => {
  const withoutFollowUp = (raw || '')
    .replace(/###?\s*(?:Avaliação Orientativa de Investigação Complementar|Investigação Complementar Sugerida)[\s\S]*/i, '')
    .trim();
  return sanitizePatientFacingClinicalText(withoutFollowUp);
};

export const buildFallbackPatientPrintableReport = (
  patientRoutineSummary?: string,
  results: ExamResult[] = []
): string => {
  const cleanSummary = sanitizePrintText(patientRoutineSummary || '');

  if (results.length > 0) {
    const preserved = results.filter((r) => r.status === AnalysisStatus.OPTIMIZED);
    const attention = results.filter((r) => r.status !== AnalysisStatus.OPTIMIZED);
    const parts: string[] = [];

    if (preserved.length > 0) {
      const preservedLines = preserved
        .slice(0, 8)
        .map((r) => `- **${formatPatientCleanMarker(r)}:** dentro da faixa funcional esperada, sustentando o equilíbrio da sua rotina.`)
        .join('\n');
      parts.push(`### O que está favorável no seu organismo\n${preservedLines}`);
    }

    if (attention.length > 0) {
      const markerList = attention
        .slice(0, 6)
        .map((r) => formatPatientCleanMarker(r))
        .join(', ');
      const attentionBody =
        cleanSummary ||
        `Na revisão dos seus exames, há ${attention.length} marcador(es) com oportunidade de ajuste nutricional (${markerList}). Cuidar desses pontos favorece energia, disposição e constância nas suas tarefas do dia a dia.`;
      parts.push(`### Pontos de atenção na sua rotina\n${attentionBody}`);
    } else if (cleanSummary) {
      parts.push(`### Resumo do seu acompanhamento\n${cleanSummary}`);
    }

    parts.push(
      `### Direcionamento propositivo\nO planejamento nutricional direciona ajustes graduais e práticos para a sua rotina do dia a dia e suas tarefas, fortalecendo reservas e sustentando sua vitalidade com segurança.`
    );

    return sanitizePrintText(parts.join('\n\n'));
  }

  if (cleanSummary) {
    return `### Resumo do seu acompanhamento\n${cleanSummary}`;
  }

  return 'Relatório em fase de elaboração.';
};

const formatInlineMarkdownHtml = (escapedLine: string): string => {
  return escapedLine
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
};

const renderReportMarkdownToHtml = (rawText: string): string => {
  const cleaned = sanitizePrintText(rawText);
  if (!cleaned) return '<p>Relatório em fase de elaboração.</p>';

  const lines = cleaned.split('\n');
  const htmlBlocks: string[] = [];
  let inList = false;

  const closeListIfOpen = () => {
    if (inList) {
      htmlBlocks.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      closeListIfOpen();
      continue;
    }

    const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      closeListIfOpen();
      const titleHtml = formatInlineMarkdownHtml(escapeHtml(headingMatch[1]));
      htmlBlocks.push(`<h4 class="report-section-title">${titleHtml}</h4>`);
      continue;
    }

    const bulletMatch = trimmed.match(/^(?:[-*•])\s+(.+)$/);
    if (bulletMatch) {
      if (!inList) {
        htmlBlocks.push('<ul class="report-list">');
        inList = true;
      }
      const itemHtml = formatInlineMarkdownHtml(escapeHtml(bulletMatch[1]));
      htmlBlocks.push(`<li>${itemHtml}</li>`);
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+[º°.]?)\s+(.+)$/);
    if (numberedMatch) {
      closeListIfOpen();
      const numHtml = escapeHtml(numberedMatch[1]);
      const bodyHtml = formatInlineMarkdownHtml(escapeHtml(numberedMatch[2]));
      htmlBlocks.push(`<p class="report-numbered"><strong>${numHtml}</strong> ${bodyHtml}</p>`);
      continue;
    }

    closeListIfOpen();
    const paragraphHtml = formatInlineMarkdownHtml(escapeHtml(trimmed));
    htmlBlocks.push(`<p class="report-paragraph">${paragraphHtml}</p>`);
  }

  closeListIfOpen();
  return htmlBlocks.join('\n');
};

interface StatusStyle {
  symbol: string;
  label: string;
  bg: string;
  text: string;
  border: string;
}

const getPatientGeneralStatus = (status: AnalysisStatus): StatusStyle => {
  switch (status) {
    case AnalysisStatus.CRITICAL_HIGH:
      return { symbol: '↑↑', label: 'Prioritário (Acima)', bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' };
    case AnalysisStatus.CLINICAL_HIGH:
      return { symbol: '↑', label: 'Elevado (Acima)', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
    case AnalysisStatus.FUNCTIONAL_HIGH:
      return { symbol: '↗', label: 'Atenção (Acima)', bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' };
    case AnalysisStatus.OPTIMIZED:
      return { symbol: '↔', label: 'Alvo Ideal', bg: '#ecfdf5', text: '#047857', border: '#d1fae5' };
    case AnalysisStatus.FUNCTIONAL_LOW:
      return { symbol: '↘', label: 'Atenção (Abaixo)', bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' };
    case AnalysisStatus.CLINICAL_LOW:
      return { symbol: '↓', label: 'Abaixo do Ideal', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
    case AnalysisStatus.CRITICAL_LOW:
      return { symbol: '↓↓', label: 'Prioritário (Abaixo)', bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' };
    default:
      return { symbol: '•', label: 'Em Análise', bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
  }
};

const getPatientMicroStatus = (status: AnalysisStatus): StatusStyle => {
  switch (status) {
    case AnalysisStatus.CRITICAL_HIGH:
      return { symbol: '↑↑', label: 'Saturação Excedente', bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' };
    case AnalysisStatus.CLINICAL_HIGH:
      return { symbol: '↑', label: 'Reserva Elevada', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
    case AnalysisStatus.FUNCTIONAL_HIGH:
      return { symbol: '↗', label: 'Reserva Excedente', bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' };
    case AnalysisStatus.OPTIMIZED:
      return { symbol: '↔', label: 'Alvo Ideal', bg: '#ecfdf5', text: '#047857', border: '#d1fae5' };
    case AnalysisStatus.FUNCTIONAL_LOW:
      return { symbol: '↘', label: 'Atenção (Abaixo)', bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' };
    case AnalysisStatus.CLINICAL_LOW:
      return { symbol: '↓', label: 'Reserva Baixa', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
    case AnalysisStatus.CRITICAL_LOW:
      return { symbol: '↓↓', label: 'Prioritário (Abaixo)', bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' };
    default:
      return { symbol: '•', label: 'Em Análise', bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
  }
};

export const printPatientReport = ({
  patient,
  results,
  patientPrintableReport,
  patientRoutineSummary,
  date,
}: PrintPatientReportOptions): void => {
  const sortedForPrint = sortExamResults(results || []);
  const dateObj = date ? new Date(date) : new Date();
  const dateFormatted = isNaN(dateObj.getTime())
    ? new Date().toLocaleDateString('pt-BR')
    : dateObj.toLocaleDateString('pt-BR');

  const resolvedText =
    typeof patientPrintableReport === 'string' && patientPrintableReport.trim()
      ? patientPrintableReport.trim()
      : buildFallbackPatientPrintableReport(patientRoutineSummary, sortedForPrint);

  const reportHtml = renderReportMarkdownToHtml(resolvedText);
  const hasMicronutrients = sortedForPrint.some((exam) => isMicronutrientExam(exam));
  const legendStatuses = [
    AnalysisStatus.OPTIMIZED,
    AnalysisStatus.FUNCTIONAL_HIGH,
    AnalysisStatus.FUNCTIONAL_LOW,
    AnalysisStatus.CLINICAL_HIGH,
    AnalysisStatus.CLINICAL_LOW,
    AnalysisStatus.CRITICAL_HIGH,
    AnalysisStatus.CRITICAL_LOW,
  ];

  const rowsHtml = sortedForPrint
    .map((res) => {
      const isMicro = isMicronutrientExam(res);
      const st = isMicro ? getPatientMicroStatus(res.status) : getPatientGeneralStatus(res.status);
      return `
        <tr>
          <td class="col-name">
            <div class="exam-name">${escapeHtml(res.testName)}</div>
            <div class="exam-target">Faixa funcional: ${escapeHtml(res.referenceRange || '-')}</div>
          </td>
          <td class="col-value">
            <span class="val-num">${escapeHtml(String(res.value || '-'))}</span>
            <span class="val-unit">${escapeHtml(res.unit || '')}</span>
          </td>
          <td class="col-status">
            <span class="status-pill" style="background:${st.bg};color:${st.text};border:1px solid ${st.border};">
              <span class="status-symbol">${st.symbol}</span>
              <span>${escapeHtml(st.label)}</span>
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  const renderLegendGrid = (isMicro: boolean) =>
    legendStatuses
      .map((s) => {
        const st = isMicro ? getPatientMicroStatus(s) : getPatientGeneralStatus(s);
        return `
          <div class="legend-item">
            <span class="legend-badge" style="background:${st.bg};color:${st.text};border:1px solid ${st.border};">${st.symbol}</span>
            <span class="legend-label">${escapeHtml(st.label)}</span>
          </div>
        `;
      })
      .join('');

  const scopedCss = `
    @page { margin: 1.2cm; }
    #print-root * { box-sizing: border-box; }
    #print-root .page-wrap { max-width: 820px; margin: 0 auto; padding: 20px 24px 32px; }
    #print-root .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 22px;
      gap: 16px;
    }
    #print-root .header h1 { margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #0f172a; }
    #print-root .header .subtitle { margin: 3px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; }
    #print-root .header .resp { margin-top: 8px; font-size: 11px; color: #334155; line-height: 1.4; }
    #print-root .header .resp strong { color: #0f172a; text-transform: uppercase; }
    #print-root .header .date { margin-top: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
    #print-root .header img { height: 64px; max-width: 190px; object-fit: contain; }

    #print-root .patient-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    #print-root .patient-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; margin: 0 0 4px; }
    #print-root .patient-name { font-size: 17px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0; }
    #print-root .patient-age { font-size: 14px; font-weight: 700; color: #334155; margin: 0; text-align: right; }

    #print-root .section-heading {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin: 0 0 14px;
    }

    #print-root .report-body { font-size: 13px; line-height: 1.65; color: #334155; margin-bottom: 28px; }
    #print-root .report-section-title {
      font-size: 13px;
      font-weight: 800;
      color: #1e293b;
      margin: 16px 0 6px;
      padding-left: 10px;
      border-left: 3px solid #0284c7;
    }
    #print-root .report-section-title:first-child { margin-top: 0; }
    #print-root .report-paragraph { margin: 0 0 9px; text-align: justify; }
    #print-root .report-numbered { margin: 0 0 8px; text-align: justify; }
    #print-root .report-list { margin: 4px 0 10px; padding-left: 18px; list-style-type: disc; }
    #print-root .report-list li { margin-bottom: 5px; }

    #print-root .table-section { margin-top: 12px; page-break-before: auto; }
    #print-root table.results-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    #print-root table.results-table th {
      text-align: left;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
      background: #f8fafc;
    }
    #print-root table.results-table td {
      padding: 9px 10px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    #print-root .col-name { width: 52%; }
    #print-root .col-value { width: 20%; text-align: right; white-space: nowrap; }
    #print-root .col-status { width: 28%; text-align: right; white-space: nowrap; }
    #print-root th.col-value, #print-root th.col-status { text-align: right; }
    #print-root .exam-name { font-size: 12.5px; font-weight: 700; color: #0f172a; }
    #print-root .exam-target { font-size: 10px; color: #64748b; margin-top: 2px; }
    #print-root .val-num { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; font-weight: 800; color: #0f172a; }
    #print-root .val-unit { font-size: 10px; color: #64748b; margin-left: 3px; }
    #print-root .status-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      min-width: 138px;
    }
    #print-root .status-symbol { font-family: ui-monospace, monospace; font-size: 13px; font-weight: 900; }

    #print-root .legend-box {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 8px;
      break-inside: avoid;
    }
    #print-root .legend-subtitle { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 10px 0 8px; }
    #print-root .legend-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; }
    #print-root .legend-item { display: flex; align-items: center; gap: 8px; }
    #print-root .legend-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 22px;
      border-radius: 6px;
      font-family: ui-monospace, monospace;
      font-size: 13px;
      font-weight: 900;
      flex-shrink: 0;
    }
    #print-root .legend-label { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; }

    #print-root .footer-sign {
      margin-top: 28px;
      padding: 14px 18px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      break-inside: avoid;
    }
    #print-root .sign-block { font-size: 9px; color: #475569; line-height: 1.35; }
    #print-root .sign-block strong { color: #0f172a; font-size: 10.5px; text-transform: uppercase; display: block; }
    #print-root .sign-gov { display: flex; align-items: center; gap: 10px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 0 14px; }
    #print-root .sign-gov img { height: 28px; filter: grayscale(100%); opacity: 0.75; }
    #print-root .sign-hand { display: flex; align-items: center; gap: 10px; }
    #print-root .sign-hand img { height: 42px; object-fit: contain; }
    #print-root .disclaimer {
      margin-top: 12px;
      text-align: center;
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.45;
    }
  `;

  const printBodyHtml = `
    <div class="page-wrap">
      <div class="header">
        <div>
          <h1>Relatório de Acompanhamento Nutricional</h1>
          <p class="subtitle">Bioquímica e Metabologia Funcional</p>
          <div class="resp">
            <strong>Responsável Técnico: João Paulo Cecato</strong><br />
            Nutricionista Clínico Funcional | CRN-4 20100054
          </div>
          <div class="date">Data: ${escapeHtml(dateFormatted)}</div>
        </div>
        <img src="${PRINT_ASSETS.logo}" alt="Vittared" />
      </div>

      <div class="patient-card">
        <div>
          <p class="patient-label">Paciente</p>
          <h2 class="patient-name">${escapeHtml(patient.name)}</h2>
        </div>
        <div>
          <p class="patient-label" style="text-align:right;">Idade</p>
          <p class="patient-age">${escapeHtml(String(patient.age || '-'))} anos</p>
        </div>
      </div>

      <div>
        <h3 class="section-heading">I. Avaliação e Direcionamento Nutricional</h3>
        <div class="report-body">
          ${reportHtml}
        </div>
      </div>

      ${sortedForPrint.length > 0 ? `
      <div class="table-section">
        <h3 class="section-heading">II. Resumo dos Resultados Avaliados</h3>
        <table class="results-table">
          <thead>
            <tr>
              <th class="col-name">Marcador / Faixa Funcional</th>
              <th class="col-value">Resultado</th>
              <th class="col-status">Situação</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="legend-box">
        <h3 class="section-heading">III. Legenda de Referência Funcional</h3>
        <div class="legend-subtitle">1. Marcadores Metabólicos e Gerais</div>
        <div class="legend-grid">${renderLegendGrid(false)}</div>
        ${hasMicronutrients ? `
        <div class="legend-subtitle" style="margin-top:14px;">2. Vitaminas e Minerais</div>
        <div class="legend-grid">${renderLegendGrid(true)}</div>
        ` : ''}
      </div>
      ` : ''}

      <div class="footer-sign">
        <div class="sign-block">
          Documento Assinado Digitalmente
          <strong>João Paulo G. Cecato</strong>
          Hemo Labor Cloud
        </div>
        <div class="sign-gov">
          <img src="${PRINT_ASSETS.govbr}" alt="Gov.br" />
          <div class="sign-block">
            <strong>Autenticado</strong>
            Data: ${escapeHtml(dateFormatted)}
          </div>
        </div>
        <div class="sign-hand">
          <img src="${PRINT_ASSETS.signature}" alt="Assinatura" />
          <div class="sign-block">
            <strong>João Paulo Cecato</strong>
            Nutricionista | CRN-4 20100054
          </div>
        </div>
      </div>

      <p class="disclaimer">
        Relatório elaborado para suporte ao acompanhamento nutricional funcional. Não substitui avaliação ou diagnóstico médico.
      </p>
    </div>
  `;

  printHtmlDocument(printBodyHtml, `Relatório Nutricional - ${patient.name}`, scopedCss);
};

export const openHtmlBlobFallback = (fullHtmlDocument: string): void => {
  try {
    const blob = new Blob([fullHtmlDocument], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  } catch (err) {
    console.error('Erro ao abrir documento de impressão em nova guia via Blob:', err);
  }
};

export const printHtmlDocument = (
  htmlBody: string,
  title: string,
  scopedPrintCss: string = ''
): void => {
  const safeTitle = escapeHtml(title || 'Impressão Hemo Labor');
  const fullHtmlDocument = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    ${scopedPrintCss}
  </style>
</head>
<body>
  <div id="print-root">${htmlBody}</div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.print(); } catch (e) {}
      }, 300);
    });
  </script>
</body>
</html>`;

  triggerNativePrintWithFallback(htmlBody, scopedPrintCss, fullHtmlDocument);
};

export const triggerNativePrintWithFallback = (
  printRootInnerHtml: string,
  scopedPrintCss: string,
  fullHtmlDocument: string
): void => {
  if (typeof document === 'undefined') return;

  const cleanup = () => {
    const existingRoot = document.getElementById('print-root');
    if (existingRoot && existingRoot.parentNode) {
      existingRoot.parentNode.removeChild(existingRoot);
    }
    const existingStyle = document.getElementById('print-root-style');
    if (existingStyle && existingStyle.parentNode) {
      existingStyle.parentNode.removeChild(existingStyle);
    }
  };

  cleanup();

  const styleEl = document.createElement('style');
  styleEl.id = 'print-root-style';
  styleEl.textContent = `
    @media screen {
      #print-root {
        display: none !important;
      }
    }
    @media print {
      body > *:not(#print-root) {
        display: none !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-root {
        display: block !important;
        width: 100% !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
    }
    ${scopedPrintCss}
  `;
  document.head.appendChild(styleEl);

  const printRoot = document.createElement('div');
  printRoot.id = 'print-root';
  printRoot.innerHTML = printRootInnerHtml;
  document.body.appendChild(printRoot);

  let hasTriggered = false;
  let cleanupTimer: number | undefined;

  const handleAfterPrint = () => {
    if (cleanupTimer) window.clearTimeout(cleanupTimer);
    window.removeEventListener('afterprint', handleAfterPrint);
    cleanup();
  };

  const executePrint = () => {
    if (hasTriggered) return;
    hasTriggered = true;

    window.addEventListener('afterprint', handleAfterPrint, { once: true });
    cleanupTimer = window.setTimeout(() => {
      window.removeEventListener('afterprint', handleAfterPrint);
      cleanup();
    }, 15000);

    try {
      if (typeof window.print !== 'function') {
        throw new Error('window.print indisponível');
      }
      window.focus();
      window.print();
    } catch (err) {
      console.warn('Impressão direta bloqueada pelo ambiente, acionando contingência via Blob:', err);
      handleAfterPrint();
      openHtmlBlobFallback(fullHtmlDocument);
    }
  };

  const images = Array.from(printRoot.querySelectorAll('img'));
  if (images.length === 0) {
    window.setTimeout(executePrint, 120);
    return;
  }

  let pending = images.length;
  const onAssetDone = () => {
    pending -= 1;
    if (pending <= 0) {
      window.setTimeout(executePrint, 100);
    }
  };

  images.forEach((img) => {
    if (img.complete) {
      onAssetDone();
    } else {
      img.addEventListener('load', onAssetDone, { once: true });
      img.addEventListener('error', onAssetDone, { once: true });
    }
  });

  window.setTimeout(executePrint, 1200);
};

