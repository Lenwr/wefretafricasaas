<script setup>
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { ref, onMounted, watch } from 'vue'
import { defineProps } from 'vue'
import SelectCustomersView from '../customers/selectCustomersView.vue'
import { useEntrepriseId } from '../../components/userEntrepriseId'

// Props
const props = defineProps({
  myId: String,
  expediteurData: Object, // optionnelle
})

// Firestore
const db = getFirestore()
const enlevementsCollection = collection(db, 'enlevements')

// Entreprise ID
const { entrepriseId, isLoading } = useEntrepriseId()

// Reactive form state
const customer = ref({
  expediteur: '',
  statut: '',
  telephoneExpediteur: '',
  destinataire: '',
  telephoneDestinataire: '',
  typeDeFret: '',
  destination: '',
  personneEnCharge: '',
  prix: '',
  modeDePaiement: '',
  resteAPayer: '',
  date: '',
})

const colisList = ref([{ nom: '', quantite: 1, statutColis: false }])

// Pré-remplir si `expediteurData` dispo
watch(
  () => props.expediteurData,
  (newVal) => {
    if (newVal) {
      customer.value.expediteur = `${newVal.nom} ${newVal.prenom}`
      customer.value.telephoneExpediteur = newVal.telephone
    }
  },
  { immediate: true }
)

const ajouterColis = () => {
  colisList.value.push({ nom: '', quantite: 1, statutColis: false })
}

const supprimerColis = (index) => {
  colisList.value.splice(index, 1)
}

const genererNumeroUnique = () => {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const random = Math.floor(Math.random() * 1000)
  return `COLIS-${date}-${time}-${random}`
}

const send = async () => {
  try {
    if (isLoading.value) {
      toast("Chargement entreprise...", { type: "info", autoClose: 1500 })
      return
    }

    const numeroUnique = genererNumeroUnique()

    const colisData = colisList.value.map(colis => {
      const details = Array.from({ length: colis.quantite }, (_, i) => ({
        coli: `${colis.nom} ${i + 1}/${colis.quantite}`,
        statutColis: colis.statutColis || false,
      }))
      return {
        nom: colis.nom,
        quantite: colis.quantite,
        details,
      }
    })

    const Data = {
      numero: numeroUnique,
      expediteur: customer.value.expediteur,
      statut: customer.value.statut,
      imageUrl: [],
      telephoneExpediteur: customer.value.telephoneExpediteur,
      destinataire: customer.value.destinataire,
      telephoneDestinataire: customer.value.telephoneDestinataire,
      typeDeFret: customer.value.typeDeFret,
      destination: customer.value.destination,
      nombreDeColis: colisData.reduce((acc, c) => acc + c.quantite, 0),
      colis: colisData,
      personneEnCharge: customer.value.personneEnCharge,
      prix: customer.value.prix,
      modeDePaiement: customer.value.modeDePaiement,
      resteAPayer: customer.value.resteAPayer,
      date: customer.value.date,
      deliveryStatus: 'En attente',
      customerId: props.myId || '',
      entrepriseId: entrepriseId.value || ''
    }

    await addDoc(enlevementsCollection, Data)

    toast("Formulaire envoyé", { type: "success", autoClose: 1000 })

    // Reset form
    customer.value = {
      expediteur: '',
      statut: '',
      telephoneExpediteur: '',
      destinataire: '',
      telephoneDestinataire: '',
      typeDeFret: '',
      destination: '',
      personneEnCharge: '',
      prix: '',
      modeDePaiement: '',
      resteAPayer: '',
      date: '',
    }
    colisList.value = [{ nom: '', quantite: 1, statutColis: false }]
  } catch (error) {
    console.error("Erreur formulaire :", error)
    toast("Erreur lors de l'envoi", { type: "error", autoClose: 1500 })
  }
}
</script>


<template>
  <div class="bg-white flex flex-1 flex-col justify-center px-6 py-8 lg:px-8">
    <SelectCustomersView />
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        Enregistrer des Colis
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" @submit.prevent="send">

        <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div class="sm:col-span-3">
            <label for="date" class="block text-sm font-medium text-gray-900">Date</label>
            <div class="mt-2">
              <input required type="datetime-local" v-model="customer.date" id="date"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300
                  focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
            </div>
          </div>
        </div>

        <div>
          <label for="expediteur" class="block text-sm font-medium text-gray-900">Expéditeur</label>
          <input id="expediteur" v-model="customer.expediteur"
            class="mt-2 block h-[3em] w-full rounded-md border-0 py-1.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300
            focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" placeholder="Nom et prénoms" />
        </div>

        <div>
          <label for="telephoneExpediteur" class="block text-sm font-medium text-gray-900">Téléphone Expéditeur</label>
          <input type="tel" id="telephoneExpediteur" v-model="customer.telephoneExpediteur"
            class="mt-2 block h-[3em] w-full rounded-md border-0 py-1.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300
            focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" placeholder="Téléphone" />
        </div>

        <div>
          <label for="destinataire" class="block text-sm font-medium text-gray-900">Destinataire</label>
          <input id="destinataire" v-model="customer.destinataire"
            class="mt-2 block h-[3em] w-full rounded-md border-0 py-1.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300
            focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" placeholder="Nom et prénoms" />
        </div>

        <div>
          <label for="telephoneDestinataire" class="block text-sm font-medium text-gray-900">Téléphone Destinataire</label>
          <input type="tel" id="telephoneDestinataire" v-model="customer.telephoneDestinataire"
            class="mt-2 block h-[3em] w-full rounded-md border-0 py-1.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300
            focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" placeholder="Téléphone" />
        </div>

        <div>
          <label for="typeDeFret" class="block text-sm font-medium text-gray-900">Type de Fret</label>
          <select id="typeDeFret" v-model="customer.typeDeFret"
            class="mt-2 block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300
              focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm">
            <option>Maritime</option>
            <option>Aérien</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900">Description du Colis</label>
          <div v-for="(colis, index) in colisList" :key="index" class="mt-2 text-black">
            <div class="flex items-center gap-2">
              <input type="number" v-model.number="colis.quantite" min="1"
                class="w-10 h-[3em] text-center rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300" />
              <input type="text" v-model="colis.nom"
                class="block h-[3em] w-full rounded-md border-0 py-1.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300" />
              <svg @click="supprimerColis(index)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-red-600 cursor-pointer">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <button class="mt-2 text-blue-600 underline" type="button" @click="ajouterColis">Ajouter un colis</button>
        </div>

        <div>
          <label for="statut" class="block text-sm font-medium text-gray-900">Statut Paiement</label>
          <select id="statut" v-model="customer.statut"
            class="mt-2 block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300
              focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm">
            <option>Non Payé</option>
            <option>Reste à payer</option>
            <option>Payé</option>
          </select>
        </div>

        <div>
          <label for="prix" class="block text-sm font-medium text-gray-900">Prix</label>
          <input type="text" id="prix" v-model="customer.prix"
            class="mt-2 block h-[3em] w-full rounded-md border-0 py-1.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300" />
        </div>

        <div>
          <label for="modeDePaiement" class="block text-sm font-medium text-gray-900">Mode de Paiement</label>
          <select id="modeDePaiement" v-model="customer.modeDePaiement"
            class="mt-2 block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300">
            <option>Chèque</option>
            <option>Espèces</option>
            <option>CB</option>
            <option>Virement</option>
          </select>
        </div>

        <div>
          <label for="resteAPayer" class="block text-sm font-medium text-gray-900">Reste à Payer</label>
          <input type="text" id="resteAPayer" v-model="customer.resteAPayer"
            class="mt-2 block h-[3em] w-full rounded-md border-0 py-1.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300" />
        </div>

        <div>
          <button type="submit"
            class="flex h-[3em] w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
