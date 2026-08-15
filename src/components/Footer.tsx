import React from 'react';
import { ShieldAlert, Heart, Flame } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 mt-16 py-8 text-center text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">مسیر دومزدی (Road to Doomsday)</span>
          <span>• راهنمای تایم‌لاین سینمایی مارول</span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <span>ساخته شده با</span>
          <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 inline" />
          <span>برای طرفداران ایرانی مارول</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400/90 font-mono">
          <Flame className="w-3.5 h-3.5" />
          <span>شمارش معکوس برای ۲۰۲۶ (Doomsday)</span>
        </div>
      </div>
    </footer>
  );
};
