<script setup>
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import {computed, reactive, ref, watch} from "vue";
import FullCalendar from "@fullcalendar/vue3";
import {useCollection, useFirestore} from "vuefire";
import {getFirestore, collection, addDoc, doc, deleteDoc} from 'firebase/firestore';
import "vue3-toastify/dist/index.css";
import Export from "../components/export.vue";
import {toast} from "vue3-toastify";

const id = ref(10)
const db = useFirestore()
const datas = useCollection(collection(db, 'events'))
const showModal = ref(false);
let idItem = ref()
const database = getFirestore()
//send data planing to firebase

let title = ref('')
let start = ref('')
let end = ref('')
let allDay = ref('')

let newDatas = ref()
newDatas = computed(() => {
  return datas.value.map((doc) => {
    //const formattedEnd = display(doc.end);
    return {
      id: doc.id,
      title: doc.title,
      start: doc.start,
    };
  });
});


let todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today
console.log(todayStr)
let timeDisplay = todayStr + 'T12:00:00'


async function sup() {
  const DocRef = doc(database, 'events', idItem.value)
  await deleteDoc(DocRef)
      .then(() => {
        toast("Chargement supprimé", {
          "theme": "auto",
          "type": "danger",
          "autoClose": 1000,
          "dangerouslyHTMLString": true
        })
      })
}

const handleClick = (item) => {
  return new Promise((resolve, reject) => {
    resolve(item)
    idItem.value = item
  })
      .then(() => {
        const client = computed(() => {
          return newDatas.value.find((detail) => detail.id === item)
        })

        my_modal_1.showModal()
      })

}
let today = new Date();

const addLoading= async ( ) => {
  const eventCollection = collection(db, 'events');
  const data = {
    title: title.value,
    start: start.value.split("T")[0],
    allDay: true,
  };
  const newDocumentRef = await addDoc(eventCollection, data);
  title.value = ''
  start.value = ''
  toast("Chargement enrégistré", {
    "theme": "auto",
    "type": "success",
    "autoClose": 1000,
    "dangerouslyHTMLString": true
  })
}

function formattedDate(item){
  // Extraire le mois, le jour et l'année
  let month = (item.getMonth() + 1).toString().padStart(2, '0'); // Les mois sont 0-indexés, donc ajouter 1
  let day = item.getDate().toString().padStart(2, '0');
  let year = item.getFullYear();

// Construire la chaîne au format MM/JJ/AAAA
  return `${year}/${month}/${day}`;
}


const options = reactive({
  handleWindowResize : true ,
  height:(600),
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek,listDay'
  },
  editable: true,
  selectable: true,
  initialEvents: [],
  eventsSet: [],
  eventClick: (arg) => {
    const id = arg.event.id
    handleClick(id)
  },
  events: newDatas,
  currentEvents:newDatas
});

const futureEvents = computed(() => {
  return options.currentEvents.filter(event => new Date(event.start) >= new Date());
});
console.log(futureEvents.value)


</script>


<template>

  <div class="pt-8 pb-[5%] bg px-1  flex flex-col ">
    <div  class=" mobile:mx-[20%] mobile:my-[5%]">
      <button class="btn btn-accent " onclick="my_modal_3.showModal()">Ajouter un chargement</button>
    </div>
    <div class="  h-screen flex flex-row ">
      <div class='displayChargements mobile:hidden demo-app-sidebar w-[20%] flex flex-col items-center mt-[5%] '>
        <div class='demo-app-sidebar-section  text-black'>
          <h2>Tous les chargements ({{ options.currentEvents.length }})</h2>

          <ul>
            <li v-for='event in futureEvents' :key='event.id'>
             <i>
                {{ event.title}}
                </i>
            </li>
          </ul>
        </div>

      </div>

      <FullCalendar
          class='text-black
mobile:text-[0.5em] mobile:w-[100%]  w-[80%]'
          :options='options'
      >
      </FullCalendar>
    </div>
    <!-- Open the modal using ID.showModal() method -->
    <dialog id="my_modal_1" class="modal ">
      <div class="modal-box justify-center ">
        <h3 class="font-bold text-lg">Attention!</h3>
        <p class="py-4">Voulez vous supprimer ce chargement ? </p>
        <div>
        </div>
        <div class="modal-action flex justify-center ">
          <form method="dialog">
            <!-- if there is a button in form, it will close the modal -->
            <div class="flex justify-around">
              <button class="btn hover:btn-error w-[50%] mx-4" @click="sup">oui</button>
              <button class="btn hover:btn-success mx-4  w-[50%] ">Non</button>
            </div>

          </form>
        </div>
      </div>
    </dialog>
  </div>
  <!-- You can open the modal using ID.showModal() method -->
  <dialog id="my_modal_3" class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">X</button>
      </form>
      <h3 class="font-bold text-lg"></h3>
      <p class="py-2 text-white">Evenement </p>
      <form  method="dialog">
        <label for="start" class="block text-sm font-medium leading-6 text-white">Date</label>
        <div class="mt-2">
          <input  type="date" name="start" v-model="start" id="date" autocomplete="given-name"
                 class=" mb-4 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
        </div>
        <label for="start" class="block text-sm font-medium leading-6 text-white">Nom de l'évenement</label>
      <input type="text" v-model="title" placeholder="" class="input input-bordered w-[50%] max-w-xs mt-2 bg-white text-black" />
        <button class="btn btn-accent mx-3 w-[40%]" @click="addLoading" > Enregistrer </button>
      </form>
    </div>
  </dialog>


</template>

<style scoped>
.displayChargements{
  max-height: 60%; /* limiter la hauteur pour la rendre scrollable */
  overflow-y: auto;
}
</style>
