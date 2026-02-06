// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app';
import {getAuth, GoogleAuthProvider} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: 'aiwriter-6vz4s',
  appId: '1:203220965248:web:917817a0934a899d619365',
  storageBucket: 'aiwriter-6vz4s.firebasestorage.app',
  apiKey: 'AIzaSyAzAzbZtx1grPUfQgP3JpgCuM5Z3yEn42U',
  authDomain: 'aiwriter-6vz4s.firebaseapp.com',
  messagingSenderId: '203220965248',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {app, auth, db, googleProvider};
