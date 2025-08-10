<script setup>
import { Home, Package, Users, Truck, Settings } from 'lucide-vue-next'
import { useAuthStore } from '../stores/useAuthStore'
const store = useAuthStore()




const navLinks = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Clients' },
  { to: '/liste', icon: Package, label: 'Colis' },
  { to: '/recording', icon: Truck, label: 'Expédition' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
]
</script>

<template>
  <div class="flex flex-col min-h-screen  bg-gray-50 text-gray-800">

    <!-- Navbar (top) -->
    <div class=" py-2  flex flex-row bg-primary w-screen fixed justify-around  text-white z-50">
      <div class="">

        <div class="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shadow">
          <img src="https://i.ebayimg.com/images/g/kDsAAOSwbxZjjrwD/s-l1200.jpg" alt="Logo entreprise" class="object-cover w-full h-full" />
        </div>
      
      </div>

      <div class="">
       
        </div>


      <div class="   ">
        <div class="dropdown">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <ul tabindex="0"
            class="menu menu-sm dropdown-content text-primary mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><router-link to="/customersForm">Enregistrer un client</router-link></li>
            <li><router-link to="/form">Enregistrer un colis</router-link></li>
            <li><router-link to="/customers">Mes clients</router-link></li>
            <li><router-link to="/liste">Mes colis</router-link></li>
          </ul>
        </div>
      </div>


    </div>
    <!-- Nav mobile scrollable en haut -->
    <nav class="md:hidden mt-[4em] bg-white shadow-inner border-b px-4 py-3 overflow-x-auto whitespace-nowrap z-40 flex gap-2">
      <router-link v-for="link in navLinks" :key="link.to" :to="link.to" v-slot="{ isActive }"
        class="inline-block px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap" :class="isActive
          ? 'bg-primary text-white'
          : 'bg-gray-200 text-gray-800 hover:bg-primary hover:text-white'">
        {{ link.label }}
      </router-link>
    </nav>

    <!-- Layout body -->
    <div class="flex flex-col md:flex-row mt-[4em] bg-white flex-1">

      <!-- Sidebar desktop -->
      <aside class="hidden bg-blue-100 md:flex w-20 md:w-60 pt-[5em]   flex-col items-center py-6 space-y-10">
        <nav class="space-y-8 text-sm font-medium w-full px-4">
          <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
            class="flex items-center gap-3 hover:text-primary">
            <component :is="link.icon" class="w-5 h-5" />
            <span class="hidden md:inline">{{ link.label }}</span>
          </router-link>
        </nav>
      </aside>

      <!-- Page content -->
      <main class="flex-1 mb-[5em]  h-screen overflow-y-auto">
        <router-view />
      </main>
    </div>



    <!-- Footer (mobile bottom navigation) -->
    <div class="btm-nav  bg-primary text-white">
      <router-link to="/">
        <button class="text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </router-link>

      <router-link to="/scan">
        <button class="text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </button>
      </router-link>

      <label for="my-drawer" class="text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        </svg>
      </label>
    </div>
  </div>
</template>
