
import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Patient, ClinicalNote, SuggestedFollowUpExam } from './types';
import type { PreselectedExamRequestPayload } from './components/ExamRequest';
import { 
  searchPatientsByName, 
  saveClinicalNoteToFirebase, 
  deleteClinicalNoteFromFirebase,
  getPatientRecords,
  clearPatientsCache,
  signIn,
  auth
} from './services/firebaseService';
import { PatientHeader } from './components/PatientHeader';
import { Icons } from './components/Icon';
import { PatientList } from './components/PatientList';

const LabManualEntry = lazy(() =>
  import('./components/LabManualEntry').then(m => ({ default: m.LabManualEntry }))
);
const ExamRequest = lazy(() =>
  import('./components/ExamRequest').then(m => ({ default: m.ExamRequest }))
);
const EvaluationChat = lazy(() =>
  import('./components/EvaluationChat').then(m => ({ default: m.EvaluationChat }))
);

type ActiveTab = 'manual' | 'request' | 'evaluation';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // State for Navigation and Data
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('manual');
  const [preselectedExamRequest, setPreselectedExamRequest] = useState<PreselectedExamRequestPayload | null>(null);
  
  // State for Patient Search
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  
  // Guard for initial auto-selection
  const hasCheckedUrlParams = useRef(false);

  // Format current date
  const today = new Date();
  const dateString = today.toLocaleDateString('pt-BR');

  // --- HANDLERS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setLoginError('Acesso negado. Verifique suas credenciais.');
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    clearPatientsCache();
    await auth.signOut();
    setIsAuthenticated(false);
    setPatientList([]);
    setSelectedPatient(null);
    setPreselectedExamRequest(null);
    setEmail('');
    setPassword('');
    hasCheckedUrlParams.current = false;
  };

  const handleSearchPatient = useCallback(async (term: string, forceRefresh: boolean = false) => {
    if (!auth.currentUser) return;
    setIsLoadingPatients(true);
    try {
      const found = await searchPatientsByName(term, forceRefresh);
      setPatientList(found);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setPreselectedExamRequest(null);
    setActiveTab('manual');

    try {
      const { notes } = await getPatientRecords(patient.name, patient.id);
      setSelectedPatient(prev => {
        if (prev && prev.id === patient.id) {
          return { ...prev, consultationRecordings: notes };
        }
        return prev;
      });
    } catch (error) {
      console.error("Failed to load patient history", error);
    }
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setPreselectedExamRequest(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('patientName');
    url.searchParams.delete('patientId');
    window.history.replaceState({}, '', url.pathname);
    hasCheckedUrlParams.current = true;
    handleSearchPatient('', false);
  };

  const handlePrepareExamRequest = useCallback((suggestedExams: SuggestedFollowUpExam[]) => {
    const examNames = suggestedExams
      .map((item) => item.examName?.trim())
      .filter((name): name is string => Boolean(name));
    if (examNames.length === 0) return;

    setPreselectedExamRequest({
      exams: examNames,
      observation: 'Investigação complementar sugerida na Síntese Funcional',
      nonce: Date.now(),
    });
    setActiveTab('request');
  }, []);

  const handleSaveOrUpdateNote = async (patientId: string, note: ClinicalNote): Promise<boolean> => {
    if (!selectedPatient || selectedPatient.id !== patientId) return false;

    const targetPatientName = selectedPatient.name;
    const previousRecordings = selectedPatient.consultationRecordings ? [...selectedPatient.consultationRecordings] : [];

    setSelectedPatient(prev => {
      if (!prev || prev.id !== patientId) return prev;
      const updatedRecordings = prev.consultationRecordings ? [...prev.consultationRecordings] : [];
      const existingIndex = updatedRecordings.findIndex(n => n.id === note.id);
      if (existingIndex >= 0) {
        updatedRecordings[existingIndex] = note;
      } else {
        updatedRecordings.push(note);
      }
      return { ...prev, consultationRecordings: updatedRecordings };
    });

    try {
      const saved = await saveClinicalNoteToFirebase(patientId, targetPatientName, note);
      if (!saved) {
        setSelectedPatient(prev => (prev && prev.id === patientId ? { ...prev, consultationRecordings: previousRecordings } : prev));
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to save note", error);
      setSelectedPatient(prev => (prev && prev.id === patientId ? { ...prev, consultationRecordings: previousRecordings } : prev));
      return false;
    }
  };

  const handleDeleteNote = async (patientId: string, noteId: string): Promise<boolean> => {
    if (!selectedPatient || selectedPatient.id !== patientId) return false;

    const targetPatientName = selectedPatient.name;
    const previousRecordings = selectedPatient.consultationRecordings ? [...selectedPatient.consultationRecordings] : [];

    setSelectedPatient(prev => {
      if (!prev || prev.id !== patientId) return prev;
      const updatedRecordings = (prev.consultationRecordings || []).filter(n => n.id !== noteId);
      return { ...prev, consultationRecordings: updatedRecordings };
    });

    try {
      const deleted = await deleteClinicalNoteFromFirebase(patientId, targetPatientName, noteId);
      if (!deleted) {
        setSelectedPatient(prev => (prev && prev.id === patientId ? { ...prev, consultationRecordings: previousRecordings } : prev));
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to delete note", error);
      setSelectedPatient(prev => (prev && prev.id === patientId ? { ...prev, consultationRecordings: previousRecordings } : prev));
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
        setIsLoggingIn(false);
      } else {
        setIsAuthenticated(false);
        setIsLoggingIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const initApp = async () => {
      if (hasCheckedUrlParams.current) return;
      hasCheckedUrlParams.current = true;

      const params = new URLSearchParams(window.location.search);
      const patientNameParam = params.get('patientName');
      const patientIdParam = params.get('patientId');

      if (patientNameParam) {
        setIsLoadingPatients(true);
        try {
          const found = await searchPatientsByName(patientNameParam);
          setPatientList(found);

          if (found.length === 1) {
             await handleSelectPatient(found[0]);
          } else if (found.length > 1 && patientIdParam) {
             const exactMatch = found.find(p => p.id === patientIdParam);
             if (exactMatch) await handleSelectPatient(exactMatch);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingPatients(false);
        }
      } else {
        handleSearchPatient('');
      }
    };

    initApp();
  }, [handleSearchPatient, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-[420px] w-full bg-white rounded-2xl shadow-xl p-10 border border-slate-100 flex flex-col items-center">
          <div className="mb-8 flex flex-col items-center">
             <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/30 mb-6">
               <Icons.Droplet size={40} strokeWidth={3} fill="currentColor" />
             </div>
             <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hemo Labor</h1>
             <p className="text-slate-500 text-sm mt-2 font-medium">Seu aliado em gestão para sua clínica.</p>
          </div>
          
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-white"
                placeholder="Seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder-slate-400 bg-white"
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center font-medium border border-red-100">
                {loginError}
              </div>
            )}
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
               {isLoggingIn ? <Icons.Loader2 className="animate-spin" /> : <>Entrar (Login) <span className="opacity-80">🔒</span></>}
            </button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">ÁREA EXCLUSIVA, ACESSO RESTRITO.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPatient) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-[1920px] 2xl:max-w-[2100px] w-full mx-auto">
          <header className="mb-8 border-b border-slate-200 pb-4 flex justify-between items-end">
            <div>
              <h1 className="text-5xl font-bold text-slate-700 flex items-center gap-3">
                <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-red-600/30">
                   <Icons.Droplet size={24} strokeWidth={3} fill="currentColor" />
                </div>
                Hemo Labor <span className="text-base font-normal text-slate-400 mt-4 tracking-wide">by Data Clinical</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 Sistema Integrado
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1" title="Sair">
                <span className="text-xs font-medium uppercase mr-1">Sair</span>
                <Icons.LogOut size={20} />
              </button>
            </div>
          </header>
          <PatientList 
            patients={patientList} 
            onSelectPatient={handleSelectPatient} 
            onSearch={handleSearchPatient}
            isLoading={isLoadingPatients}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PatientHeader 
        patient={selectedPatient} 
        date={dateString} 
        onBack={handleBackToList}
      />

      <main className="flex-1 max-w-[1920px] 2xl:max-w-[2100px] w-full mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-wrap border-b border-slate-200 mb-6 gap-2">
            <button
                onClick={() => setActiveTab('manual')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all relative
                    ${activeTab === 'manual' ? 'text-medical-600 bg-medical-50 rounded-t-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'}`}
            >
                <Icons.FileText size={18} />
                Dados Laboratoriais
                {activeTab === 'manual' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-medical-600"></div>}
            </button>
            <button
                onClick={() => setActiveTab('request')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all relative
                    ${activeTab === 'request' ? 'text-medical-600 bg-medical-50 rounded-t-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'}`}
            >
                <Icons.FlaskConical size={18} />
                Solicitação
                {activeTab === 'request' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-medical-600"></div>}
            </button>
             <button
                onClick={() => setActiveTab('evaluation')}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all relative
                    ${activeTab === 'evaluation' ? 'text-purple-600 bg-purple-50 rounded-t-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'}`}
            >
                <Icons.Sparkles size={18} />
                Avaliação Smart
                {activeTab === 'evaluation' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>}
            </button>
        </div>

        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <Suspense
            fallback={
              <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Icons.Loader2 className="w-8 h-8 animate-spin text-medical-600" />
                <span className="text-sm font-medium">Carregando módulo clínico...</span>
              </div>
            }
          >
            {activeTab === 'manual' && (
                <LabManualEntry 
                    patient={selectedPatient}
                    onSave={handleSaveOrUpdateNote}
                    onDelete={handleDeleteNote}
                    onPrepareExamRequest={handlePrepareExamRequest}
                    onNavigateToEvaluation={() => setActiveTab('evaluation')}
                />
            )}
            {activeTab === 'request' && (
                <ExamRequest
                    patient={selectedPatient}
                    onSave={handleSaveOrUpdateNote}
                    onDelete={handleDeleteNote}
                    preselectedRequest={preselectedExamRequest}
                    onConsumePreselected={() => setPreselectedExamRequest(null)}
                />
            )}
            {activeTab === 'evaluation' && (
                <EvaluationChat
                    patient={selectedPatient}
                    onSave={handleSaveOrUpdateNote}
                    onPrepareExamRequest={handlePrepareExamRequest}
                />
            )}
          </Suspense>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        <p>Hemo Labor v2.0 • Integrado ao Firebase Realtime Database (CRM & Records)</p>
      </footer>
    </div>
  );
};

export default App;
