/**
 * Normalização determinística e canônica de nomes de exames e marcadores laboratoriais.
 * Compartilhada entre frontend (ExamRequest) e backend (server/gemini.ts) para garantir
 * consolidação consistente entre avaliações, bloqueio de janela biológica e deduplicação do carrinho.
 */

export const normalizeExamLookup = (value: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const normalizePlainText = (value: string): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Converte nomes vindos de laudos laboratoriais ou dos 18 grupos do Catálogo Oficial
 * em uma identidade canônica estável, sem colidir marcadores clinicamente distintos.
 */
export const canonicalizeExamIdentity = (rawName: string): string => {
  const norm = normalizeExamLookup(rawName);
  if (!norm) return '';

  // 1. Marcadores de ciclo longo (prioridade máxima de identificação)
  if (
    norm.includes('hba1c') ||
    norm.includes('hemoglobinaglicada') ||
    norm.includes('glicohemoglobina') ||
    norm === 'a1c'
  ) {
    return 'hba1c';
  }

  if (
    norm.includes('vitaminad') ||
    norm.includes('25oh') ||
    norm.includes('125oh') ||
    norm.includes('25hidroxi') ||
    norm.includes('calcitriol') ||
    norm.includes('calcidiol')
  ) {
    if (norm.includes('125') || norm.includes('calcitriol') || (norm.includes('ativa') && !norm.includes('semi'))) {
      return 'vitamina_d_125_oh';
    }
    return 'vitamina_d_25_oh';
  }

  if (norm.includes('ferritina')) {
    return 'ferritina';
  }

  // 2. Metabolismo do ferro (evitar colisão entre Ferro, Ferritina, Transferrina e IST)
  if (
    norm.includes('saturacaodetransferrina') ||
    norm.includes('saturacaotransferrina') ||
    norm.includes('indicedesaturacao') ||
    norm === 'ist'
  ) {
    return 'saturacao_transferrina';
  }
  if (norm === 'transferrina' || norm === 'transferrinaserica') {
    return 'transferrina';
  }
  if (norm === 'ferro' || norm === 'ferroserico' || norm === 'ferrosericofe' || norm === 'ferrofe') {
    return 'ferro_serico';
  }

  // 3. Inflamação
  if (norm.includes('pcrus') || norm.includes('proteinacreativa') || norm === 'pcr') {
    return 'pcr_us';
  }
  if (norm === 'vhs' || norm.includes('hemossedimentacao')) {
    return 'vhs';
  }

  // 4. Hemograma
  if (norm === 'hemograma' || norm === 'hemogramacompleto') {
    return 'hemograma_completo';
  }

  // 5. Perfil glicêmico
  if (
    norm === 'glicose' ||
    norm === 'glicosejejum' ||
    norm === 'glicoseemjejum' ||
    norm === 'glicemia' ||
    norm === 'glicemiajejum' ||
    norm === 'glicemiaemjejum' ||
    norm === 'glicemiadejejum'
  ) {
    return 'glicose_jejum';
  }
  if (
    norm === 'insulina' ||
    norm === 'insulinajejum' ||
    norm === 'insulinaemjejum' ||
    norm === 'insulinabasal' ||
    norm === 'insulinadejejum'
  ) {
    return 'insulina_jejum';
  }
  if (norm.includes('homair')) {
    return 'homa_ir';
  }
  if (norm.includes('homabeta') || norm === 'homab') {
    return 'homa_beta';
  }

  // 6. Função renal
  if (
    norm === 'creatinina' ||
    norm === 'creatininaserica' ||
    norm === 'creatininasericaetfg' ||
    norm === 'creatininaetfg' ||
    norm === 'creatininaerfg'
  ) {
    return 'creatinina_serica';
  }
  if (norm === 'ureia' || norm === 'ureiaserica') {
    return 'ureia_serica';
  }
  if (norm === 'acidourico' || norm === 'acidouricoserico') {
    return 'acido_urico';
  }

  // 7. Função hepática
  if (norm === 'tgo' || norm === 'ast' || norm === 'tgoast' || norm === 'asttgo' || norm.includes('aspartatoaminotransferase')) {
    return 'tgo_ast';
  }
  if (norm === 'tgp' || norm === 'alt' || norm === 'tgpalt' || norm === 'alttgp' || norm.includes('alaninaaminotransferase')) {
    return 'tgp_alt';
  }
  if (norm === 'gamagt' || norm === 'ggt' || norm === 'gamagtggt' || norm.includes('gamaglutamil')) {
    return 'gama_gt';
  }
  if (norm === 'fosfatasealcalina' || norm === 'fa') {
    return 'fosfatase_alcalina';
  }

  // 8. Perfil lipídico
  if (
    norm === 'colesteroltotalefracoes' ||
    norm === 'colesteroltotal' ||
    norm === 'colesteroltotalct' ||
    norm === 'perfillipidico'
  ) {
    return 'colesterol_total_fracoes';
  }
  if (norm === 'triglicerideos' || norm === 'triglicerides' || norm === 'triglicerideostg') {
    return 'triglicerideos';
  }

  // 9. Vitaminas e minerais
  if (
    norm.includes('vitaminab12') ||
    norm === 'b12' ||
    norm.includes('cobalamina') ||
    norm.includes('holotranscobalamina')
  ) {
    if (norm.includes('ativa') || norm.includes('holotrans')) {
      return 'vitamina_b12_ativa';
    }
    return 'vitamina_b12';
  }
  if (norm === 'acidofolico' || norm === 'folato' || norm === 'vitaminab9' || norm === 'acidofolicob9') {
    return 'acido_folico';
  }
  if (norm.includes('homocisteina')) {
    return 'homocisteina';
  }
  if (norm === 'magnesio' || norm === 'magnesioserico') {
    return 'magnesio_serico';
  }
  if (norm.includes('magnesio') && norm.includes('eritrocit')) {
    return 'magnesio_eritrocitario';
  }
  if (norm === 'zinco' || norm === 'zincoserico') {
    return 'zinco_serico';
  }
  if (norm.includes('zinco') && norm.includes('eritrocit')) {
    return 'zinco_eritrocitario';
  }
  if (norm === 'selenio' || norm === 'selenioserico') {
    return 'selenio_serico';
  }
  if (norm === 'cobre' || norm === 'cobreserico') {
    return 'cobre_serico';
  }
  if (norm === 'calciototal' || norm === 'calcio') {
    return 'calcio_total';
  }
  if (norm === 'calcioionico' || norm === 'calcioionizado') {
    return 'calcio_ionico';
  }

  // 10. Tireoide e hormônios
  if (norm === 'tsh' || norm === 'tshultrassensivel' || norm.includes('tireoestimulante')) {
    return 'tsh';
  }
  if (norm === 't4livre' || norm === 't4l' || norm.includes('tiroxinalivre')) {
    return 't4_livre';
  }
  if (norm === 't3livre' || norm === 't3l' || norm.includes('triiodotironinalivre')) {
    return 't3_livre';
  }
  if (norm === 't3reverso' || norm === 'rt3') {
    return 't3_reverso';
  }
  if (norm.includes('shbg')) {
    return 'shbg';
  }
  if (norm === 'testosteronatotal') {
    return 'testosterona_total';
  }
  if (norm === 'testosteronalivre') {
    return 'testosterona_livre';
  }
  if (norm === 'cortisol' || norm === 'cortisolbasal' || norm === 'cortisolmatinal' || norm === 'cortisolserico' || norm === 'cortisol8h') {
    return 'cortisol_basal';
  }

  return norm;
};

const LONG_CYCLE_CANONICAL_KEYS = new Set([
  'hba1c',
  'vitamina_d_25_oh',
  'vitamina_d_125_oh',
  'ferritina',
]);

/**
 * Identifica marcadores de ciclo biológico longo (janela mínima padrão de 60 dias):
 * Hemoglobina Glicada / HbA1c, Vitamina D e Ferritina.
 */
export const isLongCycleMarker = (rawName: string): boolean => {
  return LONG_CYCLE_CANONICAL_KEYS.has(canonicalizeExamIdentity(rawName));
};

/**
 * Verifica se o nutricionista pediu explicitamente monitoramento/reavaliação laboratorial
 * nas palavras-chave ou citou diretamente o marcador específico de ciclo longo.
 */
export const hasMonitoringOverride = (keywords: string, examName: string): boolean => {
  const plain = normalizePlainText(keywords);
  if (!plain) return false;

  // Intenção explícita de monitoramento/reteste
  const generalMonitoringRegex =
    /\b(monitorar|monitoramento|reavaliar|reavaliacao|retestar|reteste|repetir|repeticao|rechecagem|redosar|nova dosagem|acompanhamento laboratorial|controle laboratorial|revisao laboratorial)\b/i;
  if (generalMonitoringRegex.test(plain)) {
    return true;
  }

  // Menção nominal direta ao marcador específico nas palavras-chave
  const key = canonicalizeExamIdentity(examName);
  if (key === 'hba1c') {
    return /\b(hba1c|a1c|glicada|hemoglobina glicada|glicohemoglobina)\b/i.test(plain);
  }
  if (key === 'vitamina_d_25_oh' || key === 'vitamina_d_125_oh') {
    return /\b(vitamina\s*d|vit\s*d|25[\s-]?oh|1[,.]25[\s-]?oh|calcitriol|calcidiol)\b/i.test(plain);
  }
  if (key === 'ferritina') {
    return /\bferritina\b/i.test(plain);
  }

  return false;
};

/**
 * Detecta se um nome de marcador pertence ao núcleo do Hemograma Completo.
 */
export const isCoreHemogramMarker = (rawName: string): boolean => {
  const norm = normalizeExamLookup(rawName);
  if (!norm) return false;
  if (norm.includes('glicada') || norm.includes('hba1c')) return false;
  return (
    norm.includes('eritrocit') ||
    norm.includes('hemacia') ||
    norm === 'hemoglobina' ||
    norm === 'hemoglobinahb' ||
    norm.includes('hematocrito') ||
    norm.includes('leucocit') ||
    norm.includes('plaqueta') ||
    norm === 'vcm' ||
    norm === 'hcm' ||
    norm === 'chcm' ||
    norm === 'rdw' ||
    norm.includes('neutrofil') ||
    norm.includes('linfocit')
  );
};
