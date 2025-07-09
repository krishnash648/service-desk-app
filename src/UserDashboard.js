import { useState, useEffect } from 'react';
import { useAuth } from './App';
import { signOut } from 'firebase/auth';
import { db } from './firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaUserCircle, FaTicketAlt, FaCommentDots, FaPlus, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function UserDashboard() {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Software');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState({});
  const [file, setFile] = useState(null);
  const [commentFile, setCommentFile] = useState(null);
  const storage = getStorage();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
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
    // Assume loadRazorpayScript is globally available or imported
    await window.loadRazorpayScript();
    const options = {
      key: 'rzp_test_SfyxaliFLVyZO2',
      amount: 49900,
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

  const exportTicketsToCSV = (tickets) => {
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
  };

  const exportTicketsToPDF = (tickets) => {
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
  };

  // Filter and sort tickets
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
                  <span style={{ background: '#c8d8e4', color: '#fff', borderRadius: 8, padding: '2px 10px', fontSize: 13, fontWeight: 500, boxShadow: '0 2px 8px #c8d8e433', marginLeft: 8, letterSpacing: 0.5 }}>{ticket.status}</span>
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
        <button onClick={() => setShowModal(true)} title="Create Ticket" aria-label="Create Ticket"
          style={{ position: 'absolute', bottom: 24, right: 24, background: 'linear-gradient(135deg, #6e8efb 60%, #a777e3 100%)', color: '#fff', border: 'none', borderRadius: '50%', width: 56, height: 56, boxShadow: '0 4px 16px #6e8efb33', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
          <FaPlus />
        </button>
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
                <button type="button" onClick={handlePriorityPay} disabled={isPaying} style={{ flex: 1, padding: 12, borderRadius: 6, background: '#2b6777', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}>Get Priority Support (₹499)</button>
              </div>
            </form>
            {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginTop: 12 }}>{success}</div>}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button onClick={() => window.location.href='/analytics'} style={{ background: '#a777e3', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #a777e333' }}>View Analytics &rarr;</button>
      </div>
    </div>
  );
}

export default UserDashboard; 