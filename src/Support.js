import React from 'react';
import { FaQuestionCircle, FaEnvelope } from 'react-icons/fa';

export default function Support() {
  const faqs = [
    {
      q: 'What is the Service Desk App?',
      a: 'The Service Desk App is a platform for users to raise, track, and manage support tickets. It features user authentication, ticket creation, admin management, and real-time updates.'
    },
    {
      q: 'How do I create a new support ticket?',
      a: 'After logging in, click the + button on your dashboard to open the ticket creation form. Fill in the details and submit.'
    },
    {
      q: 'Can I attach files to my tickets?',
      a: 'Yes, you can optionally attach files when creating a ticket to provide more context or evidence.'
    },
    {
      q: 'What can admins do?',
      a: 'Admins can view and manage all tickets, assign tickets, update statuses, and access analytics dashboards.'
    },
    {
      q: 'How is my data secured?',
      a: 'All authentication and data storage are handled securely via Firebase.'
    },
    {
      q: 'I forgot my password. What should I do?',
      a: 'Use the Forgot Password link on the login page to reset your password via email.'
    },
    {
      q: 'How do I contact support?',
      a: <>Email us at <a href="mailto:sharmakrishna1605@gmail.com?cc=user@example.com" style={{ color: '#6e8efb', textDecoration: 'underline' }}>sharmakrishna1605@gmail.com</a> and our team will assist you.</>
    }
  ];

  const renderFaq = (item, idx) => (
    <div key={idx} style={{ marginBottom: 32, textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ minWidth: 32, height: 32, borderRadius: '50%', background: '#6e8efb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17, marginTop: 2, boxShadow: '0 2px 8px #6e8efb22' }}>{idx + 1}</div>
      <div>
        <div style={{ fontWeight: 700, color: '#2b6777', fontSize: 18, marginBottom: 6 }}>{item.q}</div>
        <div style={{ color: '#333', fontSize: 16, lineHeight: 1.6 }}>{item.a}</div>
      </div>
    </div>
  );

  return (
    <div className="card" style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', padding: 48, boxShadow: '0 8px 32px 0 rgba(106,142,251,0.13)', borderRadius: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <FaQuestionCircle style={{ color: '#6e8efb', fontSize: 48, marginBottom: 8 }} />
        <h2 style={{ color: '#6e8efb', fontWeight: 800, marginBottom: 6, fontSize: 32, letterSpacing: 1 }}>Help & Support</h2>
        <div style={{ color: '#555', fontSize: 18, marginBottom: 0, maxWidth: 520 }}>
          Need assistance? Check our FAQ below or contact our support team.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 280, maxWidth: 360 }}>
          {faqs.slice(0, Math.ceil(faqs.length / 2)).map(renderFaq)}
        </div>
        <div style={{ width: 2, background: 'linear-gradient(180deg, #c8d8e4 0%, #a777e3 100%)', borderRadius: 2, alignSelf: 'stretch', opacity: 0.18, display: window.innerWidth > 700 ? 'block' : 'none' }} />
        <div style={{ flex: 1, minWidth: 280, maxWidth: 360 }}>
          {faqs.slice(Math.ceil(faqs.length / 2)).map((item, idx) => renderFaq(item, idx + Math.ceil(faqs.length / 2)))}
        </div>
      </div>
      <div style={{ marginTop: 36, color: '#6e8efb', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <FaEnvelope style={{ fontSize: 22 }} />
        <span>Still need help? <a href="mailto:sharmakrishna1605@gmail.com?cc=user@example.com" style={{ color: '#6e8efb', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
} 