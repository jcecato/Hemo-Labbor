import type { MarkerKnowledge } from '../clinicalKnowledge.ts';

export const intestinalUrinaKnowledge: Record<string, MarkerKnowledge> = {
  "Coprológico Funcional": {
    ideal: "Ausência de resíduos alimentares não digeridos, pH neutro, flora bacteriana equilibrada",
    sinaisAltos: ["Distensão abdominal", "Diarreia crônica", "Flatulência excessiva", "Fezes com odor fétido extremo", "Cólicas intestinais"],
    causasAltas: ["Insuficiência digestiva gástrica, biliar ou pancreática", "Má absorção intestinal", "Disbiose severa"],
    interferentes: ["Uso de enzimas digestivas antes da coleta", "Laxantes", "Consumo excessivo de fibras nas 48h anteriores"]
  },
  "Calprotectina Fecal": {
    ideal: "< 50 mcg/g (Otimizado)",
    sinaisAltos: ["Diarreia crônica", "Dor abdominal", "Sangue nas fezes", "Perda de peso", "Febre baixa", "Fadiga", "Anemia", "Urgência", "Muco", "Inchaço"],
    causasAltas: ["Crohn", "Retocolite", "Câncer", "AINEs", "Infecção", "Pólipos", "Diverticulite", "Fibrose cística", "Alergia", "Doença celíaca"],
    interferentes: ["AINEs", "Omeprazol", "Sangramento", "Aspirina", "Idade", "Dieta", "Álcool", "Coleta", "Infecção", "Antibióticos"]
  },
  "Lactoferrina Fecal": {
    ideal: "< 7.0 mcg/g (Negativo)",
    sinaisAltos: ["Diarreia mucopurulenta", "Cólicas intensas", "Febre", "Urgência evacuatória", "Sangue visível nas fezes"],
    causasAltas: ["Doenças Inflamatórias Intestinais (fase ativa)", "Infecções intestinais bacterianas invasivas (Salmonella, Shigella, Campylobacter)", "Colite pseudomembranosa"],
    interferentes: ["Aleitamento materno (lactoferrina elevada nas fezes do bebê)", "AINEs", "Sangramento hemorroidário ativo"]
  },
  "α-1-Antitripsina Fecal": {
    ideal: "< 54 mg/dL",
    sinaisAltos: ["Diarreia crônica aquosa", "Edema generalizado (por perda proteica)", "Perda de peso", "Desnutrição"],
    causasAltas: ["Enteropatia perdedora de proteínas", "Doença Celíaca refratária", "Crohn", "Alergias alimentares graves", "Linfangiectasia intestinal"],
    interferentes: ["Sangramento gastrointestinal ativo (falso alto)", "Amostra líquida diluída"]
  },
  "Elastase Pancreática": {
    ideal: "> 500 mcg/g (Otimizado)",
    sinaisBaixos: ["Esteatorreia (gordura nas fezes)", "Perda de peso", "Distensão", "Gases", "Desnutrição", "Dor pós-prandial", "Deficiência de vitaminas lipossolúveis (A, D, E, K)", "Fezes flutuantes", "Fome persistente", "Fraqueza"],
    causasBaixas: ["Insuficiência Pancreática Exócrina", "Pancreatite crônica", "Fibrose cística", "Diabetes Tipo 1 ou Tipo 2 avançado", "Cálculos pancreáticos", "Câncer de pâncreas", "Cirurgia pancreática/gástrica", "Doença celíaca"],
    interferentes: ["Fezes líquidas (causam falso baixo por diluição)", "Laxantes", "Consumo excessivo de álcool"]
  },
  "Sais Biliares Fecais": {
    ideal: "Normal / Sem excesso de excreção fecal",
    sinaisAltos: ["Diarreia aquosa crônica com queimação anal", "Urgência matinal", "Distensão e flatulência"],
    causasAltas: ["Síndrome de má absorção de sais biliares (doença do íleo terminal, ressecção de íleo)", "Supercrescimento bacteriano no intestino delgado (SIBO)"],
    interferentes: ["Uso de quelantes de sais biliares (ex: colestiramina)", "Dieta extremamente gordurosa"]
  },
  "Gorduras Fecais": {
    ideal: "< 7 g/24h",
    sinaisAltos: ["Esteatorreia (fezes volumosas, brilhantes, amareladas e que flutuam ou deixam marcas de gordura no vaso)", "Perda de peso", "Fadiga", "Cãibras (deficiência de minerais)"],
    causasAltas: ["Má absorção de gorduras", "Insuficiência pancreática exócrina", "Doença celíaca não tratada", "Doença de Crohn", "Disfunção de secreção biliar"],
    interferentes: ["Uso de orlistat (eleva drasticamente)", "Consumo de laxantes à base de óleo mineral"]
  },
  "IgA Secretória Fecal": {
    ideal: "510 a 2040 mcg/mL (Otimizado)",
    sinaisAltos: ["Sinais de hiperreatividade imunológica intestinal", "Alergias alimentares"],
    sinaisBaixos: ["Disbiose frequente", "Infecções gastrointestinais recorrentes", "Sensibilidade alimentar difusa", "Aumento da permeabilidade intestinal (leaky gut)"],
    causasAltas: ["Ativação imune da mucosa contra patógenos intestinais", "Alergias ou hipersensibilidades alimentares", "Inflamação intestinal ativa"],
    causasBaixas: ["Estresse crônico (cortisol elevado reduz IgA secretória)", "Disbiose crônica de longo prazo", "Imunodeficiência congênita ou adquirida"],
    interferentes: ["Uso recente de antibióticos", "Uso prolongado de imunossupressores"]
  },
  "Cultura de Fezes Ampliada": {
    ideal: "Flora benéfica abundante (Lactobacillus, Bifidobacterium), ausência de patógenos (Salmonella, Shigella) e controle de comensais",
    sinaisAltos: ["Diarreia crônica ou aguda severa", "Distensão e inchaço constantes", "Dores abdominais em cólica", "Muco nas fezes"],
    causasAltas: ["Infecção bacteriana ou fúngica (Candidíase intestinal)", "Disbiose crônica severa", "Uso recente de antibióticos"],
    interferentes: ["Uso recente de antibióticos ou antifúngicos", "Uso de probióticos potentes na semana anterior à coleta"]
  },
  "Sangue Oculto": {
    ideal: "Negativo",
    sinaisAltos: ["Anemia ferropriva sem causa explicada", "Dor abdominal crônica sutil", "Alterações de hábito intestinal recentes"],
    causasAltas: ["Pólipos intestinais", "Câncer colorretal", "Diverticulite", "Hemofilia ou hemorroidas sangrantes", "Úlcera gástrica ou duodenal", "Doenças inflamatórias intestinais"],
    interferentes: ["Ingestão excessiva de carne vermelha, rabanete, nabo ou suplementos de ferro nas 72h antes (para testes químicos não imunológicos)", "Uso de aspirina ou AINEs"]
  },
  "Glicose na Urina": {
    ideal: "Ausente (Negativo)",
    sinaisAltos: ["Sede excessiva", "Poliúria (aumento da micção)", "Urina com odor adocicado", "Fadiga", "Candidíase de repetição"],
    causasAltas: ["Diabetes Mellitus descompensado", "Glicosúria renal", "Gravidez", "Consumo maciço de carboidratos refinados"],
    interferentes: ["Uso de inibidores de SGLT2 (canagliflozina, empagliflozina)", "Altas doses de Vitamina C (falso negativo)"]
  }
};
