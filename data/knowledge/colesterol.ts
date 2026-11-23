import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const colesterolKnowledge: Record<string, MarkerKnowledge> = {
  "Colesterol Total (CT)": {
    ideal: "<200 mg/dL",
    sinaisAltos: ["Xantomas tendinosos", "Xantelasmas", "Arco córneo", "Hipertensão", "Angina", "Disfunção erétil", "Câimbras nas pernas", "Fadiga", "Tontura", "Obesidade central"],
    sinaisBaixos: ["Depressão e ansiedade", "Comportamento agressivo", "Baixa libido", "Infertilidade", "Amenorreia", "Deficiência de vitaminas (A, D, E, K)", "Baixa imunidade", "Risco de AVC hemorrágico", "Problemas de memória", "Má absorção intestinal"],
    causasAltas: ["Dieta rica em gorduras trans/saturadas", "Hipotireoidismo", "Síndrome nefrótica", "Colestase", "Diabetes não controlado", "Obesidade", "Sedentarismo", "Tabagismo", "Hipercolesterolemia familiar", "Uso de anabolizantes"],
    causasBaixas: ["Desnutrição severa", "Má absorção intestinal", "Hipertireoidismo", "Doença hepática grave", "Anemia crônica", "Infecções agudas/Sepse", "Estresse físico extremo", "Câncer avançado", "Doença de Tangier", "Abetalipoproteinemia"],
    interferentes: ["Corticosteroides", "Estatinas", "Fibratos", "Anticoncepcionais", "Diuréticos", "Betabloqueadores", "Vitamina C", "Jejum", "Postura na coleta", "Estresse"]
  },
  "HDL Colesterol": {
    ideal: "Mulheres: 60 a 80 mg/dL | Homens: 35 a 70 mg/dL",
    sinaisAltos: ["Geralmente protetor", "Risco paradoxal se >90", "Fadiga", "Estresse oxidativo", "Autoimunidade", "Longevidade", "Vitalidade", "Resiliência", "Energia", "Vigor"],
    sinaisBaixos: ["Risco cardiovascular aumentado", "Síndrome metabólica", "Obesidade visceral", "Resistência à insulina", "Hipertensão", "Aterosclerose", "Inflamação crônica", "Fadiga", "Xantomas", "Histórico de infarto"],
    causasAltas: ["Genética", "Exercício aeróbico", "Álcool moderado", "Estrogênios", "Gorduras boas", "Perda de peso", "Niacina", "Deficiência de CETP", "Fibratos"],
    causasBaixas: ["Sedentarismo", "Obesidade", "Tabagismo", "Carboidratos refinados", "Diabetes Tipo 2", "Anabolizantes", "Betabloqueadores", "Hipertireoidismo", "Doença renal", "Hipoalfalipoproteinemia"],
    interferentes: ["Anabolizantes", "Betabloqueadores", "Progestágenos", "Tiazídicos", "Estatinas", "Fibratos", "Niacina", "Álcool", "Infecção", "Trauma"]
  },
  "HDL (Colesterol de Alta Densidade)": {
    ideal: "Mulheres: 60 a 80 mg/dL | Homens: 35 a 70 mg/dL",
    sinaisAltos: ["Geralmente protetor", "Risco paradoxal se >90", "Fadiga", "Estresse oxidativo", "Autoimunidade", "Longevidade", "Vitalidade", "Resiliência", "Energia", "Vigor"],
    sinaisBaixos: ["Risco cardiovascular aumentado", "Síndrome metabólica", "Obesidade visceral", "Resistência à insulina", "Hipertensão", "Aterosclerose", "Inflamação crônica", "Fadiga", "Xantomas", "Histórico de infarto"],
    causasAltas: ["Genética", "Exercício aeróbico", "Álcool moderado", "Estrogênios", "Gorduras boas", "Perda de peso", "Niacina", "Deficiência de CETP", "Fibratos"],
    causasBaixas: ["Sedentarismo", "Obesidade", "Tabagismo", "Carboidratos refinados", "Diabetes Tipo 2", "Anabolizantes", "Betabloqueadores", "Hipertireoidismo", "Doença renal", "Hipoalfalipoproteinemia"],
    interferentes: ["Anabolizantes", "Betabloqueadores", "Progestágenos", "Tiazídicos", "Estatinas", "Fibratos", "Niacina", "Álcool", "Infecção", "Trauma"]
  },
  "LDL Colesterol": {
    ideal: "Sem histórico de doenças: 80 a 120 mg/dL | Com histórico ou alto risco: 50 a 80 mg/dL",
    sinaisAltos: ["Xantomas", "Xantelasmas", "Angina pectoris", "Falta de ar", "Disfunção erétil", "Dor nas pernas", "AVC isquêmico", "Infarto", "Aterosclerose carotídea", "Hipertensão"],
    sinaisBaixos: ["Deficiência hormonal", "Déficit Vitamina D", "Baixa Vit E/A", "Depressão", "Ansiedade", "Agressividade", "Perda de memória", "Neuropatia", "Risco de infecções", "Baixa libido"],
    causasAltas: ["Dieta inflamatória", "Hipotireoidismo", "Resistência à insulina", "Doença renal", "Genética", "Sedentarismo", "Obesidade", "Diabetes", "Cushing", "Corticoides"],
    causasBaixas: ["Hipertireoidismo", "Doença hepática grave", "Desnutrição", "Má absorção", "Doença crítica", "Inflamação crônica", "Abetalipoproteinemia", "Câncer", "Estatinas", "Vegetarianismo"],
    interferentes: ["Corticosteroides", "Diuréticos", "Ciclosporina", "Estatinas", "Fibratos", "Niacina", "Colestiramina", "Ezetimiba", "Jejum", "Trauma"]
  },
  "LDL (Colesterol de Baixa Densidade)": {
    ideal: "Sem histórico de doenças: 80 a 120 mg/dL | Com histórico ou alto risco: 50 a 80 mg/dL",
    sinaisAltos: ["Xantomas", "Xantelasmas", "Angina pectoris", "Falta de ar", "Disfunção erétil", "Dor nas pernas", "AVC isquêmico", "Infarto", "Aterosclerose carotídea", "Hipertensão"],
    sinaisBaixos: ["Deficiência hormonal", "Déficit Vitamina D", "Baixa Vit E/A", "Depressão", "Ansiedade", "Agressividade", "Perda de memória", "Neuropatia", "Risco de infecções", "Baixa libido"],
    causasAltas: ["Dieta inflamatória", "Hipotireoidismo", "Resistência à insulina", "Doença renal", "Genética", "Sedentarismo", "Obesidade", "Diabetes", "Cushing", "Corticoides"],
    causasBaixas: ["Hipertireoidismo", "Doença hepática grave", "Desnutrição", "Má absorção", "Doença crítica", "Inflamação crônica", "Abetalipoproteinemia", "Câncer", "Estatinas", "Vegetarianismo"],
    interferentes: ["Corticosteroides", "Diuréticos", "Ciclosporina", "Estatinas", "Fibratos", "Niacina", "Colestiramina", "Ezetimiba", "Jejum", "Trauma"]
  },
  "Triglicerídeos (TG)": {
    ideal: "Ideal: <150 mg/dL | Funcional: <100 mg/dL",
    sinaisAltos: ["Gordura abdominal", "Esteatose", "Sangue viscoso", "Fadiga pós-refeição", "Dificuldade de emagrecer", "Xantomas eruptivos", "Pancreatite", "Alterações visuais", "Hipertensão", "Resistência à insulina"],
    sinaisBaixos: ["Baixa reserva de energia", "Hipoglicemia", "Fadiga", "Desnutrição", "Pele seca", "Frio constante", "Má absorção", "Perda muscular", "Imunidade baixa", "Autoimunidade"],
    causasAltas: ["Açúcar e farinhas", "Resistência à insulina", "Álcool", "Obesidade", "Hipotireoidismo", "Doença renal", "Sedentarismo", "Genética", "Uso de corticoides", "Estresse crônico"],
    causasBaixas: ["Low Carb/Cetogênica", "Desnutrição", "Hipertireoidismo", "Má absorção", "Doença Celíaca", "Cirrose", "Estatinas", "Autoimunidade", "Infecções crônicas", "Ascorbato"],
    interferentes: ["Álcool", "Refeição gordurosa", "Corticosteroides", "Estrogênios", "Betabloqueadores", "Retinoides", "Tiazídicos", "Fibratos", "Ômega-3", "Heparina"]
  },
  "Apo-A1": {
    ideal: "110 - 205 mg/dL",
    sinaisAltos: ["Normalmente protetor contra aterosclerose", "Indica transporte reverso eficiente"],
    sinaisBaixos: ["Aumento de risco cardiovascular", "Formação acelerada de ateromas", "Sedentarismo"],
    causasAltas: ["Genética", "Prática regular de exercícios aeróbicos", "Estrogênio", "Fibratos"],
    causasBaixas: ["Mutação genética", "Doença hepática obstrutiva", "Anabolizantes", "Deficiência de zinco/magnésio"],
    interferentes: ["Estatinas", "Beta-bloqueadores", "Estrogênio"]
  },
  "Apo-B": {
    ideal: "55 - 140 mg/dL (Otimizado: <80 mg/dL)",
    sinaisAltos: ["Angina", "Dor torácica", "Xantelasmas", "Aterosclerose precoce", "Pressão elevada"],
    sinaisBaixos: ["Raro; má absorção intestinal de gorduras", "Deficiência de vitaminas lipossolúveis"],
    causasAltas: ["Dieta ocidental rica em gorduras trans/açúcares", "Síndrome metabólica", "Resistência insulínica", "Hipotireoidismo", "Genética (hiperlipidemia familiar)"],
    causasBaixas: ["Desnutrição crônica", "Cirrose", "Hipotireoidismo active", "Abetalipoproteinemia"],
    interferentes: ["Estatinas", "Niacina", "Fibratos", "Esteroides"]
  },
  "Lipoproteína (a) [Lp(a)]": {
    ideal: "<20 mg/dL",
    sinaisAltos: ["Aterosclerose progressiva rápida", "Angina", "Estenose aórtica calcificada", "Episódios cardiovasculares recorrentes", "Trombofilia"],
    sinaisBaixos: ["Sem relevância clínica negativa"],
    causasAltas: ["Genética (herança do gene LPA)", "Doença renal crônica severa", "Hipotireoidismo grave"],
    causasBaixas: ["Herança genética"],
    interferentes: ["Niacina", "Inibidores de PCSK9", "Estrogênios"]
  },
  "LDL Oxidada": {
    ideal: "<0,3 (Razão LDL Oxidada/LDL-C)",
    sinaisAltos: ["Disfunção endotelial", "Dores articulares crônicas", "Envelhecimento tecidual rápido", "Fadiga crônica", "Aterosclerose ativa"],
    sinaisBaixos: ["Baixo estresse oxidativo endotelial", "Excelente capacidade de defesa antioxidante"],
    causasAltas: ["Frituras e óleos refinados aquecidos", "Tabagismo", "Glicação severa", "Exposição a toxinas metálicas", "Deficiência de vitamina E e C"],
    causasBaixas: ["Dieta rica em polifenóis", "Estilo de vida ativo", "Suplementação adequada de antioxidantes"],
    interferentes: ["Uso agudo de antioxidantes", "Processamento incorreto da amostra"]
  }
};
