import { createHash, createHmac, createSign, timingSafeEqual } from 'node:crypto';

type Request = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type Response = {
  status: (code: number) => Response;
  json: (value: unknown) => void;
};

const getBearerToken = (req: Request) => {
  const header = req.headers?.authorization || req.headers?.Authorization;
  const value = Array.isArray(header) ? header[0] : header;
  return value?.startsWith('Bearer ') ? value.slice(7) : null;
};

const verifyFirebaseIdToken = async (token: string) => {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error('FIREBASE_WEB_API_KEY is not configured');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token })
  });
  const data = await response.json() as { users?: Array<{ localId?: string }> };
  if (!response.ok || !data.users?.[0]?.localId) throw new Error('Invalid Firebase ID token');
  return data.users[0].localId;
};

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

const getFirestoreAccessToken = async () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase Admin environment variables are not configured');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey, 'base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`
    })
  });
  const data = await response.json() as { access_token?: string };
  if (!response.ok || !data.access_token) throw new Error('Could not obtain Firebase access token');
  return data.access_token;
};

const firestoreDocumentUrl = (collection: string, id: string) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not configured');
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents/${collection}/${encodeURIComponent(id)}`;
};

const setFirestoreFields = async (url: string, fields: Record<string, unknown>, accessToken: string) => {
  const params = new URLSearchParams();
  Object.keys(fields).forEach((field) => params.append('updateMask.fieldPaths', field));
  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  if (!response.ok) throw new Error(`Firestore write failed: ${response.status}`);
};

const verifyChallenge = (challenge: string) => {
  const [encoded, signature] = challenge.split('.');
  const secret = process.env.OTP_SIGNING_SECRET;
  if (!secret || !encoded || !signature) return null;
  const expected = createHmac('sha256', secret).update(encoded).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      uid: string;
      phoneNumber: string;
      nonce: string;
      otpHash: string;
      expiresAt: number;
    };
    return payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
};

const normalizeDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'ورود به حساب الزامی است.' });
    const uid = await verifyFirebaseIdToken(token);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body as { challenge?: unknown; code?: unknown };
    const challenge = typeof body?.challenge === 'string' ? verifyChallenge(body.challenge) : null;
    const code = typeof body?.code === 'string' ? normalizeDigits(body.code).trim() : '';

    if (!challenge || challenge.uid !== uid || !/^\d{5}$/.test(code)) {
      return res.status(400).json({ error: 'کد تایید نامعتبر یا منقضی شده است.' });
    }

    const suppliedHash = createHash('sha256').update(`${challenge.nonce}:${code}`).digest('hex');
    if (suppliedHash !== challenge.otpHash) {
      return res.status(400).json({ error: 'کد تایید واردشده نادرست است.' });
    }

    const accessToken = await getFirestoreAccessToken();
    const leadUrl = firestoreDocumentUrl('phone_leads', challenge.phoneNumber);
    const challengeUrl = firestoreDocumentUrl('otp_challenges', challenge.nonce);
    const usedChallengeResponse = await fetch(challengeUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (usedChallengeResponse.ok) {
      return res.status(400).json({ error: 'این کد قبلاً استفاده شده است.' });
    }
    const existingLeadResponse = await fetch(leadUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (existingLeadResponse.ok) {
      const existingLead = await existingLeadResponse.json() as { fields?: { uid?: { stringValue?: string } } };
      if (existingLead.fields?.uid?.stringValue && existingLead.fields.uid.stringValue !== uid) {
        return res.status(409).json({ error: 'این شماره قبلاً برای حساب دیگری ثبت شده است.' });
      }
    }

    const nowIso = new Date().toISOString();
    await setFirestoreFields(firestoreDocumentUrl('users', uid), {
      phoneNumber: { stringValue: challenge.phoneNumber },
      phoneVerified: { booleanValue: true },
      phoneVerifiedAt: { timestampValue: nowIso }
    }, accessToken);
    await setFirestoreFields(leadUrl, {
      uid: { stringValue: uid },
      phoneNumber: { stringValue: challenge.phoneNumber },
      verifiedAt: { timestampValue: nowIso }
    }, accessToken);
    await setFirestoreFields(challengeUrl, {
      uid: { stringValue: uid },
      usedAt: { timestampValue: nowIso }
    }, accessToken);

    return res.status(200).json({ verified: true, phoneNumber: challenge.phoneNumber });
  } catch (error) {
    console.error('OTP verification failed', error);
    return res.status(500).json({ error: 'تایید شماره موقتاً با خطا روبه‌رو شد.' });
  }
}
