import React, { useState, useEffect } from 'react';
import { useTimeline } from '../context/TimelineContext';
import { MCUItem, RegisteredUser } from '../types';
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
  Clock,
  Key,
  Film,
  Sparkles,
  Save,
  X,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

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

  // Firestore Real-time Users State
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<RegisteredUser | null>(null);

  // Form State for Adding / Editing Movies
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

  // Real-time Firestore Listener for registered users
  useEffect(() => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    const usersColRef = collection(db, 'users');

    const unsubscribe = onSnapshot(
      usersColRef,
      (snapshot) => {
        const usersList: RegisteredUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          usersList.push({
            id: docSnap.id,
            username: data.username || docSnap.id,
            password: data.password || '—',
            registeredAt: data.registeredAt || new Date().toISOString(),
            lastLoginAt: data.lastLoginAt || data.registeredAt || new Date().toISOString(),
            watchedCount: data.watchedCount || 0,
            watchedIds: data.watchedIds || []
          });
        });

        // Sort users by registration date descending
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

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`آیا از حذف کاربر "${username}" از دیتابیس اطمینان دارید؟`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      // Optionally delete watched items doc
      await deleteDoc(doc(db, 'userWatchedItems', userId));
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
      setLoginError('رمز عبور مدیر اشتباه است (رمزهای پیش‌فرض: admin یا doomsday یا 123456)');
    }
  };

  const handleStartEdit = (item: MCUItem) => {
    setEditingId(item.id);
    setFormData({
      titleFa: item.titleFa,
      titleEn: item.titleEn,
      releaseYear: item.releaseYear,
      inUniverseYear: item.inUniverseYear,
      runtimeMinutes: item.runtimeMinutes,
      type: item.type,
      rtScore: item.rtScore,
      isEssential: item.isEssential,
      eraId: item.eraId,
      watchFor: item.watchFor,
      tiesIn: item.tiesIn,
      posterUrl: item.posterUrl
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
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
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleFa.trim()) return;

    if (editingId) {
      updateItem(editingId, formData);
      setEditingId(null);
    } else {
      addItem(formData);
    }

    handleCancelEdit();
  };

  // Filtered Users
  const filteredUsers = registeredUsers.filter((u) =>
    u.username.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const totalUserWatchedMovies = registeredUsers.reduce((sum, u) => sum + (u.watchedCount || 0), 0);

  const pieData = [
    { name: 'آثار حیاتی (سبز)', value: items.filter((i) => i.isEssential).length, color: '#10b981' },
    { name: 'آثار جانبی (خاکستری)', value: items.filter((i) => !i.isEssential).length, color: '#64748b' }
  ];

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">ورود به پنل مدیریت مسیر دومزدی</h2>
          <p className="text-xs text-slate-400 mb-6">
            برای مشاهده لیست کامل و دقیق کاربران ثبت‌شده در دیتابیس، رمز عبور و آمار به پنل مدیریت وارد شوید.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="رمز عبور مدیر (مثال: admin یا doomsday)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 text-center"
              />
            </div>

            {loginError && <div className="text-xs text-rose-400 font-semibold">{loginError}</div>}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              ورود به سیستم
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5" />
            <span>متصل به پایگاه داده زنده Firebase Firestore</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
            <Shield className="w-4 h-4" />
            <span>پنل مدیریت زنده پایگاه داده</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
            مدیریت کاربران و عناوین "مسیر دومزدی"
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={logoutAdmin}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            خروج از حساب مدیر
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
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
          <span>لیست کاربران ثبت‌شده در دیتابیس ({toPersianDigits(registeredUsers.length)})</span>
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
          <span>آمار و تحلیل کلی</span>
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
          <span>مدیریت فیلم‌ها و سریال‌ها ({toPersianDigits(items.length)})</span>
        </button>
      </div>

      {/* TAB 1: REGISTERED USERS LIST & FIRESTORE LIVE DATA */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">تعداد کل کاربران ثبت‌شده</span>
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {toPersianDigits(registeredUsers.length)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">اطلاعات زنده از دیتابیس Firestore</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">مجموع فیلم‌های علامت‌زده‌شده</span>
                <Film className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-slate-100 font-mono">
                {toPersianDigits(totalUserWatchedMovies)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">توسط کاربران واقعی سیستم</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">وضعیت پایگاه داده</span>
                <Database className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div className="text-lg font-bold text-emerald-400">فعال و آنلاین</div>
              <div className="text-[11px] text-slate-400 mt-1">همگام‌سازی لحظه‌ای بدون ماک</div>
            </div>
          </div>

          {/* User List Table Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <span>اطلاعات کامل و دقیق کاربران (نام کاربری، رمز عبور، آمار)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تمام اطلاعات ورود کاربر هنگام ثبت‌نام به طور مستقیم در دیتابیس ذخیره شده و در اینجا قابل دریافت است.
                </p>
              </div>

              {/* User Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="جستجوی نام کاربری..."
                  className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                در حال دریافت اطلاعات زنده کاربران از دیتابیس...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                {registeredUsers.length === 0
                  ? 'هنوز هیچ کاربری ثبت‌نام نکرده است. با فرم ورود/ثبت‌نام یک کاربر جدید بسازید.'
                  : 'کاربری با این مشخصات یافت نشد.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">نام کاربری (Username)</th>
                      <th className="p-3">رمز عبور (Password)</th>
                      <th className="p-3">تاریخ ثبت‌نام</th>
                      <th className="p-3">آخرین ورود</th>
                      <th className="p-3">آمار دیده‌شده</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredUsers.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-slate-500 font-mono">{toPersianDigits(idx + 1)}</td>
                        <td className="p-3 font-bold text-emerald-400 font-mono dir-ltr text-right">
                          @{user.username}
                        </td>
                        <td className="p-3 font-mono text-slate-200 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80 inline-block my-2">
                          <span className="flex items-center gap-1">
                            <Key className="w-3 h-3 text-amber-400 shrink-0" />
                            {user.password}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {new Date(user.registeredAt).toLocaleDateString('fa-IR')} -{' '}
                          {new Date(user.registeredAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {new Date(user.lastLoginAt).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="p-3 font-bold text-slate-100 font-mono">
                          {toPersianDigits(user.watchedCount || 0)} فیلم
                        </td>
                        <td className="p-3 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedUserDetail(user)}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                            title="مشاهده جزئیات آمار و فیلم‌های دیده‌شده کاربر"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                            title="حذف کاربر از دیتابیس"
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
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD STATS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400 mb-1">تعداد کاربران دیتابیس</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {toPersianDigits(registeredUsers.length)}
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-1">ثبت‌شده در Firestore</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400 mb-1">کل عناوین تایم‌لاین</div>
              <div className="text-2xl font-black text-slate-100 font-mono">
                {toPersianDigits(items.length)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">فیلم‌ها و سریال‌های استاتیک</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400 mb-1">عناوین حیاتی (سبز)</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {toPersianDigits(items.filter((i) => i.isEssential).length)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">مسیر اصلی دومزدی</div>
            </div>
          </div>

          {/* Pie Chart: Essential vs Optional Movies */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>نسبت آثار حیاتی در برابر آثار جانبی</span>
            </h3>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT MANAGEMENT (Movies CRUD) */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add / Edit Form Column */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sticky top-20 shadow-xl">
              <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                <span>{editingId ? 'ویرایش عنوان موجود' : 'افزودن فیلم یا سریال جدید'}</span>
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">عنوان فارسی</label>
                  <input
                    type="text"
                    value={formData.titleFa}
                    onChange={(e) => setFormData({ ...formData, titleFa: e.target.value })}
                    placeholder="مثال: چهار شگفت‌انگیز"
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
                    placeholder="e.g. The Fantastic Four"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 dir-ltr text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">سال انتشار</label>
                    <input
                      type="number"
                      value={formData.releaseYear}
                      onChange={(e) => setFormData({ ...formData, releaseYear: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">زمان در داستانی</label>
                    <input
                      type="text"
                      value={formData.inUniverseYear}
                      onChange={(e) => setFormData({ ...formData, inUniverseYear: e.target.value })}
                      placeholder="مثال: ۲۰۲۶"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">نوع اثر</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="movie">فیلم سینمایی</option>
                      <option value="series">سریال</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">دوره زمانی (Era)</label>
                    <select
                      value={formData.eraId}
                      onChange={(e) => setFormData({ ...formData, eraId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {useTimeline().eras.map((era) => (
                        <option key={era.id} value={era.id}>
                          {era.titleFa.split(':')[0]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="isEssential"
                    checked={formData.isEssential}
                    onChange={(e) => setFormData({ ...formData, isEssential: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="isEssential" className="text-slate-200 cursor-pointer font-bold">
                    اثر حیاتی (سبز - مسیر اصلی دومزدی)
                  </label>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">علت تماشا (Watch For)</label>
                  <textarea
                    rows={2}
                    value={formData.watchFor}
                    onChange={(e) => setFormData({ ...formData, watchFor: e.target.value })}
                    placeholder="نکات کلیدی برای تماشاگر..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ارتباط با Doomsday (Ties In)</label>
                  <textarea
                    rows={2}
                    value={formData.tiesIn}
                    onChange={(e) => setFormData({ ...formData, tiesIn: e.target.value })}
                    placeholder="نحوه گره خوردن به روز رستاخیز..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingId ? 'ذخیره تغییرات' : 'افزودن به لیست'}</span>
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Existing Movies List Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100">فهرست کامل عناوین موجود</h3>
              <button
                onClick={resetToDefaultData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی به داده‌های پیش‌فرض</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.posterUrl}
                      alt={item.titleFa}
                      className="w-12 h-16 object-cover rounded-xl border border-slate-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.isEssential ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-slate-600'
                          }`}
                        />
                        <h4 className="text-sm font-bold text-slate-100">{item.titleFa}</h4>
                      </div>
                      <p className="text-xs text-slate-400 dir-ltr text-right mt-0.5">{item.titleEn}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        سال: {toPersianDigits(item.releaseYear)} | فرمت: {item.type === 'movie' ? 'فیلم' : 'سریال'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-colors cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Detail Inspection Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>حساب کاربر:</span>
                    <span className="text-emerald-400 font-mono dir-ltr">@{selectedUserDetail.username}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">ثبت‌شده در دیتابیس Firestore پروژه</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserDetail(null)}
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">رمز عبور کاربر</span>
                <div className="text-sm font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>{selectedUserDetail.password}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">تاریخ ثبت‌نام</span>
                <div className="text-xs text-slate-200 font-medium">
                  {new Date(selectedUserDetail.registeredAt).toLocaleDateString('fa-IR')}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">آخرین فعالیت</span>
                <div className="text-xs text-slate-200 font-medium">
                  {new Date(selectedUserDetail.lastLoginAt).toLocaleDateString('fa-IR')}
                </div>
              </div>
            </div>

            {/* Watching Progress Bar */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">میزان پیشرفت کاربر در تایم‌لاین</span>
                <span className="text-emerald-400 font-mono">
                  {toPersianDigits(selectedUserDetail.watchedCount || 0)} از {toPersianDigits(items.length)} فیلم (
                  {toPersianDigits(
                    items.length > 0
                      ? Math.round(((selectedUserDetail.watchedCount || 0) / items.length) * 100)
                      : 0
                  )}
                  ٪)
                </span>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      items.length > 0
                        ? Math.min(100, Math.round(((selectedUserDetail.watchedCount || 0) / items.length) * 100))
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>

            {/* List of Watched Titles */}
            <div>
              <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>عناوین علامت‌زده‌شده توسط این کاربر</span>
              </h4>

              {(!selectedUserDetail.watchedIds || selectedUserDetail.watchedIds.length === 0) ? (
                <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-slate-800 text-xs text-slate-500">
                  این کاربر هنوز هیچ فیلم یا سریالی را تماشا نکرده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {items
                    .filter((item) => selectedUserDetail.watchedIds?.includes(item.id))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl"
                      >
                        <img
                          src={item.posterUrl}
                          alt={item.titleFa}
                          className="w-9 h-12 object-cover rounded-lg border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-slate-200 truncate">{item.titleFa}</h5>
                          <span className="text-[10px] text-slate-500 block truncate mt-0.5 dir-ltr text-right">
                            {item.titleEn}
                          </span>
                        </div>
                        {item.isEssential && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="اثر حیاتی" />
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
