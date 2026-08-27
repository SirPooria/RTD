import React, { useState, useEffect } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { toPersianDigits } from './MovieCard';
import { ShieldAlert, BarChart3, Clock, CheckCircle2, User, UserCheck, Orbit, Flame } from 'lucide-react';
import { UserAuthModal } from './UserAuthModal';

interface NavbarProps {
  currentView: 'timeline' | 'admin';
  setCurrentView: (view: 'timeline' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const { 
    universe, 
    setUniverse, 
    progressPercentage, 
    watchedCount, 
    totalItemsCount, 
    isAdmin, 
    currentUser 
  } = useTimeline();
  
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
            <div className={`w-10 h-10 rounded-xl p-0.5 transition-transform group-hover:scale-105 ${
              universe === 'mcu' 
                ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                : 'bg-gradient-to-tr from-cyan-600 to-blue-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
            }`}>
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                {universe === 'mcu' ? (
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Orbit className="w-5 h-5 text-cyan-400" />
                )}
              </div>
            </div>

            <div>
              <span className={`text-lg font-black tracking-tight transition-colors ${
                universe === 'mcu' 
                  ? 'text-slate-100 group-hover:text-emerald-400' 
                  : 'text-slate-100 group-hover:text-cyan-400'
              }`}>
                {universe === 'mcu' ? 'مسیر دومزدی' : 'کهکشان استاروارز'}
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 mr-2 font-mono dir-ltr">
                {universe === 'mcu' ? 'ROAD TO DOOMSDAY' : 'STAR WARS SAGA'}
              </span>
            </div>
          </div>

          {/* Universe Switcher (مارول / استاروارز) */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setUniverse('mcu')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                universe === 'mcu'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>مارول</span>
            </button>
            <button
              onClick={() => setUniverse('starwars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                universe === 'starwars'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span>استاروارز</span>
            </button>
          </div>

          {/* Progress Quick Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <CheckCircle2 className={`w-4 h-4 ${universe === 'mcu' ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <span>پیشرفت:</span>
            <strong className={`font-mono ${universe === 'mcu' ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {toPersianDigits(progressPercentage)}٪
            </strong>
            <span className="text-slate-500">
              ({toPersianDigits(watchedCount)}/{toPersianDigits(totalItemsCount)})
            </span>
          </div>

          {/* Navigation View Switcher Buttons & User Auth */}
          <div className="flex items-center gap-2">
            {/* User Login/Account Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentUser
                  ? universe === 'mcu'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {currentUser ? (
                <>
                  <UserCheck className={`w-4 h-4 ${universe === 'mcu' ? 'text-emerald-400' : 'text-cyan-400'}`} />
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
                  ? universe === 'mcu'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">تایم‌لاین</span>
            </button>

            {/* Admin Panel Button */}
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