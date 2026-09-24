import { createHash, createHmac, randomBytes, randomInt } from 'node:crypto';

type Request = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type Response = {
  status: (code: number) => Response;
  json: (value: unknown) => void;
};

const providerErrorCodes = new Set([0, 2, 3, 4, 5, 6, 7, 10, 11, 12, 16, 17, 35, 108, 109, 110, 111]);
const attempts = new Map<string, { count: number; resetAt: number }>();

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

const normalizeIranPhone = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const digits = value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s()-]/g, '');
  if (/^09\d{9}$/.test(digits)) return digits;
  if (/^\+989\d{9}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^00989\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
  return null;
};

const isRateLimited = (key: string) => {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 3;
};

const decodeXml = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const extractProviderResult = (body: string) => {
  const match = body.match(/<(?:\w+:)?(?:string|SendByBaseNumber2Result)[^>]*>([\s\S]*?)<\/(?:\w+:)?(?:string|SendByBaseNumber2Result)>/i);
  return decodeXml(match?.[1] || body.replace(/<[^>]+>/g, ''));
};

const isSuccessfulProviderResult = (value: string) => {
  const numeric = Number(value);
  return /^\d+$/.test(value) && numeric > 0 && !providerErrorCodes.has(numeric);
};

const signChallenge = (payload: string) => {
  const encoded = Buffer.from(payload).toString('base64url');
  const secret = process.env.OTP_SIGNING_SECRET;
  if (!secret) throw new Error('OTP_SIGNING_SECRET is not configured');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
};

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'ورود به حساب الزامی است.' });

    const uid = await verifyFirebaseIdToken(token);
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || 'unknown';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body as { phoneNumber?: unknown };
    const phoneNumber = normalizeIranPhone(body?.phoneNumber);
    if (!phoneNumber) return res.status(400).json({ error: 'شماره موبایل ایران معتبر نیست.' });
    if (isRateLimited(`${uid}:${phoneNumber}`) || isRateLimited(`ip:${ip}`)) {
      return res.status(429).json({ error: 'تعداد درخواست‌ها زیاد است. یک دقیقه دیگر دوباره تلاش کنید.' });
    }

    const otp = String(randomInt(10000, 100000));
    const nonce = randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 5 * 60_000;
    const otpHash = createHash('sha256').update(`${nonce}:${otp}`).digest('hex');
    const challenge = signChallenge(JSON.stringify({ uid, phoneNumber, nonce, otpHash, expiresAt }));

    const params = new URLSearchParams({
      username: process.env.SMS_USERNAME || '',
      password: process.env.SMS_PASSWORD || '',
      text: otp,
      to: phoneNumber,
      bodyId: process.env.SMS_BODY_ID || ''
    });
    const providerResponse = await fetch(
      process.env.SMS_API_URL || 'https://api.payamak-panel.com/post/Send.asmx/SendByBaseNumber2',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      }
    );
    const providerBody = await providerResponse.text();
    const providerResult = extractProviderResult(providerBody);
    if (!providerResponse.ok || !isSuccessfulProviderResult(providerResult)) {
      console.error('SMS provider rejected request', {
        httpStatus: providerResponse.status,
        providerResult
      });
      return res.status(502).json({ error: 'پنل پیامک ارسال را نپذیرفت. تنظیمات پترن یا وضعیت شماره را بررسی کنید.' });
    }

    return res.status(200).json({ challenge, expiresAt });
  } catch (error) {
    console.error('OTP send failed', error);
    return res.status(500).json({ error: 'ارسال پیامک موقتاً با خطا روبه‌رو شد.' });
  }
}
