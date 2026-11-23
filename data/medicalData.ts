export const EXAM_GROUPS = [
  {
    id: 'hemograma',
    title: '1. Hemograma e Séries',
    exams: [
      'Hemograma Completo',
      'Ferro sérico',
      'Ferritina',
      'Transferrina',
      'Índice de Saturação de Transferrina',
      'Capacidade Total de Ligação do Ferro',
      'Leucócitos (Glóbulos Brancos – WBC)',
      'Eritrócitos (Glóbulos Vermelhos – RBC)',
      'Hemoglobina (Hb)',
      'Hematócrito (Ht)',
      'Volume Corpuscular Médio (VCM)',
      'Hemoglobina Corpuscular Média (HCM)',
      'Concentração de Hemoglobina Corpuscular Média (CHCM)',
      'Amplitude de Distribuição Eritrocitária (RDW)',
      'Plaquetas',
      'Diferencial de Leucócitos',
      'Razão Neutrófilos:Linfócitos (RNL)',
      'Relação Monócito:Linfócito (MLR)',
      'Relação Plaqueta:Linfócito (PLR)',
      'Índice de Resposta Inflamatória Sistêmica (SIRI)',
      'Eosinófilos'
    ]
  },
  {
    id: 'tireoide',
    title: '2. Tireoide',
    exams: [
      'TSH',
      'T4 Total',
      'T4 Livre',
      'T3 Total',
      'T3 Livre',
      'T3 Reverso (rT3)',
      'Anti-tPO',
      'Razão T3 Livre : T3 Reverso (fT3 : rT3)',
      'T3 Livre / T4 Total'
    ]
  },
  {
    id: 'colesterol',
    title: '3. Colesterol e Lipídios',
    exams: [
      'Colesterol Total e Frações',
      'HDL Colesterol',
      'LDL Colesterol',
      'Triglicerídeos (TG)',
      'Apo-A1',
      'Apo-B',
      'Lipoproteína (a) [Lp(a)]',
      'LDL Oxidada',
      'Razão Colesterol Total:HDL (CT:HDL)',
      'Razão LDL:HDL',
      'Razão Triglicerídeos:HDL (TG:HDL)',
      'Razão LDL Oxidada:LDL-C',
      'Razão LDL Pequena e Densa:LDL-C',
      'Índice de Aterogenicidade de Plasma (AIP)',
      'Razão Apolipoproteína B:Apolipoproteína A1 (Apo-B:Apo-A1)',
      'Razão Ácido Úrico:HDL'
    ]
  },
  {
    id: 'figado',
    title: '4. Fígado',
    exams: [
      'ALT (TGP)',
      'AST (TGO)',
      'GGT',
      'Fosfatase Alcalina (FA)',
      'Bilirrubina Total e Frações',
      'Albumina Total e Frações',
      'Proteínas Totais',
      'Pré-albumina (Transtirretina)',
      'Proteína Ligadora de Retinol (RBP)',
      'Tempo de Protrombina (TP/INR)',
      'Relação AST:ALT',
      'Ultrassonografia de Abdome Superior',
      'Ácido Úrico',
      'Amônia',
      'Ureia'
    ]
  },
  {
    id: 'metabologia',
    title: '5. Metabologia',
    exams: [
      'Cortisol Sérico',
      'Cortisol Salivar - Amostra Manhã (07:00 e 09:00)',
      'Cortisol Salivar - Amostra Noite (23:00-24:00)',
      'Catecolaminas',
      'DHEA-S',
      'Testosterona Total',
      'Testosterona Livre',
      'SHBG',
      'Estradiol (E2)',
      'Progesterona',
      'IGF-1',
      'Lactato',
      'LDH (Lactato Desidrogenase)',
      'Eletroforese de Proteínas Séricas',
      'Amilase',
      'Lipase pancreática',
      'Creatina Quinase',
      'CK-MB',
      'Testosterona Livre e Biodisponível (Cálculo)'
    ]
  },
  {
    id: 'cardiometabolico',
    title: '6. Avaliação Cardiometabólica e Vascular',
    exams: [
      'Homocisteína',
      'Fibrinogênio',
      'D-dímero',
      'PCR-us',
      'Relação PCR-us:Albumina',
      'Lp-PLA2',
      'VHS',
      'Malondialdeído',
      'Teste de Índice de Ômega-3 Eritrocitário',
      'Ácido Metilmalônico (MMA)'
    ]
  },
  {
    id: 'glicemico',
    title: '7. Glicêmico e Insulina',
    exams: [
      'Glicose em jejum',
      'Insulina em jejum',
      'Hemoglobina Glicada (HbA1c)',
      'Curva Glicêmica (0, 60, 120 min)',
      'Curva Insulinêmica (0, 60, 120 min)',
      'Frutosamina',
      'Índice de Triglicerídeos-Glicose (TyG)',
      'HOMA-IR',
      'C-Peptídeo',
      'Adiponectina',
      'Leptina'
    ]
  },
  {
    id: 'minerais',
    title: '8. Minerais e Vitaminas',
    exams: [
      'Zinco',
      'Selênio',
      'Magnésio',
      'Cobre',
      'Cálcio iônico',
      'Cálcio Total',
      'Fósforo',
      'Potássio',
      'Sódio',
      'Cloro',
      'Cromo',
      'Alumínio',
      'Chumbo',
      'Vitamina A',
      'Vitamina C',
      'Vitamina D (ativa 1,25 OH)',
      'Vitamina D (semi ativa 25-OH)',
      'Vitamina E',
      'Vitamina B1 (Tiamina sérica)',
      'Vitamina B2 (Riboflavina)',
      'Vitamina B3 (Niacina)',
      'Vitamina B5 (Ácido Pantotênico)',
      'Vitamina B6',
      'Vitamina B7 (Biotina)',
      'Vitamina B12',
      'Ácido Fólico',
      'Folato Eritrocitário',
      'Manganês',
      'Molibdênio',
      'Mercúrio',
      'Ferro',
      'Magnésio Eritrocitário',
      'Zinco Eritrocitário',
      'Razão Cálcio:Fósforo',
      'Cálcio Corrigido pela Albumina',
      'Relação Albumina:Globulina',
      'Razão Zinco:Cobre',
      'Razão Sódio:Potássio'
    ]
  },
  {
    id: 'renal',
    title: '9. Avaliação Renal',
    exams: [
      'Creatinina Sérica + eTFG',
      'Cistatina C',
      'Ureia Sérica',
      'Bicarbonato (HCO3)',
      'Beta-2-Microglobulina Sérica',
      'Anion Gap',
      'CO2 Sérico',
      'Creatinina Urinária',
      'Microalbuminúria',
      'Proteinúria',
      'EAS (Urina Tipo 1)',
      'Osmolalidade Urinária',
      'Osmolalidade Plasmática',
      'Beta-2-Microglobulina Urinária',
      'Sódio Urinário (Na+)',
      'Potássio urinário',
      'Osmolaridade Sérica',
      'Relação Ureia:Creatinina (Sérica)'
    ]
  },
  {
    id: 'acido_base',
    title: '10. Avaliação Ácido-Base',
    exams: [
      'Gasometria arterial',
      'Eletrólitos (soro)'
    ]
  },
  {
    id: 'alergias',
    title: '11. Alergia Gluten',
    exams: [
      'IgA total',
      'Anti-Gliadina IgA/IgG (AGA)',
      'Anti-Transglutaminase IgA (tTG-IgA)',
      'Anti-Endomísio (EMA)'
    ]
  },
  {
    id: 'alergia_leite',
    title: '12. Alergia Leite',
    exams: [
      'IgE específico para Leite de Vaca',
      'IgE específico para Caseína'
    ]
  },
  {
    id: 'intestinal_urina',
    title: '13. Avaliação Intestinal',
    exams: [
      'Coprológico Funcional',
      'Calprotectina Fecal',
      'Lactoferrina Fecal',
      'α-1-Antitripsina Fecal',
      'Elastase Pancreática',
      'Sais Biliares Fecais',
      'Gorduras Fecais',
      'IgA Secretória Fecal',
      'Cultura de Fezes Ampliada',
      'Sangue Oculto'
    ]
  },

  // GRUPOS OPERACIONAIS (para solicitação rápida)

  {
    id: 'sarcopenia_muscular',
    title: '14. Sarcopenia Muscular',
    exams: [
      'Hemograma Completo',
      'Proteínas Totais',
      'Albumina Total e Frações',
      'Pré-albumina (Transtirretina)',
      'Eletroforese de Proteínas Séricas',
      'Creatinina Sérica + eTFG',
      'Cistatina C',
      'Ureia Sérica',
      'Creatina Quinase',
      'LDH (Lactato Desidrogenase)',
      'PCR-us',
      'Vitamina D (semi ativa 25-OH)',
      'Vitamina B12',
      'Ácido Fólico',
      'Folato Eritrocitário',
      'Zinco',
      'Magnésio',
      'Testosterona Total',
      'Testosterona Livre',
      'SHBG',
      'DHEA-S',
      'IGF-1'
    ]
  },
  {
    id: 'desnutricao',
    title: '15. Desnutrição',
    exams: [
      'Hemograma Completo',
      'Proteínas Totais',
      'Albumina Total e Frações',
      'Pré-albumina (Transtirretina)',
      'Eletroforese de Proteínas Séricas',
      'Proteína Ligadora de Retinol (RBP)',
      'Ferro sérico',
      'Ferritina',
      'Transferrina',
      'Índice de Saturação de Transferrina',
      'Capacidade Total de Ligação do Ferro',
      'Zinco',
      'Selênio',
      'Magnésio',
      'Vitamina D (semi ativa 25-OH)',
      'Vitamina B12',
      'Ácido Fólico',
      'Folato Eritrocitário',
      'Vitamina A',
      'Creatinina Sérica + eTFG',
      'Ureia Sérica',
      'PCR-us'
    ]
  },
  {
    id: 'desidratacao_osmolaridade',
    title: '16. Desidratação e Osmolaridade',
    exams: [
      'Hemograma Completo',
      'Sódio',
      'Potássio',
      'Cloro',
      'Bicarbonato (HCO3)',
      'Ureia Sérica',
      'Creatinina Sérica + eTFG',
      'Osmolalidade Plasmática',
      'Osmolalidade Urinária',
      'EAS (Urina Tipo 1)',
      'Sódio Urinário (Na+)',
      'Potássio urinário'
    ]
  },
  {
    id: 'inflamacao_intestinal',
    title: '17. Inflamação Intestinal',
    exams: [
      'Calprotectina Fecal',
      'Lactoferrina Fecal',
      'Coprológico Funcional',
      'Sangue Oculto',
      'IgA Secretória Fecal',
      'α-1-Antitripsina Fecal',
      'Cultura de Fezes Ampliada',
      'PCR-us',
      'VHS',
      'PCR Total',
      'IgA total',
      'Anti-Transglutaminase IgA (tTG-IgA)',
      'Anti-Endomísio (EMA)'
    ]
  },
  {
    id: 'ansiedade_depressao',
    title: '18. Ansiedade e Depressão',
    exams: [
      'Cortisol Sérico',
      'Cortisol Salivar (9:00 e 23:00 hrs)',
      'Catecolaminas',
      'DHEA-S',
      'TSH',
      'T4 Livre',
      'T3 Livre',
      'Vitamina D (semi ativa 25-OH)',
      'Vitamina B12',
      'Ácido Fólico',
      'Folato Eritrocitário',
      'Magnésio Eritrocitário',
      'Zinco',
      'Ferritina',
      'Homocisteína',
      'Ácido Metilmalônico (MMA)',
      'PCR-us',
      'Glicose em jejum',
      'Insulina em jejum',
      'Hemoglobina Glicada (HbA1c)'
    ]
  }
];
