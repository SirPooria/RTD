import React, { useState } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { User, Lock, LogIn, UserPlus, X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, loginUser, registerUser, logoutUser } = useTimeline();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMsg('نام کاربری باید حداقل ۳ کاراکتر باشد.');
      return;
    }

    if (password.trim().length < 4) {
      setErrorMsg('رمز عبور باید حداقل ۴ کاراکتر باشد.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await registerUser(username.trim(), password.trim());
        if (res.success) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            onClose();
            setUsername('');
            setPassword('');
          }, 1200);
        } else {
          setErrorMsg(res.message);
        }
      } else {
        const res = await loginUser(username.trim(), password.trim());
        if (res.success) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            onClose();
            setUsername('');
            setPassword('');
          }, 1200);
        } else {
          setErrorMsg(res.message);
        }
      }
    } catch (err: any) {
      setErrorMsg('خطایی رخ داد: ' + (err?.message || 'مشکل در برقراری ارتباط'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logged in state view */}
        {currentUser ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">حساب کاربری فعال</h3>
              <p className="text-sm text-emerald-400 font-mono mt-1">@{currentUser.username}</p>
              <p className="text-xs text-slate-400 mt-2">
                اطلاعات شما و لیست فیلم‌های دیده‌شده به صورت زنده در پایگاه داده پروژه ثبت شده است.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={logoutUser}
                className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                خروج از حساب کاربری
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition-all cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
                {mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-bold text-slate-100">
                {mode === 'login' ? 'ورود به حساب کاربری' : 'ثبت‌نام کاربر جدید'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                اطلاعات شما به صورت مستقیم در دیتابیس پروژه ثبت خواهد شد
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-950 rounded-2xl p-1 mb-6 border border-slate-800">
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ورود
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ثبت‌نام جدید
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 text-right">
                  نام کاربری (Username)
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: ali_marvel"
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 text-right">
                  رمز عبور (Password)
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور خود را وارد کنید"
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>در حال ارتباط با دیتابیس...</span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ورود به حساب</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>ثبت‌نام و ذخیره در دیتابیس</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
