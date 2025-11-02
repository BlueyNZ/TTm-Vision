// src/firebase/config.ts
import { FirebaseOptions } from 'firebase/app';

const firebaseConfig: FirebaseOptions = {
  "projectId": "studio-4955279472-f5d23",
  "appId": "1:968278479885:web:ce97a9d5bbb4bc0c0cf144",
  "apiKey": "AIzaSyAeFSmEVEINcY2IN_AKB9pKazaQuYGVuUc",
  "authDomain": "studio-4955279472-f5d23.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "968278479885"
};

export function getFirebaseConfig() {
  if (!firebaseConfig.apiKey) {
    throw new Error('Missing Firebase configuration');
  }
  return firebaseConfig;
}
