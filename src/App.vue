<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/useAuthStore'
import { onMounted , ref } from 'vue'

const router = useRouter()
const store = useAuthStore()

onMounted(async () => {
  const user = store.getCurrentUser()
  if (user) {
    await store.fetchEntreprise(user.uid)
  }
})

const isReady = ref(false)

onMounted(async () => {
  await store.init()
  isReady.value = true
})

const logOut = async () => {
  await store.logout()
  router.push('/login')  // redirige vers login
}
</script>

<template>
  <div class="bg-white">
    <div class="drawer">
      <input id="my-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content">
        <div class="h-screen w-screen">
          <div class="bg-white h-screen">
            <RouterView />
          </div>
        </div>
      </div>

      <div class="drawer-side mt-[3em]">
        <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu p-4 w-80 min-h-full bg-primary text-base-content">
          <!-- Sidebar content -->
          <li class="pt-4 text-white text-lg">Bienvenue chez</li>
          <li class="text-white pb-4 font-bold text-xl">
            {{ store.entreprise?.nom || "Chargement..." }}
          </li>

          <li class="text-white">
            <router-link to="/planing">Planing</router-link>
          </li>
          <li class="text-white">
            <router-link to="/calculator">Calculator</router-link>
          </li>
          <li class="text-white cursor-pointer">
  <button @click="logOut" class="w-full text-left">Se déconnecter</button>
</li>
        </ul>
      </div>
    </div>
  </div>
</template>
