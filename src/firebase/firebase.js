// src/firebase/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyArsFKONhfdPoHXaqzJs8iJZtdEQ58C7BI",
  authDomain: "finappgo.firebaseapp.com",
  projectId: "finappgo",
  storageBucket: "finappgo.firebasestorage.app",
  messagingSenderId: "125023343172",
  appId: "1:125023343172:web:5f912949b0b65d00fbe211",
  measurementId: "G-41G7F3J6BR"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar Firestore (banco de dados)
const db = getFirestore(app)

// Inicializar Authentication (login)
const auth = getAuth(app)

export { db, auth }