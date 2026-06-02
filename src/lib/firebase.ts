import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAt7-SXfHqrGU6PjBVMOLa55PP92iX68t8',
  authDomain: 'cloudish-feb6a.firebaseapp.com',
  projectId: 'cloudish-feb6a',
  storageBucket: 'cloudish-feb6a.firebasestorage.app',
  messagingSenderId: '830207728208',
  appId: '1:830207728208:web:c010c0227a04b32b71cf55',
  measurementId: 'G-XG3SLM1YD8',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
