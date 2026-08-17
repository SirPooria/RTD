import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

export const app = initializeApp(config);

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  config.firestoreDatabaseId || '(default)'
);