<script setup>

</script>

<template>
  <div class="navbar bg-primary">
    <div class="navbar-start">
      <div class="dropdown text-white">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
         
        </div>
        <ul tabindex="0" class="menu menu-sm dropdown-content text-primary mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
          <li><router-link to="/customersForm">Enregistrer un client</router-link></li>
          <li><router-link to="/form">Enregistrer un colis</router-link></li>
          <li><router-link to="/customers">Mes clients</router-link></li>
          <li><router-link to="/liste">Mes colis</router-link></li>
        </ul>
      </div>
    </div>
    <div class="navbar-end">
    <!-- <button class="btn btn-ghost btn-circle">
        <div class="indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span class="badge badge-xs badge-primary indicator-item"></span>
        </div>
      </button> -->
  </div>
  </div>
 
</template>

<style scoped></style>
