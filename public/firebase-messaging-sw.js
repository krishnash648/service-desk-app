importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBijT23EcRhPauVRP-GB_lX6OsB9T2dwpg",
  authDomain: "service-desk-app-c1b06.firebaseapp.com",
  projectId: "service-desk-app-c1b06",
  storageBucket: "service-desk-app-c1b06.appspot.com",
  messagingSenderId: "624761371800",
  appId: "1:624761371800:web:a49df8fb400a39b5e424ed"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo192.png'
  });
}); 