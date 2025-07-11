import { createRouter, createWebHashHistory } from "vue-router";
import { getAuth } from "firebase/auth";
import { toast } from "vue3-toastify";
import { useAuthStore } from "../stores/useAuthStore.js";

// Layouts
import DashboardLayout from "../layout/DashboardLayout.vue";

// Pages
import HomeView from "../views/HomeView.vue";
import LoginFormView from "../views/authentication/loginFormView.vue";
import Form from "../views/liste/form.vue";
import ListeView from "../views/liste/listeView.vue";
import ListeDetailsView from "../views/liste/listeDetailsView.vue";
import QrCodeView from "../views/planingCalendarView.vue";
import SoumissionFormulaire from "../views/authentication/soumissionFormulaire.vue";
import Scan from "../views/scan.vue";
import PlaningCalendarView from "../views/planingCalendarView.vue";
import CustomersView from "../views/customers/customersView.vue";
import CustomersFormView from "../views/customers/customersFormView.vue";
import CustomersDetailsView from "../views/customers/customersDetailsView.vue";
import SelectCustomersView from "../views/customers/selectCustomersView.vue";
import LoadingPackagesRecording from "../views/chargements/loadingPackagesRecording.vue";
import ChargementsDetails from "../views/chargements/chargementsDetails.vue";
import GeneratorBarCode from "../components/GeneratorBarCode.vue";
import SignaturePad from "../views/signaturePad.vue";
import VolumeCalculator from "../views/volumeCalculator.vue";
import Parametres from "../views/parametres.vue";

const router = createRouter({
  history: createWebHashHistory(),
  linkActiveClass: "classActive",
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginFormView,
    },
    {
      path: "/",
      meta: { authNeeded: true },
      component: DashboardLayout,
      children: [
        { path: "", name: "home", component: HomeView },
        { path: "form", component: Form },
        { path: "liste", component: ListeView, meta: { authNeeded: true } },
        {
          path: "liste/:id",
          component: ListeDetailsView,
          meta: { authNeeded: true },
        },
        { path: "qrcode", component: QrCodeView, meta: { authNeeded: true } },
        {
          path: "soumission",
          component: SoumissionFormulaire,
          meta: { authNeeded: true },
        },
        { path: "scan", component: Scan, meta: { authNeeded: true } },
        {
          path: "planing",
          component: PlaningCalendarView,
          meta: { authNeeded: true },
        },
        { path: "customers", component: CustomersView },
        { path: "customersForm", component: CustomersFormView },
        { path: "customersDetails/:id", component: CustomersDetailsView },
        {
          path: "selectForm",
          component: SelectCustomersView,
          meta: { authNeeded: true },
        },
        {
          path: "recording",
          component: LoadingPackagesRecording,
          meta: { authNeeded: true },
        },
        {
          path: "chargementsDetails/:id",
          component: ChargementsDetails,
          meta: { authNeeded: true },
        },
        {
          path: "BarCode",
          component: GeneratorBarCode,
          meta: { authNeeded: true },
        },
        {
          path: "settings",
          component: Parametres,
          meta: { authNeeded: true },
        },
        {
          path: "sign/:id",
          component: SignaturePad,
          meta: { authNeeded: true },
        },
        {
          path: "calculator",
          component: VolumeCalculator,
          meta: { authNeeded: true },
        },
      ],
    },
  ],
});

function waitForAuthInit() {
  return new Promise((resolve) => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}


// ✅ Auth Guard

router.beforeEach(async (to, from, next) => {
  const store = useAuthStore()
  if (!store.isLoading) {
    // Si pas déjà loading, init store (à faire si tu veux)
    await store.init()
  } else {
    // attends la fin de l'init si en cours
    while (store.isLoading) {
      await new Promise(r => setTimeout(r, 100))
    }
  }

  const user = getAuth().currentUser

  if (to.meta.authNeeded && !user) {
    toast("Vous n'avez pas accès à cette page", {
      theme: "auto",
      type: "warning",
      autoClose: 1000,
    })
    return next("/login")
  }

  if (to.meta.authNeeded && !store.entreprise) {
    await store.fetchEntreprise(user.uid)
  }

  next()
})
export default router
