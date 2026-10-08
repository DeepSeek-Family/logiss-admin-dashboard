import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

const env = import.meta.env

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const VAPID_KEY = env.VITE_FIREBASE_VAPID_KEY || ''

export const DEFAULT_FCM_TOKEN = env.VITE_FIREBASE_DEFAULT_FCM_TOKEN || ''

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]

export const getFcmToken = async (): Promise<string> => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const messaging = getMessaging(app)
        const token = await getToken(messaging, { vapidKey: VAPID_KEY })
        if (token) return token
      }
    }
  } catch (err) {
    console.warn('FCM token generation fallback:', err)
  }
  return DEFAULT_FCM_TOKEN
}
