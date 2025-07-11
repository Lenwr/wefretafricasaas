// firebaseConfig.js

import { initializeApp } from 'firebase/app'
import { getFirestore, collection } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { useCollection } from 'vuefire'

// ✅ Configuration Firebase (modifie uniquement si tu changes de projet)
const firebaseConfig = {
    apiKey: "AIzaSyBpgPmOUmp-rHSG3D2K5PJ4oGAZ3bHymYM",
    authDomain: "rdsgestion-b3ec6.firebaseapp.com",
    projectId: "rdsgestion-b3ec6",
    storageBucket: "rdsgestion-b3ec6.firebasestorage.app",
    messagingSenderId: "302693543482",
    appId: "1:302693543482:web:e11edce2a238c368cc4f03"
  };

// ✅ Initialiser l'app
export const firebaseApp = initializeApp(firebaseConfig)

// 🔥 Firestore
export const db = getFirestore(firebaseApp)

// 🔐 Auth
export const auth = getAuth(firebaseApp)

// ☁️ Storage
export const storage = getStorage(firebaseApp)

// 📦 Exemples de collections utilisées avec VueFire
export const listeEnlevements = useCollection(collection(db, 'enlevements'))
export const listeCustomers = useCollection(collection(db, 'customers'))
