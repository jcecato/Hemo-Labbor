import React, { useMemo } from 'react';
import { ExamResult, AnalysisStatus } from '../types';
import { Icons } from './Icon';

interface ClinicalMindMapProps {
  results: ExamResult[];
}

interface GroupedMarker {
  testName: string;
  value: string;
  unit: string;
  status: AnalysisStatus;
  isAltered: boolean;
  statusLabel: string;
}

type SystemKey = 'hematologia' | 'tireoide' | 'metabolismo' | 'nutrientes';

const normalizeLabel = (text: string): string =>
  (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const matchesAny = (nameNorm: string, terms: string[]): boolean =>
  terms.some(term => nameNorm.includes(term));

const classifyMarkerSystem = (testName: string): SystemKey | null => {
  const n = normalizeLabel(testName);

  // 1. Disambiguations before general substring checks
  // Hemoglobina Glicada (HbA1c) belongs to Metabolism, NOT Hematology
  if (n.includes('glicada') || n.includes('hba1c')) {
    return 'metabolismo';
  }
  // Microalbuminúria belongs to Renal/Metabolism, NOT Nutrientes (Albumina)
  if (n.includes('microalbumin')) {
    return 'metabolismo';
  }
  // Relação PCR-us:Albumina belongs to Inflammatory/Hematology axis
  if (n.includes('pcr') || n.includes('proteina c reativa')) {
    return 'hematologia';
  }

  // 2. Nutrientes & Micronutrientes (includes Ferritina, Ferro, Transferrina, TIBC, Saturação, Vitamins, Minerals, Electrolytes)
  const nutrientesTerms = [
    'ferritina', 'ferro', 'transferrina', 'tibc', 'capacidade total de ligacao',
    'vitamina', 'b12', 'b1', 'b2', 'b3', 'b5', 'b6', 'b7', 'tiamina', 'riboflavina',
    'niacina', 'pantotenico', 'biotina', 'cobalamina', 'acido folico', 'folato',
    'acido metilmalonico', 'mma', 'calcio', 'fosforo', 'zinco', 'cobre', 'selenio',
    'magnesio', 'potassio', 'sodio', 'cloro', 'cromo', 'manganes', 'molibdenio',
    'aluminio', 'chumbo', 'mercurio', 'omega-3', 'omega 3', 'pre-albumina', 'transtirretina',
    'proteina ligadora de retinol', 'rbp'
  ];
  if (matchesAny(n, nutrientesTerms)) {
    return 'nutrientes';
  }
  if (n.includes('albumina') && !n.includes('globulina')) {
    return 'nutrientes';
  }

  // 3. Eixo Tireoidiano & Hormonal
  const tireoideTerms = [
    'tsh', 't4 livre', 't4 total', 't3 livre', 't3 total', 't3 reverso', 'ft3', 'rt3',
    'anti-tpo', 'anti tpo', 'tireoide', 'cortisol', 'dhea', 'testosterona', 'shbg',
    'estradiol', 'progesterona', 'igf-1', 'igf 1', 'hormonal', 'catecolamina'
  ];
  if (matchesAny(n, tireoideTerms)) {
    return 'tireoide';
  }

  // 4. Complexo Hematológico & Inflamatório
  const hematologiaTerms = [
    'hemoglobina', 'hematocrito', 'vcm', 'hcm', 'chcm', 'rdw', 'eritrocito', 'hemacia', 'rbc',
    'leucocito', 'wbc', 'neutrofilo', 'linfocito', 'monocito', 'eosinofilo', 'basofilo',
    'plaqueta', 'trombocito', 'leucograma', 'siri', 'rnl', 'nlr', 'mlr', 'plr',
    'resposta inflamatoria', 'vhs', 'fibrinogenio', 'd-dimero', 'd dimero', 'tempo de protrombina', 'tp/inr'
  ];
  if (matchesAny(n, hematologiaTerms)) {
    return 'hematologia';
  }

  // 5. Metabolismo, Fígado & Função Renal
  const metabolismoTerms = [
    'glicose', 'glicemia', 'insulina', 'homa', 'frutosamina', 'c-peptideo', 'adiponectina', 'leptina',
    'triglicerid', 'colesterol', 'hdl', 'ldl', 'vldl', 'apolipoproteina', 'apo-a', 'apo-b', 'apo a', 'apo b',
    'lipoproteina', 'lp(a)', 'lp-pla2', 'tyg', 'aterogenicidade', 'homocisteina', 'acido urico',
    'ast', 'alt', 'tgo', 'tgp', 'ggt', 'gama gt', 'gama-gt', 'fosfatase alcalina', 'bilirrubina',
    'amonia', 'lactato', 'ldh', 'creatina quinase', 'ck-mb', 'ck mb', 'amilase', 'lipase',
    'creatinina', 'ureia', 'etfg', 'filtracao glomerular', 'cistatina', 'proteinuria', 'osmolaridade',
    'osmolalidade', 'bicarbonato', 'anion gap', 'albumina:globulina', 'proteinas totais', 'globulina'
  ];
  if (matchesAny(n, metabolismoTerms)) {
    return 'metabolismo';
  }

  return null;
};

export const ClinicalMindMap: React.FC<ClinicalMindMapProps> = ({ results }) => {
  const systems = useMemo(() => {
    const getStatusLabel = (status: AnalysisStatus): string => {
      switch (status) {
        case AnalysisStatus.CRITICAL_HIGH: return '↑↑ Prioritário';
        case AnalysisStatus.CLINICAL_HIGH: return '↑ Prioritário';
        case AnalysisStatus.FUNCTIONAL_HIGH: return '↗ Atenção';
        case AnalysisStatus.FUNCTIONAL_LOW: return '↘ Atenção';
        case AnalysisStatus.CLINICAL_LOW: return '↓ Prioritário';
        case AnalysisStatus.CRITICAL_LOW: return '↓↓ Prioritário';
        case AnalysisStatus.OPTIMIZED: return '↔ Preservado';
        default: return '•';
      }
    };

    const isAltered = (status: AnalysisStatus): boolean => {
      return status !== AnalysisStatus.OPTIMIZED && status !== AnalysisStatus.UNKNOWN;
    };

    const buckets: Record<SystemKey, GroupedMarker[]> = {
      hematologia: [],
      tireoide: [],
      metabolismo: [],
      nutrientes: [],
    };

    results.forEach(r => {
      const target = classifyMarkerSystem(r.testName);
      if (!target) return;
      buckets[target].push({
        testName: r.testName,
        value: r.value,
        unit: r.unit,
        status: r.status,
        isAltered: isAltered(r.status),
        statusLabel: getStatusLabel(r.status),
      });
    });

    const sortBySeverity = (items: GroupedMarker[]) =>
      [...items].sort((a, b) => {
        const aWeight = a.status === AnalysisStatus.CRITICAL_HIGH || a.status === AnalysisStatus.CRITICAL_LOW ? 3 : (a.isAltered ? 2 : 1);
        const bWeight = b.status === AnalysisStatus.CRITICAL_HIGH || b.status === AnalysisStatus.CRITICAL_LOW ? 3 : (b.isAltered ? 2 : 1);
        return bWeight - aWeight;
      });

    return {
      hematologia: sortBySeverity(buckets.hematologia),
      tireoide: sortBySeverity(buckets.tireoide),
      metabolismo: sortBySeverity(buckets.metabolismo),
      nutrientes: sortBySeverity(buckets.nutrientes),
    };
  }, [results]);

  const hasAlteredMarkers = useMemo(() => {
    return (
      systems.metabolismo.some(m => m.isAltered) ||
      systems.hematologia.some(m => m.isAltered) ||
      systems.tireoide.some(m => m.isAltered) ||
      systems.nutrientes.some(m => m.isAltered)
    );
  }, [systems]);

  const getStatusStyles = (status: AnalysisStatus) => {
    switch (status) {
      case AnalysisStatus.CRITICAL_HIGH:
      case AnalysisStatus.CRITICAL_LOW:
        return 'bg-red-50 text-red-700 ring-1 ring-red-200 animate-pulse font-extrabold';
      case AnalysisStatus.CLINICAL_HIGH:
      case AnalysisStatus.CLINICAL_LOW:
        return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 font-bold';
      case AnalysisStatus.FUNCTIONAL_HIGH:
      case AnalysisStatus.FUNCTIONAL_LOW:
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      case AnalysisStatus.OPTIMIZED:
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
      default:
        return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200';
    }
  };

  const renderMarkerList = (items: GroupedMarker[], alignRightOnDesktop: boolean = false) => {
    if (items.length === 0) {
      return <p className="text-[11px] text-slate-400 italic">Nenhum marcador analisado</p>;
    }
    return items.map((m, idx) => (
      <div
        key={`${m.testName}-${idx}`}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 text-xs py-1.5 border-b border-slate-100/80 last:border-0 ${
          alignRightOnDesktop ? 'lg:flex-row-reverse' : ''
        }`}
      >
        <span
          className={`text-slate-700 font-medium leading-snug break-words min-w-0 flex-1 ${
            alignRightOnDesktop ? 'lg:text-right' : 'text-left'
          }`}
          title={m.testName}
        >
          {m.testName}
        </span>
        <span
          className={`font-mono font-bold px-2 py-0.5 rounded-md text-[10px] shrink-0 whitespace-nowrap self-start sm:self-center ${getStatusStyles(m.status)}`}
        >
          {m.value} {m.unit} ({m.statusLabel})
        </span>
      </div>
    ));
  };

  return (
    <div className="mt-12 pt-8 border-t border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center ring-1 ring-purple-100">
          <Icons.BrainCircuit size={20} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase">Mapa Mental de Correlações Clínicas</h3>
          <p className="text-xs text-slate-500 font-light mt-0.5">Visão integrada das interconexões biológicas e seus desvios em tempo real.</p>
        </div>
      </div>

      {/* Relative container for desktop SVG background lines */}
      <div className="relative bg-slate-50/50 rounded-2xl p-6 border border-slate-100 overflow-hidden min-h-[500px] flex flex-col justify-center">
        {/* SVG Background Connections (Visible only on Desktop) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 50,50 Q 35,50 25,25" fill="none" stroke="#e9d5ff" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M 50,50 Q 35,50 25,75" fill="none" stroke="#e9d5ff" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M 50,50 Q 65,50 75,25" fill="none" stroke="#e9d5ff" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M 50,50 Q 65,50 75,75" fill="none" stroke="#e9d5ff" strokeWidth="2" strokeDasharray="3 3" />
        </svg>

        {/* Desktop grid layout / Mobile flex stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10 w-full">

          {/* LEFT COLUMN: Hematologia/Inflamação & Tireoide */}
          <div className="flex flex-col gap-6 lg:text-right">

            {/* Box 1: Hematologia & Inflamação */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:border-purple-300 transition-all">
              <div className="flex items-center gap-2 mb-3 lg:justify-end">
                <Icons.Droplet size={16} className="text-red-500 shrink-0" />
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Complexo Hematológico & Inflamatório</h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 lg:text-right">Transporte de oxigênio, imunidade celular, razões leucocitárias e inflamação sistêmica.</p>
              <div className="max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                {renderMarkerList(systems.hematologia, true)}
              </div>
            </div>

            {/* Box 2: Tireoide */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:border-purple-300 transition-all">
              <div className="flex items-center gap-2 mb-3 lg:justify-end">
                <Icons.Activity size={16} className="text-indigo-500 shrink-0" />
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Eixo Tireoidiano & Hormonal</h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 lg:text-right">Produção e conversão de hormônios metabólicos ativos e esteroides.</p>
              <div className="max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                {renderMarkerList(systems.tireoide, true)}
              </div>
            </div>

          </div>

          {/* MIDDLE COLUMN: Central Hub (SISTEMA INTEGRADO) */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-full w-40 h-40 flex flex-col items-center justify-center text-center p-4 shadow-xl ring-8 ring-purple-100 relative group transition-transform hover:scale-105">
              <Icons.BrainCircuit size={32} className="mb-2 animate-pulse text-purple-100" />
              <span className="font-black text-[11px] uppercase tracking-wider leading-tight">Saúde Sistêmica</span>
              <span className="text-[9px] text-purple-200 uppercase tracking-widest mt-1 font-bold">Integrada</span>

              <div className="absolute -bottom-2 bg-slate-900 text-[9px] font-black tracking-wider uppercase px-3 py-1 rounded-full text-purple-300 border border-purple-500">
                {hasAlteredMarkers ? 'Pontos em Atenção' : 'Eixos Preservados'}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Metabolismo/Hepático/Renal & Nutrientes */}
          <div className="flex flex-col gap-6">

            {/* Box 3: Metabolismo, Fígado & Renal */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:border-purple-300 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Icons.FlaskConical size={16} className="text-amber-500 shrink-0" />
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Metabolismo, Fígado & Renal</h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Controle glicêmico, lipídico, enzimologia hepática e filtração renal.</p>
              <div className="max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                {renderMarkerList(systems.metabolismo, false)}
              </div>
            </div>

            {/* Box 4: Nutrientes & Cofatores */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:border-purple-300 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Icons.Sparkles size={16} className="text-purple-500 shrink-0" />
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Nutrientes & Micronutrientes</h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Cinética do ferro, vitaminas, minerais e cofatores celulares essenciais.</p>
              <div className="max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                {renderMarkerList(systems.nutrientes, false)}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
