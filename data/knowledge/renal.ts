import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const renalKnowledge: Record<string, MarkerKnowledge> = {
  "Creatinina Sérica": {
    ideal: "Homens: 0,7 a 1,0 mg/dL | Mulheres: 0,6 a 0,9 mg/dL",
    sinaisAltos: ["Fadiga", "Edema (inchaço nas pernas e ao redor dos olhos)", "Hipertensão arterial não controlada", "Náuseas e vômitos", "Oligúria (redução do volume de urina)", "Dispneia (falta de ar)", "Prurido generalizado na pele", "Confusão mental sutil", "Fraqueza geral", "Gosto metálico na boca"],
    sinaisBaixos: ["Perda de massa muscular (sarcopenia)", "Fraqueza física generalizada", "Letargia sutil", "Emagrecimento com perda muscular"],
    causasAltas: ["Insuficiência renal aguda ou crônica", "Desidratação moderada a grave", "Obstrução do trato urinário (cálculos, próstata)", "Consumo massivo de proteínas ou creatina suplementar", "Rabdomiólise (destruição muscular intensa)", "Hipertensão severa não controlada", "Diabetes Mellitus de longo prazo", "Uso de medicamentos nefrotóxicos (AINEs)"],
    causasBaixas: ["Baixa massa muscular corporal total (sarcopenia, caquexia)", "Doença hepática severa (redução da síntese de creatina)", "Desnutrição proteica crônica", "Gravidez (por hemodiluição fisiológica)"],
    interferentes: ["Uso de suplemento de creatina (pode elevar sutilmente sem lesão de filtragem)", "AINEs, antibióticos (podem elevar)", "Massa muscular extrema (fisioculturismo - eleva basal)"]
  },
  "Creatinina Sérica + eTFG": {
    ideal: "Homens: 0,7 a 1,0 mg/dL | Mulheres: 0,6 a 0,9 mg/dL (eTFG > 85 mL/min/1.73m²)",
    sinaisAltos: ["Fadiga", "Edema (inchaço nas pernas e ao redor dos olhos)", "Hipertensão arterial não controlada", "Náuseas e vômitos", "Oligúria (redução do volume de urina)", "Dispneia (falta de ar)", "Prurido generalizado na pele", "Confusão mental sutil", "Fraqueza geral", "Gosto metálico na boca"],
    sinaisBaixos: ["Perda de massa muscular (sarcopenia)", "Fraqueza física generalizada", "Letargia sutil", "Emagrecimento com perda muscular"],
    causasAltas: ["Insuficiência renal aguda ou crônica", "Desidratação moderada a grave", "Obstrução do trato urinário (cálculos, próstata)", "Consumo massivo de proteínas ou creatina suplementar", "Rabdomiólise (destruição muscular intensa)", "Hipertensão severa não controlada", "Diabetes Mellitus de longo prazo", "Uso de medicamentos nefrotóxicos (AINEs)"],
    causasBaixas: ["Baixa massa muscular corporal total (sarcopenia, caquexia)", "Doença hepática severa (redução da síntese de creatina)", "Desnutrição proteica crônica", "Gravidez (por hemodiluição fisiológica)"],
    interferentes: ["Uso de suplemento de creatina", "AINEs, antibióticos", "Massa muscular extrema"]
  },
  "Ritmo de Filtração Glomerular (eTFG)": {
    ideal: "> 85 mL/min/1.73m²",
    sinaisAltos: ["Geralmente sem relevância clínica direta (hiperfiltração inicial pode ocorrer no diabetes precoce)"],
    sinaisBaixos: ["Fadiga persistente", "Edema (retensão de líquido/inchaço)", "Pressão alta", "Pele seca", "Urina espumosa ou escura", "Náuseas", "Cãibras recorrentes", "Névoa mental"],
    causasAltas: ["Hiperfiltração glomerular precoce (fase inicial de nefropatia diabética)", "Gravidez (fisiológico)"],
    causasBaixas: ["Doença Renal Crônica (DRC)", "Desidratação severa", "Hipertensão arterial crônica", "Diabetes Mellitus", "Glomerulonefrite", "Uso crônico de AINEs ou medicamentos nefrotóxicos"],
    interferentes: ["Idade avançada (declínio fisiológico natural)", "Massa muscular reduzida extrema (pode superestimar a eTFG real baseada em creatinina)", "Dieta hiperproteica recente"]
  },
  "Ureia Sérica": {
    ideal: "15 a 35 mg/dL",
    sinaisAltos: ["Náuseas e vômitos", "Confusão mental / Dificuldade de concentração", "Fadiga extrema", "Prurido generalizado", "Irritabilidade", "Perda de apetite (anorexia)", "Gosto metálico na boca", "Hipertensão arterial", "Edema periférico", "Hálito com cheiro de amônia"],
    sinaisBaixos: ["Sem sintomas característicos diretos; pode estar associado a leve cansaço por perda de aminoácidos"],
    causasAltas: ["Insuficiência renal aguda ou crônica", "Ingestão excessiva de proteínas dietéticas", "Desidratação severa (ureia eleva mais rápido que creatinina)", "Sangramento gastrointestinal alto (absorção de sangue no estômago/intestino)", "Catabolismo tecidual aumentado (febre, infecções severas)", "Uso de corticosteroides"],
    causasBaixas: ["Dieta extremamente pobre em proteínas (ou vegetariana estrita não suplementada)", "Doença hepática severa (redução do ciclo da ureia)", "Hiper-hidratação (hemodiluição)", "Gravidez (por aumento do clearance e diluição)"],
    interferentes: ["Uso de corticosteroides (aumenta por catabolismo proteico)", "Grandes flutuações na ingestão proteica nas 24-48h antes da coleta"]
  },
  "Cistatina C": {
    ideal: "< 0,8 mg/L",
    sinaisAltos: ["Mesmos sintomas de filtração glomerular comprometida (fadiga, edema sutil)"],
    causasAltas: ["Disfunção renal precoce (marcador mais sensível que creatinina em estágios iniciais)", "Disfunção tireoidiana (hipertireoidismo pode elevar)", "Uso de corticosteroides"],
    interferentes: ["Corticosteroides (elevam)", "Disfunções severas da tireoide"]
  },
  "Bicarbonato (HCO3)": {
    ideal: "22 a 26 mEq/L",
    sinaisAltos: ["Lentidão respiratória (compensação de alcalose)", "Confusão mental", "Tremores", "Náuseas e tontura"],
    sinaisBaixos: ["Respiração rápida e profunda (Kussmaul para eliminar CO2)", "Fadiga extrema", "Fraqueza muscular", "Névoa mental", "Cefaleia"],
    causasAltas: ["Alcalose metabólica", "Perda de ácidos (vômitos prolongados ou uso excessivo de diuréticos de alça)", "Uso excessivo de bicarbonato exógeno"],
    causasBaixas: ["Acidose metabólica", "Insuficiência renal crônica (rins não reabsorvem HCO3)", "Cetoacidose diabética", "Acidose lática", "Diarreia crônica severa (perda intestinal)"],
    interferentes: ["Exposição da amostra ao ar (perda de CO2 diluído)", "Garroteamento prolongado"]
  },
  "Beta-2-Microglobulina Sérica": {
    ideal: "< 2,5 mg/L",
    sinaisAltos: ["Sinais de ativação do sistema linfático ou inflamatório", "Fadiga", "Dores ósseas"],
    causasAltas: ["Insuficiência renal (filtração prejudicada)", "Linfomas, leucemias ou mieloma múltiplo", "Doenças inflamatórias crônicas ativas"],
    interferentes: ["Infecções virais agudas"]
  },
  "Anion Gap": {
    ideal: "8 a 12 mmol/L",
    sinaisAltos: ["Sintomas de acidose metabólica (respiração rápida, cansaço, confusão)"],
    causasAltas: ["Presença de ácidos não medidos no sangue (Cetoacidose diabética, acidose lática, intoxicação por salicilatos, metanol)", "Insuficiência renal severa (retenção de sulfatos e fosfatos)"],
    interferentes: ["Alterações severas de albumina plasmática (albumina baixa reduz o anion gap calculado)"]
  },
  "CO2 Sérico": {
    ideal: "26 a 31 mmol/L",
    sinaisAltos: ["Sinais de retenção de CO2 (sonolência, cefaleia matinal, tontura)"],
    causasAltas: ["Alcalose metabólica compensada", "Doença pulmonar obstrutiva crônica (DPOC - retenção de CO2)"],
    causasBaixas: ["Acidose metabólica", "Hiperventilação alveolar (eliminação excessiva de CO2)"],
    interferentes: ["Processamento inadequado da amostra (deve estar em tubo fechado e vedado)"]
  },
  "Creatinina Urinária": {
    ideal: "Homens: 1000 a 2000 mg/24h | Mulheres: 600 a 1500 mg/24h",
    sinaisBaixos: ["Pode indicar fadiga renal se associada a creatinina sérica elevada"],
    causasBaixas: ["Insuficiência renal", "Baixa massa muscular severa"],
    interferentes: ["Coleta inadequada de urina de 24h (erros de volume total)"]
  },
  "Microalbuminúria": {
    ideal: "< 15 mg/g de creatinina (Otimizado)",
    sinaisAltos: ["Inchaço sutil nos pés/pernas (em perdas maiores)", "Urina com espuma excessiva"],
    causasAltas: ["Nefropatia diabética incipiente (lesão precoce)", "Hipertensão arterial", "Disfunção endotelial generalizada", "Glomerulonefrite inicial"],
    interferentes: ["Exercício físico intenso nas 24h antes do exame", "Infecção urinária ativa", "Febre aguda"]
  },
  "Proteinúria": {
    ideal: "< 100 mg/dia (Na urina de 24h ou amostra isolada corrigida)",
    sinaisAltos: ["Urina muito espumosa que demora a dissipar", "Edema facial (especialmente pálpebras de manhã)", "Inchaço nas pernas e tornozelos", "Fadiga", "Perda de apetite"],
    causasAltas: ["Nefropatia diabética ou hipertensiva estabelecida", "Glomerulonefrites crônicas ou agudas", "Lúpus eritematoso sistêmico (nefrite lúpica)", "Mieloma múltiplo (proteínas de Bence Jones)"],
    interferentes: ["Exercício vigoroso recente", "Infecção do trato urinário", "Contaminação da amostra com secreções vaginais"]
  },
  "Osmolalidade Urinária": {
    ideal: "500 a 800 mOsm/kg",
    sinaisAltos: ["Urina muito escura, concentrada e com forte odor"],
    sinaisBaixos: ["Urina extremamente diluída, quase incolor, poliúria severa"],
    causasAltas: ["Desidratação", "SIADH", "Insuficiência cardíaca ou cirrose (retenção de água livre)"],
    causasBaixas: ["Diabetes insipidus (deficiência ou resistência ao ADH)", "Ingestão excessiva de água (polidipsia primária)", "Necrose tubular aguda em fase de recuperação"],
    interferentes: ["Uso de diuréticos", "Uso de contrastes radiológicos"]
  },
  "Beta-2-Microglobulina Urinária": {
    ideal: "< 0,3 mg/L",
    sinaisAltos: ["Sinais de disfunção tubular renal"],
    causasAltas: ["Lesão tubular renal (nefrite intersticial, toxicidade por metais pesados)", "Uso de medicamentos nefrotóxicos", "Rejeição de transplante renal"],
    interferentes: ["Urina ácida (pH < 6,0 desintegra a beta-2-microglobulina rapidamente na bexiga; amostras devem ser alcalinizadas antes ou colhidas rapidamente)"]
  },
  "Osmolaridade Sérica": {
    ideal: "285 a 290 mOsm/kg",
    sinaisAltos: ["Desidratação", "Boca seca", "Sede intensa", "Letargia", "Fraqueza", "Confusão mental", "Pele seca", "Olhos secos", "Diminuição do suor", "Taquicardia"],
    sinaisBaixos: ["Dor de cabeça", "Náuseas e vômitos", "Confusão", "Cãibras musculares", "Fraqueza", "Letargia", "Inchaço cerebral (casos graves)", "Espasmos", "Convulsões", "Apatia"],
    causasAltas: ["Desidratação grave", "Diabetes insipidus", "Hiperglicemia severa", "Uremia", "Intoxicação por etanol/metanol/etilenoglicol", "Hipernatremia", "Perda renal de água livre", "Diurese osmótica", "Sudorese excessiva", "Queimaduras graves"],
    causasBaixas: ["Hiponatremia de diluição", "SIADH (Síndrome de Secreção Inapropriada de ADH)", "Ingestão excessiva de água (polidipsia primária)", "Insuficiência adrenal", "Hipotireoidismo", "Insuficiência cardíaca congestiva", "Cirrose hepática com ascite", "Síndrome nefrótica", "Uso de diuréticos tiazídicos", "Perda de sódio renal ou extra-renal"],
    interferentes: ["Hiperglicemia", "Uremia", "Ingestão recente de álcool", "Uso de manitol", "Uso de diuréticos", "Lipemia severa", "Atraso no processamento da amostra"]
  }
};
