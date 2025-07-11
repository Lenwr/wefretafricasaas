/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      screens: {
        'mobile': {'max': '639px'},     // Écran extra-petit
        'tablette': {'min': '640px', 'max': '767px'},  // Écran petit
        'desktop': {'min': '768px', 'max': '1279px'}, // Écran moyen
        'xl': {'min': '1280px'},        // Écran extra-large
      },
    },
  },

  plugins: [
    require("daisyui"),
  ],

  daisyui: {
    themes: [
      {
        senafreight: {
          "primary": "#0077B6",    // Bleu océan
          "secondary": "#F4A900",  // Jaune sable
          "accent": "#007F5F",     // Vert baobab
          "neutral": "#333333",    // Gris acier
          "base-100": "#FFFFFF",   // Blanc pur

          "info": "#3ABFF8",       // Bleu clair pour infos
          "success": "#23C552",    // Vert réussite
          "warning": "#FFC107",    // Jaune alerte
          "error": "#DC3545",      // Rouge erreur
        },
      },
    ],
  },
}
