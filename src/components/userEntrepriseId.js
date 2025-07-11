// composables/useEntrepriseId.js
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'

export function useEntrepriseId() {
  const entrepriseId = ref('')
  const isLoading = ref(true)

  onMounted(() => {
    const auth = getAuth()
    const db = getFirestore()

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const entreprisesRef = collection(db, 'entreprises')

        // 1. Est-ce le créateur ?
        let q = query(entreprisesRef, where('createdBy', '==', user.uid))
        let querySnapshot = await getDocs(q)

        // 2. Sinon, est-ce un membre ?
        if (querySnapshot.empty) {
          q = query(entreprisesRef, where('users', 'array-contains', user.uid))
          querySnapshot = await getDocs(q)
        }

        if (!querySnapshot.empty) {
          entrepriseId.value = querySnapshot.docs[0].id
        } else {
          entrepriseId.value = ''
        }
      } else {
        entrepriseId.value = ''
      }

      isLoading.value = false
    })
  })

  return { entrepriseId, isLoading }
}
