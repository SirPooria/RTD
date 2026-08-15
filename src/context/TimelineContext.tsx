import React, { createContext, useContext, useState, useEffect } from 'react';
import { Era, FilterStatus, MCUItem } from '../types';
import { INITIAL_ERAS, INITIAL_MCU_ITEMS, MOCK_VISITOR_STATS } from '../data/mcuTimelineData';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface UserState {
  username: string;
}

interface TimelineContextType {
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
  WATCHED: 'road_to_doomsday_watched_ids',
  ITEMS: 'road_to_doomsday_items',
  ERAS: 'road_to_doomsday_eras',
  ADMIN_AUTH: 'road_to_doomsday_admin_auth',
  CURRENT_USER: 'road_to_doomsday_current_user'
};

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export const TimelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Items state
  const [items, setItems] = useState<MCUItem[]>(() => {
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

  // 2. Eras state
  const [eras] = useState<Era[]>(INITIAL_ERAS);

  // 3. Watched state
  const [watchedIds, setWatchedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WATCHED);
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // 4. Current User State
  const [currentUser, setCurrentUser] = useState<UserState | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 5. Admin Auth (Only true if currentUser is Pooraf)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (currentUser?.username && currentUser.username.toLowerCase() === 'pooraf') {
      return true;
    }
    return false;
  });

  // Sync currentUser with admin status and fetch latest watched progress from Firestore
  useEffect(() => {
    if (currentUser?.username) {
      const cleanUsername = currentUser.username.toLowerCase();
      
      // Sole admin check
      if (cleanUsername === 'pooraf') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      // Fetch user's watch progress from Firestore for multi-device sync
      const userDocRef = doc(db, 'users', cleanUsername);
      getDoc(userDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.watchedIds)) {
              setWatchedIds(new Set(data.watchedIds));
            }
          }
        })
        .catch((err) => {
          console.error('Error fetching user progress from Firestore:', err);
        });
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

  // Save items on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  // Save watched status on change & Sync to Firestore if logged in
  useEffect(() => {
    const watchedArray = Array.from(watchedIds);
    localStorage.setItem(STORAGE_KEYS.WATCHED, JSON.stringify(watchedArray));

    if (currentUser?.username) {
      const cleanUsername = currentUser.username.toLowerCase();
      const userDocRef = doc(db, 'users', cleanUsername);
      const watchedDocRef = doc(db, 'userWatchedItems', cleanUsername);

      const updateData = async () => {
        try {
          await setDoc(
            userDocRef,
            {
              watchedCount: watchedArray.length,
              watchedIds: watchedArray,
              lastLoginAt: new Date().toISOString()
            },
            { merge: true }
          );
          await setDoc(
            watchedDocRef,
            {
              username: currentUser.username,
              watchedIds: watchedArray,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
        } catch (err) {
          console.error('Error syncing watched state:', err);
        }
      };
      updateData();
    }
  }, [watchedIds, currentUser]);

  // Save admin auth
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, String(isAdmin));
  }, [isAdmin]);

  // Save current user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  // --- USER FIREBASE AUTH METHODS ---
  const registerUser = async (username: string, password: string) => {
    const cleanUsername = username.trim().toLowerCase();
    const userDocRef = doc(db, 'users', cleanUsername);

    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        return { success: false, message: 'این نام کاربری قبلاً در دیتابیس ثبت شده است.' };
      }

      const nowIso = new Date().toISOString();
      const userData = {
        username: username.trim(),
        password: password.trim(),
        registeredAt: nowIso,
        lastLoginAt: nowIso,
        watchedCount: watchedIds.size,
        watchedIds: Array.from(watchedIds)
      };

      await setDoc(userDocRef, userData);

      // Also create watched item document
      const watchedDocRef = doc(db, 'userWatchedItems', cleanUsername);
      await setDoc(watchedDocRef, {
        username: username.trim(),
        watchedIds: Array.from(watchedIds),
        updatedAt: nowIso
      });

      setCurrentUser({ username: username.trim() });
      return { success: true, message: 'حساب کاربری با موفقیت ساخته شد و در دیتابیس ثبت گردید.' };
    } catch (err: any) {
      return { success: false, message: 'خطا در ثبت نام: ' + (err?.message || 'مشکل در دیتابیس') };
    }
  };

  const loginUser = async (username: string, password: string) => {
    const cleanUsername = username.trim().toLowerCase();
    const userDocRef = doc(db, 'users', cleanUsername);

    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        return { success: false, message: 'کاربری با این نام کاربری یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' };
      }

      const userData = docSnap.data();
      if (userData.password !== password.trim()) {
        return { success: false, message: 'رمز عبور وارد شده اشتباه است.' };
      }

      // Update last login
      const nowIso = new Date().toISOString();
      await setDoc(
        userDocRef,
        {
          lastLoginAt: nowIso
        },
        { merge: true }
      );

      // Load user's saved watched IDs from Firestore
      if (Array.isArray(userData.watchedIds)) {
        setWatchedIds(new Set(userData.watchedIds));
      }

      setCurrentUser({ username: userData.username || username.trim() });
      return { success: true, message: 'ورود با موفقیت انجام شد.' };
    } catch (err: any) {
      return { success: false, message: 'خطا در ورود: ' + (err?.message || 'مشکل در ارتباط با دیتابیس') };
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setWatchedIds(new Set());
  };

  // Toggle single item watched
  const toggleWatched = (id: string) => {
    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Mark entire era as watched
  const markEraAsWatched = (eraId: string) => {
    const eraItemIds = items.filter((item) => item.eraId === eraId).map((item) => item.id);
    setWatchedIds((prev) => {
      const next = new Set(prev);
      eraItemIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // Admin login simulation
  const loginAdmin = (password: string): boolean => {
    if (password === 'admin' || password === '123456' || password === 'doomsday') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
  };

  // Admin CRUD
  const addItem = (newItemData: Omit<MCUItem, 'id' | 'chronoOrder'>) => {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.chronoOrder)) + 1 : 1;
    const newItem: MCUItem = {
      ...newItemData,
      id: `mcu-item-${Date.now()}`,
      chronoOrder: nextOrder
    };
    setItems((prev) => [...prev, newItem].sort((a, b) => a.chronoOrder - b.chronoOrder));
  };

  const updateItem = (id: string, updated: Partial<MCUItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setWatchedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const resetToDefaultData = () => {
    setItems(INITIAL_MCU_ITEMS);
    setWatchedIds(new Set());
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.WATCHED);
  };

  // Computations
  const totalItemsCount = items.length;
  const watchedCount = items.filter((item) => watchedIds.has(item.id)).length;
  const essentialCount = items.filter((item) => item.isEssential).length;
  const essentialWatchedCount = items.filter(
    (item) => item.isEssential && watchedIds.has(item.id)
  ).length;

  const progressPercentage = totalItemsCount > 0 ? Math.round((watchedCount / totalItemsCount) * 100) : 0;

  const totalWatchedRuntimeMinutes = items
    .filter((item) => watchedIds.has(item.id))
    .reduce((sum, item) => sum + (item.runtimeMinutes || 0), 0);

  return (
    <TimelineContext.Provider
      value={{
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
