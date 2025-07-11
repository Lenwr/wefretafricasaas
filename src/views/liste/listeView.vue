<script setup>
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import frLocale from 'date-fns/locale/fr'
import ListCard from '../../components/listCard.vue'
import { listeEnlevements } from '../../components/firebaseConfig.js'
import { useEntrepriseId } from '../../components/userEntrepriseId'

const statuts = ['', 'Non Payé', 'Reste à payer', 'Payé']

const selectedTab = ref('Tous')  // Tous | En attente | Livrés
const selectedStatut = ref('')
const query = ref('')

const { entrepriseId, isLoading } = useEntrepriseId()

// Formatage date en français
const formatDateTime = (dateTimeString) => {
  const date = new Date(dateTimeString)
  return format(date, "EEEE d MMMM yyyy à HH'h'mm", { locale: frLocale })
}

const filteredList = computed(() => {
  if (isLoading.value) return []

  return listeEnlevements.value
    .filter(item => item.entrepriseId === entrepriseId.value)
    .filter(item => {
      if (selectedTab.value === 'Tous') return true
      if (selectedTab.value === 'En attente') return item.deliveryStatus === 'En attente' || item.deliveryStatus === 'contenaire'
      if (selectedTab.value === 'Livrés') return item.deliveryStatus === 'Livré'
      return true
    })
    .filter(item => !selectedStatut.value || item.statut === selectedStatut.value)
    .filter(item => {
      if (!query.value) return true
      const q = query.value.toLowerCase()
      return (item.destinataire && item.destinataire.toLowerCase().includes(q)) || 
             (item.expediteur && item.expediteur.toLowerCase().includes(q))
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
})
</script>

<template>
  <div class="bg-white min-h-screen flex flex-col items-center p-4">
    <div class="w-full max-w-5xl flex flex-col gap-6">

      <!-- Tabs pour filtre deliveryStatus -->
      <div class="tabs flex gap-4 justify-center">
        <button 
          :class="{'bg-primary text-white': selectedTab === 'Tous', 'bg-gray-200': selectedTab !== 'Tous'}"
          class="px-4 py-2 rounded-lg font-semibold"
          @click="selectedTab = 'Tous'">Tous</button>

        <button 
          :class="{'bg-primary text-white': selectedTab === 'En attente', 'bg-gray-200': selectedTab !== 'En attente'}"
          class="px-4 py-2 rounded-lg font-semibold"
          @click="selectedTab = 'En attente'">En attente</button>

        <button 
          :class="{'bg-primary text-white': selectedTab === 'Livrés', 'bg-gray-200': selectedTab !== 'Livrés'}"
          class="px-4 py-2 rounded-lg font-semibold"
          @click="selectedTab = 'Livrés'">Livrés</button>
      </div>

      <!-- Statut Dropdown -->
      <details class="dropdown relative inline-block">
        <summary class="cursor-pointer py-2.5 px-4 text-sm font-medium bg-gray-100 border border-gray-300 rounded-lg select-none">
          Statut
        </summary>
        <ul class="absolute top-full left-0 p-2 shadow menu dropdown-content bg-white rounded-box w-52 z-20">
          <li v-for="statut in statuts" :key="statut">
            <button type="button" class="w-full text-left px-2 py-1 hover:bg-gray-200"
              @click="selectedStatut = statut">{{ statut || 'Tous' }}</button>
          </li>
        </ul>
      </details>

      <!-- Search Input -->
      <div class="relative flex-1">
        <input type="search" v-model="query" placeholder="Rechercher par expéditeur ou destinataire"
          class="w-full p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white" />
      </div>

    </div>

    <!-- Liste des colis -->
    <div class="listColis px-4 w-full max-w-5xl mt-6">
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <li v-if="isLoading.value" class="col-span-full text-center py-20 text-gray-500">Chargement...</li>
        <li v-else-if="filteredList.length === 0" class="col-span-full text-center py-20 text-gray-500">Aucun colis trouvé</li>

        <router-link v-else v-for="liste in filteredList" :key="liste.id" :to="`/liste/${liste.id}`"
          class="block transition-transform transform hover:scale-105">
          <list-card 
            :image="liste.imageUrl" 
            :date="liste.date ? formatDateTime(liste.date) : 'Non dispo'"
            :nbre-colis="String(liste.nombreDeColis)" 
            :statut="liste.statut" 
            :expediteur="liste.expediteur"
            :destinateur="liste.destinataire" 
            :destination="liste.destination" />
        </router-link>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.dropdown summary {
  list-style: none;
}
</style>
