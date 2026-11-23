// src/data/clinicalKnowledge.ts
import { hemogramaKnowledge } from './knowledge/hemograma.ts';
import { tireoideKnowledge } from './knowledge/tireoide.ts';
import { metabolismoKnowledge } from './knowledge/metabolismo.ts';
import { micronutrientesKnowledge } from './knowledge/micronutrientes.ts';

// Newly added structured knowledge modules
import { acidoBaseKnowledge } from './knowledge/acido_base.ts';
import { alergiaLeiteKnowledge } from './knowledge/alergia_leite.ts';
import { alergiasKnowledge } from './knowledge/alergias.ts';
import { cardiometabolicoKnowledge } from './knowledge/cardiometabolico.ts';
import { colesterolKnowledge } from './knowledge/colesterol.ts';
import { figadoKnowledge } from './knowledge/figado.ts';
import { glicemicoKnowledge } from './knowledge/glicemico.ts';
import { intestinalUrinaKnowledge } from './knowledge/intestinal_urina.ts';
import { metabologiaKnowledge } from './knowledge/metabologia.ts';
import { mineraisKnowledge } from './knowledge/minerais.ts';
import { renalKnowledge } from './knowledge/renal.ts';
import { razoesKnowledge } from './knowledge/razoes.ts';

export interface MarkerKnowledge {
  ideal: string;            // O alvo funcional/otimizado
  sinaisAltos?: string[];   // 10 itens
  sinaisBaixos?: string[];  // 10 itens
  causasAltas?: string[];   // 10 itens
  causasBaixas?: string[];  // 10 itens
  interferentes?: string[]; // 10 itens
}

// União de todos os módulos de conhecimento
export const CLINICAL_KNOWLEDGE_BASE: Record<string, MarkerKnowledge> = {
  ...metabolismoKnowledge,
  ...micronutrientesKnowledge,
  ...hemogramaKnowledge,
  ...tireoideKnowledge,
  ...colesterolKnowledge,
  ...figadoKnowledge,
  ...metabologiaKnowledge,
  ...cardiometabolicoKnowledge,
  ...glicemicoKnowledge,
  ...mineraisKnowledge,
  ...renalKnowledge,
  ...acidoBaseKnowledge,
  ...alergiasKnowledge,
  ...alergiaLeiteKnowledge,
  ...intestinalUrinaKnowledge,
  ...razoesKnowledge
};

