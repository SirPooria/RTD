import React, { useState, useEffect } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { toPersianDigits } from './MovieCard';
import { ShieldAlert, BarChart3, Clock, CheckCircle2, User, UserCheck } from 'lucide-react';
import { UserAuthModal } from './UserAuthModal';

interface NavbarProps {
  currentView: 'timeline' | 'admin';
  setCurrentView: (view: 'timeline' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const { progressPercentage, watchedCount, totalItemsCount, isAdmin, currentUser } = useTimeline();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isPoorafAdmin = currentUser?.username?.toLowerCase() === 'pooraf';

  // Automatically exit admin view if current user is not Pooraf
  useEffect(() => {
    if (currentView === 'admin' && !isPoorafAdmin) {
      setCurrentView('timeline');
    }
  }, [currentView, isPoorafAdmin, setCurrentView]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setCurrentView('timeline')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div>
              <span className="text-lg font-black tracking-tight text-slate-100 group-hover:text-emerald-400 transition-colors">
                مسیر دومزدی
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 mr-2 font-mono dir-ltr">
                ROAD TO DOOMSDAY
              </span>
            </div>
          </div>

          {/* Progress Quick Badge */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>پیشرفت:</span>
            <strong className="text-emerald-400 font-mono">{toPersianDigits(progressPercentage)}٪</strong>
            <span className="text-slate-500">({toPersianDigits(watchedCount)}/{toPersianDigits(totalItemsCount)})</span>
          </div>

          {/* Navigation View Switcher Buttons & User Auth */}
          <div className="flex items-center gap-2">
            {/* User Login/Account Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentUser
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {currentUser ? (
                <>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentUser.username}</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-slate-400" />
                  <span>ورود / ثبت‌نام</span>
                </>
              )}
            </button>

            <button
              onClick={() => setCurrentView('timeline')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'timeline'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">تایم‌لاین اصلی</span>
              <span className="sm:hidden">تایم‌لاین</span>
            </button>

            {/* Admin Panel Button (Only rendered if user 'Pooraf' is logged in) */}
            {isPoorafAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">پنل مدیریت</span>
                <span className="sm:hidden">مدیریت</span>
                {isAdmin && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* User Auth Modal */}
      <UserAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
