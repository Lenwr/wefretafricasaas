<script setup>

import { format } from "date-fns";
import frLocale from "date-fns/locale/fr";

defineProps({
  image: {
    type: [String, Array],
    default: ''
  },
  date: String,
  nbreColis: {
    type: [String, Number], // ✅ accepte les deux types
    default: 0
  },
  statut: String,
  expediteur: String,
  destinateur: String,
  destination: String
})


</script>
<template>
  <div
    class="flex h-[166px]   hover:shadow-md shadow-md transition duration-1000 hover:shadow-primary text-black m-1  rounded  flex-col bg-no-repeat bg-contain bg-right bg-[url('https://www.svgrepo.com/show/469769/shipping-box-left.svg')] ">
    <div class="up bg-white h-[50%] rounded-t p-2 flex flex-row justify-between opacity-95">
      <div class="flex flex-row ">
        <img class="w-[4em] rounded-full object-cover " :src="image" alt="">
        <div class="flex flex-col px-1">
          <p class="text-xs">{{ date }}</p>
          <p>{{ nbreColis }} Colis </p>
        </div>
      </div>
      <div>
        <p class="p-2 rounded-lg text-white text-xs" :class="{
          'bg-error p-2  text-white text-xs': statut === 'Non Payé',
          ' bg-orange-400 p-2  text-white text-xs': statut === 'Reste à payer',
          ' bg-green-500 p-2  text-white text-xs': statut === 'Payé',
        }">{{ statut ? statut : "Non dispo" }}</p>
      </div>

    </div>
    <div class="down bg-white h-[50%] rounded-b flex flex-row justify-around py-4 opacity-90">
      <div class="flex flex-col w-[30%] ">
        <p class="text-xs text-center"> de : France </p>
        <p class="text-center text-sm"> {{ expediteur ? expediteur : "Non dispo" }}</p>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
        class="size-6 w-6 text-black ">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
      </svg>
      <div class="flex flex-col w-[30%] ">
        <p class="text-xs text-center">vers : {{ destination ? destination : "Togo" }} </p>
        <p class="text-center text-sm"> {{ destinateur ? destinateur : "Non dispo" }}</p>
      </div>
    </div>
  </div>

</template>

<style scoped></style>
