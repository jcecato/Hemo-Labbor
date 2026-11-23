import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const mineraisKnowledge: Record<string, MarkerKnowledge> = {
  "Zinco": {
    ideal: "100 - 120 µg/dL",
    sinaisBaixos: ["Queda de cabelo", "Unhas fracas/manchadas", "Baixa imunidade", "Perda paladar/olfato", "Acne", "Dermatite", "Cicatrização lenta", "Baixa libido", "Infertilidade", "Diarreia"],
    sinaisAltos: ["Náusea", "Vômito", "Dor abdominal", "Gosto metálico", "Tontura", "Anemia", "Neutropenia", "Imunossupressão", "Fadiga"],
    causasBaixas: ["Vegetarianismo", "Fitatos", "Doença celíaca", "Álcool", "Diabetes", "Estresse", "Suor excessivo", "Diuréticos", "Pílula"],
    causasAltas: ["Suplementação excessiva", "Cremes dentais", "Intoxicação", "Contaminação água", "Recipientes galvanizados", "Hemólise"],
    interferentes: ["Hemólise", "Tubo errado", "Corticoides", "Anticoncepcionais", "Infecção", "Jejum", "Ritmo circadiano"]
  },
  "Selênio (Sérico)": {
    ideal: "120 a 150 µg/L",
    sinaisBaixos: ["Fadiga extrema", "Fraqueza muscular", "Queda de cabelo severa", "Unhas quebradiças", "Névoa mental (brain fog)", "Baixa imunidade (infecções recorrentes)", "Dores musculares inexplicadas", "Hipotireoidismo tecidual sutil", "Problemas de fertilidade masculina", "Envelhecimento precoce da pele"],
    causasBaixas: ["Solo pobre em selênio (dietas de baixo consumo de castanhas e frutos do mar)", "Síndromes de má absorção (Doença Celíaca, Crohn)", "Alimentação parenteral prolongada", "Estresse oxidativo crônico elevado"],
    interferentes: ["Estados inflamatórios agudos (podem reduzir transitoriamente o selênio circulante)"]
  },
  "Selênio": {
    ideal: "120 a 150 µg/L",
    sinaisBaixos: ["Fadiga extrema", "Fraqueza muscular", "Queda de cabelo severa", "Unhas quebradiças", "Névoa mental (brain fog)", "Baixa imunidade (infecções recorrentes)", "Dores musculares inexplicadas", "Hipotireoidismo tecidual sutil", "Problemas de fertilidade masculina", "Envelhecimento precoce da pele"],
    causasBaixas: ["Solo pobre em selênio (dietas de baixo consumo de castanhas e frutos do mar)", "Síndromes de má absorção (Doença Celíaca, Crohn)", "Alimentação parenteral prolongada", "Estresse oxidativo crônico elevado"],
    interferentes: ["Estados inflamatórios agudos (podem reduzir transitoriamente o selênio circulante)"]
  },
  "Magnésio": {
    ideal: "2,0 - 2,4 mg/dL",
    sinaisBaixos: ["Cãibras", "Espasmos", "Insônia", "Ansiedade", "Constipação", "Arritmias", "Hipertensão", "Fadiga", "Enxaqueca", "TPM"],
    sinaisAltos: ["Diarréia", "Náusea", "Fraqueza", "Pressão baixa", "Sonolência", "Confusão", "Reflexos lentos", "Dificuldade respiratória", "Parada cardíaca", "Rubor facial"],
    causasBaixas: ["Estresse", "Pobre em vegetais", "Açúcar/Álcool", "Cafeína", "Diuréticos", "Omeprazol", "Diabetes", "Má absorção", "Suor", "Doença renal"],
    interferentes: ["Hemólise", "Garroteamento", "Diuréticos", "Antibióticos", "Ciclosporina", "Insulina", "Digoxina", "Cálcio", "Bilirrubina"]
  },
  "Cobre": {
    ideal: "95 a 110 µg/dL",
    sinaisBaixos: ["Anemia refratária à suplementação de ferro", "Fadiga", "Neutropenia (baixa imunidade)", "Osteoporose", "Problemas de pigmentação de cabelo/pele (grisalhos precoces)", "Hipotermia", "Neuropatia periférica", "Fraqueza muscular"],
    sinaisAltos: ["Ansiedade", "Irritabilidade", "Insônia", "Hipersensibilidade a estímulos externos", "Dores de cabeça", "Fadiga crônica", "Alterações de humor", "Problemas digestivos", "Acne", "Baixa tolerância ao estresse"],
    causasBaixas: ["Suplementação excessiva de zinco (compete diretamente por absorção)", "Doença celíaca ou bariátrica (má absorção)", "Nutrição parenteral prolongada sem cobre"],
    causasAltas: ["Uso de contraceptivos hormonais orais (estrogênios elevam cobre)", "Suplementação inadequada", "Água encanada em tubos de cobre", "Gravidez", "Inflamação crônica (cobre é transportado pela ceruloplasmina, proteína de fase aguda)"],
    interferentes: ["Anticoncepcionais orais (elevam fortemente)", "Estados inflamatórios (elevam)", "Suplementação de zinco (reduz)"]
  },

  "Cálcio iônico": {
    ideal: "1,1 a 1,32 mmol/L",
    sinaisAltos: ["Fraqueza muscular", "Fadiga", "Náuseas", "Vômitos", "Constipação", "Poliúria", "Desidratação", "Dor abdominal", "Perda de apetite", "Hipertensão arterial", "Confusão mental", "Irritabilidade", "Sonolência", "Arritmias", "Cálculos renais", "Dores ósseas", "Fraturas frequentes", "Osteoporose", "Dificuldade de concentração", "Depressão"],
    sinaisBaixos: ["Tetania", "Espasmos musculares", "Parestesia", "Convulsões", "Arritmias", "Hipotensão", "Fadiga", "Confusão", "Irritabilidade", "Dor muscular", "Fraqueza generalizada", "Formigamento", "Dificuldade para respirar", "Broncoespasmo", "Pele seca", "Cabelos quebradiços", "Unhas frágeis", "Osteopenia", "Cãibras noturnas", "Dificuldade de coagulação"],
    causasAltas: ["Hiperparatireoidismo primário", "Intoxicação por vitamina D", "Neoplasias ósseas", "Uso prolongado de diuréticos tiazídicos", "Excesso de suplementação de cálcio"],
    causasBaixas: ["Hipoparatireoidismo", "Deficiência de vitamina D", "Insuficiência renal crônica", "Pancreatite aguda", "Malabsorção intestinal"],
    interferentes: ["Suplementos de cálcio", "Diuréticos tiazídicos", "Corticosteroides (reduzem)", "Antiácidos contendo alumínio", "Bisfosfonatos"]
  },
  "Cálcio sérico": {
    ideal: "9,5 a 10,5 mg/dL",
    sinaisAltos: ["Fraqueza muscular", "Constipação", "Náuseas", "Vômitos", "Poliúria", "Dor abdominal", "Perda de apetite", "Desidratação", "Hipertensão arterial", "Confusão", "Letargia", "Sonolência", "Cálculos renais", "Dores ósseas", "Fraturas", "Osteoporose", "Arritmias", "Pele ressecada", "Olhos secos", "Coceira"],
    sinaisBaixos: ["Tetania", "Espasmos musculares", "Parestesia", "Cãibras", "Convulsões", "Arritmias", "Hipotensão", "Fraqueza generalizada", "Broncoespasmo", "Dificuldades respiratórias", "Fadiga", "Confusão", "Irritabilidade", "Dificuldade de coagulação", "Osteopenia", "Dor óssea", "Pele seca", "Unhas frágeis", "Dificuldade de cicatrização", "Perda de apetite"],
    causasAltas: ["Hiperparatireoidismo", "Neoplasias ósseas", "Intoxicação por vitamina D", "Insuficiência renal crônica", "Excesso de cálcio na dieta"],
    causasBaixas: ["Hipoparatireoidismo", "Deficiência de vitamina D", "Pancreatite aguda", "Desnutrição crônica", "Alcoolismo"],
    interferentes: ["Suplementos de cálcio", "Diuréticos tiazídicos", "Corticosteroides (reduzem)", "Antiácidos contendo cálcio", "Bisfosfonatos"]
  },
  "Cálcio Total": {
    ideal: "9,5 a 10,5 mg/dL",
    sinaisAltos: ["Fraqueza muscular", "Constipação", "Náuseas", "Vômitos", "Poliúria", "Dor abdominal", "Perda de apetite", "Desidratação", "Hipertensão arterial", "Confusão", "Letargia", "Sonolência", "Cálculos renais", "Dores ósseas", "Fraturas", "Osteoporose", "Arritmias", "Pele ressecada", "Olhos secos", "Coceira"],
    sinaisBaixos: ["Tetania", "Espasmos musculares", "Parestesia", "Cãibras", "Convulsões", "Arritmias", "Hipotensão", "Fraqueza generalizada", "Broncoespasmo", "Dificuldades respiratórias", "Fadiga", "Confusão", "Irritabilidade", "Dificuldade de coagulação", "Osteopenia", "Dor óssea", "Pele seca", "Unhas frágeis", "Dificuldade de cicatrização", "Perda de apetite"],
    causasAltas: ["Hiperparatireoidismo", "Neoplasias ósseas", "Intoxicação por vitamina D", "Insuficiência renal crônica", "Excesso de cálcio na dieta"],
    causasBaixas: ["Hipoparatireoidismo", "Deficiência de vitamina D", "Pancreatite aguda", "Desnutrição crônica", "Alcoolismo"],
    interferentes: ["Suplementos de cálcio", "Diuréticos tiazídicos", "Corticosteroides (reduzem)", "Antiácidos contendo cálcio", "Bisfosfonatos"]
  },
  "Fósforo": {
    ideal: "3,0 - 4,0 mg/dL",
    sinaisBaixos: ["Fraqueza muscular extrema", "Dores ósseas", "Dificuldade de respiração", "Confusão mental", "Falta de apetite", "Fadiga crônica", "Problemas de coordenação", "Formigamento nos dedos", "Maior suscetibilidade a infecções", "Fraturas frequentes"],
    sinaisAltos: ["Cãibras musculares", "Espasmos (tetania)", "Coceira na pele (prurido)", "Calcificação ectópica (tecidos moles)", "Fadiga", "Dificuldade de concentração", "Dores nas articulações", "Hipertensão sutil", "Olhos avermelhados", "Perda de densidade mineral óssea"],
    causasBaixas: ["Uso prolongado de antiácidos contendo alumínio ou magnésio (ligam ao fósforo no intestino)", "Hiperparatireoidismo primário", "Deficiência de Vitamina D", "Má absorção intestinal severa (Doença Celíaca, Crohn)", "Desnutrição grave / Alcoolismo crônico"],
    causasAltas: ["Insuficiência renal crônica ou aguda (excreção diminuída)", "Hipoparatireoidismo", "Ingestão excessiva de alimentos industrializados ricos em aditivos fosfatados (refrigerantes de cola, processados)", "Intoxicação por vitamina D", "Lise celular maciça"],
    interferentes: ["Antiácidos contendo alumínio ou magnésio (reduzem fósforo)", "Diuréticos de alça (reduzem)", "Diuréticos tiazídicos (elevam)"]
  },

  "Potássio": {
    ideal: "4,0 a 5,5 mEq/L (Otimizado: 4,0 a 4,8 mEq/L)",
    sinaisBaixos: ["Fraqueza muscular", "Cãibras frequentes", "Palpitações cardíacas (arritmias)", "Constipação intestinal severa", "Fadiga extrema", "Letargia", "Dificuldade de digestão", "Retenção hídrica", "Espasmos musculares", "Tontura sutil ao levantar"],
    sinaisAltos: ["Fraqueza muscular severa", "Formigamento nas mãos/pés", "Náuseas", "Palpitações cardíacas", "Dor torácica sutil", "Falta de ar", "Paralisia flácida (em níveis muito altos)", "Sensação de pulso irregular", "Tontura extrema", "Confusão mental"],
    causasBaixas: ["Uso prolongado de diuréticos de alça ou tiazídicos", "Perdas gastrointestinais (vômitos ou diarreia crônicos)", "Consumo alimentar insuficiente (pobre em vegetais e frutas)", "Excesso de aldosterona", "Uso prolongado de laxantes"],
    causasAltas: ["Insuficiência renal (eliminação diminuída)", "Uso de medicamentos poupadores de potássio (espironolactona, IECA, BRA)", "Suplementação de potássio excessiva", "Destruição celular em massa (rabdomiólise, hemólise)", "Hipoaldosteronismo (Doença de Addison)"],
    interferentes: ["Hemólise da amostra na coleta (causa falso alto)", "Garroteamento muito prolongado ou abertura/fechamento das mãos durante a coleta", "Uso de diuréticos"]
  },
  "Sódio": {
    ideal: "140 a 145 mEq/L (Otimizado)",
    sinaisBaixos: ["Cefaleia", "Náuseas e vômitos", "Confusão mental", "Letargia e fadiga crônica", "Fraqueza muscular", "Cãibras", "Irritabilidade", "Desorientação", "Falta de energia", "Apatia severa"],
    sinaisAltos: ["Sede extrema", "Boca e membranas mucosas secas", "Irritabilidade", "Agitação psicomotora", "Espasmos musculares", "Letargia", "Convulsões (em casos severos)", "Edema periférico sutil", "Confusão", "Pressão arterial oscilante"],
    causasBaixas: ["Excesso de hidratação (hiponatremia dilucional - muito comum)", "Insuficiência adrenal", "Uso de diuréticos (furosemida, hidroclorotiazida)", "Síndrome da Secreção Inapropriada de ADH (SIADH)", "Perdas severas (vômitos, diarreia, suor abundante)"],
    causasAltas: ["Desidratação (ingestão insuficiente de água)", "Perda excessiva de fluidos corporais (suor severo, diarreia, poliúria)", "Uso de soluções salinas hipertônicas", "Hiperaldosteronismo", "Síndrome de Cushing"],
    interferentes: ["Hiperglicemia severa (pode puxar água e causar falsa hiponatremia dilucional)", "Hiperlipidemia ou hiperproteinemia severas"]
  },

  "Vitamina A": {
    ideal: "57,00 - 66,00 µg/dL (Otimizado)",
    sinaisBaixos: ["Cegueira noturna (dificuldade de adaptação ao escuro)", "Olhos secos (xeroftalmia)", "Pele extremamente seca e descamativa", "Ceratose folicular (bolinhas ásperas na pele)", "Unhas frágeis", "Baixa imunidade (infecções respiratórias frequentes)", "Má cicatrização", "Cabelos secos", "Problemas de crescimento em jovens", "Cansaço constante"],
    sinaisAltos: ["Dor de cabeça crônica", "Náuseas", "Vômitos", "Visão turva", "Pele descamativa severa", "Queda de cabelo importante", "Dores articulares e ósseas", "Irritabilidade", "Dano hepático", "Fadiga extrema"],
    causasBaixas: ["Baixa ingestão de alimentos ricos em vitamina A pré-formada (fígado, ovos) ou pró-vitamina A (cenoura, abóbora)", "Insuficiência pancreática ou biliar (dificulta absorção de gorduras)", "Síndrome de má absorção (Doença Celíaca, Crohn)", "Deficiência de zinco (zinco é cofator essencial para síntese de RBP)"],
    causasAltas: ["Suplementação excessiva (especialmente com retinoides sintéticos)", "Consumo maciço e diário de fígado animal", "Disfunção na depuração de lipoproteínas"],
    interferentes: ["Processamento inadequado da amostra (vitamina A é fotossensível)", "Nível de proteína ligadora de retinol (RBP)", "Níveis de zinco"]
  },
  "Vitamina C": {
    ideal: "1,30 - 4,00 mg/dL (Otimizado)",
    sinaisBaixos: ["Gengivas sangrando ou inflamadas", "Hematomas frequentes sem causa aparente", "Má cicatrização de feridas", "Unhas quebradiças ou em forma de colher", "Dores articulares frequentes", "Baixa imunidade (infecções recorrentes)", "Pele áspera e seca", "Cabelos secos e quebradiços", "Fadiga crônica", "Apatia e irritabilidade constante"],
    sinaisAltos: ["Geralmente eliminada pela urina; excessos extremos podem causar diarreia", "Cólicas abdominais", "Náuseas sutil", "Formação de cálculos de oxalato de cálcio em indivíduos propensos"],
    causasBaixas: ["Alimentação pobre em vegetais e frutas frescas", "Tabagismo active ou passivo (fumantes demandam dobro de vitamina C)", "Estresse físico crônico ou agudo grave", "Uso crônico de aspirina", "Alcoolismo"],
    causasAltas: ["Suplementação em altas doses (> 2g/dia)"],
    interferentes: ["Instabilidade da amostra se não congelada imediatamente após separação do plasma", "Uso agudo de aspirina"]
  },
  "Vitamina D (ativa 1,25 OH)": {
    ideal: "70 - 90 ng/mL",
    sinaisBaixos: ["Fraqueza muscular", "Fadiga", "Dor óssea crônica", "Cãibras", "Dificuldade de absorção de cálcio", "Fragilidade imunológica", "Alterações de humor", "Queda de cabelo", "Perda de densidade mineral óssea"],
    causasBaixas: ["Insuficiência renal crônica (rins realizam a 1-alfa-hidroxilação final)", "Hipoparatireoidismo (PTH estimula a conversão)", "Deficiência severa de 25-OH vitamina D"],
    interferentes: ["Uso de glicocorticoides", "Biotina", "Níveis de paratormônio (PTH)"]
  },
  "Vitamina D (semi ativa 25-OH)": {
    ideal: "50 - 80 ng/mL",
    sinaisBaixos: ["Baixa imunidade (infecções frequentes)", "Fadiga crônica", "Dor óssea e muscular difusa", "Depressão e alterações de humor", "Dificuldade de cicatrização", "Queda de cabelo", "Perda de massa óssea", "Piora de dores articulares", "Alterações de sono", "Cãibras musculares"],
    sinaisAltos: ["Náuseas e vômitos", "Constipação intestinal", "Fraqueza muscular severa", "Poliúria", "Sede excessiva", "Cálculos renais", "Confusão mental", "Arritmias cardíacas", "Fadiga severa", "Perda de peso involuntária"],
    causasBaixas: ["Falta de exposição solar adequada direta", "Uso constante de protetor solar ou roupas longas", "Pele escura (menor síntese por melanina)", "Obesidade (vitamina D fica retida no tecido adiposo)", "Bariátrica ou doenças de má absorção intestinal", "Envelhecimento (menor capacidade de síntese cutânea)"],
    causasAltas: ["Suplementação excessiva com colecalciferol oral sem acompanhamento de vitamina K2 e magnésio"],
    interferentes: ["Biotina", "Época do ano (inverno reduz)", "Uso de anticonvulsivantes"]
  },
  "Vitamina E": {
    ideal: "10 - 20 mg/dL (Otimizado)",
    sinaisBaixos: ["Neuropatia periférica (formigamento e dormência)", "Dificuldades de coordenação e equilíbrio (ataxia)", "Fraqueza muscular severa", "Problemas de visão (retinopatia)", "Anemia hemolítica (glóbulos vermelhos frágeis)", "Baixa imunidade", "Dores de cabeça recorrentes", "Queda de cabelo", "Problemas de fertilidade", "Envelhecimento precoce de tecidos"],
    sinaisAltos: ["Aumento de risco de sangramentos (vitamina E em altas doses antagoniza a vitamina K)", "Fadiga", "Náuseas", "Fraqueza muscular", "Visão dupla"],
    causasBaixas: ["Doenças de má absorção de gorduras (Doença Celíaca, Crohn, fibrose cística)", "Insuficiência biliar ou pancreática", "Uso crônico de orlistat ou colestiramina", "Dietas extremamente pobres em gorduras boas (oleaginosas, azeite)"],
    causasAltas: ["Suplementação excessiva com alfa-tocoferol isolado"],
    interferentes: ["Perfil lipídico sérico total (vitamina E circula ligada a lipoproteínas, colesterol alto pode elevar falsamente a vit E)"]
  },
  "Ácido Fólico": {
    ideal: "15 - 20 ng/mL",
    sinaisBaixos: ["Fadiga intensa", "Palidez cutânea", "Glossite (língua vermelha, lisa e dolorosa)", "Aftas orais recorrentes", "Dificuldade de respiração sutil", "Falta de foco e irritabilidade", "Dores de cabeça", "Cabelos grisalhos precoces", "Dormência sutil nas pernas", "Redução da imunidade"],
    sinaisAltos: ["Pode mascarar uma deficiência oculta de vitamina B12 (potencializando danos neurológicos silenciosos)"],
    causasBaixas: ["Baixa ingestão de folato dietético (vegetais verdes folhosos frescos)", "Alcoolismo crônico", "Mutação severa no gene MTHFR", "Doença celíaca ou má absorção intestinal", "Uso de metotrexato ou sulfas"],
    causasAltas: ["Suplementação crônica com ácido fólico sintético", "Ingestão excessiva de alimentos enriquecidos artificialmente"],
    interferentes: ["Uso recente de álcool", "Biotina", "Anticoncepcionais orais"]
  },
  "Vitamina B12": {
    ideal: "600 - 900 pg/mL",
    sinaisBaixos: ["Fadiga", "Formigamento", "Brain fog", "Depressão e ansiedade", "Tontura/Desequilíbrio", "Anemia megaloblástica", "Glossite", "Fraqueza muscular", "Visão turva", "Palpitações"],
    causasBaixas: ["Metformina", "Omeprazol", "Veganos", "Gastrite atrófica", "Bariátrica", "Crohn/Celíaca", "Envelhecimento", "H. pylori", "Álcool", "Parasitoses"],
    interferentes: ["Vitamina C", "Anticoncepcionais", "Antibióticos", "Biotina", "Gravidez", "Álcool", "Colchicina", "Óxido nitroso"]
  },
  "Vitamina B6": {
    ideal: "5 - 30 µg/L",
    sinaisBaixos: ["Dermatite seborreica", "Glossite e queilose (rachaduras no canto da boca)", "Depressão e ansiedade severas", "Irritabilidade extrema", "Neuropatia periférica", "Retenção de líquidos", "Baixa imunidade", "Anemia microcítica (B6 é essencial na síntese de heme)", "Cãibras musculares", "Confusão mental"],
    sinaisAltos: ["Neuropatia sensorial severa reversível (causada por doses altíssimas em suplementação)", "Dormência", "Fraqueza muscular"],
    causasBaixas: ["Consumo crônico de álcool", "Uso prolongado de anticoncepcionais orais", "Uso de medicamentos como isoniazida, penicilamina ou teofilina", "Estresse inflamatório crônico", "Má absorção intestinal"],
    causasAltas: ["Suplementação inadequada em altas doses de piridoxina cloridrato"],
    interferentes: ["Consumo recente de suplementos contendo B6", "Hemólise da amostra"]
  },
  "Manganês": {
    ideal: "4 - 15 µg/L",
    sinaisBaixos: ["Dores articulares", "Flacidez de ligamentos", "Alterações de crescimento capilar", "Pele descamativa sutil", "Intolerância à glicose", "Baixa fertilidade", "Problemas de cicatrização"],
    sinaisAltos: ["Sintomas neurológicos semelhantes ao Parkinson em exposições ocupacionais severas (manganismo)", "Lentidão mental", "Dificuldades motoras"],
    causasBaixas: ["Baixa ingestão de grãos integrais, nozes e vegetais folhosos escuros", "Má absorção crônica"],
    causasAltas: ["Inalação ocupacional de poeira de manganês", "Contaminação da água"],
    interferentes: ["Hemólise ou contaminação por poeira na agulha de coleta"]
  },
  "Molibdênio": {
    ideal: "70 - 120 nmol/L",
    sinaisBaixos: ["Intolerância a sulfitos (dores de cabeça após tomar vinho ou comer secos conservados)", "Alergias inexplicadas", "Taquicardia sutil", "Fadiga crônica", "Dores de cabeça frequentes"],
    causasBaixas: ["Alimentação com baixo consumo de leguminosas, grãos e fígado", "Nutrição parenteral crônica"],
    interferentes: ["Excesso de tungstênio ou cobre na dieta (agem como antagonistas)"]
  },
  "Mercúrio": {
    ideal: "< 5 µg/L (Desejável o menor possível)",
    sinaisAltos: ["Dores de cabeça", "Tremores finos nas mãos", "Perda de memória recente", "Fraqueza muscular", "Irritabilidade e mudanças de humor severas", "Gosto metálico na boca", "Insônia", "Problemas renais de filtragem", "Dormência periférica", "Névoa mental extrema"],
    causasAltas: ["Consumo excessivo de peixes predadores grandes (atum, cação, peixe-espada)", "Exposição ocupacional (indústrias, odontologia antiga)", "Ruptura de termômetros antigos ou amálgamas dentários se manuseados incorretamente"],
    interferentes: ["Consumo recente de peixe nas últimas 48 horas (eleva temporariamente sem representar intoxicação crônica acumulada)"]
  },
  "Ferro": {
    ideal: "80 a 120 µg/dL",
    sinaisBaixos: ["Fadiga generalizada", "Falta de ar sutil ao esforço", "Palidez cutânea e de mucosas", "Tontura frequente", "Queda de cabelo", "Unhas fracas e quebradiças", "Dificuldade de concentração", "Mãos e pés frios", "Pernas inquietas", "Glossite (língua inchada e dolorida)"],
    sinaisAltos: ["Dor nas articulações", "Fadiga crônica", "Dor abdominal inexplicada", "Pigmentação escura na pele", "Arritmias cardíacas", "Fraqueza", "Sinais de estresse oxidativo tecidual alto"],
    causasBaixas: ["Sangramentos agudos ou crônicos (menstruação abundante, úlcera)", "Baixa ingestão alimentar de ferro heme", "Acloridria ou uso crônico de antiácidos", "Doença celíaca ou Crohn (má absorção)"],
    causasAltas: ["Suplementação excessiva ou transfusões", "Hemocromatose hereditária", "Doença hepática crônica", "Destruição celular aguda"],
    interferentes: ["Flutuação diurna acentuada (deve colher de manhã)", "Ingestão recente de alimentos ricos em ferro", "Uso de contraceptivos orais"]
  },
  "Cortisol Matinal": {
    ideal: "10 a 15 µg/dL (~08h)",
    sinaisAltos: ["Ansiedade", "Insônia (acordar de madrugada)", "Ganho de peso abdominal", "Hipertensão", "Fadiga crônica", "Estrias purpúreas", "Imunossupressão", "Fraqueza muscular"],
    sinaisBaixos: ["Fadiga crônica extrema", "Dificuldade de acordar", "Hipotensão arterial", "Desejo por sal", "Hipoglicemia", "Apatia", "Perda de peso", "Tontura ortostática"],
    causasAltas: ["Estresse crônico", "Síndrome de Cushing", "Uso prolongado de corticoides", "Privação de sono", "Inflamação crônica"],
    causasBaixas: ["Insuficiência adrenal primária (Doença de Addison)", "Fadiga adrenal (hipofunção por estresse crônico burnout)", "Hipopituitarismo"],
    interferentes: ["Uso de corticosteroides", "Estrogênios (pílula anticoncepcional eleva cortisol total)", "Estresse agudo na coleta"]
  },

};
