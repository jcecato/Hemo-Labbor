import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const micronutrientesKnowledge: Record<string, MarkerKnowledge> = {
  "Zinco": {
    ideal: "100 - 120 µg/dL",
    sinaisBaixos: ["Queda de cabelo", "Unhas fracas/manchadas", "Baixa imunidade", "Perda paladar/olfato", "Acne", "Dermatite", "Cicatrização lenta", "Baixa libido", "Infertilidade", "Diarreia"],
    sinaisAltos: ["Náusea", "Vômito", "Dor abdominal", "Gosto metálico", "Tontura", "Anemia", "Neutropenia", "Imunossupressão", "Fadiga"],
    causasBaixas: ["Vegetarianismo", "Fitatos", "Doença celíaca", "Álcool", "Diabetes", "Estresse", "Suor excessivo", "Diuréticos", "Pílula"],
    causasAltas: ["Suplementação excessiva", "Cremes dentais", "Intoxicação", "Contaminação água", "Recipientes galvanizados", "Hemólise"],
    interferentes: ["Hemólise", "Tubo errado", "Corticoides", "Anticoncepcionais", "Infecção", "Jejum", "Ritmo circadiano"]
  },
  "Vitamina B1 (Tiamina)": {
    ideal: "28,0 a 80,0 µg/L",
    sinaisBaixos: ["Fadiga", "Irritabilidade", "Perda de memória", "Neuropatia periférica", "Fraqueza muscular", "Palpitações"],
    sinaisAltos: ["Suplementação excessiva por via parenteral"],
    causasBaixas: ["Alcoolismo", "Consumo excessivo de carboidratos refinados", "Cirurgia bariátrica", "Uso prolongado de diuréticos", "Síndrome de má absorção"],
    causasAltas: ["Suplementação em altas doses (raro efeito adverso)"],
    interferentes: ["Diuréticos de alça", "Consumo de álcool", "Café e chá em excesso"]
  },
  "Vitamina B12": {
    ideal: "600 - 900 pg/mL",
    sinaisBaixos: ["Fadiga", "Formigamento", "Brain fog", "Depressão e ansiedade", "Tontura/Desequilíbrio", "Anemia megaloblástica", "Glossite", "Fraqueza muscular", "Visão turva", "Palpitações"],
    causasBaixas: ["Metformina", "Omeprazol", "Veganos", "Gastrite atrófica", "Bariátrica", "Crohn/Celíaca", "Envelhecimento", "H. pylori", "Álcool", "Parasitoses"],
    interferentes: ["Vitamina C", "Anticoncepcionais", "Antibióticos", "Biotina", "Gravidez", "Álcool", "Colchicina", "Óxido nitroso"]
  },
  "Magnésio": {
    ideal: "2,0 - 2,4 mg/dL",
    sinaisBaixos: ["Cãibras", "Espasmos", "Insônia", "Ansiedade", "Constipação", "Arritmias", "Hipertensão", "Fadiga", "Enxaqueca", "TPM"],
    sinaisAltos: ["Diarréia", "Náusea", "Fraqueza", "Pressão baixa", "Sonolência", "Confusão", "Reflexos lentos", "Dificuldade respiratória", "Parada cardíaca", "Rubor facial"],
    causasBaixas: ["Estresse", "Pobre em vegetais", "Açúcar/Álcool", "Cafeína", "Diuréticos", "Omeprazol", "Diabetes", "Má absorção", "Suor", "Doença renal"],
    interferentes: ["Hemólise", "Garroteamento", "Diuréticos", "Antibióticos", "Ciclosporina", "Insulina", "Digoxina", "Cálcio", "Bilirrubina"]
  },
  "Ferritina": {
    ideal: "70 - 150 ng/mL",
    sinaisBaixos: ["Queda de cabelo", "Fadiga", "Hipotireoidismo tecidual", "Depressão", "Ansiedade", "Insônia", "Pernas inquietas", "Baixa resistência", "Déficit atenção", "Unhas fracas"],
    causasAltas: ["Inflamação", "Infecção", "Síndrome metabólica", "Obesidade", "Esteatose", "Álcool", "Hemocromatose", "Câncer", "Hipertireoidismo", "Transfusões"],
    interferentes: ["Inflamação", "Exercício", "Lesão hepática", "Álcool", "Corticosteroides", "Anticoncepcionais", "Menopausa", "Idade", "Infecção recente"]
  },
  "Vitamina D 25-OH": {
    ideal: "50 - 80 ng/mL",
    sinaisBaixos: ["Baixa imunidade", "Depressão", "Dor óssea", "Fadiga", "Fraqueza", "Crescimento lento", "Cáries", "Dificuldade cicatrização", "Queda cabelo", "Piora autoimunes"],
    causasBaixas: ["Falta sol", "Protetor solar", "Pele escura", "Obesidade", "Idade", "Má absorção", "Bariátrica", "Doença renal/hepática", "Anticonvulsivantes", "VDR"],
    interferentes: ["Biotina", "Anticonvulsivantes", "Corticosteroides", "Rifampicina", "Orlistat", "Colestiramina", "Barbitúricos", "Inverno", "Latitude"]
  },
  "Vitamina D3 Ativa (1,25-Di-hidroxivitamina D)": {
    ideal: "50 a 100 pg/mL",
    sinaisBaixos: ["Dor óssea e muscular", "Baixa imunidade", "Fraqueza física", "Fadiga", "Piora de doenças autoimunes", "Redução da densidade mineral óssea", "Espasmos musculares", "Alterações no humor", "Cãibras", "Dificuldade na cicatrização"],
    sinaisAltos: ["Náuseas", "Vômitos", "Perda de apetite", "Sede excessiva", "Poliúria", "Constipação", "Fraqueza muscular", "Confusão mental", "Cálculos renais", "Dores articulares"],
    causasBaixas: ["Doença renal crônica (perda da atividade da 1-alfa-hidroxilase)", "Hipoparatireoidismo", "Deficiência severa de 25-OH Vitamina D", "Uso de cetoconazol ou corticosteroides", "Envelhecimento renal"],
    causasAltas: ["Hiperparatireoidismo primário", "Sarcoidose ou outras doenças granulomatosas", "Linfoma", "Suplementação excessiva de vitamina D3", "Hipercalcemia idiopática"],
    interferentes: ["Uso de corticosteroides", "Uso de cetoconazol", "Níveis de paratormônio (PTH)", "Níveis de fósforo e cálcio séricos", "Biotina"]
  },
  "Cálcio iônico": {
    ideal: "1,1 a 1,32 mmol/L",
    sinaisAltos: ["Fraqueza muscular", "Fadiga", "Náuseas", "Vômitos", "Constipação", "Poliúria", "Desidratação", "Dor abdominal", "Perda de apetite", "Hipertensão arterial", "Confusão mental", "Irritabilidade", "Sonolência", "Arritmias", "Cálculos renais", "Dores ósseas", "Fraturas frequentes", "Osteoporose", "Dificuldade de concentração", "Depressão"],
    sinaisBaixos: ["Tetania", "Espasmos musculares", "Parestesia", "Convulsões", "Arritmias", "Hipotensão", "Fadiga", "Confusão", "Irritabilidade", "Dor muscular", "Fraqueza generalizada", "Formigamento", "Dificuldade para respirar", "Broncoespasmo", "Pele seca", "Cabelos quebradiços", "Unhas frágeis", "Osteopenia", "Cãibras noturnas", "Dificuldade de coagulação"],
    causasAltas: ["Hiperparatireoidismo primário", "Intoxicação por vitamina D", "Neoplasias ósseas", "Uso prolongado de diuréticos tiazídicos", "Excesso de suplementação de cálcio"],
    causasBaixas: ["Hipoparatireoidismo", "Deficiência de vitamina D", "Insuficiência renal crônica", "Pancreatite aguda", "Malabsorção intestinal"],
    interferentes: ["Suplementos de cálcio (aumentam)", "Diuréticos tiazídicos (aumentam)", "Corticosteroides (reduzem)", "Antiácidos à base de alumínio (reduzem)", "Bisfosfonatos (reduzem)"]
  },
  "Cálcio sérico": {
    ideal: "9,5 a 10,5 mg/dL",
    sinaisAltos: ["Fraqueza muscular", "Constipação", "Náuseas", "Vômitos", "Poliúria", "Dor abdominal", "Perda de apetite", "Desidratação", "Hipertensão arterial", "Confusão", "Letargia", "Sonolência", "Cálculos renais", "Dores ósseas", "Fraturas", "Osteoporose", "Arritmias", "Pele ressecada", "Olhos secos", "Coceira"],
    sinaisBaixos: ["Tetania", "Espasmos musculares", "Parestesia", "Cãibras", "Convulsões", "Arritmias", "Hipotensão", "Fraqueza generalizada", "Broncoespasmo", "Dificuldades respiratórias", "Fadiga", "Confusão", "Irritabilidade", "Dificuldade de coagulação", "Osteopenia", "Dor óssea", "Pele seca", "Unhas frágeis", "Dificuldade de cicatrização", "Perda de apetite"],
    causasAltas: ["Hiperparatireoidismo", "Neoplasias ósseas", "Intoxicação por vitamina D", "Insuficiência renal crônica", "Excesso de cálcio na dieta"],
    causasBaixas: ["Hipoparatireoidismo", "Deficiência de vitamina D", "Pancreatite aguda", "Desnutrição crônica", "Alcoolismo"],
    interferentes: ["Suplementos de cálcio (aumentam)", "Diuréticos tiazídicos (aumentam)", "Corticosteroides (reduzem)", "Antiácidos contendo cálcio (aumentam)", "Bisfosfonatos (reduzem)"]
  }
};
