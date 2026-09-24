import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

export const app = initializeApp(config);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence]
});

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache()
  },
  config.firestoreDatabaseId || '(default)'
);
