<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/useAuthStore'
import {
  getFirestore,
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore'
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage'

const store = useAuthStore()
const db = getFirestore()
const storage = getStorage()

const entrepriseForm = ref({
  nom: '',
  email: '',
  adresse: '',
  tel: '',
  logoUrl: ''
})

const logoPreview = ref(null)
const selectedLogoFile = ref(null)
const uploading = ref(false)

const employes = ref([])
const emailInvitation = ref('')

// 🔁 Récupération des infos entreprise
const fetchEntrepriseData = async () => {
  const docRef = doc(db, 'entreprises', store.entreprise.id)
  const snap = await getDoc(docRef)
  if (snap.exists()) {
    entrepriseForm.value = { ...entrepriseForm.value, ...snap.data() }
    logoPreview.value = entrepriseForm.value.logoUrl || null
  }
}

// 📤 Upload logo
const handleLogoChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  selectedLogoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

// 💾 Save entreprise + upload logo
const updateEntreprise = async () => {
  uploading.value = true

  try {
    let logoURL = entrepriseForm.value.logoUrl

    if (selectedLogoFile.value) {
      const logoRef = storageRef(storage, `logos/${store.entreprise.id}/${selectedLogoFile.value.name}`)
      await uploadBytes(logoRef, selectedLogoFile.value)
      logoURL = await getDownloadURL(logoRef)
    }

    const updatedData = {
      ...entrepriseForm.value,
      logoUrl: logoURL
    }

    const docRef = doc(db, 'entreprises', store.entreprise.id)
    await updateDoc(docRef, updatedData)

    entrepriseForm.value.logoUrl = logoURL
    logoPreview.value = logoURL
    selectedLogoFile.value = null

    alert('Entreprise mise à jour ✅')
  } catch (err) {
    console.error(err)
    alert("Erreur lors de l'upload ❌")
  } finally {
    uploading.value = false
  }
}

// 👥 Récupérer les employés
const fetchEmployes = async () => {
  const q = query(collection(db, 'users'), where('entrepriseId', '==', store.entreprise.id))
  const querySnap = await getDocs(q)
  employes.value = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// 📩 Inviter un employé
const inviterEmploye = async () => {
  if (!emailInvitation.value) return alert('Email requis !')

  const userDoc = doc(db, 'users', emailInvitation.value)
  await setDoc(userDoc, {
    email: emailInvitation.value,
    entrepriseId: store.entreprise.id,
    role: 'user'
  })

  alert('Invitation envoyée 🚀')
  emailInvitation.value = ''
  fetchEmployes()
}

onMounted(() => {
  fetchEntrepriseData()
  fetchEmployes()
})
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-xl font-bold mb-6">⚙️ Paramètres de l'entreprise</h2>

    <form @submit.prevent="updateEntreprise" class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded shadow">
      <input v-model="entrepriseForm.nom" placeholder="Nom de l'entreprise" class="input input-bordered" />
      <input v-model="entrepriseForm.email" placeholder="Email" class="input input-bordered" />
      <input v-model="entrepriseForm.adresse" placeholder="Adresse" class="input input-bordered" />
      <input v-model="entrepriseForm.tel" placeholder="Téléphone" class="input input-bordered" />

      <div class="col-span-full">
        <label class="block mb-1 font-medium">Logo</label>
        <input type="file" @change="handleLogoChange" accept="image/*" class="file-input w-[90%] file-input-bordered" />
        <p v-if="uploading" class="text-sm text-gray-500 mt-1">⏳ Upload en cours...</p>

        <div v-if="logoPreview" class="mt-3">
          <img :src="logoPreview" class="w-24 h-24 object-contain rounded shadow border" alt="Logo preview" />
        </div>
      </div>

      <button type="submit" class="btn btn-primary col-span-full">💾 Mettre à jour</button>
    </form>

    <!-- Employés -->
    <div class="mt-10">
      <h3 class="text-lg font-semibold mb-4">👥 Gérer les employés</h3>

      <div class="flex gap-2 mb-4">
        <input v-model="emailInvitation" placeholder="Email employé" class="input input-bordered w-full" />
        <button @click="inviterEmploye" class="btn btn-secondary">📨 Inviter</button>
      </div>

      <ul class="divide-y bg-white rounded shadow">
        <li v-for="emp in employes" :key="emp.id" class="py-3 px-4 flex justify-between items-center">
          <span>{{ emp.email }}</span>
          <span class="text-sm text-gray-500">{{ emp.role }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.input {
  width: 100%;
}
</style>
