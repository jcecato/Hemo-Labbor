import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const glicemicoKnowledge: Record<string, MarkerKnowledge> = {
  "Glicose em jejum": {
    ideal: "70 a 100 mg/dL (Otimizado: 75 a 85 mg/dL)",
    sinaisAltos: ["Sede excessiva (polidipsia)", "Aumento da frequência urinária (poliúria)", "Fadiga extrema", "Visão turva", "Cefaleia", "Dificuldade de concentração", "Cãibras", "Fome constante (polifagia)", "Perda de peso inexplicada", "Boca seca"],
    sinaisBaixos: ["Tremores nas mãos", "Sudorese fria", "Palpitações (taquicardia)", "Tontura e vertigem", "Nervosismo/Ansiedade", "Confusão mental", "Fome súbita e intensa", "Dor de cabeça", "Falta de coordenação", "Visão dupla"],
    causasAltas: ["Resistência à insulina", "Diabetes Tipo 2 ou Tipo 1", "Pré-diabetes", "Consumo excessivo de carboidratos refinados", "Sedentarismo", "Estresse crônico (cortisol elevado)", "Pancreatite", "Uso de corticosteroides"],
    causasBaixas: ["Excesso de insulina exógena ou hipoglicemiantes orais", "Jejum prolongado extremo", "Exercício físico extenuante prolongado sem aporte calórico", "Insuficiência adrenal ou hipofisária", "Insuflação hepática severa"],
    interferentes: ["Uso de corticosteroides (eleva)", "Jejum insuficiente ou superior a 16 horas", "Estresse agudo antes ou durante a coleta", "Consumo de álcool no dia anterior"]
  },
  "Insulina em jejum": {
    ideal: "3 a 10 µU/mL (Otimizado: 3 a 6 µU/mL)",
    sinaisAltos: ["Dificuldade extrema de emagrecimento", "Gordura abdominal acumulada", "Acantose nigricans (pescoço e axilas escurecidos)", "Letargia pós-prandial (sono após comer)", "Compulsão por doces/carboidratos", "Fadiga crônica", "Retenção hídrica", "Mudanças rápidas de humor", "Nevoeiro mental", "Pressão alta"],
    sinaisBaixos: ["Fadiga", "Perda de massa muscular (sarcopenia)", "Dificuldade de recuperação pós-treino", "Tendência a hipoglicemia de jejum se associada a baixa glicose", "Perda de peso involuntária"],
    causasAltas: ["Resistência à insulina", "Síndrome metabólica", "Obesidade visceral", "Inatividade física permanente", "Dieta hipercalórica e rica em açúcares", "Estresse crônico", "SOP (Síndrome do Ovário Policístico)"],
    causasBaixas: ["Diabetes Tipo 1 (destruição autoimune de células beta)", "Diabetes Tipo 2 em fase tardia (falência pancreática)", "Alta sensibilidade à insulina (comum em atletas de endurance - saudável se glicose ideal)"],
    interferentes: ["Uso de biotina", "Medicamentos como corticoides ou hormônio do crescimento", "Exercício físico vigoroso agudo antes do exame"]
  },
  "Índice de Triglicerídeos-Glicose (TyG)": {
    ideal: "< 4,5",
    sinaisAltos: ["Resistência à insulina", "Ganho de peso abdominal (visceral)", "Fadiga pós-prandial", "Sonolência diurna", "Compulsão por doces e massas", "Acantose nigricans", "Esteatose hepática", "Hipertensão arterial", "Retenção de líquidos", "Dificuldade de perda de peso"],
    sinaisBaixos: ["Alta sensibilidade à insulina", "Flexibilidade metabólica", "Níveis de energia estáveis", "Facilidade para emagrecer", "Ausência de compulsão alimentar", "Bom perfil lipídico", "Baixo risco cardiovascular", "Boa saciedade", "Pressão arterial saudável"],
    causasAltas: ["Resistência à insulina", "Dieta rica em carboidratos refinados", "Consumo excessivo de ultraprocessados", "Sedentarismo", "Estresse crônico", "Obesidade visceral", "Privação crônica de sono", "Disbiose intestinal", "Predisposição genética", "Hipotireoidismo não compensado", "Sarcopenia"],
    causasBaixas: ["Alta sensibilidade à insulina", "Excelente condicionamento físico e muscular", "Restrição saudável de carboidratos refinados"],
    interferentes: ["Jejum inadequado", "Consumo de álcool nas últimas 72h", "Exercício físico extenuante pré-exame", "Uso de medicamentos hipolipemiantes", "Uso de hipoglicemiantes orais", "Uso de corticoides", "Infecções agudas", "Erros de coleta ou processamento", "Refeição rica em gorduras no dia anterior", "Desidratação"]
  },
  "Hemoglobina Glicada (HbA1c)": {
    ideal: "Abaixo de 5,3% (Otimizado: 4,6% a 5,2%)",
    sinaisAltos: ["Cansaço constante", "Letargia mental", "Má cicatrização", "Infecções recorrentes (ex.: candidíase)", "Dificuldade visual sutil", "Fome constante", "Retenção de líquidos", "Dores nas pernas"],
    sinaisBaixos: ["Sinais de hipoglicemia frequente se associada a níveis baixos de glicose", "Fadiga crônica"],
    causasAltas: ["Hiperglicemia crônica", "Resistência à insulina estabelecida", "Pré-diabetes ou Diabetes Mellitus", "Estresse oxidativo e inflamação celular crônica", "Sedentarismo crônico"],
    causasBaixas: ["Anemias hemolíticas (menor tempo de vida das hemácias, gerando falso baixo)", "Hemorragias recentes ou transfusões de sangue", "Gravidez (por aumento de eritropoese)"],
    interferentes: ["Anemia ferropriva (pode elevar falsamente o resultado)", "Uso de altas doses de vitamina C ou E", "Presença de hemoglobinas variantes"]
  },
  "HOMA-IR": {
    ideal: "< 2,0 (Otimizado: < 1,5)",
    sinaisAltos: ["Gordura visceral proeminente", "Dificuldade extrema em perder peso", "Letargia e fadiga crônica", "Compulsão por alimentos doces", "Sinais clínicos de resistência insulínica (acantose, acrocórdons)", "Inchaço corporal generalizado"],
    sinaisBaixos: ["Excelente sensibilidade periférica à insulina", "Ótima flexibilidade metabólica", "Energia estável e sustentada ao longo do dia"],
    causasAltas: ["Resistência insulínica sistêmica", "Síndrome metabólica", "Obesidade central visceral", "Sedentarismo severo", "Ingestão excessiva de açúcares simples e óleos inflamatórios"],
    causasBaixas: ["Excelente condicionamento físico e muscular", "Sensibilidade insulínica ótima celular", "Restrição saudável de carboidratos refinados"],
    interferentes: ["Qualquer fator que altere agudamente a glicose ou a insulina de jejum"]
  },
  "C-Peptídeo": {
    ideal: "0,8 a 3,1 ng/mL",
    sinaisAltos: ["Inchaço", "Dificuldade de emagrecimento", "Hipertensão", "Fadiga", "Marcadores de hiperinsulinismo"],
    sinaisBaixos: ["Fadiga severa", "Perda de peso rápida e involuntária", "Sintomas clássicos de perda de controle glicêmico (poliúria/polidipsia)"],
    causasAltas: ["Hiperinsulinismo endógeno compensatório", "Resistência insulínica severa", "Insulinoma", "Insuficiência renal (eliminação diminuída)"],
    causasBaixas: ["Diabetes Tipo 1", "Falência pancreática de células beta no Diabetes Tipo 2 tardio", "Pancreatectomia"],
    interferentes: ["Insuficiência renal (eleva falso)"]
  },
  "Frutosamina": {
    ideal: "180 a 230 µmol/L (Reflete controle glicêmico das últimas 2-3 semanas)",
    sinaisAltos: ["Sintomas de hiperglicemia de curto prazo", "Fadiga", "Flutuações de humor e energia"],
    causasAltas: ["Descompensação glicêmica recente (últimas semanas)", "Diabetes descompensado"],
    causasBaixas: ["Níveis muito baixos de proteínas plasmáticas (desnutrição ou perda renal)", "Excelente controle glicêmico recente"],
    interferentes: ["Hipoproteinemia ou síndrome nefrótica (falso baixo)"]
  },
  "Adiponectina": {
    ideal: "> 10 µg/mL",
    sinaisBaixos: ["Resistência à insulina", "Aterosclerose acelerada", "Dores inflamatórias sistêmicas", "Dificuldade em perder gordura visceral"],
    causasBaixas: ["Obesidade central", "Sedentarismo", "Dieta inflamatória ultraprocessada", "Gordura visceral"],
    interferentes: ["Uso de tiazolidinedionas (ex: pioglitazona - elevam adiponectina)"]
  },
  "Leptina": {
    ideal: "Homens: 2 a 5 ng/mL | Mulheres: 5 a 15 ng/mL",
    sinaisAltos: ["Resistência à leptina (fome constante, ausência de saciedade)", "Dificuldade em manter dietas", "Metabolismo lento"],
    causasAltas: ["Excesso de tecido adiposo (obesidade)", "Hiperleptinemia por resistência central à sinalização de saciedade"],
    causasBaixas: ["Baixa gordura corporal extrema (atletas de alta performance)", "Sinalização de fome intensa constante"],
    interferentes: ["Restrição calórica severa aguda (reduz temporariamente)", "Flutuações de peso agudas"]
  }
};
