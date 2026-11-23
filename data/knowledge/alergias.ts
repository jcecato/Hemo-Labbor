import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const alergiasKnowledge: Record<string, MarkerKnowledge> = {
  "IgA total": {
    ideal: "70 a 400 mg/dL (Indivíduos normais)",
    sinaisAltos: ["Sinais de inflamação de mucosas", "Problemas respiratórios ou gastrointestinais recorrentes"],
    sinaisBaixos: ["Suscetibilidade aumentada a infecções respiratórias ou gastrointestinais", "Alergias frequentes", "Doenças autoimunes recorrentes", "Falsos negativos em exames de anticorpos IgA para doença celíaca"],
    causasAltas: ["Infecções crônicas de mucosas", "Doenças hepáticas", "Doenças inflamatórias crônicas", "Algumas neoplasias hematológicas"],
    causasBaixas: ["Deficiência seletiva de IgA (condição genética)", "Imunodeficiência comum variável", "Uso de imunossupressores"],
    interferentes: ["Medicamentos imunossupressores", "Infecções agudas recentes"]
  },
  "Anti-Gliadina IgA/IgG (AGA)": {
    ideal: "< 20 U (Negativo)",
    sinaisAltos: ["Distensão abdominal", "Diarreia ou constipação crônica", "Névoa mental (brain fog)", "Fadiga extrema", "Dores nas articulações", "Erupções cutâneas (dermatite herpetiforme)", "Dificuldade em ganhar peso/perda ponderal"],
    causasAltas: ["Doença celíaca", "Sensibilidade ao glúten não celíaca", "Alergia ao trigo"],
    interferentes: ["Dieta sem glúten antes da coleta (pode negativar falso o exame)"]
  },
  "Anti-Transglutaminase IgA (tTG-IgA)": {
    ideal: "< 10 U (Negativo)",
    sinaisAltos: ["Dor de estômago crônica", "Diarreia crônica ou fezes pastosas", "Desnutrição", "Deficiência de ferro persistente", "Fadiga inexplicada", "Crescimento inadequado em crianças", "Dores ósseas"],
    causasAltas: ["Doença celíaca (altamente específico)", "Outras doenças autoimunes intestinais (raro)"],
    interferentes: ["Dieta isenta de glúten por semanas/meses antes do exame (causa falso negativo)", "Deficiência seletiva de IgA (causa falso negativo, deve colher IgG)"]
  },
  "Anti-Endomísio (EMA)": {
    ideal: "Negativo",
    sinaisAltos: ["Diarreia crônica", "Dor abdominal crônica", "Perda de peso involuntária", "Esteatorreia (gordura nas fezes)", "Fadiga", "Osteoporose precoce"],
    causasAltas: ["Doença celíaca (altamente específico, padrão-ouro sorológico)"],
    interferentes: ["Exclusão do glúten da dieta antes do exame", "Deficiência seletiva de IgA"]
  }
};
