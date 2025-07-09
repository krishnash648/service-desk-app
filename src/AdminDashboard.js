import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { FaTicketAlt, FaUserCircle } from 'react-icons/fa';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { toast } from 'react-toastify';

function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignUser, setAssignUser] = useState('');
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  // Analytics data
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
  const COLORS = ['#6e8efb', '#a777e3', '#21e6c1'];

  // Ticket actions
  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdating(ticketId + '-status');
    try {
      await updateDoc(doc(db, 'tickets', ticketId), { status: newStatus });
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
    setUpdating('');
  };

  const handleAssign = async (ticketId, userEmail) => {
    setUpdating(ticketId + '-assign');
    try {
      await updateDoc(doc(db, 'tickets', ticketId), { assignedTo: userEmail });
      toast.success('Ticket assigned');
    } catch {
      toast.error('Failed to assign ticket');
    }
    setUpdating('');
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t =>
    (statusFilter ? t.status === statusFilter : true) &&
    (priorityFilter ? t.priority === priorityFilter : true)
  );

  return (
    <div className="card">
      <div style={{ background: '#ffd600', color: '#222', fontWeight: 800, fontSize: 22, textAlign: 'center', borderRadius: 12, marginBottom: 24, padding: 16, letterSpacing: 1 }}>ADMIN DASHBOARD</div>
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
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FaTicketAlt style={{ color: '#c8d8e4', fontSize: 22 }} />All Tickets</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {filteredTickets.length === 0 ? (
          <div className="empty-illustration">
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4e9.png" alt="No tickets" />
            <div style={{ fontSize: 20, color: '#c8d8e4', fontWeight: 600, marginBottom: 6 }}>No tickets found</div>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket.id} style={{
              marginBottom: 0,
              padding: 20,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 18px 0 rgba(31,38,135,0.10)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{ticket.description}</div>
                <span style={{ background: '#c8d8e4', color: '#fff', borderRadius: 8, padding: '2px 10px', fontSize: 13, fontWeight: 500, boxShadow: '0 2px 8px #c8d8e433', marginLeft: 8, letterSpacing: 0.5 }}>{ticket.status}</span>
              </div>
              <div style={{ fontSize: 14, color: '#555', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUserCircle style={{ color: '#c8d8e4', fontSize: 16 }} />Priority: {ticket.priority} | Category: {ticket.category} | User: {ticket.uid}
              </div>
              {ticket.attachment && (
                <div style={{ margin: '6px 0' }}>
                  Attachment: <a href={ticket.attachment} target="_blank" rel="noopener noreferrer" style={{ color: '#c8d8e4', fontWeight: 500 }}>View File</a>
                </div>
              )}
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Submitted: {ticket.createdAt && ticket.createdAt.toDate ? ticket.createdAt.toDate().toLocaleString() : ''}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <select value={ticket.status} onChange={e => handleStatusChange(ticket.id, e.target.value)} disabled={updating === ticket.id + '-status'} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <input
                  type="text"
                  placeholder="Assign to (user email)"
                  value={ticket.assignedTo || ''}
                  onChange={e => handleAssign(ticket.id, e.target.value)}
                  disabled={updating === ticket.id + '-assign'}
                  style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15, minWidth: 180 }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 