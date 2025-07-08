import { useState, useEffect, useContext } from 'react';
import { db } from './firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { AuthContext } from './App';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

function AnalyticsBoard() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tickets'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [user]);

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
    <div className="card" style={{ maxWidth: 900, margin: '40px auto', padding: 36 }}>
      <div style={{ background: '#a777e3', color: '#fff', fontWeight: 800, fontSize: 22, textAlign: 'center', borderRadius: 12, marginBottom: 24, padding: 16, letterSpacing: 1 }}>Your Ticket Analytics</div>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
        <div style={{ flex: 1, minWidth: 260, background: '#f8fafc', borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#a777e3' }}>Tickets by Status</div>
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
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#a777e3' }}>Tickets by Priority</div>
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

export default AnalyticsBoard; 