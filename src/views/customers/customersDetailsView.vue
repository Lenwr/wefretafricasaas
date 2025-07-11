<script setup>
import { useCollection, useFirestore } from 'vuefire'
import { collection, addDoc } from 'firebase/firestore'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import frLocale from 'date-fns/locale/fr'
import router from '../../router/index.js'
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage'
import { toast } from "vue3-toastify"
import Form from '../liste/form.vue'

const route = useRoute()
const db = useFirestore()

const Liste = useCollection(collection(db, 'customers'))
const ListeColis = useCollection(collection(db, 'enlevements'))

const detailId = ref(route.params.id)
const myId = detailId.value

const liste = computed(() => {
  return Liste.value.find((detail) => detail.id === detailId.value)
})

const listeColis = computed(() => {
  return ListeColis.value.filter((detail) => detail.customerId === myId)
})

const formatDateTime = (dateTimeString) => {
  const date = new Date(dateTimeString)
  return format(date, "EEEE d MMMM yyyy à HH'h' mm", { locale: frLocale })
}

const storage = getStorage()

// reactive state for form data
const customer = ref({
  statut: '',
  destinataire: '',
  telephoneDestinataire: '',
  typeDeFret: '',
  destination: '',
  personneEnCharge: '',
  prix: '',
  modeDePaiement: '',
  resteAPayer: '',
  date: '',
  image: [],
  deliveryStatus: 'En attente',
  customerId: myId,
})

// écoute la sélection de fichiers images
function handleFileChange(event) {
  customer.value.image = Array.from(event.target.files)
}

// liste des colis dans le formulaire
const colisList = ref([
  { nom: '', quantite: 1, statutColis: false }
])

const ajouterColis = () => {
  colisList.value.push({ nom: '', quantite: 1, statutColis: false })
}

const supprimerColis = (index) => {
  colisList.value.splice(index, 1)
}

// fonction principale d'envoi du formulaire
async function send() {
  try {
    const imageUrl = []

    for (const file of customer.value.image) {
      const imageRef = storageRef(
        storage,
        `enlevements_images/${Date.now()}_${file.name}`
      )
      await uploadBytes(imageRef, file)
      const url = await getDownloadURL(imageRef)
      imageUrl.push(url)
    }

    // construction des détails colis avec décomposition
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
      expediteur: `${liste.value.nom} ${liste.value.prenom}`,
      statut: customer.value.statut,
      imageUrl,
      telephoneExpediteur: liste.value.telephone,
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
      customerId: customer.value.customerId,
    }

    const enlevementsCollection = collection(db, 'enlevements')
    const newDocumentRef = await addDoc(enlevementsCollection, Data)

    toast("Formulaire envoyé", {
      theme: "auto",
      type: "success",
      autoClose: 1000,
    })

    // Reset formulaire
    customer.value = {
      statut: '',
      destinataire: '',
      telephoneDestinataire: '',
      typeDeFret: '',
      destination: '',
      personneEnCharge: '',
      prix: '',
      modeDePaiement: '',
      resteAPayer: '',
      date: '',
      image: [],
      deliveryStatus: 'En attente',
      customerId: myId,
    }
    colisList.value = []
  } catch (error) {
    console.error("Erreur lors de l'envoi du formulaire :", error)
    toast.error("Erreur lors de l'envoi du formulaire")
  }
}
</script>

<template>
  <div class="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
    <span class="bg-primary text-white rounded-lg shadow-lg text-2xl font-semibold">
      <!-- Titre à ajouter si besoin -->
    </span>

    <!-- Bouton pour ouvrir modal formulaire -->
    <span
      class="flex items-center bg-primary text-white px-3 py-2 my-2 rounded-lg shadow-lg text-lg font-medium cursor-pointer"
      @click="$refs.formModal.showModal()"
    >
      Nouvel Envoi
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
        class="w-6 h-6 ml-2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>

    <!-- Liste des enlèvements -->
    <div class="flex flex-col w-full space-y-4 pb-20">
      <div v-for="(item, i) in listeColis" :key="i"
        class="bg-white border border-gray-200 px-6 py-4 rounded-lg shadow-sm flex justify-between items-center hover:shadow-md transition duration-300">
        <span class="text-gray-700 font-medium">
          Enlèvement du {{ formatDateTime(item.date) }}
        </span>
        <router-link :to="'/liste/' + item.id">
          <button
            class="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition duration-300"
          >
            Voir
          </button>
        </router-link>
      </div>
    </div>

    <!-- Modal Formulaire -->
    <dialog id="formModal" class="modal modal-bottom sm:modal-middle" ref="formModal">
      <div class="modal-box h-[80%] bg-white text-black">
        <Form :myId="myId" />
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-error mb-8 text-white">Fermer</button>
          </form>
        </div>
      </div>
    </dialog>
  </div>
</template>
