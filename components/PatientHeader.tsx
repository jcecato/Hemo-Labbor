
import React from 'react';
import { Patient } from '../types';
import { Icons } from './Icon';

interface Props {
  patient: Patient;
  date: string;
  onBack: () => void;
}

export const PatientHeader: React.FC<Props> = ({ patient, date, onBack }) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-30 shadow-sm gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        
        {/* Navigation / Back Button */}
        <div className="flex items-center gap-3 pr-6 border-r border-slate-200 mr-2">
           <button 
              onClick={onBack}
              type="button"
              className="flex items-center gap-2 transition-all group outline-none"
              title="Voltar para lista de pacientes"
           >
              <div className="p-2 rounded-full group-hover:bg-medical-50 group-active:scale-90 transition-all">
                  <Icons.ArrowLeft className="w-6 h-6 text-medical-600" />
              </div>
              <span className="font-semibold text-medical-600 hidden lg:block">Voltar</span>
           </button>
        </div>

        {/* Patient Info */}
        <div className="flex items-center gap-4">
            {patient.photoUrl ? (
            <img 
                src={patient.photoUrl} 
                alt={patient.name} 
                className="h-12 w-12 rounded-full object-cover border-2 border-medical-500 shadow-sm"
            />
            ) : (
            <div className="h-12 w-12 rounded-full bg-medical-100 flex items-center justify-center text-medical-600 font-bold text-xl border-2 border-medical-500">
                {patient.name.charAt(0)}
            </div>
            )}
            <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">{patient.name}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                <Icons.User size={14} /> {patient.age > 0 ? `${patient.age} anos` : '-'}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-200">
                  {patient.sex === 'male' ? 'Masculino' : 'Feminino'}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:flex items-center gap-1">
                <Icons.Calendar size={14} /> {date}
                </span>
            </div>
            </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-2 md:mt-0">
        <span className="text-sm font-medium text-slate-400 hidden xl:block uppercase tracking-wide">Prontuário Eletrônico</span>
        <div className="h-4 w-px bg-slate-200 hidden xl:block"></div>
        <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Conectado ao CRM
        </div>
      </div>
    </div>
  );
};
