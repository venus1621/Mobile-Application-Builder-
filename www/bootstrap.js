import { Capacitor } from 'https://esm.sh/@capacitor/core@8'
import { PushNotifications } from 'https://esm.sh/@capacitor/push-notifications@8'

const PWA_URL     = 'https://app.bahirandelivery.com/pwa/user'
const OFFLINE_URL = '/offline.html'

// ── Splash progress helper (safe to call even if splash is gone) ──
function progress(pct, label) {
  window.__splashProgress?.(pct, label)
}

// ── Check real connectivity (not just navigator.onLine which lies) ──
async function isOnline() {
  // navigator.onLine = false means definitely offline
  if (!navigator.onLine) return false

  // Try a lightweight HEAD request to your own server
  try {
    const res = await fetch('https://app.bahirandelivery.com/api/config/fees', {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

async function getFcmToken() {
  try {
    progress(20, 'Requesting permission…')
    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return null

    if (Capacitor.getPlatform() === 'android') {
      progress(40, 'Setting up notifications…')
      await PushNotifications.createChannel({
        id: 'orders',
        name: 'Order Updates',
        description: 'Notifications for order status changes',
        importance: 5,
        sound: 'default',
        vibration: true,
        visibility: 1,
      })
    }

    progress(60, 'Registering device…')
    const tokenPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 8000)
      const done = (value) => {
        clearTimeout(timeout)
        resolve(value)
      }
      PushNotifications.addListener('registration', (t) => done(t.value))
      PushNotifications.addListener('registrationError', () => done(null))
    })

    await PushNotifications.register()
    const token = await tokenPromise
    progress(85, 'Almost ready…')
    return token
  } catch {
    return null
  }
}

async function bootstrap() {
  progress(10, 'Initializing…')

  // ── Connectivity check first ──
  progress(15, 'Checking connection…')
  const online = await isOnline()

  if (!online) {
    // Show offline screen — keep it local so it works without network
    window.__splashDone?.()
    setTimeout(() => {
      window.location.replace(OFFLINE_URL)
    }, 300)
    return
  }

  let token = null

  if (Capacitor.isNativePlatform()) {
    token = await getFcmToken()
  } else {
    progress(85, 'Almost ready…')
  }

  progress(95, 'Launching…')

  const url = new URL(PWA_URL)
  if (token) url.searchParams.set('fcmToken', token)
  url.searchParams.set('platform', Capacitor.getPlatform())

  window.__splashDone?.()
  setTimeout(() => {
    window.location.replace(url.toString())
  }, 350)
}

bootstrap()