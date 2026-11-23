import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const razoesKnowledge: Record<string, MarkerKnowledge> = {
  "Razão Colesterol Total:HDL (CT:HDL)": {
    ideal: "0.50 - 2.00",
    sinaisAltos: ["Fadiga sistêmica", "Acúmulo de gordura visceral", "Xantomas", "Hipertensão arterial", "Risco cardiovascular elevado", "Disfunção endotelial", "Declínio cognitivo associado à microvasculatura"],
    sinaisBaixos: ["Geralmente indicativo de baixo risco aterogênico", "Vitalidade adequada", "Boa resposta hemodinâmica"],
    causasAltas: ["Dieta rica em carboidratos refinados e gorduras trans", "Sedentarismo", "Tabagismo", "Obesidade", "Síndrome metabólica", "Estresse crônico (eixo HPA hiperativo)"],
    causasBaixas: ["Dieta equilibrada e rica em fitoquímicos", "Atividade física regular", "Genética favorável", "Uso de hipolipemiantes"],
    interferentes: ["Estatinas", "Fibratos", "Niacina", "Anticoncepcionais orais", "Álcool", "Terapia de reposição hormonal"]
  },
  "Razão LDL:HDL": {
    ideal: "Sem histórico cardiovascular: <3,0 | Com histórico ou alto risco: <2,0",
    sinaisAltos: ["Aterosclerose acelerada", "Placas carotídeas", "Disfunção erétil de origem vascular", "Falta de ar ao esforço", "Angina", "Xantelasmas", "Claudicação intermitente"],
    sinaisBaixos: ["Perfil lipídico protetor", "Baixo risco aterogênico", "Eficiência no transporte reverso de colesterol"],
    causasAltas: ["Dieta pró-inflamatória", "Sedentarismo", "Obesidade", "Hipotireoidismo", "Diabetes não compensado", "Estresse crônico e inflamação sistêmica de baixo grau"],
    causasBaixas: ["Estilo de vida ativo", "Alimentação rica em fibras solúveis e ômega-3", "Genética", "Uso de hipolipemiantes"],
    interferentes: ["Jejum inadequado", "Estatinas", "Ezetimiba", "Terapia de reposição hormonal", "Flutuações agudas de peso"]
  },
  "Razão Triglicerídeos:HDL (TG:HDL)": {
    ideal: "Mulheres: <1,0 | Homens: <1,5",
    sinaisAltos: ["Resistência à insulina", "Fadiga metabólica", "Acantose nigricans", "Compulsão por doces", "Dificuldade de emagrecimento", "Obesidade abdominal", "Esteatose hepática", "Hipertensão", "Letargia pós-prandial", "Aterosclerose subclínica"],
    sinaisBaixos: ["Alta sensibilidade à insulina", "Flexibilidade metabólica", "Boa oxidação lipídica", "Energia estável", "Fenótipo lipídico saudável"],
    causasAltas: ["Excesso de carboidratos refinados e frutose", "Sedentarismo", "Resistência à insulina", "Síndrome Metabólica", "Álcool", "Obesidade visceral", "Genética", "Uso de corticoides", "Hipotireoidismo", "SOP (Síndrome do Ovário Policístico)"],
    causasBaixas: ["Dieta com restrição de carboidratos (Low Carb/Cetogênica)", "Prática regular de exercícios de resistência", "Jejum intermitente", "Alto condicionamento físico cardiovascular", "Genética favorável"],
    interferentes: ["Consumo recente de carboidratos simples ou álcool", "Jejum inferior a 12 horas", "Uso de insulina", "Fibratos", "Ômega-3 em altas doses"]
  },
  "Razão LDL Oxidada:LDL-C": {
    ideal: "<0,3",
    sinaisAltos: ["Disfunção endotelial severa", "Inflamação sistêmica crônica", "Envelhecimento precoce", "Aterosclerose subclínica", "Fadiga crônica", "Dores articulares sistêmicas", "Disfunção mitocondrial"],
    sinaisBaixos: ["Baixo estresse oxidativo", "Boa capacidade antioxidante sistêmica", "Preservação endotelial"],
    causasAltas: ["Deficiência de antioxidantes na dieta", "Exposição crônica a toxinas ambientais", "Tabagismo", "Glicação exacerbada por excesso de açúcares", "Dietas ricas em gorduras oxidadas/frituras", "Deficiência de vias de detoxificação hepática"],
    causasBaixas: ["Dieta rica em fitoquímicos e polifenóis", "Manejo adequado do estresse físico e mental", "Otimização de vias antioxidantes endógenas (ex: Glutationa)"],
    interferentes: ["Uso recente de altas doses de antioxidantes isolados", "Infecções agudas", "Procedimentos invasivos", "Processamento e transporte inadequados da amostra de sangue"]
  },
  "Razão LDL Pequena e Densa:LDL-C": {
    ideal: "<0,1",
    sinaisAltos: ["Resistência insulínica", "Letargia pós-prandial", "Dificuldade de perda de peso", "Hipertensão", "Síndrome metabólica", "Formação acelerada de células espumosas (foam cells) no endotélio"],
    sinaisBaixos: ["Predominância de LDL grande e flutuante (Fenótipo A)", "Metabolismo glicídico eficiente", "Sensibilidade à insulina preservada"],
    causasAltas: ["Excesso de frutose dietética", "Hiperinsulinemia crônica", "Triglicerídeos elevados (favorece ação da CETP)", "Sedentarismo", "Deficiência de ômega-3", "Hipotireoidismo subjacente"],
    causasBaixas: ["Restrição de carboidratos refinados", "Aumento do gasto energético aeróbico", "Uso de fibratos ou ômega-3 em doses terapêuticas", "Alta ingestão de fibras"],
    interferentes: ["Variações glicêmicas e insulinêmicas agudas pré-exame", "Uso de niacina", "Amostra não centrifugada adequadamente", "Fibratos"]
  },
  "Índice de Aterogenicidade de Plasma (AIP)": {
    ideal: "Baixo Risco: <0,11 | Moderado Risco: 0,11 a 0,21 | Alto Risco: >0,21",
    sinaisAltos: ["Aterosclerose clinicamente silenciosa", "Disfunção endotelial progressiva", "Angina pectoris", "Claudicação intermitente", "Esteatose hepática não alcoólica (NAFLD)", "Resistência à insulina acentuada"],
    sinaisBaixos: ["Fenótipo Lipídico A (partículas grandes)", "Boa resposta circulatória", "Flexibilidade metabólica celular adequada", "Alta longevidade vascular"],
    causasAltas: ["Síndrome metabólica descompensada", "Obesidade visceral severa", "Diabetes tipo 2 não controlado", "Dietas hipercalóricas com presumível excesso de açúcar", "Sedentarismo"],
    causasBaixas: ["Adesão à Dieta do Mediterrâneo", "Atividade física regular", "Sensibilidade à insulina otimizada"],
    interferentes: ["Fibratos", "Altas doses de ômega-3", "Álcool", "Ausência de jejum"]
  },
  "Razão Apolipoproteína B:Apolipoproteína A1 (Apo-B:Apo-A1)": {
    ideal: "Homens: 0,7 a 0,85 | Mulheres: 0,6 a 0,80",
    sinaisAltos: ["Aterosclerose proeminente", "Eventos isquêmicos precoces (angina, IAM, AVC)", "Xantomas eruptivos", "Nefropatia isquêmica", "Retenção de lipoproteínas na íntima vascular"],
    sinaisBaixos: ["Efluxo de colesterol altamente eficiente", "Proteção cardiovascular primária robusta", "Alta longevidade", "Vitalidade tecidual e celular preservada"],
    causasAltas: ["Fatores genéticos (Hipercolesterolemia familiar)", "Dieta ocidental padrão altamente inflamatória", "Resistência à insulina", "Tabagismo", "Sedentarismo extremo", "Falha nos receptores hepáticos de depuração lipídica"],
    causasBaixas: ["Genética favorável", "Dieta rica em gorduras monoinsaturadas (azeite, abacate)", "Atividade física cardiovascular intensa", "Uso de inibidores de PCSK9 ou estatinas potentes"],
    interferentes: ["Estatinas de alta potência", "Terapia de reposição hormonal", "Disfunção hepática sintética (altera síntese direta de apolipoproteínas)", "Inibidores de PCSK9"]
  },
  "Razão Ácido Úrico:HDL": {
    ideal: "Saúde Otimizada (Geral): < 8,0 | Diabéticos: < 9,0 | Risco Cardiovascular: < 10,0",
    sinaisAltos: ["Dores articulares (gota)", "Cálculos renais", "Disfunção endotelial", "Hipertensão", "Arteriosclerose", "Síndrome metabólica central", "Resistência insulínica e letargia"],
    sinaisBaixos: ["Bom clearance renal", "Baixo estresse oxidativo intracelular", "Capacidade antioxidante preservada"],
    causasAltas: ["Metabolismo hepático de frutose dietética", "Purinas de carnes vermelhas e álcool", "Insuficiência renal leve", "Diuréticos tiazídicos", "Resistência insulínica", "Lise tumoral"],
    causasBaixas: ["Dieta equilibrada plant-based", "Alopurinol", "Genética"],
    interferentes: ["Diuréticos tiazídicos ou de alça", "Alopurinol", "Losartana", "Vitamina C", "Álcool", "Frutose"]
  },
  "Razão Zinco:Cobre": {
    ideal: "4,0 - 8,0",
    sinaisAltos: ["Possível deficiência relativa de cobre", "Estresse oxidativo aumentado", "Possível excesso de zinco suplementar sem balanceamento"],
    sinaisBaixos: ["Deficiência de zinco ou excesso de cobre", "Imunidade deprimida", "Fadiga crônica", "Queda de cabelo", "Estresse oxidativo"],
    causasAltas: ["Suplementação excessiva de zinco", "Deficiência de cobre na dieta"],
    causasBaixas: ["Uso de anticoncepcionais", "Estresse crônico", "Inflamação", "Exposição a metais pesados (cobre)", "Deficiência de zinco"],
    interferentes: ["Suplementação de zinco ou cobre", "Inflamação aguda"]
  },
  "Razão Cálcio:Fósforo": {
    ideal: "2,0 - 3,0",
    sinaisAltos: ["Desbalanço no metabolismo mineral ósseo", "Possível excesso de cálcio ou déficit de fósforo"],
    sinaisBaixos: ["Possível hiperfosfatemia ou déficit de cálcio", "Risco de desmineralização óssea"],
    causasAltas: ["Excesso de suplementação de cálcio", "Hiperparatireoidismo"],
    causasBaixas: ["Deficiência de vitamina D", "Dieta rica em fosfatos industrializados"],
    interferentes: ["Suplementos de cálcio", "Antiácidos", "Diuréticos"]
  },
  "Razão Sódio:Potássio": {
    ideal: "2,5 - 3,5",
    sinaisAltos: ["Retenção de líquidos", "Hipertensão arterial", "Excesso de sódio na dieta", "Baixo potássio intracelular"],
    sinaisBaixos: ["Possível depleção de sódio", "Cãibras", "Fadiga adrenal"],
    causasAltas: ["Dieta rica em alimentos ultraprocessados", "Baixo consumo de vegetais ricos em potássio"],
    causasBaixas: ["Uso excessivo de diuréticos", "Restrição severa de sal", "Baixa aldosterona"],
    interferentes: ["Diuréticos", "Corticosteroides", "Ingestão recente de sal"]
  },
  "Cálcio Corrigido pela Albumina": {
    ideal: "8,8 a 10,2 mg/dL",
    sinaisAltos: ["Hipercalcemia aparente ou real", "Excesso de cálcio carreador"],
    sinaisBaixos: ["Hipocalcemia por hipoalbuminemia", "Deficiência de cálcio iônico"],
    causasAltas: ["Suplementação excessiva", "Hiperparatireoidismo primário"],
    causasBaixas: ["Hipoalbuminemia", "Deficiência de vitamina D", "Má absorção"],
    interferentes: ["Níveis de albumina sérica", "pH sanguíneo"]
  },
  "Relação Albumina:Globulina": {
    ideal: "1,1 - 2,5",
    sinaisAltos: ["Desidratação", "Perda de globulinas"],
    sinaisBaixos: ["Inflamação crônica", "Infecção", "Doença autoimune", "Disfunção hepática", "Gamopatias"],
    causasAltas: ["Desidratação aguda"],
    causasBaixas: ["Aumento de imunoglobulinas na inflamação crônica", "Cirrose hepática"],
    interferentes: ["Inflamação aguda", "Gravidez"]
  },
  "Relação Ureia:Creatinina (Sérica)": {
    ideal: "10,00 a 16,00",
    sinaisAltos: ["Desidratação", "Sangramento gastrointestinal", "Dieta hiperproteica", "Uso de corticoides", "Insuficiência renal pré-renal"],
    sinaisBaixos: ["Desnutrição", "Doença hepática grave", "Dieta hipoproteica", "Gravidez", "Insuficiência renal intrínseca (tubular)"],
    causasAltas: ["Desidratação", "Hemorragia digestiva alta", "Catabolismo aumentado"],
    causasBaixas: ["Baixa ingesta proteica", "Insuficiência hepática"],
    interferentes: ["Diuréticos", "Corticosteroides", "Ingestão proteica recente"]
  },
  "Razão Neutrófilos:Linfócitos (RNL)": {
    ideal: "1,0 - 2,0 (Alerta > 3,0)",
    sinaisAltos: ["Inflamação sistêmica crônica", "Estresse fisiológico elevado", "Envelhecimento imunológico", "Risco cardiovascular aumentado", "Disfunção imune"],
    sinaisBaixos: ["Excelente equilíbrio imune", "Baixa inflamação sistêmica", "Boa imunidade adaptativa"],
    causasAltas: ["Estresse crônico", "Infecções crônicas de baixo grau", "Síndrome metabólica", "Uso de corticoides", "Tabagismo"],
    causasBaixas: ["Boa modulação imune", "Estilo de vida anti-inflamatório"],
    interferentes: ["Corticosteroides", "Infecções agudas recentes", "Exercício físico extenuante agudo"]
  },
  "Relação Monócito:Linfócito (MLR)": {
    ideal: "0,2 - 0,3",
    sinaisAltos: ["Inflamação crônica de baixo grau", "Ativação macrofágica", "Aterosclerose em curso", "Resistência insulínica"],
    sinaisBaixos: ["Homeostase imune inata/adaptativa preservada"],
    causasAltas: ["Estresse crônico", "Obesidade visceral", "Síndrome metabólica"],
    causasBaixas: ["Boa modulação imune"],
    interferentes: ["Infecções virais recentes", "Uso de imunomoduladores"]
  },
  "Relação Plaqueta:Linfócito (PLR)": {
    ideal: "Inferior a 150",
    sinaisAltos: ["Trombocitose reativa", "Inflamação sistêmica", "Estado pró-trombótico", "Estresse oxidativo"],
    sinaisBaixos: ["Equilibrio hemostático e imune adequado"],
    causasAltas: ["Inflamação crônica", "Anemia ferropriva", "Infecções", "Neoplasias"],
    causasBaixas: ["Uso de antiagregantes", "Baixa produção medular"],
    interferentes: ["Aspirina", "AINEs", "Infecções agudas"]
  },
  "Índice de Resposta Inflamatória Sistêmica (SIRI)": {
    ideal: "< 0,55 (Alvo Ideal: < 0,55 | Aceitável: 0,55 a 0,85 | Risco Elevado: > 1,0)",
    sinaisAltos: ["Inflamação sistêmica acentuada", "Predomínio da imunidade inata", "Estresse metabólico elevado", "Risco cardiovascular e metabólico"],
    sinaisBaixos: ["Equilíbrio imunológico ideal", "Baixo estresse inflamatório sistêmico"],
    causasAltas: ["Infecções crônicas", "Síndrome metabólica", "Obesidade", "Estresse crônico severo"],
    causasBaixas: ["Estilo de vida anti-inflamatório", "Boa resposta imune"],
    interferentes: ["Corticosteroides", "Infecções agudas", "Exercício extenuante"]
  },
  "Neutrófilos (absolutos) x Monócitos (absolutos) / Linfócitos (absolutos)": {
    ideal: "< 0,55 (Alvo Ideal: < 0,55 | Aceitável: 0,55 a 0,85 | Risco Elevado: > 1,0)",
    sinaisAltos: ["Inflamação sistêmica acentuada", "Predomínio da imunidade inata", "Estresse metabólico elevado", "Risco cardiovascular e metabólico"],
    sinaisBaixos: ["Equilíbrio imunológico ideal", "Baixo estresse inflamatório sistêmico"],
    causasAltas: ["Infecções crônicas", "Síndrome metabólica", "Obesidade", "Estresse crônico severo"],
    causasBaixas: ["Estilo de vida anti-inflamatório", "Boa resposta imune"],
    interferentes: ["Corticosteroides", "Infecções agudas", "Exercício extenuante"]
  },
  "Relação AST:ALT": {
    ideal: "< 0,8 (Idealmente entre 0,5 e 0,7)",
    sinaisAltos: ["Fibrose hepática", "Doença hepática alcoólica", "Cirrose", "Lesão mitocondrial severa", "Hemólise ou lesão cardíaca"],
    sinaisBaixos: ["Esteatose hepática não alcoólica (NAFLD/DHGNA)", "Boa função hepática geral"],
    causasAltas: ["Consumo excessivo de álcool", "Fibrose/cirrose avançada", "Hepatite crônica grave", "Lesão muscular"],
    causasBaixas: ["Esteatose hepática simples", "Resistência à insulina", "Obesidade"],
    interferentes: ["Exercício físico intenso recente", "Hepatotóxicos", "Álcool"]
  },
  "Índice de Triglicerídeos-Glicose (TyG)": {
    ideal: "< 4,5",
    sinaisAltos: ["Resistência à insulina acentuada", "Risco cardiovascular elevado", "Esteatose hepática", "Síndrome metabólica"],
    sinaisBaixos: ["Alta sensibilidade à insulina", "Excelente saúde metabólica"],
    causasAltas: ["Dieta rica em açúcares e carboidratos refinados", "Obesidade visceral", "Sedentarismo", "Genética"],
    causasBaixas: ["Dieta Low Carb / Cetogênica", "Exercício físico regular", "Sensibilidade insulínica preservada"],
    interferentes: ["Consumo recente de carboidratos", "Jejum inadequado", "Insulina exógena"]
  },
  "Razão T3 Livre : T3 Reverso (fT3 : rT3)": {
    ideal: ">20",
    sinaisAltos: ["Excelente eficiência de conversão e ação tireoidiana tecidual", "Boa vitalidade", "Metabolismo equilibrado"],
    sinaisBaixos: ["Resistência celular ao hormônio tireoidiano", "Metabolismo lento", "Dificuldade para perder peso", "Fadiga inexplicada", "Intolerância ao frio", "Retenção de líquidos", "Prisão de ventre", "Névoa mental", "Cabelos finos"],
    causasAltas: ["Níveis saudáveis de micronutrientes", "Manejo adequado do estresse", "Estilo de vida ativo"],
    causasBaixas: ["Estresse crônico (cortisol elevado)", "Deficiência de ferro, selênio e zinco", "Inflamação sistêmica (PCR alta)", "Restrição calórica ou dietas de fome", "Doenças crônicas do fígado ou rins"],
    interferentes: ["Qualquer interferente de T3 Livre ou T3 Reverso", "Uso de propranolol", "Corticosteroides"]
  },
  "Relação T3 Livre:T4 Total": {
    ideal: "0,25 a 0,35",
    sinaisAltos: ["Hipertireoidismo inicial ou compensatório", "Sudorese", "Palpitações", "Tremores"],
    sinaisBaixos: ["Conversão periférica deficiente de T4 para T3", "Hipotireoidismo subclínico", "Baixa biodisponibilidade tecidual"],
    causasAltas: ["Reposição excessiva de T3", "Estímulo tireoidiano agudo"],
    causasBaixas: ["Deficiência de selênio e zinco", "Estresse e cortisol elevado", "Inflamação sistêmica"],
    interferentes: ["Biotina", "Antitireoidianos", "Beta-bloqueadores"]
  }
};
