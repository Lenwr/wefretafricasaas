<script setup>
import { ref, onMounted, watch } from 'vue'
import { useFirestore, useCollection } from 'vuefire'
import { collection } from 'firebase/firestore'
import router from '../../router/index'
import { useEntrepriseId } from '../../components/userEntrepriseId'

const db = useFirestore()
const rawCustomers = useCollection(collection(db, 'customers'))

// ID de l'entreprise connectée
const { entrepriseId, isLoading } = useEntrepriseId()

const query = ref('')
const filteredList = ref([])
const dropdownRef = ref(null)
const display = ref(false)

// Liste des clients filtrés par entreprise
const Liste = ref([])

// Dès que l'entreprise est chargée, on filtre les clients associés
watch(
  () => [rawCustomers.value, entrepriseId.value],
  () => {
    if (!isLoading.value && entrepriseId.value) {
      Liste.value = rawCustomers.value.filter(
        (c) => c.entrepriseId === entrepriseId.value
      )
    }
  },
  { immediate: true }
)

const filterItems = () => {
  if (query.value.trim() === '') {
    filteredList.value = []
    return
  }

  const lowerCaseQuery = query.value.toLowerCase().trim()
  filteredList.value = Liste.value.filter(
    (item) => item.nom && item.nom.toLowerCase().includes(lowerCaseQuery)
  )
}

const selectItem = (item) => {
  query.value = item.nom
  filteredList.value = []
  display.value = !display.value
  router.push(`/customersDetails/${item.id}`) // ✅ corriger les quotes
}

const closeDropdown = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    filteredList.value = []
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})
</script>
