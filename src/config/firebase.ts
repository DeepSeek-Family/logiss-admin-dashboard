import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

export const firebaseConfig = {
  apiKey: 'AIzaSyCb13U7XvM-BjdB3Z6xA29pR9PKY5PLCkw',
  authDomain: 'logiss-83e40.firebaseapp.com',
  projectId: 'logiss-83e40',
  storageBucket: 'logiss-83e40.firebasestorage.app',
  messagingSenderId: '636904621127',
  appId: '1:636904621127:web:322aa52bf84844597bdd62',
  measurementId: 'G-B1XY8HHCTN',
}

export const VAPID_KEY =
  'BAJmEOc3SplO_0ZUV3eMAcWhD6H66ADu77XCAi3JAXDSse7aCOH3u_J10RLulryiARJegzv6IKBVMXC-pU87PRA'

export const DEFAULT_FCM_TOKEN =
  'ffA9WFvHQ3KKxcyidNXfhc:APA91bGaebreHJXfjzfDqsoguiTGzfuf63KADszqOHpbrvlS2Q0ybBsipqayF6ytcAJmFQ2PrQUwlmDVp3SElZQywU30P7GY7LC6c4DPHp5S8DAWXEjFbRk'

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
