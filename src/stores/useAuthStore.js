import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'

export const useAuthStore = defineStore('auth', () => {
  const email = ref('')
  const password = ref('')
  const entrepriseNom = ref('')
  const error = ref(null)
  const entreprise = ref(null)
  const isLoading = ref(true)

  const auth = getAuth()
  const db = getFirestore()

  // INIT
  const init = () => {
    isLoading.value = true
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          await fetchEntreprise(user.uid)
        } else {
          entreprise.value = null
        }
        isLoading.value = false
        resolve()
        unsubscribe()
      })
    })
  }

  // REGISTER
  const register = async () => {
    error.value = null
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
      const uid = userCredential.user.uid

      const entrepriseRef = await addDoc(collection(db, 'entreprises'), {
        nom: entrepriseNom.value,
        email: '',
        adresse: '',
        tel: '',
        logoUrl: '',
        createdBy: uid,
        users: [uid],
        createdAt: serverTimestamp(),
      })

      await setDoc(doc(db, 'users', uid), {
        email: email.value,
        entrepriseId: entrepriseRef.id,
        role: 'admin'
      })

      entreprise.value = {
        id: entrepriseRef.id,
        nom: entrepriseNom.value,
        email: '',
        adresse: '',
        tel: '',
        logoUrl: ''
      }

    } catch (err) {
      error.value = err.message
    }
  }

  // LOGIN
  const login = async () => {
    error.value = null
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
      const uid = userCredential.user.uid
      await fetchEntreprise(uid)
    } catch (err) {
      error.value = err.message
    }
  }

  // FETCH ENTREPRISE
  const fetchEntreprise = async (userId) => {
    try {
      const entreprisesRef = collection(db, 'entreprises')

      let q = query(entreprisesRef, where('createdBy', '==', userId))
      let querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        q = query(entreprisesRef, where('users', 'array-contains', userId))
        querySnapshot = await getDocs(q)
      }

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0]
        entreprise.value = {
          id: docSnap.id,
          ...docSnap.data()
        }
      } else {
        entreprise.value = null
      }
    } catch (err) {
      console.error('Erreur fetchEntreprise:', err)
    }
  }

  // 🔄 MISE À JOUR INFOS ENTREPRISE
  const updateEntreprise = async (updates) => {
    if (!entreprise.value?.id) return
    try {
      const ref = doc(db, 'entreprises', entreprise.value.id)
      await updateDoc(ref, updates)

      // Mettre à jour localement
      entreprise.value = {
        ...entreprise.value,
        ...updates
      }
    } catch (err) {
      console.error('Erreur updateEntreprise:', err)
      throw err
    }
  }

  // LOGOUT
  const logout = async () => {
    try {
      await signOut(auth)
      entreprise.value = null
      email.value = ''
      password.value = ''
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err)
    }
  }

  const getCurrentUser = () => auth.currentUser

  return {
    email,
    password,
    entrepriseNom,
    error,
    entreprise,
    isLoading,
    register,
    login,
    fetchEntreprise,
    logout,
    getCurrentUser,
    init,
    updateEntreprise // ✅ nouveau
  }
})
