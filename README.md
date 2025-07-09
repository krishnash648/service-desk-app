# Service Desk App ⚡️

![GitHub repo size](https://img.shields.io/github/repo-size/krishnash648/service-desk-app)
![GitHub contributors](https://img.shields.io/github/contributors/krishnash648/service-desk-app)
![GitHub stars](https://img.shields.io/github/stars/krishnash648/service-desk-app?style=social)
![GitHub issues](https://img.shields.io/github/issues/krishnash648/service-desk-app)

Welcome to **Service Desk App**, a ✨ _modern React ticketing & support platform_ ✨ for seamless support, notifications, analytics, and productivity.

> _"Built with a lot of ☕, late nights, and a sprinkle of frontend magic. If you spot a bug, just imagine it's a feature!_ 😄"

Crafted by **Krishna Sharma**, this app empowers teams and users to manage support tickets, communicate, and analyze productivity in real time.

---

## 🌐 Live Demo

👉 [**See Service Desk App in action**](https://service-desk-app-vegu.vercel.app/login)

---

## ✨ Features

- 🔐 **User Registration & Login** — Secure sign-up/login, admin code for admin access
- 👤 **Role-Based Dashboards** — Separate dashboards for users and admins
    - **User Dashboard:** Create/view tickets, make payments for priority support, see personal analytics
    - **Admin Dashboard:** View all tickets, assign/change status, analytics, manage tickets (no payment features)
- 📝 **Ticket Management** — Create, search, filter, sort, and export tickets (CSV/PDF)
- 💬 **Ticket Comments & History** — Collaborate and track ticket progress
- 🔔 **In-App & Push Notifications** — Real-time updates and alerts
- 📊 **Analytics** — Bar and pie charts for ticket stats (user & admin views)
- 💸 **Razorpay Payment** — Pay for priority support tickets (users only)
- ⚡ **Responsive, Modern UI** — Glassmorphism, animated backgrounds, and mobile-friendly
- 📱 **PWA Support** — Offline access, installable on devices
- 🛡️ **Secure & Fast** — Firebase Auth, Firestore, and best practices

---

## 🖼️ Screenshots

<p align="center">
  <img src="/loginpage.jpeg" alt="Login Page" width="600" />
  <br/><b>Login Page</b>
</p>

<p align="center">
  <img src="/register.jpeg" alt="Register Page" width="600" />
  <br/><b>Register Page</b>
</p>

<p align="center">
  <img src="/UserDashboard.jpeg" alt="User Dashboard" width="600" />
  <br/><b>User Dashboard</b>
</p>

<p align="center">
  <img src="/AdmminDashboard.jpeg" alt="Admin Dashboard" width="600" />
  <br/><b>Admin Dashboard</b>
</p>

---

## 🛠️ Built With

- ⚛️ [React](https://reactjs.org/)
- 🔥 [Firebase (Auth, Firestore, Storage)](https://firebase.google.com/)
- 🛣️ [React Router](https://reactrouter.com/)
- 📊 [Recharts](https://recharts.org/)
- 💸 [Razorpay](https://razorpay.com/)
- 📦 [jsPDF + autoTable](https://github.com/parallax/jsPDF)

---

## 💻 Getting Started

Want to run Service Desk App locally? Here's how (and if you get stuck, just shout!):

```bash
# 1️⃣ Clone the repo
git clone https://github.com/krishnash648/service-desk-app.git

# 2️⃣ Enter the project directory
cd service-desk-app

# 3️⃣ Install dependencies
npm install

# 4️⃣ Start the dev server
npm start
```

Open your browser at [http://localhost:3000](http://localhost:3000) to see it live.

---

## 🔑 Environment Setup

Create a `.env` file in the root with your Firebase and Razorpay keys:

```
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_RAZORPAY_KEY=your_razorpay_key
```

> _Psst! If you need help with Firebase setup, just ping me. I’ve broken my app more times than I can count._ 😅

---

## 🚀 Deployment

To deploy your own live demo on **Vercel**:
1. Go to [vercel.com](https://vercel.com/)
2. Import your GitHub repository
3. Set up environment variables as above
4. Deploy with one click!

> _Pro tip: If something breaks, try turning it off and on again. Works 90% of the time!_

---

## 🧪 Testing

To run tests (if available):

```bash
npm test
```

---

## 🤝 Contributing

Pull requests are welcome! Fork, branch, code, and PR. Please keep code clean and readable.

> _If you add a cool feature, I’ll buy you a coffee (virtually, at least)!_

---

## 📬 Contact Me

Wanna vibe, collab, or just talk code? Hit me up 👇

- 📧 Email: sharmakrishna1605@gmail.com  
- 🐙 GitHub: [krishnash648](https://github.com/krishnash648)
- 🐦 Twitter: [@ipriyaaa](https://twitter.com/ipriyaaa)
- 📸 Instagram: [@priyxhaa](https://instagram.com/priyxhaa)

Built with ☕, 💻, and pure frontend wizardry by Krishna Sharma.

---

## 📝 License

MIT
