import React from 'react';
import { useTimeline } from '../context/TimelineContext';
import { toPersianDigits } from './MovieCard';
import { X, Check, Star, ShieldAlert, Sparkles, Film, ExternalLink, Users, Calendar, Clock } from 'lucide-react';

export const MovieDetailModal: React.FC = () => {
  const { selectedItem, setSelectedItem, watchedIds, toggleWatched } = useTimeline();

  if (!selectedItem) return null;

  const isWatched = watchedIds.has(selectedItem.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Backdrop */}
        <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-950">
          <img
            src={selectedItem.posterUrl}
            alt={selectedItem.titleFa}
            className="w-full h-full object-cover opacity-40 blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 left-4 p-2 rounded-full bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge over image */}
          <div className="absolute bottom-4 right-6 left-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-emerald-400 font-bold mb-1">
                مرحله #{toPersianDigits(selectedItem.chronoOrder)} در تایم‌لاین MCU
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
                {selectedItem.titleFa}
              </h2>
              <div className="text-xs text-slate-400 font-mono dir-ltr">{selectedItem.titleEn}</div>
            </div>

            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-xl text-xs font-bold">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>٪{toPersianDigits(selectedItem.rtScore)}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="text-slate-400 mb-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                سال درون‌داستانی
              </div>
              <div className="font-bold text-slate-100">{toPersianDigits(selectedItem.inUniverseYear)}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="text-slate-400 mb-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                مدت زمان
              </div>
              <div className="font-bold text-slate-100">{toPersianDigits(selectedItem.runtimeMinutes)} دقیقه</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="text-slate-400 mb-0.5 flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                سال انتشار
              </div>
              <div className="font-bold text-slate-100">{toPersianDigits(selectedItem.releaseYear)}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="text-slate-400 mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                نوع اثر
              </div>
              <div className="font-bold text-slate-100">
                {selectedItem.type === 'movie' ? 'فیلم سینمایی' : 'سریال'}
              </div>
            </div>
          </div>

          {/* WatchFor Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs">
            <strong className="text-emerald-400 block mb-1 font-bold text-sm">چرا باید این فیلم/سریال را دید؟</strong>
            <p className="text-slate-300 leading-relaxed">{selectedItem.watchFor}</p>
          </div>

          {/* Doomsday Tie-In Section */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 text-xs">
            <strong className="text-emerald-400 block mb-1 font-bold text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              ارتباط با خط داستانی نهایی "انتقام‌جویان: روز رستاخیز"
            </strong>
            <p className="text-emerald-200/90 leading-relaxed">{selectedItem.tiesIn}</p>
          </div>

          {/* Key Characters */}
          {selectedItem.keyCharacters && selectedItem.keyCharacters.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                شخصیت‌های کلیدی:
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedItem.keyCharacters.map((char, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => toggleWatched(selectedItem.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isWatched
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isWatched ? 'علامت به عنوان دیده‌نشده' : 'علامت زدن به عنوان دیده‌شده'}</span>
          </button>

          {selectedItem.trailerUrl && (
            <a
              href={selectedItem.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <span>مشاهده تریلر (یوتیوب)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
