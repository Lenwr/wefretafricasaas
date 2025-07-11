<script setup>
import { useCollection, useFirestore } from "vuefire";
import {
  collection, doc, updateDoc, getDoc, getDocs, query, where
} from "firebase/firestore";
import { useRoute } from "vue-router";
import { computed, ref, onMounted } from "vue";
import { StreamBarcodeReader } from "vue-barcode-reader";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import { format } from "date-fns";
import frLocale from "date-fns/locale/fr";
import Export from "../../components/export.vue";

const db = useFirestore();
const route = useRoute();
const allChargements = useCollection(collection(db, 'chargements'));
const detailId = ref(route.params.id);
const displayScanner = ref(false);
const scannedText = ref('');
const docRef = doc(db, 'chargements', detailId.value);
const statutSelectionne = ref('chargé');

const statutsColisMap = ref(new Map()); // 💾 Stocke les statuts des colis

const chargement = computed(() =>
  allChargements.value.find(c => c.id === detailId.value)
);

const colisFiltresTries = computed(() => {
  return chargement.value?.packagesTable
    ?.slice()
    ?.sort((a, b) => new Date(a.date) - new Date(b.date)) || [];
});

function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return format(date, "EEEE d MMMM yyyy à HH'h'mm", { locale: frLocale });
}

// 🔄 Charge les vrais statuts depuis la collection "enlevements"
async function chargerStatutsColis() {
  const map = new Map();
  const groupesParClient = {};

  for (const item of chargement.value?.packagesTable || []) {
    if (!groupesParClient[item.clientId]) groupesParClient[item.clientId] = [];
    groupesParClient[item.clientId].push(item);
  }

  for (const [clientId, colisList] of Object.entries(groupesParClient)) {
    const snap = await getDoc(doc(db, 'enlevements', clientId));
    if (!snap.exists()) continue;

    const colisArray = snap.data().colis || [];

    colisList.forEach(item => {
      const detail = colisArray[item.colisIndex]?.details?.[item.detailIndex];
      const key = `${item.clientId}-${item.colisIndex}-${item.detailIndex}`;
      map.set(key, detail?.statutColis || '');
    });
  }

  statutsColisMap.value = map;
}

function getStatutColis(item) {
  const key = `${item.clientId}-${item.colisIndex}-${item.detailIndex}`;
  return statutsColisMap.value.get(key) || 'Non défini';
}

async function onDecode(text) {
  scannedText.value = text;
  const [expediteur, destinataire, nombreDeColis, clientId, colisIndex, detailIndex, coli] = text.split(',');

  const colis = {
    id: `${clientId}-${colisIndex}-${detailIndex}`,
    expediteur,
    destinataire,
    nombreDeColis: Number(nombreDeColis),
    clientId,
    colisIndex: Number(colisIndex),
    detailIndex: Number(detailIndex),
    coli,
    date: new Date().toISOString(),
    status: 'scanné',
    historique: [
      {
        status: 'scanné',
        date: new Date().toISOString()
      }
    ],
    chargementId: detailId.value
  };

  const dejaAjoute = chargement.value?.packagesTable?.some(item => item.id === colis.id);

  if (dejaAjoute) {
    toast(`⚠️ Le colis ${coli} de ${expediteur} a déjà été scanné.`, {
      theme: "auto",
      type: "info",
      autoClose: 2000
    });
    return;
  }

  const newList = [...(chargement.value?.packagesTable || []), colis];
  await updateDoc(docRef, { packagesTable: newList });

  toast("✅ Colis ajouté avec succès", {
    theme: "auto",
    type: "success",
    autoClose: 2000
  });

  await chargerStatutsColis(); // Recharge le statut
}

async function majStatutChargement() {
  try {
    const colisRef = collection(db, 'colis');
    const q = query(colisRef, where('chargementId', '==', detailId.value));
    const snapshot = await getDocs(q);

    const batchColisUpdate = snapshot.docs.map(docSnap => {
      const colis = docSnap.data();
      const newHistorique = [...(colis.historique || []), {
        status: statutSelectionne.value,
        date: new Date().toISOString()
      }];
      return updateDoc(doc(db, 'colis', docSnap.id), {
        status: statutSelectionne.value,
        historique: newHistorique
      });
    });

    const colisParClient = {};
    for (const colis of chargement.value?.packagesTable || []) {
      if (!colisParClient[colis.clientId]) {
        colisParClient[colis.clientId] = [];
      }
      colisParClient[colis.clientId].push(colis);
    }

    const batchEnlevementUpdate = Object.entries(colisParClient).map(async ([clientId, colisList]) => {
      const enlevementRef = doc(db, 'enlevements', clientId);
      const enlevementSnap = await getDoc(enlevementRef);
      if (!enlevementSnap.exists()) return;

      const enlevementData = enlevementSnap.data();
      const colisArray = enlevementData.colis || [];

      colisList.forEach(colis => {
        const { colisIndex, detailIndex } = colis;
        if (
          colisArray[colisIndex] &&
          colisArray[colisIndex].details &&
          colisArray[colisIndex].details[detailIndex]
        ) {
          colisArray[colisIndex].details[detailIndex].statutColis = statutSelectionne.value;
        }
      });

      await updateDoc(enlevementRef, { colis: colisArray });
    });

    await Promise.all([...batchColisUpdate, ...batchEnlevementUpdate]);

    toast("📦 Tous les statuts ont été mis à jour avec succès !", {
      theme: "auto",
      type: "success",
      autoClose: 2000
    });

    await chargerStatutsColis(); // 🔁 Recharge les statuts après update
  } catch (error) {
    console.error("❌ Erreur MAJ statut colis et enlevements:", error);
    toast("❌ Erreur lors de la mise à jour globale", {
      theme: "auto",
      type: "error",
      autoClose: 2000
    });
  }
}

onMounted(async () => {
  await chargerStatutsColis(); // 💡 Charge les statuts au démarrage
});
</script>


<template>
  <div class="text-black flex flex-row justify-around items-center m-8">
    <h2>📦 Enregistrement des colis</h2>
    <button class="btn" @click="displayScanner = !displayScanner">
      {{ displayScanner ? 'Arrêt' : 'Scan' }}
    </button>
  </div>

  <div class="flex justify-center mb-4 gap-2">
    <select v-model="statutSelectionne" class="select select-bordered">
      <option value="scanné">Scanné</option>
      <option value="expédié">Expédié</option>
      <option value="disponible pour retrait">Disponible pour retrait</option>
      <option value="livré">Livré</option>
    </select>
    <button class="btn btn-primary" @click="majStatutChargement">
      Mettre à jour les statuts
    </button>
  </div>

  <div class="flex justify-center bg-black" v-if="displayScanner">
    <StreamBarcodeReader @decode="onDecode" />
  </div>

  <div class="flex flex-col my-10 px-4">
    <h3 class="text-center text-xl font-bold text-primary mb-4">📋 Liste des colis scannés</h3>
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white shadow-md rounded-xl overflow-hidden">
        <thead class="bg-gray-200 text-gray-700">
          <tr>
            <th class="text-sm px-6 py-3 text-left">Expéditeur</th>
            <th class="text-sm px-6 py-3 text-left">Destinataire</th>
            <th class="text-sm px-6 py-3 text-left">Colis</th>
            <th class="text-sm px-6 py-3 text-left">Nombre total de coli</th>
            <th class="text-sm px-6 py-3 text-left">Date enlèvement</th>
            <th class="text-sm px-6 py-3 text-left">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in colisFiltresTries" :key="i" class="border-b hover:bg-gray-50 text-black">
            <td class="px-6 py-4 text-sm">{{ item.expediteur }}</td>
            <td class="px-6 py-4 text-sm">{{ item.destinataire }}</td>
            <td class="px-6 py-4 text-sm">{{ item.coli }}</td>
            <td class="px-6 py-4 text-sm text-center">{{ item.nombreDeColis }}</td>
            <td class="px-6 py-4 text-sm">{{ formatDateTime(item.date) }}</td>
            <td class="px-6 py-4 text-sm text-center">{{ getStatutColis(item) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="flex justify-center py-5">
    <Export class="text-black" :dataSend="chargement?.packagesTable || []" />
  </div>

  <div class="flex flex-col my-10 px-4">
    <h3 class="text-center text-xl font-bold text-primary mb-4">📦 Détail des statuts des articles du colis</h3>
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white shadow-md rounded-xl overflow-hidden">
        <thead class="bg-blue-200 text-blue-900">
          <tr>
            <th class="text-sm px-6 py-3 text-left">#</th>
            <th class="text-sm px-6 py-3 text-left">Article</th>
            <th class="text-sm px-6 py-3 text-left">Statut actuel</th>
            <th class="text-sm px-6 py-3 text-left">Dernière mise à jour</th>
            <th class="text-sm px-6 py-3 text-left">Historique</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(colis, index) in colisFiltresTries" :key="colis.id" class="border-b hover:bg-blue-50 text-black">
            <td class="px-6 py-4 text-sm">{{ index + 1 }}</td>
            <td class="px-6 py-4 text-sm">{{ colis.coli }}</td>
            <td class="px-6 py-4 text-sm capitalize">{{ colis.status }}</td>
            <td class="px-6 py-4 text-sm">
              {{ formatDateTime(colis.date) }}
            </td>
            <td class="px-6 py-4 text-sm">
              <ul class="list-disc list-inside">
                <li v-for="(h, i) in colis.historique" :key="i">
                  {{ h.status }} - {{ formatDateTime(h.date) }}
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>


</template>

<style scoped></style>
