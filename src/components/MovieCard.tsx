import React, { useState } from 'react';
import { MCUItem } from '../types';
import { useTimeline } from '../context/TimelineContext';
import { Check, ChevronDown, ChevronUp, Star, Film, Tv, PlayCircle, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';

interface MovieCardProps {
  item: MCUItem;
}

// Convert English digits to Persian digits for clean RTL UI
export const toPersianDigits = (num: number | string): string => {
  const persianMap = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (d) => persianMap[parseInt(d, 10)]);
};

export const MovieCard: React.FC<MovieCardProps> = ({ item }) => {
  const { watchedIds, toggleWatched, setSelectedItem } = useTimeline();
  const isWatched = watchedIds.has(item.id);

  const [expandedSection, setExpandedSection] = useState<'watchFor' | 'tiesIn' | null>(null);

  const toggleSection = (section: 'watchFor' | 'tiesIn') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const isEssential = item.isEssential;

  // Color theme classes based on essential vs optional
  const borderColor = isEssential
    ? isWatched
      ? 'border-emerald-500/80 bg-slate-900/90 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
      : 'border-emerald-500/50 hover:border-emerald-400 bg-slate-900/60 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
    : isWatched
    ? 'border-slate-600/70 bg-slate-900/80'
    : 'border-slate-800 hover:border-slate-700 bg-slate-900/40';

  const checkboxBg = isEssential
    ? isWatched
      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
      : 'border-emerald-500/60 hover:border-emerald-400 hover:bg-emerald-500/10'
    : isWatched
    ? 'bg-slate-600 border-slate-500 text-slate-100'
    : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800/50';

  const badgeTheme = isEssential
    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    : 'bg-slate-800/80 text-slate-400 border border-slate-700/60';

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 p-4 sm:p-5 backdrop-blur-sm ${borderColor} ${
        isWatched ? 'opacity-95' : 'opacity-100'
      }`}
    >
      {/* Top Bar: Checkbox, Chrono Order Badge, Essential Tag */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Custom Checkbox */}
          <button
            onClick={() => toggleWatched(item.id)}
            title={isWatched ? 'علامت به عنوان دیده‌نشده' : 'علامت به عنوان دیده‌شده'}
            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ${checkboxBg}`}
            id={`checkbox-${item.id}`}
          >
            {isWatched && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          {/* Chronological Number Badge */}
          <div className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono tracking-wider ${badgeTheme}`}>
            مرحله #{toPersianDigits(item.chronoOrder)}
          </div>

          {/* Essential vs Optional Tag */}
          {isEssential ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              حیاتی برای دومزدی
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50">
              داستان جانبی (اختیاری)
            </span>
          )}
        </div>

        {/* RT Score Badge */}
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0"
          title="امتیاز روتن توماتوز (Rotten Tomatoes)"
        >
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>٪{toPersianDigits(item.rtScore)}</span>
        </div>
      </div>

      {/* Card Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4 items-start">
        {/* Poster Thumbnail */}
        <div
          onClick={() => setSelectedItem(item)}
          className="relative group/poster aspect-[2/3] md:w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer"
        >
          <img
            src={item.posterUrl}
            alt={item.titleFa}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/poster:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center">
            <PlayCircle className="w-8 h-8 text-emerald-400 drop-shadow-md" />
          </div>
        </div>

        {/* Title & Metadata */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
            <h3
              onClick={() => setSelectedItem(item)}
              className={`text-lg sm:text-xl font-bold cursor-pointer transition-colors ${
                isWatched
                  ? 'text-slate-300 line-through decoration-emerald-500/70'
                  : isEssential
                  ? 'text-slate-100 hover:text-emerald-400'
                  : 'text-slate-200 hover:text-slate-400'
              }`}
            >
              {item.titleFa}
            </h3>
            <span className="text-xs text-slate-400 font-mono dir-ltr">{item.titleEn}</span>
          </div>

          {/* Meta Information Bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 mb-3 font-medium">
            <span className="flex items-center gap-1">
              {item.type === 'movie' ? (
                <Film className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Tv className="w-3.5 h-3.5 text-slate-400" />
              )}
              {item.type === 'movie' ? 'فیلم سینمایی' : 'سریال / مینی‌سریال'}
            </span>

            <span className="text-slate-600">•</span>
            <span>زمان درون‌داستانی: <strong className="text-slate-200 font-semibold">{toPersianDigits(item.inUniverseYear)}</strong></span>

            <span className="text-slate-600">•</span>
            <span>انتشار: {toPersianDigits(item.releaseYear)}</span>

            <span className="text-slate-600">•</span>
            <span>مدت: {item.runtimeOrEpsDisplay ? toPersianDigits(item.runtimeOrEpsDisplay) : `${toPersianDigits(item.runtimeMinutes)} دقیقه`}</span>
          </div>

          {item.timelineNote && (
            <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
              {toPersianDigits(item.timelineNote)}
            </div>
          )}

          {/* Expandable Accordion Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
            {/* Button 1: چرا باید دید؟ */}
            <button
              onClick={() => toggleSection('watchFor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                expandedSection === 'watchFor'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              id={`btn-watchfor-${item.id}`}
            >
              <span>چرا باید دید؟</span>
              {expandedSection === 'watchFor' ? (
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Button 2: ارتباط با داستان اصلی */}
            <button
              onClick={() => toggleSection('tiesIn')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                expandedSection === 'tiesIn'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              id={`btn-tiesin-${item.id}`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>ارتباط با داستان اصلی (Doomsday)</span>
              {expandedSection === 'tiesIn' ? (
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* View details modal button */}
            <button
              onClick={() => setSelectedItem(item)}
              className="mr-auto text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors px-2 py-1 cursor-pointer"
            >
              <span>جزئیات بیشتر</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Expanded Content Accordion */}
          {expandedSection === 'watchFor' && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed animate-fadeIn">
              <strong className="text-emerald-400 block mb-1">دلایل اصلی تماشا:</strong>
              {item.watchFor}
            </div>
          )}

          {expandedSection === 'tiesIn' && (
            <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed animate-fadeIn">
              <strong className="text-emerald-400 block mb-1">ارتباط با خط زمانی و نبرد دومزدی:</strong>
              {item.tiesIn}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
