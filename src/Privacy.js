import React from 'react';
export default function Privacy() {
  return (
    <div className="card" style={{ maxWidth: 700, margin: '60px auto', textAlign: 'left', padding: 48 }}>
      <h2 style={{ color: '#6e8efb', fontWeight: 800, marginBottom: 18 }}>Privacy Policy</h2>
      <p style={{ color: '#333', fontSize: 16, lineHeight: 1.7 }}>
        Your privacy is important to us. This policy explains how we collect, use, and protect your information on the Service Desk App:
      </p>
      <ul style={{ color: '#333', fontSize: 16, lineHeight: 1.7, marginLeft: 24, marginBottom: 24 }}>
        <li><b>Information Collected:</b> We collect your email, name, and any information you provide when creating tickets or using the app.</li>
        <li><b>Use of Data:</b> Your data is used to provide support services, manage tickets, and improve the app. We do not sell your personal information.</li>
        <li><b>Data Security:</b> All data is stored securely using Firebase. We implement measures to protect your information but cannot guarantee absolute security.</li>
        <li><b>Access & Control:</b> You can view and update your profile information at any time. To delete your account or data, contact support.</li>
        <li><b>Third-Party Services:</b> We may use third-party services (like Firebase) to operate the app. These services have their own privacy policies.</li>
        <li><b>Policy Updates:</b> We may update this policy from time to time. Continued use of the app means you accept the updated policy.</li>
      </ul>
      <p style={{ color: '#333', fontSize: 16, lineHeight: 1.7 }}>
        For questions about this policy, contact <a href="mailto:sharmakrishna1605@gmail.com" style={{ color: '#6e8efb', textDecoration: 'underline' }}>sharmakrishna1605@gmail.com</a>.
      </p>
    </div>
  );
} 