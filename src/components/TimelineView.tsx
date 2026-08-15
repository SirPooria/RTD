import React, { useState } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { MovieCard, toPersianDigits } from './MovieCard';
import {
  CheckCircle2,
  Filter,
  Search,
  Sparkles,
  Film,
  Shield,
  Flame,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  BarChart2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const TimelineView: React.FC = () => {
  const {
    items,
    eras,
    watchedIds,
    markEraAsWatched,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    selectedEraId,
    setSelectedEraId,
    progressPercentage,
    watchedCount,
    totalItemsCount,
    essentialWatchedCount,
    essentialCount,
    totalWatchedRuntimeMinutes,
    visitorStats
  } = useTimeline();

  const [showBriefing, setShowBriefing] = useState(false);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search match
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.titleFa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.watchFor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tiesIn.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status Filter match
    const isWatched = watchedIds.has(item.id);
    if (statusFilter === 'essential' && !item.isEssential) return false;
    if (statusFilter === 'optional' && item.isEssential) return false;
    if (statusFilter === 'watched' && !isWatched) return false;
    if (statusFilter === 'unwatched' && isWatched) return false;

    // Type Filter match
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;

    // Era Filter match
    if (selectedEraId !== 'all' && item.eraId !== selectedEraId) return false;

    return true;
  });

  const hoursWatched = Math.floor(totalWatchedRuntimeMinutes / 60);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-xs font-semibold mb-4">
            <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>راهنمای جامع و تایم‌لاین کامل تا فیلم "انتقام‌جویان: روز رستاخیز" (Doomsday)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-100 mb-3 text-glow-emerald">
            جدول زمانی کامل فیلم‌ها و سریال‌های MCU
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            تمام ۷۸ عنوان رسمی شامل فیلم‌ها، سریال‌ها، برنامه‌های ویژه و حماسه فاکس/مردان ایکس به ترتیب زمانی.
          </p>
        </div>
      </div>

      {/* Grid Layout: Sidebar + Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left/Sidebar Panel (RTL: Stats & Filters Sticky Drawer) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-20 space-y-6">
            {/* Progress Circular Widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>پیشرفت کل در مسیر دومزدی</span>
              </h3>

              {/* Circular Gauge */}
              <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-700 stroke-current drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    strokeWidth="3.5"
                    strokeDasharray={`${progressPercentage}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ٪{toPersianDigits(progressPercentage)}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">تکمیل شده</span>
                </div>
              </div>

              {/* Stat breakdown list */}
              <div className="space-y-2 text-xs border-t border-slate-800 pt-3 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">دیده‌شده:</span>
                  <span className="font-bold text-slate-100 font-mono">
                    {toPersianDigits(watchedCount)} از {toPersianDigits(totalItemsCount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-medium">آثار حیاتی (سبز):</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    {toPersianDigits(essentialWatchedCount)} از {toPersianDigits(essentialCount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">زمان سپری‌شده:</span>
                  <span className="font-bold text-slate-200 font-mono">~{toPersianDigits(hoursWatched)} ساعت</span>
                </div>
              </div>
            </div>

            {/* Quick Era Jump Links */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl hidden lg:block">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                پرش سریع به دوره‌ها
              </h3>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => setSelectedEraId('all')}
                  className={`w-full text-right px-3 py-2 rounded-xl transition-colors font-medium cursor-pointer ${
                    selectedEraId === 'all'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  نمایش همه دوره‌ها
                </button>
                {eras.map((era) => (
                  <button
                    key={era.id}
                    onClick={() => setSelectedEraId(era.id)}
                    className={`w-full text-right px-3 py-2 rounded-xl transition-colors font-medium cursor-pointer truncate ${
                      selectedEraId === era.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {era.titleFa.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Visitors Weekly Chart Mini Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl hidden lg:block">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>آمار بازدیدکنندگان این هفته</span>
              </div>
              <div className="h-28 w-full dir-ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitorStats}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="visitors" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Main Timeline Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sticky Search & Filter Bar */}
          <div className="sticky top-4 z-30 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو در نام فیلم، سریال یا توضیحات..."
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-slate-400 flex items-center gap-1 ml-1">
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  فیلتر:
                </span>

                {/* Filter Status Buttons */}
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  همه ({toPersianDigits(items.length)})
                </button>

                <button
                  onClick={() => setStatusFilter('essential')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                    statusFilter === 'essential'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  فقط حیاتی (سبز)
                </button>

                <button
                  onClick={() => setStatusFilter('optional')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                    statusFilter === 'optional'
                      ? 'bg-slate-800 border-slate-600 text-slate-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  جانبی/اختیاری (خاکستری)
                </button>

                <button
                  onClick={() => setStatusFilter('unwatched')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    statusFilter === 'unwatched'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  دیده‌نشده‌ها
                </button>

                {/* Type selector */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'movie' | 'series')}
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">همه فرمت‌ها</option>
                  <option value="movie">فقط فیلم‌ها</option>
                  <option value="series">فقط سریال‌ها</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timeline List Content */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
              <RotateCcw className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-spin" />
              <h3 className="text-lg font-bold text-slate-300 mb-1">هیچ فیلم یا سریالی پیدا نشد</h3>
              <p className="text-xs text-slate-500 mb-4">لطفاً فیلترهای جستجو یا وضعیت را تغییر دهید.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setSelectedEraId('all');
                }}
                className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400 transition-colors"
              >
                پاک کردن تمام فیلترها
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {eras.map((era) => {
                const eraItems = filteredItems.filter((item) => item.eraId === era.id);
                if (eraItems.length === 0) return null;

                const allInEraWatched = eraItems.every((item) => watchedIds.has(item.id));

                return (
                  <div key={era.id} className="relative">
                    {/* Era Section Header */}
                    <div className="sticky top-20 z-20 bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-800 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                      <div>
                        <div className="text-xs text-emerald-400 font-mono font-semibold dir-ltr mb-0.5">
                          {era.titleEn}
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                          <span>{era.titleFa}</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">{era.descriptionFa}</p>
                      </div>

                      {/* Era Mark All Button */}
                      <button
                        onClick={() => markEraAsWatched(era.id)}
                        disabled={allInEraWatched}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          allInEraWatched
                            ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                        }`}
                        id={`btn-mark-era-${era.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {allInEraWatched
                            ? 'همه این دوره دیده شد'
                            : 'علامت‌گذاری همه در این بخش به عنوان دیده‌شده'}
                        </span>
                      </button>
                    </div>

                    {/* Vertical Timeline Container with Connecting Axis Line */}
                    <div className="relative pl-0 pr-6 md:pr-10 border-r-2 border-emerald-500/30 space-y-6">
                      {eraItems.map((item) => (
                        <div key={item.id} className="relative">
                          {/* Connected Node Dot on Vertical Axis */}
                          <div
                            className={`absolute -right-[31px] md:-right-[47px] top-6 w-5 h-5 rounded-full border-2 transition-all duration-300 z-10 flex items-center justify-center ${
                              item.isEssential
                                ? watchedIds.has(item.id)
                                  ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.9)]'
                                  : 'bg-slate-950 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                : watchedIds.has(item.id)
                                ? 'bg-slate-600 border-slate-400'
                                : 'bg-slate-950 border-slate-700'
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                watchedIds.has(item.id) ? 'bg-slate-950' : item.isEssential ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                          </div>

                          {/* Movie Card */}
                          <MovieCard item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reveal Final Briefing Accordion (Spoilers + Doomsday setup) */}
          <div className="mt-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setShowBriefing(!showBriefing)}
              className="w-full flex items-center justify-between gap-3 text-right cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">
                    📜 خلاصه و تحلیل نهایی نقشه راه (شامل اسپویلر کامل مسیر دومزدی)
                  </h3>
                  <p className="text-xs text-slate-400">
                    کلید ارتباطی ۶۳ مورد حیاتی برای ورود مستقیم به فیلم Avengers: Doomsday
                  </p>
                </div>
              </div>

              {showBriefing ? (
                <ChevronUp className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>

            {showBriefing && (
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed animate-fadeIn">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                  <strong className="text-emerald-400 block mb-1 text-sm font-bold">
                    🎯 نقشه راه نهایی تا ۱۸ دسامبر ۲۰۲۶ (Avengers: Doomsday):
                  </strong>
                  برای آمادگی کامل جهت تماشای فیلم "انتقام‌جویان: روز رستاخیز"، تماشای ۶۳ مورد حیاتی (مشخص‌شده با رنگ سبز) کفایت می‌کند. در صورت کمبود زمان، محور اصلی پیرامون رویدادهای چندجهانی لوکی، دکتر استرنج ۲، ددپول و ولورین، چهار شگفت‌انگیز و تاندربولتز شکل می‌گیرد.
                </div>

                <ul className="space-y-2.5 list-disc list-inside text-slate-300">
                  <li>
                    <strong className="text-slate-100">بازگشت رابرت داونی جونیور:</strong> او نه در نقش تونی استارک، بلکه در نقش ویلن افسانه‌ای "دکتر دوم" (Doctor Doom) ظاهر خواهد شد.
                  </li>
                  <li>
                    <strong className="text-slate-100">نقش محوری لوکی و TVA:</strong> لوکی در انتهای فصل ۲ به نگهبان تمام خطوط زمانی تبدیل شد و TVA نقش کلیدی در سازماندهی دفاع در برابر تداخل ابعاد (Incursions) ایفا خواهد کرد.
                  </li>
                  <li>
                    <strong className="text-slate-100">برخورد جهان فاکس با MCU:</strong> با ورود رسمی ددپول، ولورین، نایت‌کراولر و بیست (Beast) از زمین-۱۰0۰۵، زمینه برای جنگ‌های مخفی (Secret Wars) آماده می‌شود.
                  </li>
                  <li>
                    <strong className="text-slate-100">ترکیب انتقام‌جویان جدید:</strong> سم ویلسون، شوری، شانگ‌چی، ثور، کَسی لنگ و اعضای تاندربولتز شالوده اصلی جبهه مقاومت زمین را تشکیل خواهند داد.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
