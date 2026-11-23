import crypto from 'crypto';

const FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const DEFAULT_FIREBASE_PROJECT_ID = 'cadastro-pacientes-df054';

const getFirebaseProjectId = (): string =>
  process.env.FIREBASE_PROJECT_ID?.trim() || DEFAULT_FIREBASE_PROJECT_ID;

let cachedCerts: Record<string, string> | null = null;
let certsExpiresAt = 0;

const fetchPublicCerts = async (): Promise<Record<string, string>> => {
  const now = Date.now();
  if (cachedCerts && now < certsExpiresAt) {
    return cachedCerts;
  }

  const response = await fetch(FIREBASE_CERTS_URL);
  if (!response.ok) {
    throw new Error(`Falha ao obter certificados públicos do Firebase (${response.status}).`);
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;

  const certs = (await response.json()) as Record<string, string>;
  cachedCerts = certs;
  certsExpiresAt = now + maxAgeSeconds * 1000;
  return certs;
};

const base64UrlDecode = (segment: string): Buffer => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
};

export interface VerifiedFirebaseUser {
  uid: string;
  email?: string;
}

export const verifyFirebaseIdToken = async (idToken: string): Promise<VerifiedFirebaseUser> => {
  const segments = idToken.split('.');
  if (segments.length !== 3) {
    throw new Error('Token de autenticação inválido.');
  }

  const [headerB64, payloadB64, signatureB64] = segments;
  const header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
  const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));

  if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
    throw new Error('Algoritmo ou identificador de chave do token inválido.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Token com data de emissão inválida.');
  }
  const expectedProjectId = getFirebaseProjectId();
  if (payload.aud !== expectedProjectId) {
    throw new Error('Audiência do token não corresponde ao projeto configurado.');
  }
  if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) {
    throw new Error('Emissor do token inválido.');
  }
  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Identificador de usuário ausente no token.');
  }

  const certs = await fetchPublicCerts();
  const cert = certs[header.kid];
  if (!cert) {
    // Force refresh once in case of key rotation
    cachedCerts = null;
    const refreshedCerts = await fetchPublicCerts();
    if (!refreshedCerts[header.kid]) {
      throw new Error('Chave pública de assinatura não encontrada.');
    }
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    if (!verifier.verify(refreshedCerts[header.kid], base64UrlDecode(signatureB64))) {
      throw new Error('Assinatura do token inválida.');
    }
  } else {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    if (!verifier.verify(cert, base64UrlDecode(signatureB64))) {
      throw new Error('Assinatura do token inválida.');
    }
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
};
