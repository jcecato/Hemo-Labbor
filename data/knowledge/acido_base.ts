import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const acidoBaseKnowledge: Record<string, MarkerKnowledge> = {
  "Gasometria arterial": {
    ideal: "pH: 7.35 a 7.45 | pCO2: 35 a 45 mmHg | pO2: 80 a 100 mmHg | HCO3: 22 a 26 mEq/L",
    sinaisAltos: ["Confusão", "Tremores", "Lentidão respiratória", "Náuseas (sintomas de alcalose)"],
    sinaisBaixos: ["Falta de ar extrema", "Respiração profunda e rápida", "Cefaleia", "Névoa mental", "Fadiga extrema (sintomas de acidose)"],
    causasAltas: ["Alcalose respiratória (hiperventilação)", "Alcalose metabólica (vômitos severos)"],
    causasBaixas: ["Acidose respiratória (DPOC, hipoventilação)", "Acidose metabólica (insuficiência renal, cetoacidose, choque)"],
    interferentes: ["Presença de bolhas de ar na seringa de coleta", "Atraso no envio para o laboratório (deve ser mantida no gelo)"]
  },
  "Eletrólitos (soro)": {
    ideal: "Sódio: 135-145 | Potássio: 3.5-5.5 | Cloro: 98-107 mEq/L",
    sinaisAltos: ["Sede extrema", "Boca seca", "Cãibras", "Palpitações", "Tremores"],
    sinaisBaixos: ["Fadiga", "Cefaleia", "Náuseas", "Fraqueza muscular", "Espasmos"],
    causasAltas: ["Desidratação", "Insuficiência renal", "Hiperaldosteronismo"],
    causasBaixas: ["Perda gastrointestinal (vômitos, diarreia)", "Uso de diuréticos", "Excesso de hidratação"],
    interferentes: ["Hemólise da amostra", "Garroteamento prolongado"]
  }
};
