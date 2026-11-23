import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const alergiaLeiteKnowledge: Record<string, MarkerKnowledge> = {
  "IgE específico para Leite de Vaca": {
    ideal: "< 0,35 kU/L (Ausência de sensibilização / Negativo)",
    sinaisAltos: ["Cólicas abdominais", "Diarreia após consumir laticínios", "Urticária ou erupções cutâneas", "Prurido oral ou corporal", "Inchaço nos lábios/pálpebras", "Dificuldade respiratória ou sibilância", "Vômitos pós-prandiais"],
    causasAltas: ["Alergia à proteína do leite de vaca (APLV) mediada por IgE", "Sensibilização atópica generalizada"],
    interferentes: ["Medicamentos anti-histamínicos ou corticosteroides sistêmicos em uso recente (podem atenuar a resposta clínica, embora o nível de IgE sérico específico mude pouco)"]
  },
  "IgE específico para Caseína": {
    ideal: "< 0,35 kU/L (Ausência de sensibilização / Negativo)",
    sinaisAltos: ["Distensão abdominal severa", "Reações alérgicas imediatas (coceira, placas vermelhas)", "Diarreia crônica ou muco nas fezes", "Rinite ou asma associada a laticínios"],
    causasAltas: ["Alergia específica à caseína (proteína termoestável do leite - indica alto risco de reações persistentes mesmo a leite cozido)"],
    interferentes: ["Imunossupressão severa"]
  }
};
