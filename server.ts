import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  analyzeMedicalInputServer,
  chatWithClinicalAIServer,
  generateClinicalTTSServer,
  regenerateSynthesisFromResultsServer,
  suggestExamsServer,
} from './server/gemini.ts';
import { verifyFirebaseIdToken } from './server/auth.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const MAX_MEDIA_BYTES = 25 * 1024 * 1024; // 25 MB binário máximo por arquivo
const ALLOWED_ANALYZE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/aac',
]);
const ALLOWED_REF_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
]);

const normalizeMime = (mime: string): string =>
  mime.split(';')[0].trim().toLowerCase();

const estimateDecodedBase64Bytes = (raw: string): number => {
  const clean = raw.replace(/^data:.*?;base64,/, '').replace(/\s+/g, '');
  if (!clean) return 0;
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
};

const getErrorStatus = (error: any): number => {
  const status = Number(error?.status);
  if (Number.isInteger(status) && status >= 400 && status < 600) {
    return status;
  }
  return 500;
};

const requireFirebaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ error: 'Autenticação obrigatória para acessar recursos de IA.' });
    }
    const user = await verifyFirebaseIdToken(token);
    (res.locals as any).firebaseUid = user.uid;
    return next();
  } catch (error: any) {
    return res.status(401).json({ error: error?.message || 'Sessão inválida ou expirada.' });
  }
};

const rateLimitGemini = (req: Request, res: Response, next: NextFunction) => {
  const key = (res.locals as any).firebaseUid || req.ip || 'anonymous';
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Limite temporário de requisições de IA atingido. Aguarde alguns minutos e tente novamente.',
    });
  }

  entry.count += 1;
  return next();
};

async function startServer() {
  const app = express();

  const smallJsonParser = express.json({ limit: '5mb' });
  const largeJsonParser = express.json({ limit: '50mb' });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/gemini', requireFirebaseAuth, rateLimitGemini);

  app.post('/api/gemini/analyze', largeJsonParser, async (req: Request, res: Response) => {
    try {
      const { data, mimeType, isAudio, patientSex, targetTable } = req.body ?? {};
      if (typeof data !== 'string' || !data || typeof mimeType !== 'string' || !mimeType) {
        return res.status(400).json({ error: 'Dados de entrada inválidos para análise.' });
      }
      const baseMime = normalizeMime(mimeType);
      if (!ALLOWED_ANALYZE_MIMES.has(baseMime)) {
        return res.status(400).json({
          error: `Tipo de arquivo não suportado (${baseMime || 'desconhecido'}). Utilize JPG, PNG, WebP, PDF, TXT ou áudio compatível.`,
        });
      }
      const byteSize = estimateDecodedBase64Bytes(data);
      if (byteSize <= 0 || byteSize > MAX_MEDIA_BYTES) {
        return res.status(413).json({
          error: 'O arquivo excede o limite máximo de 25 MB para processamento seguro.',
        });
      }

      const validSex = patientSex === 'male' || patientSex === 'female' ? patientSex : undefined;
      const effectiveIsAudio = baseMime === 'text/plain' ? false : Boolean(isAudio);
      const result = await analyzeMedicalInputServer(
        data,
        baseMime,
        effectiveIsAudio,
        validSex,
        typeof targetTable === 'string' ? targetTable : ''
      );
      return res.json(result);
    } catch (error: any) {
      console.error('Erro na análise unificada:', error);
      return res.status(getErrorStatus(error)).json({
        error: error?.message || 'Falha ao processar análise.',
      });
    }
  });

  app.post('/api/gemini/chat', largeJsonParser, async (req: Request, res: Response) => {
    try {
      const { examResults, originalSynthesis, history, newMessage, referenceFiles, patientSex, clinicalContext } = req.body ?? {};
      if (!Array.isArray(examResults) || typeof newMessage !== 'string') {
        return res.status(400).json({ error: 'Parâmetros inválidos para o chat clínico.' });
      }

      const safeRefFiles = Array.isArray(referenceFiles) ? referenceFiles : [];
      for (const file of safeRefFiles) {
        if (!file || typeof file !== 'object') {
          return res.status(400).json({ error: 'Arquivo de referência inválido.' });
        }
        if (file.mimeType) {
          const refMime = normalizeMime(String(file.mimeType));
          if (!ALLOWED_REF_MIMES.has(refMime)) {
            return res.status(400).json({
              error: `Tipo de anexo não permitido (${refMime}). Envie apenas JPG, PNG, WebP, PDF ou TXT.`,
            });
          }
        }
        if (typeof file.base64 === 'string' && file.base64) {
          const refBytes = estimateDecodedBase64Bytes(file.base64);
          if (refBytes > MAX_MEDIA_BYTES) {
            return res.status(413).json({
              error: `O anexo "${String(file.name || 'arquivo')}" excede o limite máximo de 25 MB.`,
            });
          }
        }
      }

      const validSex = patientSex === 'male' || patientSex === 'female' ? patientSex : undefined;
      const text = await chatWithClinicalAIServer(
        examResults,
        typeof originalSynthesis === 'string' ? originalSynthesis : '',
        Array.isArray(history) ? history : [],
        newMessage,
        safeRefFiles,
        validSex,
        clinicalContext
      );
      return res.json({ text });
    } catch (error: any) {
      console.error('Erro no chat clínico:', error);
      return res.status(getErrorStatus(error)).json({
        error: error?.message || 'Falha ao processar resposta do chat clínico.',
      });
    }
  });

  app.post('/api/gemini/tts', smallJsonParser, async (req: Request, res: Response) => {
    try {
      const { text, voice } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Texto inválido para síntese de voz.' });
      }
      const audioBase64 = await generateClinicalTTSServer(
        text,
        typeof voice === 'string' && voice.trim() ? voice : 'puck'
      );
      return res.json({ audioBase64 });
    } catch (error: any) {
      console.error('Erro ao gerar TTS do Gemini:', error);
      return res.status(getErrorStatus(error)).json({
        error: error?.message || 'Falha ao gerar áudio.',
      });
    }
  });

  app.post('/api/gemini/regenerate-synthesis', smallJsonParser, async (req: Request, res: Response) => {
    try {
      const { results, patientSex, clinicalContext, longitudinalTrends } = req.body ?? {};
      if (!Array.isArray(results) || results.length === 0) {
        return res.status(400).json({ error: 'Lista de resultados inválida para regerar síntese.' });
      }
      const validSex = patientSex === 'male' || patientSex === 'female' ? patientSex : undefined;
      const validTrends =
        longitudinalTrends && typeof longitudinalTrends === 'object' && !Array.isArray(longitudinalTrends)
          ? longitudinalTrends
          : undefined;
      const structured = await regenerateSynthesisFromResultsServer(
        results,
        validSex,
        clinicalContext,
        validTrends
      );
      return res.json(structured);
    } catch (error: any) {
      console.error('Erro ao re-gerar síntese:', error);
      return res.status(getErrorStatus(error)).json({
        error: error?.message || 'Falha ao re-gerar síntese funcional.',
      });
    }
  });

  app.post('/api/gemini/suggest-exams', smallJsonParser, async (req: Request, res: Response) => {
    try {
      const {
        patientSex,
        patientAge,
        symptomsAndGoals,
        previousExamsContext,
        recentlyRequestedExams,
        alreadyTestedExams,
      } = req.body ?? {};
      const validSex = patientSex === 'male' || patientSex === 'female' ? patientSex : undefined;
      const numericAge = typeof patientAge === 'number' && Number.isFinite(patientAge) ? patientAge : undefined;
      const result = await suggestExamsServer({
        patientSex: validSex,
        patientAge: numericAge,
        symptomsAndGoals: typeof symptomsAndGoals === 'string' ? symptomsAndGoals : '',
        previousExamsContext: previousExamsContext && typeof previousExamsContext === 'object' ? previousExamsContext : undefined,
        recentlyRequestedExams: Array.isArray(recentlyRequestedExams) ? recentlyRequestedExams : undefined,
        alreadyTestedExams: Array.isArray(alreadyTestedExams) ? alreadyTestedExams : undefined,
      });
      return res.json(result);
    } catch (error: any) {
      console.error('Erro ao sugerir exames:', error);
      return res.status(getErrorStatus(error)).json({
        error: error?.message || 'Falha ao sugerir exames complementares.',
      });
    }
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      console.error('Erro na rota de API:', err);
      const status = err?.status || err?.statusCode || 500;
      return res.status(status).json({ error: err?.message || 'Erro interno no servidor.' });
    }
    return next(err);
  });

  if (isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(distDir, 'index.html'));
      }
      return next();
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
