import React from 'react';
export default function Terms() {
  return (
    <div className="card" style={{ maxWidth: 700, margin: '60px auto', textAlign: 'left', padding: 48 }}>
      <h2 style={{ color: '#6e8efb', fontWeight: 800, marginBottom: 18 }}>Terms of Service</h2>
      <p style={{ color: '#333', fontSize: 16, lineHeight: 1.7 }}>
        Welcome to the Service Desk App. By using this platform, you agree to the following terms:
      </p>
      <ul style={{ color: '#333', fontSize: 16, lineHeight: 1.7, marginLeft: 24, marginBottom: 24 }}>
        <li><b>Account Responsibility:</b> You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
        <li><b>Ticket Usage:</b> You may use the app to create, track, and manage support tickets. Do not submit false, abusive, or inappropriate tickets.</li>
        <li><b>Admin Rights:</b> Admins have the ability to view, manage, and assign all tickets. Admins may update ticket statuses and access analytics.</li>
        <li><b>Data Security:</b> All user data and tickets are stored securely using Firebase. We strive to protect your information but cannot guarantee absolute security.</li>
        <li><b>Prohibited Activities:</b> You may not use the app for any unlawful purpose or to harass, abuse, or harm others.</li>
        <li><b>Changes to Terms:</b> We may update these terms at any time. Continued use of the app constitutes acceptance of the new terms.</li>
      </ul>
      <p style={{ color: '#333', fontSize: 16, lineHeight: 1.7 }}>
        If you have questions about these terms, please contact support at <a href="mailto:sharmakrishna1605@gmail.com" style={{ color: '#6e8efb', textDecoration: 'underline' }}>sharmakrishna1605@gmail.com</a>.
      </p>
    </div>
  );
} 