import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { FaTicketAlt, FaUserCircle } from 'react-icons/fa';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import toast from 'react-toastify';

function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState('');
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState('admin');
  const [notifTo, setNotifTo] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');
  const [notifError, setNotifError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);


  const statusCounts = tickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
  const priorityCounts = tickets.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {});
  const statusData = [
    { name: 'Open', value: statusCounts['Open'] || 0 },
    { name: 'In Progress', value: statusCounts['In Progress'] || 0 },
    { name: 'Resolved', value: statusCounts['Resolved'] || 0 }
  ];
  const priorityData = [
    { name: 'Low', value: priorityCounts['Low'] || 0 },
    { name: 'Medium', value: priorityCounts['Medium'] || 0 },
    { name: 'High', value: priorityCounts['High'] || 0 }
  ];
  const COLORS = ['#6e8efb', '#a777e3'];

  return (
    <div className="card">
      <div style={{ background: '#ffd600', color: '#222', fontWeight: 800, fontSize: 22, textAlign: 'center', borderRadius: 12, marginBottom: 24, padding: 16, letterSpacing: 1 }}>ADMIN DASHBOARD</div>
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FaTicketAlt style={{ color: '#c8d8e4', fontSize: 22 }} />All Tickets</div>
      <div style={{ display: 'flex', gap: 24, margin: '24px 0', flexWrap: 'wrap' }}>
        <div style={{ background: '#f1f8e9', borderRadius: 10, padding: 18, minWidth: 120, flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#c8d8e4' }}>{tickets.length}</div>
          <div style={{ color: '#c8d8e4', fontWeight: 600 }}>Total Tickets</div>
        </div>
        <div style={{ background: '#fffde7', borderRadius: 10, padding: 18, minWidth: 120, flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#c8d8e4' }}>{statusCounts['In Progress'] || 0}</div>
          <div style={{ color: '#c8d8e4', fontWeight: 600 }}>In Progress</div>
        </div>
        <div style={{ background: '#e8f5e9', borderRadius: 10, padding: 18, minWidth: 120, flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2b6777' }}>{statusCounts['Resolved'] || 0}</div>
          <div style={{ color: '#2b6777', fontWeight: 600 }}>Resolved</div>
        </div>
        <div style={{ background: '#e3e9f7', borderRadius: 10, padding: 18, minWidth: 120, flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#c8d8e4' }}>{statusCounts['Open'] || 0}</div>
          <div style={{ color: '#c8d8e4', fontWeight: 600 }}>Open</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
        <div style={{ flex: 1, minWidth: 260, background: '#f8fafc', borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#c8d8e4' }}>Tickets by Status</div>
          {tickets.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No tickets to display.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {statusData.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 260, background: '#f8fafc', borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#c8d8e4' }}>Tickets by Priority</div>
          {tickets.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No tickets to display.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6e8efb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
     
    </div>
  );
}

export default AdminDashboard; 