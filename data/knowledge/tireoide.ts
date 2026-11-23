import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const tireoideKnowledge: Record<string, MarkerKnowledge> = {
  "TSH": {
    ideal: "1 a 2 mU/L",
    sinaisAltos: ["Fadiga", "Ganho de peso", "Intolerância ao frio", "Constipação", "Pele seca", "Queda de cabelo", "Bradicardia", "Irregularidade menstrual", "Depressão", "Mixedema"],
    sinaisBaixos: ["Palpitações", "Perda de peso", "Intolerância ao calor", "Insônia", "Ansiedade", "Tremores nas mãos", "Diarreia", "Suor excessivo", "Fraqueza muscular", "Bócio"],
    causasAltas: ["Tireoidite de Hashimoto", "Hipotireoidismo primário", "Deficiência de iodo", "Resistência ao hormônio tireoidiano", "Adenoma hipofisário secretor de TSH"],
    causasBaixas: ["Doença de Graves", "Hipertireoidismo primário", "Tireoidite subaguda", "Uso excessivo de hormônio tireoidiano", "Insuficiência hipofisária (Hipotireoidismo secundário)"],
    interferentes: ["Biotina (pode causar falso baixo)", "Amiodarona", "Lítio", "Contrastes iodados", "Glicocorticoides", "Dopamina"]
  },
  "T4 Total": {
    ideal: "6,00 - 10,00 µg/dL",
    sinaisAltos: ["Taquicardia", "Tremores", "Suores", "Ansiedade", "Insônia", "Fadiga", "Perda de peso", "Hiperatividade", "Fraqueza muscular", "Calor constante"],
    sinaisBaixos: ["Fadiga", "Lentidão mental", "Pele seca", "Constipação", "Ganho de peso", "Frio constante", "Fraqueza", "Cãibras", "Queda de cabelo", "Dificuldade de concentração"],
    causasAltas: ["Hipertireoidismo (Graves)", "Tireoidite", "Aumento da globulina de ligação da tiroxina (TBG) por gravidez ou anticoncepcionais", "Bócio nodular tóxico", "Suplementação excessiva"],
    causasBaixas: ["Hipotireoidismo (Hashimoto)", "Deficiência de iodo", "Redução de TBG (doença hepática ou renal)", "Desnutrição", "Hipotireoidismo secundário ou terciário"],
    interferentes: ["Gravidez (eleva total)", "Anticoncepcionais orais (elevam total)", "Salicilatos, fenitoína (reduzem total)", "Corticosteroides"]
  },
  "T4 Livre": {
    ideal: "1,0 a 1,2 ng/dL",
    sinaisAltos: ["Taquicardia", "Tremores", "Suores", "Ansiedade", "Insônia", "Fadiga", "Perda de peso", "Hiperatividade", "Fraqueza muscular", "Calor constante"],
    sinaisBaixos: ["Fadiga", "Lentidão mental", "Pele seca", "Constipação", "Ganho de peso", "Frio constante", "Fraqueza", "Cãibras", "Queda de cabelo", "Dificuldade de concentração"],
    causasAltas: ["Hipertireoidismo", "Tireoidite", "Excesso de reposição de levotiroxina", "Bócio nodular tóxico"],
    causasBaixas: ["Hipotireoidismo", "Deficiência severa de iodo", "Desnutrição", "Hipotireoidismo secundário"],
    interferentes: ["Biotina (pode causar falso alto)", "Aspirina", "Heparina", "Anticonvulsivantes"]
  },
  "T3 Total": {
    ideal: "90,00 - 168,00 ng/dL",
    sinaisAltos: ["Ansiedade", "Tremores", "Palpitações", "Perda de peso", "Insônia", "Intolerância ao calor", "Sudorese", "Fadiga", "Fraqueza muscular", "Irritabilidade"],
    sinaisBaixos: ["Fadiga crônica", "Ganho de peso", "Lentidão", "Frio constante", "Constipação", "Pele seca", "Queda de cabelo", "Pernas pesadas", "Dificuldade para emagrecer", "Névoa mental (brain fog)"],
    causasAltas: ["Hipertireoidismo", "T3-toxicose", "Aumento da TBG", "Tireoidite", "Reposição excessiva de T3 ou T4"],
    causasBaixas: ["Hipotireoidismo", "Síndrome do T3 doente (eutireoidiano doente)", "Doença não tireoidiana sistêmica", "Desnutrição", "Redução de TBG"],
    interferentes: ["Estrogênios, gravidez (elevam total)", "Androgênios, corticosteroides (reduzem total)", "Biotina"]
  },
  "T3 Livre": {
    ideal: "3,0 a 4,0 pg/mL",
    sinaisAltos: ["Ansiedade", "Tremores", "Palpitações", "Perda de peso", "Insônia", "Intolerância ao calor", "Sudorese", "Fadiga", "Fraqueza muscular", "Irritabilidade"],
    sinaisBaixos: ["Fadiga crônica", "Ganho de peso", "Lentidão", "Frio constante", "Constipação", "Pele seca", "Queda de cabelo", "Pernas pesadas", "Dificuldade para emagrecer", "Névoa mental (brain fog)"],
    causasAltas: ["Hipertireoidismo", "T3-toxicose", "Reposição excessiva de T3 ou T4"],
    causasBaixas: ["Hipotireoidismo", "Baixa conversão de T4 para T3 (deficiência de selênio, zinco, estresse, inflamação)", "Síndrome de T3 doente", "Desnutrição crônica"],
    interferentes: ["Biotina (pode causar falso alto)", "Medicamentos anti-tireoidianos", "Amiodarona", "Propranolol (reduz conversão de T4 para T3)"]
  },
  "T3 Reverso (rT3)": {
    ideal: "<25 ng/dL",
    sinaisAltos: ["Sintomas de hipotireoidismo mesmo com exames normais", "Fadiga extrema", "Inabilidade para perder peso", "Metabolismo extremamente lento", "Temperatura corporal baixa", "Dificuldade de concentração", "Prisão de ventre", "Pele e cabelos secos", "Falta de motivação", "Retenção hídrica"],
    sinaisBaixos: ["Não apresenta significado clínico adverso direto; indica bom equilíbrio de conversão hormonal"],
    causasAltas: ["Estresse físico ou psicológico crônico (eixo HPA ativado)", "Inflamação crônica (citocinas elevadas)", "Restrição calórica severa ou jejum prolongado", "Deficiência de ferro, selênio, zinco", "Disfunção hepática ou renal", "Uso de corticosteroides ou betabloqueadores"],
    causasBaixas: ["Ótimo estado nutricional", "Ausência de estresse crônico sistêmico", "Função hepática e renal plenamente saudáveis"],
    interferentes: ["Propranolol, amiodarona, corticosteroides (elevam)", "Jejum prolongado (eleva)"]
  },
  "Anti-tPO (Anticorpos Anti-Tireoperoxidase)": {
    ideal: "0,00 - 7,00 UI/mL",
    sinaisAltos: ["Bócio (aumento da tireoide)", "Presença de sintomas de hipo ou hipertireoidismo", "Sintomas flutuantes (ansiedade seguidos de fadiga)", "Inchaço na região anterior do pescoço", "Sensação de aperto no pescoço", "Mudança na voz (rouquidão leve)", "Dificuldade para engolir (raro)"],
    sinaisBaixos: ["Ausência de processo autoimune tireoidiano", "Boa homeostase imunológica"],
    causasAltas: ["Tireoidite de Hashimoto", "Doença de Graves", "Lúpus ou outras doenças autoimunes concomitantes", "Predisposição genética autoimune", "Ativação imunológica por gatilhos intestinais ou infecções"],
    causasBaixas: ["Função imunológica saudável e tolerância autoimune normal"],
    interferentes: ["Uso recente de imunossupressores", "Biotina", "Coleta pós-prandial gordurosa"]
  }
};
