import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const hemogramaKnowledge: Record<string, MarkerKnowledge> = {
  "Leucócitos (Glóbulos Brancos – WBC)": {
    ideal: "4.000 a 7.000/mm³",
    sinaisAltos: ["Febre", "Calafrios", "Sudorese excessiva", "Fadiga generalizada", "Inflamação localizada", "Dor muscular", "Confusão mental", "Tosse persistente", "Dor abdominal", "Perda de apetite"],
    sinaisBaixos: ["Cansaço extremo", "Infecções frequentes", "Cicatrização lenta", "Febre de origem desconhecida", "Sudorese noturna", "Palidez", "Linfonodos inchados", "Perda de peso", "Sangramentos prolongados", "Dificuldade em combater infecções"],
    causasAltas: ["Infecções bacterianas", "Inflamação crônica", "Leucemias", "Uso de corticosteroides", "Estresse fisiológico", "Tabagismo", "Trauma", "Queimaduras", "Necrose tecidual", "Desidratação"],
    causasBaixas: ["Infecções virais", "Quimioterapia", "Doenças autoimunes", "Desnutrição", "Uso de medicamentos imunossupressores", "Aplasia medular", "Deficiência de B12 ou Folato", "Hiperesplenismo", "Exposição a benzeno", "Sepse grave"],
    interferentes: ["Corticosteroides (aumentam)", "Quimioterápicos (reduzem)", "Imunossupressores (reduzem)", "Lítio (aumenta)", "Beta-adrenérgicos (aumentam)"]
  },
  "Leucócitos Totais (WBC)": {
    ideal: "4.000 a 7.000/mm³",
    sinaisAltos: ["Febre", "Calafrios", "Sudorese excessiva", "Fadiga generalizada", "Inflamação localizada", "Dor muscular", "Confusão mental", "Tosse persistente", "Dor abdominal", "Perda de apetite"],
    sinaisBaixos: ["Cansaço extremo", "Infecções frequentes", "Cicatrização lenta", "Febre de origem desconhecida", "Sudorese noturna", "Palidez", "Linfonodos inchados", "Perda de peso", "Sangramentos prolongados", "Dificuldade em combater infecções"],
    causasAltas: ["Infecções bacterianas", "Inflamação crônica", "Leucemias", "Uso de corticosteroides", "Estresse fisiológico", "Tabagismo", "Trauma", "Queimaduras", "Necrose tecidual", "Desidratação"],
    causasBaixas: ["Infecções virais", "Quimioterapia", "Doenças autoimunes", "Desnutrição", "Uso de medicamentos imunossupressores", "Aplasia medular", "Deficiência de B12 ou Folato", "Hiperesplenismo", "Exposição a benzeno", "Sepse grave"],
    interferentes: ["Corticosteroides (aumentam)", "Quimioterápicos (reduzem)", "Imunossupressores (reduzem)", "Lítio (aumenta)", "Beta-adrenérgicos (aumentam)"]
  },
  "Eritrócitos (Glóbulos Vermelhos – RBC)": {
    ideal: "Homens: 4,5 a 6,0 milhões/mm³ | Mulheres: 4,2 a 5,5 milhões/mm³",
    sinaisAltos: ["Cansaço", "Dor de cabeça", "Tontura", "Rubor facial", "Coceira após banho quente", "Fraqueza muscular", "Dificuldade respiratória", "Visão embaçada", "Sangramento nasal", "Pressão arterial elevada"],
    sinaisBaixos: ["Fadiga extrema", "Palidez", "Falta de ar", "Fraqueza", "Tontura frequente", "Batimentos cardíacos acelerados", "Dor no peito", "Dor muscular", "Redução de tolerância ao exercício", "Sensação de frio constante"],
    causasAltas: ["Exposição a altas altitudes", "Policitemia vera", "Doenças pulmonares crônicas (ex.: enfisema)", "Desidratação severa", "Esteroides anabolizantes", "Tabagismo", "Apneia do sono", "Estresse crônico"],
    causasBaixas: ["Anemia ferropriva", "Hemorragia aguda ou crônica", "Deficiência de vitamina B12 ou ácido fólico", "Doenças renais crônicas", "Inflamação gastrointestinal com má absorção", "Hipotireoidismo", "Aplasia medular", "Hemólise"],
    interferentes: ["Eritropoetina, diuréticos (aumentam)", "Quimioterápicos, medicamentos anti-inflamatórios (reduzem)"]
  },
  "Hemoglobina (Hb)": {
    ideal: "Homens: 14,0 a 15,5 g/dL | Mulheres: 13,5 a 14,5 g/dL",
    sinaisAltos: ["Pele avermelhada", "Cansaço", "Dores de cabeça", "Coceira", "Alterações na visão", "Dormência ou formigamento", "Tontura", "Fraqueza muscular", "Fadiga leve", "Dificuldade respiratória"],
    sinaisBaixos: ["Fadiga intensa", "Palidez", "Tontura", "Dificuldade para respirar", "Sensação de fraqueza", "Redução de tolerância ao exercício", "Dor no peito", "Palpitações cardíacas", "Unhas quebradiças", "Sensação de frio constante"],
    causasAltas: ["Desidratação", "Policitemia vera", "Doenças pulmonares crônicas", "Insuficiência cardíaca", "Altitude elevada", "Uso de testosterona/andrógenos", "Tabagismo pesado"],
    causasBaixas: ["Anemia ferropriva", "Hemorragias", "Deficiência de B12 ou ácido fólico", "Inflamação crônica", "Insuficiência renal", "Hipotireoidismo", "Talassemia"],
    interferentes: ["Esteroides anabolizantes, eritropoetina (aumentam)", "Quimioterápicos, anti-inflamatórios (reduzem)"]
  },
  "Hematócrito (Ht)": {
    ideal: "Homens: 40,7 a 50,3% | Mulheres: 36,1 a 44,3%",
    sinaisAltos: ["Pele avermelhada", "Fadiga", "Tontura", "Dores de cabeça", "Coceira", "Dificuldade para respirar", "Dormência nas extremidades", "Visão embaçada", "Palpitações", "Pressão arterial elevada"],
    sinaisBaixos: ["Fadiga extrema", "Palidez", "Falta de ar", "Tontura", "Fraqueza", "Redução de tolerância ao exercício", "Dor no peito", "Palpitações cardíacas", "Mãos e pés frios", "Confusão mental"],
    causasAltas: ["Desidratação", "Policitemia vera", "Doenças pulmonares crônicas", "Insuficiência cardíaca", "Altitude elevada", "Apneia do sono", "Uso de testosterona"],
    causasBaixas: ["Anemia ferropriva", "Hemorragias", "Deficiência de B12 ou ácido fólico", "Inflamação crônica", "Doenças renais", "Hipotireoidismo", "Talassemia"],
    interferentes: ["Diuréticos, eritropoetina (aumentam)", "Quimioterápicos, medicamentos imunossupressores, anti-inflamatórios (reduzem)"]
  },
  "Volume Corpuscular Médio (VCM)": {
    ideal: "85 a 95 fL",
    sinaisAltos: ["Fadiga", "Palidez", "Tontura", "Falta de ar", "Memória prejudicada", "Dificuldade de concentração", "Formigamento nas extremidades", "Pernas inquietas", "Confusão mental", "Fraqueza muscular"],
    sinaisBaixos: ["Palidez", "Fadiga", "Tontura", "Falta de ar", "Taquicardia", "Mãos e pés frios", "Dor de cabeça frequente", "Falta de apetite", "Unhas quebradiças", "Redução de tolerância ao exercício"],
    causasAltas: ["Deficiência de vitamina B12", "Deficiência de ácido fólico", "Consumo excessivo de álcool", "Doenças hepáticas", "Medicamentos que interferem na síntese de DNA (quimioterápicos)", "Hipotiroidismo", "Doenças autoimunes", "Inflamação crônica", "Anemias megaloblásticas", "Exposição a toxinas ambientais"],
    causasBaixas: ["Deficiência de ferro", "Deficiência de zinco", "Deficiência de vitamina A", "Deficiência de vitamina C", "Deficiência de vitamina B2", "Talassemia", "Intoxicação por metais pesados", "Doenças inflamatórias crônicas", "Sangramento crônico (ex.: gastrointestinal)", "Infecções recorrentes"],
    interferentes: ["Hidroxiureia, metotrexato (aumentam)", "Antiácidos, inibidores da bomba de prótons, aspirina em uso prolongado (reduzem)"]
  },
  "VCM (MCV)": {
    ideal: "85 a 95 fL",
    sinaisAltos: ["Fadiga", "Palidez", "Tontura", "Falta de ar", "Memória prejudicada", "Dificuldade de concentração", "Formigamento nas extremidades", "Pernas inquietas", "Confusão mental", "Fraqueza muscular"],
    sinaisBaixos: ["Palidez", "Fadiga", "Tontura", "Falta de ar", "Taquicardia", "Mãos e pés frios", "Dor de cabeça frequente", "Falta de apetite", "Unhas quebradiças", "Redução de tolerância ao exercício"],
    causasAltas: ["Deficiência de vitamina B12", "Deficiência de ácido fólico", "Consumo excessivo de álcool", "Doenças hepáticas", "Medicamentos que interferem na síntese de DNA (quimioterápicos)", "Hipotiroidismo", "Doenças autoimunes", "Inflamação crônica", "Anemias megaloblásticas", "Exposição a toxinas ambientais"],
    causasBaixas: ["Deficiência de ferro", "Deficiência de zinco", "Deficiência de vitamina A", "Deficiência de vitamina C", "Deficiência de vitamina B2", "Talassemia", "Intoxicação por metais pesados", "Doenças inflamatórias crônicas", "Sangramento crônico (ex.: gastrointestinal)", "Infecções recorrentes"],
    interferentes: ["Hidroxiureia, metotrexato (aumentam)", "Antiácidos, inibidores da bomba de prótons, aspirina em uso prolongado (reduzem)"]
  },
  "Hemoglobina Corpuscular Média (HCM)": {
    ideal: "27,5 a 33 pg",
    sinaisAltos: ["Fadiga", "Palidez", "Tontura", "Dificuldade de concentração", "Memória prejudicada", "Pele seca", "Formigamento nas extremidades", "Dificuldade para respirar durante esforço", "Confusão mental", "Fraqueza muscular"],
    sinaisBaixos: ["Fadiga", "Palidez", "Falta de ar", "Unhas quebradiças", "Tontura", "Dor de cabeça frequente", "Mãos e pés frios", "Falta de apetite", "Redução na tolerância ao exercício", "Cabelos fracos ou caindo"],
    causasAltas: ["Anemias macrocíticas (B12 e ácido fólico)", "Desidratação", "Doenças hepáticas", "Exposição crônica a álcool", "Medicamentos que afetam a síntese de DNA (quimioterápicos)", "Hipotiroidismo", "Esferocitose hereditária", "Anemia hemolítica", "Inflamação crônica", "Excesso de suplementação de folato"],
    causasBaixas: ["Deficiência de ferro", "Deficiência de vitamina A", "Deficiência de zinco", "Doenças inflamatórias crônicas", "Intoxicação por metais pesados", "Talassemia", "Deficiência de vitamina C", "Exposição ambiental prolongada a agentes tóxicos", "Doenças renais crônicas", "Infecções de longa duração"],
    interferentes: ["Hidroxiureia, álcool crônico (aumentam)", "Antiácidos, suplementos de cálcio em excesso, inibidores da bomba de prótons (reduzem)"]
  },
  "Concentração de Hemoglobina Corpuscular Média (CHCM)": {
    ideal: "32 a 36 g/dL",
    sinaisAltos: ["Pele seca", "Olhos ressecados", "Confusão mental", "Tontura", "Fadiga", "Boca seca", "Memória prejudicada", "Pulsação elevada", "Cãibras musculares", "Dor de cabeça"],
    sinaisBaixos: ["Fadiga", "Palidez", "Fraqueza muscular", "Unhas quebradiças", "Tontura", "Sensação de frio constante", "Falta de ar ao esforço", "Cabelos quebradiços", "Dor no peito em esforço", "Redução na capacidade física"],
    causasAltas: ["Esferocitose hereditária", "Desidratação severa", "Anemia hemolítica", "Doenças autoimunes", "Inflamação crônica", "Deficiência de vitamina E", "Queimaduras graves", "Doenças renais avançadas", "Medicamentos imunossupressores", "Excesso de hemoglobina instável"],
    causasBaixas: ["Deficiência de ferro", "Doenças inflamatórias crônicas", "Talassemia", "Intoxicação por chumbo", "Deficiência de zinco", "Infecções crônicas", "Doenças renais crônicas", "Deficiência de vitamina C", "Doenças hematológicas genéticas", "Má absorção intestinal"],
    interferentes: ["Corticosteroides, diuréticos em excesso (aumentam)", "Antiácidos, suplementos de cálcio em altas doses, inibidores da absorção de ferro (reduzem)"]
  },
  "Amplitude de Distribuição Eritrocitária (RDW)": {
    ideal: "11 a 13%",
    sinaisAltos: ["Fadiga", "Palidez", "Tontura", "Fraqueza muscular", "Memória prejudicada", "Dificuldade de concentração", "Irritabilidade", "Sensação de frio constante", "Falta de ar ao esforço", "Unhas quebradiças"],
    sinaisBaixos: ["Geralmente assintomático"],
    causasAltas: ["Anemia ferropriva", "Anemia megaloblástica (deficiência de B12 e ácido fólico)", "Doenças inflamatórias crônicas", "Anemia hemolítica", "Deficiência de vitamina A", "Intoxicação por metais pesados", "Doenças renais crônicas", "Deficiência de zinco", "Infecções prolongadas", "Doenças hepáticas crônicas"],
    causasBaixas: ["Ausência de significado clínico"],
    interferentes: ["Agentes quimioterápicos, medicamentos imunossupressores (aumentam)", "Suplementação inadequada de ferro, ácido fólico ou vitamina B12 se corrigida (reduzem)"]
  },
  "RDW": {
    ideal: "11 a 13%",
    sinaisAltos: ["Fadiga", "Palidez", "Tontura", "Fraqueza muscular", "Memória prejudicada", "Dificuldade de concentração", "Irritabilidade", "Sensação de frio constante", "Falta de ar ao esforço", "Unhas quebradiças"],
    sinaisBaixos: ["Geralmente assintomático"],
    causasAltas: ["Anemia ferropriva", "Anemia megaloblástica (deficiência de B12 e ácido fólico)", "Doenças inflamatórias crônicas", "Anemia hemolítica", "Deficiência de vitamina A", "Intoxicação por metais pesados", "Doenças renais crônicas", "Deficiência de zinco", "Infecções prolongadas", "Doenças hepáticas crônicas"],
    causasBaixas: ["Ausência de significado clínico"],
    interferentes: ["Agentes quimioterápicos, medicamentos imunossupressores (aumentam)", "Suplementação inadequada de ferro, ácido fólico ou vitamina B12 se corrigida (reduzem)"]
  },
  "Plaquetas (Trombócitos)": {
    ideal: "150.000 a 350.000/mm³",
    sinaisAltos: ["Formação de coágulos", "Vermelhidão ou calor em extremidades", "Dor de cabeça", "Tontura", "Visão turva", "Formigamento nas mãos ou pés", "Dor torácica", "Fadiga", "Hipertensão arterial", "Palpitações"],
    sinaisBaixos: ["Sangramentos nas gengivas", "Hematomas frequentes", "Sangramentos nasais", "Sangue nas fezes", "Menstruações prolongadas", "Petéquias (manchas vermelhas na pele)", "Cansaço extremo", "Tontura", "Palidez", "Fraqueza"],
    causasAltas: ["Inflamações crônicas (artrite reumatoide, doenças autoimunes)", "Infecção aguda", "Gravidez", "Deficiência de ferro", "Esplenectomia", "Policitemia vera", "Doenças mieloproliferativas", "Anemia hemolítica", "Uso de corticosteroides", "Trauma recente"],
    causasBaixas: ["Trombocitopenia imunomediada", "Doenças autoimunes (lúpus eritematoso sistêmico)", "Infecções virais (dengue, HIV)", "Quimioterapia", "Doenças hepáticas (cirrose)", "Deficiência de vitamina B12 ou folato", "Hemorragia maciça", "Síndrome mielodisplásica", "Uso de medicamentos (heparina)", "Hiperesplenismo"],
    interferentes: ["Corticosteroides, epinefrina, eritropoetina (aumentam)", "Heparina, quimioterápicos, medicamentos imunossupressores, antibióticos como sulfas (reduzem)"]
  },
  "Plaquetas": {
    ideal: "150.000 a 350.000/mm³",
    sinaisAltos: ["Formação de coágulos", "Vermelhidão ou calor em extremidades", "Dor de cabeça", "Tontura", "Visão turva", "Formigamento nas mãos ou pés", "Dor torácica", "Fadiga", "Hipertensão arterial", "Palpitações"],
    sinaisBaixos: ["Sangramentos nas gengivas", "Hematomas frequentes", "Sangramentos nasais", "Sangue nas fezes", "Menstruações prolongadas", "Petéquias (manchas vermelhas na pele)", "Cansaço extremo", "Tontura", "Palidez", "Fraqueza"],
    causasAltas: ["Inflamações crônicas (artrite reumatoide, doenças autoimunes)", "Infecção aguda", "Gravidez", "Deficiência de ferro", "Esplenectomia", "Policitemia vera", "Doenças mieloproliferativas", "Anemia hemolítica", "Uso de corticosteroides", "Trauma recente"],
    causasBaixas: ["Trombocitopenia imunomediada", "Doenças autoimunes (lúpus eritematoso sistêmico)", "Infecções virais (dengue, HIV)", "Quimioterapia", "Doenças hepáticas (cirrose)", "Deficiência de vitamina B12 ou folato", "Hemorragia maciça", "Síndrome mielodisplásica", "Uso de medicamentos (heparina)", "Hiperesplenismo"],
    interferentes: ["Corticosteroides, epinefrina, eritropoetina (aumentam)", "Heparina, quimioterápicos, medicamentos imunossupressores, antibióticos como sulfas (reduzem)"]
  },
  "Diferencial de Leucócitos": {
    ideal: "Neutrófilos: 40 a 60% | Linfócitos: 25 a 40% | Monócitos: 1 a 7% | Eosinófilos: 0 a 3% | Basófilos: 0 a 3%",
    sinaisAltos: ["Febre", "Linfadenopatia", "Erupções cutâneas", "Dores articulares", "Prurido", "Irritação ocular", "Urticária", "Fadiga", "Dificuldade respiratória", "Hipotensão"],
    sinaisBaixos: ["Maior suscetibilidade a infecções bacterianas ou virais", "Febre recorrente", "Úlceras orais", "Cicatrização lenta", "Cansaço extremo", "Dermatite", "Fraqueza muscular", "Perda de peso", "Falta de ar", "Apatia"],
    causasAltas: ["Infecções bacterianas ou virais", "Processos alérgicos", "Infecções parasitárias", "Doenças inflamatórias", "Doenças mieloproliferativas"],
    causasBaixas: ["Quimioterapia", "Uso crônico de corticosteroides", "Imunossupressores", "HIV/AIDS", "Doenças autoimunes"],
    interferentes: ["Corticosteroides, adrenalina (aumentam)", "Quimioterápicos, imunossupressores (reduzem)"]
  },

  "Eosinófilos": {
    ideal: "0,00 a 3,00%",
    sinaisAltos: ["Coceira na pele", "Urticária ou erupções cutâneas", "Coriza ou congestão nasal", "Olhos lacrimejantes", "Sintomas de asma ou sibilância", "Desconforto digestivo", "Tosse seca", "Inchaço localizado", "Fadiga", "Irritabilidade"],
    sinaisBaixos: ["Ausência de processo alérgico active", "Boa homeostase e tolerância imunológica"],
    causasAltas: ["Processos alérgicos (rinite, asma, dermatite)", "Infecções parasitárias (helmintos/vermes)", "Reações de hipersensibilidade a medicamentos", "Doenças inflamatórias intestinais", "Síndrome hipereosinofílica", "Doenças autoimunes na fase ativa"],
    causasBaixas: ["Resposta ao estresse agudo", "Uso recente de corticosteroides", "Infecções bacterianas agudas (fase inicial)", "Uso de imunossupressores"],
    interferentes: ["Uso de corticosteroides (reduz)", "Uso de imunossupressores (reduz)", "Medicamentos antialérgicos"]
  },
  "Neutrófilos": {
    ideal: "2.000 a 7.000/mm³ (40 a 60%)",
    sinaisAltos: ["Fadiga", "Febre sutil", "Processos inflamatórios ativos", "Dor muscular"],
    sinaisBaixos: ["Suscetibilidade a infecções bacterianas recorrentes", "Úlceras orais"],
    causasAltas: ["Infecções bacterianas agudas", "Estresse físico ou psicológico severo", "Inflamação crônica", "Queimaduras", "Traumas"],
    causasBaixas: ["Infecções virais", "Exposição a substâncias tóxicas ou quimioterapia", "Doenças autoimunes", "Neutropenia benigna"],
    interferentes: ["Corticosteroides (aumentam)", "Estresse severo"]
  },
  "Neutrófilos Segmentados": {
    ideal: "2.000 a 7.000/mm³ (40 a 60%)",
    sinaisAltos: ["Fadiga", "Febre sutil", "Processos inflamatórios ativos", "Dor muscular"],
    sinaisBaixos: ["Suscetibilidade a infecções bacterianas recorrentes", "Úlceras orais"],
    causasAltas: ["Infecções bacterianas agudas", "Estresse físico ou psicológico severo", "Inflamação crônica", "Queimaduras", "Traumas"],
    causasBaixas: ["Infecções virais", "Exposição a substâncias tóxicas ou quimioterapia", "Doenças autoimunes", "Neutropenia benigna"],
    interferentes: ["Corticosteroides (aumentam)", "Estresse severo"]
  },
  "Linfócitos": {
    ideal: "1.000 a 3.500/mm³ (20 a 40%)",
    sinaisAltos: ["Suor noturno sutil", "Adenopatia leve", "Resposta imune adaptativa aumentada"],
    sinaisBaixos: ["Fadiga crônica", "Suscetibilidade a infecções virais", "Dificuldade de recuperação física"],
    causasAltas: ["Infecções virais agudas", "Processos inflamatórios crônicos", "Linfocitose reacional"],
    causasBaixas: ["Uso crônico de corticosteroides", "Imunodeficiências ou estresse crônico grave", "Desnutrição"],
    interferentes: ["Corticosteroides (reduzem)", "Estresse emocional ou físico prolongado"]
  },
  "Monócitos": {
    ideal: "200 a 1.000/mm³ (2 a 10%)",
    sinaisAltos: ["Sinais de ativação imune crônica", "Fadiga", "Dores articulares sutis"],
    sinaisBaixos: ["Geralmente sem significado clínico isolado"],
    causasAltas: ["Inflamação sistêmica de baixo grau", "Infecções crônicas ou na fase de recuperação", "Resistência insulínica"],
    causasBaixas: ["Aplasia medular", "Uso de corticosteroides agudo"],
    interferentes: ["Corticosteroides (reduzem)", "Infecções agudas recentes"]
  },
  "Basófilos": {
    ideal: "Até 110/mm³ (0 a 1%)",
    sinaisAltos: ["Sintomas alérgicos", "Irritações na pele", "Prurido"],
    sinaisBaixos: ["Ausência de significado clínico"],
    causasAltas: ["Processos alérgicos crônicos", "Urticária", "Doenças inflamatórias", "Mielofibrose"],
    causasBaixas: ["Ausência de significado clínico"],
    interferentes: ["Medicamentos antialérgicos ou imunossupressores"]
  },
  "Neutrófilos Bastonetes": {
    ideal: "Até 800/mm³ (Até 4%)",
    sinaisAltos: ["Desvio à esquerda", "Resposta aguda a infecção severa"],
    sinaisBaixos: ["Ausência de significado clínico"],
    causasAltas: ["Infecções bacterianas agudas de início recente", "Grandes traumas", "Estresse inflamatório agudo"],
    causasBaixas: ["Ausência de significado clínico"],
    interferentes: ["Corticosteroides"]
  }
};
