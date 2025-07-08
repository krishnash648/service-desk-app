import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBijT23EcRhPauVRP-GB_lX6OsB9T2dwpg",
  authDomain: "service-desk-app-c1b06.firebaseapp.com",
  projectId: "service-desk-app-c1b06",
  storageBucket: "service-desk-app-c1b06.appspot.com",
  messagingSenderId: "624761371800",
  appId: "1:624761371800:web:a49df8fb400a39b5e424ed"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

export async function requestFirebaseNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: 'BObJQw8Qw7Qw8Qw7Qw8Qw7Qw8Qw7Qw8Qw7Qw8Qw7Qw8Qw7Qw8Qw7Qw8Qw7Qw8Qw7Qw8Qw7Qw8Qw7Qw8Qw' });
      return token;
    }
    return null;
  } catch (err) {
    return null;
  }
}

export function onFirebaseMessageListener() {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
}
