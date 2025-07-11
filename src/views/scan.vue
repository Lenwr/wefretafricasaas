<script setup>
import { ref, computed } from 'vue'
import { StreamBarcodeReader } from 'vue-barcode-reader'
import { useRoute } from 'vue-router'
import { useCollection, useFirestore } from 'vuefire'
import { collection } from 'firebase/firestore'
import router from '../router/index.js'

const db = useFirestore()
const datas = useCollection(collection(db, 'enlevements'))

const decodedText = ref('')
const Client = ref(null)

const onLoaded = () => {
  console.log('Scanner chargé')
}

const onDecode = (text) => {
  decodedText.value = text

  // Vérifie si c’est le nouveau format avec des virgules (QR code complet)
  if (text.includes(',')) {
    const parts = text.split(',')

    // Ancien format de QR à 7 éléments → nouvel avec detailIndex
    if (parts.length === 6 || parts.length === 7) {
      const [expediteur, destinataire, nombreDeColis, docId, colisIndex, detailIndex] = parts.map(p => p.trim())

      const client = datas.value.find((c) => c.id === docId)

      if (client) {
        Client.value = client

        router.push({
          path: `/sign/${docId}`,
          query: {
            colisIndex,
            detailIndex
          }
        })
      } else {
        console.warn("❌ Client non trouvé avec l’ID :", docId)
      }
    } else {
      console.warn("❌ Format QR non reconnu :", text)
    }

  } else {
    // Ancien QR code simple : uniquement ID Firebase
    const id = text.trim()
    router.push({ path: `/sign/${id}` })
  }
}

</script>

<template>
  <div class="full-screen">
    <StreamBarcodeReader
      @decode="onDecode"
      @loaded="onLoaded"
    />
  </div>
</template>

<style scoped>
.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
}
</style>
