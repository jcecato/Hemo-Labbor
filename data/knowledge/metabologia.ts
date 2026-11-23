import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const metabologiaKnowledge: Record<string, MarkerKnowledge> = {
  "Cortisol Sérico": {
    ideal: "3 a 15 µg/dL (Manhã, ~08h)",
    sinaisAltos: ["Ansiedade", "Insônia (acordar de madrugada)", "Ganho de peso abdominal", "Hipertensão", "Fadiga crônica", "Estrias purpúreas", "Imunossupressão", "Fraqueza muscular"],
    sinaisBaixos: ["Fadiga crônica extrema", "Dificuldade de acordar", "Hipotensão arterial", "Desejo por sal", "Hipoglicemia", "Apatia", "Perda de peso", "Tontura ortostática"],
    causasAltas: ["Estresse crônico", "Síndrome de Cushing", "Uso prolongado de corticoides", "Privação de sono", "Inflamação crônica"],
    causasBaixas: ["Insuficiência adrenal primária (Doença de Addison)", "Fadiga adrenal (hipofunção por estresse crônico burnout)", "Hipopituitarismo"],
    interferentes: ["Uso de corticosteroides (orais, inalatórios, tópicos)", "Estrogênios (pílula anticoncepcional eleva cortisol total)", "Estresse agudo na coleta"]
  },
  "Cortisol Salivar - Amostra Manhã (07:00 e 09:00)": {
    ideal: "0,25 a 0,60 mcg/dL",
    sinaisAltos: ["Acordar ansioso", "Hiperativação matinal", "Insônia", "Fadiga à tarde"],
    sinaisBaixos: ["Extrema fadiga matinal", "Inércia do sono", "Pressão baixa ao levantar", "Desejo por café"],
    causasAltas: ["Estresse agudo", "Estresse crônico em fase de alarme", "Falta de sono"],
    causasBaixas: ["Exaustão adrenal (burnout)", "Hipofunção do eixo HPA", "Uso recente de corticoides"],
    interferentes: ["Sangramento gengival", "Escovação de dentes antes da coleta", "Comida ou bebida 30 min antes"]
  },
  "Cortisol Salivar - Amostra Noite (23:00-24:00)": {
    ideal: "< 0,08 mcg/dL",
    sinaisAltos: ["Insônia de início", "Mente agitada à noite (wired but tired)", "Ganho de peso visceral", "Desejo por doces à noite"],
    sinaisBaixos: ["Nível saudável ideal de relaxamento noturno"],
    causasAltas: ["Estresse noturno", "Exposição a luz azul tardia", "Exercício físico intenso à noite", "Síndrome de Cushing"],
    causasBaixas: ["Padrão circadiano saudável"],
    interferentes: ["Uso de cremes esteroides", "Consumo de cafeína tarde do dia", "Higiene oral incorreta antes da coleta"]
  },
  "Catecolaminas": {
    ideal: "Adrenalina: < 20 pg/mL | Noradrenalina: 110 - 410 pg/mL | Dopamina: < 30 pg/mL",
    sinaisAltos: ["Palpitações", "Hipertensão", "Suores frios", "Cefaleia intensa", "Ansiedade aguda", "Pânico"],
    causasAltas: ["Feocromocitoma", "Estresse agudo extremo", "Exercício extenuante recente", "Disautonomia"],
    interferentes: ["Uso de descongestionantes, antidepressivos", "Consumo de café, bananas, chocolate e baunilha antes do teste", "Estresse da agulha na coleta"]
  },
  "DHEA-S": {
    ideal: "Homens: 250 a 400 µg/dL | Mulheres: 150 a 250 µg/dL",
    sinaisAltos: ["Acne", "Hirsutismo (excesso de pelos em mulheres)", "Oleosidade da pele", "Irregularidade menstrual", "Irritabilidade"],
    sinaisBaixos: ["Baixa libido", "Fadiga crônica", "Perda de massa muscular", "Dificuldade de recuperação física", "Apatia", "Pele fina"],
    causasAltas: ["Hiperplasia adrenal congênita", "SOP (Síndrome do Ovário Policístico)", "Tumores adrenais", "Estresse agudo prolongado (fase de compensação)"],
    causasBaixas: ["Envelhecimento natural (adrenopausa)", "Exaustão adrenal severa", "Uso de corticosteroides"],
    interferentes: ["Biotina", "Suplementação de DHEA", "Corticosteroides"]
  },
  "Testosterona Total": {
    ideal: "Homens: 500 a 800 ng/dL | Mulheres: 30 a 50 ng/dL",
    sinaisAltos: ["Homens: irritabilidade, calvície | Mulheres: hirsutismo, acne, queda de cabelo, voz mais grave, SOP"],
    sinaisBaixos: ["Fadiga", "Perda de massa muscular (sarcopenia)", "Ganho de gordura", "Baixa libido", "Disfunção erétil", "Depressão/Apatia", "OSTEOPOROSE"],
    causasAltas: ["Suplementação exógena", "Tumores testiculares ou ovarianos/adrenais", "SOP (em mulheres)"],
    causasBaixas: ["Hipogonadismo", "Envelhecimento (andropausa)", "Estresse crônico (desvio de pregnenolona)", "Obesidade", "Deficiência de zinco/vitamina D"],
    interferentes: ["Medicamentos hormonais", "Estatinas (pode reduzir sutilmente)", "Estresse crônico", "Jejum extremo"]
  },
  "Testosterona Livre": {
    ideal: "Homens: 12 a 20 pg/mL | Mulheres: 0.5 a 1.0 pg/mL",
    sinaisAltos: ["Sintomas de excesso androgênico (acne, pelos, agressividade)"],
    sinaisBaixos: ["Fadiga crônica", "Dificuldade de ganho de massa muscular", "Perda de libido", "Falta de foco e motivação"],
    causasAltas: ["Suplementação", "Baixa SHBG (deixa mais fração livre)"],
    causasBaixas: ["Hipogonadismo", "SHBG elevada (sequestra a testosterona)", "Estresse crônico", "Falta de sono"],
    interferentes: ["Variações diárias (deve colher de manhã)", "Nível de SHBG"]
  },
  "SHBG": {
    ideal: "Homens: 20 a 50 nmol/L | Mulheres: 40 a 90 nmol/L",
    sinaisAltos: ["Sintomas de testosterona baixa (mesmo com total normal)", "Fadiga", "Baixa libido"],
    sinaisBaixos: ["Sintomas de excesso de androgênios", "Acne", "Oleosidade", "Irregularidade menstrual"],
    causasAltas: ["Excesso de estrogênio", "Hipertireoidismo", "Envelhecimento", "Cirrose hepática", "Jejum prolongado/restrição calórica"],
    causasBaixas: ["Resistência à insulina / Hiperinsulinemia", "Obesidade", "Hipotireoidismo", "Uso de andrógenos/anabolizantes", "Síndrome metabólica"],
    interferentes: ["Anticoncepcionais orais (elevam fortemente)", "Uso de testosterona (reduz)"]
  },
  "Estradiol (E2)": {
    ideal: "Homens: < 30 pg/mL | Mulheres: variável conforme fase do ciclo (Folicular: 30-100, Ovulatória: 100-400, Lútea: 50-150, Menopausa: < 20 pg/mL)",
    sinaisAltos: ["Homens: ginecomastia, acúmulo de gordura no quadril, perda de ereção | Mulheres: TPM severa, mastalgia, retenção hídrica, miomas"],
    sinaisBaixos: ["Mulheres: fogachos, secura vaginal, depressão, perda óssea, pele seca | Homens: fadiga, perda de densidade óssea, dores articulares"],
    causasAltas: ["Obesidade (maior aromatização periférica)", "Suplementação de testosterona sem controle de aromatização", "Exposição a xenoestrogênios", "Disfunção ovariana"],
    causasBaixas: ["Menopausa / Insuficiência ovariana prematura", "Uso de inibidores de aromatase (ex: anastrozol)", "Anorexia severa"],
    interferentes: ["Inibidores da aromatase", "Anticoncepcionais orais", "Suplementação hormonal"]
  },
  "Progesterona": {
    ideal: "Homens: < 0,5 ng/mL | Mulheres (Fase Lútea ideal): 10 a 20 ng/mL",
    sinaisBaixos: ["Predominância estrogênica, TPM intensa, ansiedade, insônia, abortos de repetição, menstruação irregular"],
    causasBaixas: ["Ciclos anovulatórios (frequentes na perimenopausa e SOP)", "Insuficiência lútea", "Estresse crônico (roubo de progesterona para cortisol)"],
    interferentes: ["Uso de progesterona exógena", "Uso de anticoncepcionais orais (bloqueiam a produção natural)"]
  },
  "IGF-1": {
    ideal: "150 a 250 ng/mL (variável com idade, otimizado para adultos)",
    sinaisAltos: ["Acromegalia em excessos patológicos extremos", "Risco proliferativo celular aumentado"],
    sinaisBaixos: ["Fadiga", "Perda de densidade mineral óssea", "Dificuldade de hipertrofia", "Envelhecimento precoce", "Perda de elasticidade da pele"],
    causasAltas: ["Excesso de GH", "Dieta hiperproteica rica em laticínios", "Hiperinsulinemia"],
    causasBaixas: ["Deficiência de GH", "Hipotireoidismo", "Desnutrição proteica", "Doença hepática (fígado produz IGF-1)"],
    interferentes: ["Níveis de insulina", "Jejum prolongado (reduz)"]
  },
  "Lactato": {
    ideal: "< 1.0 mmol/L (Em repouso)",
    sinaisAltos: ["Fadiga muscular rápida", "Dores musculares pós-esforço", "Acidose metabólica leve se cronicamente elevado em repouso"],
    causasAltas: ["Disfunção mitocondrial", "Isquemia tecidual", "Exercício anaeróbico intenso recente", "Metabolismo glicolítico dominante"],
    interferentes: ["Garroteamento prolongado na coleta (eleva falso)", "Atividade física antes da coleta"]
  },
  "LDH (Lactato Desidrogenase)": {
    ideal: "140 a 200 U/L",
    sinaisAltos: ["Fadiga", "Dores musculares generalizadas", "Sinais de dano tecidual crônico"],
    causasAltas: ["Dano celular ou tecidual (lise celular)", "Hemólise na amostra", "Anemia megaloblástica ou hemolítica", "Infarto", "Doença hepática ou pulmonar", "Câncer"],
    causasBaixas: ["Exposição a radiação", "Consumo elevado de vitamina C (pode interferir na dosagem)"],
    interferentes: ["Hemólise da amostra (eleva drasticamente por presença eritrocitária)", "Congelamento da amostra"]
  },
  "Eletroforese de Proteínas Séricas": {
    ideal: "Padrão normal (Albumina: 55-65% | Alfa-1: 2-4% | Alfa-2: 7-10% | Beta: 9-13% | Gama: 12-20%)",
    sinaisAltos: ["Pico monoclonal (suspeita de mieloma)", "Sinais de inflamação crônica (gama/alfa elevadas)"],
    causasAltas: ["Mieloma múltiplo (pico monoclonal gama)", "Infecções crônicas ou autoimunidade (gama policlonal)", "Inflamação de fase aguda (alfa-1 e alfa-2 elevadas)"],
    interferentes: ["Lipemia ou hemólise na amostra"]
  },
  "CK (Creatina Quinase)": {
    ideal: "Homens: < 150 U/L | Mulheres: < 100 U/L",
    sinaisAltos: ["Dores musculares severas", "Fraqueza", "Urina avermelhada (rabdomiólise se extrema)", "Fadiga física extrema"],
    causasAltas: ["Dano ao músculo esquelético por exercício intenso (musculação)", "Trauma físico ou quedas", "Uso de estatinas (miopatia)", "Infarto agudo do miocárdio (fração CK-MB)"],
    interferentes: ["Atividade física vigorosa nas 48h antes da coleta", "Injeções intramusculares recentes"]
  },
  "Testosterona Livre e Biodisponível (Cálculo)": {
    ideal: "A Testosterona Livre representa tipicamente de 2% a 3% da Testosterona Total. A Biodisponível representa a fração livre somada à fração fracamente ligada à albumina (geralmente entre 30% a 50%).",
    sinaisAltos: ["Acne", "Agressividade", "Hirsutismo (em mulheres)", "Alopecia androgênica", "Aumento excessivo da libido", "Eritrocitose (hematócrito elevado)"],
    sinaisBaixos: ["Fadiga crônica", "Redução da libido", "Disfunção erétil ou ovariana", "Sarcopenia (perda de massa muscular)", "Névoa mental (brain fog)", "Osteopenia"],
    causasAltas: ["Reposição hormonal ou uso de anabolizantes exógenos", "Síndrome dos Ovários Policísticos (SOP)", "Tumores adrenais ou gonadais", "Condições que reduzem a SHBG (ex: resistência à insulina), aumentando a fração livre"],
    causasBaixas: ["Hipogonadismo primário ou secundário", "Obesidade severa", "Envelhecimento (Andropausa/Menopausa)", "Estresse crônico (eixo HPA hiperativo)", "Condições que elevam a SHBG (reduzindo a fração livre)"],
    interferentes: ["Alterações na Albumina (desnutrição, doenças hepáticas ou renais)", "Flutuações na SHBG (uso de anticoncepcionais orais, hipertireoidismo, restrição calórica severa)"]
  }
};
