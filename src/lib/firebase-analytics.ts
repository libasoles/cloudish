import { getAnalytics } from 'firebase/analytics'
import { firebaseApp } from './firebase-app'

export const analytics = getAnalytics(firebaseApp)
