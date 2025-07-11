<script setup>
import { ref } from "vue"
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/components/firebaseConfig"
import { useRouter } from "vue-router"

const router = useRouter()

// 🔁 Mode login / register
const mode = ref("login") // ou "register"

const entrepriseNom = ref("")
const email = ref("")
const motDePasse = ref("")
const errMsg = ref("")

const toggleMode = () => {
  errMsg.value = ""
  mode.value = mode.value === "login" ? "register" : "login"
}

// 🔐 Connexion
const login = async () => {
  const auth = getAuth()
  try {
    await signInWithEmailAndPassword(auth, email.value, motDePasse.value)
    router.push("/")
  } catch (error) {
    handleAuthError(error)
  }
}

// 🆕 Inscription + création entreprise
const register = async () => {
  if (!entrepriseNom.value) {
    errMsg.value = "Nom de l'entreprise requis"
    return
  }

  const auth = getAuth()
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, motDePasse.value)
    const user = userCredential.user

    // 🔥 Crée entreprise dans Firestore
    const entrepriseRef = await addDoc(collection(db, "entreprises"), {
      nom: entrepriseNom.value,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    })

    // 👤 Ajoute utilisateur comme admin de l’entreprise
    await setDoc(doc(db, "entreprises", entrepriseRef.id, "utilisateurs", user.uid), {
      email: user.email,
      uid: user.uid,
      role: "admin"
    })

    router.push("/")
  } catch (error) {
    handleAuthError(error)
  }
}

const handleAuthError = (error) => {
  switch (error.code) {
    case "auth/invalid-email":
      errMsg.value = "Email invalide"
      break
    case "auth/user-not-found":
    case "auth/wrong-password":
      errMsg.value = "Email ou mot de passe incorrect"
      break
    case "auth/email-already-in-use":
      errMsg.value = "Email déjà utilisé"
      break
    case "auth/weak-password":
      errMsg.value = "Mot de passe trop faible"
      break
    default:
      errMsg.value = "Erreur : " + error.message
      break
  }
}
</script>


<template>
  <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="text-center text-2xl font-bold tracking-tight text-gray-900">
        {{ mode === 'login' ? "Connexion" : "Inscription" }}
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" @submit.prevent="mode === 'login' ? login() : register()">

        <!-- 🔄 Champs affichés seulement en inscription -->
        <div v-if="mode === 'register'">
          <label for="entreprise" class="block text-sm font-medium text-gray-900">Nom de l'entreprise</label>
          <input id="entreprise" type="text" v-model="entrepriseNom" required
            class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-900">Email</label>
          <input id="email" type="email" v-model="email" required
            class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-900">Mot de passe</label>
          <input id="password" type="password" v-model="motDePasse" required
            class="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
        </div>

        <!-- 🔥 Message erreur -->
        <div v-if="errMsg" class="text-red-500 text-sm">{{ errMsg }}</div>

        <!-- Submit -->
        <div>
          <button type="submit"
            class="w-full flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 shadow-sm">
            {{ mode === 'login' ? "Connexion" : "Créer mon compte" }}
          </button>
        </div>

        <!-- 🔁 Switch -->
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ mode === 'login' ? "Pas encore inscrit ?" : "Déjà inscrit ?" }}
          <button type="button" @click="toggleMode"
            class="font-medium text-indigo-600 hover:text-indigo-500">
            {{ mode === 'login' ? "Créer un compte" : "Se connecter" }}
          </button>
        </p>
      </form>
    </div>
  </div>
</template>



<style scoped>

</style>