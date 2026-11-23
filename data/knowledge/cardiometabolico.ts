import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const cardiometabolicoKnowledge: Record<string, MarkerKnowledge> = {
  "Homocisteína": {
    ideal: "6,0 a 9,0 µmol/L",
    sinaisAltos: ["Disfunção endotelial", "Risco cardiovascular aumentado", "Tromboses recorrentes", "Declínio cognitivo", "Névoa mental (brain fog)", "Dores de cabeça frequentes", "Sintomas de depressão/ansiedade (por falha de metilação)"],
    sinaisBaixos: ["Baixa síntese de glutationa (homocisteína transulfura para glutationa; se muito baixa, pode indicar depleção de defesas antioxidantes)"],
    causasAltas: ["Deficiência de vitamina B12", "Deficiência de folato (vitamina B9)", "Deficiência de vitamina B6", "Mutação no gene MTHFR (C677T ou A1298C)", "Sedentarismo", "Consumo excessivo de café/álcool", "Doença renal crônica"],
    causasBaixas: ["Hipermetilação sistêmica (raro)", "Suplementação agressiva de doadores de metil (S-adenosilmetionina, trimetilglicina, metilfolato, metilcobalamina)"],
    interferentes: ["Uso recente de suplementos de vitaminas do complexo B (especialmente B12 e Folato)", "Consumo recente de café ou cigarro", "Jejum inadequado"]
  },
  "Relação PCR-us:Albumina": {
    ideal: "< 0,1",
    sinaisAltos: ["Inflamação sistêmica de baixo grau", "Disfunção endotelial", "Risco cardiovascular elevado", "Fadiga crônica", "Sarcopenia ou fraqueza muscular", "Resistência à insulina", "Processo infeccioso ou inflamatório ativo", "Névoa mental", "Recuperação tecidual lenta", "Dores articulares difusas"],
    sinaisBaixos: ["Geralmente indicativo de baixo nível inflamatório", "Boa reserva proteica visceral", "Preservação endotelial"],
    causasAltas: ["Elevação de PCR-us (infecção, inflamação, obesidade)", "Redução de albumina (hipoalbuminemia, desnutrição, doença hepática)", "Sedentarismo", "Estresse crônico", "Síndrome metabólica"],
    causasBaixas: ["Níveis ideais de PCR-us (< 1,0 mg/L)", "Boa síntese hepática de albumina", "Estilo de vida anti-inflamatório"],
    interferentes: ["Anti-inflamatórios ou corticosteroides", "Infecções agudas recentes", "Unidades de medida da albumina (g/dL vs g/L)"]
  },
  "Proteína C Reativa ultrassensível (PCR-us):Albumina": {
    ideal: "< 0,1",
    sinaisAltos: ["Inflamação sistêmica de baixo grau", "Disfunção endotelial", "Risco cardiovascular elevado", "Fadiga crônica", "Sarcopenia ou fraqueza muscular", "Resistência à insulina", "Processo infeccioso ou inflamatório ativo", "Névoa mental", "Recuperação tecidual lenta", "Dores articulares difusas"],
    sinaisBaixos: ["Geralmente indicativo de baixo nível inflamatório", "Boa reserva proteica visceral", "Preservação endotelial"],
    causasAltas: ["Elevação de PCR-us (infecção, inflamação, obesidade)", "Redução de albumina (hipoalbuminemia, desnutrição, doença hepática)", "Sedentarismo", "Estresse crônico", "Síndrome metabólica"],
    causasBaixas: ["Níveis ideais de PCR-us (< 1,0 mg/L)", "Boa síntese hepática de albumina", "Estilo de vida anti-inflamatório"],
    interferentes: ["Anti-inflamatórios ou corticosteroides", "Infecções agudas recentes", "Unidades de medida da albumina (g/dL vs g/L)"]
  },
  "Fibrinogênio": {
    ideal: "200 a 300 mg/dL",
    sinaisAltos: ["Sangue hipercoagulável", "Fadiga", "Dores articulares difusas", "Dores de cabeça", "Maior risco de eventos trombóticos (IAM, AVC, trombose venosa profunda)"],
    sinaisBaixos: ["Tendência a sangramentos prolongados", "Hematomas fáceis", "Dificuldade de cicatrização de feridas"],
    causasAltas: ["Inflamação crônica sistêmica de baixo grau", "Infecções agudas ou crônicas", "Obesidade e síndrome metabólica", "Tabagismo", "Gravidez", "Estresse severo"],
    causasBaixas: ["Insuficiência hepática crônica (síntese diminuída)", "Coagulação intravascular disseminada (CIVD - consumo)", "Desnutrição grave"],
    interferentes: ["Uso de anticoncepcionais orais (elevam)", "Uso de fibratos ou aspirina (podem reduzir)", "Processamento da amostra (deve ser colhida em citrato)"]
  },
  "D-dímero": {
    ideal: "< 250 ng/mL",
    sinaisAltos: ["Sinais de formação e lise de coágulos", "Dor e inchaço unilateral na panturrilha (TVP)", "Falta de ar aguda ou dor torácica (suspeita de TEP)", "Inflamação severa"],
    causasAltas: ["Trombose venosa profunda (TVP)", "Tromboembolismo pulmonar (TEP)", "Processos inflamatórios severos ou sepse", "Gravidez", "Pós-operatório recente", "Câncer ativo"],
    interferentes: ["Fator reumatoide positivo (pode causar falso alto)", "Hiperbilirrubinemia ou lipemia severa na amostra"]
  },
  "PCR-us": {
    ideal: "< 1,0 mg/L",
    sinaisAltos: ["Fadiga crônica", "Dores articulares generalizadas", "Rigidez matinal", "Distúrbios de sono", "Ganho de peso de difícil perda", "Névoa mental", "Sinais clínicos de inflamação de baixo grau"],
    causasAltas: ["Inflamação sistêmica de baixo grau", "Estilo de vida inflamatório (dieta rica em açúcares e ultraprocessados)", "Sedentarismo", "Estresse crônico", "Obesidade visceral", "Periodontite", "Disbiose intestinal", "Risco cardiovascular aumentado"],
    interferentes: ["Uso recente de anti-inflamatórios ou corticosteroides (reduzem falso)", "Infecções bacterianas ou virais agudas (elevam a níveis elevados de fase aguda, >10 mg/L)"]
  },
  "Proteína C Reativa ultrassensível (PCR-us)": {
    ideal: "< 1,0 mg/L",
    sinaisAltos: ["Fadiga crônica", "Dores articulares generalizadas", "Rigidez matinal", "Distúrbios de sono", "Ganho de peso de difícil perda", "Névoa mental", "Sinais clínicos de inflamação de baixo grau"],
    causasAltas: ["Inflamação sistêmica de baixo grau", "Estilo de vida inflamatório (dieta rica em açúcares e ultraprocessados)", "Sedentarismo", "Estresse crônico", "Obesidade visceral", "Periodontite", "Disbiose intestinal", "Risco cardiovascular aumentado"],
    interferentes: ["Uso recente de anti-inflamatórios ou corticosteroides (reduzem falso)", "Infecções bacterianas ou virais agudas (elevam a níveis elevados de fase aguda, >10 mg/L)"]
  },
  "Lp-PLA2": {
    ideal: "< 75 nmol/min/mL",
    sinaisAltos: ["Aterosclerose ativa instável", "Sinais de inflamação vascular", "Risco elevado de ruptura de placa aterosclerótica", "Fadiga sistêmica severa", "Comprometimento microvascular"],
    causasAltas: ["Inflamação específica da parede vascular mediada por macrófagos", "Disfunção endotelial progressiva", "Hipercolesterolemia refratária com alto estresse oxidativo"],
    interferentes: ["Uso de estatinas potentes (reduzem)", "Uso de inibidores da Lp-PLA2"]
  },
  "VHS": {
    ideal: "< 10 mm/h",
    sinaisAltos: ["Fadiga", "Dores articulares e musculares difusas", "Dores de cabeça", "Febre baixa recorrente", "Rigidez matinal sistêmica"],
    causasAltas: ["Doenças autoimunes ativas (artrite reumatoide, lúpus, polimialgia reumática)", "Infecções bacterianas crônicas ou agudas", "Inflamação sistêmica crônica de baixo grau", "Câncer / Mieloma", "Anemia"],
    causasBaixas: ["Policitemia", "Anemia falciforme", "Hipofibrinogenemia", "Insuficiência cardíaca congestiva"],
    interferentes: ["Gravidez (eleva)", "Anemia (eleva)", "Medicamentos anti-inflamatórios (reduzem)"]
  },
  "PCR Total": {
    ideal: "< 1,0 mg/L",
    sinaisAltos: ["Febre", "Dores corporais", "Fadiga extrema", "Sinais locais de infecção (calor, rubor, inchaço)", "Mal-estar geral"],
    causasAltas: ["Infecção bacteriana aguda ou sepse", "Trauma tecidual severo ou cirurgia recente", "Crises agudas de doenças autoimunes", "Infarto agudo do miocárdio"],
    interferentes: ["Anti-inflamatórios não esteroides (AINEs)", "Corticosteroides"]
  },
  "Malondialdeído": {
    ideal: "< 1,5 µmol/L (Otimizado)",
    sinaisAltos: ["Envelhecimento precoce da pele", "Fadiga crônica", "Dores articulares", "Disfunção mitocondrial", "Perda de memória e declínio cognitivo rápido (estresse oxidativo cerebral)"],
    causasAltas: ["Peroxidação lipídica sistêmica exacerbada", "Deficiência de enzimas antioxidantes endógenas (SOD, Catalase, GPx)", "Falta de antioxidantes dietéticos", "Consumo elevado de gorduras trans e frituras", "Exposição a toxinas ambientais e fumo"],
    interferentes: ["Suplementação recente com altas doses de vitamina C e E", "Exercício físico extenuante agudo logo antes da coleta"]
  },
  "Teste de Índice de Ômega-3 Eritrocitário": {
    ideal: "> 8% (Proporção Ômega-6:Ômega-3 eritrocitária entre 1:1 e 4:1)",
    sinaisAltos: ["Geralmente protetor contra arritmias e infarto", "Boa saúde cognitiva", "Baixa inflamação sistêmica"],
    sinaisBaixos: ["Risco cardiovascular aumentado", "Dores crônicas inflamatórias", "Olhos secos", "Pele descamativa e seca", "Dificuldade de concentração e déficit de atenção", "Transtornos de humor (ansiedade/depressão)"],
    causasBaixas: ["Baixo consumo alimentar de peixes de águas frias e profundas", "Ausência de suplementação de óleo de peixe de alta qualidade (EPA/DHA)", "Consumo excessivo de óleos vegetais de sementes (soja, milho, canola - ricos em ômega-6)"],
    interferentes: ["Suplementação recente com ômega-3 de baixa qualidade ou rançoso"]
  },
  "Ácido Metilmalônico (MMA)": {
    ideal: "< 150 nmol/L",
    sinaisAltos: ["Sintomas de deficiência de B12 a nível intracelular", "Formigamento e dormência nas mãos e pés (neuropatia)", "Brain fog severo", "Fadiga", "Alterações de marcha e equilíbrio", "Perda de memória"],
    sinaisBaixos: ["Níveis saudáveis indicando perfeita atividade intracelular de B12"],
    causasAltas: ["Deficiência funcional de Vitamina B12 (mesmo com B12 sérica aparentemente normal)", "Insuficiência renal (reduz clearance de MMA)", "Sibo (supercrescimento bacteriano produz MMA)"],
    interferentes: ["Insuficiência renal crônica", "Uso recente de cobalamina suplementar"]
  }
};
