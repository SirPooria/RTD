import { createSign } from 'node:crypto';

type Request = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type Response = {
  status: (code: number) => Response;
  json: (value: unknown) => void;
};

type RestField = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  timestampValue?: string;
  arrayValue?: { values?: RestField[] };
};

type RestDocument = { fields?: Record<string, RestField> };

const attempts = new Map<string, { count: number; resetAt: number }>();

const getClientIp = (req: Request) => {
  const header = req.headers?.['x-forwarded-for'];
  const value = Array.isArray(header) ? header[0] : header;
  return value?.split(',')[0]?.trim() || 'unknown';
};

const isRateLimited = (key: string) => {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
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

const readDocument = async (url: string, accessToken: string): Promise<RestDocument | null> => {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore read failed: ${response.status}`);
  return await response.json() as RestDocument;
};

const writeDocument = async (url: string, fields: Record<string, RestField>, accessToken: string, mask = Object.keys(fields)) => {
  const params = new URLSearchParams();
  mask.forEach((field) => params.append('updateMask.fieldPaths', field));
  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  if (!response.ok) throw new Error(`Firestore write failed: ${response.status}`);
};

const verifyPasswordAndCreateAuthUser = async (email: string, password: string) => {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error('FIREBASE_WEB_API_KEY is not configured');
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });

  if (response.ok) return await response.json() as { localId: string };
  const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
  if (error.error?.message !== 'EMAIL_EXISTS') throw new Error('Legacy account could not be created');

  const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  if (!signInResponse.ok) throw new Error('Legacy password does not match the migrated account');
  return await signInResponse.json() as { localId: string };
};

const stringValue = (fields: Record<string, RestField>, name: string) => fields[name]?.stringValue || '';

const booleanValue = (fields: Record<string, RestField>, name: string) => fields[name]?.booleanValue === true;

const arrayValue = (fields: Record<string, RestField>, name: string) =>
  (fields[name]?.arrayValue?.values || [])
    .map((value) => value.stringValue)
    .filter((value): value is string => Boolean(value))
    .slice(0, 500);

const normalizeIranPhone = (value: string) => {
  const digits = value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s()-]/g, '');
  if (/^09\d{9}$/.test(digits)) return digits;
  if (/^\+989\d{9}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^00989\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
  return '';
};

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body as { username?: unknown; password?: unknown };
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!/^[a-z0-9._]{3,32}$/.test(username) || password.length < 1 || password.length > 128) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
    }
    if (isRateLimited(`${getClientIp(req)}:${username}`)) {
      return res.status(429).json({ error: 'تعداد تلاش‌ها زیاد است. یک دقیقه دیگر دوباره تلاش کنید.' });
    }

    const accessToken = await getFirestoreAccessToken();
    const legacyUrl = firestoreDocumentUrl('users', username);
    const legacyDocument = await readDocument(legacyUrl, accessToken);
    const legacyFields = legacyDocument?.fields || {};
    if (!legacyDocument || stringValue(legacyFields, 'password') !== password) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    const email = `${username}@auth.rtd.local`;
    const authUser = await verifyPasswordAndCreateAuthUser(email, password);
    const nowIso = new Date().toISOString();
    const watchedIds = arrayValue(legacyFields, 'watchedIds');
    const watchedSwIds = arrayValue(legacyFields, 'watchedSwIds');
    const phoneNumber = normalizeIranPhone(stringValue(legacyFields, 'phoneNumber'));
    const verifiedAt = stringValue(legacyFields, 'phoneVerifiedAt');
    const profileFields: Record<string, RestField> = {
      username: { stringValue: username },
      registeredAt: { stringValue: stringValue(legacyFields, 'registeredAt') || nowIso },
      lastLoginAt: { stringValue: nowIso },
      watchedMcuCount: { integerValue: String(watchedIds.length) },
      watchedSwCount: { integerValue: String(watchedSwIds.length) },
      watchedIds: { arrayValue: { values: watchedIds.map((id) => ({ stringValue: id })) } },
      watchedSwIds: { arrayValue: { values: watchedSwIds.map((id) => ({ stringValue: id })) } },
      legacyMigratedAt: { timestampValue: nowIso }
    };

    if (phoneNumber) profileFields.phoneNumber = { stringValue: phoneNumber };
    // Only trust legacy numbers that have an actual verification timestamp.
    if (phoneNumber && booleanValue(legacyFields, 'phoneVerified') && verifiedAt) {
      profileFields.phoneVerified = { booleanValue: true };
      profileFields.phoneVerifiedAt = { timestampValue: verifiedAt };
    } else {
      profileFields.phoneVerified = { booleanValue: false };
    }

    await writeDocument(firestoreDocumentUrl('users', authUser.localId), profileFields, accessToken);
    // Remove the plaintext password after the new Firebase Auth account is ready.
    await writeDocument(legacyUrl, {
      migratedToUid: { stringValue: authUser.localId },
      migratedAt: { timestampValue: nowIso }
    }, accessToken, ['migratedToUid', 'migratedAt', 'password']);

    return res.status(200).json({ migrated: true });
  } catch (error) {
    console.error('Legacy account migration failed', error);
    return res.status(500).json({ error: 'ورود موقتاً با خطا روبه‌رو شد. دوباره تلاش کنید.' });
  }
}
