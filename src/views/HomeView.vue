<script setup>
import { Home, Package, Users, Truck, Settings } from 'lucide-vue-next'
</script>

<template>
  <div class="flex min-h-screen bg-gradient-to-br from-white to-gray-100 text-gray-800">

    <!-- MAIN CONTENT -->
    <main class="flex-1 p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <!-- CARD 1 : Nouvel enlèvement -->
        <div class="card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex items-center gap-4 mb-4">
            <Package class="text-primary w-6 h-6" />
            <h3 class="font-semibold text-lg">Nouveau enlèvement</h3>
          </div>
          <p class="text-sm text-gray-500">Créer un nouvel enlèvement</p>
          <router-link to="/form" class="btn btn-outline mt-4">Créer</router-link>
        </div>

        <!-- CARD 2 : Mes clients -->
        <div class="card bg-white p-6 rounded-xl shadow-sm hover:shadow-md">
          <div class="flex items-center gap-4 mb-4">
            <Users class="text-primary w-6 h-6" />
            <h3 class="font-semibold text-lg">Mes clients</h3>
          </div>
          <p class="text-sm text-gray-500">Voir, modifier ou ajouter vos clients</p>
          <router-link to="/customers" class="btn btn-outline mt-4">Accéder</router-link>
        </div>

        <!-- CARD 3 : Mes enlevements -->
        <div class="card bg-white p-6 rounded-xl shadow-sm hover:shadow-md">
          <div class="flex items-center gap-4 mb-4">
            <Truck class="text-primary w-6 h-6" />
            <h3 class="font-semibold text-lg">Mes enlèvements</h3>
          </div>
          <p class="text-sm text-gray-500">Liste de tous les enlèvements effectués</p>
          <router-link to="/liste" class="btn btn-outline mt-4">Consulter</router-link>
        </div>

        <!-- CARD 5 : Conteneur -->
        <div class="card bg-white p-6 rounded-xl  shadow-sm hover:shadow-md">
          <div class="flex items-center gap-4 mb-4">
            <Truck class="text-primary w-6 h-6" />
            <h3 class="font-semibold text-lg">Conteneur</h3>
          </div>
          <p class="text-sm text-gray-500">Gestion des colis dans les conteneurs</p>
          <router-link to="/recording" class="btn btn-outline mt-4">Gérer</router-link>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
/* Pour effet hover fluide et arrondi pro */
.card {
  transition: all 0.3s ease;
}
</style>
