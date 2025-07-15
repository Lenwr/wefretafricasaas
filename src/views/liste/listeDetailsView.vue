<script setup>
import { useCollection, useFirestore, useDocument } from "vuefire";
import { toast } from "vue3-toastify";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  updateDoc,
} from "firebase/firestore";
import { computed, onMounted, nextTick, ref, watch, watchEffect } from "vue";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRoute } from "vue-router";
import { format } from "date-fns";
import frLocale from "date-fns/locale/fr";
import QrcodeVue from "qrcode.vue";
import router from "../../router/index.js";

import { jsPDF } from "jspdf";
import { logo } from "../../constants.js";
// import { StreamBarcodeReader } from 'vue-barcode-reader'
// import { async } from '@firebase/util'
const route = useRoute();
const db = useFirestore();
const datas = useCollection(collection(db, "enlevements"));
const database = getFirestore();
const detailId = ref(route.params.id);
import { useEntrepriseId } from '../../components/userEntrepriseId.js'
const { entrepriseId, isLoading2 } = useEntrepriseId()



const entreprise = ref(null)





const client = computed(() => {
  return datas.value.find((detail) => detail.id === detailId.value);
});
const customer = ref({
  expediteur: "",
  statut: "",
  telephoneExpediteur: "",
  destinataire: "",
  telephoneDestinataire: "",
  typeDeFret: "",
  destination: "",
  nombreDeColis: "",
  description: "",
  personneEnCharge: "",
  prix: "",
  modeDePaiement: "",
  resteAPayer: "",
  date: "",
  image: null,
});

const today = new Date();

//update
const docRef = doc(db, "enlevements", detailId.value);
const clientSource = useDocument(docRef);

watch(clientSource, (clientSource) => {
  customer.value = {
    ...clientSource,
  };
});



//formatage date
function formatDateTime(dateTimeString) {
  const date = new Date(dateTimeString);
  const options = {
    weekday: "long", // Jour de la semaine (ex: "Mardi")
    day: "numeric", // Jour du mois (ex: "9")
    month: "long", // Mois (ex: "décembre")
    year: "numeric", // Année (ex: "2023")
    hour: "numeric", // Heure (ex: "20")
    minute: "numeric", // Minute (ex: "13")
  };
  return format(date, "EEEE d MMMM yyyy - HH'h' mm", { locale: frLocale });
}

//update deliveryStatus
async function updateStatut(id) {
  const DocRef = doc(database, "enlevements", id);
  const change = document.getElementById("sel");
  await updateDoc(DocRef, {
    deliveryStatus: change.value,
  });
}

//delete customer
async function deleteCustomer(id) {
  const DocRef = doc(database, "enlevements", id);
  await deleteDoc(DocRef);

  await router.push({ path: "/liste" });
}


async function uploadPDF(client, pdf) {
  const storage = getStorage();
  const pdfBlob = pdf.output("blob");

  const pdfRef = storageRef(storage, `factures/${client.expediteur}.pdf`);
  await uploadBytes(pdfRef, pdfBlob);

  const pdfURL = await getDownloadURL(pdfRef);
  console.log("PDF uploaded:", pdfURL);

  return pdfURL;
}

function formatPhoneNumber(number) {
  const digits = number.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '+33' + digits.slice(1);
  }
  if (digits.startsWith('33')) {
    return '+' + digits;
  }
  if (digits.startsWith('336') || digits.startsWith('337')) {
    return '+' + digits;
  }

  throw new Error("Numéro invalide ou format non supporté");
}

const isLoading = ref(false)

const sendInvoiceSMS = async (phoneNumber, message) => {
  try {
    const response = await fetch("https://sendinvoicesms-v6gcy72m6a-uc.a.run.app", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, message }),
    });

    const data = await response.json();
    if (response.ok) {
      toast.success("Bordereau envoyé", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 4000,
      })
    } else {
      console.error("Erreur :", data.error);
    }
  } catch (err) {
    console.error("Erreur réseau :", err);
  }
};



//generer le pdf

const sendSMS = async (client) => {
  try {
    isLoading.value = true
    const canvasElement = document.getElementById("qr_code");

    // Fonction pour générer une description propre
    function genererTexteDescription(colisArray) {
      if (!Array.isArray(colisArray)) return "Aucun colis";

      const resultats = [];

      for (const colis of colisArray) {
        if (colis.details && Array.isArray(colis.details)) {
          colis.details.forEach((detail) => {
            resultats.push(detail.coli);
          });
        } else if (colis.quantite && colis.quantite > 1) {
          for (let i = 1; i <= colis.quantite; i++) {
            resultats.push(`${colis.nom} - ${i}`);
          }
        } else {
          resultats.push(`${colis.nom} - 1`);
        }
      }

      return resultats.join(", ");
    }

    const texteDescription = client.description
      ? client.description
      : genererTexteDescription(client.colis);

    if (!canvasElement) {
      console.error("Canvas element not found");
      return;
    }

    const imageBase64 = canvasElement.toDataURL("image/png");
    const prixAffiche = client.prix ? `${client.prix} €` : " - ";

    let pdf = new jsPDF("p", "mm", "a4");
    const imgData = logo;

    // Infos entreprise
    pdf.setFontSize(13);
    pdf.text("AARON TRAVEL", 20, 20);
    pdf.text("Addresse : 15 Rue des écoles 95500,", 20, 26);
    pdf.text("le thillay", 20, 32);
    pdf.text("Téléphone : 06 03 67 50 62", 20, 38);
    pdf.text("Mail : aarontravel@outlook.fr", 20, 44);
    pdf.addImage(imgData, "JPEG", 150, 20, 40, 20);

    // QR code
    pdf.addImage(imageBase64, "JPEG", 20, 52, 30, 30);

    // Cadre
    pdf.setLineWidth(0.5);
    pdf.setLineDash([1]);
    pdf.line(8, 48, 205, 48);
    pdf.line(8, 86, 205, 86);

    pdf.setLineDash([]);
    pdf.line(19, 51, 19, 83);
    pdf.line(51, 51, 51, 83);
    pdf.line(120, 51, 120, 83);
    pdf.line(19, 51, 198, 51);
    pdf.line(19, 83, 198, 83);
    pdf.line(198, 51, 198, 83);

    // Expéditeur
    pdf.setDrawColor(0);
    pdf.setFillColor(50, 205, 50);
    pdf.rect(54, 52, 60, 7, "F");
    pdf.setFontSize(15);
    pdf.setTextColor(255, 255, 255);
    pdf.text("EXPEDITEUR", 59, 58);
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(client.expediteur.toUpperCase(), 54, 64);
    pdf.text("Téléphone : " + client.telephoneExpediteur, 54, 70);
    pdf.text("Nombre de colis : " + client.nombreDeColis, 54, 76);
    pdf.text("Type de Fret : " + client.typeDeFret.toUpperCase(), 54, 81);

    // Destinataire
    pdf.setFillColor(50, 205, 50);
    pdf.rect(124, 52, 60, 7, "F");
    pdf.setFontSize(15);
    pdf.setTextColor(255, 255, 255);
    pdf.text("DESTINATAIRE", 125, 58);
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(client.destinataire.toUpperCase(), 125, 65);
    pdf.text("Téléphone : " + client.telephoneDestinataire, 125, 71);

    // Description
    pdf.setDrawColor(0);
    pdf.setFillColor(192, 192, 192);
    pdf.rect(20, 90, 178, 8, "FD");
    pdf.setFontSize(12);
    pdf.text("Qté", 22, 95);
    pdf.text("Description", 35, 95);
    const splitDescription = pdf.splitTextToSize(texteDescription, 110);
    pdf.text(splitDescription, 35, 103);
    pdf.text("P.U.", 154, 95);
    pdf.text("TOTAL", 180, 95);
    pdf.text(prixAffiche, 180, 103);

    // Encadré
    pdf.line(20, 90, 20, 280);
    pdf.line(30, 90, 30, 250);
    pdf.line(150, 90, 150, 280);
    pdf.line(170, 90, 170, 250);
    pdf.line(198, 90, 198, 280);
    pdf.line(20, 280, 198, 280);

    pdf.setDrawColor(0);
    pdf.setFillColor(192, 192, 192);
    pdf.text("TOTAL", 152, 247);
    pdf.text(prixAffiche, 175, 247);

    pdf.setFontSize(15);
    pdf.text(
      `Observations : ${client.statut}    Reste à payer : ${client.resteAPayer}`,
      22,
      256
    );
    pdf.line(20, 250, 198, 250);

    // Upload + SMS
    const pdfUrl = await uploadPDF(client, pdf);
    const message = `Bonjour ${client.expediteur}, voici votre bordereau de livraison : ${pdfUrl}`;
    await sendInvoiceSMS(formatPhoneNumber(client.telephoneExpediteur), message);
  } catch (error) {
    console.error(error)
    toast.error("Une erreur est survenue lors de l'envoi du bordereau.", {
      position: toast.POSITION.TOP_RIGHT,
    })
  } finally {
    isLoading.value = false
  }
};


//CodeQR
watch(entrepriseId, async (newId) => {
  if (newId) {
    const docRef = doc(db, 'entreprises', newId)
    const docSnap = await getDoc(docRef)

    entreprise.value = docSnap.exists() ? docSnap.data() : null
    console.log(entreprise.value.logoUrl)
  } else {
    entreprise.value = null
  }
})

const downloadQR = (client) => {
  const canvasElement = document.getElementById("qr_code");
  // Vérifier si l'élément canvas a été trouvé
  if (canvasElement) {
    // Convertir le contenu du canvas en base64
    const imageBase64 = canvasElement.toDataURL("image/png");

    // imageBase64 contient maintenant la représentation base64 de l'image générée

    // Vous pouvez également utiliser cette base64 pour afficher l'image dans une balise <img> ou la sauvegarder, etc.

    let pdf = new jsPDF("p", "mm", "a6");
    //informations entreprise

    pdf.setFontSize(12);
    pdf.text("DESTINATAIRE : " + client.destinataire.toUpperCase(), 5, 10);
    pdf.text("TELEPHONE : " + client.telephoneDestinataire, 5, 20);
    pdf.text("DESTINATION : " + client.destination, 5, 30);
    pdf.text("NOMBRE DE COLIS : " + client.nombreDeColis, 5, 40);

    //qrCode
    pdf.addImage(imageBase64, "JPEG", 20, 75, 60, 60);

    //decoupage borderau
    pdf.setLineWidth(0.5);

    pdf.line(4, 4, 100, 4);
    pdf.line(4, 70, 100, 70);
    pdf.line(4, 140, 100, 140);
    pdf.line(4, 4, 4, 140);
    pdf.line(100, 4, 100, 140);

    //information destinataire

    pdf.save(client.expediteur);
  } else {
    console.error("Canvas element not found");
  }
};
function getBase64ImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

function genererTexteDescription(colisArray) {
  if (!Array.isArray(colisArray)) return "Aucun colis";

  const resultats = [];

  for (const colis of colisArray) {
    if (colis.details && Array.isArray(colis.details)) {
      colis.details.forEach((detail) => {
        resultats.push(detail.coli);
      });
    } else if (colis.quantite && colis.quantite > 1) {
      for (let i = 1; i <= colis.quantite; i++) {
        resultats.push(`${colis.nom} - ${i}`);
      }
    } else {
      resultats.push(`${colis.nom} - 1`);
    }
  }

  return resultats.join(", ");
}

const afficherPDF = async (client) => {
  if (!entreprise.value) {
    alert('Aucune entreprise trouvée');
    return;
  }

  let logoBase64 = '';
  if (entreprise.value.logoUrl) {
    try {
      logoBase64 = await getBase64ImageFromUrl(entreprise.value.logoUrl);
    } catch (error) {
      console.error("Erreur conversion logo base64 :", error);
    }
  }

  const canvasElement = document.getElementById("qr_code");
  if (!canvasElement) {
    console.error("Canvas element not found");
    return;
  }
  const imageBase64 = canvasElement.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  // Variables pour gérer la position verticale
  let y = 20;

  pdf.setFontSize(13);
  pdf.text(entreprise.value.nom.toUpperCase(), 20, y);

  // Adresse avec retour à la ligne
  y += 6;
  const adresseSplit = pdf.splitTextToSize(entreprise.value.adresse, 150);
  pdf.text(adresseSplit, 20, y);
  y += 7 * adresseSplit.length;
  pdf.text(`Téléphone: ${entreprise.value.tel}`, 20, y);
  y += 6;
  pdf.text(`Email: ${entreprise.value.email}`, 20, y);

  if (logoBase64) {
    pdf.addImage(logoBase64, "PNG", 150, 20, 40, 20);
  }

  pdf.setFontSize(15);
  pdf.setTextColor(0, 0, 0);
  pdf.addImage(imageBase64, "PNG", 20, y + 10, 30, 30);

  // Ligne séparation
  pdf.setLineWidth(0.5);
  pdf.setLineDash([1]);
  pdf.line(8, y + 6, 205, y + 6);
  pdf.line(8, y + 44, 205, y + 44);

  pdf.setLineDash([]);
  pdf.line(19, y + 9, 19, y + 41);
  pdf.line(51, y + 9, 51, y + 41);
  pdf.line(120, y + 9, 120, y + 41);
  pdf.line(19, y + 9, 198, y + 9);
  pdf.line(19, y + 41, 198, y + 41);
  pdf.line(198, y + 9, 198, y + 41);

  // Expéditeur
  pdf.setDrawColor(0);
  pdf.setFillColor(34, 139, 34); // vert forêt, plus soft
  pdf.rect(54, y + 10, 60, 7, "F");
  pdf.setFontSize(15);
  pdf.setTextColor(255, 255, 255);
  pdf.text("EXPEDITEUR ", 59, y + 16);
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(client.expediteur.toUpperCase(), 54, y + 22);
  pdf.text("Téléphone : " + client.telephoneExpediteur, 54, y + 28);
  pdf.text("Nombre de colis : " + client.nombreDeColis, 54, y + 34);
  pdf.text("Type de Fret : " + client.typeDeFret.toUpperCase(), 54, y + 39);

  // Destinataire
  pdf.setDrawColor(0);
  pdf.setFillColor(34, 139, 34);
  pdf.rect(124, y + 10, 60, 7, "F");
  pdf.setFontSize(15);
  pdf.setTextColor(255, 255, 255);
  pdf.text("DESTINATAIRE ", 125, y + 16);
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(client.destinataire.toUpperCase(), 125, y + 23);
  pdf.text("Téléphone : " + client.telephoneDestinataire, 125, y + 29);

  // Description
  pdf.setDrawColor(0);
  pdf.setFillColor(192, 192, 192);
  pdf.rect(20, y + 48, 178, 8, "FD");
  pdf.text("Qté", 22, y + 53);
  pdf.text("Description", 35, y + 53);

  const texteDescription = client.description
    ? client.description
    : genererTexteDescription(client.colis);

  let splitDescription = pdf.splitTextToSize(texteDescription, 110);
  pdf.setFontSize(12);
  pdf.text(splitDescription, 35, y + 61);

  const prixAffiche = client.prix ? `${client.prix} €` : " - ";
  pdf.text("P.U.", 154, y + 53);
  pdf.text("TOTAL", 180, y + 53);
  pdf.text(prixAffiche, 180, y + 61);

  pdf.setLineWidth(0.5);
  pdf.line(20, y + 48, 20, y + 238);
  pdf.line(30, y + 48, 30, y + 198);
  pdf.line(150, y + 48, 150, y + 238);
  pdf.line(170, y + 48, 170, y + 198);
  pdf.line(198, y + 48, 198, y + 238);
  pdf.line(20, y + 238, 198, y + 238);

  pdf.setDrawColor(0);
  pdf.setFillColor(192, 192, 192);
  pdf.rect(150, y + 200, 20, 8, "FD");
  pdf.text("TOTAL", 152, y + 205);
  pdf.text(prixAffiche, 175, y + 205);

  pdf.setFontSize(15);
  pdf.text(
    "Observations : " + client.statut + "    Reste à payer : " + client.resteAPayer,
    22,
    y + 218
  );
  pdf.line(20, y + 210, 198, y + 210);

  // Footer
  pdf.setFontSize(9);
  pdf.setTextColor(150);
  pdf.text(
    `Document généré par ${entreprise.value.nom}  le ${new Date().toLocaleDateString()}`,
    20,
    282
  );
  pdf.setTextColor(100);
  pdf.setFontSize(13);
  pdf.text(
    `Numero de suivi : ${client.numero}`,
    20,
    287
  );

  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url);
};






const globalIndexNew = ref(0)   // Pour les colis au nouveau format (details)
const globalIndexOld = ref(0)



const qrCodeColis = async () => {
  await nextTick(); // s'assurer que les qrcodes sont bien dans le DOM

  const pdf = new jsPDF("p", "mm", "a6");

  for (let colisIndex = 0; colisIndex < client.value.colis.length; colisIndex++) {
    const item = client.value.colis[colisIndex];

    // 📦 Cas 3 : format avec "details" (sous-colis)
    if (Array.isArray(item.details) && item.details.length > 0) {
      for (let detailIndex = 0; detailIndex < item.details.length; detailIndex++) {
        const detail = item.details[detailIndex];
        const id = `${item.nom}-${detailIndex + 1}`;
        const canvas = document.getElementById(id)?.querySelector("canvas");
        if (!canvas) continue;

        const imageBase64 = canvas.toDataURL("image/png");

        pdf.setFontSize(10);
        pdf.text(`DESTINATAIRE : ${client.value.destinataire.toUpperCase()}`, 5, 10);
        pdf.text(`TELEPHONE : ${client.value.telephoneDestinataire}`, 5, 20);
        pdf.text(`DESTINATION : ${client.value.destination}`, 5, 30);
        pdf.text(`COLI : ${detail.coli}`, 5, 40);
        pdf.text(`TOTAL COLIS CLIENT : ${client.value.nombreDeColis}`, 5, 50);

        pdf.setLineWidth(0.5);
        pdf.line(5, 55, 100, 55);

        const qrSize = 40;
        const qrX = (105 - qrSize) / 2;
        pdf.addImage(imageBase64, "JPEG", qrX, 70, qrSize, qrSize);

        pdf.setLineWidth(0.5);
        pdf.rect(4, 4, 96, 132);

        // Ajouter page sauf pour le dernier
        if (!(colisIndex === client.value.colis.length - 1 && detailIndex === item.details.length - 1)) {
          pdf.addPage();
        }
      }

      // 📦 Cas 2 : format avec quantité, sans details
    } else if (item.quantite && item.quantite > 1) {
      for (let i = 1; i <= item.quantite; i++) {
        const id = `${item.nom}-${i}`;
        const canvas = document.getElementById(id)?.querySelector("canvas");
        if (!canvas) continue;

        const imageBase64 = canvas.toDataURL("image/png");

        pdf.setFontSize(10);
        pdf.text(`DESTINATAIRE : ${client.value.destinataire.toUpperCase()}`, 5, 10);
        pdf.text(`TELEPHONE : ${client.value.telephoneDestinataire}`, 5, 20);
        pdf.text(`DESTINATION : ${client.value.destination}`, 5, 30);
        pdf.text(`COLI : ${item.nom} - ${i}/${item.quantite}`, 5, 40);
        pdf.text(`TOTAL COLIS CLIENT : ${client.value.nombreDeColis}`, 5, 50);

        pdf.setLineWidth(0.5);
        pdf.line(5, 55, 100, 55);

        const qrSize = 40;
        const qrX = (105 - qrSize) / 2;
        pdf.addImage(imageBase64, "JPEG", qrX, 70, qrSize, qrSize);

        pdf.setLineWidth(0.5);
        pdf.rect(4, 4, 96, 132);

        if (!(colisIndex === client.value.colis.length - 1 && i === item.quantite)) {
          pdf.addPage();
        }
      }

      // 📦 Cas 1 : ancien format simple (1 seul QR)
    } else {
      const id = `${item.nom}-1`;
      const canvas = document.getElementById(id)?.querySelector("canvas");
      if (!canvas) continue;

      const imageBase64 = canvas.toDataURL("image/png");

      pdf.setFontSize(10);
      pdf.text(`DESTINATAIRE : ${client.value.destinataire.toUpperCase()}`, 5, 10);
      pdf.text(`TELEPHONE : ${client.value.telephoneDestinataire}`, 5, 20);
      pdf.text(`DESTINATION : ${client.value.destination}`, 5, 30);
      pdf.text(`COLI : ${item.nom}`, 5, 40);
      pdf.text(`TOTAL COLIS CLIENT : ${client.value.nombreDeColis}`, 5, 50);

      pdf.setLineWidth(0.5);
      pdf.line(5, 55, 100, 55);

      const qrSize = 40;
      const qrX = (105 - qrSize) / 2;
      pdf.addImage(imageBase64, "JPEG", qrX, 70, qrSize, qrSize);

      pdf.setLineWidth(0.5);
      pdf.rect(4, 4, 96, 132);

      if (colisIndex !== client.value.colis.length - 1) {
        pdf.addPage();
      }
    }
  }

  pdf.save(`${client.value.expediteur}.pdf`);
};


</script>

<template>
  <div class="bg-white ">
    <div class="main flex flex-row justify-around bg-green  py-10">
      <!--
      <div v-if="!Array.isArray(client.imageUrl)"
        class="up aspect-h-1 md:h-[40em] h-[25em]  aspect-w-1 w-[45%] overflow-hidden shadow-2xl rounded-lg bg-gray-200 xl:aspect-h-8 xl:aspect-w-7">
        <img :src="client.imageUrl" class="h-full w-full object-cover object-center group-hover:opacity-75" />
      </div>
      <div v-else
        class="carousel carousel-center bg-white rounded-box space-x-4 p-4 up aspect-h-1 h-[28rem] w-[50%] xl:aspect-h-8 xl:aspect-w-7 shadow-2xl">
        <div class="carousel-item w-[95%]" v-for="(item, index) in client.imageUrl" :key="index">
          <img :src="item" class="rounded-box h-auto group-hover:opacity-75" />
        </div>

      </div>
      -->
      <div class="down w-[45%] h-auto">
        <!-- Statut -->
        <div class="flex items-center justify-between my-4">
          <h1 class="text-xl font-semibold text-gray-700">Expéditeur</h1>
          <p class="px-4 py-2 text-sm font-medium rounded-md text-white" :class="{
            'bg-red-500': client.statut === 'Non Payé',
            'bg-yellow-500': client.statut === 'Reste à payer',
            'bg-green-500': client.statut === 'Payé',
          }">
            {{ client.statut }}
          </p>
        </div>

        <!-- Informations principales -->
        <h1 class="text-xl font-medium text-gray-700 mt-4">
          {{ client.expediteur }}
        </h1>
        <h1 class="text-xl font-medium text-gray-700 mt-4">
          Destinataire du Colis
        </h1>
        <p class="text-gray-700 text-base mt-2">{{ client.destinataire.toUpperCase() }}</p>
        <h1 class="text-xl font-medium text-gray-700 mt-4">Date d'enlèvement du colis : </h1>
        <p v-if="client.date" class="text-gray-600 text-sm mt-2">
          {{ formatDateTime(client.date) }}
        </p>

        <!-- Liste des Colis -->
        <div v-if="client.colis" class="mt-6">
          <div class="space-y-6">
            <h2 class="text-xl font-bold text-gray-800">📦 Liste des colis</h2>

            <div v-for="(colis, index) in client.colis" :key="index"
              class="p-4 rounded-lg shadow border bg-white space-y-2">

              <!-- Cas 3 : avec sous-colis -->
              <div v-if="colis.details && colis.details.length">
                <h3 class="text-green-700 font-semibold text-base">{{ colis.nom }} (x{{ colis.details.length }})</h3>
                <ul class="ml-4 mt-2 space-y-1">
                  <li v-for="(detail, dIndex) in colis.details" :key="dIndex"
                    class="pl-3 border-l-4 text-black border-green-500 text-sm">
                    <span class="font-medium">{{ detail.coli }}</span> —
                    <span :class="detail.statutColis ? 'text-green-600' : 'text-red-600'">
                      {{ detail.statutColis ? 'Réceptionné' : 'En attente' }}
                    </span>
                  </li>
                </ul>
              </div>

              <!-- Cas 2 : avec quantité > 1 -->
              <div v-else-if="colis.quantite && colis.quantite > 1">
                <h3 class="text-blue-700 font-semibold text-base">{{ colis.nom }} (x{{ colis.quantite }})</h3>
                <ul class="ml-4 mt-2 space-y-1">
                  <li v-for="i in colis.quantite" :key="i" class="pl-3 border-l-4 text-black border-blue-500 text-sm">
                    {{ colis.nom }} - {{ i }}
                  </li>
                </ul>
              </div>

              <!-- Cas 1 : simple (sans quantité ni détails) -->
              <div v-else>
                <h3 class="text-gray-800 font-semibold text-base">{{ colis.nom }} (x1)</h3>
              </div>
            </div>
          </div>







          <!-- QR codes cachés pour génération PDF -->
          <div class="hidden">
            <template v-for="(item, colisIndex) in client.colis" :key="colisIndex">
              <!-- Cas 3 : avec details -->
              <template v-if="item.details && item.details.length">
                <div v-for="(detail, detailIndex) in item.details" :key="`qr-${colisIndex}-${detailIndex}`"
                  :id="`${item.nom}-${detailIndex + 1}`">
                  <qrcode-vue
                    :value="`${client.expediteur},${client.destinataire},${client.nombreDeColis},${client.id},${colisIndex},${detailIndex},${detail.coli}`"
                    :size="300" level="H" />
                </div>
              </template>

              <!-- Cas 2 : avec quantite -->
              <template v-else-if="item.quantite && item.quantite > 1">
                <div v-for="i in item.quantite" :key="`qr-${colisIndex}-${i}`" :id="`${item.nom}-${i}`">
                  <qrcode-vue
                    :value="`${client.expediteur},${client.destinataire},${client.nombreDeColis},${client.id},${colisIndex},${i}`"
                    :size="300" level="H" />
                </div>
              </template>

              <!-- Cas 1 : simple -->
              <template v-else>
                <div :id="`${item.nom}-1`">
                  <qrcode-vue
                    :value="`${client.expediteur},${client.destinataire},${client.nombreDeColis},${client.id},${colisIndex},0`"
                    :size="300" level="H" />
                </div>
              </template>
            </template>
          </div>

        </div>


        <h1 class="mt-4 text-xl font-medium text-gray-700">Nombre de Colis</h1>
        <p class="mt-1 text-gray-500 h-14">{{ client.nombreDeColis }}</p>

        <!-- Statut du colis -->
        <div class="my-4 hidden">
          <h1 class="text-xl font-medium text-gray-700">Statut du colis :</h1>
          <select v-on:change="updateStatut(client.id)" id="sel"
            class="w-full mt-2 border border-gray-300 rounded-lg bg-gray-50 px-3 py-2 text-gray-700">
            <option selected disabled>{{ client.deliveryStatus }}</option>
            <option disabled>- - - -</option>
            <option>En attente</option>
            <option>Envoyé</option>
            <option>Réceptionné</option>
          </select>
        </div>

        <div class="flex flex-wrap gap-4 mt-6">
          <qrcode-vue class="hidden" id="qr_code" :value="client.id" :size="300" level="H"></qrcode-vue>
          <div class="flex  flex-row justify-between ">
            <button class="w-full bg-gray-200 text-gray-700 px-4 py-2 m-2 rounded-lg shadow-md transition duration-300"
              @click="qrCodeColis()">
              Générer CodeQR
            </button>
            <button class="w-full  bg-gray-200 text-gray-700 px-4 py-2 m-2 rounded-lg shadow-md transition duration-300"
              @click=afficherPDF(client)>
              Aperçu Bordereau
            </button>

          </div>

          <button
            class="w-full bg-green-500 outline-2 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition duration-300 flex items-center justify-center"
            @click="sendSMS(client)" :disabled="isLoading">
            <template v-if="isLoading">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </template>
            <template v-else>
              Envoyer le Bordereau
            </template>
          </button>

        </div>

        <div class="flex justify-between mt-6">
          <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 mb-12"
            onclick="update.showModal()">
            Modifier
          </button>
          <a @click="deleteCustomer(client.id)">
            <button class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
              onclick="my_delete_modal.showModal()">
              Supprimer
            </button>

          </a>
          <a @click="$router.back()">
            <button @click="$router.back()"
              class="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow-md hover:bg-gray-300 transition duration-300">
              Retour
            </button>
          </a>
        </div>
      </div>

      <!-- Mise en place du Qr Code 2  -->
      <dialog id="qrCode" class="modal">
        <div class="modal-box bg-white">
          <div class="qrcode-container">
            <h3 class="font-bold text-lg text-black">
              QrCode de {{ client.expediteur }}
            </h3>
            <p class="py-4"></p>
          </div>

          <div class="modal-action">
            <form method="dialog">
              <!-- if there is a button in form, it will close the modal -->
              <button class="btn mx-4" @click="downloadQRCode">
                Télécharger
              </button>
              <button class="btn">Fermer</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  </div>

  <!-- Mise en place de l alerte de suppression client  -->
  <dialog id="my_delete_modal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Suppression éffectué</h3>
      <p class="py-4">Le client {{ client.expediteur }} à été supprimé</p>
      <div class="modal-action">
        <form method="dialog">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn">Fermer</button>
        </form>
      </div>
    </div>
  </dialog>

  <!-- Mise en place des modifications de données du client -->
  <dialog id="update" class="modal">
    <div class="modal-box bg-white text-black">
      <h3 class="font-bold text-lg">
        Modifier {{ clientSource?.expediteur ? clientSource.expediteur : "" }}
      </h3>
      <form class="space-y-6" @submit.prevent="updateCustomer">
        <div class="date mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div class="sm:col-span-3"></div>
        </div>

        <div>
          <label for="expediteur" class="block text-sm font-medium leading-6 text-gray-900">
            Expéditeur
          </label>
          <div class="mt-2">
            <input id="expediteur" name="expediteur" v-model="customer.expediteur"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-4"
              :placeholder="client.expediteur" />
          </div>
        </div>

        <div class="telephoneExpediteur">
          <label for="telephoneExpediteur" class="block text-sm font-medium leading-6 text-gray-900">
            Telephone Expediteur
          </label>
          <div class="mt-2">
            <input type="tel" id="telephoneExpediteur" name="telephoneExpediteur" v-model="customer.telephoneExpediteur"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-4"
              :placeholder="client.telephoneExpediteur" />
          </div>
        </div>

        <div>
          <label for="destinataire" class="block text-sm font-medium leading-6 text-gray-900">
            Destinataire
          </label>
          <div class="mt-2">
            <input id="destinataire" name="destinataire" v-model="customer.destinataire"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-4"
              :placeholder="client.destinataire" />
          </div>
        </div>

        <div class="telephoneDestinataire">
          <label for="telephoneDestinataire" class="block text-sm font-medium leading-6 text-gray-900">
            Telephone Destinataire
          </label>
          <div class="mt-2">
            <input type="tel" id="telephoneDestinataire" name="telephoneDestinataire"
              v-model="customer.telephoneDestinataire"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-4"
              :placeholder="client.telephoneDestinataire" />
          </div>
        </div>

        <div class="typeDeFret">
          <label for="typeDeFret" class="block text-sm font-medium leading-6 text-gray-900">
            Type de Fret
          </label>
          <div class="mt-2">
            <select id="typeDeFret" name="typeDeFret" v-model="customer.typeDeFret" autocomplete="typeDeFret"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
              :placeholder="client.typeDeFret">
              <option>Maritime</option>
              <option>Aérien</option>
            </select>
          </div>
        </div>

        <div class="destination">
          <label for="destination" class="block text-sm font-medium leading-6 text-gray-900">
            Destination
          </label>
          <div class="mt-2">
            <select id="destination" name="destination" v-model="customer.destination" autocomplete="destination"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
              :placeholder="client.destination">
              <option>TOGO</option>
              <option>BENIN</option>
              <option>SENEGAL</option>
              <option>ABIDJAN</option>
              <option>CONGO</option>
            </select>
          </div>
        </div>

        <div class="nombreDeColis">
          <label for="nombreDeColis" class="block text-sm font-medium leading-6 text-gray-900">
            Nombre de Colis
          </label>
          <div class="mt-2">
            <input type="text" id="nombreDeColis" name="nombreDeColis" v-model="customer.nombreDeColis"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-4"
              :placeholder="client.nombreDeColis" />
          </div>
        </div>



        <div></div>

        <div class="personneEnCharge">
          <label for="personneEnCharge" class="block text-sm font-medium leading-6 text-gray-900">
            Personne en charge de l'enlèvement
          </label>
          <div class="mt-2">
            <select id="personneEnCharge" name="personneEnCharge" v-model="customer.personneEnCharge"
              autocomplete="personneEnCharge"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
              :placeholder="client.personneEnCharge">
              <option>Adèle</option>
              <option>Ibrahim</option>
              <option>Mathieu</option>
              <option>Autres</option>
            </select>
          </div>
        </div>

        <div class="statut">
          <label for="statut" class="block text-sm font-medium leading-6 text-gray-900">
            Paiement Statut
          </label>
          <div class="mt-2">
            <select id="statut" name="statut" v-model="customer.statut" autocomplete="statut"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
              :placeholder="client.statut">
              <option>Non Payé</option>
              <option>Reste à payer</option>
              <option>Payé</option>
            </select>
          </div>
        </div>

        <div class="prix">
          <label for="prix" class="block text-sm font-medium leading-6 text-gray-900">
            Prix
          </label>
          <div class="mt-2">
            <input type="text" id="prix" name="prix" v-model="customer.prix"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-4"
              :placeholder="client.prix" />
          </div>
        </div>
        <div class="modeDePaiement">
          <label for="modeDePaiement" class="block text-sm font-medium leading-6 text-gray-900">
            Mode de Paiement
          </label>
          <div class="mt-2">
            <select id="modeDePaiement" name="modeDePaiement" v-model="customer.modeDePaiement"
              autocomplete="modeDePaiement"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
              :placeholder="client.modeDePaiement">
              <option>Chèque</option>
              <option>Espèces</option>
              <option>CB</option>
            </select>
          </div>
        </div>

        <div class="resteAPayer">
          <label for="prix" class="block text-sm font-medium leading-6 text-gray-900">
            Reste à Payer
          </label>
          <div class="mt-2">
            <input v-model="customer.resteAPayer" type="text" id="resteAPayer" name="resteAPayer"
              class="block h-[3em] w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-4"
              :placeholder="client.resteAPayer" />
          </div>
        </div>

        <div>
          <button type="submit"
            class="flex h-[3em] w-full justify-center rounded-md bg-primary px-3 py-1.5 mb-[2em] text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Modifier
          </button>
        </div>
      </form>
      <div class="modal-action">
        <form method="dialog">
          <button class="btn btn-error text-white">Fermer</button>
        </form>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
@media (max-width: 720px) {
  .main {
    display: flex;
    flex-direction: column;
  }

  .up {
    width: 100%;
  }

  .down {
    width: 80%;
    align-self: center;
  }
}

.bn632-hover {
  width: 160px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  margin-bottom: 50px;
  margin-top: 20px;
  height: 55px;
  text-align: center;
  border: none;
  background-size: 300% 100%;
  border-radius: 50px;
  -moz-transition: all 0.4s ease-in-out;
  -o-transition: all 0.4s ease-in-out;
  -webkit-transition: all 0.4s ease-in-out;
  transition: all 0.4s ease-in-out;
}

.bn632-hover:hover {
  background-position: 100% 0;
  -moz-transition: all 0.4s ease-in-out;
  -o-transition: all 0.4s ease-in-out;
  -webkit-transition: all 0.4s ease-in-out;
  transition: all 0.4s ease-in-out;
}

.bn632-hover:focus {
  outline: none;
}

.bn632-hover.bn28 {
  background-image: linear-gradient(to right,
      #eb3941,
      #f15e64,
      #e14e53,
      #e2373f);
  box-shadow: 0 5px 15px rgba(242, 97, 103, 0.4);
}
</style>
