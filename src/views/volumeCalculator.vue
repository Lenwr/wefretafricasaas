<template>
    <div class="px-4 pt-8 pb-[8em] min-h-screen  sm:p-10 max-w-5xl mx-auto bg-white rounded-xl shadow space-y-6 text-black">
      <h2 class="text-3xl font-bold text-gray-800">🧾 Création de Devis</h2>
  
      <div class="grid md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">👤 Nom du client</label>
          <input
            v-model="clientName"
            type="text"
            placeholder="Nom complet"
            class="border p-2 rounded-md w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">📅 Date</label>
          <input
            v-model="quoteDate"
            type="date"
            class="border p-2 rounded-md w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">💰 Prix par m³ (€)</label>
          <input
            v-model.number="pricePerM3"
            type="number"
            placeholder="Ex : 150"
            class="border p-2 rounded-md w-full"
          />
        </div>
      </div>
  
      <div class="space-y-4">
        <div
          v-for="(line, index) in lines"
          :key="index"
          class="bg-gray-50 rounded-lg shadow p-4 grid sm:grid-cols-6 grid-cols-2 gap-4 items-center relative"
        >
          <div>
            <label class="block text-sm font-medium">Qte</label>
            <input v-model.number="line.qte" type="number" class="w-full border p-2 rounded-md" />
          </div>
          <div>
            <label class="block text-sm font-medium">L (cm)</label>
            <input v-model.number="line.length" type="number" class="w-full border p-2 rounded-md" />
          </div>
          <div>
            <label class="block text-sm font-medium">l (cm)</label>
            <input v-model.number="line.width" type="number" class="w-full border p-2 rounded-md" />
          </div>
          <div>
            <label class="block text-sm font-medium">H (cm)</label>
            <input v-model.number="line.height" type="number" class="w-full border p-2 rounded-md" />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium">📦 Volume (m³)</label>
            <p class="mt-1 text-gray-800 font-semibold">{{ calcLineVolume(line).toFixed(3) }}</p>
          </div>
          <button
            @click="removeLine(index)"
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
          >
            ✖
          </button>
        </div>
      </div>
  
      <button
        @click="addLine"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition"
      >
        ➕ Ajouter une ligne
      </button>
  
      <div class="bg-gray-100 p-4 rounded-lg shadow-inner mt-6 space-y-2">
        <p class="text-lg text-gray-700">
          🧮 Volume total :
          <span class="font-bold text-blue-700">{{ totalVolume.toFixed(3) }} m³</span>
        </p>
        <p class="text-lg text-gray-700">
          💵 Prix total :
          <span class="font-bold text-green-600">{{ totalPrice.toFixed(2) }} €</span>
        </p>
      </div>
  
      <div class="pt-4 hidden">
        <label class="block text-sm font-semibold text-gray-700 mb-1">✍ Signature</label>
        <textarea
          v-model="signature"
          rows="3"
          placeholder="Nom, fonction ou note finale..."
          class="w-full border p-2 rounded-md"
        ></textarea>
      </div>
  
      <div class=" hidden justify-end gap-4">
        <button
          @click="generatePDF"
          class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition"
        >
          📄 Exporter en PDF
        </button>
      </div>
    </div>
    
  </template>
  
  <script setup>
  import { reactive, computed, ref } from 'vue'
  import jsPDF from 'jspdf'
  
  const lines = reactive([{ qte: 1, length: 0, width: 0, height: 0 }])
  const pricePerM3 = ref(0)
  const clientName = ref('')
  const quoteDate = ref(new Date().toISOString().substring(0, 10))
  const signature = ref('')
  
  // 🔢 Génère un numéro unique de devis
  function generateQuoteNumber() {
    const now = new Date()
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `DEV-${datePart}-${rand}`
  }
  
  function addLine() {
    lines.push({ qte: 1, length: 0, width: 0, height: 0 })
  }
  
  function removeLine(index) {
    lines.splice(index, 1)
  }
  
  function calcLineVolume(line) {
    const l = line.length / 100
    const w = line.width / 100
    const h = line.height / 100
    return line.qte * l * w * h
  }
  
  const totalVolume = computed(() =>
    lines.reduce((sum, line) => sum + calcLineVolume(line), 0)
  )
  
  const totalPrice = computed(() =>
    totalVolume.value * pricePerM3.value
  )
  


  function generatePDF() {
  const doc = new jsPDF()
  const quoteNumber = generateQuoteNumber()
  let y = 10

  // Clone des valeurs pour éviter les problèmes de réactivité
  const client = clientName.value
  const date = quoteDate.value
  const price = pricePerM3.value.toFixed(2)
  const totalVol = totalVolume.value.toFixed(3)
  const total = totalPrice.value.toFixed(2)
  const sign = signature.value
  const lineItems = [...lines]

  const logoPath = '/images/logo.png'
  const img = new Image()
  img.src = logoPath
  img.onload = () => {
    doc.addImage(img, 'PNG', 10, y, 30, 30)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('AARON TRAVEL', 45, y + 5)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('15 Rue des écoles 95500, Le Thillay', 45, y + 11)
    doc.text('Téléphone : 06 03 67 50 62', 45, y + 16)
    doc.text('Mail : aarontravel@outlook.fr', 45, y + 21)

    y += 35

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('DEVIS CLIENT', 105, y, { align: 'center' })

    y += 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`N° : ${quoteNumber}`, 10, y)
    doc.text(`Date : ${date}`, 150, y)
    y += 10
    doc.text(`Client : ${client || '-'}`, 10, y)
    y += 10
    doc.text(`Prix par m³ : ${price} €`, 10, y)
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.text('Détails des articles :', 10, y)
    y += 7
    doc.setFont('helvetica', 'normal')

    lineItems.forEach((line, i) => {
      const vol = calcLineVolume(line).toFixed(3)
      doc.text(
        `Article ${i + 1} : Qte ${line.qte} — ${line.length}x${line.width}x${line.height} cm = ${vol} m³`,
        10,
        y
      )
      y += 7
    })

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`Volume total : ${totalVol} m³`, 10, y)
    y += 7
    doc.text(`Prix total : ${total} €`, 10, y)
    y += 10

    if (sign) {
      doc.setFont('helvetica', 'normal')
      doc.text('Signature :', 10, y)
      y += 7
      doc.text(sign, 10, y)
    }

    doc.save(`${quoteNumber}.pdf`)
  }
}

  </script>
  