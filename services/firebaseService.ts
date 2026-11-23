import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "firebase/auth";
import { Patient, ClinicalNote, ExamResult } from '../types';

// --- CONFIGURATION: MASTER PROJECT (Centralized Data) ---
const firebaseConfig = {
  apiKey: "AIzaSyDIClTnu1wddQDvxJxgDpDrwEr0RYmhrGo",
  authDomain: "cadastro-pacientes-df054.firebaseapp.com",
  databaseURL: "https://cadastro-pacientes-df054-default-rtdb.firebaseio.com",
  projectId: "cadastro-pacientes-df054",
  storageBucket: "cadastro-pacientes-df054.firebasestorage.app",
  messagingSenderId: "906121884486",
  appId: "1:906121884486:web:c819e48a4c5b7b8db6eb47"
};

// --- MODULE DEFINITION ---
const MODULE_ROOT = 'exames';

// Initialize App (Singleton pattern)
const apps = getApps();
const app: FirebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

const database = getDatabase(app);
export const auth = getAuth(app);

// --- SESSION CACHE FOR ZERO-COST PATIENT SEARCH ---
const PATIENTS_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedPatients: Patient[] | null = null;
let patientsCacheTimestamp = 0;

export const clearPatientsCache = () => {
  cachedPatients = null;
  patientsCacheTimestamp = 0;
};

// --- AUTHENTICATION ---
export const signIn = async (email: string, pass: string) => {
  try {
    await setPersistence(auth, browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
    clearPatientsCache();
    return true;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

// --- HELPERS ---

// Converts "João Paulo" -> "joao_paulo" (preserves compatibility with existing RTDB history)
const toSafeKey = (input: string) => {
  const sanitized = (input || 'sem_nome')
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return sanitized || 'sem_nome';
};

const normalizeString = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

const parsePatientsSnapshot = (data: Record<string, any>): Patient[] => {
  const results: Patient[] = [];

  Object.entries(data).forEach(([key, value]: [string, any]) => {
    if (!value || typeof value !== 'object') return;
    const rawName = value.fullName || value.name || value.nome || '';
    const email = value.email || '';
    const photoUrl = value.photo || '';

    const rawSex = String(value.sex || value.sexo || value.gender || value.genero || value.sexoBiologico || '').toLowerCase().trim();
    let sex: 'male' | 'female' = 'female';
    if (rawSex.includes('masc') || rawSex.includes('male') || rawSex === 'm' || rawSex === 'h' || rawSex === 'homem' || rawSex.startsWith('masc')) {
      sex = 'male';
    }

    let status: 'active' | 'inactive' = 'active';
    if (value.status === 'Inativo') status = 'inactive';

    let age = 0;
    if (value.dob) {
      const birthDate = new Date(value.dob);
      const today = new Date();
      if (!isNaN(birthDate.getTime())) {
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
    } else {
      age = value.age || 0;
    }

    results.push({
      id: key,
      name: rawName,
      email,
      age,
      sex,
      status,
      photoUrl,
      lastVisit: value.lastVisit || value.dataCadastro || '',
      consultationRecordings: []
    });
  });

  return results;
};

/**
 * PATIENT OPERATIONS (Read from Master CRM 'pacientes' node with session cache)
 */
export const searchPatientsByName = async (name: string, forceRefresh: boolean = false): Promise<Patient[]> => {
  if (!auth.currentUser) return [];

  const normalizedSearch = name ? normalizeString(name) : "";
  const now = Date.now();
  const isCacheValid = !forceRefresh && cachedPatients !== null && (now - patientsCacheTimestamp) < PATIENTS_CACHE_TTL_MS;

  try {
    if (!isCacheValid) {
      const patientsRef = ref(database, 'pacientes');
      const snapshot = await get(patientsRef);
      if (snapshot.exists()) {
        cachedPatients = parsePatientsSnapshot(snapshot.val());
      } else {
        cachedPatients = [];
      }
      patientsCacheTimestamp = now;
    }

    const filtered = (cachedPatients || []).filter(patient =>
      normalizeString(patient.name).includes(normalizedSearch)
    );

    return filtered.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;

      if (normalizedSearch) {
        const aName = normalizeString(a.name);
        const bName = normalizeString(b.name);
        const aStarts = aName.startsWith(normalizedSearch);
        const bStarts = bName.startsWith(normalizedSearch);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
      }
      return 0;
    });
  } catch (error) {
    console.error("Error searching patients:", error);
    return [];
  }
};

/**
 * Helper to update last visit timestamp in Patient CRM
 */
export const updatePatientLastVisit = async (patientId: string): Promise<void> => {
  if (!auth.currentUser || !patientId) return;
  try {
    const nowIso = new Date().toISOString();
    const crmPatientRef = ref(database, `pacientes/${patientId}`);
    await update(crmPatientRef, {
      lastVisit: nowIso
    });
    if (cachedPatients) {
      cachedPatients = cachedPatients.map(p =>
        p.id === patientId ? { ...p, lastVisit: nowIso } : p
      );
    }
  } catch (error) {
    console.error("Error updating last visit:", error);
  }
};

/**
 * DATA OPERATIONS (Save to 'exames/avaliacoes' node)
 * Preserves existing sanitized-name history AND mirrors under CRM patientId key
 * so both legacy records and CRM lookups by patient key stay 100% synchronized.
 */
const stripUndefinedDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    Object.entries(value as Record<string, any>).forEach(([k, v]) => {
      if (v !== undefined) {
        cleaned[k] = stripUndefinedDeep(v);
      }
    });
    return cleaned as T;
  }
  return value;
};

export const saveClinicalNoteToFirebase = async (
  patientId: string,
  patientName: string,
  note: ClinicalNote
): Promise<boolean> => {
  if (!auth.currentUser) return false;
  try {
    const safeName = toSafeKey(patientName);
    const savedAt = new Date().toISOString();
    const referenceDate = note.referenceDate || note.date.split('T')[0];

    let parsedContent: Record<string, any> | null = null;
    if (note.type === 'lab-result' && typeof note.content === 'string') {
      try {
        const candidate = JSON.parse(note.content);
        if (candidate && typeof candidate === 'object') {
          parsedContent = candidate;
        }
      } catch {
        parsedContent = null;
      }
    }

    const structuredAdditions: Record<string, any> = {};
    if (note.type === 'lab-result') {
      const positiveHighlights = note.positiveHighlights ?? parsedContent?.positiveHighlights;
      const priorityDeviations = note.priorityDeviations ?? parsedContent?.priorityDeviations;
      const patientRoutineSummary = note.patientRoutineSummary ?? parsedContent?.patientRoutineSummary;
      const patientPrintableReport = note.patientPrintableReport ?? parsedContent?.patientPrintableReport;
      const executiveAudioBriefing = note.executiveAudioBriefing ?? parsedContent?.executiveAudioBriefing;
      const suggestedFollowUpExams = note.suggestedFollowUpExams ?? parsedContent?.suggestedFollowUpExams;
      const longitudinalTrends = note.longitudinalTrends ?? parsedContent?.longitudinalTrends;
      const schemaVersion = note.schemaVersion ?? parsedContent?.schemaVersion;

      if (Array.isArray(positiveHighlights)) {
        structuredAdditions.positiveHighlights = positiveHighlights;
      }
      if (Array.isArray(priorityDeviations)) {
        structuredAdditions.priorityDeviations = priorityDeviations;
      }
      if (typeof patientRoutineSummary === 'string' && patientRoutineSummary.trim()) {
        structuredAdditions.patientRoutineSummary = patientRoutineSummary;
      }
      if (typeof patientPrintableReport === 'string' && patientPrintableReport.trim()) {
        structuredAdditions.patientPrintableReport = patientPrintableReport;
      }
      if (typeof executiveAudioBriefing === 'string' && executiveAudioBriefing.trim()) {
        structuredAdditions.executiveAudioBriefing = executiveAudioBriefing;
      }
      if (Array.isArray(suggestedFollowUpExams)) {
        structuredAdditions.suggestedFollowUpExams = suggestedFollowUpExams;
      }
      if (
        longitudinalTrends &&
        typeof longitudinalTrends === 'object' &&
        Object.keys(longitudinalTrends).length > 0
      ) {
        structuredAdditions.longitudinalTrends = longitudinalTrends;
      }
      if (schemaVersion || Object.keys(structuredAdditions).length > 0) {
        structuredAdditions.schemaVersion = schemaVersion || '2.0';
      }
    }

    const dataToSave = stripUndefinedDeep({
      ...note,
      ...structuredAdditions,
      referenceDate,
      patientName,
      patientId,
      patientIdCRM: patientId,
      savedAt,
      module: MODULE_ROOT
    });

    const updates: Record<string, any> = {
      [`${MODULE_ROOT}/avaliacoes/${safeName}/${note.id}`]: dataToSave
    };

    if (patientId && patientId !== safeName) {
      updates[`${MODULE_ROOT}/avaliacoes/${patientId}/${note.id}`] = dataToSave;
    }

    await update(ref(database), updates);

    // Best-effort lastVisit update so permission rules on 'pacientes' never block exam writes
    updatePatientLastVisit(patientId).catch(() => {});

    return true;
  } catch (error) {
    console.error("Error saving clinical note:", error);
    return false;
  }
};

export const deleteClinicalNoteFromFirebase = async (
  patientId: string,
  patientName: string,
  noteId: string
): Promise<boolean> => {
  if (!auth.currentUser) return false;
  try {
    const safeName = toSafeKey(patientName);
    const updates: Record<string, null> = {
      [`${MODULE_ROOT}/avaliacoes/${safeName}/${noteId}`]: null
    };

    if (patientId && patientId !== safeName) {
      updates[`${MODULE_ROOT}/avaliacoes/${patientId}/${noteId}`] = null;
    }

    await update(ref(database), updates);
    updatePatientLastVisit(patientId).catch(() => {});

    return true;
  } catch (error) {
    console.error("Error deleting clinical note:", error);
    return false;
  }
};

/**
 * Fetches all records for a specific patient from 'exames/avaliacoes',
 * merging both the legacy sanitized-name folder and the CRM patientId folder
 * so existing Realtime Database history is 100% preserved.
 */
export const getPatientRecords = async (
  patientName: string,
  patientId?: string
): Promise<{ exams: ExamResult[], notes: ClinicalNote[] }> => {
  if (!auth.currentUser) return { exams: [], notes: [] };
  try {
    const safeName = toSafeKey(patientName);
    const pathsToRead = [`${MODULE_ROOT}/avaliacoes/${safeName}`];
    if (patientId && patientId !== safeName) {
      pathsToRead.push(`${MODULE_ROOT}/avaliacoes/${patientId}`);
    }

    const snapshots = await Promise.all(
      pathsToRead.map((recordPath) => get(ref(database, recordPath)))
    );

    const mergedById = new Map<string, ClinicalNote & { savedAt?: string }>();

    snapshots.forEach((snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();
      if (!data || typeof data !== 'object') return;

      Object.entries(data).forEach(([key, rawNote]: [string, any]) => {
        if (!rawNote || typeof rawNote !== 'object') return;
        const noteId = rawNote.id || key;
        const candidate: ClinicalNote & { savedAt?: string } = {
          ...rawNote,
          id: noteId,
        };
        const existing = mergedById.get(noteId);
        if (!existing) {
          mergedById.set(noteId, candidate);
        } else {
          const existingTime = new Date(existing.savedAt || existing.date || 0).getTime();
          const candidateTime = new Date(candidate.savedAt || candidate.date || 0).getTime();
          if (candidateTime >= existingTime) {
            mergedById.set(noteId, candidate);
          }
        }
      });
    });

    return { exams: [], notes: Array.from(mergedById.values()) };
  } catch (error) {
    console.error("Error fetching patient records:", error);
    return { exams: [], notes: [] };
  }
};
