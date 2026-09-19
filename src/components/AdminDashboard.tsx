import React, { useState, useEffect, useMemo } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { MCUItem } from '../types';
import { toPersianDigits } from './MovieCard';
import { db } from '../lib/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart3,
  Database,
  Plus,
  Trash2,
  Edit,
  RotateCcw,
  Shield,
  Lock,
  Eye,
  Users,
  Search,
  UserCheck,
  Calendar,
  Film,
  Sparkles,
  Save,
  X,
  CheckCircle2,
  Phone,
  Download,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Star
} from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  registeredAt: string;
  lastLoginAt: string;
  watchedMcuCount: number;
  watchedSwCount: number;
  watchedTotalCount: number;
  watchedIds: string[];
  watchedSwIds: string[];
}

export const AdminDashboard: React.FC = () => {
  const {
    items,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    addItem,
    updateItem,
    deleteItem,
    resetToDefaultData
  } = useTimeline();

  const [activeTab, setActiveTab] = useState<'users' | 'dashboard' | 'content'>('users');
  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // دیتابیس زنده فایربیس
  const [registeredUsers, setRegisteredUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [phoneFilter, setPhoneFilter] = useState<'all' | 'withPhone' | 'noPhone'>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUser | null>(null);

  // صفحه‌بندی
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // فرم افزودن/ویرایش فیلم
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<MCUItem, 'id' | 'chronoOrder'>>({
    titleFa: '',
    titleEn: '',
    releaseYear: 2024,
    inUniverseYear: '~۲۰۲۴',
    runtimeMinutes: 120,
    type: 'movie',
    rtScore: 85,
    isEssential: true,
    eraId: 'era-4',
    watchFor: '',
    tiesIn: '',
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80'
  });

  useEffect(() => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    const usersColRef = collection(db, 'users');

    const unsubscribe = onSnapshot(
      usersColRef,
      (snapshot) => {
        const usersList: AdminUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const mcuIds = Array.isArray(data.watchedIds) ? data.watchedIds : [];
          const swIds = Array.isArray(data.watchedSwIds) ? data.watchedSwIds : [];
          const mcuCount = mcuIds.length || data.watchedMcuCount || (data.watchedCount || 0);
          const swCount = swIds.length || data.watchedSwCount || 0;

          usersList.push({
            id: docSnap.id,
            username: data.username || docSnap.id,
            phoneNumber: data.phoneNumber || '',
            phoneVerified: Boolean(data.phoneVerified),
            registeredAt: data.registeredAt || new Date().toISOString(),
            lastLoginAt: data.lastLoginAt || data.registeredAt || new Date().toISOString(),
            watchedMcuCount: mcuCount,
            watchedSwCount: swCount,
            watchedTotalCount: mcuCount + swCount,
            watchedIds: mcuIds,
            watchedSwIds: swIds
          });
        });

        // مرتب‌سازی بر اساس تاریخ ثبت نام
        usersList.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
        setRegisteredUsers(usersList);
        setLoadingUsers(false);
      },
      (error) => {
        console.error('Error fetching users from Firestore:', error);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // فیلتر کردن کاربران
  const filteredUsers = useMemo(() => {
    return registeredUsers.filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (u.phoneNumber && u.phoneNumber.includes(userSearchTerm));
      
      if (phoneFilter === 'withPhone') return matchSearch && Boolean(u.phoneNumber);
      if (phoneFilter === 'noPhone') return matchSearch && !u.phoneNumber;
      return matchSearch;
    });
  }, [registeredUsers, userSearchTerm, phoneFilter]);

  // کاربران صفحه جاری
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // کاربران برتر (بیشترین تماشا)
  const topUsers = useMemo(() => {
    return [...registeredUsers]
      .sort((a, b) => b.watchedTotalCount - a.watchedTotalCount)
      .slice(0, 5);
  }, [registeredUsers]);

  // آمار کلیدی
  const usersWithPhoneCount = registeredUsers.filter((u) => u.phoneNumber).length;
  const totalMcuWatched = registeredUsers.reduce((sum, u) => sum + u.watchedMcuCount, 0);
  const totalSwWatched = registeredUsers.reduce((sum, u) => sum + u.watchedSwCount, 0);

  // خروجی CSV شماره‌ها برای بینجر
  const handleExportCSV = () => {
    const list = registeredUsers.filter((u) => u.phoneNumber);
    if (list.length === 0) {
      alert('هنوز هیچ کاربری شماره تلفن خود را ثبت نکرده است.');
      return;
    }

    let csv = '\uFEFFنام کاربری,شماره موبایل,وضعیت تایید,تماشای مارول,تماشای استاروارز,مجموع عناوین,تاریخ ثبت نام\n';
    list.forEach((u) => {
      csv += `"${u.username}","${u.phoneNumber}","${u.phoneVerified ? 'تایید شده' : 'تایید نشده'}",${u.watchedMcuCount},${u.watchedSwCount},${u.watchedTotalCount},"${new Date(u.registeredAt).toLocaleDateString('fa-IR')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `binger_phone_numbers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`آیا از حذف کاربر "${username}" اطمینان دارید؟`)) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err: any) {
      alert('خطا در حذف کاربر: ' + err?.message);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(passInput)) {
      setLoginError('');
      setPassInput('');
    } else {
      setLoginError('رمز عبور مدیر اشتباه است');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-right">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">ورود به پنل مدیریت</h2>
          <p className="text-xs text-slate-400 mb-6">برای مدیریت کاربران، شماره‌های ثبت‌شده و آمار وارد شوید.</p>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder="رمز عبور مدیر (مثال: admin یا doomsday)"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 text-center"
            />
            {loginError && <div className="text-xs text-rose-400 font-semibold">{loginError}</div>}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              ورود به سیستم
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-right">
      {/* هدر مدیریت */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <Shield className="w-4 h-4" />
            <span>داشبورد زنده کاربران و دیتابیس</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
            مدیریت کاربران و عناوین
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود شماره‌ها برای Binger</span>
          </button>
          <button
            onClick={logoutAdmin}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            خروج
          </button>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>لیست کاربران ({toPersianDigits(registeredUsers.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>آمار و لیدربورد</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'content'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>عناوین و آثار ({toPersianDigits(items.length)})</span>
        </button>
      </div>

      {/* تب ۱: جدول کاربران */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* کارت‌های آماری */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs text-slate-400 block mb-1">کل کاربران ثبت‌شده</span>
              <div className="text-3xl font-black text-white font-mono">{toPersianDigits(registeredUsers.length)}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs text-slate-400 block mb-1">کاربران با شماره تماس</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {toPersianDigits(usersWithPhoneCount)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {registeredUsers.length > 0 ? toPersianDigits(Math.round((usersWithPhoneCount / registeredUsers.length) * 100)) : 0}٪ کل کاربران
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs text-slate-400 block mb-1">مجموع تماشای مارول</span>
              <div className="text-3xl font-black text-red-400 font-mono">{toPersianDigits(totalMcuWatched)}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs text-slate-400 block mb-1">مجموع تماشای استاروارز</span>
              <div className="text-3xl font-black text-cyan-400 font-mono">{toPersianDigits(totalSwWatched)}</div>
            </div>
          </div>

          {/* جدول اصلی کاربران */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              {/* فیلترها و سرچ */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => {
                      setUserSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="جستجوی نام یا شماره..."
                    className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => { setPhoneFilter('all'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${phoneFilter === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    همه
                  </button>
                  <button
                    onClick={() => { setPhoneFilter('withPhone'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${phoneFilter === 'withPhone' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    دارای شماره
                  </button>
                  <button
                    onClick={() => { setPhoneFilter('noPhone'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${phoneFilter === 'noPhone' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    بدون شماره
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                نمایش {toPersianDigits(paginatedUsers.length)} از {toPersianDigits(filteredUsers.length)} کاربر
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                در حال لود کاربران...
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">کاربری یافت نشد.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">نام کاربری</th>
                      <th className="p-3">شماره تماس (جهت انتقال به Binger)</th>
                      <th className="p-3">مارول</th>
                      <th className="p-3">استاروارز</th>
                      <th className="p-3">مجموع تماشا</th>
                      <th className="p-3">تاریخ ثبت‌نام</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {paginatedUsers.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-slate-500 font-mono">
                          {toPersianDigits((currentPage - 1) * itemsPerPage + idx + 1)}
                        </td>
                        <td className="p-3 font-bold text-emerald-400 font-mono dir-ltr text-right">
                          @{user.username}
                        </td>
                        <td className="p-3 font-mono">
                          {user.phoneNumber ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-bold">
                              <Phone className="w-3 h-3" />
                              <span dir="ltr">{user.phoneNumber}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">ثبت نشده</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-300 font-mono">{toPersianDigits(user.watchedMcuCount)}</td>
                        <td className="p-3 text-slate-300 font-mono">{toPersianDigits(user.watchedSwCount)}</td>
                        <td className="p-3 font-bold text-white font-mono">{toPersianDigits(user.watchedTotalCount)}</td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {new Date(user.registeredAt).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="p-3 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedUserDetail(user)}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                            title="جزئیات کامل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* نوار صفحه‌بندی (Pagination) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>صفحه قبلی</span>
                </button>

                <div className="text-xs text-slate-400">
                  صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 cursor-pointer"
                >
                  <span>صفحه بعدی</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* تب ۲: آمار و لیدربورد کاربران برتر */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* لیدربورد کاربران برتر */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>کاربران با بیشترین تعداد تماشا (پرفشارترین کاربرها)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {topUsers.map((user, idx) => (
                <div
                  key={user.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {toPersianDigits(idx + 1)}
                    </span>
                    {idx === 0 && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                  </div>
                  <div className="font-bold text-sm text-slate-100 truncate mb-1" dir="ltr">
                    @{user.username}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {user.phoneNumber ? user.phoneNumber : 'بدون شماره'}
                  </div>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {toPersianDigits(user.watchedTotalCount)} <span className="text-xs font-normal">عنوان</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* نسبت تماشای مارول به استاروارز */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>محبوبیت کلی تماشا: مارول در برابر استاروارز</span>
            </h3>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'مارول (Marvel)', value: totalMcuWatched, color: '#ef4444' },
                      { name: 'استاروارز (Star Wars)', value: totalSwWatched, color: '#06b6d4' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#06b6d4" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* تب ۳: مدیریت فیلم‌ها و سریال‌ها */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sticky top-20 shadow-xl">
              <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                <span>{editingId ? 'ویرایش عنوان' : 'افزودن فیلم/سریال جدید'}</span>
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!formData.titleFa.trim()) return;
                if (editingId) {
                  updateItem(editingId, formData);
                  setEditingId(null);
                } else {
                  addItem(formData);
                }
                setFormData({
                  titleFa: '',
                  titleEn: '',
                  releaseYear: 2024,
                  inUniverseYear: '~۲۰۲۴',
                  runtimeMinutes: 120,
                  type: 'movie',
                  rtScore: 85,
                  isEssential: true,
                  eraId: 'era-4',
                  watchFor: '',
                  tiesIn: '',
                  posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80'
                });
              }} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">عنوان فارسی</label>
                  <input
                    type="text"
                    value={formData.titleFa}
                    onChange={(e) => setFormData({ ...formData, titleFa: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">عنوان انگلیسی</label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 dir-ltr text-right"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {editingId ? 'ذخیره تغییرات' : 'افزودن عنوان'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100">فهرست عناوین</h3>
              <button
                onClick={resetToDefaultData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی به پیش‌فرض</span>
              </button>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img src={item.posterUrl} alt="" className="w-12 h-16 object-cover rounded-xl border border-slate-800" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{item.titleFa}</h4>
                    <p className="text-xs text-slate-400 dir-ltr text-right">{item.titleEn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* مدال جزئیات کاربر */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white" dir="ltr">@{selectedUserDetail.username}</h3>
                  <p className="text-xs text-slate-400">{selectedUserDetail.phoneNumber || 'بدون شماره تماس'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block mb-1">مارول</span>
                <span className="text-sm font-bold text-red-400 font-mono">{toPersianDigits(selectedUserDetail.watchedMcuCount)}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block mb-1">استاروارز</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">{toPersianDigits(selectedUserDetail.watchedSwCount)}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block mb-1">مجموع کل</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{toPersianDigits(selectedUserDetail.watchedTotalCount)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};