import { useState } from 'react';
import { TimelineProvider } from './context/TimelineContext';
import { Navbar } from './components/Navbar';
import { TimelineView } from './components/TimelineView';
import { AdminDashboard } from './components/AdminDashboard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { Footer } from './components/Footer';

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
        <Footer />
      </div>
    </TimelineProvider>
  );
}

