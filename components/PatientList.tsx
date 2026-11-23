
import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../types';
import { Icons } from './Icon';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onSearch: (term: string, forceRefresh?: boolean) => void;
  isLoading: boolean;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, onSelectPatient, onSearch, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isFirstRender = useRef(true);

  // Filter cached list locally with short debounce (skip duplicate initial fetch on mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm, false);
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    
    // Check if it matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    }
    
    // Fallback for other formats
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('pt-BR');
    } catch {
        return dateString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pacientes</h1>
        <button
          type="button"
          onClick={() => onSearch(searchTerm, true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          title="Sincronizar lista de pacientes com o CRM"
        >
          <Icons.Loader2 size={14} className={isLoading ? 'animate-spin text-blue-600' : 'hidden'} />
          <span>{isLoading ? 'Sincronizando...' : 'Atualizar CRM'}</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icons.Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm shadow-sm transition-shadow"
          placeholder="Buscar paciente por nome no CRM..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden min-h-[200px]">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Nome / Identificação
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Sexo
              </th>
               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Última Visita
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {patients.map((patient) => (
              <tr 
                key={patient.id} 
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onSelectPatient(patient)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {patient.photoUrl ? (
                         <img 
                           src={patient.photoUrl} 
                           alt={patient.name} 
                           className="h-10 w-10 rounded-full object-cover border border-blue-200"
                         />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                          {patient.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">
                        {patient.name} <span className="text-slate-400 font-normal text-xs">({patient.age > 0 ? `${patient.age} anos` : 'Idade não informada'})</span>
                      </div>
                      <div className="text-xs text-slate-500">ID: {patient.email || patient.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                    {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                   {patient.sex === 'male' ? 'Masculino' : patient.sex === 'female' ? 'Feminino' : '-'}
                </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {formatDate(patient.lastVisit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto">
                    Prontuário <Icons.ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!isLoading && patients.length === 0 && (
           <div className="text-center py-12">
             <Icons.User className="mx-auto h-12 w-12 text-slate-300" />
             <h3 className="mt-2 text-sm font-medium text-slate-900">Nenhum paciente encontrado</h3>
             <p className="mt-1 text-sm text-slate-500">
                {searchTerm.length > 0 ? "Tente buscar com outro nome." : "Nenhum paciente registrado no CRM."}
             </p>
           </div>
        )}
      </div>
    </div>
  );
};
