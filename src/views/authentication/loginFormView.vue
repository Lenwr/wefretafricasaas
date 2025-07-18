<script setup>
import { useAuthStore } from '../../stores/useAuthStore'
import { ref } from 'vue'
import { useRouter } from 'vue-router' 


const router = useRouter()        
const store = useAuthStore()
const showPassword = ref(false)
const mode = ref('login') // 'login' ou 'register'

const submit = async () => {
  if (mode.value === 'login') {
    await store.login()
  } else {
    await store.register()
  }
  if (!store.error) {
    // Redirection vers la home après succès login/register
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col lg:flex-row">
    <!-- 📸 Image à gauche -->
    <div class="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-8">
      <img src="https://plus.unsplash.com/premium_photo-1661962532309-07c1e2270ada?q=80&w=2876&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Fret maritime et aérien"
        class="rounded-xl shadow-xxl object-cover w-full h-[80vh] max-w-[700px]" />
    </div>

    <!-- 🔐 Formulaire à droite -->
    <div class="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {{ mode === 'login' ? 'Connexion' : "Inscription d'entreprise" }}
        </h2>
        <p class="text-center text-sm mt-2 text-gray-600">
          <button @click="mode = mode === 'login' ? 'register' : 'login'" class="text-indigo-600 hover:underline">
            {{ mode === 'login' ? "Pas encore de compte ? Inscris-toi" : "Déjà inscrit ? Connecte-toi" }}
          </button>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form @submit.prevent="submit" class="space-y-6 bg-white p-6 rounded-md shadow">
          <!-- Nom entreprise si inscription -->
          <div v-if="mode === 'register'">
            <label for="entrepriseNom" class="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
            <input v-model="store.entrepriseNom" id="entrepriseNom" type="text" required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="Ex: OkaCorp" />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input v-model="store.email" id="email" type="email" required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              placeholder="exemple@domaine.com" />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div class="relative">
              <input :type="showPassword ? 'text' : 'password'" v-model="store.password" id="password" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 pr-10" placeholder="••••••••" />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 px-3 text-sm text-indigo-600">
                {{ showPassword ? 'Cacher' : 'Afficher' }}
              </button>
            </div>
          </div>

          <!-- Erreur -->
          <div v-if="store.error" class="text-red-500 text-sm">
            {{ store.error }}
          </div>

          <!-- Submit -->
          <div>
            <button type="submit"
              class="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-500 transition">
              {{ mode === 'login' ? 'Se connecter' : "S'inscrire" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>


<style scoped>
body {
  background-color: #f9fafb;
}
</style>
