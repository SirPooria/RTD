import React, { createContext, useContext, useState, useEffect } from 'react';
import { Era, FilterStatus, MCUItem } from '../types';
import { INITIAL_ERAS, INITIAL_MCU_ITEMS, MOCK_VISITOR_STATS } from '../data/mcuTimelineData';
import { starwarsTimelineData } from '../data/starwarsTimelineData';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UniverseType = 'mcu' | 'starwars';

interface UserState {
  username: string;
}

interface TimelineContextType {
  universe: UniverseType;
  setUniverse: (universe: UniverseType) => void;
  items: MCUItem[];
  eras: Era[];
  watchedIds: Set<string>;
  toggleWatched: (id: string) => void;
  markEraAsWatched: (eraId: string) => void;
  
  // Filtering & Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: FilterStatus;
  setStatusFilter: (status: FilterStatus) => void;
  typeFilter: 'all' | 'movie' | 'series';
  setTypeFilter: (type: 'all' | 'movie' | 'series') => void;
  selectedEraId: string | 'all';
  setSelectedEraId: (eraId: string | 'all') => void;

  // Detail Modal
  selectedItem: MCUItem | null;
  setSelectedItem: (item: MCUItem | null) => void;

  // User Auth Capabilities (Firebase)
  currentUser: UserState | null;
  registerUser: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginUser: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logoutUser: () => void;

  // Admin Capabilities
  isAdmin: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  addItem: (newItem: Omit<MCUItem, 'id' | 'chronoOrder'>) => void;
  updateItem: (id: string, updated: Partial<MCUItem>) => void;
  deleteItem: (id: string) => void;
  resetToDefaultData: () => void;

  // Analytics & Computed
  totalItemsCount: number;
  watchedCount: number;
  essentialCount: number;
  essentialWatchedCount: number;
  progressPercentage: number;
  totalWatchedRuntimeMinutes: number;
  visitorStats: typeof MOCK_VISITOR_STATS;
}

const STORAGE_KEYS = {
  WATCHED_MCU: 'road_to_doomsday_watched_ids',
  WATCHED_SW: 'starwars_watched_ids',
  ITEMS: 'road_to_doomsday_items',
  ERAS: 'road_to_doomsday_eras',
  ADMIN_AUTH: 'road_to_doomsday_admin_auth',
  CURRENT_USER: 'road_to_doomsday_current_user',
  UNIVERSE: 'selected_universe'
};

// Eras پیشفرض برای استاروارز کاملاً منطبق با تایپ Era
const STARWARS_ERAS: Era[] = [
  {
    id: 'high-republic',
    titleFa: 'عصر اوج جمهوری',
    titleEn: 'The High Republic',
    periodFa: '۲۳۲ تا ۱۰۰ ق.ی',
    descriptionFa: 'عصر طلایی جدای‌ها و شکوفایی صلح در کهکشان پیش از نفوذ تاریکی'
  },
  {
    id: 'prequels',
    titleFa: 'سقوط جمهوری و ظهور سیت',
    titleEn: 'Fall of the Jedi',
    periodFa: '۳۲ تا ۱۹ ق.ی',
    descriptionFa: 'دوران پیش‌درآمد، جنگ‌های کلون و سقوط آناکین اسکای‌واکر'
  },
  {
    id: 'clone-wars',
    titleFa: 'جنگ‌های کلون',
    titleEn: 'The Clone Wars',
    periodFa: '۲۲ تا ۱۹ ق.ی',
    descriptionFa: 'نبرد تمام‌عیار میان جمهوری کهکشانی و ارتش جدایی‌طلبان'
  },
  {
    id: 'empire-rise',
    titleFa: 'عصر سلطه امپراتوری',
    titleEn: 'Reign of the Empire',
    periodFa: '۱۹ تا ۰ ق.ی',
    descriptionFa: 'سال‌های سیاه پس از اجرای فرمان ۶۶ و شکار بازماندگان جدای'
  },
  {
    id: 'rebellion',
    titleFa: 'دوران اتحاد شورشیان',
    titleEn: 'Age of Rebellion',
    periodFa: '۰ تا ۴ ب.ی',
    descriptionFa: 'سه‌گانه کلاسیک؛ قیام لوک اسکای‌واکر و سقوط امپراتور پالپاتین'
  },
  {
    id: 'original-trilogy',
    titleFa: 'سه‌گانه کلاسیک',
    titleEn: 'Original Trilogy',
    periodFa: '۰ تا ۴ ب.ی',
    descriptionFa: 'امید تازه، امپراتوری ضربه می‌زند و بازگشت جدای'
  },
  {
    id: 'new-republic',
    titleFa: 'عصر جمهوری جدید',
    titleEn: 'The New Republic',
    periodFa: '۹ تا ۳۴ ب.ی',
    descriptionFa: 'دوران بازسازی کهکشان، مندلورین، آسوکا و ظهور بازماندگان امپراتوری'
  },
  {
    id: 'sequels',
    titleFa: 'ظهور محفل یکم و نبرد پایانی',
    titleEn: 'Rise of the First Order',
    periodFa: '۳۴ تا ۳۵ ب.ی',
    descriptionFa: 'سه‌گانه پایانی و نبرد نهایی مقاومت در برابر محفل یکم'
  }
];
const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export const TimelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Universe state
  const [universe, setUniverseState] = useState<UniverseType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UNIVERSE);
      return (saved === 'starwars' || saved === 'mcu') ? saved : 'mcu';
    } catch {
      return 'mcu';
    }
  });

  const setUniverse = (u: UniverseType) => {
    setUniverseState(u);
    localStorage.setItem(STORAGE_KEYS.UNIVERSE, u);
    setSelectedEraId('all');
  };

  // MCU Items state
  const [mcuItems, setMcuItems] = useState<MCUItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 70) {
          return parsed;
        }
      }
      return INITIAL_MCU_ITEMS;
    } catch {
      return INITIAL_MCU_ITEMS;
    }
  });

 // Star Wars Items تبدیل شده به تایپ استاندارد همراه با پوستر و اطلاعات قسمت‌ها
  // تبدیل آیتم‌های استاروارز به تایپ استاندارد همراه با پوستر و نمایش تعداد قسمت‌ها
  const starwarsItems: MCUItem[] = (starwarsTimelineData as any[]).map((item) => ({
    id: String(item.id),
    chronoOrder: Number(item.order || item.chronoOrder || 1),
    titleFa: item.titleFa || '',
    titleEn: item.titleEn || '',
    releaseYear: Number(item.releaseYear || 2020),
    inUniverseYear: item.inUniverseYear || '',
    runtimeMinutes: Number(item.runtimeMinutes || (item.type === 'movie' ? 130 : 45)),
    runtimeOrEpsDisplay: item.runtimeOrEpsDisplay || (item.type === 'series' ? `${item.episodes || item.totalEpisodes || ''} قسمت` : undefined),
    type: (item.type || 'movie'),
    rtScore: Number(item.rtScore || 80),
    isEssential: Boolean(item.isEssential),
    eraId: item.eraId || 'high-republic',
    watchFor: item.watchFor || '',
    tiesIn: item.tiesIn || '',
    posterUrl: item.posterUrl || item.poster || 'https://images.unsplash.com/photo-1579566346927-c68383817a25?auto=format&fit=crop&w=600&q=80',
    timelineNote: item.timelineNote || undefined,
    directorOrCreator: item.directorOrCreator || undefined,
    keyCharacters: item.keyCharacters || undefined,
    trailerUrl: item.trailerUrl || undefined
  }));

  // تعیین آیتم‌ها و دوره‌ها بر اساس دنیای فعال
  const items = universe === 'mcu' ? mcuItems : starwarsItems;
  const eras = universe === 'mcu' ? INITIAL_ERAS : STARWARS_ERAS;

  // Watched state تفکیک‌شده
  const [watchedMcuIds, setWatchedMcuIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WATCHED_MCU);
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const [watchedSwIds, setWatchedSwIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WATCHED_SW);
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const watchedIds = universe === 'mcu' ? watchedMcuIds : watchedSwIds;

  // Current User State
  const [currentUser, setCurrentUser] = useState<UserState | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin Auth
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return currentUser?.username?.toLowerCase() === 'pooraf';
  });

  useEffect(() => {
    if (currentUser?.username) {
      const cleanUsername = currentUser.username.toLowerCase();
      setIsAdmin(cleanUsername === 'pooraf');

      const userDocRef = doc(db, 'users', cleanUsername);
      getDoc(userDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.watchedIds)) {
              setWatchedMcuIds(new Set(data.watchedIds));
            }
            if (Array.isArray(data.watchedSwIds)) {
              setWatchedSwIds(new Set(data.watchedSwIds));
            }
          }
        })
        .catch((err) => console.error('Error fetching Firestore progress:', err));
    } else {
      setIsAdmin(false);
    }
  }, [currentUser]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [selectedEraId, setSelectedEraId] = useState<string | 'all'>('all');

  // Modal
  const [selectedItem, setSelectedItem] = useState<MCUItem | null>(null);

  // ذخیره لوکال دیتای مارول
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(mcuItems));
  }, [mcuItems]);

  // ذخیره پیشرفت تماشا
  useEffect(() => {
    const mcuArray = Array.from(watchedMcuIds);
    const swArray = Array.from(watchedSwIds);

    localStorage.setItem(STORAGE_KEYS.WATCHED_MCU, JSON.stringify(mcuArray));
    localStorage.setItem(STORAGE_KEYS.WATCHED_SW, JSON.stringify(swArray));

    if (currentUser?.username) {
      const cleanUsername = currentUser.username.toLowerCase();
      const userDocRef = doc(db, 'users', cleanUsername);

      setDoc(
        userDocRef,
        {
          watchedMcuCount: mcuArray.length,
          watchedSwCount: swArray.length,
          watchedIds: mcuArray,
          watchedSwIds: swArray,
          lastLoginAt: new Date().toISOString()
        },
        { merge: true }
      ).catch((err) => console.error('Error syncing progress:', err));
    }
  }, [watchedMcuIds, watchedSwIds, currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, String(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

// متد کمکی برای جلوگیری از فریز شدن ریکوئست‌های فایراستور
  const fetchDocWithTimeout = async (docRef: any, timeoutMs = 7000) => {
    return Promise.race([
      getDoc(docRef),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      )
    ]);
  };

const registerUser = async (username: string, password: string, phoneNumber?: string) => {
    const cleanUsername = username.trim().toLowerCase();
    const userDocRef = doc(db, 'users', cleanUsername);

    try {
      const docSnap: any = await fetchDocWithTimeout(userDocRef);
      if (docSnap.exists()) {
        return { success: false, message: 'این نام کاربری قبلاً در دیتابیس ثبت شده است.' };
      }

      const nowIso = new Date().toISOString();
      const cleanPhone = (phoneNumber || '').trim();

      const userData = {
        username: username.trim(),
        password: password.trim(),
        phoneNumber: cleanPhone,
        phoneVerified: Boolean(cleanPhone),
        registeredAt: nowIso,
        lastLoginAt: nowIso,
        watchedMcuCount: watchedMcuIds.size,
        watchedSwCount: watchedSwIds.size,
        watchedIds: Array.from(watchedMcuIds),
        watchedSwIds: Array.from(watchedSwIds)
      };

      // ذخیره قطعی شماره در حساب کاربر
      await setDoc(userDocRef, userData);

      // ذخیره در حافظه لوکال برای جلوگیری از باز شدن دوباره مودال
      if (cleanPhone) {
        localStorage.setItem(`phone_verified_${cleanUsername}`, cleanPhone);
        await setDoc(
          doc(db, 'phone_leads', cleanPhone),
          {
            phoneNumber: cleanPhone,
            username: username.trim(),
            verifiedAt: nowIso
          },
          { merge: true }
        );
      }

      setCurrentUser({ username: username.trim() });
      return { success: true, message: 'حساب کاربری با موفقیت ساخته شد.' };
    } catch (err: any) {
      return { success: false, message: 'خطا در ثبت نام: ' + (err?.message || 'مشکل در برقراری ارتباط') };
    }
  };

  const loginUser = async (username: string, password: string) => {
    const cleanUsername = username.trim().toLowerCase();
    const userDocRef = doc(db, 'users', cleanUsername);

    try {
      const docSnap: any = await fetchDocWithTimeout(userDocRef);
      if (!docSnap.exists()) {
        return { success: false, message: 'کاربری با این نام یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' };
      }

      const userData = docSnap.data();
      if (userData.password !== password.trim()) {
        return { success: false, message: 'رمز عبور وارد شده اشتباه است.' };
      }

      const nowIso = new Date().toISOString();
      await setDoc(userDocRef, { lastLoginAt: nowIso }, { merge: true });

      if (Array.isArray(userData.watchedIds)) {
        setWatchedMcuIds(new Set(userData.watchedIds));
      }
      if (Array.isArray(userData.watchedSwIds)) {
        setWatchedSwIds(new Set(userData.watchedSwIds));
      }

      setCurrentUser({ username: userData.username || username.trim() });
      return { success: true, message: 'ورود با موفقیت انجام شد.' };
    } catch (err: any) {
      const errMsg = (err?.message || '').toLowerCase();
      if (errMsg.includes('offline') || errMsg.includes('timeout') || errMsg.includes('unavailable')) {
        return { 
          success: false, 
          message: 'ارتباط با سرور برقرار نشد. لطفاً وضعیت VPN یا اینترنت خود را چک کرده و دوباره تلاش کنید.' 
        };
      }
      return { success: false, message: 'خطا در ورود: ' + (err?.message || 'مشکل در برقراری ارتباط') };
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setWatchedMcuIds(new Set());
    setWatchedSwIds(new Set());
  };

  const toggleWatched = (id: string) => {
    const updater = (prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    };

    if (universe === 'mcu') setWatchedMcuIds(updater);
    else setWatchedSwIds(updater);
  };

  const markEraAsWatched = (eraId: string) => {
    const eraItemIds = items.filter((item) => item.eraId === eraId).map((item) => item.id);
    const updater = (prev: Set<string>) => {
      const next = new Set(prev);
      eraItemIds.forEach((id) => next.add(id));
      return next;
    };

    if (universe === 'mcu') setWatchedMcuIds(updater);
    else setWatchedSwIds(updater);
  };

  const loginAdmin = (password: string): boolean => {
    if (password === 'admin' || password === '123456' || password === 'doomsday') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => setIsAdmin(false);

  const addItem = (newItemData: Omit<MCUItem, 'id' | 'chronoOrder'>) => {
    const nextOrder = mcuItems.length > 0 ? Math.max(...mcuItems.map((i) => i.chronoOrder)) + 1 : 1;
    const newItem: MCUItem = {
      ...newItemData,
      id: `mcu-item-${Date.now()}`,
      chronoOrder: nextOrder
    };
    setMcuItems((prev) => [...prev, newItem].sort((a, b) => a.chronoOrder - b.chronoOrder));
  };

  const updateItem = (id: string, updated: Partial<MCUItem>) => {
    setMcuItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  const deleteItem = (id: string) => {
    setMcuItems((prev) => prev.filter((item) => item.id !== id));
    setWatchedMcuIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const resetToDefaultData = () => {
    setMcuItems(INITIAL_MCU_ITEMS);
    setWatchedMcuIds(new Set());
    setWatchedSwIds(new Set());
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.WATCHED_MCU);
    localStorage.removeItem(STORAGE_KEYS.WATCHED_SW);
  };

  // محاسبات آمار
  const totalItemsCount = items.length;
  const watchedCount = items.filter((item) => watchedIds.has(item.id)).length;
  const essentialCount = items.filter((item) => item.isEssential).length;
  const essentialWatchedCount = items.filter((item) => item.isEssential && watchedIds.has(item.id)).length;
  const progressPercentage = totalItemsCount > 0 ? Math.round((watchedCount / totalItemsCount) * 100) : 0;
  const totalWatchedRuntimeMinutes = items
    .filter((item) => watchedIds.has(item.id))
    .reduce((sum, item) => sum + (item.runtimeMinutes || 0), 0);

  return (
    <TimelineContext.Provider
      value={{
        universe,
        setUniverse,
        items,
        eras,
        watchedIds,
        toggleWatched,
        markEraAsWatched,

        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        typeFilter,
        setTypeFilter,
        selectedEraId,
        setSelectedEraId,

        selectedItem,
        setSelectedItem,

        currentUser,
        registerUser,
        loginUser,
        logoutUser,

        isAdmin,
        loginAdmin,
        logoutAdmin,
        addItem,
        updateItem,
        deleteItem,
        resetToDefaultData,

        totalItemsCount,
        watchedCount,
        essentialCount,
        essentialWatchedCount,
        progressPercentage,
        totalWatchedRuntimeMinutes,
        visitorStats: MOCK_VISITOR_STATS
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};