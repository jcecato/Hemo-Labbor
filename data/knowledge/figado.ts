import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const figadoKnowledge: Record<string, MarkerKnowledge> = {
  "ALT (TGP)": {
    ideal: "< 25 U/L",
    sinaisAltos: ["Fadiga", "Icterícia (pele/olhos amarelos)", "Dor abdominal (quadrante superior direito)", "Urina escura", "Fezes claras", "Náuseas e vômitos", "Perda de apetite", "Inchaço nas pernas", "Prurido", "Facilidade para sangramentos"],
    sinaisBaixos: ["Geralmente sem significado clínico direto; pode indicar baixa renovação celular ou deficiência de B6"],
    causasAltas: ["Esteatose hepática (fígado gorduroso)", "Hepatite viral (A, B, C)", "Consumo excessivo de álcool", "Medicamentos hepatotóxicos (paracetamol, estatinas)", "Câncer hepático", "Insuficiência cardíaca congestiva", "Obstrução biliar", "Doença celíaca"],
    causasBaixas: ["Deficiência de Vitamina B6 (Piridoxal-5-Fosfato, cofator essencial)", "Doença renal crônica severa"],
    interferentes: ["Suplementação de vitamina B6", "Exercício físico extremo recente", "Medicamentos como AINEs, estatinas, anticoncepcionais"]
  },
  "AST (TGO)": {
    ideal: "< 25 U/L",
    sinaisAltos: ["Fadiga", "Icterícia", "Dor abdominal alta", "Urina escura", "Prurido", "Dores musculares sistêmicas", "Náuseas", "Fraqueza generalizada"],
    sinaisBaixos: ["Geralmente sem significado clínico direto; pode indicar deficiência de B6"],
    causasAltas: ["Lesão hepática", "Lesão muscular esquelética (rabdomiólise)", "Infarto agudo do miocárdio", "Hepatite alcoólica/viral", "Esteatose hepática", "Exercício físico muito intenso", "Medicamentos hepatotóxicos"],
    causasBaixas: ["Deficiência de Vitamina B6", "Uremia / Doença renal em estágio avançado"],
    interferentes: ["Exercício físico intenso (musculação)", "Biotina", "Aspirina", "Medicamentos hepatotóxicos"]
  },
  "GGT": {
    ideal: "Inferior a 60 U/L",
    sinaisAltos: ["Fadiga", "Prurido generalizado", "Icterícia", "Dor abdominal direita", "Intolerância a carboidratos/álcool", "Sinais de estresse oxidativo", "Retenção hídrica"],
    sinaisBaixos: ["Geralmente sem significado clínico adverso; indica bom status antioxidante ou deficiência extrema de magnésio"],
    causasAltas: ["Consumo frequente de álcool", "Esteatose hepática não alcoólica (NAFLD)", "Colestase/Obstrução biliar", "Exposição a xenobióticos/toxinas", "Medicamentos (anticonvulsivantes, estatinas)", "Deficiência de glutationa (compensação hepática)"],
    causasBaixas: ["Hipotireoidismo severo", "Deficiência acentuada de magnésio ou zinco"],
    interferentes: ["Consumo recente de álcool", "Medicamentos anticonvulsivantes (fenobarbital)", "Uso de glutationa suplementar (pode reduzir)"]
  },
  "Fosfatase Alcalina (FA)": {
    ideal: "30 a 120 U/L (Otimizado: 50 a 90 U/L)",
    sinaisAltos: ["Dor óssea", "Icterícia", "Prurido na pele", "Fraturas frequentes", "Urina escura", "Fezes de cor clara", "Dor abdominal superior", "Fadiga", "Náuseas", "Inchaço abdominal"],
    sinaisBaixos: ["Fadiga crônica", "Fraqueza muscular", "Dores articulares", "Dificuldade de cicatrização", "Redução da imunidade", "Perda de apetite", "Tontura", "Problemas de memória", "Unhas fracas", "Unhas com manchas brancas"],
    causasAltas: ["Doenças biliares (colestase, colelitíase)", "Doenças hepáticas", "Doenças ósseas (Doença de Paget, fraturas em consolidação, metástases)", "Hiperparatireoidismo", "Gravidez (produção placentária)", "Crescimento ósseo em jovens"],
    causasBaixas: ["Deficiência de zinco", "Deficiência de magnésio", "Hipotireoidismo", "Anemia severa", "Hipofosfatasia (doença genética rara)", "Desnutrição proteico-calórica", "Deficiência de vitamina B12", "Excesso de suplementação de cálcio (antagonismo com zinco/magnésio)"],
    interferentes: ["Anticoncepcionais orais (reduzem)", "Gravidez (aumenta)", "Idade jovem (aumenta por crescimento)", "Refeições gordurosas antes da coleta (aumentam FA intestinal)"]
  },
  "Bilirrubina Total e Frações": {
    ideal: "Bilirrubina Total: < 1,2 mg/dL | Direta: < 0,3 mg/dL | Indireta: < 0,9 mg/dL",
    sinaisAltos: ["Icterícia (olhos e pele amarelados)", "Prurido cutâneo", "Urina escura (colúria)", "Fezes claras (acolia biliar)", "Fadiga extrema", "Dor abdominal à direita", "Náuseas", "Vômitos"],
    sinaisBaixos: ["Baixa capacidade antioxidante endógena (bilirrubina atua como antioxidante em níveis fisiológicos normais)"],
    causasAltas: ["Hepatites virais ou autoimunes", "Obstrução biliar (cálculos ou tumores)", "Síndrome de Gilbert (eleva indireta, benigna)", "Hemólise (anemias hemolíticas elevam indireta)", "Cirrose hepática", "Reação adversa a medicamentos"],
    causasBaixas: ["Doença arterial coronariana precoce (associada à perda de efeito antioxidante protetor da bilirrubina)", "Alta exposição ao estresse oxidativo severo"],
    interferentes: ["Exposição da amostra à luz (degrada bilirrubina, falso baixo)", "Jejum prolongado (pode elevar bilirrubina indireta)", "Medicamentos como paracetamol e esteroides"]
  },
  "Albumina Total e Frações": {
    ideal: "4,0 a 5,0 g/dL",
    sinaisAltos: ["Sede excessiva", "Pele seca", "Olhos secos", "Tontura", "Taquicardia leve (sintomas de desidratação)"],
    sinaisBaixos: ["Edema periférico (inchaço nas pernas e pés)", "Ascite (líquido no abdômen)", "Fadiga extrema", "Cãibras musculares", "Fraqueza", "Cabelos e unhas frágeis", "Má cicatrização", "Dificuldade de concentração"],
    causasAltas: ["Desidratação severa (hemoconcentração)", "Infusão intravenosa de albumina"],
    causasBaixas: ["Desnutrição proteica", "Síndrome nefrótica (perda renal)", "Cirrose hepática (síntese reduzida)", "Doenças inflamatórias intestinais (má absorção)", "Inflamação crônica severa (albumina é uma proteína de fase aguda negativa)"],
    interferentes: ["Desidratação", "Uso de corticosteroides (pode elevar)", "Gestação (dilucional, reduz)"]
  },
  "Proteínas Totais": {
    ideal: "6,5 a 8,0 g/dL",
    sinaisAltos: ["Sintomas de desidratação", "Dores ósseas (se mieloma)", "Suscetibilidade a infecções", "Fadiga"],
    sinaisBaixos: ["Edema", "Fadiga", "Perda de massa muscular", "Imunidade baixa", "Má cicatrização"],
    causasAltas: ["Mieloma múltiplo", "Infecções crônicas", "Desidratação", "Doenças autoimunes ativas"],
    causasBaixas: ["Má absorção intestinal", "Doença hepática", "Síndrome nefrótica", "Desnutrição severa"],
    interferentes: ["Medicamentos hormonais", "Desidratação extrema", "Gravidez"]
  },
  "Pré-albumina (Transtirretina)": {
    ideal: "20 a 40 mg/dL",
    sinaisBaixos: ["Indica depleção proteica aguda", "Fadiga", "Perda de peso", "Má cicatrização"],
    causasBaixas: ["Desnutrição aguda", "Processo inflamatório sistêmico ativo (proteína de fase aguda negativa)", "Disfunção hepática crônica"],
    interferentes: ["Corticosteroides (elevam)", "Inflamação aguda (reduz)"]
  },
  "Proteína Ligadora de Retinol (RBP)": {
    ideal: "3,0 a 6,0 mg/dL",
    sinaisBaixos: ["Deficiência de vitamina A", "Problemas de visão noturna", "Pele seca"],
    causasBaixas: ["Deficiência dietética de vitamina A ou zinco (essencial para síntese)", "Desnutrição severa", "Doença renal ou hepática"],
    interferentes: ["Insuficiência renal (eleva falso)", "Inflamação (reduz)"]
  },
  "Tempo de Protrombina (TP/INR)": {
    ideal: "INR próximo a 1,0 (para indivíduos sem anticoagulação)",
    sinaisAltos: ["Sangramentos fáceis", "Hematomas sem trauma", "Sangramento gengival", "Sangue no nariz", "Cicatrização extremamente lenta"],
    causasAltas: ["Insuficiência hepática (redução na síntese de fatores de coagulação)", "Deficiência de Vitamina K", "Uso de anticoagulantes orais (ex: varfarina)", "Doença celíaca (má absorção de Vitamina K)"],
    interferentes: ["Uso de aspirina ou anticoagulantes", "Suplementação de altas doses de Vitamina K (reduz INR)", "Consumo excessivo de vegetais verdes escuros"]
  },
  "Ácido Úrico": {
    ideal: "Masculino: 3,50 - 6,00 mg/dL | Feminino: 3,00 – 4,70 mg/dL",
    sinaisAltos: ["Dores articulares severas (crise de gota, especialmente no dedão do pé)", "Inchaço e vermelhidão articular", "Cálculos renais (dor lombar cólica)", "Hipertensão", "Acidez metabólica", "Nefrolitíase"],
    sinaisBaixos: ["Geralmente assintomático; fadiga celular ou diminuição da proteção antioxidante", "Associado à doença de Wilson", "Associado à síndrome de Fanconi", "Associado à atrofia hepática"],
    causasAltas: ["Gota (artrite inflamatória)", "Aumento da ingestão de purinas", "Acidose", "Mieloma múltiplo", "Câncer metastático", "Quimioterapia", "Deficiência enzimática", "Alcoolismo", "Hiperlipoproteinemia", "Diabetes", "Hemólise", "Insuficiência renal", "Cálculos renais", "Cetoacidose", "Desidratação devido a diuréticos", "Hipotireoidismo", "Rabdomiólise (por exemplo, lesão do miocárdio)"],
    causasBaixas: ["Doença de Wilson", "Síndrome de Fanconi", "Atrofia hepática"],
    interferentes: ["Aspirina em altas doses (reduz)", "Alopurinol (reduz)", "Azatioprina (reduz)", "Clofibrato (reduz)", "Corticosteroides (reduzem)", "Estrogênio (reduz)", "Infusão de glicose (reduz)", "Guaifenesina (reduz)", "Manitol (reduz)", "Probenecida (reduz)", "Varfarina (reduz) (Pagana 2021)", "Diuréticos tiazídicos ou de alça (aumentam)", "Aspirina em baixas doses (aumenta)"]
  },
  "Amônia": {
    ideal: "15 a 45 µg/dL",
    sinaisAltos: ["Confusão mental", "Letargia", "Sonolência excessiva", "Irritabilidade", "Descoordenação motora", "Asterixe (tremor de batimento das mãos)", "Alterações de fala"],
    causasAltas: ["Cirrose hepática com encefalopatia portal", "Insuficiência hepática aguda", "Erros inatos do ciclo da ureia", "Uso de valproato de sódio", "Sangramento gastrointestinal massivo"],
    interferentes: ["Garroteamento prolongado ou atraso no processamento da amostra (eleva falso)", "Tabagismo ativo"]
  }
};
