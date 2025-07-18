<script setup>
import { useCollection, useFirestore } from "vuefire";
import { ref, computed } from "vue";
import { getFirestore, collection, addDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { format } from "date-fns";
import frLocale from "date-fns/locale/fr";
import { toast } from "vue3-toastify";
import { useAuthStore } from "../../stores/useAuthStore";

import "vue3-toastify/dist/index.css";

const db = useFirestore()
const authStore = useAuthStore()
const entrepriseId = computed(() => authStore.entreprise?.id)

const chargement = ref({
  contenaire: '',
  date: '',
  packagesTable: []
})

const dateDebut = ref('')
const dateFin = ref('')

// 🔎 Filtrage par entreprise ET par date
const chargementsQuery = computed(() => {
  if (!entrepriseId.value) return null

  let baseQuery = query(
    collection(db, 'chargements'),
    where('entrepriseId', '==', entrepriseId.value)
  )

  if (dateDebut.value && dateFin.value) {
    return query(
      collection(db, 'chargements'),
      where('entrepriseId', '==', entrepriseId.value),
      where('date', '>=', dateDebut.value),
      where('date', '<=', dateFin.value + 'T23:59:59')
    )
  }

  return baseQuery
})

const Liste = useCollection(chargementsQuery)

const formatDateTime = (dateTimeString) => {
  const date = new Date(dateTimeString)
  return format(date, "EEEE d MMMM yyyy à HH'h'mm", { locale: frLocale })
}

async function submitForm() {
  try {
    const data = {
      contenaire: chargement.value.contenaire,
      date: chargement.value.date,
      packagesTable: chargement.value.packagesTable,
      entrepriseId: entrepriseId.value
    }
    const docRef = await addDoc(collection(db, 'chargements'), data)

    toast("Chargement ajouté", {
      theme: "auto",
      type: "success",
      autoClose: 1000
    })

    chargement.value.contenaire = ''
    chargement.value.date = ''
  } catch (e) {
    console.error('Erreur ajout:', e);
  }
};

async function deleteLoad(id) {
  const DocRef = doc(db, 'chargements', id)
  await deleteDoc(DocRef)
  toast("Chargement supprimé", {
    theme: "auto",
    type: "error",
    autoClose: 1000
  })
}
</script>

<template>
  
  <div class="text-black">
    <!-- Header + bouton -->
    <div class="flex flex-row justify-around items-center m-8">
      <h2>Enregistrer un nouvel envoi</h2>
      <button class="btn btn-primary" onclick="modal.showModal()">Nouveau</button>
    </div>

    <!-- Filtres par date -->
    <div class="flex flex-wrap gap-4 items-center justify-start px-4 py-2">
      <div>
        <label class="block text-sm">Du :</label>
        <input type="date" v-model="dateDebut" class="input input-bordered" />
      </div>
      <div>
        <label class="block text-sm">Au :</label>
        <input type="date" v-model="dateFin" class="input input-bordered" />
      </div>
      <button @click="dateDebut = ''; dateFin = ''" class="btn btn-outline btn-sm">
        Réinitialiser
      </button>
    </div>

    <!-- Modal ajout -->
    <dialog id="modal" class="modal">
      <div class="modal-box bg-white">
        <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form class="space-y-6" @submit.prevent="submitForm">
              <div>
                <label class="block text-sm font-medium text-gray-900">Date de chargement</label>
                <input v-model="chargement.date" type="datetime-local" required class="input input-bordered w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-900">Envoi</label>
                <input v-model="chargement.contenaire" type="text" required class="input input-bordered w-full" />
              </div>
              <button type="submit" class="btn btn-primary w-full">Enregistrer</button>
            </form>
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn">Fermer</button>
          </form>
        </div>
      </div>
    </dialog>

    <!-- Liste des chargements -->
    <div class="overflow-x-auto px-4">
      <table class="table text-black">
        <thead>
          <tr class="bg-primary text-white">
            <th>Date</th>
            <th>Contenaire</th>
            <th>Ajouter des colis</th>
            <th>Supprimer</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="chargement in Liste" :key="chargement.id">
            <td>{{ formatDateTime(chargement.date) }}</td>
            <td>{{ chargement.contenaire }}</td>
            <td>
              <router-link :to="'/chargementsDetails/' + chargement.id">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </router-link>
            </td>
            <td>
              <svg @click="deleteLoad(chargement.id)" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21a48.108 48.108 0 0 0-3.478-.397m-12 .562a48.11 48.11 0 0 1 3.478-.397m7.5 0V4.477c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0C8.09 2.313 7.18 3.298 7.18 4.477v.916" />
              </svg>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.input {
  @apply border rounded-md px-2 py-1;
}
</style>
