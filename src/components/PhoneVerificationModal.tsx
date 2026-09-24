import React, { useState, useEffect } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { normalizeIranPhone } from '../lib/phone';

export const PhoneVerificationModal: React.FC = () => {
  const { currentUser } = useTimeline();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [challenge, setChallenge] = useState('');
  const [timer, setTimer] = useState(300);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsOpen(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    return onSnapshot(
      userDocRef,
      (snapshot) => {
        const userData = snapshot.data();
        const verifiedPhone = typeof userData?.phoneNumber === 'string'
          ? normalizeIranPhone(userData.phoneNumber)
          : null;

        if (userData?.phoneVerified === true && verifiedPhone) {
          setIsOpen(false);
          setChallenge('');
          setOtpCode('');
          return;
        }

        setStep('phone');
        setPhoneNumber('');
        setOtpCode('');
        setChallenge('');
        setErrorMessage('');
        setSuccessMessage('');
        setIsOpen(true);
      },
      (err) => {
        console.error('Error checking user phone:', err);
        setErrorMessage('وضعیت شماره قابل بررسی نیست. صفحه را دوباره بارگذاری کنید.');
      }
    );
  }, [currentUser]);

  useEffect(() => {
  if (step !== 'otp' || timer <= 0) {
    return;
  }

  const intervalId = window.setInterval(() => {
    setTimer((previous) => previous - 1);
  }, 1000);

  return () => {
    window.clearInterval(intervalId);
  };
}, [step, timer]);

  if (!isOpen || !currentUser) return null;

  const handleSendOtp = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPhone = normalizeIranPhone(phoneNumber);
    if (!cleanPhone) {
      setErrorMessage('شماره معتبر وارد کنید؛ نمونه‌های قابل قبول: 09123456789 یا +989123456789');
      return;
    }

    setIsLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('نشست کاربر منقضی شده است. دوباره وارد شوید.');
      const response = await fetch('/api/sms/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: cleanPhone })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'ارسال پیامک انجام نشد.');
      setPhoneNumber(cleanPhone);
      setChallenge(result.challenge);
      setStep('otp');
      setTimer(300);
      setSuccessMessage('کد تایید ارسال شد. تا ۵ دقیقه فرصت دارید.');
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

    setIsLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('نشست کاربر منقضی شده است. دوباره وارد شوید.');
      const response = await fetch('/api/sms/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ challenge, code: otpCode })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'کد تایید نادرست است.');
      setIsOpen(false);
      setChallenge('');
    } catch (err: any) {
      console.error('Error attaching phone to user:', err);
      setErrorMessage(err?.message || 'خطا در تایید شماره.');
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
