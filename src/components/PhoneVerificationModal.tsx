import React, { useState, useEffect } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const PhoneVerificationModal: React.FC = () => {
  const { currentUser } = useTimeline();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // بررسی وضعیت شماره کاربر (هم از حافظه لوکال و هم از فایربیس)
  useEffect(() => {
    if (!currentUser?.username) {
      setIsOpen(false);
      return;
    }

    const cleanUsername = currentUser.username.trim().toLowerCase();

    // ۱. بررسی سریع در حافظه لوکال
    const localPhone = localStorage.getItem(`phone_verified_${cleanUsername}`);
    if (localPhone) {
      setIsOpen(false);
      return;
    }

    // ۲. بررسی در دیتابیس Firestore
    const userDocRef = doc(db, 'users', cleanUsername);
    getDoc(userDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.phoneNumber && userData.phoneNumber.trim().length >= 10) {
            // شماره در دیتابیس هست؛ در حافظه ذخیره می‌کنیم تا دیگر باز نشود
            localStorage.setItem(`phone_verified_${cleanUsername}`, userData.phoneNumber.trim());
            setIsOpen(false);
          } else {
            // کاربر شماره ندارد؛ باز شدن فرم از مرحله اول
            setStep('phone');
            setPhoneNumber('');
            setOtpCode('');
            setErrorMessage('');
            setIsOpen(true);
          }
        }
      })
      .catch((err) => {
        console.error('Error checking user phone:', err);
      });
  }, [currentUser]);

  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen || !currentUser) return null;

  const isValidIranPhone = (phone: string) => {
    return /^09[0-9]{9}$/.test(phone.trim());
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPhone = phoneNumber.trim();
    if (!isValidIranPhone(cleanPhone)) {
      setErrorMessage('لطفاً شماره موبایل معتبر ۱۱ رقمی وارد کنید (مثال: 09123456789)');
      return;
    }

    setIsLoading(true);
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedOtp(code);

    try {
      const params = new URLSearchParams();
      params.append('username', '989387596456');
      params.append('password', '8fd880f4-1576-41c8-80c0-ca5fd00f194b');
      params.append('text', code);
      params.append('to', cleanPhone);
      params.append('bodyId', '534645');

      const response = await fetch('/api/sms/post/Send.asmx/SendByBaseNumber2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      const responseText = await response.text();
      const match = responseText.match(/<string[^>]*>(.*?)<\/string>/);
      const resultVal = match ? match[1].trim() : responseText.trim();

      if (resultVal.length >= 10 || (!isNaN(Number(resultVal)) && Number(resultVal) > 100)) {
        setStep('otp');
        setTimer(60);
        setSuccessMessage('کد تایید با موفقیت پیامک شد.');
      } else {
        throw new Error(`خطای پنل پیامک (کد: ${resultVal})`);
      }
    } catch (err: any) {
      console.error('SMS Send Error:', err);
      setErrorMessage(err?.message || 'خطا در ارسال پیامک. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpCode.trim() !== generatedOtp) {
      setErrorMessage('کد تایید وارد شده نادرست است.');
      return;
    }

    setIsLoading(true);
    const cleanPhone = phoneNumber.trim();
    const nowIso = new Date().toISOString();
    const cleanUsername = currentUser.username.trim().toLowerCase();

    try {
      // ذخیره در دیتابیس کاربر
      await setDoc(
        doc(db, 'users', cleanUsername),
        {
          phoneNumber: cleanPhone,
          phoneVerified: true,
          phoneVerifiedAt: nowIso
        },
        { merge: true }
      );

      // ذخیره در سرنخ‌های شماره برای بینجر
      await setDoc(
        doc(db, 'phone_leads', cleanPhone),
        {
          phoneNumber: cleanPhone,
          username: cleanUsername,
          verifiedAt: nowIso
        },
        { merge: true }
      );

      // ثبت در لوکال‌استوریج تا با ریفرش دوباره باز نشود
      localStorage.setItem(`phone_verified_${cleanUsername}`, cleanPhone);
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error attaching phone to user:', err);
      localStorage.setItem(`phone_verified_${cleanUsername}`, cleanPhone);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md text-right">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-bold text-center text-white mb-2">
          تایید شماره حساب کاربری
        </h3>

        <p className="text-sm text-slate-300 text-center mb-4 leading-relaxed">
          کاربر گرامی <span className="text-emerald-400 font-bold">{currentUser.username}</span>لطفاً شماره موبایل خود را تایید کنید.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl text-center">
            {successMessage}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                شماره موبایل
              </label>
              <input
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 tracking-wider text-base"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-emerald-900/30 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'در حال ارسال کد...' : 'ارسال کد تایید پیامکی'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  ویرایش شماره
                </button>
                <label className="text-xs font-medium text-slate-400">
                  کد تایید ۵ رقمی
                </label>
              </div>
              <input
                type="text"
                dir="ltr"
                maxLength={5}
                placeholder="— — — — —"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-2xl font-bold tracking-widest text-emerald-400 placeholder-slate-700 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div className="text-center text-xs text-slate-400">
              {timer > 0 ? (
                <span>ارسال مجدد کد تا {timer} ثانیه دیگر</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  ارسال مجدد کد تایید
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length < 5}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-emerald-900/30 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'در حال تایید...' : 'تایید شماره و ذخیره در حساب'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};