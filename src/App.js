import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import Register from './Register';
import './App.css';
import { db } from './firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { FaUserCircle, FaTicketAlt, FaCommentDots, FaPlus, FaTimes, FaBell } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Support from './Support';
import Terms from './Terms';
import Privacy from './Privacy';
import { requestFirebaseNotificationPermission, onFirebaseMessageListener } from './firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminDashboard from './AdminDashboard';
import AnalyticsBoard from './AnalyticsBoard';

export const AuthContext = createContext();
const LanguageContext = createContext();

const notificationSound = new window.Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

// Notification type icons and colors
const notifTypeMeta = {
  status: { icon: <FaTicketAlt style={{ color: '#43a047', fontSize: 18, marginRight: 8 }} />, border: '#43a047' },
  assignment: { icon: <FaUserCircle style={{ color: '#2b6777', fontSize: 18, marginRight: 8 }} />, border: '#2b6777' },
  admin: { icon: <FaBell style={{ color: '#ffd600', fontSize: 18, marginRight: 8 }} />, border: '#ffd600' }
};

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'en');
  useEffect(() => { localStorage.setItem('lang', language); }, [language]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

function useLanguage() {
  return useContext(LanguageContext);
}

function AppHeader() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ status: true, assignment: true, admin: true });
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(docSnap => {
      if (docSnap.exists()) setProfile(docSnap.data());
      else setProfile({});
    });
    // Listen for ticket status changes, assignments, or admin messages
    const q = query(collection(db, 'notifications'), where('to', '==', user.email), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Show toast for new unread notifications
      if (notifications.length > 0) {
        newNotifications.forEach(n => {
          if (!n.read && !notifications.some(old => old.id === n.id)) {
            toast.info(`${n.title}: ${n.body}`, { position: 'bottom-right', autoClose: 5000 });
            try { notificationSound.play(); } catch {}
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          }
        });
      }
      setNotifications(newNotifications);
    });
    if (!user) return;
    const prefsRef = doc(db, 'users', user.uid, 'notificationPrefs', 'prefs');
    getDoc(prefsRef).then(docSnap => {
      if (docSnap.exists()) setPrefs(docSnap.data());
    });
    return unsub;
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const handleBellClick = () => setShowDropdown(v => !v);
  const handleDropdownBlur = () => setShowDropdown(false);

  const handleLogout = () => {
    signOut(auth);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await updateDoc(doc(db, 'notifications', notification.id), { read: true });
    }
    setShowDropdown(false);
    if (notification.ticketId) {
      navigate(`/dashboard?ticket=${notification.ticketId}`);
    }
  };

  const handleClearAllNotifications = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), { read: true });
    }
    setShowDropdown(false);
  };

  const handlePrefChange = async (type) => {
    const newPrefs = { ...prefs, [type]: !prefs[type] };
    setPrefs(newPrefs);
    const prefsRef = doc(db, 'users', user.uid, 'notificationPrefs', 'prefs');
    await setDoc(prefsRef, newPrefs);
  };

  const filteredNotifications = notifications.filter(n =>
    (n.type === 'status' && prefs.status) ||
    (n.type === 'assignment' && prefs.assignment) ||
    (n.type === 'admin' && prefs.admin)
  );

  return (
    <div className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div className="app-title" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => navigate(user ? '/dashboard' : '/login')}>
        <img src="/logo.png" alt="Service Desk Logo" style={{ width: 40, height: 40, marginRight: 8, verticalAlign: 'middle' }} /> Service Desk App
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative' }}>
          <button aria-label="Notifications" onClick={handleBellClick} onBlur={handleDropdownBlur} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: 22, color: '#fff' }}>
            <FaBell />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#e57373', color: '#fff', borderRadius: '50%', fontSize: 12, fontWeight: 700, padding: '2px 6px', minWidth: 18, textAlign: 'center' }}>{unreadCount}</span>}
          </button>
          {showDropdown && filteredNotifications.length > 0 && (
            <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', color: '#222', borderRadius: 8, boxShadow: '0 4px 16px #6e8efb22', minWidth: 260, zIndex: 1000, padding: 10, maxHeight: 420, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, marginBottom: 8, color: '#2b6777' }}>
                <span>Notifications</span>
                <button onClick={handleClearAllNotifications} style={{ background: 'none', border: 'none', color: '#e57373', fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Clear All</button>
                <button onClick={() => setShowPrefs(v => !v)} style={{ background: 'none', border: 'none', color: '#2b6777', fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'underline', marginLeft: 8 }}>{showPrefs ? 'Close' : 'Preferences'}</button>
              </div>
              {showPrefs && (
                <div style={{ marginBottom: 10, padding: 10, background: '#f8fafc', borderRadius: 8, boxShadow: '0 1px 4px #6e8efb11' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Notification Preferences</div>
                  <label style={{ display: 'block', marginBottom: 6 }}><input type="checkbox" checked={prefs.status} onChange={() => handlePrefChange('status')} /> Status Changes</label>
                  <label style={{ display: 'block', marginBottom: 6 }}><input type="checkbox" checked={prefs.assignment} onChange={() => handlePrefChange('assignment')} /> Assignments</label>
                  <label style={{ display: 'block', marginBottom: 6 }}><input type="checkbox" checked={prefs.admin} onChange={() => handlePrefChange('admin')} /> Admin Messages</label>
                </div>
              )}
              {(showAllNotifications ? filteredNotifications : filteredNotifications.slice(0, 8)).map(n => (
                <div key={n.id} onClick={() => handleNotificationClick(n)} style={{ padding: '8px 0', borderBottom: '1px solid #eee', fontSize: 15, cursor: 'pointer', background: n.read ? '#f8fafc' : '#e3eafe', borderRadius: 6, marginBottom: 2, display: 'flex', alignItems: 'flex-start', borderLeft: `4px solid ${notifTypeMeta[n.type]?.border || '#c8d8e4'}` }}>
                  {notifTypeMeta[n.type]?.icon}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    <div style={{ color: '#555', fontSize: 13 }}>{n.body}</div>
                    <div style={{ color: '#aaa', fontSize: 11 }}>{n.createdAt && n.createdAt.toDate ? n.createdAt.toDate().toLocaleString() : ''}</div>
                  </div>
                </div>
              ))}
              {filteredNotifications.length > 8 && (
                <button onClick={() => setShowAllNotifications(v => !v)} style={{ background: 'none', border: 'none', color: '#2b6777', fontWeight: 700, cursor: 'pointer', fontSize: 14, textDecoration: 'underline', margin: '10px auto 0 auto', display: 'block' }}>
                  {showAllNotifications ? 'Show Less' : 'Show More'}
                </button>
              )}
              {filteredNotifications.length === 0 && <div style={{ color: '#888', fontSize: 14 }}>No notifications</div>}
            </div>
          )}
        </div>
        <div className="user-info">
          {user && (
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', textDecoration: location.pathname === '/profile' ? 'underline' : 'none' }}>
              <img src={profile.avatar || 'https://ui-avatars.com/api/?name=' + (profile.displayName || user.email) + '&background=1976d2&color=fff&size=32'} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #fff', marginRight: 6 }} />
              {profile.displayName || user.email}
            </Link>
          )}
          {user && <button style={{ width: 'auto', padding: '8px 18px', marginLeft: 8, background: '#fff', color: '#1976d2', border: '1.5px solid #1976d2', fontWeight: 600, borderRadius: 6, cursor: 'pointer' }} onClick={handleLogout}>Logout</button>}
        </div>
        <select value={language} onChange={e => setLanguage(e.target.value)} style={{ borderRadius: 6, padding: '4px 10px', fontWeight: 600, fontSize: 15, border: '1.5px solid #c8d8e4', background: '#fff', color: '#2b6777', outline: 'none', cursor: 'pointer' }}>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  let color = '#c8d8e4';
  if (status === 'In Progress') color = '#c8d8e4';
  if (status === 'Resolved') color = '#2b6777';
  return <span style={{ background: color, color: '#fff', borderRadius: 8, padding: '2px 10px', fontSize: 13, fontWeight: 500, boxShadow: '0 2px 8px ' + color + '33', marginLeft: 8, letterSpacing: 0.5 }}>{status}</span>;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState('user');
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(docSnap => {
      if (docSnap.exists()) setRole(docSnap.data().role || 'user');
      else setRole('user');
    });
  }, [user]);
  return role;
}

function exportTicketsToCSV(tickets) {
  if (!tickets.length) return;
  const replacer = (key, value) => value === null || value === undefined ? '' : value;
  const header = ['description', 'uid', 'priority', 'category', 'status', 'assignedTo', 'createdAt'];
  const csv = [
    header.join(','),
    ...tickets.map(row =>
      header.map(fieldName => {
        if (fieldName === 'createdAt' && row.createdAt && row.createdAt.toDate) {
          return '"' + row.createdAt.toDate().toLocaleString() + '"';
        }
        return '"' + (row[fieldName] ? String(row[fieldName]).replace(/"/g, '""') : '') + '"';
      }).join(',')
    )
  ].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tickets.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function exportTicketsToPDF(tickets) {
  const doc = new jsPDF();
  doc.text('Your Tickets', 14, 16);
  autoTable(doc, {
    head: [['Description', 'Priority', 'Category', 'Status', 'Assigned To', 'Created At']],
    body: tickets.map(t => [
      t.description,
      t.priority,
      t.category,
      t.status,
      t.assignedTo || '-',
      t.createdAt && t.createdAt.toLocaleString ? t.createdAt.toLocaleString() : ''
    ]),
    startY: 22
  });
  doc.save('tickets.pdf');
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const role = useUserRole();
  if (loading) return null;
  return user && role === 'admin' ? children : <Navigate to="/dashboard" />;
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    signOut(auth);
  };
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Software');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const adminEmail = 'admin@example.com';
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState({});
  const [file, setFile] = useState(null);
  const [commentFile, setCommentFile] = useState(null);
  const storage = getStorage();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const role = useUserRole();
  const [isPaying, setIsPaying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'tickets'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!description.trim()) {
      setError('Description is required.');
      toast.error('Description is required.');
      return;
    }
    let fileUrl = '';
    if (file) {
      try {
        const storageRef = ref(storage, `ticket_attachments/${user.uid}_${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        toast.success('File uploaded.');
      } catch {
        toast.error('Failed to upload file.');
        return;
      }
    }
    try {
      await addDoc(collection(db, 'tickets'), {
        uid: user.uid,
        description,
        priority,
        category,
        status: 'Open',
        createdAt: new Date(),
        attachment: fileUrl
      });
      setSuccess('Ticket submitted successfully.');
      toast.success('Ticket submitted successfully.');
      setDescription('');
      setPriority('Medium');
      setCategory('Software');
      setFile(null);
    } catch (err) {
      setError('Failed to submit ticket.');
      toast.error('Failed to submit ticket.');
    }
  };

  const handleExpand = (ticketId) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
      return;
    }
    setExpandedTicket(ticketId);
    const commentsRef = collection(db, 'tickets', ticketId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    onSnapshot(q, (snapshot) => {
      setComments(prev => ({ ...prev, [ticketId]: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
    });
  };

  const handleAddComment = async (ticketId) => {
    if (!commentInput.trim() && !commentFile) {
      toast.error('Comment or file required.');
      return;
    }
    let fileUrl = '';
    if (commentFile) {
      try {
        const storageRef = ref(storage, `comment_attachments/${user.uid}_${Date.now()}_${commentFile.name}`);
        await uploadBytes(storageRef, commentFile);
        fileUrl = await getDownloadURL(storageRef);
        toast.success('File uploaded.');
      } catch {
        toast.error('Failed to upload file.');
        return;
      }
    }
    try {
      await addDoc(collection(db, 'tickets', ticketId, 'comments'), {
        text: commentInput,
        author: user.email,
        createdAt: serverTimestamp(),
        attachment: fileUrl
      });
      setCommentInput('');
      setCommentFile(null);
      toast.success('Comment added.');
    } catch {
      toast.error('Failed to add comment.');
    }
  };

  const handlePriorityPay = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!description.trim()) {
      setError('Description is required.');
      toast.error('Description is required.');
      return;
    }
    setIsPaying(true);
    await loadRazorpayScript();
    const options = {
      key: 'rzp_test_SfyxaliFLVyZO2',
      amount: 49900, // 499 INR in paise
      currency: 'INR',
      name: 'Service Desk App',
      description: 'Priority Support Ticket',
      handler: async function (response) {
        let fileUrl = '';
        if (file) {
          try {
            const storageRef = ref(storage, `ticket_attachments/${user.uid}_${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            fileUrl = await getDownloadURL(storageRef);
            toast.success('File uploaded.');
          } catch {
            toast.error('Failed to upload file.');
            setIsPaying(false);
            return;
          }
        }
        try {
          await addDoc(collection(db, 'tickets'), {
            uid: user.uid,
            description,
            priority: 'High',
            category,
            status: 'Open',
            createdAt: new Date(),
            attachment: fileUrl,
            paid: true,
            paymentId: response.razorpay_payment_id
          });
          setSuccess('Priority ticket submitted successfully.');
          toast.success('Priority ticket submitted successfully.');
          setDescription('');
          setPriority('Medium');
          setCategory('Software');
          setFile(null);
        } catch (err) {
          setError('Failed to submit ticket.');
          toast.error('Failed to submit ticket.');
        }
        setIsPaying(false);
      },
      prefill: {
        email: user.email
      },
      theme: {
        color: '#c8d8e4'
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
    setIsPaying(false);
  };

  const filteredTickets = tickets
    .filter(ticket => {
      const matchesSearch = ticket.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus ? ticket.status === filterStatus : true;
      const matchesPriority = filterPriority ? ticket.priority === filterPriority : true;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'date_asc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'priority') {
        const order = { 'High': 1, 'Medium': 2, 'Low': 3 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  return (
    <div className="card">
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><FaTicketAlt style={{ color: '#c8d8e4', fontSize: 22 }} />Dashboard</div>
      <div>Welcome, {user && user.email}</div>
      {user && role === 'admin' && (
        <div style={{ margin: '16px 0' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{ color: '#c8d8e4', fontWeight: 500, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}
          >
            Go to Admin Dashboard
          </button>
        </div>
      )}
      <div className="ticket-list" style={{ position: 'relative' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, marginBottom: 12 }}><FaTicketAlt style={{ color: '#c8d8e4', fontSize: 18 }} />Your Tickets</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 2, minWidth: 180, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <button onClick={() => exportTicketsToCSV(filteredTickets)} style={{ padding: '8px 18px', background: '#2b6777', color: '#fff', fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer' }}>Export CSV</button>
          <button onClick={() => exportTicketsToPDF(filteredTickets)} style={{ padding: '8px 18px', background: '#c8d8e4', color: '#fff', fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer' }}>Export PDF</button>
        </div>
        {filteredTickets.length === 0 ? (
          <div className="empty-illustration">
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4e9.png" alt="No tickets" />
            <div style={{ fontSize: 20, color: '#c8d8e4', fontWeight: 600, marginBottom: 6 }}>No tickets found</div>
            <div style={{ color: '#555', fontSize: 16 }}>Start by creating your first ticket using the <b>+</b> button!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {filteredTickets.map((ticket, idx) => (
              <div key={ticket.id} style={{
                marginBottom: 0,
                padding: 20,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 18px 0 rgba(31,38,135,0.10)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                animation: 'fadeInCard 0.6s cubic-bezier(.4,0,.2,1) both',
                animationDelay: (idx * 0.08) + 's'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 17 }}>{ticket.description}</div>
                  {ticket.paid && <span className="priority-badge">PRIORITY</span>}
                  <StatusBadge status={ticket.status} />
                </div>
                <div style={{ fontSize: 14, color: '#555', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaUserCircle style={{ color: '#c8d8e4', fontSize: 16 }} />Priority: {ticket.priority} | Category: {ticket.category}
                </div>
                {ticket.attachment && (
                  <div style={{ margin: '6px 0' }}>
                    Attachment: <a href={ticket.attachment} target="_blank" rel="noopener noreferrer" style={{ color: '#c8d8e4', fontWeight: 500 }}>View File</a>
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Submitted: {ticket.createdAt && ticket.createdAt.toDate ? ticket.createdAt.toDate().toLocaleString() : ''}</div>
                <button onClick={() => handleExpand(ticket.id)} style={{ width: 'auto', marginTop: 10, background: '#f1f8e9', color: '#c8d8e4', fontWeight: 600, border: 'none', borderRadius: 6, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
                  <FaCommentDots /> {expandedTicket === ticket.id ? 'Hide Comments' : 'View/Add Comments'}
                </button>
                {expandedTicket === ticket.id && (
                  <div style={{ marginTop: 16, background: '#f8fafc', borderRadius: 8, padding: 14, boxShadow: '0 1px 4px rgba(25,118,210,0.06)' }}>
                    <div style={{ fontWeight: 600, color: '#c8d8e4', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><FaCommentDots />Comments</div>
                    <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
                      {(comments[ticket.id] || []).length === 0 ? (
                        <div style={{ color: '#888' }}>No comments yet.</div>
                      ) : (
                        (comments[ticket.id] || []).map(c => (
                          <div key={c.id} style={{ marginBottom: 10, padding: 8, background: '#fff', borderRadius: 6, boxShadow: '0 1px 2px rgba(25,118,210,0.04)' }}>
                            <div style={{ fontWeight: 500, color: '#c8d8e4', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><FaUserCircle style={{ fontSize: 14 }} />{c.author}</div>
                            <div style={{ fontSize: 14, color: '#333', margin: '4px 0' }}>{c.text}</div>
                            {c.attachment && (
                              <div style={{ margin: '4px 0' }}>
                                Attachment: <a href={c.attachment} target="_blank" rel="noopener noreferrer" style={{ color: '#c8d8e4', fontWeight: 500 }}>View File</a>
                              </div>
                            )}
                            <div style={{ fontSize: 12, color: '#888' }}>{c.createdAt && c.createdAt.toDate ? c.createdAt.toDate().toLocaleString() : ''}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddComment(ticket.id); }}
                      />
                      <input
                        type="file"
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={e => setCommentFile(e.target.files[0])}
                        style={{ width: 180 }}
                      />
                      <button type="button" onClick={() => handleAddComment(ticket.id)} style={{ width: 'auto', padding: '10px 18px', background: '#c8d8e4', color: '#fff', fontWeight: 600, borderRadius: 6, border: 'none' }}>Send</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {role !== 'admin' && (
          <button onClick={() => setShowModal(true)} title="Create Ticket" aria-label="Create Ticket"
            style={{ position: 'absolute', bottom: 24, right: 24, background: 'linear-gradient(135deg, #6e8efb 60%, #a777e3 100%)', color: '#fff', border: 'none', borderRadius: '50%', width: 56, height: 56, boxShadow: '0 4px 16px #6e8efb33', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
            <FaPlus />
          </button>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="animated-modal" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#c8d8e4', cursor: 'pointer' }}><FaTimes /></button>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, marginBottom: 12 }}><FaTicketAlt style={{ color: '#2b6777', fontSize: 18 }} />Raise a Ticket</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}>
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="Network">Network</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <textarea
              placeholder="Describe your issue or request..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', minHeight: 80, marginBottom: 12, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
            />
            <form onSubmit={handleSubmit}>
              <input type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={e => setFile(e.target.files[0])} style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 6, background: '#c8d8e4', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}>Submit Ticket (Free)</button>
                {role !== 'admin' && (
                  <button type="button" onClick={handlePriorityPay} disabled={isPaying} style={{ flex: 1, padding: 12, borderRadius: 6, background: '#2b6777', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}>Get Priority Support (₹499)</button>
                )}
              </div>
            </form>
            {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginTop: 12 }}>{success}</div>}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button onClick={() => navigate('/analytics')} style={{ background: '#a777e3', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #a777e333' }}>View Analytics &rarr;</button>
      </div>
    </div>
  );
}

function UserProfile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const storage = getStorage();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setDisplayName(userDoc.data().displayName || '');
        setAvatar(userDoc.data().avatar || '');
      } else {
        setDisplayName('');
        setAvatar('');
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    let avatarUrl = avatar;
    if (avatarFile) {
      try {
        const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}_${avatarFile.name}`);
        await uploadBytes(storageRef, avatarFile);
        avatarUrl = await getDownloadURL(storageRef);
        toast.success('Avatar uploaded.');
      } catch {
        toast.error('Failed to upload avatar.');
        setLoading(false);
        return;
      }
    }
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        avatar: avatarUrl
      });
      setAvatar(avatarUrl);
      toast.success('Profile updated.');
    } catch {
      toast.error('Failed to update profile.');
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess('');
    setPasswordError('');
    try {
      await updatePassword(user, newPassword);
      setPasswordSuccess('Password updated successfully.');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError('Failed to update password. Please re-login and try again.');
    }
    setPasswordLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 48, boxShadow: '0 8px 32px 0 rgba(106,142,251,0.13)', borderRadius: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <FaUserCircle style={{ color: '#6e8efb', fontSize: 48, marginBottom: 8 }} />
        <h2 style={{ color: '#6e8efb', fontWeight: 800, marginBottom: 6, fontSize: 32, letterSpacing: 1 }}>User Profile</h2>
      </div>
      <form onSubmit={handleSave} style={{ marginTop: 0, display: 'flex', flexDirection: 'column', gap: 22, background: 'rgba(255,255,255,0.85)', borderRadius: 18, padding: 28, boxShadow: '0 2px 12px #6e8efb11', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <img src={avatar || 'https://ui-avatars.com/api/?name=' + (displayName || user.email) + '&background=1976d2&color=fff&size=120'} alt="avatar" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #c8d8e4', boxShadow: '0 2px 12px #6e8efb22' }} />
          <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} style={{ marginTop: 8 }} />
        </div>
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          style={{ fontSize: 18, borderRadius: 8, border: '1.5px solid #c8d8e4', padding: 14, width: '100%', marginBottom: 0, background: '#f8fafc' }}
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 0', background: 'linear-gradient(90deg, #2b6777 60%, #c8d8e4 100%)', color: '#fff', fontWeight: 700, fontSize: 17, border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 8px #6e8efb22', marginTop: 8 }}>{loading ? 'Saving...' : 'Save Profile'}</button>
      </form>
      <button onClick={() => setShowChangePassword(v => !v)} style={{ marginTop: 28, background: '#c8d8e4', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', width: '100%', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #6e8efb22' }}>{showChangePassword ? 'Cancel' : 'Change Password'}</button>
      {showChangePassword && (
        <form onSubmit={handleChangePassword} style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #6e8efb11', alignItems: 'center' }}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            style={{ fontSize: 16, borderRadius: 8, border: '1.5px solid #c8d8e4', padding: 12, width: '100%' }}
          />
          <button type="submit" disabled={passwordLoading} style={{ background: 'linear-gradient(90deg, #2b6777 60%, #c8d8e4 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', width: '100%', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px #6e8efb22' }}>{passwordLoading ? 'Updating...' : 'Update Password'}</button>
          {passwordSuccess && <div style={{ color: 'green', marginTop: 8 }}>{passwordSuccess}</div>}
          {passwordError && <div style={{ color: 'red', marginTop: 8 }}>{passwordError}</div>}
        </form>
      )}
    </div>
  );
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !user) return;
    getDoc(doc(db, 'users', user.uid)).then(docSnap => {
      if (docSnap.exists()) {
        const r = docSnap.data().role || 'user';
        setRole(r);
        if (r === 'admin') navigate('/admin', { replace: true });
        else navigate('/dashboard', { replace: true });
      } else {
        setRole('user');
        navigate('/dashboard', { replace: true });
      }
    });
  }, [user, loading, navigate]);
  if (loading || !user || !role) return null;
  return null;
}

function AdminDemo() {
  return <div style={{background:'#ffd600',color:'#222',fontWeight:700,padding:'16px',textAlign:'center',borderRadius:'12px',margin:'24px 0'}}>Admin Demo Mode: This is a preview. Actions are disabled or may not affect real data.</div>;
}

function App() {
  useEffect(() => {
    async function getTokenAndListen() {
      const token = await requestFirebaseNotificationPermission();
      if (token) {
        console.log('FCM Token:', token);
      } else {
        console.log('Notification permission not granted');
      }
      onFirebaseMessageListener().then(payload => {
        alert(`Notification: ${payload.notification.title}\n${payload.notification.body}`);
      });
    }
    getTokenAndListen();
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="background-pattern"></div>
          <AppHeader />
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
          <Routes>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-demo" element={<><AdminDemo /><AdminDashboard /></>} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/support" element={<Support />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/analytics" element={<PrivateRoute><AnalyticsBoard /></PrivateRoute>} />
          </Routes>
          <div className="footer">
            <span>
              <a href="/terms" style={{ color: '#c8d8e4', textDecoration: 'underline', marginRight: 18 }}>Terms of Service</a>
              <a href="/privacy" style={{ color: '#c8d8e4', textDecoration: 'underline', marginRight: 18 }}>Privacy Policy</a>
            </span>
            Service Desk App &copy; {new Date().getFullYear()} &mdash; Built by Krishna
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
