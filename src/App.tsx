import React, { useState } from 'react';
import { TimelineProvider } from './context/TimelineContext';
import { Navbar } from './components/Navbar';
import { TimelineView } from './components/TimelineView';
import { AdminDashboard } from './components/AdminDashboard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { PhoneVerificationModal } from './components/PhoneVerificationModal';
import { Analytics } from '@vercel/analytics/react';
import { Footer } from './components/Footer';

// فلگ تایید شماره موبایل و ارسال پیامک (در صورت نیاز به فعال‌سازی مجدد کافیست مقدار آن را true کنید)
const ENABLE_PHONE_VERIFICATION = false;

export default function App() {
  const [currentView, setCurrentView] = useState<'timeline' | 'admin'>('timeline');

  return (
    <TimelineProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Vazirmatn',sans-serif] selection:bg-emerald-500 selection:text-slate-950">
        <Navbar currentView={currentView} setCurrentView={setCurrentView} />

        <main className="flex-1">
          {currentView === 'timeline' ? <TimelineView /> : <AdminDashboard />}
        </main>
        <MovieDetailModal />
        {/* دریافت شماره تلفن و تایید پیامکی موقتاً غیرفعال شده است */}
        {ENABLE_PHONE_VERIFICATION && <PhoneVerificationModal />}
        <Footer />
        <Analytics />
      </div>
    </TimelineProvider>
  );
}