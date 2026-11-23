import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const metabolismoKnowledge: Record<string, MarkerKnowledge> = {
  "Proteína C Reativa ultrassensível (PCR-us)": {
    ideal: "< 1,0 mg/L",
    sinaisAltos: ["Dor articular e muscular", "Fadiga crônica", "Risco cardiovascular", "Resistência à perda de peso", "Névoa mental", "Depressão", "Inchaço", "Vermelhidão", "Febre baixa", "Mal-estar geral"],
    causasAltas: ["Obesidade visceral", "Disbiose", "Infecções ocultas", "Dieta inflamatória", "Sedentarismo", "Estresse", "Autoimunes", "Tabagismo", "Privação de sono", "Diabetes"],
    interferentes: ["Treino intenso", "Trauma", "Infecção aguda", "Estatinas", "Anti-inflamatórios", "TRH oral", "Álcool", "Magnesio", "Vitamina C", "Perda de peso"]
  },
  "Homocisteína": {
    ideal: "6,0 a 9,0 µmol/L",
    sinaisAltos: ["Risco de trombose", "Enxaqueca", "Déficit cognitivo", "Depressão e ansiedade", "Fadiga", "Histórico de abortos", "Doença arterial", "Osteoporose", "Neuropatia", "Risco cardíaco"],
    causasAltas: ["Deficiência de B12", "Deficiência de Folato", "Deficiência de B6", "MTHFR", "Hipotireoidismo", "Doença renal", "Psoríase", "Tabagismo", "Café em excesso", "Dieta rica em metionina"],
    interferentes: ["Metotrexato", "Fenitoína", "Carbamazepina", "Teofilina", "Óxido nitroso", "L-Dopa", "Colestiramina", "Metformina", "NAC", "Betaína"]
  },
  "Glicose Jejum": {
    ideal: "70 a 100 mg/dL (Otimizado: 75 a 85 mg/dL)",
    sinaisAltos: ["Poliúria", "Polidipsia", "Perda de peso", "Cansaço", "Visão turva", "Fome excessiva", "Infecções frequentes", "Cicatrização lenta", "Pele seca", "Sonolência pós-prandial"],
    sinaisBaixos: ["Sudorese fria", "Tremores", "Palpitações", "Tontura", "Fome intensa", "Confusão mental", "Irritabilidade", "Visão embaçada", "Fraqueza", "Desmaio"],
    causasAltas: ["Diabetes", "Pré-diabetes", "Estresse agudo", "Cushing", "Acromegalia", "Feocromocitoma", "Hipertireoidismo", "Pancreatite", "Corticoides", "Obesidade"],
    causasBaixas: ["Insulinoma", "Excesso de medicação", "Insuficiência adrenal", "Hipotireoidismo"],
    interferentes: ["Corticosteroides", "Diuréticos", "Betabloqueadores", "Antipsicóticos", "Vitamina C", "Biotina", "Estresse", "Demora processar", "Cafeína", "Infecção"]
  },
  "Insulina Jejum": {
    ideal: "2 - 10 µU/mL",
    sinaisAltos: ["Dificuldade de emagrecer", "Acantose nigricans", "Fome constante", "Fadiga", "Brain fog", "Desejo por carboidratos", "Retenção de líquidos", "Hipertensão", "Acne", "SOP"],
    sinaisBaixos: ["Diabetes Tipo 1", "Exaustão pancreática", "Pancreatite", "Desnutrição", "Jejum extremo", "Perda de peso", "Cetoacidose", "Fraqueza", "Sede", "Urina frequente"],
    causasAltas: ["Resistência à Insulina", "Açúcar/Refinados", "Sedentarismo", "Obesidade visceral", "Estresse crônico", "Inflamação", "Insulinoma", "SOP", "Cushing", "Insulina exógena"],
    causasBaixas: ["Dano pancreático", "LADA", "Pancreatectomia", "Jejum prolongado", "Exercício intenso", "Fibrose cística", "Hemocromatose"],
    interferentes: ["Biotina", "Anticorpos anti-insulina", "Hemólise", "Metformina", "Glitazonas", "Corticosteroides", "Anticoncepcionais", "Gravidez", "Obesidade"]
  },
  "HbA1c": {
    ideal: "< 5,3%",
    sinaisAltos: ["Poliúria", "Fadiga crônica", "Visão turva", "Neuropatia", "Infecções de pele", "Cicatrização lenta", "Disfunção erétil", "Glicação", "Risco cardiovascular", "Candidíase"],
    causasAltas: ["Diabetes", "Resistência à insulina", "Obesidade", "Sedentarismo", "Carboidratos", "Hipotireoidismo", "Cushing", "SOP", "Corticoides"],
    interferentes: ["Anemia Ferropriva", "Anemia B12", "Hemoglobinopatias", "Esplenectomia", "Insuficiência renal", "Alcoolismo", "Aspirina", "Vitamina C", "Vitamina E", "Transfusão"]
  },
  "GGT": {
    ideal: "Inferior a 60 U/L",
    sinaisAltos: ["Sobrecarga tóxica", "Baixa glutationa", "Resistência à insulina", "Estresse oxidativo", "Inflamação hepática", "Risco CV", "Síndrome metabólica", "Fadiga", "Sensibilidade química", "Dificuldade detox"],
    causasAltas: ["Álcool", "Esteatose", "Toxinas/Pesticidas", "Medicamentos", "Obstrução biliar", "Diabetes", "Obesidade", "Insuficiência cardíaca", "Pancreatite", "Hepatites"],
    interferentes: ["Fenitoína", "Barbitúricos", "Paracetamol", "Anticoncepcionais", "Clofibrato", "Exercício", "Obesidade", "Tabagismo", "Idade"]
  },
  "Amilase": {
    ideal: "40 a 86 U/L",
    sinaisAltos: ["Dor abdominal superior severa (frequentemente irradiando para as costas)", "Náuseas e vômitos", "Perda de apetite", "Febre", "Pulso rápido (taquicardia)", "Inchaço ou sensibilidade abdominal", "Diarreia ou fezes gordurosas", "Dificuldade na digestão", "Fraqueza geral", "Sudorese fria"],
    sinaisBaixos: ["Fezes gordurosas ou mal digeridas", "Perda de peso involuntária", "Fraqueza física", "Gases e distensão abdominal pós-prandial", "Deficiência de vitaminas lipossolúveis (A, D, E, K)", "Fome excessiva", "Fadiga", "Redução da massa muscular", "Desnutrição sutil", "Digestão lenta"],
    causasAltas: ["Pancreatite aguda ou crônica", "Bloqueio do ducto pancreático", "Colecistite ou cálculos biliares", "Problemas nas glândulas salivares (caxumba, sialoadenite)", "Insuficiência renal (diminuição da depuração)", "Úlcera péptica perfurada", "Obstrução intestinal", "Gravidez ectópica", "Uso excessivo de álcool", "Trauma abdominal"],
    causasBaixas: ["Dano pancreático permanente (fibrose)", "Insuficiência pancreática exócrina", "Câncer de pâncreas em estágio avançado", "Fibrose cística", "Doença hepática grave (cirrose)", "Pré-eclâmpsia", "Desnutrição severa", "Terapia de reposição enzimática pancreática mal dosada"],
    interferentes: ["Uso de morfina e outros opiáceos (podem elevar)", "Anticoncepcionais orais", "Aspirina", "Corticosteroides", "Diuréticos tiazídicos", "Álcool", "Gravidez"]
  },
  "Lipase pancreática": {
    ideal: "20 a 50 U/L",
    sinaisAltos: ["Dor abdominal superior aguda (irradia para as costas)", "Náuseas e vômitos intensos", "Febre baixa", "Taquicardia", "Sensibilidade abdominal ao toque", "Perda de apetite", "Diarreia", "Fezes flutuantes ou gordurosas (esteatorreia)", "Desidratação", "Mal-estar geral"],
    sinaisBaixos: ["Fezes gordurosas, pálidas e com odor forte", "Perda de peso inexplicada", "Distensão abdominal e gases frequentes", "Deficiências de vitaminas lipossolúveis (A, D, E, K)", "Desnutrição", "Fraqueza física crônica", "Dificuldade na digestão de gorduras", "Fadiga", "Cãibras ou espasmos musculares", "Redução de massa magra"],
    causasAltas: ["Pancreatite aguda (elevação rápida e alta)", "Obstrução do ducto pancreático", "Câncer de pâncreas", "Insuficiência renal (excreção reduzida)", "Colecistite aguda", "Úlcera péptica perfurada ou obstrução intestinal", "Doença inflamatória intestinal", "Uso de opiáceos (espasmo do esfíncter de Oddi)", "Alcoolismo crônico", "Cálculos biliares"],
    causasBaixas: ["Destruição do tecido pancreático (pancreatite crônica em fase final)", "Fibrose cística", "Insuficiência pancreática exócrina", "Pancreatectomia (remoção cirúrgica do pâncreas)"],
    interferentes: ["Medicamentos como morfina, codeína e outros analgésicos narcóticos (elevam)", "Heparina", "Diuréticos de alça", "Anticoncepcionais orais", "Garroteamento prolongado na coleta"]
  },
  "Creatina Quinase": {
    ideal: "65,00 - 135,00 U/L",
    sinaisAltos: ["Dores musculares severas (mialgia)", "Fraqueza muscular generalizada ou localizada", "Urina escura (cor de chá/refrigerante de cola - mioglobinúria)", "Inchaço e sensibilidade nos músculos", "Cãibras intensas", "Rigidez muscular", "Fadiga extrema", "Dificuldade de locomoção", "Batimentos cardíacos irregulares", "Dores articulares"],
    sinaisBaixos: ["Redução da massa muscular magra (sarcopenia)", "Inatividade física prolongada ou repouso no leito", "Fraqueza muscular generalizada sutil", "Falta de tônus muscular", "Fadiga fácil sob esforço leve", "Dificuldade em ganhar massa magra"],
    causasAltas: ["Exercício físico extenuante ou novos estímulos de treino intenso", "Lesão muscular (trauma, esmagamento)", "Rabdomiólise", "Miopatias inflamatórias ou genéticas", "Injeções intramusculares recentes", "Uso de estatinas", "Uso de álcool ou drogas estimulantes", "Convulsões prolongadas", "Hipotireoidismo (eleva CK)", "Infecções virais agudas que causam miosite"],
    causasBaixas: ["Massa muscular muito baixa (desnutrição ou caquexia)", "Artrite reumatoide ativa", "Doença hepática grave", "Primeiro trimestre da gravidez", "Estilo de vida extremamente sedentário"],
    interferentes: ["Exercício físico intenso nas 48h anteriores à coleta (eleva fortemente)", "Injeções intramusculares recentes (elevam)", "Uso de estatinas ou fibratos", "Hemólise da amostra", "Uso de álcool antes do exame"]
  },
  "CK-MB": {
    ideal: "0 a 5 ng/mL",
    sinaisAltos: ["Dor ou aperto no peito (irradiando para braço ou mandíbula)", "Falta de ar (dispneia)", "Sudorese fria", "Palpitações cardíacas", "Tontura ou desmaio", "Náuseas e vômitos", "Fadiga extrema repentina", "Ansiedade extrema", "Pele pálida ou azulada", "Fraqueza muscular inexplicada"],
    causasAltas: ["Lesão do miocárdio (infarto agudo do miocárdio)", "Miocardite ou pericardite", "Trauma torácico (contusão cardíaca)", "Insuficiência renal (diminui a depuração)", "Exercício físico extremamente extenuante (maratonas, lesão muscular esquelética massiva também pode elevar CK-MB)", "Desfibrilação cardíaca recente", "Procedimentos cardíacos invasivos (angioplastia, cirurgia cardíaca)", "Distrofia muscular avançada"],
    interferentes: ["Lesão grave e massiva de músculos esqueléticos (pode causar falsa elevação por reação cruzada de isoformas)", "Hemólise da amostra", "Insuficiência renal crônica (eleva falsamente)", "Exercício de ultra-resistência recente"]
  }
};
